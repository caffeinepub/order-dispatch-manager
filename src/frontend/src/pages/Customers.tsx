import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddCustomer, useCustomers } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import {
  ChevronUp,
  Loader2,
  MapPin,
  Phone,
  UserPlus,
  Users,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";

export function Customers() {
  const { data: customers, isLoading } = useCustomers();
  const addCustomer = useAddCustomer();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

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
      setName("");
      setPhone("");
      setCity("");
      setShowForm(false);
    } catch {
      toast.error("Failed to add customer");
    }
  };

  return (
    <main data-ocid="customers.page" className="min-h-screen content-area">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 pt-4 pb-4 sticky top-0 z-10">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              Customers
            </h1>
            <p className="text-xs text-muted-foreground">
              {customers?.length ?? 0} customer
              {customers?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            data-ocid="customers.add_customer.open_modal_button"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold touch-target",
              "transition-colors active:scale-95",
              showForm
                ? "bg-secondary text-secondary-foreground"
                : "bg-primary text-primary-foreground shadow-card",
            )}
          >
            {showForm ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Add
              </>
            )}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-5 space-y-4">
        {/* Add Customer Form */}
        {showForm && (
          <section className="bg-card rounded-xl border border-primary/30 shadow-card p-4 animate-fade-in">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              New Customer
            </h2>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="cust-name" className="text-sm">
                  Customer Name *
                </Label>
                <Input
                  id="cust-name"
                  data-ocid="customers.add.name.input"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust-phone" className="text-sm">
                  Phone Number *
                </Label>
                <Input
                  id="cust-phone"
                  data-ocid="customers.add.phone.input"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cust-city" className="text-sm">
                  City *
                </Label>
                <Input
                  id="cust-city"
                  data-ocid="customers.add.city.input"
                  placeholder="City name"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <Button
                type="submit"
                data-ocid="customers.add.submit_button"
                disabled={addCustomer.isPending}
                className="w-full h-11 font-semibold rounded-lg"
              >
                {addCustomer.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Customer
              </Button>
            </form>
          </section>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!customers || customers.length === 0) && (
          <div
            data-ocid="customers.empty_state"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="font-semibold text-foreground mb-1">
              No customers yet
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first customer to get started
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-sm font-medium text-primary underline underline-offset-2"
            >
              Add a customer
            </button>
          </div>
        )}

        {/* Customer list */}
        {!isLoading && customers && customers.length > 0 && (
          <div data-ocid="customers.list" className="space-y-3">
            {customers.map((customer, idx) => (
              <div
                key={customer.id.toString()}
                data-ocid={`customers.item.${idx + 1}`}
                className="bg-card rounded-xl border border-border shadow-card p-4"
              >
                <p className="font-semibold text-sm text-foreground mb-2">
                  {customer.name}
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {customer.phone}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {customer.city}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
