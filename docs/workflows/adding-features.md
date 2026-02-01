# Adding New Features

A step-by-step workflow for adding features following DDD and Clean Architecture principles.

## Feature Development Checklist

- [ ] 1. Define domain entities (if needed)
- [ ] 2. Create repository interface (if needed)
- [ ] 3. Create use case with tests
- [ ] 4. Implement repository
- [ ] 5. Create HTTP controller and DTOs
- [ ] 6. Wire up dependencies in modules
- [ ] 7. Test end-to-end

---

## Example: Adding "Create Harvest" Feature

We'll walk through adding a complete feature from domain to HTTP.

---

## Step 1: Define Domain Entity

**File**: `src/domain/enterprise/entities/Harvest.ts`

```typescript
import Entity from 'core/entity';
import { Optional } from 'core/optional';

interface HarvestProps {
  farmId: string;
  cultureId: string;
  quantity: number;
  unit: string;
  harvestDate: Date;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

export default class Harvest extends Entity<HarvestProps> {
  get farmId() {
    return this.props.farmId;
  }

  get cultureId() {
    return this.props.cultureId;
  }

  get quantity() {
    return this.props.quantity;
  }

  get unit() {
    return this.props.unit;
  }

  get harvestDate() {
    return this.props.harvestDate;
  }

  get notes() {
    return this.props.notes;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  updateQuantity(quantity: number) {
    this.props.quantity = quantity;
    this.#touch();
  }

  #touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<HarvestProps, 'notes' | 'createdAt' | 'updatedAt'>,
    id?: string,
  ) {
    return new Harvest(
      {
        ...props,
        notes: props.notes ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id,
    );
  }
}
```

**Key Points**:
- Extends `Entity<Props>`
- Getters for all properties
- Behavior methods for state changes
- `#touch()` updates timestamp
- `static create()` factory method with defaults

---

## Step 2: Create Repository Interface

**File**: `src/domain/application/repositories/HarvestRepository.ts`

```typescript
import Harvest from 'domain/enterprise/entities/Harvest';

export default abstract class HarvestRepository {
  abstract save(harvest: Harvest): Promise<void>;
  abstract findById(id: string): Promise<Harvest | null>;
  abstract findByFarmId(farmId: string): Promise<Harvest[]>;
  abstract delete(id: string): Promise<void>;
}
```

**Key Points**:
- Abstract class (interface)
- Returns domain entities
- Uses meaningful method names

---

## Step 3: Create Use Case with Tests

### Use Case

**File**: `src/domain/application/use-cases/harvests/create-harvest.ts`

```typescript
import { Injectable } from '@nestjs/common';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import FarmRepository from 'domain/application/repositories/FarmRepository';
import CultureRepository from 'domain/application/repositories/CultureRepository';
import Harvest from 'domain/enterprise/entities/Harvest';
import FarmNotFoundError from 'domain/application/errors/farm/FarmNotFoundError';
import CultureNotFoundError from 'domain/application/errors/culture/CultureNotFoundError';

export interface Input {
  farmId: string;
  cultureId: string;
  quantity: number;
  unit: string;
  harvestDate: Date;
  notes?: string;
}

export interface Output {
  harvestId: string;
}

@Injectable()
export default class CreateHarvest {
  constructor(
    private readonly harvestRepository: HarvestRepository,
    private readonly farmRepository: FarmRepository,
    private readonly cultureRepository: CultureRepository,
  ) {}

  async execute(input: Input): Promise<Output> {
    // Validate farm exists
    const farm = await this.farmRepository.findById(input.farmId);
    if (!farm) {
      throw new FarmNotFoundError();
    }

    // Validate culture exists
    const culture = await this.cultureRepository.findById(input.cultureId);
    if (!culture) {
      throw new CultureNotFoundError();
    }

    // Create harvest entity
    const harvest = Harvest.create({
      farmId: input.farmId,
      cultureId: input.cultureId,
      quantity: input.quantity,
      unit: input.unit,
      harvestDate: input.harvestDate,
      notes: input.notes,
    });

    // Persist
    await this.harvestRepository.save(harvest);

    return {
      harvestId: harvest.id,
    };
  }
}
```

### Unit Tests

**File**: `src/domain/application/use-cases/harvests/create-harvest.spec.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import CreateHarvest from './create-harvest';
import InMemoryHarvestRepository from 'test/unit/repositories/InMemoryHarvestRepository';
import InMemoryFarmRepository from 'test/unit/repositories/InMemoryFarmRepository';
import InMemoryCultureRepository from 'test/unit/repositories/InMemoryCultureRepository';
import Farm from 'domain/enterprise/entities/Farm';
import Culture from 'domain/enterprise/entities/Culture';
import FarmNotFoundError from 'domain/application/errors/farm/FarmNotFoundError';

describe('CreateHarvest', () => {
  let sut: CreateHarvest;
  let harvestRepository: InMemoryHarvestRepository;
  let farmRepository: InMemoryFarmRepository;
  let cultureRepository: InMemoryCultureRepository;

  beforeEach(() => {
    harvestRepository = new InMemoryHarvestRepository();
    farmRepository = new InMemoryFarmRepository();
    cultureRepository = new InMemoryCultureRepository();

    sut = new CreateHarvest(
      harvestRepository,
      farmRepository,
      cultureRepository,
    );
  });

  it('should create a new harvest', async () => {
    const farm = Farm.create({});
    await farmRepository.save(farm);

    const culture = Culture.create({ name: 'Corn' });
    await cultureRepository.save(culture);

    const result = await sut.execute({
      farmId: farm.id,
      cultureId: culture.id,
      quantity: 100,
      unit: 'kg',
      harvestDate: new Date('2024-01-15'),
    });

    expect(result.harvestId).toBeTruthy();
    expect(harvestRepository.items).toHaveLength(1);
    expect(harvestRepository.items[0].quantity).toBe(100);
  });

  it('should throw FarmNotFoundError when farm does not exist', async () => {
    const culture = Culture.create({ name: 'Corn' });
    await cultureRepository.save(culture);

    await expect(
      sut.execute({
        farmId: 'nonexistent',
        cultureId: culture.id,
        quantity: 100,
        unit: 'kg',
        harvestDate: new Date(),
      }),
    ).rejects.toThrow(FarmNotFoundError);
  });

  it('should save harvest with optional notes', async () => {
    const farm = Farm.create({});
    await farmRepository.save(farm);

    const culture = Culture.create({ name: 'Corn' });
    await cultureRepository.save(culture);

    await sut.execute({
      farmId: farm.id,
      cultureId: culture.id,
      quantity: 100,
      unit: 'kg',
      harvestDate: new Date(),
      notes: 'Good quality harvest',
    });

    expect(harvestRepository.items[0].notes).toBe('Good quality harvest');
  });
});
```

**Run tests**: `npm run test -- create-harvest.spec.ts`

---

## Step 4: Implement Repository

### Database Schema

**File**: `src/infra/database/drizzle/models/harvest.model.ts`

```typescript
import { pgTable, uuid, varchar, integer, date, text, timestamp } from 'drizzle-orm/pg-core';
import { farms } from './farm.model';
import { cultures } from './culture.model';

export const harvests = pgTable('harvests', {
  id: uuid('id').primaryKey().defaultRandom(),
  farmId: uuid('farm_id').notNull().references(() => farms.id),
  cultureId: uuid('culture_id').notNull().references(() => cultures.id),
  quantity: integer('quantity').notNull(),
  unit: varchar('unit', { length: 50 }).notNull(),
  harvestDate: date('harvest_date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at'),
});
```

**Generate migration**:
```bash
npm run generate
npm run migrate
```

### Repository Implementation

**File**: `src/infra/database/drizzle/repositories/harvest.repository.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import Harvest from 'domain/enterprise/entities/Harvest';
import { DrizzleService } from '../drizzle.service';
import { harvests } from '../models/harvest.model';

@Injectable()
export default class DrizzleHarvestRepository implements HarvestRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async save(harvest: Harvest): Promise<void> {
    const data = {
      id: harvest.id,
      farmId: harvest.farmId,
      cultureId: harvest.cultureId,
      quantity: harvest.quantity,
      unit: harvest.unit,
      harvestDate: harvest.harvestDate.toISOString().split('T')[0],
      notes: harvest.notes,
      createdAt: harvest.createdAt,
      updatedAt: harvest.updatedAt,
    };

    await this.drizzle.db
      .insert(harvests)
      .values(data)
      .onConflictDoUpdate({
        target: harvests.id,
        set: data,
      });
  }

  async findById(id: string): Promise<Harvest | null> {
    const result = await this.drizzle.db
      .select()
      .from(harvests)
      .where(eq(harvests.id, id))
      .limit(1);

    return result[0] ? this.toDomain(result[0]) : null;
  }

  async findByFarmId(farmId: string): Promise<Harvest[]> {
    const results = await this.drizzle.db
      .select()
      .from(harvests)
      .where(eq(harvests.farmId, farmId));

    return results.map((r) => this.toDomain(r));
  }

  async delete(id: string): Promise<void> {
    await this.drizzle.db.delete(harvests).where(eq(harvests.id, id));
  }

  private toDomain(raw: typeof harvests.$inferSelect): Harvest {
    return Harvest.create(
      {
        farmId: raw.farmId,
        cultureId: raw.cultureId,
        quantity: raw.quantity,
        unit: raw.unit,
        harvestDate: new Date(raw.harvestDate),
        notes: raw.notes,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id,
    );
  }
}
```

---

## Step 5: Create HTTP Controller

### DTOs

**File**: `src/infra/http/controllers/harvests/create-harvest.controller.ts`

```typescript
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiCreatedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IsString, IsNumber, IsDateString, IsOptional, IsUUID } from 'class-validator';
import CreateHarvest from 'domain/application/use-cases/harvests/create-harvest';
import { JwtAuthGuard } from 'infra/auth/jwt-auth.guard';

class CreateHarvestBodyDTO {
  @IsUUID()
  farmId: string;

  @IsUUID()
  cultureId: string;

  @IsNumber()
  quantity: number;

  @IsString()
  unit: string;

  @IsDateString()
  harvestDate: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

class CreateHarvestResponseDTO {
  harvestId: string;
}

@Controller('harvests')
@ApiTags('Harvests')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export default class CreateHarvestController {
  constructor(private readonly createHarvest: CreateHarvest) {}

  @Post()
  @ApiOperation({ summary: 'Create a new harvest' })
  @ApiBody({ type: CreateHarvestBodyDTO })
  @ApiCreatedResponse({ type: CreateHarvestResponseDTO })
  async handle(@Body() body: CreateHarvestBodyDTO): Promise<CreateHarvestResponseDTO> {
    const result = await this.createHarvest.execute({
      farmId: body.farmId,
      cultureId: body.cultureId,
      quantity: body.quantity,
      unit: body.unit,
      harvestDate: new Date(body.harvestDate),
      notes: body.notes,
    });

    return {
      harvestId: result.harvestId,
    };
  }
}
```

**Key Points**:
- DTOs with validation decorators
- Swagger decorators for API docs
- JWT auth guard for protected routes
- Transform DTOs to use case input

---

## Step 6: Wire Dependencies

### Harvests Module

**File**: `src/infra/http/controllers/harvests/harvests.module.ts`

```typescript
import { Module } from '@nestjs/common';
import CreateHarvest from 'domain/application/use-cases/harvests/create-harvest';
import HarvestRepository from 'domain/application/repositories/HarvestRepository';
import FarmRepository from 'domain/application/repositories/FarmRepository';
import CultureRepository from 'domain/application/repositories/CultureRepository';
import DrizzleHarvestRepository from 'infra/database/drizzle/repositories/harvest.repository';
import DrizzleFarmRepository from 'infra/database/drizzle/repositories/farm.repository';
import DrizzleCultureRepository from 'infra/database/drizzle/repositories/culture.repository';
import CreateHarvestController from './create-harvest.controller';
import { DatabaseModule } from 'infra/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [CreateHarvestController],
  providers: [
    CreateHarvest,
    {
      provide: HarvestRepository,
      useClass: DrizzleHarvestRepository,
    },
    {
      provide: FarmRepository,
      useClass: DrizzleFarmRepository,
    },
    {
      provide: CultureRepository,
      useClass: DrizzleCultureRepository,
    },
  ],
})
export class HarvestsModule {}
```

### Register in HTTP Module

**File**: `src/infra/http/http.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from './controllers/auth/auth.module';
import { HarvestsModule } from './controllers/harvests/harvests.module';
// ... other imports

@Module({
  imports: [
    AuthModule,
    HarvestsModule, // Add this
    // ... other modules
  ],
})
export class HttpModule {}
```

---

## Step 7: Test End-to-End

### Manual Testing

```bash
# Start application
npm run start:dev

# POST /harvests
curl -X POST http://localhost:3000/harvests \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "farmId": "farm-uuid",
    "cultureId": "culture-uuid",
    "quantity": 150,
    "unit": "kg",
    "harvestDate": "2024-01-15",
    "notes": "Excellent quality"
  }'
```

### Check Swagger Docs

Visit: `http://localhost:3000/api/docs`

---

## Common Patterns

### Read Operation (Query)

```typescript
// Use case
export default class ListHarvestsByFarm {
  constructor(private readonly harvestRepository: HarvestRepository) {}

  async execute(input: { farmId: string }): Promise<{ harvests: Harvest[] }> {
    const harvests = await this.harvestRepository.findByFarmId(input.farmId);
    return { harvests };
  }
}

// Controller
@Get()
async handle(@Query('farmId') farmId: string) {
  return await this.listHarvestsByFarm.execute({ farmId });
}
```

### Update Operation

```typescript
// Use case
export default class UpdateHarvestQuantity {
  async execute(input: { id: string; quantity: number }): Promise<void> {
    const harvest = await this.harvestRepository.findById(input.id);
    
    if (!harvest) {
      throw new HarvestNotFoundError();
    }

    harvest.updateQuantity(input.quantity);
    
    await this.harvestRepository.save(harvest);
  }
}

// Controller
@Patch(':id/quantity')
async handle(@Param('id') id: string, @Body() body: { quantity: number }) {
  await this.updateHarvestQuantity.execute({ id, quantity: body.quantity });
  return { message: 'Updated successfully' };
}
```

### Delete Operation

```typescript
// Use case
export default class DeleteHarvest {
  async execute(input: { id: string }): Promise<void> {
    const harvest = await this.harvestRepository.findById(input.id);
    
    if (!harvest) {
      throw new HarvestNotFoundError();
    }

    await this.harvestRepository.delete(input.id);
  }
}

// Controller
@Delete(':id')
async handle(@Param('id') id: string) {
  await this.deleteHarvest.execute({ id });
  return { message: 'Deleted successfully' };
}
```

---

## Checklist Summary

### Before Starting
- [ ] Understand domain requirements
- [ ] Identify entities, repositories, use cases needed
- [ ] Check if entities/repositories already exist

### Domain Layer
- [ ] Create/update entity in `domain/enterprise/entities/`
- [ ] Add behavior methods, not just getters/setters
- [ ] Create repository interface in `domain/application/repositories/`

### Use Case Layer
- [ ] Create use case in `domain/application/use-cases/<feature>/`
- [ ] Define `Input` and `Output` interfaces
- [ ] Inject dependencies via constructor
- [ ] Handle errors with domain exceptions

### Test Layer
- [ ] Create `*.spec.ts` co-located with use case
- [ ] Use in-memory repositories
- [ ] Test happy path + error cases
- [ ] Run tests: `npm run test`

### Infrastructure Layer
- [ ] Define Drizzle schema in `infra/database/drizzle/models/`
- [ ] Generate migration: `npm run generate`
- [ ] Review and apply: `npm run migrate`
- [ ] Implement repository in `infra/database/drizzle/repositories/`
- [ ] Create controller in `infra/http/controllers/<feature>/`
- [ ] Add DTOs with validation
- [ ] Add Swagger decorators

### Integration
- [ ] Create/update feature module
- [ ] Wire dependencies with DI
- [ ] Register module in `http.module.ts`
- [ ] Test locally with Postman/curl
- [ ] Check Swagger docs
- [ ] Format: `npm run format`
- [ ] Lint: `npm run lint`

---

## Quick Reference

```bash
# Development workflow
npm run start:dev         # Start with watch mode
npm run test -- --watch   # Run tests in watch mode
npm run generate          # Generate migration
npm run migrate           # Apply migration
npm run studio            # Open DB GUI
npm run format            # Format code
npm run lint              # Lint code
```
