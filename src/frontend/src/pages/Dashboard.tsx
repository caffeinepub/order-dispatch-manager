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
  ClipboardList,
  Clock,
  LogOut,
  Package,
  Plus,
  Truck,
} from "lucide-react";
import type React from "react";

interface StatCardProps {
  label: string;
  value: bigint | number | undefined;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  isLoading: boolean;
  ocid: string;
}

function StatCard({
  label,
  value,
  icon,
  colorClass,
  bgClass,
  isLoading,
  ocid,
}: StatCardProps) {
  return (
    <div
      data-ocid={ocid}
      className={cn(
        "bg-card rounded-xl p-4 shadow-card flex items-center gap-4",
        "border border-border",
      )}
    >
      <div className={cn("rounded-xl p-3 flex-shrink-0", bgClass)}>
        <span className={cn("block", colorClass)}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground truncate">
          {label}
        </p>
        {isLoading ? (
          <Skeleton className="h-7 w-12 mt-1" />
        ) : (
          <p className="text-2xl font-display font-bold text-foreground leading-tight">
            {value !== undefined ? Number(value).toLocaleString() : "—"}
          </p>
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useOrderStats();
  const { data: dailyReport, isLoading: reportLoading } =
    useDailyDispatchReport();
  const { clear } = useInternetIdentity();
  const { currentUser } = useCurrentUser();

  const cards = [
    {
      label: "Total Orders",
      value: stats?.total,
      icon: <Package className="h-5 w-5" />,
      colorClass: "text-primary",
      bgClass: "bg-secondary",
      ocid: "dashboard.stats.card",
    },
    {
      label: "Pending Dispatch",
      value: stats?.pendingDispatch,
      icon: <Clock className="h-5 w-5" />,
      colorClass: "text-amber-600",
      bgClass: "bg-amber-50",
      ocid: "dashboard.stats.card",
    },
    {
      label: "Packed",
      value: stats?.packed,
      icon: <BoxIcon className="h-5 w-5" />,
      colorClass: "text-blue-600",
      bgClass: "bg-blue-50",
      ocid: "dashboard.stats.card",
    },
    {
      label: "Dispatched",
      value: stats?.dispatched,
      icon: <Truck className="h-5 w-5" />,
      colorClass: "text-purple-600",
      bgClass: "bg-purple-50",
      ocid: "dashboard.stats.card",
    },
    {
      label: "Delivered",
      value: stats?.delivered,
      icon: <CheckCircle2 className="h-5 w-5" />,
      colorClass: "text-green-600",
      bgClass: "bg-green-50",
      ocid: "dashboard.stats.card",
    },
  ];

  const reportCards = [
    {
      label: "Created Today",
      value: dailyReport?.todayCreated,
      icon: <Plus className="h-4 w-4" />,
      colorClass: "text-primary",
      bgClass: "bg-secondary",
    },
    {
      label: "Dispatched Today",
      value: dailyReport?.todayDispatched,
      icon: <Truck className="h-4 w-4" />,
      colorClass: "text-purple-600",
      bgClass: "bg-purple-50",
    },
    {
      label: "Pending Dispatch",
      value: dailyReport?.pendingDispatch,
      icon: <Clock className="h-4 w-4" />,
      colorClass: "text-amber-600",
      bgClass: "bg-amber-50",
    },
    {
      label: "Delivered",
      value: dailyReport?.delivered,
      icon: <CheckCircle2 className="h-4 w-4" />,
      colorClass: "text-green-600",
      bgClass: "bg-green-50",
    },
  ];

  return (
    <main data-ocid="dashboard.page" className="min-h-screen content-area">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 pt-4 pb-4 sticky top-0 z-10">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              Order Dispatch
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {currentUser ? (
                <span className="font-medium">{currentUser.name}</span>
              ) : (
                new Date().toLocaleDateString("en-IN", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })
              )}
            </p>
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
        {/* Stats grid */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {cards.map((card, idx) => (
              <div
                key={card.label}
                className={cn(idx === 0 ? "col-span-2" : "")}
              >
                <StatCard {...card} isLoading={isLoading} />
              </div>
            ))}
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to="/orders/new"
              data-ocid="dashboard.new_order.button"
              className={cn(
                "flex items-center gap-3 rounded-xl p-4 touch-target",
                "bg-primary text-primary-foreground shadow-card",
                "active:scale-[0.98] transition-transform duration-100",
              )}
            >
              <Plus className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-semibold">New Order</span>
            </Link>
            <Link
              to="/orders"
              data-ocid="dashboard.orders.link"
              className={cn(
                "flex items-center gap-3 rounded-xl p-4 touch-target",
                "bg-card border border-border shadow-card",
                "active:scale-[0.98] transition-transform duration-100",
              )}
            >
              <ClipboardList className="h-5 w-5 flex-shrink-0 text-primary" />
              <span className="text-sm font-semibold">View Orders</span>
            </Link>
            <Link
              to="/pending-dispatch"
              data-ocid="dashboard.pending_dispatch.link"
              className={cn(
                "flex items-center gap-3 rounded-xl p-4 touch-target col-span-2",
                "bg-amber-50 border border-amber-200 shadow-card",
                "active:scale-[0.98] transition-transform duration-100",
              )}
            >
              <Clock className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <span className="text-sm font-semibold text-amber-700">
                Pending Dispatch
              </span>
              {stats?.pendingDispatch !== undefined && (
                <span className="ml-auto text-xs font-bold bg-amber-200 text-amber-700 rounded-full px-2 py-0.5">
                  {Number(stats.pendingDispatch)}
                </span>
              )}
            </Link>
          </div>
        </section>

        {/* Daily Dispatch Report */}
        <section data-ocid="dashboard.daily_report.section">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Daily Dispatch Report
          </h2>

          {/* Report summary cards — 2x2 grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {reportCards.map((card) => (
              <div
                key={card.label}
                className={cn(
                  "bg-card rounded-xl p-3 shadow-card border border-border",
                  "flex items-center gap-3",
                )}
              >
                <div
                  className={cn("rounded-lg p-2 flex-shrink-0", card.bgClass)}
                >
                  <span className={cn("block", card.colorClass)}>
                    {card.icon}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground truncate leading-tight">
                    {card.label}
                  </p>
                  {reportLoading ? (
                    <Skeleton className="h-5 w-8 mt-0.5" />
                  ) : (
                    <p className="text-xl font-display font-bold text-foreground leading-tight">
                      {card.value !== undefined
                        ? Number(card.value).toLocaleString()
                        : "—"}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Dispatched today list */}
          <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Dispatched Today
              </h3>
              {dailyReport?.dispatchedToday &&
                dailyReport.dispatchedToday.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {dailyReport.dispatchedToday.length} order
                    {dailyReport.dispatchedToday.length !== 1 ? "s" : ""}
                  </span>
                )}
            </div>

            {reportLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-lg" />
                ))}
              </div>
            ) : !dailyReport?.dispatchedToday ||
              dailyReport.dispatchedToday.length === 0 ? (
              <div className="px-4 py-8 text-center">
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

        {/* Footer */}
        <footer className="pt-2 pb-1 text-center">
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
