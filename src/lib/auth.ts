import { supabase } from "./supabase";

export const registerCustomer = async (
  fullName: string,
  phoneNumber: string,
  password: string
) => {
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: `${phoneNumber}@ezeigbo.local`,
    password,
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error("Failed to create user");

  // Create profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    full_name: fullName,
    phone_number: phoneNumber,
    is_customer: true,
    is_admin: false,
  });

  if (profileError) throw profileError;

  // Create wallet
  const { error: walletError } = await supabase.from("wallets").insert({
    customer_id: authData.user.id,
    available_balance: 0,
    pending_balance: 0,
  });

  if (walletError) throw walletError;

  return authData.user;
};

export const loginCustomer = async (phoneNumber: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: `${phoneNumber}@ezeigbo.local`,
    password,
  });

  if (error) throw error;
  return data.user;
};

export const loginAdmin = async (phoneNumber: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: `${phoneNumber}@ezeigbo.local`,
    password,
  });

  if (error) throw error;

  // Verify admin status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", data.user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error("Not authorized as admin");
  }

  return data.user;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user || null;
};

export const getCurrentProfile = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data;
};
