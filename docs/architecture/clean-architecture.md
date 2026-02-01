# Clean Architecture Principles

## Overview
This project follows **Clean Architecture** (also known as Hexagonal Architecture or Ports & Adapters), ensuring that business logic is independent of frameworks, UI, databases, and external agencies.

## Core Principles

### 1. Dependency Rule
Dependencies must point **inward only**. Outer layers can depend on inner layers, but inner layers must never depend on outer layers.

```
┌─────────────────────────────────────┐
│      Infrastructure (Outer)         │  ← Frameworks, DB, HTTP
│  ┌───────────────────────────────┐  │
│  │   Application (Use Cases)     │  │  ← Business rules
│  │  ┌─────────────────────────┐  │  │
│  │  │  Enterprise (Entities)  │  │  │  ← Domain models
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 2. Layer Responsibilities

#### **Enterprise Layer** (`src/domain/enterprise/`)
- **Entities**: Core business objects with identity
- **Value Objects**: Immutable objects defined by their attributes
- **Enums**: Domain-specific enumerations
- **No dependencies**: This layer has no external dependencies

#### **Application Layer** (`src/domain/application/`)
- **Use Cases**: Application-specific business rules
- **Repository Interfaces**: Abstract contracts for data access
- **Service Interfaces**: Contracts for external services (cryptography, etc.)
- **Errors**: Domain-specific error types
- **Depends on**: Enterprise layer only

#### **Infrastructure Layer** (`src/infra/`)
- **Repository Implementations**: Concrete database adapters (Drizzle)
- **Service Implementations**: Concrete external service adapters
- **HTTP Controllers**: API endpoints
- **Database Migrations**: Schema evolution
- **Configuration**: Environment, modules, DI
- **Depends on**: Application and Enterprise layers

## Key Architectural Patterns

### Dependency Inversion
Abstractions are defined in inner layers, implementations in outer layers:

```typescript
// ✅ CORRECT: Abstract in domain/application
export abstract class FarmerRepository {
  abstract save(farmer: Farmer): Promise<void>;
  abstract findByEmail(email: string): Promise<Farmer | null>;
}

// ✅ CORRECT: Concrete in infra
export class DrizzleFarmerRepository implements FarmerRepository {
  // Implementation using Drizzle ORM
}
```

### Use Case Pattern
Each use case represents one application action:

```typescript
@Injectable()
export default class LoginFarmerByEmail {
  constructor(
    private readonly farmerRepository: FarmerRepository,  // Interface
    private readonly hashComparer: HashComparer,          // Interface
    private readonly encrypter: Encrypter,                // Interface
  ) {}

  async execute(input: Input): Promise<Output> {
    // Business logic here
  }
}
```

## Boundaries and Communication

### How Layers Communicate

1. **Controller → Use Case**: Controllers call use cases with DTOs
2. **Use Case → Repository**: Use cases call repository interfaces
3. **Use Case → Entity**: Use cases manipulate entities
4. **Repository → Entity**: Repositories return/persist entities

### What NOT to Do

❌ **Never** import infrastructure code into domain:
```typescript
// ❌ WRONG
import { DrizzleService } from 'infra/database/drizzle/drizzle.service';

// ✅ CORRECT
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
```

❌ **Never** import NestJS decorators in domain:
```typescript
// ❌ WRONG in domain layer
import { Injectable } from '@nestjs/common';

// ✅ CORRECT (only in use cases when needed for DI)
```

❌ **Never** import entities/use-cases into controllers directly without going through use cases:
```typescript
// ❌ WRONG
import Farmer from 'domain/enterprise/entities/Farmer';

// ✅ CORRECT
import LoginFarmerByEmail from 'domain/application/use-cases/auth/login-farmer-by-email';
```

## Testing Benefits

Clean Architecture makes testing easy:

- **Unit test use cases** with in-memory repositories
- **Test domain logic** without database/HTTP
- **Mock external dependencies** easily via interfaces

## References

- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
