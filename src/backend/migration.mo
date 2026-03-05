import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {
  type OldOrderStatus = {
    #pendingDispatch;
    #packed;
    #dispatched;
    #delivered;
    #unknown;
  };

  type OldUserRole = {
    #admin;
    #staff;
  };

  type OldAppUser = {
    id : Nat;
    name : Text;
    email : Text;
    role : OldUserRole;
    principalId : Text;
  };

  type OldCustomer = {
    id : Nat;
    name : Text;
    phone : Text;
    city : Text;
  };

  type OldTransporter = {
    id : Nat;
    name : Text;
    contactNumber : Text;
    city : Text;
  };

  type OldOrder = {
    id : Nat;
    orderNumber : Text;
    orderDate : Int;
    salesperson : Text;
    customerId : Nat;
    customerName : Text;
    customerPhone : Text;
    customerCity : Text;
    transporterId : Nat;
    transporterName : Text;
    orderValue : Float;
    notes : Text;
    lrNumber : Text;
    dispatchDate : Text;
    status : OldOrderStatus;
    billPhotoId : Text;
    lrPhotoId : Text;
    createdBy : Text;
    lastUpdatedBy : Text;
    deliveredDate : Text;
    invoiceDocId : Text;
    packingListId : Text;
    transportReceiptId : Text;
    otherDocId : Text;
  };

  type OldNotification = {
    id : Nat;
    orderId : Nat;
    orderNumber : Text;
    customerName : Text;
    transporterName : Text;
    lrNumber : Text;
    dispatchDate : Text;
    salesperson : Text;
    createdAt : Int;
    isRead : Bool;
  };

  type OldUserProfile = {
    name : Text;
    email : Text;
    role : OldUserRole;
  };

  type OldActor = {
    nextCustomerId : Nat;
    nextTransporterId : Nat;
    nextOrderId : Nat;
    nextUserId : Nat;
    dailyOrderSequence : Nat;
    lastOrderDate : Text;
    nextNotificationId : Nat;
    customers : Map.Map<Nat, OldCustomer>;
    transporters : Map.Map<Nat, OldTransporter>;
    orders : Map.Map<Nat, OldOrder>;
    users : Map.Map<Nat, OldAppUser>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    notifications : Map.Map<Nat, OldNotification>;
  };

  type NewOrderStatus = {
    #pendingDispatch;
    #packed;
    #dispatched;
    #delivered;
    #unknown;
  };

  type NewUserRole = {
    #admin;
    #staff;
  };

  type NewOrderPriority = {
    #normal;
    #urgent;
    #veryUrgent;
  };

  type NewAppUser = {
    id : Nat;
    name : Text;
    email : Text;
    role : NewUserRole;
    principalId : Text;
  };

  type NewCustomer = {
    id : Nat;
    name : Text;
    phone : Text;
    city : Text;
  };

  type NewTransporter = {
    id : Nat;
    name : Text;
    contactNumber : Text;
    city : Text;
  };

  type NewOrder = {
    id : Nat;
    orderNumber : Text;
    orderDate : Int;
    salesperson : Text;
    customerId : Nat;
    customerName : Text;
    customerPhone : Text;
    customerCity : Text;
    transporterId : Nat;
    transporterName : Text;
    orderValue : Float;
    notes : Text;
    lrNumber : Text;
    dispatchDate : Text;
    status : NewOrderStatus;
    billPhotoId : Text;
    lrPhotoId : Text;
    createdBy : Text;
    lastUpdatedBy : Text;
    deliveredDate : Text;
    invoiceDocId : Text;
    packingListId : Text;
    transportReceiptId : Text;
    otherDocId : Text;
    priority : NewOrderPriority;
    lastUpdatedTime : Int;
  };

  type NewNotification = {
    id : Nat;
    orderId : Nat;
    orderNumber : Text;
    customerName : Text;
    transporterName : Text;
    lrNumber : Text;
    dispatchDate : Text;
    salesperson : Text;
    createdAt : Int;
    isRead : Bool;
  };

  type NewUserProfile = {
    name : Text;
    email : Text;
    role : NewUserRole;
  };

  type NewActor = {
    nextCustomerId : Nat;
    nextTransporterId : Nat;
    nextOrderId : Nat;
    nextUserId : Nat;
    dailyOrderSequence : Nat;
    lastOrderDate : Text;
    nextNotificationId : Nat;
    customers : Map.Map<Nat, NewCustomer>;
    transporters : Map.Map<Nat, NewTransporter>;
    orders : Map.Map<Nat, NewOrder>;
    users : Map.Map<Nat, NewAppUser>;
    userProfiles : Map.Map<Principal, NewUserProfile>;
    notifications : Map.Map<Nat, NewNotification>;
  };

  public func run(old : OldActor) : NewActor {
    let newOrders = old.orders.map<Nat, OldOrder, NewOrder>(
      func(_id, oldOrder) {
        {
          oldOrder with
          priority = #normal;
          lastUpdatedTime = Time.now();
        };
      }
    );
    { old with orders = newOrders };
  };
};
