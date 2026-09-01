# Switching from Aiven (Hosted) Postgres to Local Postgres

A short record of what changed to move the CRM database from the hosted Aiven
instance to a local PostgreSQL running on the machine.

## What was happening before

The connection URL pointed at a hosted Aiven Postgres:

```
postgres://avnadmin:AVNS_...@pg-medusa-001-my-medusa-db.d.aivencloud.com:23371/defaultdb?uselibpqcompat=true&sslmode=require
```

- That host was sometimes unreachable (DNS `EAI_AGAIN` errors, "Can't reach
  database server").
- The database was shared with another project (a Medusa instance) on the same
  Aiven box, which is why everything lived in its own `crm` schema.

## The new setup

The `.env` `DATABASE_URL` now points at a local Postgres (created and managed
with pgAdmin):

```
DATABASE_URL="postgresql://postgres:5120@localhost:5432/relate_crm_db?schema=crm"
```

The `?schema=crm` parameter is important — it tells the Prisma **CLI** to create
tables inside a schema named `crm` (not the default `public`).

## Code changes made

### 1. `server/src/lib/prisma.ts` — keep using the `crm` schema

The runtime Prisma client connects through the `PrismaPg` driver adapter, which
**ignores** `?schema=` in the connection string. To make every query resolve to
the `crm` schema, the pool sets the Postgres `search_path` startup option:

```ts
const adapter = new PrismaPg(
  {
    connectionString: env.DATABASE_URL,
    // pg startup option: route unqualified table names to the crm schema.
    options: "-c search_path=crm",
    max: 10,
  },
  {
    schema: PRISMA_SCHEMA, // "crm" — metadata only
  }
)
```

No change was needed here for the move itself — the file already routed to the
`crm` schema, and that behaviour is preserved on local Postgres.

### 2. `server/prisma/seed.ts` — same schema routing for seeding

The seed script used its own `PrismaClient` with the same adapter pattern, so it
also keeps `options: "-c search_path=crm"` to write the bootstrap users into the
`crm` schema. This was left untouched by the move.

### 3. `server/.env` — the actual switch

The only meaningful change for the move was updating `DATABASE_URL` from the
Aiven host to `localhost:5432/relate_crm_db?schema=crm`. Everything else (JWT
secrets, S3 storage, SMTP placeholders) stayed the same.

## What I did NOT change (deliberately)

- The `crm` schema strategy stays in place — tables live in a `crm` schema, not
  `public`. Earlier I briefly switched the adapter to `public`, but that was
  reversed: the project's design is a dedicated `crm` schema, and that is kept.
- No model/schema changes. The Prisma schema is identical.
- No client-side changes.

## Commands run to get it working

```bash
cd server
npx prisma db push        # creates the crm schema + all tables locally
npm run db:seed           # inserts the 4 bootstrap users
```

Verified by querying `prisma.user.findMany()` with the app's adapter config,
which returned all 4 seeded users from the `crm` schema.

## Notes for later

- If the database or schema is recreated in pgAdmin, re-run `prisma db push`
  (and `db:seed` for the users).
- If a future team wants the tables in `public` instead, both the `.env`
  `?schema=` parameter and the `search_path` option in `lib/prisma.ts` /
  `seed.ts` must change together — they are two halves of the same setting.
