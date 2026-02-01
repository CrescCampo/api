# Database Guidelines

## Overview

This project uses **Drizzle ORM** with **PostgreSQL** (or SQLite for local dev) for database management.

## Key Concepts

- **Schema-first**: Define schemas in TypeScript
- **Type-safe**: Automatic TypeScript types from schema
- **Migration-based**: Version-controlled schema changes
- **Repository Pattern**: Domain abstractions for data access

---

## Drizzle Configuration

Located at `drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/infra/database/drizzle/models/*.ts',
  out: './src/infra/database/migrations',
  dialect: 'postgresql', // or 'sqlite'
  dbCredentials: {
    // Connection details from environment
  },
});
```

---

## Database Commands

### Migrations

```bash
# Generate migration from schema changes
npm run generate

# Run pending migrations
npm run migrate

# Open Drizzle Studio (database GUI)
npm run studio
```

### Development Workflow

1. **Modify schema** in `src/infra/database/drizzle/models/`
2. **Generate migration**: `npm run generate`
3. **Review SQL** in `src/infra/database/migrations/`
4. **Apply migration**: `npm run migrate`
5. **Test changes** with Drizzle Studio: `npm run studio`

---

## Project Structure

```
src/infra/database/
├── database.module.ts              ← NestJS module for DI
│
├── drizzle/
│   ├── drizzle.service.ts         ← Database connection service
│   │
│   ├── models/                    ← Schema definitions
│   │   ├── farmer.model.ts
│   │   ├── farm.model.ts
│   │   └── ...
│   │
│   └── repositories/              ← Repository implementations
│       ├── farmer.repository.ts
│       ├── farm.repository.ts
│       └── ...
│
├── migrations/                    ← Generated SQL migrations
│   ├── 0000_amazing_aqueduct.sql
│   ├── 0001_absent_nuke.sql
│   └── meta/                      ← Migration metadata
│
└── seed/                          ← Database seeding
    ├── index.ts
    ├── seed-up.ts
    └── seed-down.ts
```

---

## Defining Schemas

### Schema File Structure

Located in `src/infra/database/drizzle/models/`:

```typescript
// farmer.model.ts
import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

export const farmers = pgTable('farmers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  disabled: boolean('disabled').notNull().default(false),
  farmId: uuid('farm_id').notNull().references(() => farms.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at'),
  lastLogin: timestamp('last_login'),
});

// Type inference
export type Farmer = typeof farmers.$inferSelect;
export type NewFarmer = typeof farmers.$inferInsert;
```

### Common Column Types

| Drizzle Type | PostgreSQL | TypeScript | Example |
|--------------|------------|------------|---------|
| `uuid()` | UUID | `string` | `id: uuid('id').primaryKey()` |
| `varchar(length)` | VARCHAR | `string` | `name: varchar('name', { length: 255 })` |
| `text()` | TEXT | `string` | `description: text('description')` |
| `integer()` | INTEGER | `number` | `age: integer('age')` |
| `numeric(precision, scale)` | NUMERIC | `string` | `price: numeric('price', { precision: 10, scale: 2 })` |
| `boolean()` | BOOLEAN | `boolean` | `active: boolean('active')` |
| `timestamp()` | TIMESTAMP | `Date` | `createdAt: timestamp('created_at')` |
| `date()` | DATE | `string` | `birthDate: date('birth_date')` |

### Constraints and Modifiers

```typescript
export const farmers = pgTable('farmers', {
  // Primary key
  id: uuid('id').primaryKey().defaultRandom(),
  
  // Not null
  name: varchar('name', { length: 255 }).notNull(),
  
  // Unique constraint
  email: varchar('email', { length: 255 }).unique(),
  
  // Default value
  disabled: boolean('disabled').default(false),
  
  // Foreign key
  farmId: uuid('farm_id').references(() => farms.id),
  
  // Auto-generated timestamp
  createdAt: timestamp('created_at').defaultNow(),
});
```

### Relationships

```typescript
// One-to-many: One farm has many farmers
export const farms = pgTable('farms', {
  id: uuid('id').primaryKey().defaultRandom(),
  // ... other columns
});

export const farmers = pgTable('farmers', {
  id: uuid('id').primaryKey().defaultRandom(),
  farmId: uuid('farm_id')
    .notNull()
    .references(() => farms.id, { onDelete: 'cascade' }),
});

// Define relations (for querying)
export const farmsRelations = relations(farms, ({ many }) => ({
  farmers: many(farmers),
}));

export const farmersRelations = relations(farmers, ({ one }) => ({
  farm: one(farms, {
    fields: [farmers.farmId],
    references: [farms.id],
  }),
}));
```

---

## Migrations

### Generating Migrations

When you modify a schema:

```bash
npm run generate
```

This creates a SQL file in `src/infra/database/migrations/`:

```sql
-- 0003_mighty_black_panther.sql
CREATE TABLE IF NOT EXISTS "farmers" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "email" VARCHAR(255) NOT NULL UNIQUE,
  "password" VARCHAR(255) NOT NULL,
  "disabled" BOOLEAN DEFAULT false NOT NULL,
  "farm_id" UUID NOT NULL REFERENCES "farms"("id") ON DELETE CASCADE,
  "created_at" TIMESTAMP DEFAULT now() NOT NULL,
  "updated_at" TIMESTAMP,
  "last_login" TIMESTAMP
);
```

### Applying Migrations

```bash
npm run migrate
```

**Always review generated SQL before applying!**

### Migration Best Practices

✅ **Do:**
- Generate one migration per logical change
- Review SQL before applying
- Test migrations on dev database first
- Keep migrations in version control
- Write both `up` and `down` migrations when possible

❌ **Don't:**
- Manually edit generated SQL (unless necessary)
- Delete old migrations
- Change applied migrations
- Skip migrations in production

---

## Repository Pattern

### Domain Repository Interface

Define abstract class in `src/domain/application/repositories/`:

```typescript
// FarmerRepository.ts
import Farmer from 'domain/enterprise/entities/Farmer';

export default abstract class FarmerRepository {
  abstract save(farmer: Farmer): Promise<void>;
  abstract findByEmail(email: string): Promise<Farmer | null>;
  abstract findById(id: string): Promise<Farmer | null>;
  abstract delete(id: string): Promise<void>;
}
```

### Drizzle Repository Implementation

Implement in `src/infra/database/drizzle/repositories/`:

```typescript
// farmer.repository.ts
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import Farmer from 'domain/enterprise/entities/Farmer';
import { DrizzleService } from '../drizzle.service';
import { farmers } from '../models/farmer.model';

@Injectable()
export default class DrizzleFarmerRepository implements FarmerRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async save(farmer: Farmer): Promise<void> {
    const data = {
      id: farmer.id,
      name: farmer.name,
      email: farmer.email,
      password: farmer.password,
      disabled: farmer.disabled,
      farmId: farmer.farmId,
      createdAt: farmer.createdAt,
      updatedAt: farmer.updatedAt,
      lastLogin: farmer.lastLogin,
    };

    // Upsert: insert if new, update if exists
    await this.drizzle.db
      .insert(farmers)
      .values(data)
      .onConflictDoUpdate({
        target: farmers.id,
        set: data,
      });
  }

  async findByEmail(email: string): Promise<Farmer | null> {
    const result = await this.drizzle.db
      .select()
      .from(farmers)
      .where(eq(farmers.email, email))
      .limit(1);

    if (!result[0]) {
      return null;
    }

    return this.toDomain(result[0]);
  }

  async findById(id: string): Promise<Farmer | null> {
    const result = await this.drizzle.db
      .select()
      .from(farmers)
      .where(eq(farmers.id, id))
      .limit(1);

    if (!result[0]) {
      return null;
    }

    return this.toDomain(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.db
      .delete(farmers)
      .where(eq(farmers.id, id));
  }

  // Private mapper: Drizzle model → Domain entity
  private toDomain(raw: typeof farmers.$inferSelect): Farmer {
    return Farmer.create(
      {
        name: raw.name,
        email: raw.email,
        password: raw.password,
        disabled: raw.disabled,
        farmId: raw.farmId,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        lastLogin: raw.lastLogin,
      },
      raw.id,
    );
  }
}
```

### Repository Guidelines

✅ **Do:**
- Map between domain entities and database models
- Use `toDomain()` and `toPersistence()` helper methods
- Handle null cases explicitly
- Use Drizzle query builder methods
- Inject `DrizzleService` via constructor

❌ **Don't:**
- Return Drizzle models directly
- Expose query builders outside repository
- Put business logic in repositories
- Query unrelated tables (respect aggregate boundaries)

---

## Common Query Patterns

### Basic CRUD

```typescript
// Create/Update (upsert)
await this.drizzle.db
  .insert(farmers)
  .values(data)
  .onConflictDoUpdate({ target: farmers.id, set: data });

// Read one
const result = await this.drizzle.db
  .select()
  .from(farmers)
  .where(eq(farmers.id, id))
  .limit(1);

// Read many
const results = await this.drizzle.db
  .select()
  .from(harvests)
  .where(eq(harvests.farmId, farmId));

// Update
await this.drizzle.db
  .update(farmers)
  .set({ disabled: true })
  .where(eq(farmers.id, id));

// Delete
await this.drizzle.db
  .delete(farmers)
  .where(eq(farmers.id, id));
```

### Filtering

```typescript
import { eq, and, or, gt, lt, like, between, inArray } from 'drizzle-orm';

// Equal
.where(eq(farmers.email, 'john@example.com'))

// Multiple conditions (AND)
.where(and(
  eq(farmers.farmId, farmId),
  eq(farmers.disabled, false),
))

// Multiple conditions (OR)
.where(or(
  eq(farmers.role, 'admin'),
  eq(farmers.role, 'manager'),
))

// Greater than / Less than
.where(gt(harvests.quantity, 100))
.where(lt(transactions.amount, 0))

// LIKE (pattern matching)
.where(like(farmers.name, '%John%'))

// BETWEEN
.where(between(harvests.date, startDate, endDate))

// IN array
.where(inArray(farmers.id, ['id1', 'id2', 'id3']))
```

### Joins

```typescript
// One-to-many join
const results = await this.drizzle.db
  .select({
    farmer: farmers,
    farm: farms,
  })
  .from(farmers)
  .leftJoin(farms, eq(farmers.farmId, farms.id))
  .where(eq(farmers.id, farmerId));
```

### Ordering and Pagination

```typescript
import { desc, asc } from 'drizzle-orm';

// Order by
.orderBy(desc(harvests.createdAt))
.orderBy(asc(farmers.name))

// Pagination
.limit(20)
.offset(page * 20)
```

### Aggregations

```typescript
import { count, sum, avg } from 'drizzle-orm';

// Count
const result = await this.drizzle.db
  .select({ count: count() })
  .from(farmers)
  .where(eq(farmers.farmId, farmId));

// Sum
const result = await this.drizzle.db
  .select({ total: sum(transactions.amount) })
  .from(transactions)
  .where(eq(transactions.farmId, farmId));
```

---

## Seeding Database

Located in `src/infra/database/seed/`:

### seed-up.ts

```typescript
export async function seedUp(db: DrizzleDB) {
  // Insert initial data
  await db.insert(farms).values([
    { id: 'farm-1', name: 'Green Valley Farm' },
    { id: 'farm-2', name: 'Sunny Acres' },
  ]);

  await db.insert(farmers).values([
    {
      id: 'farmer-1',
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed_password',
      farmId: 'farm-1',
    },
  ]);
}
```

### seed-down.ts

```typescript
export async function seedDown(db: DrizzleDB) {
  // Clean up seeded data
  await db.delete(farmers).where(eq(farmers.id, 'farmer-1'));
  await db.delete(farms).where(inArray(farms.id, ['farm-1', 'farm-2']));
}
```

---

## DrizzleService

Central service for database connection:

```typescript
// drizzle.service.ts
import { Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './models';

@Injectable()
export class DrizzleService {
  public db: ReturnType<typeof drizzle>;

  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    this.db = drizzle(pool, { schema });
  }
}
```

---

## Transactions

For operations spanning multiple tables:

```typescript
async createFarmerWithFarm(input: Input): Promise<void> {
  await this.drizzle.db.transaction(async (tx) => {
    // Insert farm
    await tx.insert(farms).values({ id: farmId, name: input.farmName });

    // Insert farmer
    await tx.insert(farmers).values({
      id: farmerId,
      name: input.name,
      email: input.email,
      farmId: farmId,
    });
  });
}
```

---

## Local Development

### Using Docker Compose

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: cresccampo
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
```

```bash
# Start database
docker-compose up -d

# Run migrations
npm run migrate

# Seed database
npm run seed:up
```

### Using Drizzle Studio

Visual database browser:

```bash
npm run studio
```

Opens GUI at `https://local.drizzle.studio`

---

## Best Practices

✅ **Do:**
- Define schemas in `models/`
- Generate migrations after schema changes
- Review generated SQL before applying
- Use repository pattern (never query directly in use cases)
- Map domain entities ↔ database models in repositories
- Use transactions for multi-table operations
- Use type-safe query builders

❌ **Don't:**
- Expose Drizzle models outside infrastructure layer
- Write raw SQL (unless absolutely necessary)
- Skip migrations
- Put business logic in repositories
- Query database directly from use cases or controllers

---

## Quick Reference

```bash
# Schema workflow
npm run generate        # Generate migration from schema
npm run migrate         # Apply pending migrations
npm run studio          # Open database GUI

# Development
docker-compose up -d    # Start local database
npm run seed:up         # Seed database
npm run seed:down       # Clear seeded data
```
