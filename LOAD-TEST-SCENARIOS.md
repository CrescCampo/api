# Cenários de Teste de Carga - CrescCampo API

Este documento descreve cada cenário de teste de carga, seu objetivo, o que é testado e como interpretar os resultados.

---

## 1. Onboarding

**Arquivo**: `test/load/scenarios/onboarding.ts`
**Comando**: `npm run test:load:onboarding`

### Objetivo

Simular múltiplos usuários novos se registrando e fazendo login simultaneamente. Testa a capacidade da API de criar contas em massa e autenticar usuários sob carga.

### Fluxo por VU (usuário virtual)

1. `POST /auth/register` — Cria conta com email único (gerado por VU + iteração + timestamp)
2. `POST /auth/login` — Faz login com as credenciais recém-criadas

### O que está sendo testado

- Criação de farmers no banco (INSERT com hash bcrypt de senha)
- Criação automática de farm associada ao farmer
- Geração de JWT token
- Unicidade de emails sob concorrência
- Performance do bcrypt sob carga (operação CPU-intensiva)

### Perfil de Carga

| Fase | Duração | VUs |
|------|---------|-----|
| Ramp-up | 20s | 0 -> 10 |
| Sustentado | 1min | 10 |
| Ramp-down | 10s | 10 -> 0 |

### Thresholds

- **p95 < 800ms** — Mais tolerante pois bcrypt é lento por design
- **Error rate < 5%** — Permite margem para conflitos de email (improvável mas possível)

### Checks

- `register - status 201` — Registro bem-sucedido
- `register - has userId` — Retorna ID do usuário criado
- `login - status 201` — Login bem-sucedido
- `login - has token` — Retorna JWT token

---

## 2. Daily Browsing (Navegação Diária)

**Arquivo**: `test/load/scenarios/daily-browsing.ts`
**Comando**: `npm run test:load:browsing`

### Objetivo

Simular o uso típico de um farmer logado navegando pela aplicação: listando safras, visualizando transações de uma safra específica, e consultando transações gerais. Representa o fluxo de leitura mais comum do dia a dia.

### Fluxo por VU

1. `GET /harvests?page=1&pageSize=10` — Lista primeira página de safras
2. `GET /harvests/:id/transactions?page=1&pageSize=10` — Transações da primeira safra retornada
3. `GET /harvests?page=2&pageSize=10` — Navega para segunda página
4. `GET /transactions?page=1&pageSize=10` — Lista todas as transações

### O que está sendo testado

- Queries paginadas com JOINs (safra -> cultura, transação -> categoria)
- Filtragem por farmId via JWT token
- Performance de leitura sob concorrência
- Tempo de resposta para listagens com dados relacionados

### Perfil de Carga

| Fase | Duração | VUs |
|------|---------|-----|
| Ramp-up | 20s | 0 -> 10 |
| Sustentado | 1min | 10 |
| Ramp-down | 10s | 10 -> 0 |

### Thresholds

- **p95 < 500ms** — Listagens devem ser rápidas
- **Error rate < 1%** — Leitura não deve falhar

### Checks

- `list harvests - status 200` / `has data`
- `harvest transactions - status 200` / `has data`
- `harvests page 2 - status 200`
- `list transactions - status 200` / `has data`

---

## 3. Financial Management (Gestão Financeira)

**Arquivo**: `test/load/scenarios/financial-management.ts`
**Comando**: `npm run test:load:financial`

### Objetivo

Simular farmers editando transações financeiras. Testa operações de escrita concorrente no banco, validações de negócio e integridade dos dados sob mutações simultâneas.

### Fluxo por VU

1. **Setup** (1x): Busca todas as transações existentes para obter IDs
2. `PATCH /transactions/:id` — Edita descrição e valor de uma transação aleatória
3. `GET /transactions?page=1&pageSize=10` — Lista transações para verificar consistência

### O que está sendo testado

- UPDATE concorrente em transações (mesma tabela, registros diferentes)
- Validação de ownership (transação pertence ao farmer autenticado)
- Recálculo de totais da safra após edição (receitas/despesas)
- Integridade referencial (categoryId válido)

### Perfil de Carga

| Fase | Duração | VUs |
|------|---------|-----|
| Ramp-up | 20s | 0 -> 5 |
| Sustentado | 1min | 5 |
| Ramp-down | 10s | 5 -> 0 |

### Thresholds

- **p95 < 600ms** — Escrita com validação é um pouco mais lenta
- **Error rate < 5%** — Permite margem para conflitos de concorrência

### Checks

- `edit transaction - status 200`
- `list after edit - status 200`

### Nota

Usa apenas 5 VUs (metade dos outros cenários) porque operações de escrita concorrente na mesma tabela geram mais pressão no banco.

---

## 4. Mobile Sync (Sincronização Mobile)

**Arquivo**: `test/load/scenarios/mobile-sync.ts`
**Comando**: `npm run test:load:sync`

### Objetivo

Simular o app mobile abrindo e sincronizando todos os dados do farmer de uma vez. O endpoint `/app/pull` retorna culturas, safras, transações e categorias em uma única request. É o endpoint mais pesado da API.

### Fluxo por VU

1. `GET /app/pull` — Pull completo (simula app abrindo)
2. Espera 2s (simula usuário lendo dados no app)
3. `GET /app/pull` — Segundo pull (simula refresh em background)

### O que está sendo testado

- Carga em endpoint que retorna grande volume de dados
- Múltiplas queries em sequência (culturas + safras + transações + categorias)
- Serialização de payloads grandes
- Uso de memória e CPU para montar a resposta completa
- Pressão no connection pool do PostgreSQL

### Perfil de Carga

| Fase | Duração | VUs |
|------|---------|-----|
| Ramp-up | 15s | 0 -> 10 |
| Sustentado | 1min | 10 |
| Ramp-down | 10s | 10 -> 0 |

### Thresholds

- **p95 < 1000ms** — Mais tolerante pois retorna todos os dados de uma vez
- **Error rate < 1%** — Leitura não deve falhar

### Checks

- `pull - status 200`
- `pull - has cultures` / `has harvests` / `has transactions` / `has categories`
- `refresh pull - status 200`

---

## 5. Feedback Burst (Feedback em Massa)

**Arquivo**: `test/load/scenarios/feedback-burst.ts`
**Comando**: `npm run test:load:feedback`

### Objetivo

Simular um pico de feedbacks sendo enviados simultaneamente. Testa a capacidade da API de processar alto volume de escritas simples (INSERTs) de forma rápida.

### Fluxo por VU

1. `POST /feedbacks` — Envia feedback com rating (0-5), descrição e categoria aleatórios

### O que está sendo testado

- INSERT massivo em tabela de feedbacks
- Validação de enums (category) e ranges (rating 0-5)
- Throughput máximo de escritas simples
- Comportamento do connection pool sob alta concorrência de INSERTs

### Categorias usadas

- `product_quality`, `delivery`, `service`, `price`, `other`

### Perfil de Carga

| Fase | Duração | VUs |
|------|---------|-----|
| Ramp-up | 15s | 0 -> 15 |
| Sustentado | 1min | 15 |
| Ramp-down | 10s | 15 -> 0 |

### Thresholds

- **p95 < 500ms** — INSERT simples deve ser rápido
- **Error rate < 1%** — Não deve haver falhas

### Checks

- `send feedback - status 201`
- `send feedback - has feedbackId`

### Nota

Usa 15 VUs (o maior entre os cenários regulares) para testar o limite de throughput em operações de escrita simples.

---

## 6. Peak Traffic (Horário de Pico — Stress Test)

**Arquivo**: `test/load/scenarios/peak-traffic.ts`
**Comando**: `npm run test:load:peak`

### Objetivo

Simular o pior cenário realista: todos os tipos de usuário ativos ao mesmo tempo. Projetado para saturar um único container da API (0.5 vCPU, 256MB) e demonstrar o ganho de escalabilidade horizontal com a topologia balanced.

### Arquitetura do Cenário

Diferente dos outros cenários que usam `stages`, este usa **k6 scenarios** para rodar 4 workloads em paralelo:

| Workload | Função | VUs | O que estressa |
|----------|--------|-----|----------------|
| `new_users` | `onboarding()` | 15 | CPU (bcrypt hash + compare) |
| `sync_users` | `mobileSync()` | 25 | Memória + IO (triple pull, payload grande) |
| `browsers` | `browsing()` | 30 | Connection pool (leituras paginadas + feedback write) |
| `editors` | `editing()` | 10 | Locks de escrita (UPDATE concorrente) |

**Total: 80 VUs simultâneos** (vs máximo de 15 nos outros cenários)

### Fluxo por Workload

**new_users (15 VUs)**:
1. `POST /auth/register` — Cria conta (bcrypt CPU-intensivo)
2. `POST /auth/login` — Login imediato (bcrypt compare)

**sync_users (25 VUs)**:
1. `GET /app/pull` — Pull completo de todos os dados
2. `GET /app/pull` — Refresh imediato
3. `GET /app/pull` — Terceiro pull (sem breathing room)

**browsers (30 VUs)**:
1. `GET /harvests?page=1&pageSize=10` — Lista safras
2. `GET /harvests/:id/transactions` — Transações de safra aleatória
3. `GET /transactions?page=1&pageSize=10` — Lista transações
4. `POST /feedbacks` — Envia feedback (adiciona pressão de escrita)

**editors (10 VUs)**:
1. `PATCH /transactions/:id` — Edita transação aleatória
2. `GET /transactions?page=1&pageSize=10` — Lista para verificar

### O que está sendo testado

- **Saturação de CPU**: bcrypt de 15 VUs competindo com serialization de payloads grandes
- **Pressão de memória**: 25 VUs fazendo triple /app/pull simultâneo
- **Exaustão do connection pool**: 80 VUs todos precisando de conexões PostgreSQL
- **Contenção de escrita**: edits e feedbacks concorrentes com leituras pesadas
- **Degradação sob carga combinada**: como a API se comporta quando tudo acontece junto

### Perfil de Carga

Todos os 4 workloads rodam com o mesmo timing:

| Fase | Duração | VUs (total) |
|------|---------|-------------|
| Ramp-up | 10s | 0 -> 80 |
| Sustentado | 2min | 80 |
| Ramp-down | 10s | 80 -> 0 |

**Duração total**: 2 minutos e 20 segundos

### Thresholds

- **p95 < 200ms** — Intencionalmente apertado para que single falhe
- **Error rate < 5%** — Permite margem para degradação
- **Check rate > 95%**

### Think Time

**Zero sleep** entre requests (exceto registro -> login no onboarding). Isso mantém pressão constante e não dá tempo do container se recuperar entre iterações.

### Por que Single Quebra

Com 0.5 vCPU e 256MB, um único container não consegue:
- Fazer hash bcrypt (CPU) enquanto serializa payloads grandes (memória)
- Manter 80 conexões ativas no pool PostgreSQL
- Processar writes e reads pesados simultaneamente

O resultado esperado: p95 dispara acima de 200ms, latência degrada progressivamente.

### Por que Balanced Sobrevive

Com N réplicas, o Nginx distribui a carga entre as instâncias. Cada container recebe uma fração dos VUs. O ganho não é linear (o banco ainda é compartilhado), mas com réplicas suficientes os thresholds são atingidos.

```bash
# Testar com diferentes números de réplicas
npm run test:load:peak:balanced                  # 2 réplicas (default)
npm run test:load:peak:balanced -- --replicas=3  # 3 réplicas
npm run test:load:peak:balanced -- --replicas=4  # 4 réplicas
```

---

## Comparando Single vs Balanced

Cada cenário pode ser executado em duas topologias:

| Aspecto | Single | Balanced |
|---------|--------|----------|
| Containers API | 1 | N (default: 2, configurável via `--replicas`) |
| Nginx | Reverse proxy | Load balancer (round-robin, config gerada dinamicamente) |
| Recursos totais | 1.5 vCPU, 768MB | (0.5N + 1) vCPU, (256N + 512) MB |
| Objetivo | Baseline de performance | Validar escalabilidade horizontal |

```bash
# Comparar topologias
npm run test:load:browsing                        # single
npm run test:load:browsing:balanced               # balanced (2 réplicas)
npm run test:load:browsing:balanced -- --replicas=4  # balanced (4 réplicas)
```

Comparar os resultados entre single e balanced permite avaliar se a aplicação escala horizontalmente e quanto de ganho cada réplica adicional oferece.

---

## Dados de Teste

O seed cria os seguintes dados antes da execução:

| Entidade | Quantidade | Detalhes |
|----------|------------|----------|
| Farm | 1 | `seed-farm-01` |
| Farmer | 1 | `demo@cresc.campo` / `password123` |
| Cultures | 10 | `Culture 1` a `Culture 10` |
| Harvests | 20 | `Harvest 1` a `Harvest 20` (intervalos de 7 dias) |
| Transaction Categories | 10 | `Category 1` a `Category 10` |
| Transactions | 50 | Alternando EXPENSE/REVENUE (intervalos de 3 dias) |

O cenário **onboarding** e **peak-traffic** criam dados adicionais (novos farmers) durante a execução.

---

## Interpretando Resultados

### Métricas Importantes

- **http_req_duration p(95)**: Tempo que 95% das requests levam. Principal métrica de performance.
- **http_req_failed**: Percentual de requests com status >= 400. Indica erros funcionais.
- **http_reqs**: Total de requests e requests/segundo. Indica throughput.
- **iterations**: Quantas vezes o fluxo completo foi executado.

### Sinais de Problema

| Sintoma | Causa Provável |
|---------|----------------|
| p95 alto, error rate baixo | API lenta mas funcional — gargalo no banco ou CPU |
| p95 baixo, error rate alto | Requests falhando rápido — auth, validação ou rate limit |
| p95 crescente durante o teste | Degradação sob carga — memory leak ou pool exhaustion |
| Balanced não melhora vs single | Gargalo no banco, não na API |
