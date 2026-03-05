import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AppUser,
  Customer,
  Notification,
  Order,
  Transporter,
} from "../backend.d";
import type { OrderPriority, OrderStatus, UserRole } from "../backend.d";
import { useActor } from "./useActor";

// ─── Customers ──────────────────────────────────────────────────────────────

export function useCustomers() {
  const { actor, isFetching } = useActor();
  return useQuery<Customer[]>({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddCustomer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      phone,
      city,
    }: {
      name: string;
      phone: string;
      city: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addCustomer(name, phone, city);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

// ─── Transporters ────────────────────────────────────────────────────────────

export function useTransporters() {
  const { actor, isFetching } = useActor();
  return useQuery<Transporter[]>({
    queryKey: ["transporters"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTransporters();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddTransporter() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      contactNumber,
      city,
    }: {
      name: string;
      contactNumber: string;
      city: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addTransporter(name, contactNumber, city);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["transporters"] });
    },
  });
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export function useOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOrder(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<Order | null>({
    queryKey: ["order", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) return null;
      return actor.getOrder(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useOrderStats() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["orderStats"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getOrderStats();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useOrdersByPhone(phone: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["ordersByPhone", phone],
    queryFn: async () => {
      if (!actor || !phone) return [];
      return actor.getOrdersByPhone(phone);
    },
    enabled: !!actor && !isFetching && phone.length >= 5,
  });
}

export function usePendingDispatchOrders() {
  const { actor, isFetching } = useActor();
  return useQuery<Order[]>({
    queryKey: ["pendingDispatchOrders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPendingDispatchOrders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useDailyDispatchReport() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["dailyDispatchReport"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDailyDispatchReport();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateOrder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      salesperson,
      customerId,
      transporterId,
      orderValue,
      notes,
      createdBy,
      priority,
    }: {
      salesperson: string;
      customerId: bigint;
      transporterId: bigint;
      orderValue: number;
      notes: string;
      createdBy: string;
      priority: OrderPriority;
    }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.createOrder(
        salesperson,
        customerId,
        transporterId,
        orderValue,
        notes,
        createdBy,
        priority,
      );
      if (!result)
        throw new Error(
          "Failed to create order — customer or transporter not found",
        );
      return result;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["orderStats"] });
      void queryClient.invalidateQueries({
        queryKey: ["dailyDispatchReport"],
      });
    },
  });
}

export function useUpdateOrderInfo() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      salesperson,
      customerId,
      transporterId,
      orderValue,
      notes,
      priority,
      lastUpdatedBy,
    }: {
      id: bigint;
      salesperson: string;
      customerId: bigint;
      transporterId: bigint;
      orderValue: number;
      notes: string;
      priority: OrderPriority;
      lastUpdatedBy: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.updateOrderInfo(
        id,
        salesperson,
        customerId,
        transporterId,
        orderValue,
        notes,
        priority,
        lastUpdatedBy,
      );
      if (!result) throw new Error("Order not found");
      return result;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["orderStats"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", data.id.toString()],
      });
    },
  });
}

export function useUpdateOrderDispatch() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      lrNumber,
      dispatchDate,
      status,
      billPhotoId,
      lrPhotoId,
      lastUpdatedBy,
      deliveredDate,
      invoiceDocId,
      packingListId,
      transportReceiptId,
      otherDocId,
    }: {
      id: bigint;
      lrNumber: string;
      dispatchDate: string;
      status: OrderStatus;
      billPhotoId: string;
      lrPhotoId: string;
      lastUpdatedBy: string;
      deliveredDate: string;
      invoiceDocId: string;
      packingListId: string;
      transportReceiptId: string;
      otherDocId: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      const result = await actor.updateOrderDispatch(
        id,
        lrNumber,
        dispatchDate,
        status,
        billPhotoId,
        lrPhotoId,
        lastUpdatedBy,
        deliveredDate,
        invoiceDocId,
        packingListId,
        transportReceiptId,
        otherDocId,
      );
      if (!result) throw new Error("Order not found");
      return result;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
      void queryClient.invalidateQueries({ queryKey: ["orderStats"] });
      void queryClient.invalidateQueries({
        queryKey: ["order", data.id.toString()],
      });
      void queryClient.invalidateQueries({
        queryKey: ["pendingDispatchOrders"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["dailyDispatchReport"],
      });
      void queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
    },
  });
}

// ─── Notifications ───────────────────────────────────────────────────────────

export function useNotificationsForSalesperson(salesperson: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Notification[]>({
    queryKey: ["notifications", salesperson],
    queryFn: async () => {
      if (!actor || !salesperson) return [];
      return actor.getNotificationsForSalesperson(salesperson);
    },
    enabled: !!actor && !isFetching && salesperson.length > 0,
    refetchInterval: 30_000, // poll every 30 seconds
  });
}

export function useMarkNotificationRead() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.markNotificationRead(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useUnreadNotificationCount(salesperson: string) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["notificationCount", salesperson],
    queryFn: async () => {
      if (!actor || !salesperson) return BigInt(0);
      return actor.getUnreadNotificationCount(salesperson);
    },
    enabled: !!actor && !isFetching && salesperson.length > 0,
    refetchInterval: 30_000,
  });
}

// ─── Users ───────────────────────────────────────────────────────────────────

export function useAppUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<AppUser[]>({
    queryKey: ["appUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      email,
      role,
      principalId,
    }: {
      name: string;
      email: string;
      role: UserRole;
      principalId: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addUser(name, email, role, principalId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appUsers"] });
    },
  });
}

export function useRemoveUser() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.removeUser(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["appUsers"] });
    },
  });
}
