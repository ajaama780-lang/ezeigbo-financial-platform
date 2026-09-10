import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { LogOut, Wallet, TrendingUp, PiggyBank, Clock } from "lucide-react";

interface WalletData {
  available_balance: number;
  pending_balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_earned: number;
}

interface Package {
  id: string;
  name: string;
  amount: number;
  status: string;
  expiry_date: string;
  total_earned: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [packages, setPackages] = useState<Package[]>([]);
  const [accountRestricted, setAccountRestricted] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Load profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setProfile(profileData);

      if (profileData?.account_status !== "active") {
        setAccountRestricted(true);
      }

      // Load wallet
      const { data: walletData } = await supabase
        .from("wallets")
        .select("*")
        .eq("customer_id", session.user.id)
        .single();

      setWallet(walletData);

      // Load active packages
      const { data: packagesData } = await supabase
        .from("customer_packages")
        .select(`
          id,
          package_id,
          amount,
          status,
          expiry_date,
          total_earned,
          packages (name)
        `)
        .eq("customer_id", session.user.id)
        .eq("status", "active");

      setPackages(packagesData?.map((p: any) => ({
        id: p.id,
        name: p.packages.name,
        amount: p.amount,
        status: p.status,
        expiry_date: p.expiry_date,
        total_earned: p.total_earned,
      })) || []);
    } catch (error: any) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
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
            <span className="text-lg font-bold text-white">EZEIGBO</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">{profile?.full_name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-400 hover:bg-red-900/20">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button
            variant="outline"
            className="text-white hover:bg-purple-800/50 border-purple-500/20"
            onClick={() => navigate("/wallet")}
          >
            Wallet
          </Button>
          <Button
            variant="outline"
            className="text-white hover:bg-purple-800/50 border-purple-500/20"
            onClick={() => navigate("/deposit")}
          >
            Deposit
          </Button>
          <Button
            variant="outline"
            className="text-white hover:bg-purple-800/50 border-purple-500/20"
            onClick={() => navigate("/packages")}
          >
            Packages
          </Button>
          <Button
            variant="outline"
            className="text-white hover:bg-purple-800/50 border-purple-500/20"
            onClick={() => navigate("/withdraw")}
          >
            Withdraw
          </Button>
        </div>

        {/* Account Status Alert */}
        {accountRestricted && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-8">
            <p className="text-red-400 font-semibold">⚠️ Your account is restricted</p>
            <p className="text-red-300 text-sm mt-1">You cannot make new purchases or withdrawals. Contact support.</p>
          </div>
        )}

        {/* Wallet Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Available
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-400">₦{wallet?.available_balance.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Deposited
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-400">₦{wallet?.total_deposited.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <PiggyBank className="w-4 h-4" />
                Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-400">₦{wallet?.total_earned.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Withdrawn</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-400">₦{wallet?.total_withdrawn.toLocaleString()}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-yellow-400">₦{wallet?.pending_balance.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Packages */}
        <Card className="bg-slate-900/50 border-purple-500/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Active Packages</CardTitle>
            <CardDescription className="text-gray-400">Your current investments</CardDescription>
          </CardHeader>
          <CardContent>
            {packages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">No active packages</p>
                <Button
                  onClick={() => navigate("/packages")}
                  className="bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-semibold"
                >
                  Browse Packages
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="bg-slate-800/50 rounded-lg p-4 border border-purple-500/10">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold">{pkg.name}</h3>
                      <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded">Active</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Amount</p>
                        <p className="text-white font-semibold">₦{pkg.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Earned</p>
                        <p className="text-amber-400 font-semibold">₦{pkg.total_earned.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Expires</p>
                        <p className="text-blue-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(pkg.expiry_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => navigate("/deposit")}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-6"
            disabled={accountRestricted}
          >
            Make Deposit
          </Button>
          <Button
            onClick={() => navigate("/packages")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-6"
            disabled={accountRestricted}
          >
            Buy Package
          </Button>
          <Button
            onClick={() => navigate("/withdraw")}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-6"
          >
            Withdraw
          </Button>
        </div>
      </div>
    </div>
  );
}
