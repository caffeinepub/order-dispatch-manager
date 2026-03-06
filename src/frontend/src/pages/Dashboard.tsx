import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useDailyDispatchReport, useOrderStats } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BoxIcon,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  LogOut,
  Package,
  Plus,
  Truck,
} from "lucide-react";
import type React from "react";

export function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useOrderStats();
  const { data: dailyReport, isLoading: reportLoading } =
    useDailyDispatchReport();
  const { clear } = useInternetIdentity();
  const { currentUser } = useCurrentUser();

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <main data-ocid="dashboard.page" className="min-h-screen content-area">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 pt-5 pb-4 sticky top-0 z-10">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              {currentUser ? (
                <>Hi, {currentUser.name.split(" ")[0]}</>
              ) : (
                "Order Dispatch"
              )}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{today}</p>
          </div>
          <Button
            data-ocid="auth.logout_button"
            variant="ghost"
            size="sm"
            onClick={clear}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5 mr-1" />
            Logout
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-5 space-y-5">
        {/* Quick actions row */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/orders/new"
            data-ocid="dashboard.new_order.button"
            className={cn(
              "flex items-center gap-3 rounded-2xl p-4 touch-target",
              "bg-primary text-primary-foreground shadow-card",
              "active:scale-[0.98] transition-transform duration-100",
            )}
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold leading-tight">
              New Order
            </span>
          </Link>
          <Link
            to="/pending-dispatch"
            data-ocid="dashboard.pending_dispatch.link"
            className={cn(
              "flex items-center gap-3 rounded-2xl p-4 touch-target",
              "bg-amber-50 border border-amber-200",
              "active:scale-[0.98] transition-transform duration-100",
            )}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-semibold text-amber-800 leading-tight block">
                Pending
              </span>
              {stats?.pendingDispatch !== undefined && (
                <span className="text-xs font-bold text-amber-600">
                  {Number(stats.pendingDispatch)} orders
                </span>
              )}
            </div>
          </Link>
        </div>

        {/* Stats overview */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            All Time Overview
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {/* Total — full width */}
            <div className="col-span-2 bg-card rounded-xl border border-border shadow-card px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  Total Orders
                </span>
              </div>
              {isLoading ? (
                <Skeleton className="h-7 w-12" />
              ) : (
                <span className="text-2xl font-display font-bold text-foreground">
                  {stats?.total !== undefined
                    ? Number(stats.total).toLocaleString()
                    : "—"}
                </span>
              )}
            </div>

            {[
              {
                label: "Pending",
                value: stats?.pendingDispatch,
                icon: <Clock className="h-4 w-4" />,
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
              {
                label: "Packed",
                value: stats?.packed,
                icon: <BoxIcon className="h-4 w-4" />,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Dispatched",
                value: stats?.dispatched,
                icon: <Truck className="h-4 w-4" />,
                color: "text-purple-600",
                bg: "bg-purple-50",
              },
              {
                label: "Delivered",
                value: stats?.delivered,
                icon: <CheckCircle2 className="h-4 w-4" />,
                color: "text-green-600",
                bg: "bg-green-50",
              },
            ].map((card) => (
              <div
                key={card.label}
                data-ocid="dashboard.stats.card"
                className="bg-card rounded-xl border border-border shadow-card px-3 py-3"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center mb-2",
                    card.bg,
                  )}
                >
                  <span className={card.color}>{card.icon}</span>
                </div>
                {isLoading ? (
                  <Skeleton className="h-6 w-10 mb-1" />
                ) : (
                  <p className="text-xl font-display font-bold text-foreground leading-tight">
                    {card.value !== undefined
                      ? Number(card.value).toLocaleString()
                      : "—"}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {card.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Today's summary strip */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Today
          </h2>
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-border">
              {[
                { label: "Created", value: dailyReport?.todayCreated },
                { label: "Dispatched", value: dailyReport?.todayDispatched },
              ].map((item) => (
                <div key={item.label} className="px-4 py-3 text-center">
                  {reportLoading ? (
                    <Skeleton className="h-6 w-8 mx-auto mb-1" />
                  ) : (
                    <p className="text-2xl font-display font-bold text-foreground">
                      {item.value !== undefined
                        ? Number(item.value).toLocaleString()
                        : "—"}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Dispatched today list */}
        <section data-ocid="dashboard.daily_report.section">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Dispatched Today
          </h2>

          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            {reportLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : !dailyReport?.dispatchedToday ||
              dailyReport.dispatchedToday.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No orders dispatched today
                </p>
              </div>
            ) : (
              <div
                data-ocid="dashboard.daily_report.dispatched_today.list"
                className="divide-y divide-border"
              >
                {dailyReport.dispatchedToday.map((order, idx) => (
                  <button
                    key={order.id.toString()}
                    type="button"
                    data-ocid={`dashboard.daily_report.item.${idx + 1}`}
                    onClick={() =>
                      void navigate({
                        to: `/orders/${order.id.toString()}`,
                      })
                    }
                    className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-primary font-display">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {order.customerName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground truncate">
                          {order.transporterName}
                        </span>
                        {order.lrNumber && (
                          <>
                            <span className="text-muted-foreground/40">•</span>
                            <span className="text-xs text-muted-foreground">
                              LR: {order.lrNumber}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-1">
                      {order.dispatchDate && (
                        <span className="text-xs text-muted-foreground">
                          {order.dispatchDate}
                        </span>
                      )}
                      <ChevronRight className="h-3 w-3 text-muted-foreground/60" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* View all orders link */}
        <Link
          to="/orders"
          data-ocid="dashboard.orders.link"
          className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          View All Orders
          <ChevronRight className="h-4 w-4" />
        </Link>

        {/* Footer */}
        <footer className="pt-1 pb-1 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}.{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline underline-offset-2 transition-colors"
            >
              Built with ♥ using caffeine.ai
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
