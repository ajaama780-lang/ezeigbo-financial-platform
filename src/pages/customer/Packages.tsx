import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle } from "lucide-react";

interface Package {
  id: string;
  name: string;
  amount: number;
  duration_days: number;
  reward_rate: number;
  description: string;
  is_active: boolean;
}

export default function Packages() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<Package[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);
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

      // Check account status
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_status")
        .eq("id", session.user.id)
        .single();

      if (profile?.account_status !== "active") {
        setAccountRestricted(true);
      }

      // Load packages
      const { data: packagesData } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true);

      setPackages(packagesData || []);

      // Load wallet
      const { data: walletData } = await supabase
        .from("wallets")
        .select("*")
        .eq("customer_id", session.user.id)
        .single();

      setWallet(walletData);
    } catch (error: any) {
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (pkg: Package) => {
    if (!wallet || wallet.available_balance < pkg.amount) {
      toast.error("Insufficient balance");
      return;
    }

    setPurchasing(pkg.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + pkg.duration_days);

      // Create customer package
      const { data: customerPackage, error: cpError } = await supabase
        .from("customer_packages")
        .insert({
          customer_id: session.user.id,
          package_id: pkg.id,
          amount: pkg.amount,
          expiry_date: expiryDate.toISOString(),
          status: "active",
          total_earned: 0,
        })
        .select()
        .single();

      if (cpError) {
        toast.error("Failed to purchase package");
        setPurchasing(null);
        return;
      }

      // Deduct from wallet
      const newBalance = wallet.available_balance - pkg.amount;

      const { error: walletError } = await supabase
        .from("wallets")
        .update({
          available_balance: newBalance,
        })
        .eq("customer_id", session.user.id);

      if (walletError) {
        toast.error("Failed to update wallet");
        setPurchasing(null);
        return;
      }

      // Record transaction
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          wallet_id: wallet.id,
          customer_id: session.user.id,
          transaction_type: "package_purchase",
          amount: pkg.amount,
          previous_balance: wallet.available_balance,
          new_balance: newBalance,
          reference: `PKG-${customerPackage.id}`,
          description: `Purchased ${pkg.name} package`,
          status: "completed",
          related_id: customerPackage.id,
        });

      if (txError) {
        toast.error("Failed to record transaction");
        setPurchasing(null);
        return;
      }

      toast.success(`Successfully purchased ${pkg.name} package!`);
      setTimeout(() => {
        navigate("/dashboard");
      }, 1500);
    } catch (error: any) {
      toast.error(error.message || "Purchase failed");
      setPurchasing(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="text-white hover:bg-purple-800/50 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Investment Packages</h1>
          <p className="text-gray-400">
            Available Balance: <span className="text-amber-400 font-semibold">₦{wallet?.available_balance.toLocaleString()}</span>
          </p>
        </div>

        {accountRestricted && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-8">
            <p className="text-red-400 font-semibold">⚠️ Your account is restricted</p>
            <p className="text-red-300 text-sm">You cannot purchase packages at this time.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="bg-slate-900/50 border-purple-500/20 hover:border-amber-500/50 transition-all">
              <CardHeader>
                <CardTitle className="text-white text-2xl">{pkg.name}</CardTitle>
                <CardDescription className="text-gray-400">{pkg.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-gray-300 text-sm">Investment Amount</p>
                  <p className="text-3xl font-bold text-amber-400">₦{pkg.amount.toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-xs">Daily Reward</p>
                    <p className="text-lg font-semibold text-green-400">{pkg.reward_rate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Duration</p>
                    <p className="text-lg font-semibold text-blue-400">{pkg.duration_days} days</p>
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
                  <p className="text-blue-300 text-xs">
                    Estimated earnings: <strong>₦{(pkg.amount * pkg.reward_rate * pkg.duration_days / 100).toLocaleString()}</strong>
                  </p>
                </div>

                <Button
                  onClick={() => handlePurchase(pkg)}
                  disabled={
                    loading || 
                    purchasing === pkg.id || 
                    !wallet || 
                    wallet.available_balance < pkg.amount ||
                    accountRestricted
                  }
                  className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-semibold"
                >
                  {purchasing === pkg.id ? "Processing..." : "Purchase Now"}
                </Button>

                {wallet && wallet.available_balance < pkg.amount && (
                  <p className="text-red-400 text-xs text-center">Insufficient balance</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
