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

```bash
npm test                  # Testes unitários
npm run test:unit         # Unitários com coverage
npm run test:e2e          # Testes E2E (requer Docker)
```

Para detalhes completos sobre a configuração de testes, veja [`TESTING.md`](TESTING.md).

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
