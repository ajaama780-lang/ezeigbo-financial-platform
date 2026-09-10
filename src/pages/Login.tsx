import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: "",
    password: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.phoneNumber.trim()) {
        toast.error("Phone number is required");
        setLoading(false);
        return;
      }

      if (!formData.password) {
        toast.error("Password is required");
        setLoading(false);
        return;
      }

      // Login using email derived from phone number
      const { data, error } = await supabase.auth.signInWithPassword({
        email: `${formData.phoneNumber}@ezeigbo.local`,
        password: formData.password,
      });

      if (error) {
        toast.error("Invalid phone number or password");
        setLoading(false);
        return;
      }

      if (!data.user) {
        toast.error("Login failed");
        setLoading(false);
        return;
      }

      // Check account status
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_status")
        .eq("id", data.user.id)
        .single();

      if (profile?.account_status !== "active") {
        await supabase.auth.signOut();
        toast.error("Your account is restricted or suspended");
        setLoading(false);
        return;
      }

      toast.success("Login successful!");
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (error: any) {
      toast.error(error.message || "Login failed");
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
          <CardTitle className="text-white text-2xl">Welcome Back</CardTitle>
          <CardDescription className="text-gray-400">Login to your EZEIGBO account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-slate-800/50 border-purple-500/20 text-white placeholder:text-gray-500"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-semibold"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{" "}
              <Link to="/register" className="text-amber-400 hover:text-amber-300 font-semibold">
                Create one
              </Link>
            </p>
            <p className="text-gray-500 text-xs">
              <Link to="/admin-login" className="text-gray-400 hover:text-gray-300">
                Admin login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
