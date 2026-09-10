import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      if (!formData.fullName.trim()) {
        toast.error("Full name is required");
        setLoading(false);
        return;
      }

      if (!formData.phoneNumber.trim()) {
        toast.error("Phone number is required");
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        toast.error("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        setLoading(false);
        return;
      }

      // Register with Supabase Auth using phone number as username
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: `${formData.phoneNumber}@ezeigbo.local`,
        password: formData.password,
      });

      if (authError) {
        toast.error(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Registration failed");
        setLoading(false);
        return;
      }

      // Create profile
      const { error: profileError } = await supabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          phone_number: formData.phoneNumber,
          full_name: formData.fullName,
          is_customer: true,
          is_admin: false,
          account_status: "active",
        });

      if (profileError) {
        toast.error("Failed to create profile");
        setLoading(false);
        return;
      }

      // Create wallet
      const { error: walletError } = await supabase
        .from("wallets")
        .insert({
          customer_id: authData.user.id,
          available_balance: 0,
          pending_balance: 0,
          total_deposited: 0,
          total_withdrawn: 0,
          total_earned: 0,
        });

      if (walletError) {
        toast.error("Failed to create wallet");
        setLoading(false);
        return;
      }

      toast.success("Registration successful! Logging you in...");
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md bg-slate-900/50 border-purple-500/20">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-slate-950">EZ</span>
            </div>
          </div>
          <CardTitle className="text-white text-2xl">Create Account</CardTitle>
          <CardDescription className="text-gray-400">Join EZEIGBO and start investing</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300">Full Name</label>
              <Input
                type="text"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="bg-slate-800/50 border-purple-500/20 text-white placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">Phone Number</label>
              <Input
                type="tel"
                placeholder="e.g., 08012345678"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="bg-slate-800/50 border-purple-500/20 text-white placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">Password</label>
              <Input
                type="password"
                placeholder="At least 6 characters"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-slate-800/50 border-purple-500/20 text-white placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">Confirm Password</label>
              <Input
                type="password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="bg-slate-800/50 border-purple-500/20 text-white placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-semibold"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{" "}
              <Link to="/login" className="text-amber-400 hover:text-amber-300 font-semibold">
                Login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
