import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RegisterRequest {
  phone_number: string;
  full_name: string;
  password: string;
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
    const { phone_number, full_name, password }: RegisterRequest = await req
      .json();

    // Validate inputs
    if (!phone_number || !full_name || !password) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: corsHeaders }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Check if phone already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone_number", phone_number)
      .single();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ error: "Phone number already registered" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin
      .createUser({
        email: `${phone_number}@ezeigbo.local`,
        password: password,
        email_confirm: true,
        user_metadata: { phone_number, full_name },
      });

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: "Failed to create account: " + authError }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: authData.user.id,
      phone_number,
      full_name,
      is_customer: true,
      is_admin: false,
      account_status: "active",
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: "Failed to create profile" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Create wallet
    const { error: walletError } = await supabase.from("wallets").insert({
      customer_id: authData.user.id,
      available_balance: 0,
      pending_balance: 0,
      total_deposited: 0,
      total_withdrawn: 0,
      total_earned: 0,
    });

    if (walletError) {
      return new Response(
        JSON.stringify({ error: "Failed to create wallet" }),
        { status: 400, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Account created successfully",
        user_id: authData.user.id,
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
