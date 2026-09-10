import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function TransactionHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("customer_id", session.user.id)
        .order("created_at", { ascending: false });

      setTransactions(data || []);
    } catch (error: any) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "deposit":
        return "text-green-400";
      case "withdrawal":
        return "text-orange-400";
      case "package_purchase":
        return "text-blue-400";
      case "reward":
        return "text-purple-400";
      default:
        return "text-gray-400";
    }
  };

  const getTypeLabel = (type: string) => {
    return type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
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

        <h1 className="text-3xl font-bold text-white mb-8">Transaction History</h1>

        {transactions.length === 0 ? (
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="py-8 text-center text-gray-400">
              No transactions yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <Card key={tx.id} className="bg-slate-900/50 border-purple-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{getTypeLabel(tx.transaction_type)}</p>
                      <p className="text-gray-400 text-sm">{tx.description || tx.reference}</p>
                      <p className="text-gray-500 text-xs">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <p className={`font-bold text-lg ${getTypeColor(tx.transaction_type)}`}>
                      {tx.transaction_type === "withdrawal" ? "-" : "+"}₦{Math.abs(tx.amount).toLocaleString()}
                    </p>
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
