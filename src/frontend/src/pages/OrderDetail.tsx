import { OrderPriority, OrderStatus, UserRole } from "@/backend.d";
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
import {
  useCompanySettings,
  useOrder,
  useUpdateOrderDispatch,
  useUpdateOrderInfo,
} from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { StorageClient } from "@/utils/StorageClient";
import { HttpAgent } from "@icp-sdk/core/agent";
import { useNavigate, useParams } from "@tanstack/react-router";
import jsPDF from "jspdf";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  FilePlus,
  FileText,
  ImageIcon,
  Loader2,
  Lock,
  MessageCircle,
  Paperclip,
  Upload,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { PRIORITY_OPTIONS, PriorityBadge } from "./NewOrder";

function formatDateFromNano(nanoseconds: bigint): string {
  const ms = Number(nanoseconds) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTimeFromNano(nanoseconds: bigint): string {
  const ms = Number(nanoseconds) / 1_000_000;
  const date = new Date(ms);
  const datePart = date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart}, ${timePart}`;
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

interface FlexibleUploadFieldProps {
  label: string;
  fileId: string;
  isUploading: boolean;
  onUpload: (file: File) => void;
  ocid: string;
  /** Preview URL for already-uploaded file (from storage) */
  previewUrl?: string | null;
}

function FlexibleUploadField({
  label,
  fileId,
  isUploading,
  onUpload,
  ocid,
  previewUrl,
}: FlexibleUploadFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = React.useState<{
    url: string;
    isPdf: boolean;
  } | null>(null);

  // Clean up local object URL when component unmounts or file changes
  React.useEffect(() => {
    return () => {
      if (localPreview?.url) URL.revokeObjectURL(localPreview.url);
    };
  }, [localPreview?.url]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local preview
    if (localPreview?.url) URL.revokeObjectURL(localPreview.url);
    const isPdf = file.type === "application/pdf";
    if (!isPdf) {
      setLocalPreview({ url: URL.createObjectURL(file), isPdf: false });
    } else {
      setLocalPreview({ url: "", isPdf: true });
    }

    onUpload(file);
  };

  const hasFile = !!fileId;

  // Determine what to show for preview
  const showImagePreview =
    localPreview && !localPreview.isPdf && localPreview.url;
  const showPdfBadge = localPreview?.isPdf;
  const showStoredPreview = !localPreview && hasFile && previewUrl;

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
          ) : showPdfBadge ||
            (hasFile && !showImagePreview && !showStoredPreview) ? (
            <FileText className="h-4 w-4 text-orange-500" />
          ) : hasFile ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <Upload className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-muted-foreground">
            {isUploading
              ? "Uploading..."
              : hasFile
                ? "Replace File"
                : "Upload Photo or PDF"}
          </span>
        </button>

        {/* Preview / status */}
        {showImagePreview && (
          <img
            src={showImagePreview}
            alt={label}
            className="w-12 h-12 rounded-lg object-cover border border-border flex-shrink-0"
          />
        )}
        {showStoredPreview && (
          <a href={showStoredPreview} target="_blank" rel="noopener noreferrer">
            <img
              src={showStoredPreview}
              alt={label}
              className="w-12 h-12 rounded-lg object-cover border border-border flex-shrink-0"
            />
          </a>
        )}
        {showPdfBadge && (
          <span className="flex items-center gap-1 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1">
            <FileText className="h-3 w-3" />
            PDF
          </span>
        )}
        {hasFile && !isUploading && !localPreview && !showStoredPreview && (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Uploaded
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
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
  const updateOrderInfo = useUpdateOrderInfo();
  const { data: companySettings } = useCompanySettings();

  // Whether this order is locked for staff
  const isDispatchedLocked =
    order?.status === OrderStatus.dispatched &&
    currentUser?.role === UserRole.staff;

  // Dispatch form state (initialized from order)
  const [lrNumber, setLrNumber] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [deliveredDate, setDeliveredDate] = useState("");
  const [status, setStatus] = useState<OrderStatus>(
    OrderStatus.pendingDispatch,
  );
  const [priority, setPriority] = useState<OrderPriority>(OrderPriority.normal);
  const [billPhotoId, setBillPhotoId] = useState("");
  const [lrPhotoId, setLrPhotoId] = useState("");
  const [otherDocId, setOtherDocId] = useState("");
  const [uploadingBill, setUploadingBill] = useState(false);
  const [uploadingLr, setUploadingLr] = useState(false);
  const [uploadingOtherDoc, setUploadingOtherDoc] = useState(false);
  const [billPhotoUrl, setBillPhotoUrl] = useState<string | null>(null);
  const [lrPhotoUrl, setLrPhotoUrl] = useState<string | null>(null);
  const [dispatchPdfId, setDispatchPdfId] = useState("");
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [viewingPdf, setViewingPdf] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  // Attachment URLs for display in the Attachments card
  const [attachmentUrls, setAttachmentUrls] = useState<{
    other: string | null;
  }>({ other: null });

  // Sync form state when order loads
  useEffect(() => {
    if (order) {
      setLrNumber(order.lrNumber ?? "");
      setDispatchDate(order.dispatchDate ?? "");
      setDeliveredDate(order.deliveredDate ?? "");
      setStatus(order.status ?? OrderStatus.pendingDispatch);
      setBillPhotoId(order.billPhotoId ?? "");
      setLrPhotoId(order.lrPhotoId ?? "");
      setOtherDocId(order.otherDocId ?? "");
      setPriority(order.priority ?? OrderPriority.normal);
      setDispatchPdfId(order.dispatchPdfId ?? "");
    }
  }, [order]);

  // Auto-set delivered date when status changes to delivered
  const handleStatusChange = (newStatus: OrderStatus) => {
    setStatus(newStatus);
    if (newStatus === OrderStatus.delivered && !deliveredDate) {
      setDeliveredDate(getTodayDateString());
    }
  };

  // Load photo/attachment URLs when IDs are available
  useEffect(() => {
    let cancelled = false;

    const loadUrls = async () => {
      const idsToLoad = [billPhotoId, lrPhotoId, otherDocId];
      if (!idsToLoad.some(Boolean)) return;

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

        const loadUrl = async (id: string) => {
          if (!id) return null;
          try {
            return await storageClient.getDirectURL(id);
          } catch {
            return null;
          }
        };

        const [billUrl, lrUrl, otherUrl] = await Promise.all([
          loadUrl(billPhotoId),
          loadUrl(lrPhotoId),
          loadUrl(otherDocId),
        ]);

        if (!cancelled) {
          setBillPhotoUrl(billUrl);
          setLrPhotoUrl(lrUrl);
          setAttachmentUrls({
            other: otherUrl,
          });
        }
      } catch {
        // ignore config load error
      }
    };

    void loadUrls();
    return () => {
      cancelled = true;
    };
  }, [billPhotoId, lrPhotoId, otherDocId, identity]);

  const createStorageClient = async () => {
    const config = await loadConfig();
    if (!identity) throw new Error("Please log in to upload files");
    const agent = await HttpAgent.create({
      identity,
      host: config.backend_host,
    });
    return new StorageClient(
      "default",
      config.storage_gateway_url,
      config.backend_canister_id,
      config.project_id,
      agent,
    );
  };

  // ─── PDF Generation ─────────────────────────────────────────────────────────

  const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const generateDispatchPdf = async (): Promise<string> => {
    if (!order) throw new Error("Order not found");
    if (!identity) throw new Error("Please log in to generate PDF");

    const storageClient = await createStorageClient();

    // Load all images in parallel
    let logoBase64: string | null = null;
    let billBase64: string | null = null;
    let lrBase64: string | null = null;

    const [logoUrl, billUrl, lrUrl] = await Promise.all([
      companySettings?.companyLogoId
        ? storageClient
            .getDirectURL(companySettings.companyLogoId)
            .catch(() => null)
        : Promise.resolve(null),
      billPhotoId
        ? storageClient.getDirectURL(billPhotoId).catch(() => null)
        : Promise.resolve(billPhotoUrl),
      lrPhotoId
        ? storageClient.getDirectURL(lrPhotoId).catch(() => null)
        : Promise.resolve(lrPhotoUrl),
    ]);

    if (logoUrl) logoBase64 = await fetchImageAsBase64(logoUrl);
    if (billUrl) billBase64 = await fetchImageAsBase64(billUrl);
    if (lrUrl) lrBase64 = await fetchImageAsBase64(lrUrl);

    // ── Build PDF ────────────────────────────────────────────────────────────
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const pageW = 210;
    const pageH = 297;
    const marginL = 15;
    const marginR = 15;
    const contentW = pageW - marginL - marginR;
    const footerH = 14;
    const footerY = pageH - footerH;

    const addFooter = (pageNum: number, totalPages: number) => {
      pdf.setFillColor(248, 249, 250);
      pdf.rect(0, footerY, pageW, footerH, "F");
      pdf.setDrawColor(220, 220, 220);
      pdf.line(marginL, footerY + 1, pageW - marginR, footerY + 1);
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 100, 100);
      const footerParts = [
        companySettings?.companyPhone,
        companySettings?.companyEmail,
        companySettings?.companyAddress,
      ].filter(Boolean);
      const footerText =
        footerParts.length > 0
          ? footerParts.join("  |  ")
          : (companySettings?.companyName ?? "Dispatch Details");
      const footerLines = pdf.splitTextToSize(footerText, contentW);
      pdf.text(footerLines[0] ?? footerText, pageW / 2, footerY + 5, {
        align: "center",
      });
      if (footerLines.length > 1) {
        pdf.text(footerLines[1], pageW / 2, footerY + 9, { align: "center" });
      }
      pdf.setFontSize(7);
      pdf.text(
        `Page ${pageNum} of ${totalPages}`,
        pageW - marginR,
        footerY + 5,
        { align: "right" },
      );
    };

    let curY = 15;

    // ── Header ───────────────────────────────────────────────────────────────
    const logoSize = 22;
    let headerTextX = marginL;

    if (logoBase64) {
      try {
        pdf.addImage(logoBase64, "JPEG", marginL, curY - 2, logoSize, logoSize);
        headerTextX = marginL + logoSize + 5;
      } catch {
        // ignore logo image error
      }
    }

    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(30, 30, 30);
    const companyNameText = companySettings?.companyName ?? "Company";
    pdf.text(companyNameText, headerTextX, curY + 5);

    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(90, 90, 90);
    pdf.text("Dispatch Details", headerTextX, curY + 12);

    curY = Math.max(curY + logoSize + 2, curY + 20);

    // Divider line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    pdf.line(marginL, curY, pageW - marginR, curY);
    curY += 8;

    // ── Order Information ────────────────────────────────────────────────────
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 100, 100);
    pdf.text("ORDER INFORMATION", marginL, curY);
    curY += 5;

    const infoRows: [string, string][] = [
      ["Order Number", order.orderNumber],
      ["Order Date", formatDateFromNano(order.orderDate)],
      ["Customer Name", order.customerName],
      ["Customer Phone", order.customerPhone],
      ["Transport Name", order.transporterName],
      ["LR Number", lrNumber || order.lrNumber || "—"],
      ["Dispatch Date", dispatchDate || order.dispatchDate || "—"],
    ];

    const rowH = 8;
    const labelW = 55;

    infoRows.forEach(([label, value], i) => {
      const rowY = curY + i * rowH;
      // Alternating row bg
      if (i % 2 === 0) {
        pdf.setFillColor(248, 249, 250);
        pdf.rect(marginL, rowY - 4, contentW, rowH, "F");
      }
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(80, 80, 80);
      pdf.text(label, marginL + 3, rowY);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(30, 30, 30);
      pdf.text(value, marginL + labelW, rowY);
    });

    curY += infoRows.length * rowH + 8;

    // Border around info table
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.3);
    pdf.rect(
      marginL,
      curY - infoRows.length * rowH - 12,
      contentW,
      infoRows.length * rowH + 4,
    );

    const maxContentY = footerY - 5;

    // ── Document Images ──────────────────────────────────────────────────────
    const addDocImage = (title: string, base64: string | null) => {
      if (!base64) return;

      if (curY + 15 > maxContentY) {
        pdf.addPage();
        curY = 15;
      }

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 30, 30);
      pdf.text(title, marginL, curY);
      curY += 5;

      try {
        // Try to fit image with max height
        const maxImgW = contentW;
        const maxImgH = Math.min(maxContentY - curY - 5, 120);

        // Create an in-memory image to get dimensions
        const img = new Image();
        img.src = base64;

        let imgW = maxImgW;
        let imgH = maxImgH;

        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
          const ratio = img.naturalWidth / img.naturalHeight;
          imgW = Math.min(maxImgW, maxImgH * ratio);
          imgH = imgW / ratio;
          if (imgH > maxImgH) {
            imgH = maxImgH;
            imgW = imgH * ratio;
          }
        }

        if (curY + imgH > maxContentY) {
          pdf.addPage();
          curY = 15;
        }

        pdf.addImage(base64, "JPEG", marginL, curY, imgW, imgH);
        curY += imgH + 8;
      } catch {
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "italic");
        pdf.setTextColor(150, 150, 150);
        pdf.text("(Image could not be loaded)", marginL, curY);
        curY += 8;
      }
    };

    if (billBase64 || lrBase64) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(100, 100, 100);
      pdf.text("DOCUMENTS", marginL, curY);
      curY += 5;

      addDocImage("Bill Copy", billBase64);
      addDocImage("LR Copy", lrBase64);
    }

    // ── Add footers to all pages ─────────────────────────────────────────────
    const totalPages = pdf.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      pdf.setPage(p);
      addFooter(p, totalPages);
    }

    // ── Upload PDF to storage ────────────────────────────────────────────────
    const pdfArrayBuffer = pdf.output("arraybuffer");
    const pdfBytes = new Uint8Array(pdfArrayBuffer);
    const { hash } = await storageClient.putFile(pdfBytes);
    return hash;
  };

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    try {
      const pdfId = await generateDispatchPdf();
      setDispatchPdfId(pdfId);
      toast.success("Dispatch PDF generated successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate PDF",
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  const fetchPdfBlob = async (): Promise<Blob | null> => {
    if (!dispatchPdfId) return null;
    try {
      const storageClient = await createStorageClient();
      const url = await storageClient.getDirectURL(dispatchPdfId);
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const arrayBuffer = await resp.arrayBuffer();
      return new Blob([arrayBuffer], { type: "application/pdf" });
    } catch {
      return null;
    }
  };

  const handleViewPdf = async () => {
    setViewingPdf(true);
    try {
      const blob = await fetchPdfBlob();
      if (!blob) {
        toast.error("Could not load PDF. Please try downloading instead.");
        return;
      }
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoke after a short delay to free memory
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch {
      toast.error("Failed to open PDF. Please try downloading instead.");
    } finally {
      setViewingPdf(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const blob = await fetchPdfBlob();
      if (!blob) {
        toast.error("Could not download PDF. Please try again.");
        return;
      }
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `dispatch-${order?.orderNumber ?? "pdf"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch {
      toast.error("Failed to download PDF. Please try again.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  type UploadType = "bill" | "lr" | "other";

  const uploadFile = async (file: File, type: UploadType) => {
    const setUploadingMap: Record<UploadType, (v: boolean) => void> = {
      bill: setUploadingBill,
      lr: setUploadingLr,
      other: setUploadingOtherDoc,
    };
    const labelMap: Record<UploadType, string> = {
      bill: "Bill photo",
      lr: "LR photo",
      other: "Document",
    };

    setUploadingMap[type](true);

    try {
      const storageClient = await createStorageClient();
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const { hash } = await storageClient.putFile(bytes);

      switch (type) {
        case "bill":
          setBillPhotoId(hash);
          break;
        case "lr":
          setLrPhotoId(hash);
          // Auto-set status to Dispatched and today's date
          setStatus(OrderStatus.dispatched);
          setDispatchDate(getTodayDateString());
          toast.info("Status automatically set to Dispatched");
          break;
        case "other":
          setOtherDocId(hash);
          break;
      }

      toast.success(`${labelMap[type]} uploaded successfully`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingMap[type](false);
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
        deliveredDate,
        invoiceDocId: "",
        packingListId: "",
        transportReceiptId: "",
        otherDocId,
        dispatchPdfId,
      });

      // If priority changed, also update order info
      if (priority !== order.priority) {
        await updateOrderInfo.mutateAsync({
          id: order.id,
          salesperson: order.salesperson,
          customerId: order.customerId,
          transporterId: order.transporterId,
          orderValue: order.orderValue,
          notes: order.notes,
          priority,
          lastUpdatedBy: currentUser?.email ?? "",
        });
      }

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
            <DetailRow
              label="Priority"
              value={
                order.priority && order.priority !== OrderPriority.normal ? (
                  <PriorityBadge priority={order.priority} />
                ) : (
                  <span className="text-muted-foreground text-xs">Normal</span>
                )
              }
            />
            {order.createdBy && (
              <DetailRow label="Created By" value={order.createdBy} />
            )}
            {order.lastUpdatedBy && (
              <DetailRow label="Updated By" value={order.lastUpdatedBy} />
            )}
            {order.lastUpdatedTime > BigInt(0) && (
              <DetailRow
                label="Last Updated"
                value={formatDateTimeFromNano(order.lastUpdatedTime)}
              />
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
            {order.deliveredDate && (
              <DetailRow label="Delivered Date" value={order.deliveredDate} />
            )}
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

        {/* Attachments Card — show stored other document */}
        {(attachmentUrls.other || order.otherDocId) && (
          <section className="bg-card rounded-xl border border-border shadow-card p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Paperclip className="h-3.5 w-3.5" />
              Attachments
            </h2>
            <div className="space-y-2">
              {order.otherDocId && (
                <div className="flex items-center gap-3">
                  {attachmentUrls.other ? (
                    <a
                      href={attachmentUrls.other}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      Other Document
                    </a>
                  ) : (
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4 flex-shrink-0" />
                      Other Document
                    </span>
                  )}
                  <span className="text-xs text-green-600 font-medium flex items-center gap-1 ml-auto">
                    <CheckCircle2 className="h-3 w-3" />
                    Uploaded
                  </span>
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

          {/* Dispatch lock banner for staff on dispatched orders */}
          {isDispatchedLocked && (
            <div
              data-ocid="order_detail.dispatch_lock.panel"
              className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 mb-4"
            >
              <Lock className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800">
                  Order Locked
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  This order is dispatched. Some fields are locked. Contact an
                  admin to make changes.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Priority */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Priority</Label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as OrderPriority)}
                disabled={isDispatchedLocked}
              >
                <SelectTrigger
                  data-ocid="order_detail.update.priority.select"
                  className="h-11"
                  disabled={isDispatchedLocked}
                >
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                onValueChange={(v) => handleStatusChange(v as OrderStatus)}
                disabled={isDispatchedLocked}
              >
                <SelectTrigger
                  data-ocid="order_detail.update.status.select"
                  className="h-11"
                  disabled={isDispatchedLocked}
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

            {/* Delivered Date — shown only when status is Delivered */}
            {status === OrderStatus.delivered && (
              <div className="space-y-1.5">
                <Label
                  htmlFor="deliveredDate"
                  className="text-sm font-semibold"
                >
                  Delivered Date
                </Label>
                <Input
                  id="deliveredDate"
                  data-ocid="order_detail.update.delivered_date.input"
                  type="date"
                  value={deliveredDate}
                  onChange={(e) => setDeliveredDate(e.target.value)}
                  className="h-11"
                />
              </div>
            )}

            {/* Bill Photo Upload */}
            <FlexibleUploadField
              label="Bill Photo"
              fileId={billPhotoId}
              isUploading={uploadingBill}
              onUpload={(file) => void uploadFile(file, "bill")}
              ocid="order_detail.update.bill_photo.upload_button"
              previewUrl={billPhotoUrl}
            />

            {/* LR Photo Upload */}
            <FlexibleUploadField
              label="LR Photo"
              fileId={lrPhotoId}
              isUploading={uploadingLr}
              onUpload={(file) => void uploadFile(file, "lr")}
              ocid="order_detail.update.lr_photo.upload_button"
              previewUrl={lrPhotoUrl}
            />

            {/* Other Documents */}
            <FlexibleUploadField
              label="Other Documents"
              fileId={otherDocId}
              isUploading={uploadingOtherDoc}
              onUpload={(file) => void uploadFile(file, "other")}
              ocid="order_detail.update.other_doc.upload_button"
              previewUrl={attachmentUrls.other}
            />

            {/* Generate & Save Dispatch PDF */}
            <div className="space-y-2">
              <Button
                type="button"
                data-ocid="order_detail.generate_pdf.button"
                variant="outline"
                onClick={() => void handleGeneratePdf()}
                disabled={generatingPdf}
                className="w-full h-11 font-semibold rounded-xl border-dashed border-2"
              >
                {generatingPdf ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FilePlus className="mr-2 h-4 w-4" />
                    Generate &amp; Save Dispatch PDF
                  </>
                )}
              </Button>
              {dispatchPdfId && !generatingPdf && (
                <p className="text-xs text-green-600 text-center flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  PDF saved — click Save Changes to link it to this order
                </p>
              )}
            </div>

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
          <div className="space-y-2">
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
            {dispatchPdfId && (
              <p className="text-xs text-center text-muted-foreground">
                Dispatch PDF ready — attach it in WhatsApp before sending.
              </p>
            )}
          </div>
        )}

        {/* PDF View / Download */}
        {dispatchPdfId && (
          <section className="bg-card rounded-xl border border-border shadow-card p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Dispatch PDF
            </h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void handleViewPdf()}
                disabled={viewingPdf || downloadingPdf}
                data-ocid="order_detail.view_pdf.button"
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-xl",
                  "border border-border bg-secondary text-foreground",
                  "h-11 text-sm font-semibold",
                  "hover:bg-secondary/80 transition-colors disabled:opacity-60",
                )}
              >
                {viewingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {viewingPdf ? "Loading..." : "View PDF"}
              </button>
              <button
                type="button"
                onClick={() => void handleDownloadPdf()}
                disabled={viewingPdf || downloadingPdf}
                data-ocid="order_detail.download_pdf.button"
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 rounded-xl",
                  "border border-border bg-secondary text-foreground",
                  "h-11 text-sm font-semibold",
                  "hover:bg-secondary/80 transition-colors disabled:opacity-60",
                )}
              >
                {downloadingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {downloadingPdf ? "Downloading..." : "Download PDF"}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
