import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Int "mo:core/Int";
import Float "mo:core/Float";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  // Type Definitions
  type City = Text;

  public type OrderStatus = {
    #pendingDispatch;
    #packed;
    #dispatched;
    #delivered;
    #unknown;
  };

  public type OrderPriority = {
    #normal;
    #urgent;
    #veryUrgent;
  };

  public type UserRole = {
    #admin;
    #staff;
  };

  public type AppUser = {
    id : Nat;
    name : Text;
    email : Text;
    role : UserRole;
    principalId : Text;
  };

  public type Customer = {
    id : Nat;
    name : Text;
    phone : Text;
    city : City;
  };

  public type Transporter = {
    id : Nat;
    name : Text;
    contactNumber : Text;
    city : City;
  };

  public type Order = {
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
    deliveredDate : Text;
    invoiceDocId : Text;
    packingListId : Text;
    transportReceiptId : Text;
    otherDocId : Text;
    priority : OrderPriority;
    lastUpdatedTime : Int;
    dispatchPdfId : Text;
  };

  public type Notification = {
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

  public type UserProfile = {
    name : Text;
    email : Text;
    role : UserRole;
  };

  public type CompanySettings = {
    companyName : Text;
    companyPhone : Text;
    companyEmail : Text;
    companyAddress : Text;
    companyLogoId : Text;
  };

  // Persistent State Variables
  var nextCustomerId = 1;
  var nextTransporterId = 1;
  var nextOrderId = 1;
  var nextUserId = 1;
  var dailyOrderSequence = 1;
  var lastOrderDate = "";
  var nextNotificationId = 1;
  var companySettings : ?CompanySettings = null;

  let customers = Map.empty<Nat, Customer>();
  let transporters = Map.empty<Nat, Transporter>();
  let orders = Map.empty<Nat, Order>();
  let users = Map.empty<Nat, AppUser>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let notifications = Map.empty<Nat, Notification>();

  // Include Blob Storage
  include MixinStorage();

  // User Authentication System
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // NEW: hasUsers - no auth required, returns true if any users exist
  public query func hasUsers() : async Bool {
    users.size() > 0;
  };

  // NEW: bootstrapAdmin - only works when users table is empty, registers caller as first Admin
  public shared ({ caller }) func bootstrapAdmin(name : Text, email : Text) : async AppUser {
    if (users.size() > 0) {
      Runtime.trap("Bootstrap already complete: users already exist");
    };
    let principalId = caller.toText();
    let newUser : AppUser = {
      id = nextUserId;
      name;
      email;
      role = #admin;
      principalId;
    };
    users.add(nextUserId, newUser);
    nextUserId += 1;
    AccessControl.assignRole(accessControlState, caller, caller, #admin);
    newUser;
  };

  // USER PROFILE MANAGEMENT (Required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // USER MANAGEMENT
  public shared ({ caller }) func addUser(name : Text, email : Text, role : UserRole, principalId : Text) : async AppUser {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can add users");
    };

    let newUser : AppUser = {
      id = nextUserId;
      name;
      email;
      role;
      principalId;
    };
    users.add(nextUserId, newUser);
    nextUserId += 1;
    newUser;
  };

  public shared ({ caller }) func removeUser(id : Nat) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can remove users");
    };

    users.remove(id);
  };

  public query ({ caller }) func getUsers() : async [AppUser] {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can view users");
    };
    users.values().toArray();
  };

  public query ({ caller }) func getUserByPrincipal(principalText : Text) : async ?AppUser {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can lookup user information");
    };
    switch (users.values().find(func(u) { u.principalId == principalText })) {
      case (?user) { ?user };
      case (null) { null };
    };
  };

  public query ({ caller }) func getUserByEmail(email : Text) : async ?AppUser {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can lookup user information");
    };
    switch (users.values().find(func(u) { u.email == email })) {
      case (?user) { ?user };
      case (null) { null };
    };
  };

  // CUSTOMER MANAGEMENT
  public shared ({ caller }) func addCustomer(name : Text, phone : Text, city : City) : async Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add customers");
    };

    let customer : Customer = {
      id = nextCustomerId;
      name;
      phone;
      city;
    };
    customers.add(nextCustomerId, customer);
    nextCustomerId += 1;
    customer;
  };

  public query ({ caller }) func getCustomers() : async [Customer] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };
    customers.values().toArray();
  };

  public query ({ caller }) func getCustomer(id : Nat) : async ?Customer {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view customers");
    };
    customers.get(id);
  };

  // TRANSPORTER MANAGEMENT
  public shared ({ caller }) func addTransporter(name : Text, contactNumber : Text, city : City) : async Transporter {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add transporters");
    };

    let transporter : Transporter = {
      id = nextTransporterId;
      name;
      contactNumber;
      city;
    };
    transporters.add(nextTransporterId, transporter);
    nextTransporterId += 1;
    transporter;
  };

  public query ({ caller }) func getTransporters() : async [Transporter] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transporters");
    };
    transporters.values().toArray();
  };

  public query ({ caller }) func getTransporter(id : Nat) : async ?Transporter {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transporters");
    };
    transporters.get(id);
  };

  // ORDER MANAGEMENT
  public shared ({ caller }) func createOrder(
    salesperson : Text,
    customerId : Nat,
    transporterId : Nat,
    orderValue : Float,
    notes : Text,
    createdBy : Text,
    priority : OrderPriority,
  ) : async ?Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create orders");
    };

    let (customer, transporter) = switch (customers.get(customerId), transporters.get(transporterId)) {
      case (?c, ?t) { (c, t) };
      case (null, _) { return null };
      case (_, null) { return null };
    };

    let now = Time.now();
    let currentDate = formatOrderDate(now);

    if (currentDate != lastOrderDate) {
      dailyOrderSequence := 1;
      lastOrderDate := currentDate;
    };

    let order : Order = {
      id = nextOrderId;
      orderNumber = buildSmartOrderNumber(currentDate, dailyOrderSequence);
      orderDate = now;
      salesperson;
      customerId;
      customerName = customer.name;
      customerPhone = customer.phone;
      customerCity = customer.city;
      transporterId;
      transporterName = transporter.name;
      orderValue;
      notes;
      lrNumber = "";
      dispatchDate = "";
      status = #pendingDispatch;
      billPhotoId = "";
      lrPhotoId = "";
      createdBy;
      lastUpdatedBy = createdBy;
      deliveredDate = "";
      invoiceDocId = "";
      packingListId = "";
      transportReceiptId = "";
      otherDocId = "";
      priority;
      lastUpdatedTime = now;
      dispatchPdfId = ""; // new field
    };
    orders.add(nextOrderId, order);
    nextOrderId += 1;
    dailyOrderSequence += 1;
    ?order;
  };

  func formatOrderDate(time : Int) : Text {
    let seconds = time / 1_000_000_000;
    let daysSinceEpoch = seconds / 86_400;
    let yearsSince1970 = daysSinceEpoch / 365;
    let year = 1970 + yearsSince1970;
    let daysThisYear = daysSinceEpoch % 365;
    let day = daysThisYear % 30 + 1;
    let month = (daysThisYear / 30) % 12 + 1;

    let yy = Int.abs(year % 100);
    let yyText = if (yy < 10) { "0" # yy.toText() } else { yy.toText() };
    let mmText = if (month < 10) { "0" # month.toText() } else { month.toText() };
    let ddText = if (day < 10) { "0" # day.toText() } else { day.toText() };

    yyText # mmText # ddText;
  };

  func formatDateYYYYMMDD(time : Int) : Text {
    let seconds = time / 1_000_000_000;
    let daysSinceEpoch = seconds / 86_400;
    let yearsSince1970 = daysSinceEpoch / 365;
    let year = 1970 + yearsSince1970;
    let daysThisYear = daysSinceEpoch % 365;
    let day = daysThisYear % 30 + 1;
    let month = (daysThisYear / 30) % 12 + 1;

    let yearText = year.toText();
    let mmText = if (month < 10) { "0" # month.toText() } else { month.toText() };
    let ddText = if (day < 10) { "0" # day.toText() } else { day.toText() };

    yearText # "-" # mmText # "-" # ddText;
  };

  func buildSmartOrderNumber(datePart : Text, sequence : Nat) : Text {
    let sequenceText = if (sequence < 10) {
      "00" # sequence.toText();
    } else if (sequence < 100) {
      "0" # sequence.toText();
    } else {
      sequence.toText();
    };
    "ORD-" # datePart # "-" # sequenceText;
  };

  public query ({ caller }) func getOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    orders.values().toArray().reverse();
  };

  public query ({ caller }) func getOrder(id : Nat) : async ?Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    orders.get(id);
  };

  public query ({ caller }) func getOrdersByPhone(phone : Text) : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    let filteredOrders = orders.values().toArray().filter(
      func(order) { order.customerPhone == phone }
    );
    filteredOrders;
  };

  public query ({ caller }) func getPendingDispatchOrders() : async [Order] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view orders");
    };
    let filteredOrders = orders.values().toArray().filter(
      func(order) {
        switch (order.status) {
          case (#pendingDispatch or #packed) { true };
          case (_) { false };
        };
      }
    );
    filteredOrders;
  };

  // New Update Order Info Function
  public shared ({ caller }) func updateOrderInfo(
    id : Nat,
    salesperson : Text,
    customerId : Nat,
    transporterId : Nat,
    orderValue : Float,
    notes : Text,
    priority : OrderPriority,
    lastUpdatedBy : Text,
  ) : async ?Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update order information");
    };

    let (customer, transporter) = switch (customers.get(customerId), transporters.get(transporterId)) {
      case (?c, ?t) { (c, t) };
      case (null, _) { return null };
      case (_, null) { return null };
    };

    let now = Time.now();

    switch (orders.get(id)) {
      case (?existingOrder) {
        let updatedOrder : Order = {
          id;
          orderNumber = existingOrder.orderNumber;
          orderDate = existingOrder.orderDate;
          salesperson;
          customerId;
          customerName = customer.name;
          customerPhone = customer.phone;
          customerCity = customer.city;
          transporterId;
          transporterName = transporter.name;
          orderValue;
          notes;
          priority;
          lastUpdatedBy;
          lastUpdatedTime = now;
          lrNumber = existingOrder.lrNumber;
          dispatchDate = existingOrder.dispatchDate;
          status = existingOrder.status;
          billPhotoId = existingOrder.billPhotoId;
          lrPhotoId = existingOrder.lrPhotoId;
          createdBy = existingOrder.createdBy;
          deliveredDate = existingOrder.deliveredDate;
          invoiceDocId = existingOrder.invoiceDocId;
          packingListId = existingOrder.packingListId;
          transportReceiptId = existingOrder.transportReceiptId;
          otherDocId = existingOrder.otherDocId;
          dispatchPdfId = existingOrder.dispatchPdfId; // preserve this also
        };

        orders.add(id, updatedOrder);
        ?updatedOrder;
      };
      case (null) { null };
    };
  };

  public shared ({ caller }) func updateOrderDispatch(
    id : Nat,
    lrNumber : Text,
    dispatchDate : Text,
    status : OrderStatus,
    billPhotoId : Text,
    lrPhotoId : Text,
    lastUpdatedBy : Text,
    deliveredDate : Text,
    invoiceDocId : Text,
    packingListId : Text,
    transportReceiptId : Text,
    otherDocId : Text,
    dispatchPdfId : Text,
  ) : async ?Order {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update orders");
    };

    switch (orders.get(id)) {
      case (?order) {
        var updatedStatus = status;
        var updatedDispatchDate = dispatchDate;
        var updatedDeliveredDate = deliveredDate;

        if (lrPhotoId != "") {
          updatedStatus := #dispatched;
          updatedDispatchDate := formatDateYYYYMMDD(Time.now());
        };

        if (updatedStatus == #delivered and deliveredDate == "") {
          updatedDeliveredDate := formatDateYYYYMMDD(Time.now());
        };

        let updatedOrder : Order = {
          id;
          orderNumber = order.orderNumber;
          orderDate = order.orderDate;
          salesperson = order.salesperson;
          customerId = order.customerId;
          customerName = order.customerName;
          customerPhone = order.customerPhone;
          customerCity = order.customerCity;
          transporterId = order.transporterId;
          transporterName = order.transporterName;
          orderValue = order.orderValue;
          notes = order.notes;
          lrNumber;
          dispatchDate = updatedDispatchDate;
          status = updatedStatus;
          billPhotoId;
          lrPhotoId;
          createdBy = order.createdBy;
          lastUpdatedBy;
          deliveredDate = updatedDeliveredDate;
          invoiceDocId;
          packingListId;
          transportReceiptId;
          otherDocId;
          priority = order.priority;
          lastUpdatedTime = Time.now();
          dispatchPdfId; // save new dispatch ID from parameter
        };

        // Check for newly dispatched status to create notification
        if (order.status != #dispatched and updatedStatus == #dispatched) {
          await createDispatchNotification(id, updatedOrder);
        };

        orders.add(id, updatedOrder);
        ?updatedOrder;
      };
      case (null) { null };
    };
  };

  // Notification Management
  func createDispatchNotification(orderId : Nat, order : Order) : async () {
    let notification : Notification = {
      id = nextNotificationId;
      orderId;
      orderNumber = order.orderNumber;
      customerName = order.customerName;
      transporterName = order.transporterName;
      lrNumber = order.lrNumber;
      dispatchDate = order.dispatchDate;
      salesperson = order.salesperson;
      createdAt = Time.now();
      isRead = false;
    };
    notifications.add(nextNotificationId, notification);
    nextNotificationId += 1;
  };

  public query ({ caller }) func getNotificationsForSalesperson(salesperson : Text) : async [Notification] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notifications");
    };
    let filteredNotifications = notifications.values().toArray().filter(
      func(notification) { notification.salesperson == salesperson }
    );
    filteredNotifications;
  };

  public shared ({ caller }) func markNotificationRead(id : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };
    switch (notifications.get(id)) {
      case (?notification) {
        let updatedNotification : Notification = {
          id = notification.id;
          orderId = notification.orderId;
          orderNumber = notification.orderNumber;
          customerName = notification.customerName;
          transporterName = notification.transporterName;
          lrNumber = notification.lrNumber;
          dispatchDate = notification.dispatchDate;
          salesperson = notification.salesperson;
          createdAt = notification.createdAt;
          isRead = true;
        };
        notifications.add(id, updatedNotification);
      };
      case (null) {};
    };
  };

  public query ({ caller }) func getUnreadNotificationCount(salesperson : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notification counts");
    };
    var count = 0;
    notifications.values().toArray().forEach(
      func(notification) {
        if (notification.salesperson == salesperson and not notification.isRead) {
          count += 1;
        };
      }
    );
    count;
  };

  public query ({ caller }) func getOrderStats() : async {
    total : Nat;
    pendingDispatch : Nat;
    packed : Nat;
    dispatched : Nat;
    delivered : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view order statistics");
    };
    var pendingDispatch = 0;
    var packed = 0;
    var dispatched = 0;
    var delivered = 0;

    orders.values().forEach(
      func(order) {
        switch (order.status) {
          case (#pendingDispatch) { pendingDispatch += 1 };
          case (#packed) { packed += 1 };
          case (#dispatched) { dispatched += 1 };
          case (#delivered) { delivered += 1 };
          case (_) {};
        };
      }
    );

    {
      total = orders.size();
      pendingDispatch;
      packed;
      dispatched;
      delivered;
    };
  };

  public query ({ caller }) func getDailyDispatchReport() : async {
    todayCreated : Nat;
    todayDispatched : Nat;
    pendingDispatch : Nat;
    delivered : Nat;
    dispatchedToday : [Order];
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view dispatch reports");
    };
    let now = Time.now();
    let todayDate = formatDateYYYYMMDD(now);

    var todayCreated = 0;
    var todayDispatched = 0;
    var pendingDispatch = 0;
    var delivered = 0;
    var dispatchedTodayList : [Order] = [];

    orders.values().forEach(
      func(order) {
        let orderDateStr = formatDateYYYYMMDD(order.orderDate);
        if (orderDateStr == todayDate) {
          todayCreated += 1;
        };

        if (order.dispatchDate == todayDate) {
          todayDispatched += 1;
          dispatchedTodayList := dispatchedTodayList.concat([order]);
        };

        switch (order.status) {
          case (#pendingDispatch) { pendingDispatch += 1 };
          case (#delivered) { delivered += 1 };
          case (_) {};
        };
      }
    );

    {
      todayCreated;
      todayDispatched;
      pendingDispatch;
      delivered;
      dispatchedToday = dispatchedTodayList;
    };
  };

  // NEW COMPANY SETTINGS FUNCTIONS (admin only)
  public query ({ caller }) func getCompanySettings() : async ?CompanySettings {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view company settings");
    };
    companySettings;
  };

  public shared ({ caller }) func saveCompanySettings(
    companyName : Text,
    companyPhone : Text,
    companyEmail : Text,
    companyAddress : Text,
    companyLogoId : Text,
  ) : async CompanySettings {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Only admins can save company settings");
    };

    // validation can be added here if needed
    let newSettings : CompanySettings = {
      companyName;
      companyPhone;
      companyEmail;
      companyAddress;
      companyLogoId;
    };
    companySettings := ?newSettings;
    newSettings;
  };

};
