# CrescCampo API Documentation

Welcome to the comprehensive documentation for the CrescCampo API project. This documentation is designed to help developers and AI agents understand and work with the codebase effectively.

## 📖 Documentation Structure

### Architecture
Deep dives into the architectural patterns and principles that guide this project:

- **[Clean Architecture](architecture/clean-architecture.md)** - Layer boundaries, dependency rules, and separation of concerns
- **[DDD Overview](architecture/ddd-overview.md)** - Domain-Driven Design concepts, bounded contexts, and ubiquitous language
- **[Tactical DDD](architecture/tactical-ddd.md)** - Entities, Value Objects, Repositories, Use Cases, and Domain Events

### Development
Practical guides for day-to-day development tasks:

- **[Coding Standards](development/coding-standards.md)** - TypeScript conventions, naming, formatting, and best practices
- **[Testing Guidelines](development/testing-guidelines.md)** - Unit testing strategy, patterns, and examples
- **[Database Guidelines](development/database-guidelines.md)** - Drizzle ORM patterns, migrations, queries, and repository implementation

### Workflows
Step-by-step guides for common development scenarios:

- **[Adding Features](workflows/adding-features.md)** - Complete walkthrough from domain to HTTP endpoint
- **[Error Handling](workflows/error-handling.md)** - Domain errors, HTTP mapping, and error patterns

---

## 🚀 Quick Start

### For New Developers

1. **Start here**: Read [Clean Architecture](architecture/clean-architecture.md) to understand the overall structure
2. **Then**: Review [DDD Overview](architecture/ddd-overview.md) for domain concepts
3. **Next**: Skim [Project Structure](project-structure.md) to know where things live
4. **Finally**: Check [Adding Features](workflows/adding-features.md) for the development workflow

### For AI Agents

The main [`AGENTS.md`](../AGENTS.md) file in the root directory provides:
- Contextual triggers (when to read which document)
- Quick command reference
- Critical rules and common tasks
- Project structure overview

Use it as your index to navigate this documentation efficiently.

---

## 🎯 Common Questions

### "Where should I put this code?"

**Read**: [Clean Architecture](architecture/clean-architecture.md) - Explains the dependency rule and layer responsibilities.

### "How do I add a new feature?"

**Read**: [Adding Features](workflows/adding-features.md) - Step-by-step guide with complete example.

### "What's the difference between Entity, Repository, and Use Case?"

**Read**: [Tactical DDD](architecture/tactical-ddd.md) - Detailed explanation with examples.

### "How do I write tests?"

**Read**: [Testing Guidelines](development/testing-guidelines.md) - Patterns, examples, and best practices.

### "How do I work with the database?"

**Read**: [Database Guidelines](development/database-guidelines.md) - Schemas, migrations, repositories, queries.

### "How should I handle errors?"

**Read**: [Error Handling](workflows/error-handling.md) - Domain errors, HTTP mapping, validation.

---

## 🏗️ Architecture at a Glance

```
┌─────────────────────────────────────────────────────┐
│  Infrastructure Layer (src/infra/)                  │
│  • NestJS controllers, modules                      │
│  • Drizzle ORM repositories                         │
│  • JWT authentication, logging                      │
│  • Database migrations                              │
└─────────────────────────────────────────────────────┘
                      ↓ depends on ↓
┌─────────────────────────────────────────────────────┐
│  Application Layer (src/domain/application/)        │
│  • Use cases (business operations)                  │
│  • Repository interfaces (abstractions)             │
│  • Domain errors                                    │
│  • Service interfaces (cryptography, etc.)          │
└─────────────────────────────────────────────────────┘
                      ↓ depends on ↓
┌─────────────────────────────────────────────────────┐
│  Domain Layer (src/domain/enterprise/)              │
│  • Entities (Farmer, Farm, Harvest, etc.)           │
│  • Value Objects (currently empty - consider Email) │
│  • Enums (TransactionType, FeedbackCategory)        │
│  • ZERO external dependencies                       │
└─────────────────────────────────────────────────────┘
                      ↓ depends on ↓
┌─────────────────────────────────────────────────────┐
│  Core (src/core/)                                   │
│  • Base Entity class                                │
│  • Shared utilities                                 │
└─────────────────────────────────────────────────────┘
```

**Key Principle**: Dependencies always point inward. Inner layers never depend on outer layers.

---

## 🛠️ Tech Stack

- **Framework**: NestJS
- **Language**: TypeScript (strict mode)
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (production) / SQLite (local)
- **Testing**: Vitest
- **Validation**: class-validator
- **Authentication**: JWT (Passport.js)
- **Documentation**: Swagger/OpenAPI

---

## 📋 Development Workflow

1. **Understand requirements** → Read domain docs
2. **Design entities/use cases** → Follow DDD patterns
3. **Write tests first** → Use in-memory repositories
4. **Implement use case** → Domain layer
5. **Create repository** → Infrastructure layer
6. **Add HTTP endpoint** → Controller layer
7. **Wire dependencies** → NestJS modules
8. **Test end-to-end** → Manual/integration tests

See [Adding Features](workflows/adding-features.md) for detailed walkthrough.

---

## ✅ Code Quality

All changes should:
- [ ] Follow Clean Architecture principles
- [ ] Implement DDD patterns correctly
- [ ] Include unit tests
- [ ] Pass linting: `npm run lint`
- [ ] Be formatted: `npm run format`
- [ ] Use conventional commits
- [ ] Not violate layer dependencies

---

## 📚 Further Reading

### External Resources

- [Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design (Eric Evans)](https://www.domainlanguage.com/ddd/)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

---

## 🤝 Contributing

When contributing:
1. Read relevant documentation first
2. Follow established patterns
3. Write tests for new features
4. Update documentation if needed
5. Use conventional commit messages

---

## 📝 Documentation Maintenance

This documentation should be updated when:
- New architectural patterns are introduced
- Project structure changes significantly
- New conventions are established
- Common questions emerge repeatedly

Last updated: 2024
