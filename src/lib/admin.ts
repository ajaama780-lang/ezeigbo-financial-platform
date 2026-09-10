import { supabase } from "./supabase";

export const approveDeposit = async (depositId: string, adminId: string) => {
  const { data: deposit } = await supabase
    .from("deposits")
    .select("*")
    .eq("id", depositId)
    .single();

  if (!deposit) throw new Error("Deposit not found");
  if (deposit.status !== "pending") throw new Error("Deposit is not pending");

  // Update deposit status
  const { error: depositError } = await supabase
    .from("deposits")
    .update({
      status: "approved",
      approved_by: adminId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", depositId);

  if (depositError) throw depositError;

  // Get customer wallet
  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("customer_id", deposit.customer_id)
    .single();

  if (!wallet) throw new Error("Wallet not found");

  // Add funds to wallet
  const newBalance = wallet.available_balance + deposit.amount;
  const { error: walletError } = await supabase
    .from("wallets")
    .update({
      available_balance: newBalance,
      total_deposited: wallet.total_deposited + deposit.amount,
    })
    .eq("customer_id", deposit.customer_id);

  if (walletError) throw walletError;

  // Create ledger entry
  await supabase.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    customer_id: deposit.customer_id,
    transaction_type: "deposit",
    amount: deposit.amount,
    previous_balance: wallet.available_balance,
    new_balance: newBalance,
    reference: deposit.reference,
    description: `Deposit approved`,
    status: "completed",
    related_id: depositId,
  });

  // Create notification
  await supabase.from("notifications").insert({
    customer_id: deposit.customer_id,
    title: "Deposit Approved",
    message: `Your deposit of ₦${deposit.amount.toLocaleString()} has been approved!`,
    notification_type: "deposit_approved",
    related_id: depositId,
  });

  // Log audit
  await supabase.from("audit_logs").insert({
    admin_id: adminId,
    action: "deposit_approved",
    target_customer_id: deposit.customer_id,
    description: `Approved deposit of ₦${deposit.amount.toLocaleString()}`,
    new_value: { status: "approved", amount: deposit.amount },
  });
};

export const rejectDeposit = async (
  depositId: string,
  adminId: string,
  reason: string
) => {
  const { data: deposit } = await supabase
    .from("deposits")
    .select("*")
    .eq("id", depositId)
    .single();

  if (!deposit) throw new Error("Deposit not found");

  const { error } = await supabase
    .from("deposits")
    .update({
      status: "rejected",
      rejection_reason: reason,
      approved_by: adminId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", depositId);

  if (error) throw error;

  // Create notification
  await supabase.from("notifications").insert({
    customer_id: deposit.customer_id,
    title: "Deposit Rejected",
    message: `Your deposit of ₦${deposit.amount.toLocaleString()} has been rejected. Reason: ${reason}`,
    notification_type: "deposit_rejected",
    related_id: depositId,
  });

  // Log audit
  await supabase.from("audit_logs").insert({
    admin_id: adminId,
    action: "deposit_rejected",
    target_customer_id: deposit.customer_id,
    description: `Rejected deposit of ₦${deposit.amount.toLocaleString()}. Reason: ${reason}`,
    new_value: { status: "rejected", reason },
  });
};

export const approveWithdrawal = async (withdrawalId: string, adminId: string) => {
  const { data: withdrawal } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("id", withdrawalId)
    .single();

  if (!withdrawal) throw new Error("Withdrawal not found");

  const { error } = await supabase
    .from("withdrawals")
    .update({
      status: "approved",
      processed_by: adminId,
      processed_at: new Date().toISOString(),
    })
    .eq("id", withdrawalId);

  if (error) throw error;

  // Create notification
  await supabase.from("notifications").insert({
    customer_id: withdrawal.customer_id,
    title: "Withdrawal Approved",
    message: `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} has been approved and is being processed.`,
    notification_type: "withdrawal_approved",
    related_id: withdrawalId,
  });

  // Log audit
  await supabase.from("audit_logs").insert({
    admin_id: adminId,
    action: "withdrawal_approved",
    target_customer_id: withdrawal.customer_id,
    description: `Approved withdrawal of ₦${withdrawal.amount.toLocaleString()}`,
    new_value: { status: "approved" },
  });
};

export const markWithdrawalAsPaid = async (
  withdrawalId: string,
  adminId: string,
  adminNote?: string
) => {
  const { data: withdrawal } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("id", withdrawalId)
    .single();

  if (!withdrawal) throw new Error("Withdrawal not found");

  // Get wallet
  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("customer_id", withdrawal.customer_id)
    .single();

  if (!wallet) throw new Error("Wallet not found");

  // Update withdrawal
  const { error: withdrawalError } = await supabase
    .from("withdrawals")
    .update({
      status: "paid",
      processed_by: adminId,
      paid_at: new Date().toISOString(),
      admin_note: adminNote,
    })
    .eq("id", withdrawalId);

  if (withdrawalError) throw withdrawalError;

  // Update wallet
  const { error: walletError } = await supabase
    .from("wallets")
    .update({
      pending_balance: wallet.pending_balance - withdrawal.amount,
      total_withdrawn: wallet.total_withdrawn + withdrawal.amount,
    })
    .eq("customer_id", withdrawal.customer_id);

  if (walletError) throw walletError;

  // Create notification
  await supabase.from("notifications").insert({
    customer_id: withdrawal.customer_id,
    title: "Withdrawal Paid",
    message: `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} has been paid to your bank account.`,
    notification_type: "withdrawal_paid",
    related_id: withdrawalId,
  });

  // Log audit
  await supabase.from("audit_logs").insert({
    admin_id: adminId,
    action: "withdrawal_paid",
    target_customer_id: withdrawal.customer_id,
    description: `Marked withdrawal of ₦${withdrawal.amount.toLocaleString()} as paid`,
    new_value: { status: "paid" },
  });
};

export const rejectWithdrawal = async (
  withdrawalId: string,
  adminId: string,
  reason: string
) => {
  const { data: withdrawal } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("id", withdrawalId)
    .single();

  if (!withdrawal) throw new Error("Withdrawal not found");

  // Get wallet
  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("customer_id", withdrawal.customer_id)
    .single();

  if (!wallet) throw new Error("Wallet not found");

  // Update withdrawal
  const { error: withdrawalError } = await supabase
    .from("withdrawals")
    .update({
      status: "rejected",
      rejection_reason: reason,
      processed_by: adminId,
      processed_at: new Date().toISOString(),
    })
    .eq("id", withdrawalId);

  if (withdrawalError) throw withdrawalError;

  // Refund to available balance
  const { error: walletError } = await supabase
    .from("wallets")
    .update({
      available_balance: wallet.available_balance + withdrawal.amount,
      pending_balance: wallet.pending_balance - withdrawal.amount,
    })
    .eq("customer_id", withdrawal.customer_id);

  if (walletError) throw walletError;

  // Create notification
  await supabase.from("notifications").insert({
    customer_id: withdrawal.customer_id,
    title: "Withdrawal Rejected",
    message: `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} has been rejected. Reason: ${reason}`,
    notification_type: "withdrawal_rejected",
    related_id: withdrawalId,
  });

  // Log audit
  await supabase.from("audit_logs").insert({
    admin_id: adminId,
    action: "withdrawal_rejected",
    target_customer_id: withdrawal.customer_id,
    description: `Rejected withdrawal of ₦${withdrawal.amount.toLocaleString()}. Reason: ${reason}`,
    new_value: { status: "rejected", reason },
  });
};

export const getPendingDeposits = async () => {
  const { data } = await supabase
    .from("deposits")
    .select("*, profiles(full_name, phone_number)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return data || [];
};

export const getPendingWithdrawals = async () => {
  const { data } = await supabase
    .from("withdrawals")
    .select("*, profiles(full_name, phone_number)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return data || [];
};

export const getAllCustomers = async () => {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_customer", true)
    .order("created_at", { ascending: false });

  return data || [];
};

export const searchCustomers = async (query: string) => {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_customer", true)
    .or(`full_name.ilike.%${query}%,phone_number.ilike.%${query}%`)
    .order("created_at", { ascending: false });

  return data || [];
};
