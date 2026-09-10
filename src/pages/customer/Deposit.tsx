import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function Deposit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const depositAmount = parseFloat(amount);

      if (!amount || depositAmount < 500) {
        toast.error("Minimum deposit is ₦500");
        setLoading(false);
        return;
      }

      if (depositAmount > 5000) {
        toast.error("Maximum deposit is ₦5,000");
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Generate reference
      const reference = `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create deposit request
      const { error } = await supabase
        .from("deposits")
        .insert({
          customer_id: session.user.id,
          amount: depositAmount,
          reference: reference,
          status: "pending",
        });

      if (error) {
        toast.error("Failed to create deposit request");
        setLoading(false);
        return;
      }

      toast.success("Deposit request submitted! Admin will review shortly.");
      setAmount("");
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Deposit failed");
    } finally {
      setLoading(false);
    }
  };

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
            <CardTitle className="text-white text-2xl">Make a Deposit</CardTitle>
            <CardDescription className="text-gray-400">Add funds to your EZEIGBO wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDeposit} className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Deposit Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-white font-semibold">₦</span>
                  <Input
                    type="number"
                    placeholder="Enter amount (₦500 - ₦5,000)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="500"
                    max="5000"
                    step="100"
                    className="bg-slate-800/50 border-purple-500/20 text-white placeholder:text-gray-500 pl-8"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">Minimum: ₦500 | Maximum: ₦5,000</p>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  <strong>Note:</strong> Your deposit will be reviewed by our admin team. Once approved, the funds will be added to your wallet.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-6"
                disabled={loading}
              >
                {loading ? "Processing..." : "Submit Deposit"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
