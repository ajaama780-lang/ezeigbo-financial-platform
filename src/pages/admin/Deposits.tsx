import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft, Check, X } from "lucide-react";

interface Deposit {
  id: string;
  customer_id: string;
  amount: number;
  reference: string;
  status: string;
  created_at: string;
  profiles?: { full_name: string; phone_number: string };
}

export default function AdminDeposits() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [filterStatus, setFilterStatus] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadDeposits();
  }, [filterStatus]);

  const loadDeposits = async () => {
    try {
      let query = supabase
        .from("deposits")
        .select("*, profiles(full_name, phone_number)");

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data } = await query.order("created_at", { ascending: false });
      setDeposits(data || []);
    } catch (error: any) {
      toast.error("Failed to load deposits");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (deposit: Deposit) => {
    setProcessing(deposit.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }

      // Update deposit status
      const { error: depositError } = await supabase
        .from("deposits")
        .update({
          status: "approved",
          approved_by: session.user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", deposit.id);

      if (depositError) {
        toast.error("Failed to approve deposit");
        setProcessing(null);
        return;
      }

      // Update wallet
      const { data: wallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("customer_id", deposit.customer_id)
        .single();

      if (wallet) {
        const newBalance = wallet.available_balance + deposit.amount;

        await supabase
          .from("wallets")
          .update({
            available_balance: newBalance,
            total_deposited: wallet.total_deposited + deposit.amount,
          })
          .eq("customer_id", deposit.customer_id);

        // Record transaction
        await supabase
          .from("wallet_transactions")
          .insert({
            wallet_id: wallet.id,
            customer_id: deposit.customer_id,
            transaction_type: "deposit",
            amount: deposit.amount,
            previous_balance: wallet.available_balance,
            new_balance: newBalance,
            reference: deposit.reference,
            description: `Deposit approved`,
            status: "completed",
            related_id: deposit.id,
          });

        // Create notification
        await supabase
          .from("notifications")
          .insert({
            customer_id: deposit.customer_id,
            title: "Deposit Approved",
            message: `Your deposit of ₦${deposit.amount.toLocaleString()} has been approved!`,
            notification_type: "deposit_approved",
            related_id: deposit.id,
          });

        // Log audit
        await supabase
          .from("audit_logs")
          .insert({
            admin_id: session.user.id,
            action: "deposit_approved",
            target_customer_id: deposit.customer_id,
            target_type: "deposit",
            target_id: deposit.id,
            previous_value: { status: "pending" },
            new_value: { status: "approved", amount: deposit.amount },
            description: `Approved deposit of ₦${deposit.amount}`,
          });
      }

      toast.success("Deposit approved!");
      loadDeposits();
    } catch (error: any) {
      toast.error(error.message || "Failed to approve deposit");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (deposit: Deposit) => {
    const reason = prompt("Enter rejection reason:");
    if (!reason) return;

    setProcessing(deposit.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }

      // Update deposit status
      const { error } = await supabase
        .from("deposits")
        .update({
          status: "rejected",
          rejection_reason: reason,
          approved_by: session.user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", deposit.id);

      if (error) {
        toast.error("Failed to reject deposit");
        setProcessing(null);
        return;
      }

      // Create notification
      await supabase
        .from("notifications")
        .insert({
          customer_id: deposit.customer_id,
          title: "Deposit Rejected",
          message: `Your deposit request has been rejected. Reason: ${reason}`,
          notification_type: "deposit_rejected",
          related_id: deposit.id,
        });

      // Log audit
      await supabase
        .from("audit_logs")
        .insert({
          admin_id: session.user.id,
          action: "deposit_rejected",
          target_customer_id: deposit.customer_id,
          target_type: "deposit",
          target_id: deposit.id,
          previous_value: { status: "pending" },
          new_value: { status: "rejected", reason },
          description: `Rejected deposit of ₦${deposit.amount}`,
        });

      toast.success("Deposit rejected!");
      loadDeposits();
    } catch (error: any) {
      toast.error(error.message || "Failed to reject deposit");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const filteredDeposits = deposits.filter(d =>
    searchTerm === "" ||
    d.profiles?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.profiles?.phone_number.includes(searchTerm) ||
    d.reference.includes(searchTerm)
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
            <CardTitle className="text-white">Deposit Management</CardTitle>
            <CardDescription className="text-gray-400">Review and process customer deposits</CardDescription>
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
                variant={filterStatus === "approved" ? "default" : "outline"}
                onClick={() => setFilterStatus("approved")}
                className={filterStatus === "approved" ? "bg-green-600" : "text-white border-purple-500/20"}
              >
                Approved
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
                className={filterStatus === "all" ? "bg-blue-600" : "text-white border-purple-500/20"}
              >
                All
              </Button>
            </div>

            <Input
              type="text"
              placeholder="Search by name, phone, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800/50 border-purple-500/20 text-white placeholder:text-gray-500"
            />
          </CardContent>
        </Card>

        {filteredDeposits.length === 0 ? (
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="py-8 text-center text-gray-400">
              No deposits found
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredDeposits.map((deposit) => (
              <Card key={deposit.id} className="bg-slate-900/50 border-purple-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-white font-semibold">{deposit.profiles?.full_name}</h3>
                      <p className="text-sm text-gray-400">{deposit.profiles?.phone_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-400">₦{deposit.amount.toLocaleString()}</p>
                      <span className={`text-xs px-2 py-1 rounded inline-block mt-1 ${
                        deposit.status === "pending" ? "bg-yellow-900/30 text-yellow-400" :
                        deposit.status === "approved" ? "bg-green-900/30 text-green-400" :
                        "bg-red-900/30 text-red-400"
                      }`}>
                        {deposit.status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="text-sm text-gray-400 mb-4">
                    <p>Reference: {deposit.reference}</p>
                    <p>Date: {new Date(deposit.created_at).toLocaleString()}</p>
                  </div>

                  {deposit.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleApprove(deposit)}
                        disabled={processing === deposit.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(deposit)}
                        disabled={processing === deposit.id}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
