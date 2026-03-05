import { OrderStatus } from "@/backend.d";
import { cn } from "@/lib/utils";
import React from "react";

interface StatusBadgeProps {
  status: OrderStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  [OrderStatus.pendingDispatch]: {
    label: "Pending Dispatch",
    className: "status-pending border",
  },
  [OrderStatus.packed]: {
    label: "Packed",
    className: "status-packed border",
  },
  [OrderStatus.dispatched]: {
    label: "Dispatched",
    className: "status-dispatched border",
  },
  [OrderStatus.delivered]: {
    label: "Delivered",
    className: "status-delivered border",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-muted text-muted-foreground border border-border",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}

export function getStatusLabel(status: string): string {
  return statusConfig[status]?.label ?? status;
}

export const STATUS_OPTIONS = [
  { value: OrderStatus.pendingDispatch, label: "Pending Dispatch" },
  { value: OrderStatus.packed, label: "Packed" },
  { value: OrderStatus.dispatched, label: "Dispatched" },
  { value: OrderStatus.delivered, label: "Delivered" },
] as const;
