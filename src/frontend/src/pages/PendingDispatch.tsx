import { OrderPriority } from "@/backend.d";
import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePendingDispatchOrders } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowUpDown,
  CheckCircle2,
  ChevronRight,
  Clock,
} from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import type { Order } from "../backend.d";
import { PriorityBadge } from "./NewOrder";

type SortMode = "date" | "priority";

const PRIORITY_ORDER: Record<string, number> = {
  [OrderPriority.veryUrgent]: 0,
  [OrderPriority.urgent]: 1,
  [OrderPriority.normal]: 2,
};

function formatDate(nanoseconds: bigint | string): string {
  if (typeof nanoseconds === "string") return nanoseconds;
  const ms = Number(nanoseconds) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function calcOrderAge(orderDate: bigint): number {
  const ms = Number(orderDate) / 1_000_000;
  return Math.floor((Date.now() - ms) / 86_400_000);
}

function OrderAgeBadge({ orderDate }: { orderDate: bigint }) {
  const days = calcOrderAge(orderDate);
  return (
    <span
      className={cn(
        "text-xs font-medium",
        days >= 5
          ? "text-red-600"
          : days >= 3
            ? "text-orange-500"
            : "text-muted-foreground",
      )}
    >
      {days === 0 ? "Today" : days === 1 ? "1 Day" : `${days} Days`}
    </span>
  );
}

export function PendingDispatch() {
  const navigate = useNavigate();
  const { data: orders, isLoading, error } = usePendingDispatchOrders();
  const [sortMode, setSortMode] = useState<SortMode>("date");

  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => {
      if (sortMode === "priority") {
        const aPriority = PRIORITY_ORDER[a.priority] ?? 2;
        const bPriority = PRIORITY_ORDER[b.priority] ?? 2;
        if (aPriority !== bPriority) return aPriority - bPriority;
      }
      const aTime = typeof a.orderDate === "bigint" ? Number(a.orderDate) : 0;
      const bTime = typeof b.orderDate === "bigint" ? Number(b.orderDate) : 0;
      return bTime - aTime;
    });
  }, [orders, sortMode]);

  return (
    <main
      data-ocid="pending_dispatch.page"
      className="min-h-screen content-area"
    >
      {/* Header */}
      <header className="bg-card border-b border-border px-4 pt-4 pb-4 sticky top-0 z-10">
        <div className="mx-auto max-w-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void navigate({ to: "/" })}
              className="touch-target flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">
                Pending Dispatch
              </h1>
              <p className="text-xs text-muted-foreground">
                Orders awaiting dispatch
              </p>
            </div>
          </div>

          {/* Sort toggle */}
          <button
            type="button"
            data-ocid="pending_dispatch.priority_sort.toggle"
            onClick={() =>
              setSortMode((prev) => (prev === "date" ? "priority" : "date"))
            }
            className={cn(
              "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors border",
              sortMode === "priority"
                ? "bg-orange-100 text-orange-700 border-orange-200"
                : "bg-secondary text-secondary-foreground border-border hover:bg-muted",
            )}
            title={
              sortMode === "priority" ? "Sorting by priority" : "Sort by date"
            }
          >
            <ArrowUpDown className="h-3 w-3" />
            {sortMode === "priority" ? "Priority" : "Date"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-4">
        {/* Loading */}
        {isLoading && (
          <div data-ocid="pending_dispatch.loading_state" className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-center">
            <p className="text-sm text-destructive font-medium">
              Failed to load pending orders
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && (!orders || orders.length === 0) && (
          <div
            data-ocid="pending_dispatch.empty_state"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <CheckCircle2 className="h-12 w-12 text-green-500/60 mb-4" />
            <p className="font-semibold text-foreground mb-1">
              All orders dispatched!
            </p>
            <p className="text-sm text-muted-foreground">
              No orders pending dispatch right now.
            </p>
          </div>
        )}

        {/* Orders list */}
        {!isLoading && !error && sortedOrders.length > 0 && (
          <div data-ocid="pending_dispatch.list" className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {sortedOrders.length} order{sortedOrders.length !== 1 ? "s" : ""}{" "}
              pending
              {sortMode === "priority" && " · sorted by priority"}
            </p>
            {sortedOrders.map((order, idx) => (
              <button
                key={order.id.toString()}
                type="button"
                data-ocid={`pending_dispatch.item.${idx + 1}`}
                onClick={() =>
                  void navigate({ to: `/orders/${order.id.toString()}` })
                }
                className={cn(
                  "w-full text-left bg-card rounded-xl border border-border shadow-card",
                  "p-4 active:scale-[0.99] transition-transform duration-100",
                  "card-interactive",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-semibold text-primary font-display">
                        {order.orderNumber}
                      </span>
                      <StatusBadge status={order.status} />
                      <PriorityBadge priority={order.priority} />
                    </div>
                    <p className="font-semibold text-sm text-foreground truncate">
                      {order.customerName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground flex-1 truncate">
                        {order.transporterName}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Salesperson: {order.salesperson}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1">
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(order.orderDate)}
                    </span>
                    <OrderAgeBadge orderDate={order.orderDate} />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
