import { OrderStatus } from "@/backend.d";
import { STATUS_OPTIONS, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
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
import { loadConfig } from "@/config";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useOrder, useUpdateOrderDispatch } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { StorageClient } from "@/utils/StorageClient";
import { HttpAgent } from "@icp-sdk/core/agent";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ImageIcon,
  Loader2,
  MessageCircle,
  Upload,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

function formatDateFromNano(nanoseconds: bigint): string {
  const ms = Number(nanoseconds) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatOrderValue(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function getTodayDateString(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-border last:border-0 gap-3">
      <span className="text-sm text-muted-foreground flex-shrink-0 w-32">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground text-right flex-1 min-w-0">
        {value || <span className="text-muted-foreground text-xs">—</span>}
      </span>
    </div>
  );
}

interface PhotoFieldProps {
  label: string;
  photoId: string;
  isUploading: boolean;
  onUpload: (file: File) => void;
  ocid: string;
}

function PhotoField({
  label,
  photoId,
  isUploading,
  onUpload,
  ocid,
}: PhotoFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          data-ocid={ocid}
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={cn(
            "flex items-center gap-2 rounded-lg border-2 border-dashed",
            "border-border bg-secondary px-4 py-3 text-sm font-medium",
            "touch-target transition-colors hover:border-primary hover:bg-primary/5",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : photoId ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <Upload className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-muted-foreground">
            {isUploading
              ? "Uploading..."
              : photoId
                ? "Replace Photo"
                : "Upload Photo"}
          </span>
        </button>
        {photoId && (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Uploaded
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams({ from: "/orders/$id" });
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { currentUser } = useCurrentUser();

  const orderId = React.useMemo(() => {
    try {
      return BigInt(id);
    } catch {
      return null;
    }
  }, [id]);

  const { data: order, isLoading, error } = useOrder(orderId);
  const updateOrder = useUpdateOrderDispatch();

  // Dispatch form state (initialized from order)
  const [lrNumber, setLrNumber] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [status, setStatus] = useState<OrderStatus>(
    OrderStatus.pendingDispatch,
  );
  const [billPhotoId, setBillPhotoId] = useState("");
  const [lrPhotoId, setLrPhotoId] = useState("");
  const [uploadingBill, setUploadingBill] = useState(false);
  const [uploadingLr, setUploadingLr] = useState(false);
  const [billPhotoUrl, setBillPhotoUrl] = useState<string | null>(null);
  const [lrPhotoUrl, setLrPhotoUrl] = useState<string | null>(null);

  // Sync form state when order loads
  useEffect(() => {
    if (order) {
      setLrNumber(order.lrNumber ?? "");
      setDispatchDate(order.dispatchDate ?? "");
      setStatus(order.status ?? OrderStatus.pendingDispatch);
      setBillPhotoId(order.billPhotoId ?? "");
      setLrPhotoId(order.lrPhotoId ?? "");
    }
  }, [order]);

  // Load photo URLs when photo IDs are available
  useEffect(() => {
    let cancelled = false;

    const loadPhotoUrls = async () => {
      if (!billPhotoId && !lrPhotoId) return;

      try {
        const config = await loadConfig();
        const agent = identity
          ? await HttpAgent.create({ identity, host: config.backend_host })
          : await HttpAgent.create({ host: config.backend_host });

        const storageClient = new StorageClient(
          "default",
          config.storage_gateway_url,
          config.backend_canister_id,
          config.project_id,
          agent,
        );

        if (billPhotoId && !cancelled) {
          try {
            const url = await storageClient.getDirectURL(billPhotoId);
            if (!cancelled) setBillPhotoUrl(url);
          } catch {
            // ignore URL load error
          }
        }

        if (lrPhotoId && !cancelled) {
          try {
            const url = await storageClient.getDirectURL(lrPhotoId);
            if (!cancelled) setLrPhotoUrl(url);
          } catch {
            // ignore URL load error
          }
        }
      } catch {
        // ignore config load error
      }
    };

    void loadPhotoUrls();
    return () => {
      cancelled = true;
    };
  }, [billPhotoId, lrPhotoId, identity]);

  const uploadPhoto = async (file: File, type: "bill" | "lr") => {
    const setUploading = type === "bill" ? setUploadingBill : setUploadingLr;
    setUploading(true);

    try {
      const config = await loadConfig();
      if (!identity) throw new Error("Please log in to upload photos");

      const agent = await HttpAgent.create({
        identity,
        host: config.backend_host,
      });
      const storageClient = new StorageClient(
        "default",
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );

      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const { hash } = await storageClient.putFile(bytes);

      if (type === "bill") {
        setBillPhotoId(hash);
      } else {
        // LR photo uploaded: auto-set status to Dispatched and today's date
        setLrPhotoId(hash);
        setStatus(OrderStatus.dispatched);
        setDispatchDate(getTodayDateString());
        toast.info("Status automatically set to Dispatched");
      }

      toast.success(
        `${type === "bill" ? "Bill" : "LR"} photo uploaded successfully`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!order) return;

    try {
      await updateOrder.mutateAsync({
        id: order.id,
        lrNumber,
        dispatchDate,
        status,
        billPhotoId,
        lrPhotoId,
        lastUpdatedBy: currentUser?.email ?? "",
      });
      toast.success("Order updated successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update order",
      );
    }
  };

  const canSendWhatsApp =
    order && (order.lrNumber || lrNumber || order.dispatchDate || dispatchDate);

  const buildWhatsAppMessage = () => {
    if (!order) return "";
    const finalLrNumber = lrNumber || order.lrNumber || "—";
    const finalDispatchDate = dispatchDate || order.dispatchDate || "—";
    const message = `Hello ${order.customerName},\n\nYour order has been dispatched.\n\nOrder Number: ${order.orderNumber}\nTransport: ${order.transporterName}\nLR Number: ${finalLrNumber}\nDispatch Date: ${finalDispatchDate}\n\nBill and LR copy attached.\n\nThank you.`;
    return message;
  };

  const handleWhatsApp = () => {
    if (!order) return;
    const phone = order.customerPhone.replace(/\D/g, "");
    const message = encodeURIComponent(buildWhatsAppMessage());
    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen content-area">
        <header className="bg-card border-b border-border px-4 pt-4 pb-4 sticky top-0 z-10">
          <div className="mx-auto max-w-lg flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24 mt-1" />
            </div>
          </div>
        </header>
        <div className="mx-auto max-w-lg px-4 py-5 space-y-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen content-area">
        <div className="mx-auto max-w-lg px-4 py-10 text-center">
          <p className="text-destructive font-medium">Order not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void navigate({ to: "/orders" })}
          >
            Back to Orders
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main data-ocid="order_detail.page" className="min-h-screen content-area">
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-display font-bold text-foreground truncate">
                {order.orderNumber}
              </h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDateFromNano(order.orderDate)}
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-5 space-y-4">
        {/* Order Details Card */}
        <section className="bg-card rounded-xl border border-border shadow-card p-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Order Details
          </h2>
          <div className="divide-y divide-border">
            <DetailRow label="Order No." value={order.orderNumber} />
            <DetailRow
              label="Order Date"
              value={formatDateFromNano(order.orderDate)}
            />
            <DetailRow label="Salesperson" value={order.salesperson} />
            <DetailRow
              label="Order Value"
              value={
                <span className="font-bold text-primary">
                  {formatOrderValue(order.orderValue)}
                </span>
              }
            />
            {order.createdBy && (
              <DetailRow label="Created By" value={order.createdBy} />
            )}
            {order.lastUpdatedBy && (
              <DetailRow label="Updated By" value={order.lastUpdatedBy} />
            )}
          </div>
        </section>

        {/* Customer Card */}
        <section className="bg-card rounded-xl border border-border shadow-card p-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Customer
          </h2>
          <div className="divide-y divide-border">
            <DetailRow label="Name" value={order.customerName} />
            <DetailRow
              label="Phone"
              value={
                <a
                  href={`tel:${order.customerPhone}`}
                  className="text-primary underline underline-offset-2"
                >
                  {order.customerPhone}
                </a>
              }
            />
            <DetailRow label="City" value={order.customerCity} />
          </div>
        </section>

        {/* Transport & Dispatch Card */}
        <section className="bg-card rounded-xl border border-border shadow-card p-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Transport & Dispatch
          </h2>
          <div className="divide-y divide-border">
            <DetailRow label="Transporter" value={order.transporterName} />
            <DetailRow label="LR Number" value={order.lrNumber || null} />
            <DetailRow
              label="Dispatch Date"
              value={order.dispatchDate || null}
            />
          </div>
        </section>

        {/* Photos Card */}
        {(billPhotoUrl || lrPhotoUrl) && (
          <section className="bg-card rounded-xl border border-border shadow-card p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Photos
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {billPhotoUrl && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Bill Photo
                  </p>
                  <a
                    href={billPhotoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={billPhotoUrl}
                      alt="Bill"
                      className="w-full aspect-square object-cover rounded-lg border border-border"
                    />
                  </a>
                </div>
              )}
              {lrPhotoUrl && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">LR Photo</p>
                  <a
                    href={lrPhotoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={lrPhotoUrl}
                      alt="LR"
                      className="w-full aspect-square object-cover rounded-lg border border-border"
                    />
                  </a>
                </div>
              )}
              {!billPhotoUrl && (
                <div className="flex flex-col items-center justify-center aspect-square rounded-lg border border-dashed border-border bg-secondary">
                  <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground mt-1">No bill</p>
                </div>
              )}
              {!lrPhotoUrl && (
                <div className="flex flex-col items-center justify-center aspect-square rounded-lg border border-dashed border-border bg-secondary">
                  <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground mt-1">No LR</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Notes */}
        {order.notes && (
          <section className="bg-card rounded-xl border border-border shadow-card p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Notes
            </h2>
            <p className="text-sm text-foreground">{order.notes}</p>
          </section>
        )}

        {/* Update Dispatch Section */}
        <section className="bg-card rounded-xl border border-border shadow-card p-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Update Dispatch
          </h2>

          <div className="space-y-4">
            {/* LR Number */}
            <div className="space-y-1.5">
              <Label htmlFor="lrNumber" className="text-sm font-semibold">
                LR Number
              </Label>
              <Input
                id="lrNumber"
                data-ocid="order_detail.update.lr_number.input"
                placeholder="Enter LR number"
                value={lrNumber}
                onChange={(e) => setLrNumber(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Dispatch Date */}
            <div className="space-y-1.5">
              <Label htmlFor="dispatchDate" className="text-sm font-semibold">
                Dispatch Date
              </Label>
              <Input
                id="dispatchDate"
                data-ocid="order_detail.update.dispatch_date.input"
                type="date"
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as OrderStatus)}
              >
                <SelectTrigger
                  data-ocid="order_detail.update.status.select"
                  className="h-11"
                >
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bill Photo Upload */}
            <PhotoField
              label="Bill Photo"
              photoId={billPhotoId}
              isUploading={uploadingBill}
              onUpload={(file) => void uploadPhoto(file, "bill")}
              ocid="order_detail.update.bill_photo.upload_button"
            />

            {/* LR Photo Upload */}
            <PhotoField
              label="LR Photo"
              photoId={lrPhotoId}
              isUploading={uploadingLr}
              onUpload={(file) => void uploadPhoto(file, "lr")}
              ocid="order_detail.update.lr_photo.upload_button"
            />

            {/* Save Button */}
            <Button
              type="button"
              data-ocid="order_detail.update.save_button"
              onClick={() => void handleSave()}
              disabled={updateOrder.isPending}
              className="w-full h-12 text-base font-semibold rounded-xl shadow-card"
            >
              {updateOrder.isPending && (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              )}
              {updateOrder.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </section>

        {/* WhatsApp Button */}
        {canSendWhatsApp && (
          <button
            type="button"
            data-ocid="order_detail.whatsapp.button"
            onClick={handleWhatsApp}
            className={cn(
              "w-full flex items-center justify-center gap-3 rounded-xl",
              "bg-[#25D366] text-white font-semibold text-base",
              "h-12 shadow-card",
              "active:scale-[0.98] transition-transform duration-100",
            )}
          >
            <MessageCircle className="h-5 w-5" />
            Send Dispatch Details to Customer
          </button>
        )}
      </div>
    </main>
  );
}
