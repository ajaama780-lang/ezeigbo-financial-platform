import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function CustomerDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [packages, setPackages] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [restricting, setRestricting] = useState(false);

  useEffect(() => {
    loadCustomerData();
  }, [id]);

  const loadCustomerData = async () => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

      setCustomer(profileData);

      const { data: walletData } = await supabase
        .from("wallets")
        .select("*")
        .eq("customer_id", id)
        .single();

      setWallet(walletData);

      const { data: packagesData } = await supabase
        .from("customer_packages")
        .select("*, packages(name, amount, reward_rate)")
        .eq("customer_id", id);

      setPackages(packagesData || []);

      const { data: transactionsData } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("customer_id", id)
        .order("created_at", { ascending: false })
        .limit(10);

      setTransactions(transactionsData || []);
    } catch (error: any) {
      toast.error("Failed to load customer data");
    } finally {
      setLoading(false);
    }
  };

  const toggleRestriction = async () => {
    if (!customer) return;

    setRestricting(true);
    try {
      const newStatus = customer.account_status === "active" ? "restricted" : "active";

      const { error } = await supabase
        .from("profiles")
        .update({ account_status: newStatus })
        .eq("id", customer.id);

      if (error) throw error;

      setCustomer({ ...customer, account_status: newStatus });
      toast.success(`Account ${newStatus === "active" ? "reactivated" : "restricted"}`);

      // Log to audit
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from("audit_logs").insert({
          admin_id: session.user.id,
          action: "account_restriction_toggle",
          target_customer_id: customer.id,
          description: `Account ${newStatus === "active" ? "reactivated" : "restricted"}`,
          new_value: { status: newStatus }
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update account status");
    } finally {
      setRestricting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!customer) {
    return <div className="flex items-center justify-center h-screen">Customer not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/customers")}
          className="text-white hover:bg-purple-800/50 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Customers
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <Card className="bg-slate-900/50 border-purple-500/20 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white">Customer Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Name</p>
                <p className="text-white font-semibold">{customer.full_name}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Phone</p>
                <p className="text-white font-semibold">{customer.phone_number}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Status</p>
                <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                  customer.account_status === "active" ? "bg-green-900/30 text-green-400" : "bg-red-900/30 text-red-400"
                }`}>
                  {customer.account_status.toUpperCase()}
                </span>
              </div>
              <Button
                onClick={toggleRestriction}
                disabled={restricting}
                className={`w-full ${
                  customer.account_status === "active"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                } text-white`}
              >
                {restricting ? "Updating..." : customer.account_status === "active" ? "Restrict Account" : "Reactivate Account"}
              </Button>
            </CardContent>
          </Card>

          {/* Wallet Card */}
          <Card className="bg-slate-900/50 border-purple-500/20 lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-white">Wallet Information</CardTitle>
            </CardHeader>
            <CardContent>
              {wallet ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Available Balance</p>
                    <p className="text-green-400 font-bold text-xl">₦{wallet.available_balance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Pending Balance</p>
                    <p className="text-yellow-400 font-bold text-xl">₦{wallet.pending_balance.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Deposited</p>
                    <p className="text-blue-400 font-bold">₦{wallet.total_deposited.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Withdrawn</p>
                    <p className="text-orange-400 font-bold">₦{wallet.total_withdrawn.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Earned</p>
                    <p className="text-purple-400 font-bold">₦{wallet.total_earned.toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">No wallet data</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Active Packages */}
        <Card className="bg-slate-900/50 border-purple-500/20 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Active Packages</CardTitle>
          </CardHeader>
          <CardContent>
            {packages.length === 0 ? (
              <p className="text-gray-400">No packages</p>
            ) : (
              <div className="space-y-2">
                {packages.map((pkg) => (
                  <div key={pkg.id} className="bg-slate-800/50 p-3 rounded border border-purple-500/10">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-white font-semibold">{pkg.packages?.name}</p>
                        <p className="text-gray-400 text-sm">₦{pkg.amount.toLocaleString()}</p>
                      </div>
                      <span className={`text-sm font-semibold ${
                        pkg.status === "active" ? "text-green-400" : "text-gray-400"
                      }`}>
                        {pkg.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="bg-slate-900/50 border-purple-500/20 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-gray-400">No transactions</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="bg-slate-800/50 p-3 rounded border border-purple-500/10 text-sm">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-300">{tx.transaction_type}</p>
                      <p className="text-white font-semibold">₦{tx.amount.toLocaleString()}</p>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
