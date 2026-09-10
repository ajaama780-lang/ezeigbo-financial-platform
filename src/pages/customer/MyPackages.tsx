import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function MyPackages() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<any[]>([]);

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

      const { data } = await supabase
        .from("customer_packages")
        .select("*, packages(name, reward_rate, description)")
        .eq("customer_id", session.user.id)
        .order("purchase_date", { ascending: false });

      setPackages(data || []);
    } catch (error: any) {
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="text-white hover:bg-purple-800/50 mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold text-white mb-8">My Packages</h1>

        {packages.length === 0 ? (
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="py-8 text-center text-gray-400">
              No packages yet. <Button variant="link" onClick={() => navigate("/packages")} className="text-blue-400">Buy a package</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {packages.map((pkg) => (
              <Card key={pkg.id} className="bg-slate-900/50 border-purple-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-white font-semibold text-lg">{pkg.packages?.name}</h3>
                      <p className="text-gray-400 text-sm">{pkg.packages?.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-semibold ${
                      pkg.status === "active" ? "bg-green-900/30 text-green-400" :
                      pkg.status === "expired" ? "bg-gray-900/30 text-gray-400" :
                      "bg-red-900/30 text-red-400"
                    }`}>
                      {pkg.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Amount</p>
                      <p className="text-amber-400 font-semibold">₦{pkg.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total Earned</p>
                      <p className="text-green-400 font-semibold">₦{pkg.total_earned.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Daily Rate</p>
                      <p className="text-blue-400 font-semibold">{pkg.packages?.reward_rate}%</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-purple-500/20 text-xs text-gray-500">
                    <p>Purchased: {new Date(pkg.purchase_date).toLocaleDateString()}</p>
                    <p>Expires: {new Date(pkg.expiry_date).toLocaleDateString()}</p>
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
