import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function Withdraw() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [wallet, setWallet] = useState<any>(null);
  const [formData, setFormData] = useState({
    amount: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
    note: "",
  });

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data: walletData } = await supabase
        .from("wallets")
        .select("*")
        .eq("customer_id", session.user.id)
        .single();

      setWallet(walletData);
    } catch (error: any) {
      toast.error("Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const amount = parseFloat(formData.amount);

      if (!formData.amount || amount < 600) {
        toast.error("Minimum withdrawal is ₦600");
        setSubmitting(false);
        return;
      }

      if (!wallet || amount > wallet.available_balance) {
        toast.error("Insufficient balance");
        setSubmitting(false);
        return;
      }

      if (!formData.bankName.trim()) {
        toast.error("Bank name is required");
        setSubmitting(false);
        return;
      }

      if (!formData.accountNumber.trim()) {
        toast.error("Account number is required");
        setSubmitting(false);
        return;
      }

      if (!formData.accountName.trim()) {
        toast.error("Account name is required");
        setSubmitting(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Create withdrawal request
      const { error } = await supabase
        .from("withdrawals")
        .insert({
          customer_id: session.user.id,
          amount: amount,
          bank_name: formData.bankName,
          account_number: formData.accountNumber,
          account_name: formData.accountName,
          note: formData.note,
          status: "pending",
        });

      if (error) {
        toast.error("Failed to create withdrawal request");
        setSubmitting(false);
        return;
      }

      // Deduct from wallet (reserve the amount)
      const newBalance = wallet.available_balance - amount;

      await supabase
        .from("wallets")
        .update({
          available_balance: newBalance,
          pending_balance: wallet.pending_balance + amount,
        })
        .eq("customer_id", session.user.id);

      toast.success("Withdrawal request submitted! Admin will process shortly.");
      setFormData({
        amount: "",
        bankName: "",
        accountNumber: "",
        accountName: "",
        note: "",
      });
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Withdrawal failed");
    } finally {
      setSubmitting(false);
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
          Back to Dashboard
        </Button>

        <Card className="bg-slate-900/50 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Request Withdrawal</CardTitle>
            <CardDescription className="text-gray-400">
              Available Balance: <span className="text-amber-400 font-semibold">₦{wallet?.available_balance.toLocaleString()}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Withdrawal Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-white font-semibold">₦</span>
                  <Input
                    type="number"
                    placeholder="Enter amount (Min: ₦600)"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    min="600"
                    step="100"
                    className="bg-slate-800/50 border-purple-500/20 text-white placeholder:text-gray-500 pl-8"
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Bank Name</label>
                <Input
                  type="text"
                  placeholder="e.g., Access Bank"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="bg-slate-800/50 border-purple-500/20 text-white placeholder:text-gray-500"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Account Number</label>
                <Input
                  type="text"
                  placeholder="e.g., 1234567890"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="bg-slate-800/50 border-purple-500/20 text-white placeholder:text-gray-500"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Account Name</label>
                <Input
                  type="text"
                  placeholder="e.g., John Doe"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="bg-slate-800/50 border-purple-500/20 text-white placeholder:text-gray-500"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Note (Optional)</label>
                <Input
                  type="text"
                  placeholder="Add any additional notes"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="bg-slate-800/50 border-purple-500/20 text-white placeholder:text-gray-500"
                  disabled={submitting}
                />
              </div>

              <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-300 text-sm">
                  <strong>Processing Time:</strong> Withdrawals are manually processed. Please allow 24-48 hours for completion.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-6"
                disabled={submitting}
              >
                {submitting ? "Processing..." : "Request Withdrawal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
