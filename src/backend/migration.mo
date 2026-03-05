import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import AccessControl "authorization/access-control";
import Principal "mo:core/Principal";

module {
  type City = Text;

  type OrderStatus = {
    #pendingDispatch;
    #packed;
    #dispatched;
    #delivered;
    #unknown;
  };

  type UserRole = {
    #admin;
    #staff;
  };

  type AppUser = {
    id : Nat;
    name : Text;
    email : Text;
    role : UserRole;
    principalId : Text;
  };

  type Customer = {
    id : Nat;
    name : Text;
    phone : Text;
    city : City;
  };

  type Transporter = {
    id : Nat;
    name : Text;
    contactNumber : Text;
    city : City;
  };

  type OldOrder = {
    id : Nat;
    orderNumber : Text;
    orderDate : Int;
    salesperson : Text;
    customerId : Nat;
    customerName : Text;
    customerPhone : Text;
    customerCity : City;
    transporterId : Nat;
    transporterName : Text;
    orderValue : Float;
    notes : Text;
    lrNumber : Text;
    dispatchDate : Text;
    status : Text;
    billPhotoId : Text;
    lrPhotoId : Text;
  };

  type NewOrder = {
    id : Nat;
    orderNumber : Text;
    orderDate : Int;
    salesperson : Text;
    customerId : Nat;
    customerName : Text;
    customerPhone : Text;
    customerCity : City;
    transporterId : Nat;
    transporterName : Text;
    orderValue : Float;
    notes : Text;
    lrNumber : Text;
    dispatchDate : Text;
    status : OrderStatus;
    billPhotoId : Text;
    lrPhotoId : Text;
    createdBy : Text;
    lastUpdatedBy : Text;
  };

  type UserProfile = {
    name : Text;
    email : Text;
    role : UserRole;
  };

  type OldActor = {
    nextCustomerId : Nat;
    nextTransporterId : Nat;
    nextOrderId : Nat;
    customers : Map.Map<Nat, Customer>;
    transporters : Map.Map<Nat, Transporter>;
    orders : Map.Map<Nat, OldOrder>;
    accessControlState : AccessControl.AccessControlState;
  };

  type NewActor = {
    nextCustomerId : Nat;
    nextTransporterId : Nat;
    nextOrderId : Nat;
    customers : Map.Map<Nat, Customer>;
    transporters : Map.Map<Nat, Transporter>;
    orders : Map.Map<Nat, NewOrder>;
    accessControlState : AccessControl.AccessControlState;
    users : Map.Map<Nat, AppUser>;
    nextUserId : Nat;
    dailyOrderSequence : Nat;
    lastOrderDate : Text;
    userProfiles : Map.Map<Principal, UserProfile>;
  };

  func translateOrderStatus(oldStatus : Text) : OrderStatus {
    switch (oldStatus) {
      case ("PendingDispatch") { #pendingDispatch };
      case ("Packed") { #packed };
      case ("Dispatched") { #dispatched };
      case ("Delivered") { #delivered };
      case (_) { #unknown };
    };
  };

  public func run(old : OldActor) : NewActor {
    let newOrders = old.orders.map<Nat, OldOrder, NewOrder>(
      func(_id, oldOrder) {
        {
          oldOrder with
          status = translateOrderStatus(oldOrder.status);
          createdBy = "legacy";
          lastUpdatedBy = "legacy";
        };
      }
    );

    {
      old with
      orders = newOrders;
      users = Map.empty<Nat, AppUser>();
      nextUserId = 1;
      dailyOrderSequence = 1;
      lastOrderDate = "";
      userProfiles = Map.empty<Principal, UserProfile>();
    };
  };
};
