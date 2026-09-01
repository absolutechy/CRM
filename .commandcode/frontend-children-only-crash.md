# Frontend crash after login — `React.Children.only expected to single React element child`

## Symptom

After a successful login the app blanks with:

> Uncaught Error: React.Children.only expected to receive a single React element
> child.

## Root cause

`client/src/components/ui/button.tsx` was extended to show a shadcn spinner while an
API request is in flight. The implementation always rendered the spinner next to the
children:

```tsx
<Comp ...>
  {loading && <Loader2 className="size-4 animate-spin" />}
  {children}
</Comp>
```

`Comp` is `Slot.Root` from Radix whenever the button is used with `asChild`. Radix's
`Slot` validates its children with `React.Children.only(...)`, which requires **exactly
one** React element. Because the spinner expression `{loading && <Loader2/>}` is always
emitted as a child node (it becomes `undefined`/`false` when `loading` is falsy), every
`asChild` button ended up with two children instead of one:

- `<Button asChild>` with `loading` undefined → children `[undefined, <Link>]` → Slot throws.
- `<Button asChild>` with `loading={true}` → children `[<Loader2>, <Link>]` → Slot throws.

Regular buttons (`asChild` not set) were unaffected because native `<button>` accepts
multiple children — which is why **login still worked, but the Dashboard crashed on
mount** (the dashboard grid is full of `<Button asChild>` nav buttons).

## Fix

`client/src/components/ui/button.tsx` now passes a single child to the comp:

```tsx
<Comp ...>
  {asChild ? (
    children
  ) : (
    <>
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </>
  )}
</Comp>
```

- `asChild` buttons hand `children` straight to `Slot` (one element) — no crash.
- Regular buttons keep the spinner + label inside a fragment, which native buttons render fine.

## Verification

A reproduction using the project's React 19 + `@radix-ui/react-slot` confirmed:

- `asChild` (loading true / false / undefined) → renders cleanly, no throw.
- Plain button with `loading` → renders spinner + label.
- `npm run typecheck` passes with no errors.

## Related backend fixes (same recovery pass)

While validating the leads flow I also resolved compile/runtime gaps in
`server/src/services/leadsService.ts`:

- **Enum mismatch** — the service's Zod `LeadSource`/`LeadStatus` enums included
  values (`phone`, `advertisement`, `social`, `proposal`, `negotiation`…) that
  don't exist in the Prisma schema. They now match the schema exactly
  (`web/referral/event/outreach/campaign/other`, `new/contacted/qualified/unqualified/converted`).
- **Document ordering** — getLeadById ordered `documents` by `createdAt`, but the
  `Document` model only has `uploadedAt`. Switched to `uploadedAt`.
- **Activity relation** — conversion logged the actor as `actor: currentUserId`
  (a bare string), but `Activity.actor` is a relation. Changed to `actorId: currentUserId`
  and added the required `at: new Date()` timestamp.
- **Soft delete** — `deleteLead` was a hard `prisma.lead.delete`; it now sets
  `deletedAt = new Date()`, and `listLeads`/`getLeadById`/`updateLead`/
  `convertLead` filter on `deletedAt: null` so soft-deleted leads are hidden but
  preserved. The `deletedAt` column already exists in
  `server/prisma/schema.prisma` (with an index), so `npx prisma db push` is the
  only step needed to materialise it in the DB.

`npx tsc --noEmit` is now clean for both `client` and `server`.
