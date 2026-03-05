# Order Dispatch Manager

## Current State

The app has:
- Internet Identity login (principal-based auth via authorization component)
- Customers, Transporters, Orders tables in backend (Motoko)
- Sequential order numbers: ORD-0001, ORD-0002...
- Order fields: orderNumber, orderDate, salesperson (text), customer, transporter, orderValue, notes, billPhotoId, lrPhotoId, lrNumber, dispatchDate, status
- Basic order stats: total, pendingDispatch, packed, dispatched, delivered
- Frontend pages: Dashboard, OrdersList, NewOrder, OrderDetail, Customers, Transporters
- WhatsApp deep link button on OrderDetail
- Blob storage for bill/LR photos
- BottomNav with 5 tabs

## Requested Changes (Diff)

### Add

**Backend:**
- `AppUser` type with fields: id, name, email, role (variant: #admin | #staff), principalId (Text)
- Users table (Map) with CRUD: addUser, removeUser, getUsers, getUserByEmail, getUserByPrincipal
- `getOrCreateUserSession` function: looks up caller's principal, returns their AppUser or null (used to gate access)
- Email-based access control: after Internet Identity login, user must have their principal registered in Users table to proceed; admins can add/remove users
- Update Order type to add: createdBy (Text - email), lastUpdatedBy (Text - email)
- Update `createOrder` to accept createdBy email, include it in the order
- Update `updateOrderDispatch` to accept lastUpdatedBy email
- Smart order number with date: ORD-YYMMDD-001 format, resetting sequence per day (track lastOrderDate Text and dailySequence Nat)
- `getOrdersByPhone` query: returns all orders for a customer phone number
- `getPendingDispatchOrders` query: returns orders with status PendingDispatch or Packed
- `getDailyDispatchReport` query: returns todayCreated, todayDispatched, pendingDispatch, delivered counts, plus list of orders dispatched today
- `updateOrderDispatch` auto-set status to Dispatched and dispatchDate to today when lrPhotoId is non-empty

**Frontend:**
- After login, check if user's principal is in Users table; if not, show "Access Denied" screen (not dashboard)
- Role-based routing: Admin sees Users management page + full dashboard; Staff sees limited nav
- Users management page (Admin only): list users, add user (name, email, role), remove user
- Pending Dispatch screen: dedicated page showing only PendingDispatch + Packed orders
- Dashboard: add Daily Dispatch Report section showing today's stats and dispatched order list
- Customer search in NewOrder: replace dropdown with live search input (typeahead) that queries customers by name or phone; show Add New Customer inline
- Order search by phone number in OrdersList: add phone number search field
- Smart order number format change: ORD-YYMMDD-001
- Auto status change to Dispatched + auto dispatchDate when LR photo uploaded
- WhatsApp message updated to include "Bill and LR copy attached." line

### Modify

- Order number generation: change from ORD-NNNN to ORD-YYMMDD-NNN (date-based daily sequence)
- NewOrder form: replace customer dropdown with live search/typeahead
- OrderDetail: update WhatsApp message template
- OrdersList: add phone number search field alongside existing search
- Dashboard: add Daily Dispatch Report section
- AppShell in App.tsx: after identity check, also verify user is in Users table; show access denied or role-aware layout
- BottomNav: add Pending Dispatch tab; adjust nav items based on role

### Remove

- Old ORD-NNNN sequential number format (replaced by date-based)

## Implementation Plan

1. **Backend**: Add AppUser type, users Map, user CRUD functions, email/principal lookup, update Order with createdBy/lastUpdatedBy, new smart order number logic (YYMMDD + daily sequence), add getOrdersByPhone, getPendingDispatchOrders, getDailyDispatchReport, update updateOrderDispatch to auto-set dispatched state when lrPhotoId is set

2. **Frontend - Auth/User layer**: After login, call getUserByPrincipal; if null, show access denied screen. Store current user (email, role) in context. Gate routes by role.

3. **Frontend - Users page**: Admin-only page to list, add, remove users. Accessible from nav for admins only.

4. **Frontend - Pending Dispatch page**: New dedicated page querying getPendingDispatchOrders, displaying Order Number, Customer Name, Transport Name, Order Date, Salesperson.

5. **Frontend - NewOrder**: Replace customer dropdown with live search (typeahead), inline Add Customer modal.

6. **Frontend - OrdersList**: Add phone number search field, wire getOrdersByPhone.

7. **Frontend - Dashboard**: Add Daily Dispatch Report section with stats cards and dispatched-today list.

8. **Frontend - OrderDetail**: Auto-dispatch on LR photo upload, updated WhatsApp message format.

9. **Frontend - BottomNav**: Update tabs to include Pending Dispatch; show/hide Users link based on role.
