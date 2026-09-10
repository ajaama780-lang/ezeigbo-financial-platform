import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft, Edit2, Power } from "lucide-react";

interface Package {
  id: string;
  name: string;
  amount: number;
  duration_days: number;
  reward_rate: number;
  description: string;
  is_active: boolean;
}

export default function AdminPackages() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState<Package[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    duration_days: "",
    reward_rate: "",
    description: "",
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const { data } = await supabase
        .from("packages")
        .select("*")
        .order("amount", { ascending: true });

      setPackages(data || []);
    } catch (error: any) {
      toast.error("Failed to load packages");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pkg: Package) => {
    setEditingId(pkg.id);
    setFormData({
      name: pkg.name,
      amount: pkg.amount.toString(),
      duration_days: pkg.duration_days.toString(),
      reward_rate: pkg.reward_rate.toString(),
      description: pkg.description || "",
    });
  };

  const handleSave = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }

      const { error } = await supabase
        .from("packages")
        .update({
          amount: parseFloat(formData.amount),
          duration_days: parseInt(formData.duration_days),
          reward_rate: parseFloat(formData.reward_rate),
          description: formData.description,
        })
        .eq("id", editingId);

      if (error) {
        toast.error("Failed to update package");
        return;
      }

      // Log audit
      await supabase
        .from("audit_logs")
        .insert({
          admin_id: session.user.id,
          action: "package_updated",
          target_type: "package",
          target_id: editingId,
          previous_value: null,
          new_value: formData,
          description: `Updated package ${formData.name}`,
        });

      toast.success("Package updated!");
      setEditingId(null);
      loadPackages();
    } catch (error: any) {
      toast.error(error.message || "Failed to save package");
    }
  };

  const handleToggleActive = async (pkg: Package) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }

      const { error } = await supabase
        .from("packages")
        .update({ is_active: !pkg.is_active })
        .eq("id", pkg.id);

      if (error) {
        toast.error("Failed to update package");
        return;
      }

      // Log audit
      await supabase
        .from("audit_logs")
        .insert({
          admin_id: session.user.id,
          action: "package_toggled",
          target_type: "package",
          target_id: pkg.id,
          previous_value: { is_active: pkg.is_active },
          new_value: { is_active: !pkg.is_active },
          description: `${!pkg.is_active ? "Enabled" : "Disabled"} package ${pkg.name}`,
        });

      toast.success(`Package ${!pkg.is_active ? "enabled" : "disabled"}!`);
      loadPackages();
    } catch (error: any) {
      toast.error(error.message || "Failed to toggle package");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

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

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Package Management</h1>
          <p className="text-gray-400">Configure investment packages and reward rates</p>
        </div>

        <div className="space-y-4">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="bg-slate-900/50 border-purple-500/20">
              <CardContent className="pt-6">
                {editingId === pkg.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Package Name</label>
                        <Input
                          type="text"
                          value={formData.name}
                          disabled
                          className="bg-slate-800/50 border-purple-500/20 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Amount (₦)</label>
                        <Input
                          type="number"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          className="bg-slate-800/50 border-purple-500/20 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Duration (days)</label>
                        <Input
                          type="number"
                          value={formData.duration_days}
                          onChange={(e) => setFormData({ ...formData, duration_days: e.target.value })}
                          className="bg-slate-800/50 border-purple-500/20 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Daily Reward Rate (%)</label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.reward_rate}
                          onChange={(e) => setFormData({ ...formData, reward_rate: e.target.value })}
                          className="bg-slate-800/50 border-purple-500/20 text-white"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-gray-300 mb-2 block">Description</label>
                        <Input
                          type="text"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="bg-slate-800/50 border-purple-500/20 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSave}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Save Changes
                      </Button>
                      <Button
                        onClick={() => setEditingId(null)}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-lg">{pkg.name}</h3>
                      <p className="text-gray-400 text-sm">{pkg.description}</p>
                      <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                        <div>
                          <p className="text-gray-500">Amount</p>
                          <p className="text-amber-400 font-semibold">₦{pkg.amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Duration</p>
                          <p className="text-blue-400 font-semibold">{pkg.duration_days} days</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Daily Reward</p>
                          <p className="text-green-400 font-semibold">{pkg.reward_rate}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Status</p>
                          <p className={`font-semibold ${pkg.is_active ? "text-green-400" : "text-red-400"}`}>
                            {pkg.is_active ? "Active" : "Inactive"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(pkg)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleToggleActive(pkg)}
                        className={pkg.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                      >
                        <Power className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
