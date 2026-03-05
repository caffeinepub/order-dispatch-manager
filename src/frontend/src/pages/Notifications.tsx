import type { Notification } from "@/backend.d";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  useMarkNotificationRead,
  useNotificationsForSalesperson,
} from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell, CheckCheck, Package, Truck } from "lucide-react";
import React from "react";
import { toast } from "sonner";

function formatRelativeTime(nanoseconds: bigint): string {
  const ms = Number(nanoseconds) / 1_000_000;
  const now = Date.now();
  const diffMs = now - ms;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

interface NotificationItemProps {
  notification: Notification;
  index: number;
  onMarkRead: (id: bigint) => void;
  isMarkingRead: boolean;
}

function NotificationItem({
  notification,
  index,
  onMarkRead,
  isMarkingRead,
}: NotificationItemProps) {
  return (
    <div
      data-ocid={`notifications.item.${index}`}
      className={cn(
        "rounded-xl border p-4 transition-colors",
        notification.isRead
          ? "border-border bg-card"
          : "border-primary/20 bg-primary/5",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
            notification.isRead ? "bg-secondary" : "bg-primary/10",
          )}
        >
          <Truck
            className={cn(
              "h-4 w-4",
              notification.isRead ? "text-muted-foreground" : "text-primary",
            )}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  notification.isRead ? "text-foreground" : "text-primary",
                )}
              >
                Order {notification.orderNumber} dispatched
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatRelativeTime(notification.createdAt)}
              </p>
            </div>
            {!notification.isRead && (
              <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
            )}
          </div>

          {/* Details */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Package className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                Customer: {notification.customerName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Truck className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                Transport: {notification.transporterName}
              </span>
            </div>
            {notification.lrNumber && (
              <div className="text-xs text-muted-foreground">
                LR: {notification.lrNumber}
              </div>
            )}
            {notification.dispatchDate && (
              <div className="text-xs text-muted-foreground">
                Dispatch Date: {notification.dispatchDate}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-2">
            <Link
              to="/orders/$id"
              params={{ id: notification.orderId.toString() }}
              className="text-xs font-semibold text-primary underline underline-offset-2"
              onClick={() => {
                if (!notification.isRead) {
                  onMarkRead(notification.id);
                }
              }}
            >
              View Order →
            </Link>
            {!notification.isRead && (
              <button
                type="button"
                onClick={() => onMarkRead(notification.id)}
                disabled={isMarkingRead}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 ml-auto"
              >
                <CheckCheck className="h-3 w-3" />
                Mark read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Notifications() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const salesperson = currentUser?.name ?? "";

  const { data: notifications = [], isLoading } =
    useNotificationsForSalesperson(salesperson);
  const markRead = useMarkNotificationRead();

  const handleMarkRead = (id: bigint) => {
    markRead.mutate(
      { id },
      {
        onError: () => toast.error("Failed to mark as read"),
      },
    );
  };

  const handleMarkAllRead = () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;
    Promise.all(unread.map((n) => markRead.mutateAsync({ id: n.id }))).catch(
      () => toast.error("Failed to mark all as read"),
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Sort: unread first, then by date descending
  const sorted = [...notifications].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    return Number(b.createdAt - a.createdAt);
  });

  return (
    <main data-ocid="notifications.page" className="min-h-screen content-area">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 pt-4 pb-4 sticky top-0 z-10">
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <button
            type="button"
            onClick={() => void navigate({ to: "/" })}
            className="touch-target flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-bold text-foreground">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Dispatch updates for {salesperson || "you"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markRead.isPending}
              className="text-xs text-muted-foreground hover:text-foreground px-2 h-8"
            >
              <CheckCheck className="h-3.5 w-3.5 mr-1" />
              All read
            </Button>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-5 space-y-3">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </>
        ) : sorted.length === 0 ? (
          <div
            data-ocid="notifications.empty_state"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">
              No notifications yet
            </p>
            <p className="text-sm text-muted-foreground max-w-xs">
              You'll be notified here when orders assigned to you are
              dispatched.
            </p>
          </div>
        ) : (
          sorted.map((notification, index) => (
            <NotificationItem
              key={notification.id.toString()}
              notification={notification}
              index={index + 1}
              onMarkRead={handleMarkRead}
              isMarkingRead={markRead.isPending}
            />
          ))
        )}
      </div>
    </main>
  );
}
