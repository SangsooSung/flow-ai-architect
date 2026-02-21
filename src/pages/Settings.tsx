import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Video, Calendar, Bell, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { ZoomConnectButton } from "@/components/ZoomConnectButton";
import type { CalendarConnectionRow, NotificationPreferencesRow } from "@/types/database";
import { toast } from "sonner";

export default function Settings() {
  const { user } = useAuth();
  const [calendarConnection, setCalendarConnection] = useState<CalendarConnectionRow | null>(null);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferencesRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectingCalendar, setConnectingCalendar] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function fetchSettings() {
      const [calRes, notifRes] = await Promise.all([
        supabase
          .from("calendar_connections")
          .select("*")
          .eq("user_id", user!.id)
          .eq("provider", "google")
          .maybeSingle(),
        supabase
          .from("notification_preferences")
          .select("*")
          .eq("user_id", user!.id)
          .maybeSingle(),
      ]);

      setCalendarConnection(calRes.data);
      setNotificationPrefs(notifRes.data);
      setLoading(false);
    }

    fetchSettings();
  }, [user]);

  const handleConnectCalendar = async () => {
    setConnectingCalendar(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dppjlzxdbsutmjcygitx.supabase.co";
      window.location.href = `${supabaseUrl}/functions/v1/google-calendar-connect?user_id=${user?.id}`;
    } catch {
      setConnectingCalendar(false);
    }
  };

  const handleDisconnectCalendar = async () => {
    if (!user) return;

    await supabase
      .from("calendar_connections")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", "google");

    setCalendarConnection(null);
    toast.success("Google Calendar disconnected");
  };

  const handleToggleCalendarSync = async (enabled: boolean) => {
    if (!user || !calendarConnection) return;

    await supabase
      .from("calendar_connections")
      .update({ calendar_sync_enabled: enabled })
      .eq("id", calendarConnection.id);

    setCalendarConnection({ ...calendarConnection, calendar_sync_enabled: enabled });
    toast.success(enabled ? "Auto-join enabled" : "Auto-join disabled");
  };

  const handleUpdateNotificationPref = async (
    key: keyof Pick<NotificationPreferencesRow, "email_on_transcript_ready" | "email_on_phase1_complete" | "in_app_notifications">,
    value: boolean
  ) => {
    if (!user) return;

    if (notificationPrefs) {
      await supabase
        .from("notification_preferences")
        .update({ [key]: value })
        .eq("id", notificationPrefs.id);

      setNotificationPrefs({ ...notificationPrefs, [key]: value });
    } else {
      const { data } = await supabase
        .from("notification_preferences")
        .insert({
          user_id: user.id,
          [key]: value,
        })
        .select()
        .single();

      if (data) setNotificationPrefs(data);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-sm text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-6 md:py-10">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <SettingsIcon className="w-5 h-5 text-indigo-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-500">
            Configuration
          </span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          Manage your integrations and notification preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Info */}
        <section className="rounded-2xl border-2 border-border p-5">
          <h2 className="text-base font-bold text-foreground mb-4">Account</h2>
          <div className="flex items-center gap-3">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt="Avatar"
                className="w-10 h-10 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                {user?.email?.[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-foreground">
                {user?.user_metadata?.full_name || "User"}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </section>

        {/* Zoom Integration */}
        <section className="rounded-2xl border-2 border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Video className="w-4 h-4 text-blue-600" />
            <h2 className="text-base font-bold text-foreground">Zoom Integration</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your Zoom account to automatically capture meeting recordings and transcripts.
          </p>
          <ZoomConnectButton />
        </section>

        {/* Google Calendar */}
        <section className="rounded-2xl border-2 border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-foreground">Google Calendar</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Connect Google Calendar to automatically detect Zoom and Google Meet meetings and send a bot to record them.
          </p>

          {calendarConnection ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-4 py-3 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                    Google Calendar Connected
                  </span>
                </div>
                <button
                  onClick={handleDisconnectCalendar}
                  className="text-xs text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                >
                  Disconnect
                </button>
              </div>

              <label className="flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-card">
                <div>
                  <p className="text-sm font-medium text-foreground">Auto-join Zoom and Google Meet meetings</p>
                  <p className="text-xs text-muted-foreground">
                    Automatically send a bot to Zoom and Google Meet meetings found in your calendar
                  </p>
                </div>
                <button
                  onClick={() => handleToggleCalendarSync(!calendarConnection.calendar_sync_enabled)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    calendarConnection.calendar_sync_enabled
                      ? "bg-indigo-600"
                      : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      calendarConnection.calendar_sync_enabled
                        ? "translate-x-4"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </label>

              {calendarConnection.last_synced_at && (
                <p className="text-xs text-muted-foreground px-1">
                  Last synced: {new Date(calendarConnection.last_synced_at).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={handleConnectCalendar}
              disabled={connectingCalendar}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-border bg-card text-sm font-semibold text-foreground hover:bg-muted/60 hover:border-emerald-300 transition-all disabled:opacity-50"
            >
              {connectingCalendar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Calendar className="w-4 h-4 text-emerald-600" />
              )}
              {connectingCalendar ? "Connecting..." : "Connect Google Calendar"}
              {!connectingCalendar && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
            </button>
          )}
        </section>

        {/* Notification Preferences */}
        <section className="rounded-2xl border-2 border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-amber-600" />
            <h2 className="text-base font-bold text-foreground">Notifications</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Choose how you want to be notified about meeting transcripts and analysis results.
          </p>

          <div className="space-y-3">
            {[
              {
                key: "email_on_transcript_ready" as const,
                label: "Email when transcript is ready",
                description: "Receive an email when a meeting transcript is processed",
              },
              {
                key: "email_on_phase1_complete" as const,
                label: "Email when Phase 1 completes",
                description: "Receive an email when Phase 1 analysis finishes",
              },
              {
                key: "in_app_notifications" as const,
                label: "In-app notifications",
                description: "Show real-time notifications in the app",
              },
            ].map((pref) => (
              <label
                key={pref.key}
                className="flex items-center justify-between px-4 py-3 rounded-xl border-2 border-border bg-card"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.description}</p>
                </div>
                <button
                  onClick={() =>
                    handleUpdateNotificationPref(
                      pref.key,
                      !(notificationPrefs?.[pref.key] ?? true)
                    )
                  }
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    (notificationPrefs?.[pref.key] ?? true)
                      ? "bg-indigo-600"
                      : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      (notificationPrefs?.[pref.key] ?? true)
                        ? "translate-x-4"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
