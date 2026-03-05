import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Loader2, LogOut, ShieldX, Truck } from "lucide-react";
import React from "react";
import { BottomNav } from "./components/BottomNav";
import { CurrentUserProvider, useCurrentUser } from "./hooks/useCurrentUser";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { Customers } from "./pages/Customers";
import { Dashboard } from "./pages/Dashboard";
import { NewOrder } from "./pages/NewOrder";
import { OrderDetail } from "./pages/OrderDetail";
import { OrdersList } from "./pages/OrdersList";
import { PendingDispatch } from "./pages/PendingDispatch";
import { Transporters } from "./pages/Transporters";
import { Users } from "./pages/Users";

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

function AppShellInner() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const { currentUser, isLoadingUser } = useCurrentUser();

  if (isInitializing) {
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
      {/* Top-right logout button — only show on wider screens */}
      <div className="fixed top-3 right-4 z-50 hidden sm:block">
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

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  ordersListRoute,
  newOrderRoute,
  orderDetailRoute,
  customersRoute,
  transportersRoute,
  pendingDispatchRoute,
  usersRoute,
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
