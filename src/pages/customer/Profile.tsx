import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(data);
    } catch (error: any) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="text-white hover:bg-purple-800/50 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold text-white mb-8">My Profile</h1>

        <Card className="bg-slate-900/50 border-purple-500/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-gray-400 text-sm">Full Name</p>
              <p className="text-white font-semibold">{profile?.full_name}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Phone Number</p>
              <p className="text-white font-semibold">{profile?.phone_number}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Account Status</p>
              <p className={`font-semibold ${
                profile?.account_status === "active" ? "text-green-400" : "text-red-400"
              }`}>
                {profile?.account_status.toUpperCase()}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">Change Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">New Password</label>
              <Input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-slate-800 border-purple-500/20 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Confirm Password</label>
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-slate-800 border-purple-500/20 text-white mt-1"
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
