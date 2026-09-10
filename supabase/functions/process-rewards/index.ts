import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

// This function should be called daily via a scheduled task
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get all active customer packages that haven't expired
    const now = new Date();
    const { data: activePackages } = await supabase
      .from("customer_packages")
      .select("*, packages(*), wallets(*)")
      .eq("status", "active")
      .gt("expiry_date", now.toISOString());

    if (!activePackages || activePackages.length === 0) {
      return new Response(JSON.stringify({ message: "No active packages" }), {
        status: 200,
        headers: corsHeaders,
      });
    }

    let rewardsCreated = 0;

    for (const customerPackage of activePackages) {
      const pkg = customerPackage.packages;
      const wallet = customerPackage.wallets;

      // Calculate daily reward
      const dailyReward = (customerPackage.amount * pkg.reward_rate) / 100;

      if (dailyReward <= 0) continue;

      // Create reward record
      const { data: reward, error: rewardError } = await supabase
        .from("rewards")
        .insert({
          customer_package_id: customerPackage.id,
          customer_id: customerPackage.customer_id,
          amount: dailyReward,
          reward_date: now.toISOString(),
          status: "pending",
        })
        .select()
        .single();

      if (rewardError) {
        console.error("Error creating reward:", rewardError);
        continue;
      }

      // Credit reward to wallet
      const newBalance = wallet.available_balance + dailyReward;

      await supabase
        .from("wallets")
        .update({
          available_balance: newBalance,
          total_earned: wallet.total_earned + dailyReward,
        })
        .eq("id", wallet.id);

      // Create transaction record
      await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        customer_id: customerPackage.customer_id,
        transaction_type: "reward",
        amount: dailyReward,
        previous_balance: wallet.available_balance,
        new_balance: newBalance,
        reference: reward.id,
        description: `Daily reward from ${pkg.name} package`,
        status: "completed",
        related_id: customerPackage.id,
      });

      // Update reward status
      await supabase
        .from("rewards")
        .update({ status: "credited" })
        .eq("id", reward.id);

      // Update package total earned
      await supabase
        .from("customer_packages")
        .update({
          total_earned: customerPackage.total_earned + dailyReward,
        })
        .eq("id", customerPackage.id);

      rewardsCreated++;
    }

    // Expire packages that have passed their expiry date
    const { data: expiredPackages } = await supabase
      .from("customer_packages")
      .select("id")
      .eq("status", "active")
      .lt("expiry_date", now.toISOString());

    if (expiredPackages && expiredPackages.length > 0) {
      await supabase
        .from("customer_packages")
        .update({ status: "expired" })
        .in("id", expiredPackages.map((p) => p.id));

      // Create notifications for expired packages
      for (const expiredPkg of expiredPackages) {
        const { data: pkg } = await supabase
          .from("customer_packages")
          .select("customer_id, packages(*)")
          .eq("id", expiredPkg.id)
          .single();

        await supabase.from("notifications").insert({
          customer_id: pkg.customer_id,
          title: "Package Expired",
          message: `Your ${pkg.packages.name} package has expired`,
          notification_type: "package_expired",
          related_id: expiredPkg.id,
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Rewards processed successfully",
        rewards_created: rewardsCreated,
        packages_expired: expiredPackages?.length || 0,
      }),
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error: " + error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
