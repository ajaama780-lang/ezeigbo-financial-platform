import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function Earnings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [rewards, setRewards] = useState<any[]>([]);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data: rewardsData } = await supabase
        .from("rewards")
        .select("*, customer_packages(packages(name))")
        .eq("customer_id", session.user.id)
        .eq("status", "credited")
        .order("reward_date", { ascending: false });

      setRewards(rewardsData || []);
      const total = rewardsData?.reduce((sum, r) => sum + r.amount, 0) || 0;
      setTotalEarnings(total);
    } catch (error: any) {
      toast.error("Failed to load earnings");
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
          Back
        </Button>

        <h1 className="text-3xl font-bold text-white mb-8">Earnings & Rewards</h1>

        <Card className="bg-slate-900/50 border-purple-500/20 mb-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-400 mb-2">Total Earnings</p>
              <p className="text-5xl font-bold text-green-400">₦{totalEarnings.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <h2 className="text-xl font-bold text-white mb-4">Reward History</h2>

        {rewards.length === 0 ? (
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="py-8 text-center text-gray-400">
              No rewards yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {rewards.map((reward) => (
              <Card key={reward.id} className="bg-slate-900/50 border-purple-500/20">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{reward.customer_packages?.packages?.name}</p>
                      <p className="text-gray-400 text-sm">{new Date(reward.reward_date).toLocaleDateString()}</p>
                    </div>
                    <p className="text-green-400 font-bold text-lg">+₦{reward.amount.toLocaleString()}</p>
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
