import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ProcessWithdrawalRequest {
  withdrawal_id: string;
  admin_id: string;
  action: "approve" | "pay" | "reject";
  admin_note?: string;
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

    const {
      withdrawal_id,
      action,
      admin_note,
      rejection_reason,
    }: ProcessWithdrawalRequest = await req.json();

    // Get withdrawal
    const { data: withdrawal } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("id", withdrawal_id)
      .single();

    if (!withdrawal) {
      return new Response(
        JSON.stringify({ error: "Withdrawal not found" }),
        { status: 404, headers: corsHeaders }
      );
    }

    if (action === "approve") {
      if (withdrawal.status !== "pending") {
        return new Response(
          JSON.stringify({ error: "Withdrawal cannot be approved" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Update withdrawal status
      await supabase
        .from("withdrawals")
        .update({
          status: "approved",
          processed_by: user.id,
          processed_at: new Date().toISOString(),
          admin_note,
        })
        .eq("id", withdrawal_id);

      // Create notification
      await supabase.from("notifications").insert({
        customer_id: withdrawal.customer_id,
        title: "Withdrawal Approved",
        message: `Your withdrawal request of ₦${withdrawal.amount} has been approved and is being processed`,
        notification_type: "withdrawal_approved",
        related_id: withdrawal_id,
      });

      // Log audit
      await supabase.from("audit_logs").insert({
        admin_id: user.id,
        action: "approve_withdrawal",
        target_customer_id: withdrawal.customer_id,
        target_type: "withdrawal",
        target_id: withdrawal_id,
        description: `Approved withdrawal of ₦${withdrawal.amount}`,
        new_value: { status: "approved", amount: withdrawal.amount },
      });

      return new Response(
        JSON.stringify({ message: "Withdrawal approved successfully" }),
        { status: 200, headers: corsHeaders }
      );
    } else if (action === "pay") {
      if (withdrawal.status !== "approved") {
        return new Response(
          JSON.stringify({
            error: "Only approved withdrawals can be marked as paid",
          }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Update withdrawal status
      await supabase
        .from("withdrawals")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          admin_note,
        })
        .eq("id", withdrawal_id);

      // Create notification
      await supabase.from("notifications").insert({
        customer_id: withdrawal.customer_id,
        title: "Withdrawal Paid",
        message: `Your withdrawal of ₦${withdrawal.amount} has been successfully transferred to your bank account`,
        notification_type: "withdrawal_paid",
        related_id: withdrawal_id,
      });

      // Log audit
      await supabase.from("audit_logs").insert({
        admin_id: user.id,
        action: "pay_withdrawal",
        target_customer_id: withdrawal.customer_id,
        target_type: "withdrawal",
        target_id: withdrawal_id,
        description: `Marked withdrawal of ₦${withdrawal.amount} as paid`,
        new_value: { status: "paid", paid_at: new Date().toISOString() },
      });

      return new Response(
        JSON.stringify({ message: "Withdrawal marked as paid successfully" }),
        { status: 200, headers: corsHeaders }
      );
    } else if (action === "reject") {
      if (withdrawal.status !== "pending") {
        return new Response(
          JSON.stringify({ error: "Withdrawal cannot be rejected" }),
          { status: 400, headers: corsHeaders }
        );
      }

      // Get wallet to refund if needed
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("customer_id", withdrawal.customer_id)
        .single();

      // Refund the amount if it was deducted
      const newBalance = wallet.available_balance + withdrawal.amount;
      await supabase
        .from("wallets")
        .update({
          available_balance: newBalance,
        })
        .eq("customer_id", withdrawal.customer_id);

      // Create transaction record for refund
      await supabase.from("wallet_transactions").insert({
        wallet_id: wallet.id,
        customer_id: withdrawal.customer_id,
        transaction_type: "refund",
        amount: withdrawal.amount,
        previous_balance: wallet.available_balance,
        new_balance: newBalance,
        reference: withdrawal_id,
        description: `Withdrawal rejected - refunded`,
        status: "completed",
        related_id: withdrawal_id,
      });

      // Update withdrawal status
      await supabase
        .from("withdrawals")
        .update({
          status: "rejected",
          rejection_reason,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
          admin_note,
        })
        .eq("id", withdrawal_id);

      // Create notification
      await supabase.from("notifications").insert({
        customer_id: withdrawal.customer_id,
        title: "Withdrawal Rejected",
        message: `Your withdrawal request of ₦${withdrawal.amount} has been rejected${rejection_reason ? ": " + rejection_reason : ""}. The amount has been refunded to your wallet.`,
        notification_type: "withdrawal_rejected",
        related_id: withdrawal_id,
      });

      // Log audit
      await supabase.from("audit_logs").insert({
        admin_id: user.id,
        action: "reject_withdrawal",
        target_customer_id: withdrawal.customer_id,
        target_type: "withdrawal",
        target_id: withdrawal_id,
        description: `Rejected withdrawal of ₦${withdrawal.amount}`,
        new_value: { status: "rejected", reason: rejection_reason },
      });

      return new Response(
        JSON.stringify({ message: "Withdrawal rejected successfully" }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Internal server error: " + error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
