# Order Dispatch Manager

## Current State
The app has a full user management system with role-based access (Admin/Staff). Users are stored in an `AppUser` table and must have their Principal ID registered before they can access the app. Currently there is no way to add the first admin user -- anyone who logs in before any users are registered sees "Access Denied" with no way to self-register, creating a cold-start deadlock.

## Requested Changes (Diff)

### Add
- `bootstrapAdmin` backend function: callable by anyone, but only works when the users table is empty (zero registered users). Registers the caller as the first Admin user with their provided name and email. After the first admin is created, this function is permanently blocked.
- `hasUsers` backend query: returns a boolean indicating whether any users exist in the system. Used by the frontend to detect the cold-start state without requiring auth.
- Bootstrap Setup Screen in the frontend: shown when `hasUsers` returns false. Displays a form for the logged-in user to enter their name and email and register themselves as Admin. After submission, redirects to the normal app.

### Modify
- Access Denied screen: when `hasUsers` returns false, show a "Setup Admin Account" prompt/button that navigates to the bootstrap screen instead of a plain denial message.

### Remove
- Nothing removed.

## Implementation Plan
1. Add `hasUsers` public query to `main.mo` (no auth check -- returns `users.size() == 0`).
2. Add `bootstrapAdmin` public shared function to `main.mo`: checks users table is empty, then inserts caller as Admin using the existing `users` map and AccessControl grant, increments `nextUserId`.
3. In the frontend, add a `BootstrapAdminPage` component with a name + email form.
4. In the app router/auth flow, call `hasUsers` on load. If false and user is logged in, show the bootstrap page. If false and user is not logged in, prompt login first.
5. On the Access Denied screen, add a check: if no users exist, show "First time setup" CTA leading to the bootstrap page.
