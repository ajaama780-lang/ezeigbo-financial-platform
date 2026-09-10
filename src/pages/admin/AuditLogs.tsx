import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function AuditLogs() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const { data } = await supabase
        .from("audit_logs")
        .select("*, admin:admin_id(full_name), target_customer:target_customer_id(full_name, phone_number)")
        .order("created_at", { ascending: false })
        .limit(100);

      setLogs(data || []);
    } catch (error: any) {
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

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

        <h1 className="text-3xl font-bold text-white mb-8">Audit Logs</h1>

        <div className="space-y-2">
          {logs.map((log) => (
            <Card key={log.id} className="bg-slate-900/50 border-purple-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-white font-semibold">{log.action.replace(/_/g, " ").toUpperCase()}</p>
                    <p className="text-gray-400 text-sm">Admin: {log.admin?.full_name}</p>
                    {log.target_customer && (
                      <p className="text-gray-400 text-sm">
                        Target: {log.target_customer.full_name} ({log.target_customer.phone_number})
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-2">{log.description}</p>
                  </div>
                  <p className="text-gray-500 text-xs text-right">
                    {new Date(log.created_at).toLocaleDateString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {logs.length === 0 && (
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="py-8 text-center text-gray-400">
              No audit logs found
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
