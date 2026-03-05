import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  useAddCustomer,
  useCreateOrder,
  useCustomers,
  useTransporters,
} from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Info, Loader2, UserPlus, X } from "lucide-react";
import type React from "react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { Customer } from "../backend.d";

interface AddCustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onAdded: (customer: Customer) => void;
}

function AddCustomerDialog({ open, onClose, onAdded }: AddCustomerDialogProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const addCustomer = useAddCustomer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !city.trim()) {
      toast.error("All fields are required");
      return;
    }
    try {
      const customer = await addCustomer.mutateAsync({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
      });
      toast.success(`Customer "${customer.name}" added`);
      onAdded(customer);
      setName("");
      setPhone("");
      setCity("");
      onClose();
    } catch {
      toast.error("Failed to add customer");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="new_order.add_customer.dialog"
        className="mx-4 rounded-2xl max-w-sm w-full"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Add New Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="c-name">Customer Name *</Label>
            <Input
              id="c-name"
              data-ocid="new_order.add_customer.name.input"
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-phone">Phone Number *</Label>
            <Input
              id="c-phone"
              data-ocid="new_order.add_customer.phone.input"
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-city">City *</Label>
            <Input
              id="c-city"
              data-ocid="new_order.add_customer.city.input"
              placeholder="Enter city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              data-ocid="new_order.add_customer.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="new_order.add_customer.submit_button"
              disabled={addCustomer.isPending}
            >
              {addCustomer.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add Customer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface CustomerTypeaheadProps {
  customers: Customer[] | undefined;
  isLoading: boolean;
  selectedCustomer: Customer | undefined;
  onSelect: (customer: Customer) => void;
  onClear: () => void;
  onAddNew: () => void;
}

function CustomerTypeahead({
  customers,
  isLoading,
  selectedCustomer,
  onSelect,
  onClear,
  onAddNew,
}: CustomerTypeaheadProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCustomers =
    query.length >= 1 && customers
      ? customers.filter(
          (c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.phone.includes(query),
        )
      : [];

  const handleSelect = (customer: Customer) => {
    onSelect(customer);
    setQuery("");
    setIsOpen(false);
  };

  const handleClear = () => {
    onClear();
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    if (selectedCustomer) onClear();
  };

  const handleInputFocus = () => {
    if (query.length >= 1) setIsOpen(true);
  };

  const handleInputBlur = () => {
    // Delay to allow click on dropdown items
    setTimeout(() => setIsOpen(false), 150);
  };

  if (isLoading) {
    return <Skeleton className="h-12 w-full rounded-lg" />;
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          data-ocid="new_order.customer_search.input"
          placeholder="Search by name or phone..."
          value={selectedCustomer ? selectedCustomer.name : query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          className={cn(
            "h-12 text-base pr-10",
            selectedCustomer && "bg-secondary font-medium",
          )}
          autoComplete="off"
        />
        {(selectedCustomer || query) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear selection"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && query.length >= 1 && (
        <div
          ref={dropdownRef}
          data-ocid="new_order.customer_search.dropdown"
          className={cn(
            "absolute top-full left-0 right-0 z-50 mt-1",
            "bg-card border border-border rounded-xl shadow-lg",
            "max-h-56 overflow-y-auto",
          )}
        >
          {filteredCustomers.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">
              No customers found.{" "}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onAddNew();
                }}
                className="text-primary font-medium underline underline-offset-2"
              >
                Add new
              </button>
            </div>
          ) : (
            filteredCustomers.slice(0, 8).map((customer, idx) => (
              <button
                key={customer.id.toString()}
                type="button"
                data-ocid={`new_order.customer_result.${idx + 1}`}
                onMouseDown={() => handleSelect(customer)}
                className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors border-b border-border last:border-0"
              >
                <p className="text-sm font-semibold text-foreground">
                  {customer.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {customer.phone} • {customer.city}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function NewOrder() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: transporters, isLoading: transportersLoading } =
    useTransporters();
  const createOrder = useCreateOrder();

  const [salesperson, setSalesperson] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<
    Customer | undefined
  >(undefined);
  const [selectedTransporterId, setSelectedTransporterId] =
    useState<string>("");
  const [orderValue, setOrderValue] = useState("");
  const [notes, setNotes] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  const handleCustomerAdded = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesperson.trim()) {
      toast.error("Salesperson name is required");
      return;
    }
    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }
    if (!selectedTransporterId) {
      toast.error("Please select a transporter");
      return;
    }
    const value = Number.parseFloat(orderValue);
    if (Number.isNaN(value) || value <= 0) {
      toast.error("Please enter a valid order value");
      return;
    }

    try {
      const order = await createOrder.mutateAsync({
        salesperson: salesperson.trim(),
        customerId: selectedCustomer.id,
        transporterId: BigInt(selectedTransporterId),
        orderValue: value,
        notes: notes.trim(),
        createdBy: currentUser?.email ?? "",
      });
      toast.success(`Order ${order.orderNumber} created`);
      void navigate({ to: `/orders/${order.id.toString()}` });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create order",
      );
    }
  };

  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <main data-ocid="new_order.form" className="min-h-screen content-area">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 pt-4 pb-4 sticky top-0 z-10">
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <button
            type="button"
            onClick={() => void navigate({ to: "/orders" })}
            className="touch-target flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              New Order
            </h1>
            <p className="text-xs text-muted-foreground">
              Date: {today} • Status: Pending Dispatch
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-5">
        {/* Auto-generated info banner */}
        <div className="flex items-start gap-2 rounded-xl bg-secondary border border-border p-3 mb-5">
          <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            Order Number and Date are automatically generated. Status is set to{" "}
            <span className="font-medium text-foreground">
              Pending Dispatch
            </span>
            .
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          {/* Salesperson */}
          <div className="space-y-1.5">
            <Label htmlFor="salesperson" className="text-sm font-semibold">
              Salesperson Name *
            </Label>
            <Input
              id="salesperson"
              data-ocid="new_order.salesperson.input"
              placeholder="Enter salesperson name"
              value={salesperson}
              onChange={(e) => setSalesperson(e.target.value)}
              className="h-12 text-base"
              required
            />
          </div>

          {/* Customer typeahead search */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold">Select Customer *</Label>
              <button
                type="button"
                data-ocid="new_order.add_customer.open_modal_button"
                onClick={() => setShowAddCustomer(true)}
                className="flex items-center gap-1 text-xs text-primary font-medium touch-target px-2 py-1 rounded-md hover:bg-secondary transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add New
              </button>
            </div>
            <CustomerTypeahead
              customers={customers}
              isLoading={customersLoading}
              selectedCustomer={selectedCustomer}
              onSelect={setSelectedCustomer}
              onClear={() => setSelectedCustomer(undefined)}
              onAddNew={() => setShowAddCustomer(true)}
            />
          </div>

          {/* Auto-filled customer fields */}
          {selectedCustomer && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-secondary border border-border">
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium text-foreground">
                  {selectedCustomer.phone}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">City</p>
                <p className="text-sm font-medium text-foreground">
                  {selectedCustomer.city}
                </p>
              </div>
            </div>
          )}

          {/* Transporter */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold">Select Transport *</Label>
            {transportersLoading ? (
              <Skeleton className="h-12 w-full rounded-lg" />
            ) : (
              <Select
                value={selectedTransporterId}
                onValueChange={setSelectedTransporterId}
              >
                <SelectTrigger
                  data-ocid="new_order.transport.select"
                  className="h-12 text-base"
                >
                  <SelectValue placeholder="Choose a transporter..." />
                </SelectTrigger>
                <SelectContent>
                  {transporters?.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground text-center">
                      No transporters yet. Add from the Transporters page.
                    </div>
                  ) : (
                    transporters?.map((t) => (
                      <SelectItem key={t.id.toString()} value={t.id.toString()}>
                        {t.name} — {t.city}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Order Value */}
          <div className="space-y-1.5">
            <Label htmlFor="orderValue" className="text-sm font-semibold">
              Order Value (₹) *
            </Label>
            <Input
              id="orderValue"
              data-ocid="new_order.order_value.input"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={orderValue}
              onChange={(e) => setOrderValue(e.target.value)}
              className="h-12 text-base"
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm font-semibold">
              Notes
            </Label>
            <Textarea
              id="notes"
              data-ocid="new_order.notes.textarea"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none text-base"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              data-ocid="new_order.submit_button"
              disabled={createOrder.isPending}
              className={cn(
                "w-full h-12 text-base font-semibold rounded-xl",
                "shadow-card",
              )}
            >
              {createOrder.isPending && (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              )}
              {createOrder.isPending ? "Creating Order..." : "Create Order"}
            </Button>
          </div>
        </form>
      </div>

      {/* Add Customer Dialog */}
      <AddCustomerDialog
        open={showAddCustomer}
        onClose={() => setShowAddCustomer(false)}
        onAdded={handleCustomerAdded}
      />
    </main>
  );
}
