# Domain-Driven Design (DDD) Overview

## What is DDD?

Domain-Driven Design is an approach to software development that emphasizes:
1. **Ubiquitous Language**: Common vocabulary between developers and domain experts
2. **Bounded Contexts**: Clear boundaries around related domain concepts
3. **Domain Models**: Rich models that reflect business reality

## Bounded Context

This project represents the **CrescCampo Agricultural Management** bounded context, which includes:

- **Farmer Management**: User accounts and authentication
- **Farm Management**: Farm properties and organization
- **Harvest Management**: Crop harvest tracking
- **Transaction Management**: Financial transactions related to farming
- **Feedback System**: User feedback and suggestions
- **Culture Management**: Crop/culture types

## Ubiquitous Language

Key terms used consistently across code and business:

| Term | Definition | Usage |
|------|------------|-------|
| **Farmer** | A user who manages a farm | Entity with authentication |
| **Farm** | Agricultural property unit | Aggregate root |
| **Harvest** | Crop collection event | Entity with quantity/dates |
| **Transaction** | Financial operation | Entity with type (income/expense) |
| **Culture** | Type of crop being grown | Entity (e.g., corn, soybeans) |
| **Feedback** | User suggestion or report | Entity categorized by type |
| **TransactionCategory** | Classification for transactions | Entity (e.g., "fertilizer", "labor") |

## Strategic Design Patterns

### 1. Entities (Identity-Based)
Objects with unique identity that persists over time:
- `Farmer`: Identified by UUID
- `Farm`: Identified by UUID
- `Harvest`: Identified by UUID
- `Transaction`: Identified by UUID

### 2. Value Objects (Attribute-Based)
Currently, this project could benefit from value objects for:
- Email (with validation)
- Money (amount + currency)
- Date ranges

### 3. Aggregates
Clusters of entities/VOs treated as a unit:
- **Farm Aggregate**: Farm + associated Farmers
- Each aggregate has a root entity that ensures consistency

### 4. Repositories
Abstractions for persisting and retrieving aggregates:
- One repository per aggregate root
- Repositories work with complete aggregates

### 5. Domain Services
Operations that don't naturally fit in entities (use cases in our architecture)

## Domain Events

Future enhancement: Consider implementing domain events for:
- `FarmerRegistered`
- `HarvestCompleted`
- `TransactionRecorded`
- `FeedbackSubmitted`

## Anti-Corruption Layer

The infrastructure layer acts as an anti-corruption layer:
- Drizzle ORM models are separate from domain entities
- Controllers translate HTTP DTOs to domain inputs
- Repositories translate between persistence and domain models

## DDD in This Project

```
src/domain/
├── enterprise/              ← Domain Model (Entities, VOs, Enums)
│   ├── entities/           ← Core business objects
│   ├── enums/              ← Domain-specific enumerations
│   └── value-objects/      ← Immutable domain concepts
│
└── application/            ← Application Services
    ├── use-cases/          ← Application-specific business rules
    ├── repositories/       ← Persistence abstractions
    ├── cryptography/       ← Security service abstractions
    └── errors/             ← Domain errors
```

## Benefits in This Project

1. **Clear domain vocabulary**: `Farmer`, `Harvest`, `Transaction` are understood by all
2. **Testable business logic**: Domain layer has zero framework dependencies
3. **Maintainable**: Changes to domain are isolated from infrastructure
4. **Scalable**: Easy to add new aggregates or bounded contexts

## When to Use Each Pattern

- **Entity**: When identity matters (Farmer, Farm)
- **Value Object**: When only attributes matter (Email, Money) - consider implementing
- **Aggregate**: When entities must be consistent together
- **Domain Service**: When logic spans multiple entities
- **Repository**: When you need to persist/retrieve aggregates

## Further Reading

- [Domain-Driven Design by Eric Evans](https://www.domainlanguage.com/ddd/)
- [Implementing Domain-Driven Design by Vaughn Vernon](https://vaughnvernon.com/)
