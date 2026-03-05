import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddTransporter, useTransporters } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { ChevronUp, Loader2, MapPin, Phone, Plus, Truck } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";

export function Transporters() {
  const { data: transporters, isLoading } = useTransporters();
  const addTransporter = useAddTransporter();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [city, setCity] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactNumber.trim() || !city.trim()) {
      toast.error("All fields are required");
      return;
    }
    try {
      const transporter = await addTransporter.mutateAsync({
        name: name.trim(),
        contactNumber: contactNumber.trim(),
        city: city.trim(),
      });
      toast.success(`Transporter "${transporter.name}" added`);
      setName("");
      setContactNumber("");
      setCity("");
      setShowForm(false);
    } catch {
      toast.error("Failed to add transporter");
    }
  };

  return (
    <main data-ocid="transporters.page" className="min-h-screen content-area">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 pt-4 pb-4 sticky top-0 z-10">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-foreground">
              Transporters
            </h1>
            <p className="text-xs text-muted-foreground">
              {transporters?.length ?? 0} transporter
              {transporters?.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            data-ocid="transporters.add_transporter.open_modal_button"
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
                <Plus className="h-4 w-4" />
                Add
              </>
            )}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-5 space-y-4">
        {/* Add Transporter Form */}
        {showForm && (
          <section className="bg-card rounded-xl border border-primary/30 shadow-card p-4 animate-fade-in">
            <h2 className="text-sm font-semibold text-foreground mb-4">
              New Transporter
            </h2>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="trans-name" className="text-sm">
                  Transport Name *
                </Label>
                <Input
                  id="trans-name"
                  data-ocid="transporters.add.name.input"
                  placeholder="Company or person name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trans-contact" className="text-sm">
                  Contact Number *
                </Label>
                <Input
                  id="trans-contact"
                  data-ocid="transporters.add.contact.input"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="trans-city" className="text-sm">
                  City *
                </Label>
                <Input
                  id="trans-city"
                  data-ocid="transporters.add.city.input"
                  placeholder="Operating city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-11"
                  required
                />
              </div>
              <Button
                type="submit"
                data-ocid="transporters.add.submit_button"
                disabled={addTransporter.isPending}
                className="w-full h-11 font-semibold rounded-lg"
              >
                {addTransporter.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add Transporter
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
        {!isLoading && (!transporters || transporters.length === 0) && (
          <div
            data-ocid="transporters.empty_state"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Truck className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="font-semibold text-foreground mb-1">
              No transporters yet
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first transporter to get started
            </p>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="text-sm font-medium text-primary underline underline-offset-2"
            >
              Add a transporter
            </button>
          </div>
        )}

        {/* Transporter list */}
        {!isLoading && transporters && transporters.length > 0 && (
          <div data-ocid="transporters.list" className="space-y-3">
            {transporters.map((transporter, idx) => (
              <div
                key={transporter.id.toString()}
                data-ocid={`transporters.item.${idx + 1}`}
                className="bg-card rounded-xl border border-border shadow-card p-4"
              >
                <p className="font-semibold text-sm text-foreground mb-2">
                  {transporter.name}
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {transporter.contactNumber}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {transporter.city}
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
