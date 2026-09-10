import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft, Lock, Unlock } from "lucide-react";

interface Customer {
  id: string;
  full_name: string;
  phone_number: string;
  account_status: string;
  created_at: string;
}

export default function AdminCustomers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_customer", true)
        .order("created_at", { ascending: false });

      setCustomers(data || []);
    } catch (error: any) {
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  const handleRestrict = async (customer: Customer) => {
    setProcessing(customer.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ account_status: "restricted" })
        .eq("id", customer.id);

      if (error) {
        toast.error("Failed to restrict account");
        setProcessing(null);
        return;
      }

      // Create notification
      await supabase
        .from("notifications")
        .insert({
          customer_id: customer.id,
          title: "Account Restricted",
          message: "Your account has been restricted. Please contact support.",
          notification_type: "account_restricted",
          related_id: customer.id,
        });

      // Log audit
      await supabase
        .from("audit_logs")
        .insert({
          admin_id: session.user.id,
          action: "customer_restricted",
          target_customer_id: customer.id,
          target_type: "customer",
          target_id: customer.id,
          previous_value: { account_status: customer.account_status },
          new_value: { account_status: "restricted" },
          description: `Restricted account for ${customer.full_name}`,
        });

      toast.success("Account restricted!");
      loadCustomers();
    } catch (error: any) {
      toast.error(error.message || "Failed to restrict account");
    } finally {
      setProcessing(null);
    }
  };

  const handleRestore = async (customer: Customer) => {
    setProcessing(customer.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({ account_status: "active" })
        .eq("id", customer.id);

      if (error) {
        toast.error("Failed to restore account");
        setProcessing(null);
        return;
      }

      // Create notification
      await supabase
        .from("notifications")
        .insert({
          customer_id: customer.id,
          title: "Account Restored",
          message: "Your account has been restored. You can now make transactions.",
          notification_type: "account_restored",
          related_id: customer.id,
        });

      // Log audit
      await supabase
        .from("audit_logs")
        .insert({
          admin_id: session.user.id,
          action: "customer_restored",
          target_customer_id: customer.id,
          target_type: "customer",
          target_id: customer.id,
          previous_value: { account_status: customer.account_status },
          new_value: { account_status: "active" },
          description: `Restored account for ${customer.full_name}`,
        });

      toast.success("Account restored!");
      loadCustomers();
    } catch (error: any) {
      toast.error(error.message || "Failed to restore account");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const filteredCustomers = customers.filter(c =>
    searchTerm === "" ||
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone_number.includes(searchTerm)
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
            <CardTitle className="text-white">Customer Management</CardTitle>
            <CardDescription className="text-gray-400">
              Total Customers: {customers.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="text"
              placeholder="Search by name or phone number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-800/50 border-purple-500/20 text-white placeholder:text-gray-500"
            />
          </CardContent>
        </Card>

        {filteredCustomers.length === 0 ? (
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="py-8 text-center text-gray-400">
              No customers found
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id} className="bg-slate-900/50 border-purple-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold">{customer.full_name}</h3>
                      <p className="text-gray-400 text-sm">{customer.phone_number}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        Joined: {new Date(customer.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm px-3 py-1 rounded ${
                        customer.account_status === "active"
                          ? "bg-green-900/30 text-green-400"
                          : customer.account_status === "restricted"
                          ? "bg-red-900/30 text-red-400"
                          : "bg-yellow-900/30 text-yellow-400"
                      }`}>
                        {customer.account_status.toUpperCase()}
                      </span>
                      {customer.account_status === "active" ? (
                        <Button
                          onClick={() => handleRestrict(customer)}
                          disabled={processing === customer.id}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <Lock className="w-4 h-4 mr-2" />
                          Restrict
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleRestore(customer)}
                          disabled={processing === customer.id}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Unlock className="w-4 h-4 mr-2" />
                          Restore
                        </Button>
                      )}
                    </div>
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
