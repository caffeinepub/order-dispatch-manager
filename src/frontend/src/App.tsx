import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  Loader2,
  LogOut,
  Settings,
  ShieldCheck,
  ShieldX,
  Truck,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { BottomNav } from "./components/BottomNav";
import { useActor } from "./hooks/useActor";
import { CurrentUserProvider, useCurrentUser } from "./hooks/useCurrentUser";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useUnreadNotificationCount } from "./hooks/useQueries";
import { CompanySettings } from "./pages/CompanySettings";
import { Customers } from "./pages/Customers";
import { Dashboard } from "./pages/Dashboard";
import { NewOrder } from "./pages/NewOrder";
import { Notifications } from "./pages/Notifications";
import { OrderDetail } from "./pages/OrderDetail";
import { OrdersList } from "./pages/OrdersList";
import { PendingDispatch } from "./pages/PendingDispatch";
import { Transporters } from "./pages/Transporters";
import { Users } from "./pages/Users";

// ─── Bootstrap Admin Setup Screen ────────────────────────────────────────────

function BootstrapAdminScreen({ onSuccess }: { onSuccess: () => void }) {
  const { actor } = useActor();
  const { login, isLoggingIn, identity } = useInternetIdentity();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Not logged in yet — prompt login
  if (!identity) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-card mb-4">
              <Truck className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground text-center">
              Order Dispatch Manager
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 text-center">
              First-time setup
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck
                className="h-5 w-5 text-accent-foreground mt-0.5 shrink-0"
                style={{ color: "oklch(var(--accent))" }}
              />
              <div className="space-y-1">
                <h2 className="font-semibold text-foreground text-sm">
                  No admin account exists yet
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Log in with Internet Identity to set up your admin account and
                  get started.
                </p>
              </div>
            </div>

            <Button
              data-ocid="bootstrap.login_button"
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-12 text-base font-semibold rounded-xl shadow-card"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Login with Internet Identity"
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-6">
            This screen only appears once — during initial setup.
          </p>
        </div>
      </div>
    );
  }

  // Logged in — show bootstrap form
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!actor) return;
    if (!name.trim() || !email.trim()) {
      setError("Please fill in both fields.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await actor.bootstrapAdmin(name.trim(), email.trim());
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-card mb-4">
            <ShieldCheck className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground text-center">
            Setup Admin Account
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 text-center">
            You are the first user. You will be registered as Admin.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-5"
        >
          <div className="space-y-1.5">
            <Label
              htmlFor="bootstrap-name"
              className="text-sm font-medium text-foreground"
            >
              Full Name
            </Label>
            <Input
              id="bootstrap-name"
              data-ocid="bootstrap.name_input"
              type="text"
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="h-12 rounded-xl text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="bootstrap-email"
              className="text-sm font-medium text-foreground"
            >
              Email Address
            </Label>
            <Input
              id="bootstrap-email"
              data-ocid="bootstrap.email_input"
              type="email"
              placeholder="e.g. rahul@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-xl text-base"
            />
          </div>

          {error && (
            <div
              data-ocid="bootstrap.error_state"
              className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3"
            >
              <p className="text-xs text-destructive font-medium">{error}</p>
            </div>
          )}

          <Button
            data-ocid="bootstrap.submit_button"
            type="submit"
            disabled={isSubmitting || !actor}
            className="w-full h-12 text-base font-semibold rounded-xl shadow-card"
          >
            {isSubmitting ? (
              <>
                <Loader2
                  data-ocid="bootstrap.loading_state"
                  className="mr-2 h-5 w-5 animate-spin"
                />
                Creating account...
              </>
            ) : (
              "Create Admin Account"
            )}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          After setup, you can add other team members from the Users page.
        </p>
      </div>
    </div>
  );
}

// ─── Auth Gate ───────────────────────────────────────────────────────────────

function LoginScreen() {
  const { login, isLoggingIn, isInitializing, isLoginError } =
    useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        {/* Logo / App identity */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-card mb-4">
            <Truck className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground text-center">
            Order Dispatch Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 text-center">
            Manage orders and dispatch updates
          </p>
        </div>

        {/* Login card */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6 space-y-4">
          <div className="space-y-1">
            <h2 className="font-semibold text-foreground">
              Sign in to continue
            </h2>
            <p className="text-xs text-muted-foreground">
              Use your Internet Identity to access the app securely.
            </p>
          </div>

          <Button
            data-ocid="auth.login_button"
            onClick={login}
            disabled={isLoggingIn}
            className="w-full h-12 text-base font-semibold rounded-xl shadow-card"
          >
            {isLoggingIn ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              "Login with Internet Identity"
            )}
          </Button>

          {isLoginError && (
            <p className="text-xs text-destructive text-center">
              Login failed. Please try again.
            </p>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Internal use only — authorised staff members
        </p>
      </div>
    </div>
  );
}

// ─── Access Denied Screen ────────────────────────────────────────────────────

function AccessDeniedScreen() {
  const { clear } = useInternetIdentity();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
          <ShieldX className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
          Access Denied
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Your account is not registered in the system. Please contact your
          administrator.
        </p>
        <Button
          data-ocid="auth.access_denied.logout_button"
          onClick={clear}
          variant="outline"
          className="w-full h-12 text-base font-semibold rounded-xl"
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}

// ─── App Shell ───────────────────────────────────────────────────────────────

function NotificationBell() {
  const { currentUser } = useCurrentUser();
  const salesperson = currentUser?.name ?? "";
  const { data: unreadCount } = useUnreadNotificationCount(salesperson);
  const count = unreadCount ? Number(unreadCount) : 0;

  return (
    <Link
      to="/notifications"
      data-ocid="nav.notifications.link"
      className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary transition-colors"
    >
      <Bell className="h-4 w-4 text-muted-foreground" />
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold leading-none">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}

function SettingsLink() {
  const { isAdmin } = useCurrentUser();
  if (!isAdmin) return null;
  return (
    <Link
      to="/settings"
      data-ocid="nav.settings.link"
      className="relative flex items-center justify-center w-8 h-8 rounded-lg hover:bg-secondary transition-colors"
    >
      <Settings className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function AppShellInner() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const { currentUser, isLoadingUser } = useCurrentUser();
  const { actor, isFetching: isActorFetching } = useActor();

  // Bootstrap check: does the system have any users yet?
  const [hasUsers, setHasUsers] = useState<boolean | null>(null);
  const [isCheckingUsers, setIsCheckingUsers] = useState(false);

  useEffect(() => {
    // If actor is not available yet, nothing to check — don't block UI
    if (!actor || isActorFetching) {
      setIsCheckingUsers(false);
      return;
    }

    // Skip if we already know the answer
    if (hasUsers !== null) return;

    let cancelled = false;
    setIsCheckingUsers(true);

    // Safety timeout: if backend doesn't respond in 8s, assume users exist
    const timeout = setTimeout(() => {
      if (!cancelled) {
        setHasUsers(true);
        setIsCheckingUsers(false);
      }
    }, 8000);

    void actor
      .hasUsers()
      .then((result) => {
        if (!cancelled) {
          clearTimeout(timeout);
          setHasUsers(result);
          setIsCheckingUsers(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          clearTimeout(timeout);
          // If the call fails, assume users exist to avoid bypassing auth
          setHasUsers(true);
          setIsCheckingUsers(false);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [actor, isActorFetching, hasUsers]);

  const isBooting = isInitializing || isActorFetching || isCheckingUsers;

  if (isBooting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-lg px-4">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // No users in the system yet — show bootstrap screen
  if (hasUsers === false) {
    return (
      <BootstrapAdminScreen
        onSuccess={() => {
          // Reload the page so the app reinitialises with the new admin user
          window.location.reload();
        }}
      />
    );
  }

  if (!identity) {
    return <LoginScreen />;
  }

  // Loading user from backend
  if (isLoadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // User not found in system
  if (!currentUser) {
    return <AccessDeniedScreen />;
  }

  return (
    <div className="relative">
      {/* Top-right actions — notifications bell + settings + logout (wider screens) */}
      <div className="fixed top-3 right-4 z-50 flex items-center gap-1">
        <SettingsLink />
        <NotificationBell />
        <div className="hidden sm:block">
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
      </div>

      <Outlet />
      <BottomNav />
    </div>
  );
}

function AppShell() {
  return (
    <CurrentUserProvider>
      <AppShellInner />
    </CurrentUserProvider>
  );
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: AppShell,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Dashboard,
});

const ordersListRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders",
  component: OrdersList,
});

const newOrderRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders/new",
  component: NewOrder,
});

const orderDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/orders/$id",
  component: OrderDetail,
});

const customersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers",
  component: Customers,
});

const transportersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/transporters",
  component: Transporters,
});

const pendingDispatchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pending-dispatch",
  component: PendingDispatch,
});

const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  component: Users,
});

const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/notifications",
  component: Notifications,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: CompanySettings,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  ordersListRoute,
  newOrderRoute,
  orderDetailRoute,
  customersRoute,
  transportersRoute,
  pendingDispatchRoute,
  usersRoute,
  notificationsRoute,
  settingsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" richColors />
    </>
  );
}
