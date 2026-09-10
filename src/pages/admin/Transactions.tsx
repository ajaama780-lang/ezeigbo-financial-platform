import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function Transactions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    loadTransactions();
  }, [filterType, filterStatus]);

  const loadTransactions = async () => {
    try {
      let query = supabase
        .from("wallet_transactions")
        .select("*, profiles(full_name, phone_number)")
        .order("created_at", { ascending: false });

      if (filterType !== "all") {
        query = query.eq("transaction_type", filterType);
      }

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data } = await query.limit(100);
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
      case "deposit": return "text-green-400";
      case "withdrawal": return "text-orange-400";
      case "package_purchase": return "text-blue-400";
      case "reward": return "text-purple-400";
      default: return "text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/dashboard")}
          className="text-white hover:bg-purple-800/50 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold text-white mb-8">All Transactions</h1>

        <div className="flex gap-4 mb-6">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-800 border border-purple-500/20 text-white px-3 py-2 rounded"
          >
            <option value="all">All Types</option>
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="package_purchase">Package Purchase</option>
            <option value="reward">Reward</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-800 border border-purple-500/20 text-white px-3 py-2 rounded"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="space-y-2">
          {transactions.map((tx) => (
            <Card key={tx.id} className="bg-slate-900/50 border-purple-500/20">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-white font-semibold">{tx.profiles?.full_name}</p>
                    <p className="text-gray-400 text-sm">{tx.profiles?.phone_number}</p>
                    <p className={`text-sm font-semibold mt-1 ${getTypeColor(tx.transaction_type)}`}>
                      {tx.transaction_type.replace(/_/g, " ").toUpperCase()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-lg">₦{tx.amount.toLocaleString()}</p>
                    <p className="text-gray-400 text-xs">{new Date(tx.created_at).toLocaleDateString()}</p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                      tx.status === "completed" ? "bg-green-900/30 text-green-400" :
                      tx.status === "pending" ? "bg-yellow-900/30 text-yellow-400" :
                      "bg-red-900/30 text-red-400"
                    }`}>
                      {tx.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {transactions.length === 0 && (
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="py-8 text-center text-gray-400">
              No transactions found
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
