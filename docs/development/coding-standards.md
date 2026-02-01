# Coding Standards

## Overview

This project follows TypeScript best practices with consistent formatting and linting rules.

## Tools

- **TypeScript**: Type-safe JavaScript
- **ESLint**: Linting (Airbnb base config + Prettier)
- **Prettier**: Code formatting

## Commands

```bash
# Format code
npm run format

# Lint with autofix
npm run lint

# Build (compiles TypeScript)
npm run build
```

---

## TypeScript Configuration

### Strict Mode
TypeScript is configured with strict type checking (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictFunctionTypes": true
  }
}
```

### Type Guidelines

✅ **Do:**
- Always type function parameters and return values
- Use interfaces for object shapes
- Use type for unions/intersections
- Prefer `unknown` over `any`
- Use `null` or `undefined` explicitly

```typescript
// ✅ GOOD
function findById(id: string): Promise<Farmer | null> {
  // ...
}

interface FarmerProps {
  name: string;
  email: string;
}

type Result = Success | Error;
```

❌ **Don't:**
```typescript
// ❌ BAD: Missing types
function findById(id) {
  // ...
}

// ❌ BAD: Using any
function process(data: any) {
  // ...
}
```

---

## Naming Conventions

### Files and Folders

- **Folders**: `kebab-case`
  - `use-cases/`, `domain/enterprise/`, `infra/http/`
  
- **TypeScript Classes/Entities**: `PascalCase`
  - `Farmer.ts`, `LoginFarmerByEmail.ts`, `FarmerRepository.ts`
  
- **Config Files**: `kebab-case`
  - `drizzle.config.ts`, `nest-cli.json`

- **Test Files**: Same as source + `.spec.ts`
  - `login-farmer-by-email.spec.ts`

### Code Naming

| Type | Convention | Example |
|------|------------|---------|
| **Classes** | PascalCase | `Farmer`, `LoginFarmerByEmail` |
| **Interfaces** | PascalCase (no `I` prefix) | `FarmerProps`, `Input` |
| **Abstract Classes** | PascalCase | `FarmerRepository`, `Entity` |
| **Variables** | camelCase | `farmerRepository`, `userId` |
| **Functions** | camelCase | `findByEmail()`, `execute()` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| **Private Fields** | `#` prefix | `#id`, `#touch()` |
| **Boolean Variables** | `is/has/should` prefix | `isDisabled`, `hasPermission` |

### Examples

```typescript
// ✅ Class
export default class Farmer extends Entity<FarmerProps> {}

// ✅ Interface (no I prefix)
interface Input {
  email: string;
  password: string;
}

// ✅ Abstract class (repository)
export default abstract class FarmerRepository {
  abstract save(farmer: Farmer): Promise<void>;
}

// ✅ Variables
const farmerRepository = new InMemoryFarmerRepository();
const userId = farmer.id;

// ✅ Private fields
class Farmer {
  #id: string;
  
  #touch() {
    this.props.updatedAt = new Date();
  }
}

// ✅ Boolean naming
const isDisabled = farmer.disabled;
const hasValidEmail = emailPattern.test(email);
```

---

## Code Formatting

### Prettier Configuration

```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Key Rules

- **Indentation**: 2 spaces (no tabs)
- **Quotes**: Single quotes `'string'`
- **Semicolons**: Required `;`
- **Line width**: 80 characters
- **Trailing commas**: Always (objects, arrays, function params)

### Examples

```typescript
// ✅ GOOD: Proper formatting
export default class LoginFarmerByEmail {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly hashComparer: HashComparer,
  ) {} // Trailing comma

  async execute(input: Input): Promise<Output> {
    const farmer = await this.farmerRepository.findByEmail(input.email);

    if (!farmer) {
      throw new WrongCredentialsError();
    }

    return {
      userId: farmer.id,
      token: 'token',
    }; // Trailing comma
  }
}
```

---

## Import Organization

### Import Order

1. Node.js built-ins
2. External packages
3. Internal modules (using path aliases)
4. Relative imports

```typescript
// ✅ GOOD: Organized imports
import crypto from 'node:crypto';                    // 1. Node built-ins

import { Injectable } from '@nestjs/common';         // 2. External packages

import Farmer from 'domain/enterprise/entities/Farmer';  // 3. Internal (alias)
import FarmerRepository from 'domain/application/repositories/FarmerRepository';

import { HashService } from './hash.service';        // 4. Relative
```

### Path Aliases

Use TypeScript path aliases (no relative imports for domain/infra):

```typescript
// ✅ GOOD
import Farmer from 'domain/enterprise/entities/Farmer';
import FarmerRepository from 'domain/application/repositories/FarmerRepository';

// ❌ BAD: Relative paths for domain
import Farmer from '../../../domain/enterprise/entities/Farmer';
```

---

## Function Guidelines

### Function Signatures

```typescript
// ✅ GOOD: Typed parameters and return
async function findByEmail(email: string): Promise<Farmer | null> {
  // ...
}

// ✅ GOOD: Use cases with Input/Output
interface Input {
  email: string;
  password: string;
}

interface Output {
  userId: string;
  token: string;
}

async execute(input: Input): Promise<Output> {
  // ...
}
```

### Arrow Functions vs Regular Functions

- **Methods**: Use regular functions
- **Callbacks**: Use arrow functions

```typescript
// ✅ GOOD: Regular method
class Farmer {
  disable() {
    this.props.disabled = true;
  }
}

// ✅ GOOD: Arrow function callback
const emails = farmers.map((farmer) => farmer.email);
```

---

## Class Guidelines

### Constructor Dependency Injection

```typescript
// ✅ GOOD: Constructor with readonly dependencies
@Injectable()
export default class LoginFarmerByEmail {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly hashComparer: HashComparer,
    private readonly encrypter: Encrypter,
  ) {}
}
```

### Entity Pattern

```typescript
// ✅ GOOD: Entity with factory method
export default class Farmer extends Entity<FarmerProps> {
  // Getters for properties
  get name() {
    return this.props.name;
  }

  // Behavior methods (not setters)
  disable() {
    this.props.disabled = true;
    this.#touch();
  }

  // Private methods
  #touch() {
    this.props.updatedAt = new Date();
  }

  // Factory method
  static create(props: Optional<FarmerProps, ...>, id?: string) {
    return new Farmer({ ...props, /* defaults */ }, id);
  }
}
```

---

## Error Handling

### Domain Errors

```typescript
// ✅ GOOD: Descriptive error class
export default class WrongCredentialsError extends Error implements UseCaseError {
  constructor() {
    super('Credentials are not valid');
  }
}

// Usage in use case
if (!farmer) {
  throw new WrongCredentialsError();
}
```

### Never Catch-All

```typescript
// ❌ BAD: Generic catch
try {
  await operation();
} catch (error) {
  console.log(error);
}

// ✅ GOOD: Let errors propagate or handle specifically
const farmer = await this.farmerRepository.findByEmail(email);

if (!farmer) {
  throw new WrongCredentialsError();
}
```

---

## Comments

### JSDoc for Public APIs

```typescript
/**
 * Authenticates a farmer by email and password.
 * 
 * @param input - Email and password credentials
 * @returns User ID and JWT token
 * @throws {WrongCredentialsError} When credentials are invalid
 */
async execute(input: Input): Promise<Output> {
  // ...
}
```

### Inline Comments

- **Use sparingly**: Code should be self-explanatory
- **Explain WHY, not WHAT**

```typescript
// ✅ GOOD: Explains why
// Update lastLogin for analytics and security
farmer.logged();

// ❌ BAD: States the obvious
// Call the logged method
farmer.logged();
```

---

## ESLint Rules

Key rules from `.eslintrc.js`:

- **No unused vars**: Variables must be used
- **No console**: Use logger instead
- **Import order**: Enforced by plugin
- **Airbnb base**: Industry-standard rules
- **Prettier integration**: Formatting conflicts disabled

### Disabling Rules

Only when absolutely necessary:

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function legacyCode(data: any) {
  // ...
}
```

---

## Git Commit Messages

Follow **Conventional Commits**:

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructure
- `test`: Adding tests
- `chore`: Maintenance

### Examples

```
feat: add harvest listing by farm use case

fix: correct password hashing in registration

docs: update README with setup instructions

refactor: extract email validation to value object

test: add unit tests for LoginFarmerByEmail
```

---

## Best Practices

### DRY (Don't Repeat Yourself)

```typescript
// ✅ GOOD: Extract common logic
function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ❌ BAD: Duplicated validation
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email1)) { /* ... */ }
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email2)) { /* ... */ }
```

### SOLID Principles

- **S**ingle Responsibility: One class, one purpose
- **O**pen/Closed: Open for extension, closed for modification
- **L**iskov Substitution: Subtypes must be substitutable
- **I**nterface Segregation: Many specific interfaces > one general
- **D**ependency Inversion: Depend on abstractions, not concretions

### Immutability

```typescript
// ✅ GOOD: Immutable operations
const updatedFarmer = { ...farmer, name: 'New Name' };

// ✅ GOOD: Return new instances
add(other: Money): Money {
  return new Money(this.amount + other.amount);
}

// ❌ BAD: Mutating directly (except in entity behavior methods)
farmer.name = 'New Name';
```

---

## Quick Reference

### File Creation Checklist

- [ ] PascalCase for classes
- [ ] kebab-case for folders
- [ ] Co-locate tests (`.spec.ts`)
- [ ] Type all parameters and returns
- [ ] Use path aliases for imports
- [ ] Add JSDoc for public APIs
- [ ] Run `npm run format` before commit
- [ ] Run `npm run lint` before commit

### Code Review Checklist

- [ ] No `any` types (use `unknown`)
- [ ] All functions typed
- [ ] Following naming conventions
- [ ] No console.log (use logger)
- [ ] Tests added/updated
- [ ] Imports organized
- [ ] No unused variables
- [ ] Comments explain WHY, not WHAT
