import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ApproveDepositRequest {
  deposit_id: string;
  admin_id: string;
  approve: boolean;
  rejection_reason?: string;
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

    // Check if user is admin
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!adminProfile?.is_admin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    const { deposit_id, approve, rejection_reason }: ApproveDepositRequest =
      await req.json();

    // Get deposit
    const { data: deposit } = await supabase
      .from("deposits")
      .select("*")
      .eq("id", deposit_id)
      .single();

    if (!deposit) {
      return new Response(JSON.stringify({ error: "Deposit not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    if (deposit.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Deposit already processed" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (approve) {
      // Begin transaction
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("customer_id", deposit.customer_id)
        .single();

      const newBalance = wallet.available_balance + deposit.amount;

      // Update wallet
      await supabase
        .from("wallets")
        .update({
          available_balance: newBalance,
          total_deposited: wallet.total_deposited + deposit.amount,
        })
        .eq("customer_id", deposit.customer_id);

      // Create transaction record
      await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        customer_id: deposit.customer_id,
        transaction_type: "deposit",
        amount: deposit.amount,
        previous_balance: wallet.available_balance,
        new_balance: newBalance,
        reference: deposit.reference,
        description: "Deposit approved",
        status: "completed",
        related_id: deposit.id,
      });

      // Update deposit status
      await supabase
        .from("deposits")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", deposit_id);

      // Create notification
      await supabase.from("notifications").insert({
        customer_id: deposit.customer_id,
        title: "Deposit Approved",
        message: `Your deposit of ₦${deposit.amount} has been approved`,
        notification_type: "deposit_approved",
        related_id: deposit_id,
      });

      // Log audit
      await supabase.from("audit_logs").insert({
        admin_id: user.id,
        action: "approve_deposit",
        target_customer_id: deposit.customer_id,
        target_type: "deposit",
        target_id: deposit_id,
        description: `Approved deposit of ₦${deposit.amount}`,
        new_value: { status: "approved", amount: deposit.amount },
      });

      return new Response(
        JSON.stringify({ message: "Deposit approved successfully" }),
        { status: 200, headers: corsHeaders }
      );
    } else {
      // Reject deposit
      await supabase
        .from("deposits")
        .update({
          status: "rejected",
          rejection_reason,
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", deposit_id);

      // Create notification
      await supabase.from("notifications").insert({
        customer_id: deposit.customer_id,
        title: "Deposit Rejected",
        message: `Your deposit of ₦${deposit.amount} has been rejected${rejection_reason ? ": " + rejection_reason : ""}`,
        notification_type: "deposit_rejected",
        related_id: deposit_id,
      });

      // Log audit
      await supabase.from("audit_logs").insert({
        admin_id: user.id,
        action: "reject_deposit",
        target_customer_id: deposit.customer_id,
        target_type: "deposit",
        target_id: deposit_id,
        description: `Rejected deposit of ₦${deposit.amount}`,
        new_value: { status: "rejected", reason: rejection_reason },
      });

      return new Response(
        JSON.stringify({ message: "Deposit rejected successfully" }),
        { status: 200, headers: corsHeaders }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error: " + error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
