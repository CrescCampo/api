# Testing Guidelines

## Overview

This project uses **Vitest** as the testing framework with a focus on **unit testing** domain logic using in-memory implementations.

## Testing Philosophy

1. **Test business logic thoroughly**: Use cases and entities should have high coverage
2. **Fast, isolated tests**: Use in-memory repositories, no real database
3. **Test behavior, not implementation**: Focus on inputs/outputs and side effects
4. **Co-locate tests**: Keep `*.spec.ts` files next to the code they test

## Test Structure

```
Project/
├── src/
│   └── domain/
│       └── application/
│           └── use-cases/
│               └── auth/
│                   ├── login-farmer-by-email.ts
│                   └── login-farmer-by-email.spec.ts    ← Co-located
│
└── test/
    └── unit/
        └── repositories/
            ├── InMemoryFarmerRepository.ts              ← Test doubles
            ├── InMemoryFarmRepository.ts
            └── InMemoryFeedbackRepository.ts
```

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode (development)
npm run test -- --watch

# Run specific test file
npm run test -- login-farmer-by-email.spec.ts

# Run with coverage (if configured)
npm run test -- --coverage
```

## Test Doubles: In-Memory Repositories

Located in `test/unit/repositories/`, these implement domain repository interfaces for testing.

### Example: InMemoryFarmerRepository

```typescript
import FarmerRepository from 'domain/application/repositories/FarmerRepository';
import Farmer from 'domain/enterprise/entities/Farmer';

export default class InMemoryFarmerRepository implements FarmerRepository {
  items: Farmer[] = [];

  save(farmer: Farmer): Promise<void> {
    const existingIndex = this.items.findIndex(item => item.id === farmer.id);

    if (existingIndex >= 0) {
      this.items[existingIndex] = farmer;
    } else {
      this.items.push(farmer);
    }
    
    return Promise.resolve();
  }

  findByEmail(email: string): Promise<Farmer | null> {
    const existingFarmer = this.items.find(user => user.email === email);
    return Promise.resolve(existingFarmer ?? null);
  }

  findById(id: string): Promise<Farmer | null> {
    const existingFarmer = this.items.find(user => user.id === id);
    return Promise.resolve(existingFarmer ?? null);
  }
}
```

### Guidelines for In-Memory Repositories

✅ **Do:**
- Implement the full repository interface
- Use an array (`items`) to store entities
- Support both insert and update in `save()`
- Return promises for consistency with real implementation
- Keep state isolated per test (create new instance)

❌ **Don't:**
- Add logic not in the interface
- Use real database connections
- Share state between tests

## Unit Testing Use Cases

### Test Structure Pattern

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import LoginFarmerByEmail from './login-farmer-by-email';
import InMemoryFarmerRepository from 'test/unit/repositories/InMemoryFarmerRepository';
import FakeHashComparer from 'test/unit/cryptography/FakeHashComparer';
import FakeEncrypter from 'test/unit/cryptography/FakeEncrypter';
import Farmer from 'domain/enterprise/entities/Farmer';
import WrongCredentialsError from 'domain/application/errors/auth/WrongCredentialsError';

describe('LoginFarmerByEmail', () => {
  let sut: LoginFarmerByEmail;  // System Under Test
  let farmerRepository: InMemoryFarmerRepository;
  let hashComparer: FakeHashComparer;
  let encrypter: FakeEncrypter;

  beforeEach(() => {
    farmerRepository = new InMemoryFarmerRepository();
    hashComparer = new FakeHashComparer();
    encrypter = new FakeEncrypter();
    
    sut = new LoginFarmerByEmail(
      farmerRepository,
      hashComparer,
      encrypter,
    );
  });

  it('should authenticate farmer with valid credentials', async () => {
    // Arrange
    const farmer = Farmer.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: await hashComparer.hash('password123'),
      farmId: 'farm-1',
    });
    await farmerRepository.save(farmer);

    // Act
    const result = await sut.execute({
      email: 'john@example.com',
      password: 'password123',
    });

    // Assert
    expect(result.userId).toBe(farmer.id);
    expect(result.token).toBeTruthy();
    expect(result.email).toBe('john@example.com');
  });

  it('should throw WrongCredentialsError when farmer does not exist', async () => {
    // Act & Assert
    await expect(
      sut.execute({
        email: 'nonexistent@example.com',
        password: 'password123',
      })
    ).rejects.toThrow(WrongCredentialsError);
  });

  it('should throw WrongCredentialsError when password is invalid', async () => {
    // Arrange
    const farmer = Farmer.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: await hashComparer.hash('password123'),
      farmId: 'farm-1',
    });
    await farmerRepository.save(farmer);

    // Act & Assert
    await expect(
      sut.execute({
        email: 'john@example.com',
        password: 'wrongpassword',
      })
    ).rejects.toThrow(WrongCredentialsError);
  });

  it('should update lastLogin timestamp after successful login', async () => {
    // Arrange
    const farmer = Farmer.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: await hashComparer.hash('password123'),
      farmId: 'farm-1',
    });
    await farmerRepository.save(farmer);

    // Act
    await sut.execute({
      email: 'john@example.com',
      password: 'password123',
    });

    // Assert
    const updatedFarmer = await farmerRepository.findById(farmer.id);
    expect(updatedFarmer?.lastLogin).not.toBeNull();
  });
});
```

### Test Naming Convention

#### Describe Blocks
- Use the class/function name: `describe('LoginFarmerByEmail', ...)`
- Group related tests: `describe('when farmer is disabled', ...)`

#### Test Cases
Use descriptive names starting with "should":
- ✅ `should authenticate farmer with valid credentials`
- ✅ `should throw WrongCredentialsError when farmer does not exist`
- ✅ `should update lastLogin timestamp after successful login`
- ❌ `test login` (too vague)
- ❌ `it works` (not descriptive)

### AAA Pattern (Arrange-Act-Assert)

**Always structure tests in three phases:**

```typescript
it('should do something', async () => {
  // Arrange: Set up test data and dependencies
  const farmer = Farmer.create({ /* ... */ });
  await repository.save(farmer);

  // Act: Execute the system under test
  const result = await sut.execute({ /* input */ });

  // Assert: Verify the outcome
  expect(result.userId).toBe(farmer.id);
  expect(repository.items).toHaveLength(1);
});
```

## What to Test

### ✅ Test These

1. **Happy path**: Valid inputs produce expected outputs
2. **Error cases**: Invalid inputs throw appropriate errors
3. **Business rules**: Domain logic is enforced
4. **State changes**: Entities are modified correctly
5. **Side effects**: Repositories called with correct data

### ❌ Don't Test These

1. **Framework internals**: NestJS DI, decorators
2. **Third-party libraries**: Bcrypt, JWT, Drizzle
3. **Infrastructure details**: Database queries (test in integration tests)
4. **Getters/setters**: Simple property access

## Testing Entities

### Example: Testing Farmer Entity

```typescript
import { describe, it, expect } from 'vitest';
import Farmer from './Farmer';

describe('Farmer', () => {
  it('should create a farmer with default values', () => {
    const farmer = Farmer.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed',
      farmId: 'farm-1',
    });

    expect(farmer.id).toBeTruthy();
    expect(farmer.name).toBe('John Doe');
    expect(farmer.disabled).toBe(false);
    expect(farmer.lastLogin).toBeNull();
  });

  it('should mark lastLogin when logged() is called', () => {
    const farmer = Farmer.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed',
      farmId: 'farm-1',
    });

    farmer.logged();

    expect(farmer.lastLogin).toBeInstanceOf(Date);
    expect(farmer.updatedAt).toBeInstanceOf(Date);
  });

  it('should disable the farmer', () => {
    const farmer = Farmer.create({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashed',
      farmId: 'farm-1',
    });

    farmer.disable();

    expect(farmer.disabled).toBe(true);
    expect(farmer.updatedAt).toBeInstanceOf(Date);
  });
});
```

## Fake Implementations for Services

For cryptography and other services, create fake implementations:

### FakeHashComparer

```typescript
// test/unit/cryptography/FakeHashComparer.ts
import HashComparer from 'domain/application/cryptography/hash-comparer';

export default class FakeHashComparer implements HashComparer {
  async compare(plain: string, hash: string): Promise<boolean> {
    return plain === hash;
  }

  async hash(plain: string): Promise<string> {
    return plain; // Simple fake: hash equals plain text
  }
}
```

### FakeEncrypter

```typescript
// test/unit/cryptography/FakeEncrypter.ts
import Encrypter from 'domain/application/cryptography/encrypter';

export default class FakeEncrypter implements Encrypter {
  async encrypt(payload: Record<string, unknown>): Promise<string> {
    return JSON.stringify(payload); // Simple fake token
  }
}
```

## Common Patterns

### Testing Error Cases

```typescript
it('should throw UserAlreadyExistsError when email is taken', async () => {
  await farmerRepository.save(existingFarmer);

  await expect(
    sut.execute({
      name: 'New User',
      email: existingFarmer.email, // Duplicate email
      password: 'password',
    })
  ).rejects.toThrow(UserAlreadyExistsError);
});
```

### Testing State Changes

```typescript
it('should save the new farmer to repository', async () => {
  await sut.execute({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
  });

  expect(farmerRepository.items).toHaveLength(1);
  expect(farmerRepository.items[0].name).toBe('John Doe');
});
```

### Testing with Multiple Entities

```typescript
it('should list all harvests for a farm', async () => {
  const harvest1 = Harvest.create({ farmId: 'farm-1', /* ... */ });
  const harvest2 = Harvest.create({ farmId: 'farm-1', /* ... */ });
  const harvest3 = Harvest.create({ farmId: 'farm-2', /* ... */ });
  
  await harvestRepository.save(harvest1);
  await harvestRepository.save(harvest2);
  await harvestRepository.save(harvest3);

  const result = await sut.execute({ farmId: 'farm-1' });

  expect(result.harvests).toHaveLength(2);
  expect(result.harvests).toContainEqual(expect.objectContaining({
    id: harvest1.id,
  }));
});
```

## Integration Tests (Future)

Currently not implemented, but consider adding:

- **API tests**: Test HTTP endpoints with supertest
- **Database tests**: Test repositories with real database (test container)
- **E2E tests**: Full user flows

## Vitest Configuration

Located at `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

## Best Practices

✅ **Do:**
- Keep tests simple and readable
- Test one thing per test case
- Use descriptive test names
- Create new repository instances per test
- Test business logic, not framework code
- Use `beforeEach` for setup

❌ **Don't:**
- Test implementation details
- Share state between tests
- Mock everything (only mock external dependencies)
- Write tests that depend on execution order
- Ignore failing tests

## Coverage Goals

While no explicit coverage target is set:
- **High priority**: Use cases (aim for >80%)
- **Medium priority**: Entities (aim for >70%)
- **Lower priority**: Infrastructure (integration tests)

## Quick Reference

```bash
# Run all tests
npm run test

# Watch mode
npm run test -- --watch

# Specific file
npm run test -- login-farmer

# With UI
npm run test -- --ui
```

## Test File Template

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import YourUseCase from './your-use-case';
import InMemoryRepository from 'test/unit/repositories/InMemoryRepository';

describe('YourUseCase', () => {
  let sut: YourUseCase;
  let repository: InMemoryRepository;

  beforeEach(() => {
    repository = new InMemoryRepository();
    sut = new YourUseCase(repository);
  });

  it('should do something', async () => {
    // Arrange
    
    // Act
    const result = await sut.execute({});

    // Assert
    expect(result).toBeDefined();
  });
});
```
