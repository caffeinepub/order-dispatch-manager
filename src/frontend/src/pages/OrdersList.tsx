import { OrderStatus } from "@/backend.d";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useOrders, useOrdersByPhone } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  PackageOpen,
  Phone,
  Plus,
  Search,
  X,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import type { Order } from "../backend.d";

type StatusFilter =
  | "All"
  | typeof OrderStatus.pendingDispatch
  | typeof OrderStatus.packed
  | typeof OrderStatus.dispatched
  | typeof OrderStatus.delivered;

const statusTabs: { value: StatusFilter; label: string }[] = [
  { value: "All", label: "All" },
  { value: OrderStatus.pendingDispatch, label: "Pending" },
  { value: OrderStatus.packed, label: "Packed" },
  { value: OrderStatus.dispatched, label: "Dispatched" },
  { value: OrderStatus.delivered, label: "Delivered" },
];

function formatDate(nanoseconds: bigint | string): string {
  if (typeof nanoseconds === "string") return nanoseconds;
  const ms = Number(nanoseconds) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface OrderCardProps {
  order: Order;
  index: number;
}

function OrderCard({ order, index }: OrderCardProps) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      data-ocid={`orders.item.${index}`}
      className={cn(
        "w-full text-left bg-card rounded-xl border border-border shadow-card",
        "p-4 active:scale-[0.99] transition-transform duration-100",
        "card-interactive",
      )}
      onClick={() => void navigate({ to: `/orders/${order.id.toString()}` })}
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
          <p className="text-xs text-muted-foreground mt-0.5">
            {order.transporterName} • {order.salesperson}
          </p>
        </div>
        <div className="flex-shrink-0 flex flex-col items-end gap-1">
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {formatDate(order.orderDate)}
          </span>
        </div>
      </div>
      {order.dispatchDate && (
        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
          Dispatch: {order.dispatchDate}
        </p>
      )}
    </button>
  );
}

export function OrdersList() {
  const { data: orders, isLoading, error } = useOrders();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [phoneSearch, setPhoneSearch] = useState("");
  const [showPhoneSearch, setShowPhoneSearch] = useState(false);

  const activePhone = phoneSearch.length >= 5 ? phoneSearch : "";
  const {
    data: phoneOrders,
    isLoading: phoneLoading,
    error: phoneError,
  } = useOrdersByPhone(activePhone);

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    const sorted = [...orders].sort((a, b) => {
      const aTime = typeof a.orderDate === "bigint" ? Number(a.orderDate) : 0;
      const bTime = typeof b.orderDate === "bigint" ? Number(b.orderDate) : 0;
      return bTime - aTime;
    });

    return sorted.filter((order) => {
      const matchesStatus =
        statusFilter === "All" || order.status === statusFilter;

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.salesperson.toLowerCase().includes(q) ||
        order.transporterName.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const isPhoneMode = showPhoneSearch && phoneSearch.length >= 5;
  const displayOrders = isPhoneMode ? (phoneOrders ?? []) : filteredOrders;
  const displayLoading = isPhoneMode ? phoneLoading : isLoading;
  const displayError = isPhoneMode ? phoneError : error;

  return (
    <main data-ocid="orders.page" className="min-h-screen content-area">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 pt-4 pb-3 sticky top-0 z-10">
        <div className="mx-auto max-w-lg">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-display font-bold text-foreground">
              Orders
            </h1>
            <Link
              to="/orders/new"
              data-ocid="orders.new_order.button"
              className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-semibold touch-target active:scale-95 transition-transform"
            >
              <Plus className="h-4 w-4" />
              New
            </Link>
          </div>

          {/* Search row */}
          {!showPhoneSearch ? (
            <div className="relative mb-3 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  data-ocid="orders.search_input"
                  type="search"
                  placeholder="Search orders, customers..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 bg-background"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowPhoneSearch(true)}
                className={cn(
                  "flex-shrink-0 flex items-center justify-center",
                  "w-10 h-10 rounded-lg border border-border bg-background",
                  "text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors",
                )}
                title="Search by phone number"
                aria-label="Search by phone number"
              >
                <Phone className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative mb-3 flex gap-2">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  data-ocid="orders.phone_search_input"
                  type="tel"
                  placeholder="Search by phone number..."
                  value={phoneSearch}
                  onChange={(e) => setPhoneSearch(e.target.value)}
                  className="pl-9 h-10 bg-background"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPhoneSearch(false);
                  setPhoneSearch("");
                }}
                className={cn(
                  "flex-shrink-0 flex items-center justify-center",
                  "w-10 h-10 rounded-lg border border-border bg-background",
                  "text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors",
                )}
                aria-label="Close phone search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Status filter tabs — only in normal mode */}
          {!showPhoneSearch && (
            <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
              {statusTabs.map((tab) => (
                <button
                  type="button"
                  key={tab.value}
                  data-ocid="orders.status.tab"
                  onClick={() => setStatusFilter(tab.value)}
                  className={cn(
                    "flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors",
                    statusFilter === tab.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-muted",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Phone search label */}
          {showPhoneSearch &&
            phoneSearch.length > 0 &&
            phoneSearch.length < 5 && (
              <p className="text-xs text-muted-foreground pb-1">
                Enter at least 5 digits to search
              </p>
            )}
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-4">
        {/* Loading */}
        {displayLoading && (
          <div data-ocid="orders.loading_state" className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Error */}
        {displayError && !displayLoading && (
          <div
            data-ocid="orders.error_state"
            className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-center"
          >
            <p className="text-sm text-destructive font-medium">
              Failed to load orders
            </p>
          </div>
        )}

        {/* Empty state */}
        {!displayLoading && !displayError && displayOrders.length === 0 && (
          <div
            data-ocid="orders.empty_state"
            className="flex flex-col items-center justify-center py-16 px-6 text-center"
          >
            <PackageOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="font-semibold text-foreground mb-1">
              {isPhoneMode
                ? "No orders found for this phone"
                : search || statusFilter !== "All"
                  ? "No orders found"
                  : "No orders yet"}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {isPhoneMode
                ? "Try a different phone number"
                : search || statusFilter !== "All"
                  ? "Try adjusting your search or filter"
                  : "Create your first order to get started"}
            </p>
            {!search && statusFilter === "All" && !isPhoneMode && (
              <Link
                to="/orders/new"
                className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
              >
                <Plus className="h-4 w-4" />
                Create Order
              </Link>
            )}
          </div>
        )}

        {/* Order list */}
        {!displayLoading && displayOrders.length > 0 && (
          <div data-ocid="orders.list" className="space-y-3 animate-fade-in">
            <p className="text-xs text-muted-foreground">
              {displayOrders.length} order
              {displayOrders.length !== 1 ? "s" : ""}
              {isPhoneMode && ` for "${phoneSearch}"`}
            </p>
            {displayOrders.map((order, idx) => (
              <OrderCard
                key={order.id.toString()}
                order={order}
                index={idx + 1}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
