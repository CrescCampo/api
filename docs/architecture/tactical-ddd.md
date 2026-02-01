# Tactical DDD Patterns

This document explains the tactical patterns used in the CrescCampo project.

## 1. Entities

### Definition
Entities are objects with **unique identity** that persists over time. Identity is more important than attributes.

### Implementation in This Project

#### Base Entity Class
Located at `src/core/entity.ts`:

```typescript
export default abstract class Entity<Props> {
  #id: string;
  protected props: Props;

  get id() {
    return this.#id;
  }

  protected constructor(props: Props, id?: string) {
    this.props = props;
    this.#id = id ?? crypto.randomUUID();
  }

  public equals(entity: Entity<unknown>) {
    if (entity === this) return true;
    if (entity.id === this.id) return true;
    return false;
  }
}
```

#### Concrete Entity Example
`src/domain/enterprise/entities/Farmer.ts`:

```typescript
interface FarmerProps {
  name: string;
  email: string;
  password: string;
  disabled: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  lastLogin: Date | null;
  farmId: string;
}

export default class Farmer extends Entity<FarmerProps> {
  get name() {
    return this.props.name;
  }

  disable() {
    this.props.disabled = true;
    this.#touch();
  }

  logged() {
    this.props.lastLogin = new Date();
    this.#touch();
  }

  static create(props: Optional<FarmerProps, ...>, id?: string) {
    return new Farmer({ ...props, /* defaults */ }, id);
  }
}
```

### Entity Guidelines

✅ **Do:**
- Use factory method (`static create()`) for instantiation
- Keep getters for reading properties
- Add methods for behavior that changes state
- Use private `#touch()` method to update `updatedAt`
- Use `Optional<>` utility for optional creation properties

❌ **Don't:**
- Expose setters directly (use behavior methods)
- Put infrastructure concerns in entities
- Create entities without factory methods in business code
- Mutate state without touching updatedAt

### All Entities in Project
- `Farmer` - User account
- `Farm` - Agricultural property
- `Harvest` - Crop harvest record
- `Transaction` - Financial transaction
- `TransactionCategory` - Transaction classification
- `Culture` - Crop type
- `Feedback` - User feedback

---

## 2. Value Objects

### Definition
Value Objects are **immutable** objects defined entirely by their attributes. Two VOs with same attributes are considered equal.

### Current State
⚠️ The project currently has an empty `value-objects/` directory. Consider implementing:

### Recommended Value Objects

#### Email Value Object
```typescript
// Suggested: src/domain/enterprise/value-objects/Email.ts
export default class Email {
  private readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(email: string): Email {
    if (!this.isValid(email)) {
      throw new Error('Invalid email format');
    }
    return new Email(email.toLowerCase());
  }

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

#### Money Value Object
```typescript
// Suggested: src/domain/enterprise/value-objects/Money.ts
export default class Money {
  private readonly amount: number;
  private readonly currency: string;

  private constructor(amount: number, currency: string = 'BRL') {
    this.amount = amount;
    this.currency = currency;
  }

  static create(amount: number, currency?: string): Money {
    if (amount < 0) throw new Error('Amount cannot be negative');
    return new Money(amount, currency);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('Cannot add different currencies');
    }
    return new Money(this.amount + other.amount, this.currency);
  }

  getAmount(): number {
    return this.amount;
  }
}
```

### Value Object Guidelines

✅ **Do:**
- Make them immutable (readonly fields, no setters)
- Validate in factory method
- Implement `equals()` based on attributes
- Return new instances for transformations

❌ **Don't:**
- Add identity (no ID field)
- Make them mutable
- Add setters

---

## 3. Aggregates

### Definition
An **Aggregate** is a cluster of entities and value objects treated as a single unit. One entity is the **Aggregate Root** - the only entry point.

### Aggregates in This Project

#### Farm Aggregate
**Root**: `Farm`
**Members**: Could include associated farmers, but currently kept separate

#### Transaction Aggregate
**Root**: `Transaction`
**Related**: `TransactionCategory` (referenced by ID)

### Aggregate Rules

1. **Consistency boundary**: All changes to aggregate members go through the root
2. **One repository per aggregate**: `FarmRepository`, not `FarmFieldRepository`
3. **Reference by ID**: Aggregates reference each other by ID, not direct references
4. **Transaction boundary**: Save entire aggregate in one transaction

### Example: Proper Aggregate Reference

```typescript
// ✅ CORRECT: Reference by ID
class Harvest {
  private farmId: string;  // Reference to Farm aggregate
}

// ❌ WRONG: Direct reference
class Harvest {
  private farm: Farm;  // Tight coupling
}
```

---

## 4. Repositories

### Definition
Repositories provide an **abstraction** for persisting and retrieving aggregates, hiding database details.

### Implementation Pattern

#### Abstract Repository (Domain Layer)
`src/domain/application/repositories/FarmerRepository.ts`:

```typescript
export default abstract class FarmerRepository {
  abstract save(farmer: Farmer): Promise<void>;
  abstract findByEmail(email: string): Promise<Farmer | null>;
  abstract findById(id: string): Promise<Farmer | null>;
}
```

#### Concrete Repository (Infrastructure Layer)
`src/infra/database/drizzle/repositories/farmer.repository.ts`:

```typescript
export default class DrizzleFarmerRepository implements FarmerRepository {
  constructor(private readonly db: DrizzleService) {}

  async save(farmer: Farmer): Promise<void> {
    // Map domain entity to Drizzle model
    // Execute SQL
  }

  async findByEmail(email: string): Promise<Farmer | null> {
    // Query database
    // Map Drizzle model to domain entity
    // Return entity or null
  }
}
```

### Repository Guidelines

✅ **Do:**
- Define interfaces in `domain/application/repositories/`
- Implement in `infra/database/drizzle/repositories/`
- Work with complete aggregates
- Return domain entities, not ORM models
- Use meaningful query method names (`findByEmail`, not `findOne`)

❌ **Don't:**
- Expose query builders or ORM objects
- Return partial entities
- Put business logic in repositories
- Create repositories for non-aggregate-roots

### Repository Naming Convention
- Interface: `FarmerRepository` (abstract class)
- Implementation: `DrizzleFarmerRepository` or `InMemoryFarmerRepository`
- One repository per aggregate root

---

## 5. Domain Services (Use Cases)

### Definition
Domain Services contain domain logic that doesn't naturally fit in entities or value objects, often spanning multiple entities.

### Use Cases in This Project

Located at `src/domain/application/use-cases/`, organized by feature:

```
use-cases/
├── auth/
│   ├── login-farmer-by-email.ts
│   └── register-farmer-by-email.ts
├── feedbacks/
│   └── send-feedback.ts
├── harvests/
│   └── list-harvests-by-farm.ts
└── transactions/
    ├── list-transactions-by-farm.ts
    └── list-transactions-by-harvest.ts
```

### Use Case Structure

```typescript
// Input/Output interfaces
export interface Input {
  email: string;
  password: string;
}

export interface Output {
  userId: string;
  token: string;
}

// Use case class
@Injectable()
export default class LoginFarmerByEmail {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly hashComparer: HashComparer,
    private readonly encrypter: Encrypter,
  ) {}

  async execute(input: Input): Promise<Output> {
    // 1. Validate input (or throw)
    // 2. Load entities via repositories
    // 3. Execute domain logic
    // 4. Persist changes
    // 5. Return output
  }
}
```

### Use Case Guidelines

✅ **Do:**
- One use case per user action/feature
- Define `Input` and `Output` interfaces
- Inject dependencies via constructor
- Use `@Injectable()` for NestJS DI
- Throw domain errors (extend `UseCaseError`)
- Keep orchestration logic here

❌ **Don't:**
- Put UI/HTTP concerns in use cases
- Return entities directly (use DTOs)
- Handle framework-specific errors
- Access database directly (use repositories)

---

## 6. Domain Errors

### Definition
Domain-specific errors that represent business rule violations.

### Implementation

#### Base Interface
`src/core/use-case-error.ts`:

```typescript
export interface UseCaseError {
  message: string;
}
```

#### Concrete Errors
`src/domain/application/errors/auth/WrongCredentialsError.ts`:

```typescript
export default class WrongCredentialsError extends Error implements UseCaseError {
  constructor() {
    super('Credentials are not valid');
  }
}
```

### Error Organization

```
errors/
├── auth/
│   ├── UserAlreadyExistsError.ts
│   └── WrongCredentialsError.ts
└── farmer/
    └── FarmerNotFoundError.ts
```

### Error Guidelines

✅ **Do:**
- Extend `Error` and implement `UseCaseError`
- Name descriptively: `WrongCredentialsError`, not `Error401`
- Organize by domain/feature
- Throw from use cases when business rules violated

❌ **Don't:**
- Use generic `Error` or `Exception`
- Include HTTP status codes in domain errors
- Handle infrastructure errors as domain errors

---

## 7. Domain Events (Future Enhancement)

### Not Yet Implemented
Consider adding domain events for:
- `FarmerRegistered`
- `HarvestRecorded`
- `TransactionCompleted`

Domain events enable:
- Decoupled communication between aggregates
- Event-driven architecture
- Audit trails

---

## Summary

| Pattern | Location | Example |
|---------|----------|---------|
| **Entity** | `domain/enterprise/entities/` | `Farmer`, `Farm`, `Harvest` |
| **Value Object** | `domain/enterprise/value-objects/` | *Consider adding Email, Money* |
| **Aggregate** | Implicit via entities | Farm, Transaction |
| **Repository Interface** | `domain/application/repositories/` | `FarmerRepository` |
| **Repository Impl** | `infra/database/drizzle/repositories/` | `DrizzleFarmerRepository` |
| **Use Case** | `domain/application/use-cases/` | `LoginFarmerByEmail` |
| **Domain Error** | `domain/application/errors/` | `WrongCredentialsError` |
| **Enum** | `domain/enterprise/enums/` | `TransactionType`, `FeedbackCategory` |
