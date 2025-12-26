# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the NestJS application entrypoint (`src/main.ts`) and modules.
- `src/core/`, `src/domain/`, and `src/infra/` separate core abstractions, domain logic (use cases/entities), and infrastructure adapters (DB/HTTP).
- Tests live next to code as `*.spec.ts` and in `test/` (currently `test/unit/`).
- Build output goes to `dist/`.
- Database tooling is configured in `drizzle.config.ts`; local services are described in `docker-compose.yml`.

## Build, Test, and Development Commands
- `npm run start` starts the API with NestJS in standard mode.
- `npm run start:dev` runs with file watching for local development.
- `npm run build` compiles TypeScript to `dist/`.
- `npm run start:prod` runs the compiled app from `dist/main`.
- `npm run lint` runs ESLint with autofix enabled.
- `npm run format` runs Prettier on `src/**/*.ts` and `test/**/*.ts`.
- `npm run test` runs the Vitest suite.
- `npm run generate` and `npm run migrate` manage Drizzle migrations; `npm run studio` opens the Drizzle Studio UI.

## Coding Style & Naming Conventions
- TypeScript with 2-space indentation and single quotes (per Prettier config).
- Prefer `camelCase` for variables/functions and `PascalCase` for classes and NestJS modules/providers.
- Keep file names descriptive and kebab-cased for use cases, e.g., `login-farmer-by-email.spec.ts`.
- Follow ESLint rules from `.eslintrc.js` (Airbnb base + Prettier).

## Testing Guidelines
- Framework: Vitest (`npm run test`).
- Use `*.spec.ts` for unit and integration tests; co-locate tests with the related code when practical.
- There is no explicit coverage gate in this repo; add tests for new behavior and bug fixes.

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commits in existing history (e.g., `feat: http setup`).
- Keep commits focused on a single change.
- PRs should include: a concise description, relevant commands run, and links to issues or tickets when available.

## Configuration & Environment
- Environment variables are loaded via `dotenv`/`@nestjs/config`; keep secrets out of source control.
- Review `drizzle.config.ts` and `docker-compose.yml` when working with the database locally.
