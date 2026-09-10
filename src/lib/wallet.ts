import { supabase } from "./supabase";

export const getWallet = async (customerId: string) => {
  const { data } = await supabase
    .from("wallets")
    .select("*")
    .eq("customer_id", customerId)
    .single();

  return data;
};

export const submitDeposit = async (customerId: string, amount: number) => {
  if (amount < 500 || amount > 5000) {
    throw new Error("Deposit must be between ₦500 and ₦5,000");
  }

  const reference = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const { data, error } = await supabase.from("deposits").insert({
    customer_id: customerId,
    amount,
    reference,
    status: "pending",
  }).select().single();

  if (error) throw error;

  // Create notification
  await supabase.from("notifications").insert({
    customer_id: customerId,
    title: "Deposit Submitted",
    message: `Your deposit of ₦${amount.toLocaleString()} has been submitted for review.`,
    notification_type: "deposit_submitted",
    related_id: data.id,
  });

  return data;
};

export const submitWithdrawal = async (
  customerId: string,
  amount: number,
  bankName: string,
  accountNumber: string,
  accountName: string,
  note?: string
) => {
  if (amount < 600) {
    throw new Error("Minimum withdrawal is ₦600");
  }

  // Check available balance
  const wallet = await getWallet(customerId);
  if (!wallet || wallet.available_balance < amount) {
    throw new Error("Insufficient balance");
  }

  // Create withdrawal request
  const { data: withdrawal, error: withdrawalError } = await supabase
    .from("withdrawals")
    .insert({
      customer_id: customerId,
      amount,
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      note,
      status: "pending",
    })
    .select()
    .single();

  if (withdrawalError) throw withdrawalError;

  // Deduct from available balance and add to pending
  const { error: walletError } = await supabase
    .from("wallets")
    .update({
      available_balance: wallet.available_balance - amount,
      pending_balance: wallet.pending_balance + amount,
    })
    .eq("customer_id", customerId);

  if (walletError) {
    // Rollback withdrawal
    await supabase.from("withdrawals").delete().eq("id", withdrawal.id);
    throw walletError;
  }

  // Create ledger entry
  await supabase.from("wallet_transactions").insert({
    wallet_id: wallet.id,
    customer_id: customerId,
    transaction_type: "withdrawal",
    amount,
    previous_balance: wallet.available_balance,
    new_balance: wallet.available_balance - amount,
    reference: withdrawal.id,
    description: `Withdrawal to ${accountName}`,
    status: "pending",
    related_id: withdrawal.id,
  });

  // Create notification
  await supabase.from("notifications").insert({
    customer_id: customerId,
    title: "Withdrawal Submitted",
    message: `Your withdrawal request of ₦${amount.toLocaleString()} has been submitted.`,
    notification_type: "withdrawal_submitted",
    related_id: withdrawal.id,
  });

  return withdrawal;
};

export const getTransactionHistory = async (customerId: string, limit = 50) => {
  const { data } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
};

export const getWithdrawalHistory = async (customerId: string, limit = 50) => {
  const { data } = await supabase
    .from("withdrawals")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
};
