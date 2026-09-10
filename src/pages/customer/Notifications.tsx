import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export default function Notifications() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("customer_id", session.user.id)
        .order("created_at", { ascending: false });

      setNotifications(data || []);
    } catch (error: any) {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch (error: any) {
      toast.error("Failed to update notification");
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

        <h1 className="text-3xl font-bold text-white mb-8">Notifications</h1>

        {notifications.length === 0 ? (
          <Card className="bg-slate-900/50 border-purple-500/20">
            <CardContent className="py-8 text-center text-gray-400">
              No notifications yet
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <Card
                key={notif.id}
                className={`border-purple-500/20 cursor-pointer transition ${
                  notif.is_read ? "bg-slate-900/50" : "bg-purple-900/30 border-purple-400/40"
                }`}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`font-semibold ${notif.is_read ? "text-gray-300" : "text-white"}`}>
                        {notif.title}
                      </p>
                      <p className={`text-sm mt-1 ${notif.is_read ? "text-gray-500" : "text-gray-300"}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-600 mt-2">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-1 ml-4"></div>
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
