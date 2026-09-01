# Database Schema Issue — Why Login Failed with "table public.users does not exist"

> A plain-English write-up of the problem we hit while setting up authentication,
> and exactly how it was fixed.

## The short version

The app and the Prisma CLI were talking to **two different schemas** in the same
Postgres database:

- The **Prisma CLI** (the tool that creates tables) created all tables inside a
  schema called **`crm`**.
- The **running app** (PrismaClient at runtime) was looking for tables in the
  **`public`** schema — the default.

So when you tried to log in, the app asked Postgres for the `users` table in
`public`, that table didn't exist there (it was in `crm`), and Postgres answered:
`The table public.users does not exist`.

## Background: one database, two schemas

Postgres databases can contain several **schemas** — think of them as folders
inside the same database. Our schema file (`server/prisma/schema.prisma`) was
designed so everything lives in its own `crm` schema, keeping the CRM data
isolated from anything else sharing the same Postgres instance. That's why the
connection string in `.env.example` ends with `?schema=crm`.

## Two programs, two different ways of reading the connection string

This is the heart of the problem. **Prisma is actually two separate pieces:**

| Piece | What it does | How it picks the schema |
|---|---|---|
| **Prisma CLI** (`prisma db push`, `migrate`, `seed` via `prisma.config.ts`) | Creates tables, runs migrations | ✅ Reads `?schema=crm` straight from the `DATABASE_URL` |
| **PrismaClient at runtime** (via `@prisma/adapter-pg`) | Runs the actual queries when the server handles requests | ❌ **Ignores** `?schema=crm`. It doesn't read that parameter at all |

So when we added `&schema=crm` to the `.env` and ran `prisma db push`, the CLI
happily created all 22 tables inside the `crm` schema. But when the server
started and you hit the login endpoint, the runtime client generated plain
queries like `SELECT ... FROM "users"` with **no schema prefix**. Postgres then
resolved `users` using its default search path, which points at `public` — and
found nothing.

We even tried passing `schema: "crm"` to the adapter. It turns out that option
is **just metadata** — Prisma reports it to the query engine, but it never
actually tells Postgres "look in the crm schema". So the queries still went to
`public`.

## The fix

The pg driver (the thing that actually opens the database connections) supports
startup options. We told every connection: "when you connect, set your search
path to the `crm` schema". From then on, unqualified table names like `users`
automatically resolve to `crm.users`.

```ts
// server/src/lib/prisma.ts
const adapter = new PrismaPg(
  {
    connectionString: env.DATABASE_URL,
    // pg startup option: route unqualified table names to the crm schema.
    options: "-c search_path=crm",
    max: 10,
  },
  {
    // Metadata only — Prisma reports this, but the real routing is search_path above.
    schema: PRISMA_SCHEMA,
  }
)
```

The same fix went into `server/prisma/seed.ts`, which had a second problem on
its own: it created `new PrismaClient()` **without any adapter**. Prisma 7
requires a driver adapter, so the seed script crashed on startup with
"PrismaClient was instantiated without any options". We gave it the same
`PrismaPg` adapter + `search_path` setup as the app.

## What about the earlier "Can't reach database server" error?

That was a **separate, temporary** problem. Before the schema mismatch, the
server couldn't reach the Aiven Postgres host at all (network / the DB being
unavailable at that moment). It was unrelated to the schema issue — once the
connection came back, the "table does not exist" error took over. Both are now
resolved: the app connects, the tables are in the right schema, and the seed
users are in place.

## The timeline, quickly

1. `prisma db push` → tables created in `crm` schema (CLI reads `?schema=crm`).
2. App runtime queries `users` with no schema prefix → Postgres looks in
   `public` → "table public.users does not exist".
3. Adapter's `schema` option didn't help (metadata only).
4. Fix: `options: "-c search_path=crm"` on the pg pool → every connection now
   searches `crm` first → queries find the tables.
5. Seed script also fixed to use the required driver adapter + same search path.
6. Login works.

## How to keep this from biting again

- Keep `?schema=crm` in `DATABASE_URL` (the CLI needs it).
- Keep the `options: "-c search_path=crm"` in the pg pool config (the runtime
  needs it). **Both are required** — neither one covers both halves of Prisma.
- The comment in `server/src/lib/prisma.ts` explains this so the next person
  doesn't "simplify" one of them away.
- If you ever move to a different schema name, change it in **three** places:
  `.env`'s `?schema=`, `PRISMA_SCHEMA` in `lib/prisma.ts`, and the seed script.
