# CrescCampo API

API backend do CrescCampo — plataforma de gestao agricola para pequenos produtores rurais.

Construida com **NestJS**, **Clean Architecture** e **DDD**, usando **Drizzle ORM** com PostgreSQL.

## Requisitos

- Node.js 20+
- Docker
- [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) (apenas para testes de carga)

## Setup

```bash
# Instalar dependencias
npm install

# Copiar variaveis de ambiente
cp .env.example .env

# Subir banco de dados
docker compose up -d

# Rodar migrations
npm run migrate

# Iniciar em modo desenvolvimento
npm run start:dev
```

## Comandos

| Comando | Descricao |
|---------|-----------|
| `npm run start:dev` | Inicia com hot reload |
| `npm run build` | Build de producao |
| `npm run start:prod` | Inicia build de producao |
| `npm run lint` | Lint com autofix |
| `npm run format` | Formata com Prettier |
| `npm run generate` | Gera migration do Drizzle |
| `npm run migrate` | Aplica migrations |
| `npm run studio` | Abre Drizzle Studio |

## Testes

```bash
npm test                  # Testes unitarios
npm run test:unit         # Unitarios com coverage
npm run test:e2e          # Testes E2E (requer Docker)
```

Para detalhes completos sobre a configuracao de testes, veja [`TESTING.md`](TESTING.md).

## Testes de Performance

Os testes de carga usam [k6](https://k6.io/) com infraestrutura provisionada automaticamente via [Testcontainers](https://testcontainers.com/). Cada execucao sobe containers isolados de PostgreSQL, API(s) e Nginx, roda o cenario e faz teardown automatico.

### Como rodar

```bash
# Cenarios individuais (1 API)
npm run test:load:onboarding          # Registro + login
npm run test:load:browsing            # Navegacao (leitura)
npm run test:load:financial           # Edicao de transacoes (escrita)
npm run test:load:sync                # Sync mobile (/app/pull)
npm run test:load:feedback            # Feedback em massa
npm run test:load:peak                # Stress test (80 VUs, todos os workloads)

# Com load balancer (default: 2 replicas da API)
npm run test:load:peak:balanced

# Com numero customizado de replicas
npm run test:load:peak:balanced -- --replicas=4
```

### Topologias

**Single** — 1 API atras de Nginx (reverse proxy):

```
k6 --> Nginx:80 --> API:3000 --> PostgreSQL:5432
```

**Balanced** — N APIs atras de Nginx (round-robin):

```
                ┌--> API-1:3000 --┐
k6 --> Nginx:80 |--> API-2:3000 --|--> PostgreSQL:5432
                └--> API-N:3000 --┘
```

O argumento `--replicas=N` controla o numero de instancias da API na topologia balanced (default: 2). O Nginx config e gerado dinamicamente.

### Cenarios

| Cenario | Descricao | VUs |
|---------|-----------|-----|
| `onboarding` | Registro + login (bcrypt) | 10 |
| `daily-browsing` | Listagem safras/transacoes | 10 |
| `financial-management` | Edicao de transacoes | 5 |
| `mobile-sync` | Sync completo do app | 10 |
| `feedback-burst` | Feedback em alto volume | 15 |
| `peak-traffic` | Stress test combinado | 80 |

O cenario **peak-traffic** roda todos os workloads em paralelo (registro, sync, navegacao e edicao simultaneos) com zero think time. Projetado para encontrar o limite de saturacao de um unico container.

Para documentacao detalhada de cada cenario, veja [`LOAD-TEST-SCENARIOS.md`](LOAD-TEST-SCENARIOS.md).

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

Dependencias fluem para dentro: `infra -> application -> enterprise -> core`.

Para documentacao completa da arquitetura, veja a pasta [`docs/`](docs/).
