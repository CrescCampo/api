# CrescCampo API

API backend do CrescCampo — plataforma de gestão agrícola para pequenos produtores rurais.

Construída com **NestJS**, **Clean Architecture** e **DDD**, usando **Drizzle ORM** com PostgreSQL.

## Requisitos

- Node.js 20+
- Docker
- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) (apenas para testes de carga)

## Setup

```bash
# Instalar dependências
npm install

# Copiar variáveis de ambiente
cp .env.example .env

# Subir banco de dados
docker compose up -d

# Rodar migrations
npm run migrate

# Iniciar em modo desenvolvimento
npm run start:dev
```

## Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run start:dev` | Inicia com hot reload |
| `npm run build` | Build de produção |
| `npm run start:prod` | Inicia build de produção |
| `npm run lint` | Lint com autofix |
| `npm run format` | Formata com Prettier |
| `npm run generate` | Gera migration do Drizzle |
| `npm run migrate` | Aplica migrations |
| `npm run studio` | Abre Drizzle Studio |

## Testes

O projeto possui três níveis de testes automatizados, todos executáveis via linha de comando (CI/CD friendly):

| Tipo | Framework | Comando |
|------|-----------|---------|
| Unitário | Vitest | `npm test` |
| E2E | Vitest + Supertest + Testcontainers | `npm run test:e2e` |
| Carga (bônus) | k6 + Testcontainers | `npm run test:load:*` |

### Pré-requisitos

- **Node.js 20+**
- **Docker** (obrigatório para testes E2E e de carga)
- [**k6**](https://grafana.com/docs/k6/latest/set-up/install-k6/) (apenas para testes de carga)

### Instalação e Execução

```bash
# 1. Instalar dependências
npm install

# 2. Copiar variáveis de ambiente
cp .env.example .env

# 3. Executar testes unitários
npm test

# 4. Executar testes unitários com coverage
npm run test:unit

# 5. Executar testes E2E (requer Docker rodando)
npm run test:e2e

# 6. Executar testes de carga (requer Docker + k6)
npm run test:load:browsing
```

### Relatórios

Todos os testes produzem relatórios de execução automaticamente:

| Tipo | Comando | Relatório Gerado |
|------|---------|------------------|
| Cobertura unitária | `npm run test:unit` | `coverage/unit/index.html` |
| Cobertura E2E | `npm run test:e2e` | `coverage/e2e/index.html` |
| Resultado E2E (HTML) | `npm run test:e2e` | `test-reports/e2e/index.html` |
| Dashboard de carga | `npm run test:load:*` | `test/load/reports/*.html` |

### Casos de Teste E2E

14 casos de teste automatizados com identificadores únicos (TC-001 a TC-014):

#### Dados Válidos / Caminho Feliz

| ID | Rota | Descrição |
|----|------|-----------|
| TC-001 | `POST /auth/register` | Deve registrar um novo usuário e retornar userId |
| TC-002 | `POST /auth/login` | Deve autenticar e retornar token e dados do usuário |
| TC-012 | `POST /app/push` | Deve criar cultura via push (201) |
| TC-013 | `GET /app/pull` | Deve retornar harvests, transactions e totais após push (200) |
| TC-014 | `DELETE /transactions/:id` | Deve reverter totais do harvest ao deletar |

#### Dados Inválidos / Caminho Triste

| ID | Rota | Descrição |
|----|------|-----------|
| TC-003 | `POST /auth/register` | Deve rejeitar email com formato inválido (400) |
| TC-004 | `POST /auth/register` | Deve rejeitar email já cadastrado |
| TC-005 | `POST /auth/login` | Deve rejeitar senha incorreta (401) |
| TC-006 | `POST /auth/login` | Deve rejeitar email inexistente (401) |
| TC-007 | `POST /auth/register` | Deve rejeitar body vazio (400) |
| TC-008 | `GET /transactions` | Deve rejeitar requisição sem token (401) |
| TC-009 | `GET /transactions` | Deve rejeitar page=0 (400) |
| TC-010 | `PATCH /transactions/:id` | Deve rejeitar ID de transação inexistente (404) |
| TC-011 | `DELETE /transactions/:id` | Deve rejeitar ID de transação inexistente ao deletar (404) |

### Casos de Teste de Carga (Bônus)

6 cenários de performance com k6:

| ID | Cenário | VUs | Thresholds |
|----|---------|-----|------------|
| TC-021 | Onboarding — registro de novos usuários | 10 | p95<800ms, err<5% |
| TC-022 | Daily Browsing — navegação de harvests e transactions | 10 | p95<500ms, err<1% |
| TC-023 | Mobile Sync — sincronização push/pull do app | 10 | p95<1000ms, err<1% |
| TC-024 | Financial Management — CRUD de transações | 5 | p95<600ms, err<5% |
| TC-025 | Feedback Burst — rajada de envio de feedbacks | 15 | p95<500ms, err<1% |
| TC-026 | Peak Traffic — estresse com tráfego de pico combinado | 80 | p95<200ms, err<5% |

Para documentação completa sobre configuração, infraestrutura e como adicionar novos testes, veja [`TESTING.md`](TESTING.md).

## Testes de Performance

Os testes de carga usam [k6](https://k6.io/) com infraestrutura provisionada automaticamente via [Testcontainers](https://testcontainers.com/). Cada execução sobe containers isolados de PostgreSQL, API(s) e Nginx, roda o cenário e faz teardown automático.

### Como rodar

```bash
# Cenários individuais (1 API)
npm run test:load:onboarding          # Registro + login
npm run test:load:browsing            # Navegação (leitura)
npm run test:load:financial           # Edição de transações (escrita)
npm run test:load:sync                # Sync mobile (/app/pull)
npm run test:load:feedback            # Feedback em massa
npm run test:load:peak                # Stress test (80 VUs, todos os workloads)

# Com load balancer (default: 2 réplicas da API)
npm run test:load:peak:balanced

# Com número customizado de réplicas
npm run test:load:peak:balanced -- --replicas=4
```

### Topologias

**Single** — 1 API atrás de Nginx (reverse proxy):

```
k6 --> Nginx:80 --> API:3000 --> PostgreSQL:5432
```

**Balanced** — N APIs atrás de Nginx (round-robin):

```
                ┌--> API-1:3000 --┐
k6 --> Nginx:80 |--> API-2:3000 --|--> PostgreSQL:5432
                └--> API-N:3000 --┘
```

O argumento `--replicas=N` controla o número de instâncias da API na topologia balanced (default: 2). O Nginx config é gerado dinamicamente.

### Cenários

| Cenário | Descrição | VUs |
|---------|-----------|-----|
| `onboarding` | Registro + login (bcrypt) | 10 |
| `daily-browsing` | Listagem safras/transações | 10 |
| `financial-management` | Edição de transações | 5 |
| `mobile-sync` | Sync completo do app | 10 |
| `feedback-burst` | Feedback em alto volume | 15 |
| `peak-traffic` | Stress test combinado | 80 |

O cenário **peak-traffic** roda todos os workloads em paralelo (registro, sync, navegação e edição simultâneos) com zero think time. Projetado para encontrar o limite de saturação de um único container.

Para documentação detalhada de cada cenário, veja [`LOAD-TEST-SCENARIOS.md`](LOAD-TEST-SCENARIOS.md).

## Arquitetura

```
src/
├── core/               # Abstractions (Entity base class, utilities)
├── domain/
│   ├── enterprise/     # Entities, Value Objects, Enums
│   └── application/    # Use Cases, Repository interfaces, Errors
└── infra/
    ├── database/       # Drizzle ORM, migrations, repositories
    ├── http/           # Controllers, DTOs, Swagger
    └── auth/           # JWT authentication
```

Dependências fluem para dentro: `infra -> application -> enterprise -> core`.

Para documentação completa da arquitetura, veja a pasta [`docs/`](docs/).

## Uso de IA

Este projeto utilizou ferramentas de inteligência artificial como apoio durante o desenvolvimento:

- **Claude (Anthropic)**: Auxílio na implementação de testes, configuração de infraestrutura de testes (Testcontainers, k6) e documentação.

Todas as decisões de arquitetura, implementação e revisão de código foram realizadas pelos integrantes do grupo. O uso de IA foi limitado a assistência e aceleração do desenvolvimento.
