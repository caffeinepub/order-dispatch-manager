import { UserRole } from "@/backend.d";
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
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useAddUser, useAppUsers, useRemoveUser } from "@/hooks/useQueries";
import { cn } from "@/lib/utils";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users as UsersIcon,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppUser } from "../backend.d";

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        role === UserRole.admin
          ? "bg-amber-100 text-amber-700 border border-amber-200"
          : "bg-blue-50 text-blue-700 border border-blue-200",
      )}
    >
      {role === UserRole.admin ? (
        <ShieldCheck className="h-3 w-3" />
      ) : (
        <Shield className="h-3 w-3" />
      )}
      {role === UserRole.admin ? "Admin" : "Staff"}
    </span>
  );
}

function truncatePrincipal(principal: string): string {
  if (principal.length <= 16) return principal;
  return `${principal.slice(0, 8)}...${principal.slice(-8)}`;
}

interface UserCardProps {
  user: AppUser;
  index: number;
  onDelete: (user: AppUser) => void;
  isDeleting: boolean;
}

function UserCard({ user, index, onDelete, isDeleting }: UserCardProps) {
  return (
    <div
      data-ocid={`users.item.${index}`}
      className="bg-card rounded-xl border border-border shadow-card p-4 flex items-start gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-primary">
          {user.name.charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground">{user.name}</p>
          <RoleBadge role={user.role} />
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
        <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
          {truncatePrincipal(user.principalId)}
        </p>
      </div>
      <button
        type="button"
        data-ocid={`users.delete_button.${index}`}
        onClick={() => onDelete(user)}
        disabled={isDeleting}
        className={cn(
          "flex-shrink-0 p-2 rounded-lg text-muted-foreground",
          "hover:text-destructive hover:bg-destructive/10",
          "transition-colors touch-target",
          "disabled:opacity-50 disabled:cursor-not-allowed",
        )}
        aria-label={`Delete user ${user.name}`}
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export function Users() {
  const navigate = useNavigate();
  const { isAdmin } = useCurrentUser();
  const { data: users, isLoading } = useAppUsers();
  const addUser = useAddUser();
  const removeUser = useRemoveUser();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.staff);
  const [principalId, setPrincipalId] = useState("");
  const [deletingId, setDeletingId] = useState<bigint | null>(null);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<AppUser | null>(
    null,
  );

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !principalId.trim()) {
      toast.error("All fields are required");
      return;
    }
    try {
      const newUser = await addUser.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        role,
        principalId: principalId.trim(),
      });
      toast.success(`User "${newUser.name}" added`);
      setName("");
      setEmail("");
      setRole(UserRole.staff);
      setPrincipalId("");
      setShowAddDialog(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add user");
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteUser) return;
    setDeletingId(confirmDeleteUser.id);
    setConfirmDeleteUser(null);
    try {
      await removeUser.mutateAsync({ id: confirmDeleteUser.id });
      toast.success(`User "${confirmDeleteUser.name}" removed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove user");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAdmin) {
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
              Users
            </h1>
          </div>
        </header>
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <Shield className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="font-semibold text-foreground mb-1">
            Access Restricted
          </p>
          <p className="text-sm text-muted-foreground">
            Only administrators can manage users.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main data-ocid="users.page" className="min-h-screen content-area">
      {/* Header */}
      <header className="bg-card border-b border-border px-4 pt-4 pb-4 sticky top-0 z-10">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void navigate({ to: "/" })}
              className="touch-target flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-display font-bold text-foreground">
              Users
            </h1>
          </div>
          <Button
            data-ocid="users.add_user.open_modal_button"
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-1.5 rounded-lg text-sm font-semibold touch-target"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-4">
        {/* Loading */}
        {isLoading && (
          <div data-ocid="users.loading_state" className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!users || users.length === 0) && (
          <div
            data-ocid="users.empty_state"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <UsersIcon className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="font-semibold text-foreground mb-1">No users yet</p>
            <p className="text-sm text-muted-foreground mb-6">
              Add team members to give them access
            </p>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add First User
            </Button>
          </div>
        )}

        {/* User list */}
        {!isLoading && users && users.length > 0 && (
          <div data-ocid="users.list" className="space-y-3">
            <p className="text-xs text-muted-foreground">
              {users.length} user{users.length !== 1 ? "s" : ""}
            </p>
            {users.map((user, idx) => (
              <UserCard
                key={user.id.toString()}
                user={user}
                index={idx + 1}
                onDelete={(u) => setConfirmDeleteUser(u)}
                isDeleting={deletingId === user.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add User Dialog */}
      <Dialog
        open={showAddDialog}
        onOpenChange={(v) => !v && setShowAddDialog(false)}
      >
        <DialogContent
          data-ocid="users.add_user.dialog"
          className="mx-4 rounded-2xl max-w-sm w-full"
        >
          <DialogHeader>
            <DialogTitle className="font-display">Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => void handleAddUser(e)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="u-name">Full Name *</Label>
              <Input
                id="u-name"
                data-ocid="users.add_user.name.input"
                placeholder="Enter full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-email">Email *</Label>
              <Input
                id="u-email"
                data-ocid="users.add_user.email.input"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role *</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as UserRole)}
              >
                <SelectTrigger data-ocid="users.add_user.role.select">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.admin}>Admin</SelectItem>
                  <SelectItem value={UserRole.staff}>Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-principal">Internet Identity Principal *</Label>
              <Input
                id="u-principal"
                data-ocid="users.add_user.principal.input"
                placeholder="e.g. aaaaa-aaaaa-aaaaa-aaaaa-cai"
                value={principalId}
                onChange={(e) => setPrincipalId(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Enter the user's Internet Identity principal
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                data-ocid="users.add_user.cancel_button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                data-ocid="users.add_user.submit_button"
                disabled={addUser.isPending}
              >
                {addUser.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Add User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog
        open={!!confirmDeleteUser}
        onOpenChange={(v) => !v && setConfirmDeleteUser(null)}
      >
        <DialogContent className="mx-4 rounded-2xl max-w-sm w-full">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Remove User
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to remove{" "}
            <span className="font-semibold text-foreground">
              {confirmDeleteUser?.name}
            </span>
            ? They will lose access to the app.
          </p>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmDeleteUser(null)}
              data-ocid="users.delete.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleDeleteConfirmed()}
              data-ocid="users.delete.confirm_button"
              disabled={removeUser.isPending}
            >
              {removeUser.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
