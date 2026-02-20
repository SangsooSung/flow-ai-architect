import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { ZoomMeetingRow } from "@/types/database";

interface Notification {
  id: string;
  message: string;
  type: "transcript_ready" | "meeting_status" | "phase_complete";
  read: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user) return;

    // Subscribe to zoom_meetings changes for real-time notifications
    const channel = supabase
      .channel("meeting-notifications")
      .on<ZoomMeetingRow>(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "zoom_meetings",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const meeting = payload.new;
          if (meeting.status === "completed") {
            setNotifications((prev) => [
              {
                id: meeting.id,
                message: `Transcript ready: ${meeting.topic || "Zoom Meeting"}`,
                type: "transcript_ready",
                read: false,
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          } else if (meeting.status === "in_progress") {
            setNotifications((prev) => [
              {
                id: `${meeting.id}-started`,
                message: `Bot joined: ${meeting.topic || "Zoom Meeting"}`,
                type: "meeting_status",
                read: false,
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          } else if (meeting.status === "failed") {
            setNotifications((prev) => [
              {
                id: `${meeting.id}-failed`,
                message: `Bot failed: ${meeting.topic || "Zoom Meeting"}`,
                type: "meeting_status",
                read: false,
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown && unreadCount > 0) {
            markAllRead();
          }
        }}
        className="relative p-2 rounded-lg hover:bg-muted/60 transition-colors"
      >
        <Bell className="w-4.5 h-4.5 text-muted-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 top-full mt-1 w-72 bg-card border border-border rounded-xl shadow-xl z-50">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h4 className="text-sm font-semibold text-foreground">
                Notifications
              </h4>
              {notifications.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.slice(0, 10).map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-border last:border-0 ${
                      !n.read
                        ? "bg-indigo-50/50 dark:bg-indigo-950/20"
                        : ""
                    }`}
                  >
                    <p className="text-sm text-foreground">{n.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(n.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
