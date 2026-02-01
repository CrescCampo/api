# Error Handling Patterns

## Overview

This project uses a multi-layered error handling approach that separates **domain errors** from **infrastructure errors** and translates them appropriately at each layer.

---

## Error Layers

```
┌─────────────────────────────────────────┐
│  HTTP Layer (Controllers)               │
│  - Returns HTTP status codes            │
│  - Maps errors via exception filter     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Application Layer (Use Cases)          │
│  - Throws domain errors                 │
│  - Business rule violations             │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Domain Layer (Entities)                │
│  - Domain-specific errors               │
│  - No HTTP/framework dependencies       │
└─────────────────────────────────────────┘
```

---

## Domain Errors

### Base Interface

**File**: `src/core/use-case-error.ts`

```typescript
export interface UseCaseError {
  message: string;
}
```

### Creating Domain Errors

**File**: `src/domain/application/errors/auth/WrongCredentialsError.ts`

```typescript
export default class WrongCredentialsError extends Error implements UseCaseError {
  constructor() {
    super('Credentials are not valid');
  }
}
```

**Key Points**:
- Extend `Error` for stack trace
- Implement `UseCaseError` interface
- Descriptive error name (not `Error401`)
- Business-focused message (not HTTP-focused)

### Error Organization

```
src/domain/application/errors/
├── auth/
│   ├── UserAlreadyExistsError.ts
│   └── WrongCredentialsError.ts
├── farmer/
│   └── FarmerNotFoundError.ts
├── farm/
│   └── FarmNotFoundError.ts
├── harvest/
│   └── HarvestNotFoundError.ts
└── transaction/
    └── InvalidTransactionAmountError.ts
```

### Common Domain Error Patterns

#### Not Found Errors

```typescript
export default class FarmerNotFoundError extends Error implements UseCaseError {
  constructor(id?: string) {
    super(id ? `Farmer with ID ${id} not found` : 'Farmer not found');
  }
}
```

#### Already Exists Errors

```typescript
export default class UserAlreadyExistsError extends Error implements UseCaseError {
  constructor(email?: string) {
    super(email ? `User with email ${email} already exists` : 'User already exists');
  }
}
```

#### Validation Errors

```typescript
export default class InvalidEmailError extends Error implements UseCaseError {
  constructor(email: string) {
    super(`Email "${email}" is not valid`);
  }
}
```

#### Business Rule Violations

```typescript
export default class InsufficientBalanceError extends Error implements UseCaseError {
  constructor(required: number, available: number) {
    super(`Insufficient balance. Required: ${required}, Available: ${available}`);
  }
}
```

---

## Throwing Errors in Use Cases

### Pattern

```typescript
@Injectable()
export default class LoginFarmerByEmail {
  constructor(
    private readonly farmerRepository: FarmerRepository,
    private readonly hashComparer: HashComparer,
  ) {}

  async execute(input: Input): Promise<Output> {
    // 1. Try to find entity
    const farmer = await this.farmerRepository.findByEmail(input.email);

    // 2. Throw domain error if not found
    if (!farmer) {
      throw new WrongCredentialsError();
    }

    // 3. Validate business rules
    const isPasswordValid = await this.hashComparer.compare(
      input.password,
      farmer.password,
    );

    if (!isPasswordValid) {
      throw new WrongCredentialsError();
    }

    // 4. Check state
    if (farmer.disabled) {
      throw new AccountDisabledError();
    }

    // 5. Continue with happy path
    return { userId: farmer.id, token: 'token' };
  }
}
```

### Guard Clauses Pattern

Use **early returns** for error cases:

```typescript
async execute(input: Input): Promise<Output> {
  // Guard: Check entity exists
  const farmer = await this.farmerRepository.findById(input.farmerId);
  if (!farmer) {
    throw new FarmerNotFoundError(input.farmerId);
  }

  // Guard: Check permissions
  if (!farmer.hasPermission('create-harvest')) {
    throw new InsufficientPermissionsError();
  }

  // Guard: Validate input
  if (input.quantity <= 0) {
    throw new InvalidQuantityError(input.quantity);
  }

  // Happy path
  const harvest = Harvest.create({ /* ... */ });
  await this.harvestRepository.save(harvest);
  
  return { harvestId: harvest.id };
}
```

---

## Error Mapping (Infrastructure)

### Error Status Mapper

**File**: `src/infra/exceptions/error-status-mapper.ts`

```typescript
import { HttpStatus } from '@nestjs/common';
import { UseCaseError } from 'core/use-case-error';

// Import domain errors
import WrongCredentialsError from 'domain/application/errors/auth/WrongCredentialsError';
import UserAlreadyExistsError from 'domain/application/errors/auth/UserAlreadyExistsError';
import FarmerNotFoundError from 'domain/application/errors/farmer/FarmerNotFoundError';

export class ErrorStatusMapper {
  static toHttpStatus(error: Error): HttpStatus {
    // 401 Unauthorized
    if (error instanceof WrongCredentialsError) {
      return HttpStatus.UNAUTHORIZED;
    }

    // 404 Not Found
    if (
      error instanceof FarmerNotFoundError ||
      error instanceof FarmNotFoundError
    ) {
      return HttpStatus.NOT_FOUND;
    }

    // 409 Conflict
    if (error instanceof UserAlreadyExistsError) {
      return HttpStatus.CONFLICT;
    }

    // 400 Bad Request (default for domain errors)
    if (this.isUseCaseError(error)) {
      return HttpStatus.BAD_REQUEST;
    }

    // 500 Internal Server Error (unexpected errors)
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private static isUseCaseError(error: Error): error is UseCaseError {
    return 'message' in error;
  }
}
```

### Global Exception Filter

**File**: `src/infra/exceptions/all-exceptions.filter.ts`

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ErrorStatusMapper } from './error-status-mapper';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: HttpStatus;
    let message: string;

    if (exception instanceof HttpException) {
      // NestJS HTTP exceptions
      status = exception.getStatus();
      message = exception.message;
    } else if (exception instanceof Error) {
      // Domain errors
      status = ErrorStatusMapper.toHttpStatus(exception);
      message = exception.message;
    } else {
      // Unknown errors
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Register Filter

**File**: `src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './infra/app.module';
import { AllExceptionsFilter } from './infra/exceptions/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Register global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(3000);
}

bootstrap();
```

---

## Error Responses

### Format

All errors return consistent JSON:

```json
{
  "statusCode": 401,
  "message": "Credentials are not valid",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### HTTP Status Codes

| Status | Use Case | Example Errors |
|--------|----------|----------------|
| **400** | Bad Request (validation) | `InvalidQuantityError`, `InvalidDateRangeError` |
| **401** | Unauthorized (auth failed) | `WrongCredentialsError`, `InvalidTokenError` |
| **403** | Forbidden (no permission) | `InsufficientPermissionsError` |
| **404** | Not Found | `FarmerNotFoundError`, `HarvestNotFoundError` |
| **409** | Conflict | `UserAlreadyExistsError`, `DuplicateEntryError` |
| **422** | Unprocessable Entity | `InvalidBusinessRuleError` |
| **500** | Internal Server Error | Unexpected errors, infrastructure failures |

---

## Validation Errors

### DTO Validation

Use class-validator in controllers:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

class RegisterFarmerBodyDTO {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}
```

**Automatic Response**:
```json
{
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 6 characters"
  ],
  "error": "Bad Request"
}
```

### Custom Validation Pipe

**File**: `src/infra/http/pipes/validation.pipe.ts`

```typescript
import { ValidationPipe, BadRequestException } from '@nestjs/common';

export const CustomValidationPipe = new ValidationPipe({
  whitelist: true,         // Strip unknown properties
  forbidNonWhitelisted: true,  // Throw if unknown properties
  transform: true,         // Auto-transform to DTO types
  exceptionFactory: (errors) => {
    const messages = errors.map((error) =>
      Object.values(error.constraints || {}).join(', '),
    );
    return new BadRequestException({
      statusCode: 400,
      message: messages,
      error: 'Validation Error',
    });
  },
});
```

---

## Testing Errors

### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import LoginFarmerByEmail from './login-farmer-by-email';
import WrongCredentialsError from 'domain/application/errors/auth/WrongCredentialsError';

describe('LoginFarmerByEmail', () => {
  it('should throw WrongCredentialsError when farmer does not exist', async () => {
    const sut = new LoginFarmerByEmail(/* deps */);

    await expect(
      sut.execute({
        email: 'nonexistent@example.com',
        password: 'password',
      }),
    ).rejects.toThrow(WrongCredentialsError);
  });

  it('should throw WrongCredentialsError with correct message', async () => {
    const sut = new LoginFarmerByEmail(/* deps */);

    await expect(
      sut.execute({
        email: 'nonexistent@example.com',
        password: 'password',
      }),
    ).rejects.toThrow('Credentials are not valid');
  });
});
```

### Integration Tests

```typescript
import request from 'supertest';
import { INestApplication } from '@nestjs/common';

describe('POST /auth/login', () => {
  let app: INestApplication;

  it('should return 401 for wrong credentials', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'wrong@example.com',
        password: 'wrong',
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Credentials are not valid');
  });
});
```

---

## Best Practices

### ✅ Do

1. **Create specific error classes**
   ```typescript
   throw new FarmerNotFoundError(id);
   ```

2. **Use guard clauses**
   ```typescript
   if (!farmer) throw new FarmerNotFoundError();
   if (farmer.disabled) throw new AccountDisabledError();
   ```

3. **Include context in error messages**
   ```typescript
   throw new InvalidQuantityError(`Quantity ${quantity} must be positive`);
   ```

4. **Test error cases**
   ```typescript
   it('should throw error when...', async () => {
     await expect(sut.execute(input)).rejects.toThrow(SpecificError);
   });
   ```

5. **Map to appropriate HTTP status**
   ```typescript
   if (error instanceof NotFoundError) return HttpStatus.NOT_FOUND;
   ```

### ❌ Don't

1. **Don't use generic Error**
   ```typescript
   // ❌ BAD
   throw new Error('Something went wrong');
   
   // ✅ GOOD
   throw new FarmerNotFoundError(id);
   ```

2. **Don't include HTTP status in domain errors**
   ```typescript
   // ❌ BAD
   class Error404FarmerNotFound extends Error {}
   
   // ✅ GOOD
   class FarmerNotFoundError extends Error {}
   ```

3. **Don't catch and swallow errors**
   ```typescript
   // ❌ BAD
   try {
     await operation();
   } catch {
     console.log('Error occurred');
   }
   
   // ✅ GOOD
   const result = await operation(); // Let errors propagate
   ```

4. **Don't mix domain and infrastructure errors**
   ```typescript
   // ❌ BAD (in domain layer)
   throw new HttpException('Not found', 404);
   
   // ✅ GOOD
   throw new FarmerNotFoundError();
   ```

---

## Error Hierarchy

### Suggested Structure

```
Error (built-in)
├── UseCaseError (interface)
│   ├── NotFoundError (base class)
│   │   ├── FarmerNotFoundError
│   │   ├── HarvestNotFoundError
│   │   └── FarmNotFoundError
│   │
│   ├── ValidationError (base class)
│   │   ├── InvalidEmailError
│   │   ├── InvalidQuantityError
│   │   └── InvalidDateRangeError
│   │
│   ├── AuthenticationError (base class)
│   │   ├── WrongCredentialsError
│   │   └── TokenExpiredError
│   │
│   └── ConflictError (base class)
│       ├── UserAlreadyExistsError
│       └── DuplicateEntryError
```

---

## Quick Reference

### Creating a New Domain Error

1. **Create error class** in `domain/application/errors/<feature>/`
   ```typescript
   export default class MyError extends Error implements UseCaseError {
     constructor() {
       super('Descriptive message');
     }
   }
   ```

2. **Map to HTTP status** in `error-status-mapper.ts`
   ```typescript
   if (error instanceof MyError) {
     return HttpStatus.BAD_REQUEST;
   }
   ```

3. **Use in use case**
   ```typescript
   if (condition) {
     throw new MyError();
   }
   ```

4. **Test it**
   ```typescript
   await expect(sut.execute(input)).rejects.toThrow(MyError);
   ```
