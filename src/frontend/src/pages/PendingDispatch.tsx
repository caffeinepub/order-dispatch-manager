import { StatusBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { usePendingDispatchOrders } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, ChevronRight, Clock } from "lucide-react";
import type React from "react";

function formatDate(nanoseconds: bigint | string): string {
  if (typeof nanoseconds === "string") return nanoseconds;
  const ms = Number(nanoseconds) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PendingDispatch() {
  const navigate = useNavigate();
  const { data: orders, isLoading, error } = usePendingDispatchOrders();

  return (
    <main
      data-ocid="pending_dispatch.page"
      className="min-h-screen content-area"
    >
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
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              Pending Dispatch
            </h1>
            <p className="text-xs text-muted-foreground">
              Orders awaiting dispatch
            </p>
          </div>
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
        {!isLoading && !error && orders && orders.length > 0 && (
          <div data-ocid="pending_dispatch.list" className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {orders.length} order{orders.length !== 1 ? "s" : ""} pending
            </p>
            {orders.map((order, idx) => (
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
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-primary font-display">
                        {order.orderNumber}
                      </span>
                      <StatusBadge status={order.status} />
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
