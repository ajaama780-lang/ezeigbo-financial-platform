import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft, Calendar, TrendingUp, Zap } from "lucide-react";

interface CustomerPackage {
  id: string;
  package_id: string;
  amount: number;
  status: "active" | "expired" | "cancelled";
  purchase_date: string;
  expiry_date: string;
  total_earned: number;
  packages: {
    name: string;
    reward_rate: number;
    description: string;
  };
}

export default function MyPackages() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<CustomerPackage[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "expired" | "cancelled">("all");

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      let query = supabase
        .from("customer_packages")
        .select("*, packages(name, reward_rate, description)")
        .eq("customer_id", session.user.id);

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query.order("purchase_date", { ascending: false });

      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-900/30 text-green-400 border-green-500/20";
      case "expired":
        return "bg-gray-900/30 text-gray-400 border-gray-500/20";
      case "cancelled":
        return "bg-red-900/30 text-red-400 border-red-500/20";
      default:
        return "bg-purple-900/30 text-purple-400 border-purple-500/20";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading packages...</p>
        </div>
      </div>
    );
  }

  const activePackages = packages.filter(p => p.status === "active");
  const expiredPackages = packages.filter(p => p.status === "expired");
  const totalEarned = packages.reduce((sum, p) => sum + p.total_earned, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="text-white hover:bg-purple-800/50 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">My Packages</h1>
          <p className="text-gray-400">Track your active and expired packages</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Packages</p>
                  <p className="text-2xl font-bold text-green-400">{activePackages.length}</p>
                </div>
                <Zap className="w-8 h-8 text-green-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Earned</p>
                  <p className="text-2xl font-bold text-amber-400">₦{totalEarned.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-amber-400/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Expired Packages</p>
                  <p className="text-2xl font-bold text-gray-400">{expiredPackages.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-gray-400/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "active", "expired", "cancelled"] as const).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              onClick={() => {
                setFilterStatus(status);
                setLoading(true);
              }}
              className={`${
                filterStatus === status
                  ? "bg-amber-500 text-slate-950 hover:bg-amber-600"
                  : "text-white hover:bg-purple-800/50 border-purple-500/20"
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>

        {packages.length === 0 ? (
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="py-12 text-center">
              <p className="text-gray-400 mb-4">No packages yet</p>
              <Button onClick={() => navigate("/packages")} className="bg-amber-500 hover:bg-amber-600 text-slate-950">
                Buy a Package
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {packages.map((pkg) => {
              const daysRemaining = getDaysRemaining(pkg.expiry_date);
              return (
                <Card key={pkg.id} className={`border-2 transition-all hover:border-amber-500/50 ${getStatusColor(pkg.status)}`}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-lg">{pkg.packages?.name}</h3>
                        <p className="text-gray-400 text-sm">{pkg.packages?.description}</p>
                      </div>
                      <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(pkg.status)} border`}>
                        {pkg.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Amount</p>
                        <p className="text-amber-400 font-semibold">₦{pkg.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Total Earned</p>
                        <p className="text-green-400 font-semibold">₦{pkg.total_earned.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Daily Rate</p>
                        <p className="text-blue-400 font-semibold">{pkg.packages?.reward_rate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Days Remaining</p>
                        <p className={`font-semibold ${daysRemaining > 0 ? "text-green-400" : "text-red-400"}`}>
                          {daysRemaining > 0 ? daysRemaining : "Expired"}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-purple-500/20 text-xs text-gray-500 grid grid-cols-2 gap-2">
                      <p>Purchased: {new Date(pkg.purchase_date).toLocaleDateString()}</p>
                      <p>Expires: {new Date(pkg.expiry_date).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
