# Project Structure

This document explains the folder organization and the purpose of each directory.

## Root Structure

```
api/
├── src/                    ← Application source code
├── test/                   ← Test files
├── db/                     ← Database files (local SQLite, etc.)
├── docs/                   ← Project documentation (this folder)
├── dist/                   ← Compiled output (git-ignored)
├── node_modules/           ← Dependencies (git-ignored)
├── docker-compose.yml      ← Local development services
├── Dockerfile              ← Container definition
├── drizzle.config.ts       ← Drizzle ORM configuration
├── nest-cli.json           ← NestJS CLI configuration
├── package.json            ← Dependencies and scripts
├── tsconfig.json           ← TypeScript configuration
├── vitest.config.ts        ← Test framework configuration
└── AGENTS.md               ← AI agent instructions (index to docs/)
```

---

## `/src` - Application Source Code

The entire application follows **Clean Architecture** with three main layers:

### Overview
```
src/
├── main.ts                 ← Application entrypoint (NestJS bootstrap)
├── core/                   ← Shared abstractions and utilities
├── domain/                 ← Business logic (framework-agnostic)
└── infra/                  ← Infrastructure adapters (frameworks, DB, HTTP)
```

---

## `/src/core` - Shared Core Abstractions

Framework-agnostic utilities used across layers.

```
core/
├── entity.ts               ← Base entity class with ID and equality
├── optional.ts             ← TypeScript utility for optional properties
├── pagination-params.ts    ← Pagination value object
└── use-case-error.ts       ← Base interface for domain errors
```

**Purpose**: Reusable primitives that don't belong to any specific domain.

**Key File**: `entity.ts`
- Abstract base class for all entities
- Provides ID generation (UUID)
- Implements equality comparison

---

## `/src/domain` - Business Logic Layer

**Zero framework dependencies**. All business rules live here.

### Structure
```
domain/
├── enterprise/             ← Domain model (entities, value objects, enums)
└── application/            ← Application services (use cases, repositories)
```

### `/src/domain/enterprise` - Domain Model

Pure domain objects representing business concepts.

```
enterprise/
├── entities/               ← Identity-based business objects
│   ├── Farmer.ts          ← User account entity
│   ├── Farm.ts            ← Farm property entity
│   ├── Harvest.ts         ← Harvest record entity
│   ├── Transaction.ts     ← Financial transaction entity
│   ├── TransactionCategory.ts
│   ├── Culture.ts         ← Crop type entity
│   └── Feedback.ts        ← User feedback entity
│
├── enums/                 ← Domain-specific enumerations
│   ├── FeedbackCategory.ts ← Types of feedback
│   └── TransactionType.ts  ← Income vs Expense
│
└── value-objects/         ← Attribute-based immutable objects (currently empty)
```

**Purpose**: Core business entities that exist independent of any technology.

**Naming Convention**:
- PascalCase for entity classes: `Farmer`, `Transaction`
- Each entity extends `Entity<Props>`
- Props interface defines entity attributes

### `/src/domain/application` - Application Services

Business rules that coordinate entities and interact with infrastructure.

```
application/
├── use-cases/              ← Application-specific business operations
│   ├── auth/              ← Authentication use cases
│   │   ├── login-farmer-by-email.ts
│   │   ├── login-farmer-by-email.spec.ts
│   │   ├── register-farmer-by-email.ts
│   │   └── register-farmer-by-email.spec.ts
│   ├── feedbacks/         ← Feedback use cases
│   │   └── send-feedback.ts
│   ├── harvests/          ← Harvest use cases
│   │   └── list-harvests-by-farm.ts
│   ├── transactions/      ← Transaction use cases
│   │   ├── list-transactions-by-farm.ts
│   │   └── list-transactions-by-harvest.ts
│   └── app/               ← Sync/offline support
│       ├── pull.ts
│       └── push.ts
│
├── repositories/          ← Abstract repository contracts
│   ├── FarmerRepository.ts
│   ├── FarmRepository.ts
│   ├── HarvestRepository.ts
│   ├── TransactionRepository.ts
│   ├── TransactionCategoryRepository.ts
│   ├── CultureRepository.ts
│   ├── FeedbackRepository.ts
│   └── OutboxEventRepository.ts
│
├── cryptography/          ← Security service contracts
│   ├── encrypter.ts       ← JWT generation interface
│   ├── hash-comparer.ts   ← Password comparison interface
│   └── hash-generator.ts  ← Password hashing interface
│
└── errors/                ← Domain error definitions
    ├── auth/
    │   ├── UserAlreadyExistsError.ts
    │   └── WrongCredentialsError.ts
    └── farmer/
        └── FarmerNotFoundError.ts
```

**Purpose**: Define what the application does without depending on how it's done.

**Key Points**:
- Use cases are named by action: `LoginFarmerByEmail`, `SendFeedback`
- Repositories are abstract classes (interfaces)
- Errors implement `UseCaseError` interface

---

## `/src/infra` - Infrastructure Layer

Concrete implementations of domain abstractions using frameworks and libraries.

### Structure
```
infra/
├── app.module.ts           ← Main NestJS module (DI root)
├── auth/                   ← Authentication infrastructure
├── config/                 ← Configuration management
├── cryptography/           ← Security service implementations
├── database/               ← Database adapters and migrations
├── env/                    ← Environment validation
├── exceptions/             ← Error handling and mapping
├── http/                   ← HTTP layer (controllers, DTOs)
└── logs/                   ← Logging infrastructure
```

### `/src/infra/auth` - Authentication Infrastructure

```
auth/
├── auth.module.ts          ← NestJS auth module
├── jwt-auth.guard.ts       ← JWT authentication guard
└── jwt.strategy.ts         ← Passport JWT strategy
```

**Purpose**: JWT-based authentication using Passport.js.

### `/src/infra/config` - Configuration

```
config/
├── Environment.ts          ← Environment variables class
├── index.ts               ← Configuration exports
├── interface.ts           ← Config interfaces
└── winston.config.ts      ← Logger configuration
```

**Purpose**: Centralized configuration management.

### `/src/infra/cryptography` - Security Implementations

```
cryptography/
├── cryptography.module.ts  ← NestJS module for DI
├── bcrypt-hasher.ts       ← Bcrypt implementation (hash + compare)
└── jwt-encrypter.ts       ← JWT token generation implementation
```

**Purpose**: Concrete implementations of `domain/application/cryptography/` interfaces.

### `/src/infra/database` - Database Layer

```
database/
├── database.module.ts      ← NestJS database module
│
├── drizzle/               ← Drizzle ORM adapter
│   ├── drizzle.service.ts ← Database connection service
│   │
│   ├── models/            ← Drizzle schema definitions
│   │   └── (schema files)
│   │
│   └── repositories/      ← Concrete repository implementations
│       ├── farmer.repository.ts
│       ├── farm.repository.ts
│       ├── harvest.repository.ts
│       ├── transaction.repository.ts
│       ├── transaction-category.repository.ts
│       ├── culture.repository.ts
│       ├── feedback.repository.ts
│       └── outbox-event.repository.ts
│
├── migrations/            ← SQL migration files
│   ├── 0000_*.sql
│   ├── 0001_*.sql
│   └── meta/             ← Migration metadata
│
└── seed/                 ← Database seeding scripts
    ├── index.ts
    ├── seed-up.ts
    └── seed-down.ts
```

**Purpose**: Drizzle ORM integration and database management.

**Key Points**:
- Models define database schema (SQL)
- Repositories implement domain repository interfaces
- Migrations manage schema evolution
- Seeds populate initial/test data

### `/src/infra/env` - Environment Validation

```
env/
└── env.validation.ts      ← Zod schema for environment variables
```

**Purpose**: Type-safe environment variable validation.

### `/src/infra/exceptions` - Error Handling

```
exceptions/
├── all-exceptions.filter.ts  ← Global exception filter
└── error-status-mapper.ts    ← Maps domain errors to HTTP status
```

**Purpose**: Translate domain errors to HTTP responses.

### `/src/infra/http` - HTTP Layer

```
http/
├── http.module.ts          ← Main HTTP module
│
├── controllers/           ← REST API controllers
│   ├── auth/
│   │   ├── login-farmer.controller.ts
│   │   └── register-farmer.controller.ts
│   ├── feedbacks/
│   ├── harvests/
│   ├── health/
│   │   └── health.controller.ts
│   └── transactions/
│
├── pipes/                 ← Validation pipes
│
└── swagger/              ← API documentation
    ├── index.ts
    └── swagger-config.ts
```

**Purpose**: REST API endpoints and OpenAPI documentation.

**Controller Pattern**:
1. Receive HTTP request
2. Validate with DTOs (class-validator)
3. Call use case
4. Return HTTP response

### `/src/infra/logs` - Logging

```
logs/
└── logger.interceptor.ts   ← Request/response logging interceptor
```

**Purpose**: Centralized logging with Winston.

---

## `/test` - Test Files

```
test/
└── unit/
    └── repositories/
        ├── InMemoryFarmerRepository.ts
        ├── InMemoryFarmRepository.ts
        └── InMemoryFeedbackRepository.ts
```

**Purpose**: In-memory repository implementations for unit testing use cases.

**Naming Convention**:
- Test files: `*.spec.ts` (co-located with source)
- Test doubles: `InMemory*Repository.ts`

---

## `/docs` - Documentation

```
docs/
├── architecture/
│   ├── clean-architecture.md    ← Clean Architecture principles
│   ├── ddd-overview.md          ← Domain-Driven Design overview
│   └── tactical-ddd.md          ← Tactical DDD patterns
├── development/
│   ├── coding-standards.md      ← TypeScript conventions
│   ├── database-guidelines.md   ← Drizzle ORM patterns
│   └── testing-guidelines.md    ← Testing strategy
├── workflows/
│   ├── adding-features.md       ← Step-by-step feature guide
│   └── error-handling.md        ← Error patterns
└── project-structure.md         ← This file
```

**Purpose**: Comprehensive documentation for developers and AI agents.

---

## Key Principles

### 1. Layer Dependencies
```
infra → domain/application → domain/enterprise → core
  ↑                              ↑                  ↑
  Outer                        Middle             Inner
```

### 2. Folder Naming
- kebab-case for folders: `use-cases/`, `domain/enterprise/`
- PascalCase for files: `Farmer.ts`, `LoginFarmerByEmail.ts`
- camelCase for config: `drizzle.config.ts`

### 3. Co-location
- Tests live next to code: `login-farmer-by-email.spec.ts`
- Related files grouped by feature: `auth/`, `transactions/`

### 4. Separation of Concerns
- **Domain**: Business rules
- **Application**: Use case orchestration
- **Infrastructure**: Technical implementation

---

## Navigation Tips for AI Agents

- **Adding new feature**: Start in `domain/application/use-cases/`
- **Modifying entities**: Go to `domain/enterprise/entities/`
- **Database changes**: Check `infra/database/drizzle/`
- **API endpoints**: Look in `infra/http/controllers/`
- **Error handling**: See `domain/application/errors/`
- **Tests**: Find `*.spec.ts` next to source or in `test/unit/`
