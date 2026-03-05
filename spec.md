# Order Dispatch Manager

## Current State

- Full-stack app with Motoko backend and React frontend.
- Orders table has: id, orderNumber, orderDate, salesperson, customerId, customerName, customerPhone, customerCity, transporterId, transporterName, orderValue, notes, lrNumber, dispatchDate, status, billPhotoId, lrPhotoId, createdBy, lastUpdatedBy, deliveredDate, invoiceDocId, packingListId, transportReceiptId, otherDocId.
- Order creation is a single-page form (salesperson, customer, transporter, value, notes).
- OrderDetail page shows createdBy and lastUpdatedBy but no lastUpdatedTime.
- No Priority field on orders.
- No Order Age calculation or display.
- No edit locking when order is dispatched.
- New Order form is not a multi-step wizard.
- Orders list and Pending Dispatch screen have no priority sorting.

## Requested Changes (Diff)

### Add

- `lastUpdatedTime` field (Int, nanosecond timestamp) to Order type in backend.
- `priority` field (variant: #normal | #urgent | #veryUrgent) to Order type in backend.
- `updateOrderInfo` backend function to update core order fields (customer, transporter, salesperson, orderValue, notes, priority) — used for admin edits.
- `priority` parameter to `createOrder`.
- `lastUpdatedTime` included in `updateOrderDispatch` response (automatically set to Time.now() on every update).
- Order Age calculated field on frontend (computed from orderDate nanoseconds to current date in days).
- 3-step wizard UI for New Order page (Step 1: Customer, Step 2: Order Details + Priority, Step 3: Notes + Save).
- Priority selector (Normal / Urgent / Very Urgent) in New Order form and Order Detail edit section.
- Priority badge/indicator on OrderCard in OrdersList.
- Priority sort option in OrdersList and PendingDispatch screen (Urgent/Very Urgent first).
- Order Age displayed on OrderCard in OrdersList and in PendingDispatch list items.
- Edit lock on dispatched orders for non-admin users: Customer Name, Customer Phone, Customer City, Transport Name, Order Value, Order Date fields become read-only when status = Dispatched and user role = Staff.
- "Last Updated Time" shown on Order Details page alongside createdBy / lastUpdatedBy.

### Modify

- `createOrder` backend: add `priority` parameter, set `lastUpdatedTime = Time.now()`.
- `updateOrderDispatch` backend: automatically set `lastUpdatedTime = Time.now()` on every call.
- Order type in backend: add `priority` and `lastUpdatedTime` fields.
- OrderDetail page: show "Last Updated Time" in Order Details card.
- OrderDetail page: lock dispatch-related and core order fields when status is Dispatched and current user is Staff role.
- OrdersList OrderCard: show Priority badge and Order Age.
- PendingDispatch: show Priority badge, Order Age, and allow sorting by priority.
- NewOrder page: refactor into 3-step wizard with progress indicator.

### Remove

Nothing removed.

## Implementation Plan

1. **Backend**: Add `priority` variant and `lastUpdatedTime : Int` to Order type. Add `priority` param to `createOrder`. Auto-set `lastUpdatedTime = Time.now()` in both `createOrder` and `updateOrderDispatch`. Add `updateOrderInfo` function for editing core fields (admin-level edit). Update `getPendingDispatchOrders` and `getOrders` to return full orders (already does).

2. **Frontend - New Order wizard**: Refactor NewOrder.tsx into 3-step form with step indicator, animated step transitions, step 1 = customer search/add, step 2 = salesperson + transport + order value + priority, step 3 = notes + confirm + submit.

3. **Frontend - Priority field**: Add priority select (Normal/Urgent/Very Urgent) in step 2 of new order. Add priority selector in OrderDetail update section. Add priority badges on OrderCard and PendingDispatch items. Add priority sort toggle.

4. **Frontend - Order Age**: Compute days since orderDate on frontend. Display as "X Days" / "1 Day" / "0 Days" on OrderCard and PendingDispatch items.

5. **Frontend - Last Updated Time**: Display `lastUpdatedTime` (formatted) in Order Details card as "Last Updated Time".

6. **Frontend - Edit Lock**: In OrderDetail, when order.status === dispatched and currentUser.role === staff, render locked fields (customerName, customerPhone, customerCity, transporterName, orderValue) as read-only display rows instead of inputs. Admin users can still edit. Show a lock icon/banner explaining locked fields.

7. **Frontend - Priority sorting**: In OrdersList and PendingDispatch, add sort by priority button (Very Urgent > Urgent > Normal). Default sort remains by date.
