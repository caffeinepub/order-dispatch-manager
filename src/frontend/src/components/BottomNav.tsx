import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import {
  ClipboardList,
  Clock,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Settings,
  Shield,
  Truck,
  Users,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";

export function BottomNav() {
  const router = useRouter();
  const navigate = useNavigate();
  const currentPath = router.state.location.pathname;
  const { isAdmin } = useCurrentUser();
  const [showMore, setShowMore] = useState(false);

  const isActive = (to: string) => {
    if (to === "/") return currentPath === "/";
    if (to === "/orders")
      return (
        currentPath === "/orders" ||
        (currentPath.startsWith("/orders/") && currentPath !== "/orders/new")
      );
    return currentPath === to || currentPath.startsWith(`${to}/`);
  };

  // The 5 primary nav items — fixed for both admin and staff
  const primaryItems = [
    {
      to: "/",
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
      ocid: "nav.dashboard.link",
    },
    {
      to: "/orders",
      icon: <ClipboardList className="h-5 w-5" />,
      label: "Orders",
      ocid: "nav.orders.link",
    },
    {
      to: "/orders/new",
      icon: <Plus className="h-6 w-6" />,
      label: "New",
      ocid: "nav.new_order.button",
      isPrimary: true,
    },
    {
      to: "/pending-dispatch",
      icon: <Clock className="h-5 w-5" />,
      label: "Pending",
      ocid: "nav.pending_dispatch.link",
    },
  ];

  // "More" drawer items — adapts to role
  const moreItems = [
    {
      to: "/customers",
      icon: <Users className="h-5 w-5" />,
      label: "Customers",
      ocid: "nav.customers.link",
    },
    {
      to: "/transporters",
      icon: <Truck className="h-5 w-5" />,
      label: "Transporters",
      ocid: "nav.transporters.link",
    },
    ...(isAdmin
      ? [
          {
            to: "/users",
            icon: <Shield className="h-5 w-5" />,
            label: "Users",
            ocid: "nav.users.link",
          },
          {
            to: "/settings",
            icon: <Settings className="h-5 w-5" />,
            label: "Settings",
            ocid: "nav.settings.link",
          },
        ]
      : []),
  ];

  // More button is "active" when current path is one of the more items
  const moreActive = moreItems.some((item) => isActive(item.to));

  return (
    <>
      {/* More drawer overlay */}
      {showMore && (
        <div
          role="button"
          tabIndex={-1}
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={() => setShowMore(false)}
          onKeyDown={(e) => e.key === "Escape" && setShowMore(false)}
        />
      )}

      {/* More drawer panel */}
      {showMore && (
        <div
          className="fixed bottom-16 left-0 right-0 z-50 mx-auto max-w-lg px-4"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
        >
          <div className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                More
              </span>
              <button
                type="button"
                onClick={() => setShowMore(false)}
                className="p-1 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Close menu"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-border">
              {moreItems.map((item) => (
                <button
                  key={item.to}
                  type="button"
                  data-ocid={item.ocid}
                  onClick={() => {
                    void navigate({ to: item.to });
                    setShowMore(false);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-secondary",
                    isActive(item.to)
                      ? "text-primary bg-primary/5"
                      : "text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      isActive(item.to)
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
      >
        <div className="mx-auto max-w-lg">
          <div className="flex h-16 items-center justify-around px-1">
            {primaryItems.map((item) => {
              const active = isActive(item.to);

              if (item.isPrimary) {
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    data-ocid={item.ocid}
                    className={cn(
                      "flex flex-col items-center justify-center touch-target",
                      "w-14 h-14 rounded-2xl transition-all duration-200",
                      "bg-primary text-primary-foreground shadow-card",
                      "-translate-y-3",
                      "active:scale-95",
                    )}
                  >
                    {item.icon}
                    <span className="text-[10px] font-semibold mt-0.5">
                      {item.label}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  data-ocid={item.ocid}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 touch-target",
                    "flex-1 h-full px-1 py-2 transition-all duration-150",
                    "rounded-xl relative",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "transition-transform duration-150",
                      active && "scale-110",
                    )}
                  >
                    {item.icon}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium",
                      active && "font-semibold",
                    )}
                  >
                    {item.label}
                  </span>
                  {active && (
                    <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}

            {/* More button */}
            <button
              type="button"
              data-ocid="nav.more.button"
              onClick={() => setShowMore((v) => !v)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 touch-target",
                "flex-1 h-full px-1 py-2 transition-all duration-150",
                "rounded-xl relative",
                moreActive || showMore
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium">More</span>
              {moreActive && !showMore && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}
