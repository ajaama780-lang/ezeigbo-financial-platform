import { supabase } from "./supabase";

export const getAvailablePackages = async () => {
  const { data } = await supabase
    .from("packages")
    .select("*")
    .eq("is_active", true)
    .order("amount", { ascending: true });

  return data || [];
};

export const getCustomerPackages = async (customerId: string) => {
  const { data } = await supabase
    .from("customer_packages")
    .select("*, packages(name, amount, reward_rate, reward_frequency)")
    .eq("customer_id", customerId)
    .order("purchase_date", { ascending: false });

  return data || [];
};

export const getActivePackages = async (customerId: string) => {
  const { data } = await supabase
    .from("customer_packages")
    .select("*, packages(name, amount, reward_rate, reward_frequency)")
    .eq("customer_id", customerId)
    .eq("status", "active")
    .order("purchase_date", { ascending: false });

  return data || [];
};

export const purchasePackage = async (customerId: string, packageId: string) => {
  // Get package details
  const { data: pkg } = await supabase
    .from("packages")
    .select("*")
    .eq("id", packageId)
    .single();

  if (!pkg) throw new Error("Package not found");
  if (!pkg.is_active) throw new Error("Package is not available");

  // Get wallet
  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("customer_id", customerId)
    .single();

  if (!wallet) throw new Error("Wallet not found");
  if (wallet.available_balance < pkg.amount) {
    throw new Error("Insufficient balance");
  }

  // Calculate expiry date
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + pkg.duration_days);

  // Create customer package record
  const { data: customerPkg, error: pkgError } = await supabase
    .from("customer_packages")
    .insert({
      customer_id: customerId,
      package_id: packageId,
      amount: pkg.amount,
      expiry_date: expiryDate.toISOString(),
      status: "active",
      total_earned: 0,
    })
    .select()
    .single();

  if (pkgError) throw pkgError;

  // Deduct from wallet
  const newBalance = wallet.available_balance - pkg.amount;
  const { error: walletError } = await supabase
    .from("wallets")
    .update({
      available_balance: newBalance,
    })
    .eq("customer_id", customerId);

  if (walletError) {
    // Rollback
    await supabase.from("customer_packages").delete().eq("id", customerPkg.id);
    throw walletError;
  }

  // Create ledger entry
  const { data: walletData } = await supabase
    .from("wallets")
    .select("id")
    .eq("customer_id", customerId)
    .single();

  if (walletData) {
    await supabase.from("wallet_transactions").insert({
      wallet_id: walletData.id,
      customer_id: customerId,
      transaction_type: "package_purchase",
      amount: pkg.amount,
      previous_balance: wallet.available_balance,
      new_balance: newBalance,
      reference: customerPkg.id,
      description: `Purchased ${pkg.name} package`,
      status: "completed",
      related_id: customerPkg.id,
    });
  }

  // Create notification
  await supabase.from("notifications").insert({
    customer_id: customerId,
    title: "Package Purchased",
    message: `You have successfully purchased the ${pkg.name} package for ₦${pkg.amount.toLocaleString()}.`,
    notification_type: "package_purchased",
    related_id: customerPkg.id,
  });

  return customerPkg;
};

export const getPackageEarnings = async (customerId: string) => {
  const { data } = await supabase
    .from("rewards")
    .select("*")
    .eq("customer_id", customerId)
    .eq("status", "credited")
    .order("reward_date", { ascending: false });

  return data || [];
};

export const getTotalEarnings = async (customerId: string) => {
  const { data } = await supabase
    .from("rewards")
    .select("amount")
    .eq("customer_id", customerId)
    .eq("status", "credited");

  return data?.reduce((sum, r) => sum + r.amount, 0) || 0;
};

export const getAllPackages = async () => {
  const { data } = await supabase
    .from("packages")
    .select("*")
    .order("amount", { ascending: true });

  return data || [];
};

export const createPackage = async (
  name: string,
  amount: number,
  durationDays: number,
  rewardRate: number,
  rewardFrequency: string,
  description: string
) => {
  const { data, error } = await supabase
    .from("packages")
    .insert({
      name,
      amount,
      duration_days: durationDays,
      reward_rate: rewardRate,
      reward_frequency: rewardFrequency,
      description,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updatePackage = async (
  packageId: string,
  updates: {
    amount?: number;
    duration_days?: number;
    reward_rate?: number;
    reward_frequency?: string;
    description?: string;
    is_active?: boolean;
  }
) => {
  const { data, error } = await supabase
    .from("packages")
    .update(updates)
    .eq("id", packageId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
