import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface PurchasePackageRequest {
  package_id: string;
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Check account status
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_status")
      .eq("id", user.id)
      .single();

    if (profile.account_status !== "active") {
      return new Response(
        JSON.stringify({ error: "Account is restricted or suspended" }),
        { status: 403, headers: corsHeaders }
      );
    }

    const { package_id }: PurchasePackageRequest = await req.json();

    // Get package
    const { data: pkg } = await supabase
      .from("packages")
      .select("*")
      .eq("id", package_id)
      .single();

    if (!pkg || !pkg.is_active) {
      return new Response(JSON.stringify({ error: "Package not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Get wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("customer_id", user.id)
      .single();

    if (!wallet) {
      return new Response(JSON.stringify({ error: "Wallet not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Check balance
    if (wallet.available_balance < pkg.amount) {
      return new Response(
        JSON.stringify({ error: "Insufficient balance" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + pkg.duration_days);

    // Create customer package
    const { data: customerPackage, error: pkgError } = await supabase
      .from("customer_packages")
      .insert({
        customer_id: user.id,
        package_id: pkg.id,
        amount: pkg.amount,
        purchase_date: new Date().toISOString(),
        expiry_date: expiryDate.toISOString(),
        status: "active",
        total_earned: 0,
      })
      .select()
      .single();

    if (pkgError) {
      return new Response(
        JSON.stringify({ error: "Failed to purchase package" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Update wallet
    const newBalance = wallet.available_balance - pkg.amount;
    await supabase
      .from("wallets")
      .update({
        available_balance: newBalance,
      })
      .eq("customer_id", user.id);

    // Create transaction record
    await supabase.from("wallet_transactions").insert({
      wallet_id: wallet.id,
      customer_id: user.id,
      transaction_type: "package_purchase",
      amount: pkg.amount,
      previous_balance: wallet.available_balance,
      new_balance: newBalance,
      reference: customerPackage.id,
      description: `Purchased ${pkg.name} package`,
      status: "completed",
      related_id: customerPackage.id,
    });

    // Create notification
    await supabase.from("notifications").insert({
      customer_id: user.id,
      title: "Package Purchased",
      message: `You have successfully purchased the ${pkg.name} package (₦${pkg.amount})`,
      notification_type: "package_purchased",
      related_id: customerPackage.id,
    });

    return new Response(
      JSON.stringify({
        message: "Package purchased successfully",
        customer_package_id: customerPackage.id,
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
