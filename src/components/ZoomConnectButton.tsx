import { Video, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { ZoomConnectionRow } from "@/types/database";

export function ZoomConnectButton() {
  const { user } = useAuth();
  const [connection, setConnection] = useState<ZoomConnectionRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function fetchConnection() {
      const { data } = await supabase
        .from("zoom_connections")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      setConnection(data);
      setLoading(false);
    }

    fetchConnection();
  }, [user]);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      // Redirect to Zoom OAuth via Supabase Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dppjlzxdbsutmjcygitx.supabase.co";
      window.location.href = `${supabaseUrl}/functions/v1/zoom-connect?user_id=${user?.id}`;
    } catch {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user || !connection) return;

    await supabase
      .from("zoom_connections")
      .delete()
      .eq("user_id", user.id);

    setConnection(null);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-border">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Checking Zoom connection...</span>
      </div>
    );
  }

  if (connection) {
    return (
      <div className="flex items-center justify-between px-4 py-3 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Zoom Connected
          </span>
          <span className="text-xs text-muted-foreground">
            (ID: {connection.zoom_account_id.slice(0, 8)}...)
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          className="text-xs text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-border bg-card text-sm font-semibold text-foreground hover:bg-muted/60 hover:border-blue-300 transition-all disabled:opacity-50"
    >
      {connecting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Video className="w-4 h-4 text-blue-600" />
      )}
      {connecting ? "Connecting..." : "Connect Zoom Account"}
      {!connecting && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
    </button>
  );
}
