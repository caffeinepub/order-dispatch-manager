import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import { Link, useRouter } from "@tanstack/react-router";
import {
  ClipboardList,
  Clock,
  LayoutDashboard,
  Plus,
  Shield,
  Truck,
  Users,
} from "lucide-react";
import type React from "react";

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  ocid: string;
  isPrimary?: boolean;
  adminOnly?: boolean;
}

const baseNavItems: NavItem[] = [
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
  {
    to: "/users",
    icon: <Shield className="h-5 w-5" />,
    label: "Users",
    ocid: "nav.users.link",
    adminOnly: true,
  },
  {
    to: "/customers",
    icon: <Users className="h-5 w-5" />,
    label: "Customers",
    ocid: "nav.customers.link",
    adminOnly: false,
  },
  {
    to: "/transporters",
    icon: <Truck className="h-5 w-5" />,
    label: "Transport",
    ocid: "nav.transporters.link",
    adminOnly: false,
  },
];

export function BottomNav() {
  const router = useRouter();
  const currentPath = router.state.location.pathname;
  const { isAdmin } = useCurrentUser();

  const isActive = (to: string) => {
    if (to === "/") return currentPath === "/";
    if (to === "/orders")
      return (
        currentPath === "/orders" ||
        (currentPath.startsWith("/orders/") && currentPath !== "/orders/new")
      );
    return currentPath === to || currentPath.startsWith(`${to}/`);
  };

  // Build nav items: always show Dashboard, Orders, New(primary), Pending
  // Show Users only for admins; hide Customers+Transporters when Users shown (to avoid overflow)
  const navItems = baseNavItems.filter((item) => {
    if (item.adminOnly === true) return isAdmin;
    if (item.adminOnly === false) {
      // Show Customers/Transporters only when not admin (to keep 5 items max)
      return !isAdmin;
    }
    return true;
  });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
    >
      <div className="mx-auto max-w-lg">
        <div className="flex h-16 items-center justify-around px-1">
          {navItems.map((item) => {
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
        </div>
      </div>
    </nav>
  );
}
