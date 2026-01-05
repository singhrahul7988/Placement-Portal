"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Bell, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  createdAt?: string;
  read?: boolean;
};

type TopBarActionsProps = {
  settingsPath: string;
  notifications?: NotificationItem[];
  showSettings?: boolean;
  showNotifications?: boolean;
};

export default function TopBarActions({
  settingsPath,
  notifications,
  showSettings = true,
  showNotifications = true,
}: TopBarActionsProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(notifications || []);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.read).length,
    [items]
  );

  const loadNotifications = async () => {
    if (notifications) return;
    try {
      setLoading(true);
      const { data } = await api.get("/api/notifications");
      const mapped = (data || []).map((item: any) => ({
        id: item._id,
        title: item.title,
        detail: item.detail,
        createdAt: item.createdAt,
        read: item.read,
      }));
      setItems(mapped);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (notifications) {
      setItems(notifications);
      return;
    }
    loadNotifications();
  }, [notifications]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!open) return;
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const markAllRead = () => {
    if (notifications) {
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      return;
    }
    api
      .put("/api/notifications/read", { markAll: true })
      .then(() => loadNotifications())
      .catch(() => setItems((prev) => prev.map((item) => ({ ...item, read: true }))));
  };

  useEffect(() => {
    if (open && !notifications) {
      loadNotifications();
    }
  }, [open, notifications]);

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div ref={containerRef} className="relative flex items-center gap-3">
      {showSettings && (
        <button
          type="button"
          onClick={() => router.push(settingsPath)}
          className="h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500"
          aria-label="Open profile settings"
          title="Profile settings"
        >
          <Settings size={16} />
        </button>
      )}
      {showNotifications && (
        <>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="relative h-9 w-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500"
            aria-label="View notifications"
            title="Notifications"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center px-1">
                {unreadCount}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 top-12 w-80 rounded-xl border border-slate-200 bg-white shadow-lg z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <div className="text-sm font-semibold text-slate-800">Notifications</div>
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-blue-600 font-semibold"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {loading ? (
                  <div className="px-4 py-6 text-xs text-slate-500 text-center">
                    Loading notifications...
                  </div>
                ) : items.length === 0 ? (
                  <div className="px-4 py-6 text-xs text-slate-500 text-center">
                    No new notifications.
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className={`px-4 py-3 border-b border-slate-100 ${
                        item.read ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <div className="text-sm font-semibold text-slate-800">{item.title}</div>
                      <div className="text-xs text-slate-500 mt-1">{item.detail}</div>
                      <div className="text-[11px] text-slate-400 mt-2">
                        {formatTime(item.createdAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="px-4 py-2 text-right">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-xs text-slate-500 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
