import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { loadConfig } from "@/config";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useCompanySettings, useSaveCompanySettings } from "@/hooks/useQueries";
import { StorageClient } from "@/utils/StorageClient";
import { HttpAgent } from "@icp-sdk/core/agent";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Upload,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export function CompanySettings() {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useCurrentUser();
  const { identity } = useInternetIdentity();

  const { data: settings, isLoading } = useCompanySettings();
  const saveSettings = useSaveCompanySettings();

  const [companyName, setCompanyName] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");
  const [companyLogoId, setCompanyLogoId] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Pre-fill form from loaded settings
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName ?? "");
      setCompanyPhone(settings.companyPhone ?? "");
      setCompanyEmail(settings.companyEmail ?? "");
      setCompanyAddress(settings.companyAddress ?? "");
      setCompanyLogoId(settings.companyLogoId ?? "");
    }
  }, [settings]);

  // Load logo URL when logoId changes
  useEffect(() => {
    if (!companyLogoId) {
      setLogoUrl(null);
      return;
    }
    let cancelled = false;

    const loadLogo = async () => {
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
        const url = await storageClient.getDirectURL(companyLogoId);
        if (!cancelled) setLogoUrl(url);
      } catch {
        if (!cancelled) setLogoUrl(null);
      }
    };

    void loadLogo();
    return () => {
      cancelled = true;
    };
  }, [companyLogoId, identity]);

  const handleLogoUpload = async (file: File) => {
    if (!identity) {
      toast.error("Please log in to upload files");
      return;
    }
    setUploadingLogo(true);
    try {
      const config = await loadConfig();
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
      setCompanyLogoId(hash);
      // Show local preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      toast.success("Logo uploaded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Logo upload failed");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!companyName.trim()) {
      toast.error("Company name is required");
      return;
    }
    try {
      await saveSettings.mutateAsync({
        companyName: companyName.trim(),
        companyPhone: companyPhone.trim(),
        companyEmail: companyEmail.trim(),
        companyAddress: companyAddress.trim(),
        companyLogoId,
      });
      toast.success("Company settings saved successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save settings",
      );
    }
  };

  // Admin-only guard
  if (!isAdmin && currentUser !== null) {
    return (
      <main className="min-h-screen content-area">
        <header className="bg-card border-b border-border px-4 pt-4 pb-4 sticky top-0 z-10">
          <div className="mx-auto max-w-lg flex items-center gap-3">
            <button
              type="button"
              onClick={() => void navigate({ to: "/" })}
              className="touch-target flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-display font-bold text-foreground">
              Company Settings
            </h1>
          </div>
        </header>
        <div className="mx-auto max-w-lg px-4 py-10 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-foreground font-semibold mb-1">Admin Only</p>
          <p className="text-sm text-muted-foreground">
            Only administrators can manage company settings.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      data-ocid="company_settings.page"
      className="min-h-screen content-area"
    >
      {/* Header */}
      <header className="bg-card border-b border-border px-4 pt-4 pb-4 sticky top-0 z-10">
        <div className="mx-auto max-w-lg flex items-center gap-3">
          <button
            type="button"
            onClick={() => void navigate({ to: "/" })}
            className="touch-target flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-display font-bold text-foreground">
              Company Settings
            </h1>
            <p className="text-xs text-muted-foreground">
              Branding used in Dispatch PDFs
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-5 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        ) : (
          <>
            {/* Company Logo Section */}
            <section className="bg-card rounded-xl border border-border shadow-card p-4 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Company Logo
              </h2>

              <div className="flex items-center gap-4">
                {/* Logo preview */}
                <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Company logo"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Upload your company logo. It will appear at the top of every
                    Dispatch PDF.
                  </p>
                  <button
                    type="button"
                    data-ocid="company_settings.logo.upload_button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="flex items-center gap-2 rounded-lg border-2 border-dashed border-border bg-secondary px-4 py-2.5 text-sm font-medium hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : companyLogoId ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Upload className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-muted-foreground">
                      {uploadingLogo
                        ? "Uploading..."
                        : companyLogoId
                          ? "Replace Logo"
                          : "Upload Logo"}
                    </span>
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void handleLogoUpload(file);
                    }}
                  />
                </div>
              </div>
            </section>

            {/* Company Info Section */}
            <section className="bg-card rounded-xl border border-border shadow-card p-4 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Company Information
              </h2>

              <div className="space-y-1.5">
                <Label
                  htmlFor="companyName"
                  className="text-sm font-semibold flex items-center gap-1.5"
                >
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  data-ocid="company_settings.name.input"
                  placeholder="e.g. ABC Trading Co."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="companyPhone"
                  className="text-sm font-semibold flex items-center gap-1.5"
                >
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Company Phone
                </Label>
                <Input
                  id="companyPhone"
                  data-ocid="company_settings.phone.input"
                  placeholder="e.g. +91 98765 43210"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  className="h-11"
                  type="tel"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="companyEmail"
                  className="text-sm font-semibold flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                  Company Email
                </Label>
                <Input
                  id="companyEmail"
                  data-ocid="company_settings.email.input"
                  placeholder="e.g. info@company.com"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="h-11"
                  type="email"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="companyAddress"
                  className="text-sm font-semibold flex items-center gap-1.5"
                >
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Company Address
                </Label>
                <Textarea
                  id="companyAddress"
                  data-ocid="company_settings.address.textarea"
                  placeholder="e.g. 123, Main Road, Mumbai - 400001"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="min-h-[80px] resize-none"
                  rows={3}
                />
              </div>
            </section>

            {/* Preview Section */}
            {(companyName ||
              companyPhone ||
              companyEmail ||
              companyAddress) && (
              <section className="bg-card rounded-xl border border-border shadow-card p-4 space-y-3">
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  PDF Footer Preview
                </h2>
                <div className="bg-secondary rounded-lg p-3 border border-border">
                  <div className="border-t border-border/60 pt-2">
                    <p className="text-xs text-center text-muted-foreground">
                      {[companyPhone, companyEmail, companyAddress]
                        .filter(Boolean)
                        .join(" | ")}
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Save Button */}
            <Button
              type="button"
              data-ocid="company_settings.save.button"
              onClick={() => void handleSave()}
              disabled={saveSettings.isPending || uploadingLogo}
              className="w-full h-12 text-base font-semibold rounded-xl shadow-card"
            >
              {saveSettings.isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
          </>
        )}
      </div>
    </main>
  );
}
