# Testes - CrescCampo API

Este documento descreve como os testes do projeto estão configurados e como executá-los.

## Visão Geral

O projeto possui três tipos de testes:

| Tipo | Framework | Diretório | Comando |
|------|-----------|-----------|---------|
| Unitário | Vitest | `test/unit/` | `npm test` |
| E2E | Vitest + Testcontainers | `test/e2e/` | `npm run test:e2e` |
| Carga | k6 + Testcontainers | `test/load/` | `npm run test:load:browsing` |

---

## Estrutura de Diretórios

```
test/
├── setup-env.ts                    # Carrega .env.test para todos os testes
├── unit/
│   ├── repositories/               # Repositórios in-memory para testes
│   │   ├── InMemoryHarvestRepository.ts
│   │   ├── InMemoryTransactionRepository.ts
│   │   └── ...
│   └── use-cases/                  # Testes unitários dos use cases
│       ├── auth/
│       ├── harvests/
│       ├── transactions/
│       └── ...
├── e2e/
│   ├── setup/
│   │   ├── global-setup.ts         # Inicia container PostgreSQL
│   │   ├── global-teardown.ts      # Para container PostgreSQL
│   │   └── setup-e2e.ts            # Roda migrations (por worker)
│   ├── helpers/
│   │   ├── test-database.ts        # Gerencia container PostgreSQL
│   │   └── test-app-factory.ts     # Cria instância NestJS para teste
│   └── tests/                      # Specs dos testes E2E
└── load/
    ├── auth.ts                     # Helper de autenticação para k6
    ├── esbuild.config.mjs          # Bundler dos cenários k6
    ├── scenarios/                   # Scripts k6 (TypeScript)
    │   ├── onboarding.ts           # Registro + login
    │   ├── daily-browsing.ts       # Navegação safras/transações
    │   ├── financial-management.ts # Edição de transações
    │   ├── mobile-sync.ts          # Sync mobile (pull)
    │   ├── feedback-burst.ts       # Feedback em massa
    │   └── peak-traffic.ts         # Stress test (todos os workloads)
    ├── dist/                        # Scripts bundlados (gerado)
    └── infra/                       # Infraestrutura com Testcontainers
        ├── runner.ts                # Orquestrador principal
        ├── containers/              # Factories de containers
        │   ├── create-network.ts
        │   ├── create-postgres.ts
        │   ├── create-api.ts
        │   ├── create-nginx.ts
        │   └── run-migrations.ts
        ├── helpers/
        │   ├── jwt-keys.ts
        │   └── spawn-k6.ts
        └── nginx/
            └── single.conf          # Proxy reverso -> 1 API
```

---

## 1. Testes Unitários

Testam use cases e lógica de domínio de forma isolada, usando repositórios in-memory.

### Configuração

- **Config**: `vitest.config.ts`
- **Setup**: Carrega `.env.test` via `test/setup-env.ts`
- **Timeout**: 10s por teste
- **Workers**: 50% dos CPUs disponíveis
- **Coverage**: `src/domain/application/use-cases/`

### Como Funcionam

Cada teste cria instâncias de repositórios in-memory (ex: `InMemoryHarvestRepository`) e injeta no use case. Não há banco de dados real nem framework envolvido.

### Comandos

```bash
npm test                  # Executa todos os testes unitários
npm run test:unit         # Executa com coverage
npm run test:unit:watch   # Modo watch (re-executa ao salvar)
```

---

## 2. Testes E2E

Testam endpoints HTTP completos, com banco de dados real via Testcontainers.

### Configuração

- **Config**: `vitest.e2e.config.ts`
- **Setup**: `test/setup-env.ts` + `test/e2e/setup/setup-e2e.ts`
- **Timeout**: 60s por teste
- **Workers**: 1 (execução sequencial para evitar conflitos no banco)
- **Coverage**: `src/infra/http/controllers/`

### Como Funcionam

1. **global-setup.ts**: Inicia um container PostgreSQL via `@testcontainers/postgresql` (singleton, reutilizável entre execuções)
2. **setup-e2e.ts**: Conecta ao container e roda migrations do Drizzle ORM
3. **test-app-factory.ts**: Cria uma instância do NestJS (`AppModule`) com `ValidationPipe` configurado
4. Cada teste faz requests HTTP reais contra a aplicação

O container PostgreSQL usa `.withReuse()`, ou seja, persiste entre execuções para acelerar o ciclo de desenvolvimento.

### Comandos

```bash
npm run test:e2e          # Executa com coverage
npm run test:e2e:watch    # Modo watch
```

### Pré-requisitos

- Docker rodando

---

## 3. Testes de Carga

Testam performance dos endpoints usando k6, com infraestrutura completa provisionada via Testcontainers.

### Arquitetura

O k6 é um binário Go que executa os cenários. Como o Testcontainers roda em Node.js, um script orquestrador (`runner.ts`) gerencia o ciclo de vida:

```
runner.ts (Node.js)
  ├── Provisiona containers (Testcontainers)
  │   ├── PostgreSQL (0.5 vCPU, 256MB RAM)
  │   ├── API NestJS (0.5 vCPU, 256MB RAM) x N
  │   └── Nginx reverse proxy (0.5 vCPU, 256MB RAM)
  ├── Roda migrations + seed
  ├── Executa k6 como child process
  └── Teardown (remove todos os containers)
```

### Topologias de Infraestrutura

#### Single (1 API + Nginx proxy)

```
k6 --> Nginx:80 --> API:3000 --> PostgreSQL:5432
```

Um único container da API atrás do Nginx atuando como reverse proxy.

#### Balanced (N APIs + Nginx ALB)

```
                ┌--> API-1:3000 --┐
k6 --> Nginx:80 |--> API-2:3000 --|--> PostgreSQL:5432
                └--> API-N:3000 --┘
```

N containers da API com Nginx distribuindo tráfego via round-robin. O número de réplicas é configurável via `--replicas=N` (default: 2).

### Cenários de Teste

Os cenários estão documentados em detalhe no arquivo [`LOAD-TEST-SCENARIOS.md`](LOAD-TEST-SCENARIOS.md).

| Script | Descrição | VUs | Thresholds |
|--------|-----------|-----|------------|
| `onboarding` | Registro + login de novos usuários | 10 | p95<800ms, err<5% |
| `daily-browsing` | Listagem de safras e transações (leitura) | 10 | p95<500ms, err<1% |
| `financial-management` | Edição de transações (escrita) | 5 | p95<600ms, err<5% |
| `mobile-sync` | Pull completo dos dados (app sync) | 10 | p95<1000ms, err<1% |
| `feedback-burst` | Envio de feedbacks em alto volume | 15 | p95<500ms, err<1% |
| `peak-traffic` | Stress test — todos os workloads simultâneos | 80 | p95<200ms, err<5% |

### Comandos

```bash
# Cenário single (1 API)
npm run test:load:onboarding          # Registro + login
npm run test:load:browsing            # Navegação safras/transações
npm run test:load:financial           # Edição de transações
npm run test:load:sync                # Sync mobile (pull)
npm run test:load:feedback            # Feedback em massa
npm run test:load:peak                # Stress test (todos os workloads)

# Cenário balanced (default: 2 réplicas)
npm run test:load:onboarding:balanced
npm run test:load:browsing:balanced
npm run test:load:financial:balanced
npm run test:load:sync:balanced
npm run test:load:feedback:balanced
npm run test:load:peak:balanced

# Balanced com número customizado de réplicas
npm run test:load:peak:balanced -- --replicas=4
npm run test:load:browsing:balanced -- --replicas=6
```

### O que o Runner Faz (passo a passo)

1. Verifica se o k6 está instalado
2. Builda os cenários k6 com esbuild (TS -> JS)
3. Carrega JWT keys do `.env.test`
4. Cria uma Docker network isolada
5. Inicia container PostgreSQL (`@testcontainers/postgresql`)
6. Roda migrations do Drizzle ORM
7. Executa seed do banco (cria usuário `demo@cresc.campo` / `password123` + dados de teste)
8. Builda imagem Docker da API (`docker build --target runner`)
9. Inicia container(s) da API (1 ou N dependendo do cenário e `--replicas`)
10. Inicia container Nginx com config gerada dinamicamente (proxy ou ALB com N upstreams)
11. Executa k6 apontando para o Nginx
12. **Teardown**: Para todos os containers e remove a network

### Limites de Recursos

Cada container roda com recursos limitados para simular um ambiente realista:

- **CPU**: 0.5 vCPU por container
- **Memória**: 256MB por container

### Pré-requisitos

- Docker rodando
- [k6 instalado](https://grafana.com/docs/k6/latest/set-up/install-k6/)
- Arquivo `.env.test` configurado com JWT keys

### Testes de Carga Manuais (sem Testcontainers)

Para rodar contra uma instância já em execução:

```bash
# Buildar cenários
npm run test:load:build

# Executar apontando para a API local
BASE_URL=http://localhost:5000 \
TEST_EMAIL=demo@cresc.campo \
TEST_PASSWORD=password123 \
k6 run test/load/dist/daily-browsing.js
```

---

## Variáveis de Ambiente

Todos os testes carregam variáveis do `.env.test`. Variáveis relevantes:

| Variável | Descrição |
|----------|-----------|
| `POSTGRES_*` | Credenciais do banco (sobrescritas pelo Testcontainers nos testes E2E/carga) |
| `JWT_PRIVATE_KEY_BASE_64` | Chave privada RSA em base64 (usada nos containers da API) |
| `JWT_PUBLIC_KEY_BASE_64` | Chave pública RSA em base64 |
| `APP_ENV` | Ambiente da aplicação (`test` durante testes) |
| `RATE_LIMIT_TTL` | TTL do rate limiter em ms (elevado nos testes de carga) |
| `RATE_LIMIT_LIMIT` | Limite de requests por TTL (elevado nos testes de carga) |

---

## Adicionando Novos Testes

### Novo teste unitário

1. Crie o arquivo em `test/unit/use-cases/<dominio>/<nome>.spec.ts`
2. Use repositórios in-memory de `test/unit/repositories/`
3. Siga o padrão AAA (Arrange-Act-Assert)

### Novo teste E2E

1. Crie o arquivo em `test/e2e/tests/<dominio>/<nome>.e2e-spec.ts`
2. Use `TestAppFactory.create()` para obter a instância da aplicação
3. Use `supertest` para fazer requests HTTP

### Novo cenário de carga

1. Crie o arquivo em `test/load/scenarios/<nome>.ts`
2. Use `getToken()` de `../auth` para autenticação (se precisar de auth)
3. Defina `options` com stages e thresholds
4. O esbuild vai incluir automaticamente no build
5. Adicione o script no `package.json`
6. Execute com: `tsx test/load/infra/runner.ts --scenario=single --script=<nome>`
