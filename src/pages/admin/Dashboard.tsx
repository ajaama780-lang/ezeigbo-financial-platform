import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { LogOut, Users, TrendingUp, Wallet, Clock } from "lucide-react";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<any>(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalDeposits: 0,
    pendingDeposits: 0,
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
    totalPackagePurchases: 0,
    totalRewardsCreated: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }

      // Check admin status
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!profile?.is_admin) {
        navigate("/login");
        return;
      }

      setAdmin(profile);

      // Load stats
      const { count: totalCustomers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_customer", true);

      const { count: activeCustomers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_customer", true)
        .eq("account_status", "active");

      const { data: deposits } = await supabase
        .from("deposits")
        .select("amount, status");

      const { data: withdrawals } = await supabase
        .from("withdrawals")
        .select("amount, status");

      const { count: packageCount } = await supabase
        .from("customer_packages")
        .select("*", { count: "exact", head: true });

      const { data: rewards } = await supabase
        .from("rewards")
        .select("amount");

      setStats({
        totalCustomers: totalCustomers || 0,
        activeCustomers: activeCustomers || 0,
        totalDeposits: deposits?.reduce((sum, d) => sum + d.amount, 0) || 0,
        pendingDeposits: deposits?.filter(d => d.status === "pending").length || 0,
        totalWithdrawals: withdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0,
        pendingWithdrawals: withdrawals?.filter(w => w.status === "pending").length || 0,
        totalPackagePurchases: packageCount || 0,
        totalRewardsCreated: rewards?.reduce((sum, r) => sum + r.amount, 0) || 0,
      });
    } catch (error: any) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/50 border-b border-purple-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-slate-950 text-xs">EZ</span>
            </div>
            <span className="text-lg font-bold text-white">EZEIGBO Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{admin?.full_name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:bg-red-900/20">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Menu */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-8">
          <Button
            variant="outline"
            className="text-white hover:bg-purple-800/50 border-purple-500/20"
            onClick={() => navigate("/admin/customers")}
          >
            Customers
          </Button>
          <Button
            variant="outline"
            className="text-white hover:bg-purple-800/50 border-purple-500/20"
            onClick={() => navigate("/admin/deposits")}
          >
            Deposits
          </Button>
          <Button
            variant="outline"
            className="text-white hover:bg-purple-800/50 border-purple-500/20"
            onClick={() => navigate("/admin/withdrawals")}
          >
            Withdrawals
          </Button>
          <Button
            variant="outline"
            className="text-white hover:bg-purple-800/50 border-purple-500/20"
            onClick={() => navigate("/admin/packages")}
          >
            Packages
          </Button>
          <Button
            variant="outline"
            className="text-white hover:bg-purple-800/50 border-purple-500/20"
            onClick={() => navigate("/admin/transactions")}
          >
            Transactions
          </Button>
          <Button
            variant="outline"
            className="text-white hover:bg-purple-800/50 border-purple-500/20"
            onClick={() => navigate("/admin/audit-logs")}
          >
            Audit Logs
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Total Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-400">{stats.totalCustomers}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.activeCustomers} active</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Total Deposits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-400">₦{stats.totalDeposits.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.pendingDeposits} pending</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Total Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-400">₦{stats.totalWithdrawals.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.pendingWithdrawals} pending</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Total Rewards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-400">₦{stats.totalRewardsCreated.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">{stats.totalPackagePurchases} packages</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => navigate("/admin/deposits")}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-6"
          >
            Review Deposits
          </Button>
          <Button
            onClick={() => navigate("/admin/withdrawals")}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-6"
          >
            Process Withdrawals
          </Button>
          <Button
            onClick={() => navigate("/admin/customers")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-6"
          >
            Manage Customers
          </Button>
        </div>
      </div>
    </div>
  );
}
