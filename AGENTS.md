# CrescCampo API - AI Agent Instructions

This is a **NestJS API** built with **Clean Architecture** and **Domain-Driven Design (DDD)** principles.

## Quick Reference

### Essential Commands
- `npm run start:dev` - Start with hot reload
- `npm run test` - Run Vitest tests
- `npm run lint` - ESLint with autofix
- `npm run format` - Format with Prettier
- `npm run generate` - Generate database migration
- `npm run migrate` - Apply migrations
- `npm run studio` - Open Drizzle Studio

### Code Style
- **TypeScript** with strict mode
- **2-space indentation**, single quotes
- **PascalCase** for classes, **camelCase** for variables
- **kebab-case** for files and folders
- Conventional Commits (e.g., `feat:`, `fix:`, `docs:`)

---

## 📚 Documentation Index - READ BEFORE WORKING

**IMPORTANT**: This project follows specific architectural patterns. Always consult the relevant documentation before making changes.

### When Working on Architecture & Design

**Read** [`docs/architecture/clean-architecture.md`](docs/architecture/clean-architecture.md) when:
- Understanding layer dependencies (domain → application → infrastructure)
- Deciding where to place new code
- Dealing with dependency inversion
- Questioning imports between layers

**Read** [`docs/architecture/ddd-overview.md`](docs/architecture/ddd-overview.md) when:
- Understanding the domain model and ubiquitous language
- Working with bounded contexts
- Identifying entities vs value objects vs aggregates
- Understanding strategic DDD patterns

**Read** [`docs/architecture/tactical-ddd.md`](docs/architecture/tactical-ddd.md) when:
- Creating or modifying **entities** (`domain/enterprise/entities/`)
- Implementing **repositories** (interface vs implementation)
- Building **use cases** (`domain/application/use-cases/`)
- Handling **domain errors**
- Working with **value objects** or **aggregates**

### When Working on Development Tasks

**Read** [`docs/project-structure.md`](docs/project-structure.md) when:
- Finding where specific code lives
- Understanding the folder organization
- Navigating between domain/application/infrastructure layers
- Looking for examples of existing patterns

**Read** [`docs/development/coding-standards.md`](docs/development/coding-standards.md) when:
- Writing TypeScript code
- Following naming conventions
- Organizing imports
- Creating classes, functions, or interfaces
- Writing comments or documentation

**Read** [`docs/development/testing-guidelines.md`](docs/development/testing-guidelines.md) when:
- Writing **unit tests** for use cases or entities
- Creating **in-memory repositories** for tests
- Testing error cases
- Following the AAA pattern (Arrange-Act-Assert)
- Running or debugging tests

**Read** [`docs/development/database-guidelines.md`](docs/development/database-guidelines.md) when:
- Defining **Drizzle ORM schemas**
- Creating or modifying **database migrations**
- Implementing **repository classes**
- Writing database queries
- Working with relationships or transactions

### When Working on Features & Workflows

**Read** [`docs/workflows/adding-features.md`](docs/workflows/adding-features.md) when:
- Adding a **new feature** from scratch
- Creating new use cases, repositories, or controllers
- Following the complete development workflow
- Understanding the step-by-step process (domain → use case → repository → controller)
- Wiring dependencies in NestJS modules

**Read** [`docs/workflows/error-handling.md`](docs/workflows/error-handling.md) when:
- Creating **domain errors** (`domain/application/errors/`)
- Mapping errors to HTTP status codes
- Handling validation errors
- Testing error cases
- Understanding error propagation

---

## Project Structure Overview

```
src/
├── core/               ← Shared abstractions (Entity base class, utilities)
├── domain/            ← Business logic (NO framework dependencies)
│   ├── enterprise/    ← Domain model (Entities, Value Objects, Enums)
│   └── application/   ← Use cases, Repository interfaces, Domain errors
└── infra/             ← Infrastructure (NestJS, Drizzle, HTTP, Auth)
    ├── database/      ← Drizzle ORM, migrations, repositories
    ├── http/          ← Controllers, DTOs, Swagger
    ├── auth/          ← JWT authentication
    └── ...
```

**Key Principle**: Dependencies flow **inward only**:
```
infra → domain/application → domain/enterprise → core
```

---

## Critical Rules

### ✅ Always Do
1. **Read the appropriate doc** before starting work
2. **Test business logic** with in-memory repositories
3. **Define repository interfaces** in `domain/application/repositories/`
4. **Implement repositories** in `infra/database/drizzle/repositories/`
5. **Use factory methods** (`Entity.create()`) for entity instantiation
6. **Map domain entities** ↔ database models in repositories
7. **Throw domain errors** from use cases, not HTTP exceptions

### ❌ Never Do
1. **Import infrastructure** into domain layer
2. **Import NestJS decorators** in domain (except `@Injectable` in use cases)
3. **Return ORM models** from repositories (always return domain entities)
4. **Put business logic** in controllers or repositories
5. **Query database directly** from use cases (use repository abstractions)
6. **Use generic `Error`** (create specific domain errors)

---

## Common Tasks Quick Links

| Task | Read This First |
|------|----------------|
| Add new entity | [`tactical-ddd.md`](docs/architecture/tactical-ddd.md#1-entities) |
| Add new use case | [`adding-features.md`](docs/workflows/adding-features.md#step-3-create-use-case-with-tests) |
| Create repository | [`tactical-ddd.md`](docs/architecture/tactical-ddd.md#4-repositories) + [`database-guidelines.md`](docs/development/database-guidelines.md) |
| Add HTTP endpoint | [`adding-features.md`](docs/workflows/adding-features.md#step-5-create-http-controller) |
| Create domain error | [`error-handling.md`](docs/workflows/error-handling.md#creating-domain-errors) |
| Write tests | [`testing-guidelines.md`](docs/development/testing-guidelines.md#unit-testing-use-cases) |
| Database migration | [`database-guidelines.md`](docs/development/database-guidelines.md#migrations) |
| Understand layers | [`clean-architecture.md`](docs/architecture/clean-architecture.md#layer-responsibilities) |

---

## When In Doubt

1. **Check existing code** for similar patterns
2. **Read the relevant doc** from `/docs`
3. **Follow Clean Architecture** and DDD principles
4. **Test your changes** before committing
5. **Run lint and format**: `npm run lint && npm run format`

---

## Environment & Configuration
- Environment variables loaded via `@nestjs/config`
- Database config in `drizzle.config.ts`
- Local services in `docker-compose.yml`
- TypeScript config in `tsconfig.json`

---

**Remember**: This project values **clean separation of concerns**, **testable business logic**, and **explicit architectural boundaries**. When in doubt, prioritize domain purity and consult the documentation.
