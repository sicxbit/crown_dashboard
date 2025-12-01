# Ticket lifecycle overview

1. **User opens the ticket portal**
   - Logged-in caregivers land on the ticket portal (`app/tickets/page.tsx`), which loads their existing tickets from Prisma using `serializeTickets` and renders `TicketPortal` with that data. Admin users are redirected to the admin ticket view.
2. **User submits a ticket**
   - The `TicketPortal` form (`components/tickets/TicketPortal.tsx`) collects title, description, and priority, then sends a `POST` request to `/api/tickets`.
3. **API validates and creates the ticket**
   - `/api/tickets` (`app/api/tickets/route.ts`) requires an authenticated user, validates the payload, and asks the AI assignment helper to suggest an assignee. It falls back to a default assignee if the AI does not return one. The route writes a new `Ticket` row (title, description, priority, status, createdByUserId, optional assigneeUserId) via Prisma and returns the serialized ticket.
4. **Ticket storage**
   - Prisma persists tickets in the `Ticket` model (`prisma/schema.prisma`) with fields for title, description, status (`open`/`in_progress`/`resolved`), priority, timestamps, creator, and optional assignee.
5. **Caregiver view and filtering**
   - Caregivers see their own tickets in `TicketPortal`, which renders status chips, priority/assignee badges, and timestamps. The list refreshes immediately when a new ticket is created because the returned ticket is prepended to local state.
6. **Admin oversight and updates**
   - Admins access `/admin/tickets` (`app/admin/tickets/page.tsx`), which feeds data into `AdminTicketsTable`. That table supports filtering by status, searching text, and inline creation of new tickets. Admins can change status, priority, and assignment.
7. **Updating or closing a ticket**
   - Admin edits trigger `PATCH` calls to `/api/tickets/[id]` (`app/api/tickets/[id]/route.ts`), which requires an admin user, validates the requested status/priority/assignee, and updates the stored ticket before returning the serialized result.
8. **Lifecycle completion**
   - Once an admin sets `status` to `resolved`, the updated ticket flows back to both admin and caregiver views via subsequent fetches or immediate state updates after the PATCH response.

```
User (Dashboard) → TicketPortal form → POST /api/tickets → Prisma Ticket (title/description/priority/status/assignee) → Admin Tickets Table → PATCH /api/tickets/[id] (status/priority/assignee) → Ticket shows updated/closed in caregiver & admin views
```
