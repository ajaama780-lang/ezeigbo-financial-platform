import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft, Check, X, CheckDouble } from "lucide-react";

interface Withdrawal {
  id: string;
  customer_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  created_at: string;
  profiles?: { full_name: string; phone_number: string };
}

export default function AdminWithdrawals() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadWithdrawals();
  }, [filterStatus]);

  const loadWithdrawals = async () => {
    try {
      let query = supabase
        .from("withdrawals")
        .select("*, profiles(full_name, phone_number)");

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data } = await query.order("created_at", { ascending: false });
      setWithdrawals(data || []);
    } catch (error: any) {
      toast.error("Failed to load withdrawals");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawal: Withdrawal) => {
    setProcessing(withdrawal.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }

      const { error } = await supabase
        .from("withdrawals")
        .update({
          status: "processing",
          processed_by: session.user.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.id);

      if (error) {
        toast.error("Failed to approve withdrawal");
        setProcessing(null);
        return;
      }

      await supabase
        .from("notifications")
        .insert({
          customer_id: withdrawal.customer_id,
          title: "Withdrawal Processing",
          message: `Your withdrawal request of ₦${withdrawal.amount.toLocaleString()} is being processed.`,
          notification_type: "withdrawal_approved",
          related_id: withdrawal.id,
        });

      await supabase
        .from("audit_logs")
        .insert({
          admin_id: session.user.id,
          action: "withdrawal_approved",
          target_customer_id: withdrawal.customer_id,
          target_type: "withdrawal",
          target_id: withdrawal.id,
          previous_value: { status: "pending" },
          new_value: { status: "processing" },
          description: `Approved withdrawal of ₦${withdrawal.amount}`,
        });

      toast.success("Withdrawal approved!");
      loadWithdrawals();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve withdrawal");
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkPaid = async (withdrawal: Withdrawal) => {
    setProcessing(withdrawal.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }

      const { error } = await supabase
        .from("withdrawals")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.id);

      if (error) {
        toast.error("Failed to mark as paid");
        setProcessing(null);
        return;
      }

      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("customer_id", withdrawal.customer_id)
        .single();

      if (wallet) {
        await supabase
          .from("wallets")
          .update({
            pending_balance: Math.max(0, wallet.pending_balance - withdrawal.amount),
            total_withdrawn: wallet.total_withdrawn + withdrawal.amount,
          })
          .eq("customer_id", withdrawal.customer_id);

        await supabase
          .from("wallet_transactions")
          .insert({
            wallet_id: wallet.id,
            customer_id: withdrawal.customer_id,
            transaction_type: "withdrawal",
            amount: withdrawal.amount,
            previous_balance: wallet.available_balance,
            new_balance: wallet.available_balance,
            reference: `WD-${withdrawal.id}`,
            description: `Withdrawal paid`,
            status: "completed",
            related_id: withdrawal.id,
          });
      }

      await supabase
        .from("notifications")
        .insert({
          customer_id: withdrawal.customer_id,
          title: "Withdrawal Paid",
          message: `Your withdrawal of ₦${withdrawal.amount.toLocaleString()} has been paid!`,
          notification_type: "withdrawal_paid",
          related_id: withdrawal.id,
        });

      await supabase
        .from("audit_logs")
        .insert({
          admin_id: session.user.id,
          action: "withdrawal_paid",
          target_customer_id: withdrawal.customer_id,
          target_type: "withdrawal",
          target_id: withdrawal.id,
          previous_value: { status: "processing" },
          new_value: { status: "paid" },
          description: `Marked withdrawal of ₦${withdrawal.amount} as paid`,
        });

      toast.success("Withdrawal marked as paid!");
      loadWithdrawals();
    } catch (error: any) {
      toast.error(error.message || "Failed to mark as paid");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (withdrawal: Withdrawal) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    setProcessing(withdrawal.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }

      const { error } = await supabase
        .from("withdrawals")
        .update({
          status: "rejected",
          rejection_reason: reason,
          processed_by: session.user.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", withdrawal.id);

      if (error) {
        toast.error("Failed to reject withdrawal");
        setProcessing(null);
        return;
      }

      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("customer_id", withdrawal.customer_id)
        .single();

      if (wallet) {
        await supabase
          .from("wallets")
          .update({
            available_balance: wallet.available_balance + withdrawal.amount,
            pending_balance: Math.max(0, wallet.pending_balance - withdrawal.amount),
          })
          .eq("customer_id", withdrawal.customer_id);
      }

      await supabase
        .from("notifications")
        .insert({
          customer_id: withdrawal.customer_id,
          title: "Withdrawal Rejected",
          message: `Your withdrawal request has been rejected. Reason: ${reason}`,
          notification_type: "withdrawal_rejected",
          related_id: withdrawal.id,
        });

      await supabase
        .from("audit_logs")
        .insert({
          admin_id: session.user.id,
          action: "withdrawal_rejected",
          target_customer_id: withdrawal.customer_id,
          target_type: "withdrawal",
          target_id: withdrawal.id,
          previous_value: { status: "pending" },
          new_value: { status: "rejected", reason },
          description: `Rejected withdrawal of ₦${withdrawal.amount}`,
        });

      toast.success("Withdrawal rejected!");
      loadWithdrawals();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject withdrawal");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const filteredWithdrawals = withdrawals.filter(w =>
    searchTerm === "" ||
    w.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.profiles?.phone_number.includes(searchTerm) ||
    w.account_number.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/dashboard")}
          className="text-white hover:bg-purple-800/50 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="bg-slate-900/50 border-purple-500/20 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Withdrawal Management</CardTitle>
            <CardDescription className="text-gray-400">Process customer withdrawal requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <Button
                variant={filterStatus === "pending" ? "default" : "outline"}
                onClick={() => setFilterStatus("pending")}
                className={filterStatus === "pending" ? "bg-amber-600" : "text-white border-purple-500/20"}
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === "processing" ? "default" : "outline"}
                onClick={() => setFilterStatus("processing")}
                className={filterStatus === "processing" ? "bg-blue-600" : "text-white border-purple-500/20"}
              >
                Processing
              </Button>
              <Button
                variant={filterStatus === "paid" ? "default" : "outline"}
                onClick={() => setFilterStatus("paid")}
                className={filterStatus === "paid" ? "bg-green-600" : "text-white border-purple-500/20"}
              >
                Paid
              </Button>
              <Button
                variant={filterStatus === "rejected" ? "default" : "outline"}
                onClick={() => setFilterStatus("rejected")}
                className={filterStatus === "rejected" ? "bg-red-600" : "text-white border-purple-500/20"}
              >
                Rejected
              </Button>
              <Button
                variant={filterStatus === "all" ? "default" : "outline"}
                onClick={() => setFilterStatus("all")}
                className={filterStatus === "all" ? "bg-purple-600" : "text-white border-purple-500/20"}
              >
                All
              </Button>
            </div>

            <Input
              type="text"
              placeholder="Search by name, phone, or account number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800/50 border-purple-500/20 text-white placeholder:text-gray-500"
            />
          </CardContent>
        </Card>

        {filteredWithdrawals.length === 0 ? (
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="py-8 text-center text-gray-400">
              No withdrawals found
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredWithdrawals.map((withdrawal) => (
              <Card key={withdrawal.id} className="bg-slate-900/50 border-purple-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-white font-semibold">{withdrawal.profiles?.full_name}</h3>
                      <p className="text-sm text-gray-400">{withdrawal.profiles?.phone_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-400">₦{withdrawal.amount.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-1 rounded inline-block mt-1 ${
                        withdrawal.status === "pending" ? "bg-yellow-900/30 text-yellow-400" :
                        withdrawal.status === "processing" ? "bg-blue-900/30 text-blue-400" :
                        withdrawal.status === "paid" ? "bg-green-900/30 text-green-400" :
                        "bg-red-900/30 text-red-400"
                      }`}>
                        {withdrawal.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400 mb-4 grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-gray-500">Bank</p>
                      <p className="text-white">{withdrawal.bank_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Account</p>
                      <p className="text-white">{withdrawal.account_number}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-500">Account Name</p>
                      <p className="text-white">{withdrawal.account_name}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {withdrawal.status === "pending" && (
                      <>
                        <Button
                          onClick={() => handleApprove(withdrawal)}
                          disabled={processing === withdrawal.id}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleReject(withdrawal)}
                          disabled={processing === withdrawal.id}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </>
                    )}
                    {withdrawal.status === "processing" && (
                      <Button
                        onClick={() => handleMarkPaid(withdrawal)}
                        disabled={processing === withdrawal.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckDouble className="w-4 h-4 mr-2" />
                        Mark as Paid
                      </Button>
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
