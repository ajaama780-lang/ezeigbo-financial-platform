import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function WithdrawalHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("customer_id", session.user.id)
        .order("created_at", { ascending: false });

      setWithdrawals(data || []);
    } catch (error: any) {
      toast.error("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-900/30 text-green-400";
      case "approved":
      case "processing":
        return "bg-blue-900/30 text-blue-400";
      case "pending":
        return "bg-yellow-900/30 text-yellow-400";
      case "rejected":
        return "bg-red-900/30 text-red-400";
      default:
        return "bg-gray-900/30 text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="text-white hover:bg-purple-800/50 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold text-white mb-8">Withdrawal History</h1>

        {withdrawals.length === 0 ? (
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="py-8 text-center text-gray-400">
              No withdrawals yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <Card key={withdrawal.id} className="bg-slate-900/50 border-purple-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-white font-semibold">₦{withdrawal.amount.toLocaleString()}</p>
                      <p className="text-gray-400 text-sm">{withdrawal.account_name}</p>
                      <p className="text-gray-500 text-xs">{withdrawal.account_number}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(withdrawal.status)}`}>
                      {withdrawal.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 pt-4 border-t border-purple-500/20">
                    <p>Requested: {new Date(withdrawal.created_at).toLocaleDateString()}</p>
                    {withdrawal.paid_at && (
                      <p>Paid: {new Date(withdrawal.paid_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
