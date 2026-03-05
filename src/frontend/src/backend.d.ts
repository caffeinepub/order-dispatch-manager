import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Customer {
    id: bigint;
    city: City;
    name: string;
    phone: string;
}
export type City = string;
export interface AppUser {
    id: bigint;
    name: string;
    role: UserRole;
    email: string;
    principalId: string;
}
export interface Order {
    id: bigint;
    customerName: string;
    status: OrderStatus;
    billPhotoId: string;
    customerPhone: string;
    salesperson: string;
    lrPhotoId: string;
    createdBy: string;
    dispatchDate: string;
    orderDate: bigint;
    orderValue: number;
    transportReceiptId: string;
    lrNumber: string;
    lastUpdatedBy: string;
    packingListId: string;
    otherDocId: string;
    notes: string;
    customerId: bigint;
    priority: OrderPriority;
    lastUpdatedTime: bigint;
    transporterId: bigint;
    invoiceDocId: string;
    orderNumber: string;
    deliveredDate: string;
    transporterName: string;
    customerCity: City;
}
export interface Transporter {
    id: bigint;
    city: City;
    name: string;
    contactNumber: string;
}
export interface Notification {
    id: bigint;
    customerName: string;
    salesperson: string;
    createdAt: bigint;
    dispatchDate: string;
    isRead: boolean;
    orderId: bigint;
    lrNumber: string;
    orderNumber: string;
    transporterName: string;
}
export interface UserProfile {
    name: string;
    role: UserRole;
    email: string;
}
export enum OrderPriority {
    normal = "normal",
    urgent = "urgent",
    veryUrgent = "veryUrgent"
}
export enum OrderStatus {
    dispatched = "dispatched",
    delivered = "delivered",
    unknown_ = "unknown",
    packed = "packed",
    pendingDispatch = "pendingDispatch"
}
export enum UserRole {
    admin = "admin",
    staff = "staff"
}
export enum UserRole__1 {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addCustomer(name: string, phone: string, city: City): Promise<Customer>;
    addTransporter(name: string, contactNumber: string, city: City): Promise<Transporter>;
    addUser(name: string, email: string, role: UserRole, principalId: string): Promise<AppUser>;
    assignCallerUserRole(user: Principal, role: UserRole__1): Promise<void>;
    bootstrapAdmin(name: string, email: string): Promise<AppUser>;
    createOrder(salesperson: string, customerId: bigint, transporterId: bigint, orderValue: number, notes: string, createdBy: string, priority: OrderPriority): Promise<Order | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole__1>;
    getCustomer(id: bigint): Promise<Customer | null>;
    getCustomers(): Promise<Array<Customer>>;
    getDailyDispatchReport(): Promise<{
        todayDispatched: bigint;
        todayCreated: bigint;
        delivered: bigint;
        dispatchedToday: Array<Order>;
        pendingDispatch: bigint;
    }>;
    getNotificationsForSalesperson(salesperson: string): Promise<Array<Notification>>;
    getOrder(id: bigint): Promise<Order | null>;
    getOrderStats(): Promise<{
        total: bigint;
        dispatched: bigint;
        delivered: bigint;
        packed: bigint;
        pendingDispatch: bigint;
    }>;
    getOrders(): Promise<Array<Order>>;
    getOrdersByPhone(phone: string): Promise<Array<Order>>;
    getPendingDispatchOrders(): Promise<Array<Order>>;
    getTransporter(id: bigint): Promise<Transporter | null>;
    getTransporters(): Promise<Array<Transporter>>;
    getUnreadNotificationCount(salesperson: string): Promise<bigint>;
    getUserByEmail(email: string): Promise<AppUser | null>;
    getUserByPrincipal(principalText: string): Promise<AppUser | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUsers(): Promise<Array<AppUser>>;
    hasUsers(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    markNotificationRead(id: bigint): Promise<void>;
    removeUser(id: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateOrderDispatch(id: bigint, lrNumber: string, dispatchDate: string, status: OrderStatus, billPhotoId: string, lrPhotoId: string, lastUpdatedBy: string, deliveredDate: string, invoiceDocId: string, packingListId: string, transportReceiptId: string, otherDocId: string): Promise<Order | null>;
    updateOrderInfo(id: bigint, salesperson: string, customerId: bigint, transporterId: bigint, orderValue: number, notes: string, priority: OrderPriority, lastUpdatedBy: string): Promise<Order | null>;
}
