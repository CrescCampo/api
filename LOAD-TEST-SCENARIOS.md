# Cenarios de Teste de Carga - CrescCampo API

Este documento descreve cada cenario de teste de carga, seu objetivo, o que e testado e como interpretar os resultados.

---

## 1. Onboarding

**Arquivo**: `test/load/scenarios/onboarding.ts`
**Comando**: `npm run test:load:onboarding`

### Objetivo

Simular multiplos usuarios novos se registrando e fazendo login simultaneamente. Testa a capacidade da API de criar contas em massa e autenticar usuarios sob carga.

### Fluxo por VU (usuario virtual)

1. `POST /auth/register` — Cria conta com email unico (gerado por VU + iteracao + timestamp)
2. `POST /auth/login` — Faz login com as credenciais recem-criadas

### O que esta sendo testado

- Criacao de farmers no banco (INSERT com hash bcrypt de senha)
- Criacao automatica de farm associada ao farmer
- Geracao de JWT token
- Unicidade de emails sob concorrencia
- Performance do bcrypt sob carga (operacao CPU-intensiva)

### Perfil de Carga

| Fase | Duracao | VUs |
|------|---------|-----|
| Ramp-up | 20s | 0 -> 10 |
| Sustentado | 1min | 10 |
| Ramp-down | 10s | 10 -> 0 |

### Thresholds

- **p95 < 800ms** — Mais tolerante pois bcrypt e lento por design
- **Error rate < 5%** — Permite margem para conflitos de email (improvavel mas possivel)

### Checks

- `register - status 201` — Registro bem-sucedido
- `register - has userId` — Retorna ID do usuario criado
- `login - status 201` — Login bem-sucedido
- `login - has token` — Retorna JWT token

---

## 2. Daily Browsing (Navegacao Diaria)

**Arquivo**: `test/load/scenarios/daily-browsing.ts`
**Comando**: `npm run test:load:browsing`

### Objetivo

Simular o uso tipico de um farmer logado navegando pela aplicacao: listando safras, visualizando transacoes de uma safra especifica, e consultando transacoes gerais. Representa o fluxo de leitura mais comum do dia a dia.

### Fluxo por VU

1. `GET /harvests?page=1&pageSize=10` — Lista primeira pagina de safras
2. `GET /harvests/:id/transactions?page=1&pageSize=10` — Transacoes da primeira safra retornada
3. `GET /harvests?page=2&pageSize=10` — Navega para segunda pagina
4. `GET /transactions?page=1&pageSize=10` — Lista todas as transacoes

### O que esta sendo testado

- Queries paginadas com JOINs (safra -> cultura, transacao -> categoria)
- Filtragem por farmId via JWT token
- Performance de leitura sob concorrencia
- Tempo de resposta para listagens com dados relacionados

### Perfil de Carga

| Fase | Duracao | VUs |
|------|---------|-----|
| Ramp-up | 20s | 0 -> 10 |
| Sustentado | 1min | 10 |
| Ramp-down | 10s | 10 -> 0 |

### Thresholds

- **p95 < 500ms** — Listagens devem ser rapidas
- **Error rate < 1%** — Leitura nao deve falhar

### Checks

- `list harvests - status 200` / `has data`
- `harvest transactions - status 200` / `has data`
- `harvests page 2 - status 200`
- `list transactions - status 200` / `has data`

---

## 3. Financial Management (Gestao Financeira)

**Arquivo**: `test/load/scenarios/financial-management.ts`
**Comando**: `npm run test:load:financial`

### Objetivo

Simular farmers editando transacoes financeiras. Testa operacoes de escrita concorrente no banco, validacoes de negocio e integridade dos dados sob mutacoes simultaneas.

### Fluxo por VU

1. **Setup** (1x): Busca todas as transacoes existentes para obter IDs
2. `PATCH /transactions/:id` — Edita descricao e valor de uma transacao aleatoria
3. `GET /transactions?page=1&pageSize=10` — Lista transacoes para verificar consistencia

### O que esta sendo testado

- UPDATE concorrente em transacoes (mesma tabela, registros diferentes)
- Validacao de ownership (transacao pertence ao farmer autenticado)
- Recalculo de totais da safra apos edicao (receitas/despesas)
- Integridade referencial (categoryId valido)

### Perfil de Carga

| Fase | Duracao | VUs |
|------|---------|-----|
| Ramp-up | 20s | 0 -> 5 |
| Sustentado | 1min | 5 |
| Ramp-down | 10s | 5 -> 0 |

### Thresholds

- **p95 < 600ms** — Escrita com validacao e um pouco mais lenta
- **Error rate < 5%** — Permite margem para conflitos de concorrencia

### Checks

- `edit transaction - status 200`
- `list after edit - status 200`

### Nota

Usa apenas 5 VUs (metade dos outros cenarios) porque operacoes de escrita concorrente na mesma tabela geram mais pressao no banco.

---

## 4. Mobile Sync (Sincronizacao Mobile)

**Arquivo**: `test/load/scenarios/mobile-sync.ts`
**Comando**: `npm run test:load:sync`

### Objetivo

Simular o app mobile abrindo e sincronizando todos os dados do farmer de uma vez. O endpoint `/app/pull` retorna culturas, safras, transacoes e categorias em uma unica request. E o endpoint mais pesado da API.

### Fluxo por VU

1. `GET /app/pull` — Pull completo (simula app abrindo)
2. Espera 2s (simula usuario lendo dados no app)
3. `GET /app/pull` — Segundo pull (simula refresh em background)

### O que esta sendo testado

- Carga em endpoint que retorna grande volume de dados
- Multiplas queries em sequencia (culturas + safras + transacoes + categorias)
- Serializacao de payloads grandes
- Uso de memoria e CPU para montar a resposta completa
- Pressao no connection pool do PostgreSQL

### Perfil de Carga

| Fase | Duracao | VUs |
|------|---------|-----|
| Ramp-up | 15s | 0 -> 10 |
| Sustentado | 1min | 10 |
| Ramp-down | 10s | 10 -> 0 |

### Thresholds

- **p95 < 1000ms** — Mais tolerante pois retorna todos os dados de uma vez
- **Error rate < 1%** — Leitura nao deve falhar

### Checks

- `pull - status 200`
- `pull - has cultures` / `has harvests` / `has transactions` / `has categories`
- `refresh pull - status 200`

---

## 5. Feedback Burst (Feedback em Massa)

**Arquivo**: `test/load/scenarios/feedback-burst.ts`
**Comando**: `npm run test:load:feedback`

### Objetivo

Simular um pico de feedbacks sendo enviados simultaneamente. Testa a capacidade da API de processar alto volume de escritas simples (INSERTs) de forma rapida.

### Fluxo por VU

1. `POST /feedbacks` — Envia feedback com rating (0-5), descricao e categoria aleatorios

### O que esta sendo testado

- INSERT massivo em tabela de feedbacks
- Validacao de enums (category) e ranges (rating 0-5)
- Throughput maximo de escritas simples
- Comportamento do connection pool sob alta concorrencia de INSERTs

### Categorias usadas

- `product_quality`, `delivery`, `service`, `price`, `other`

### Perfil de Carga

| Fase | Duracao | VUs |
|------|---------|-----|
| Ramp-up | 15s | 0 -> 15 |
| Sustentado | 1min | 15 |
| Ramp-down | 10s | 15 -> 0 |

### Thresholds

- **p95 < 500ms** — INSERT simples deve ser rapido
- **Error rate < 1%** — Nao deve haver falhas

### Checks

- `send feedback - status 201`
- `send feedback - has feedbackId`

### Nota

Usa 15 VUs (o maior entre os cenarios regulares) para testar o limite de throughput em operacoes de escrita simples.

---

## 6. Peak Traffic (Horario de Pico — Stress Test)

**Arquivo**: `test/load/scenarios/peak-traffic.ts`
**Comando**: `npm run test:load:peak`

### Objetivo

Simular o pior cenario realista: todos os tipos de usuario ativos ao mesmo tempo. Projetado para saturar um unico container da API (0.5 vCPU, 256MB) e demonstrar o ganho de escalabilidade horizontal com a topologia balanced.

### Arquitetura do Cenario

Diferente dos outros cenarios que usam `stages`, este usa **k6 scenarios** para rodar 4 workloads em paralelo:

| Workload | Funcao | VUs | O que estressa |
|----------|--------|-----|----------------|
| `new_users` | `onboarding()` | 15 | CPU (bcrypt hash + compare) |
| `sync_users` | `mobileSync()` | 25 | Memoria + IO (triple pull, payload grande) |
| `browsers` | `browsing()` | 30 | Connection pool (leituras paginadas + feedback write) |
| `editors` | `editing()` | 10 | Locks de escrita (UPDATE concorrente) |

**Total: 80 VUs simultaneos** (vs maximo de 15 nos outros cenarios)

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
2. `GET /harvests/:id/transactions` — Transacoes de safra aleatoria
3. `GET /transactions?page=1&pageSize=10` — Lista transacoes
4. `POST /feedbacks` — Envia feedback (adiciona pressao de escrita)

**editors (10 VUs)**:
1. `PATCH /transactions/:id` — Edita transacao aleatoria
2. `GET /transactions?page=1&pageSize=10` — Lista para verificar

### O que esta sendo testado

- **Saturacao de CPU**: bcrypt de 15 VUs competindo com serialization de payloads grandes
- **Pressao de memoria**: 25 VUs fazendo triple /app/pull simultaneo
- **Exaustao do connection pool**: 80 VUs todos precisando de conexoes PostgreSQL
- **Contencao de escrita**: edits e feedbacks concorrentes com leituras pesadas
- **Degradacao sob carga combinada**: como a API se comporta quando tudo acontece junto

### Perfil de Carga

Todos os 4 workloads rodam com o mesmo timing:

| Fase | Duracao | VUs (total) |
|------|---------|-------------|
| Ramp-up | 10s | 0 -> 80 |
| Sustentado | 2min | 80 |
| Ramp-down | 10s | 80 -> 0 |

**Duracao total**: 2 minutos e 20 segundos

### Thresholds

- **p95 < 200ms** — Intencionalmente apertado para que single falhe
- **Error rate < 5%** — Permite margem para degradacao
- **Check rate > 95%**

### Think Time

**Zero sleep** entre requests (exceto registro -> login no onboarding). Isso mantem pressao constante e nao da tempo do container se recuperar entre iteracoes.

### Por que Single Quebra

Com 0.5 vCPU e 256MB, um unico container nao consegue:
- Fazer hash bcrypt (CPU) enquanto serializa payloads grandes (memoria)
- Manter 80 conexoes ativas no pool PostgreSQL
- Processar writes e reads pesados simultaneamente

O resultado esperado: p95 dispara acima de 200ms, latencia degrada progressivamente.

### Por que Balanced Sobrevive

Com N replicas, o Nginx distribui a carga entre as instancias. Cada container recebe uma fracao dos VUs. O ganho nao e linear (o banco ainda e compartilhado), mas com replicas suficientes os thresholds sao atingidos.

```bash
# Testar com diferentes numeros de replicas
npm run test:load:peak:balanced                  # 2 replicas (default)
npm run test:load:peak:balanced -- --replicas=3  # 3 replicas
npm run test:load:peak:balanced -- --replicas=4  # 4 replicas
```

---

## Comparando Single vs Balanced

Cada cenario pode ser executado em duas topologias:

| Aspecto | Single | Balanced |
|---------|--------|----------|
| Containers API | 1 | N (default: 2, configuravel via `--replicas`) |
| Nginx | Reverse proxy | Load balancer (round-robin, config gerada dinamicamente) |
| Recursos totais | 1.5 vCPU, 768MB | (0.5N + 1) vCPU, (256N + 512) MB |
| Objetivo | Baseline de performance | Validar escalabilidade horizontal |

```bash
# Comparar topologias
npm run test:load:browsing                        # single
npm run test:load:browsing:balanced               # balanced (2 replicas)
npm run test:load:browsing:balanced -- --replicas=4  # balanced (4 replicas)
```

Comparar os resultados entre single e balanced permite avaliar se a aplicacao escala horizontalmente e quanto de ganho cada replica adicional oferece.

---

## Dados de Teste

O seed cria os seguintes dados antes da execucao:

| Entidade | Quantidade | Detalhes |
|----------|------------|----------|
| Farm | 1 | `seed-farm-01` |
| Farmer | 1 | `demo@cresc.campo` / `password123` |
| Cultures | 10 | `Culture 1` a `Culture 10` |
| Harvests | 20 | `Harvest 1` a `Harvest 20` (intervalos de 7 dias) |
| Transaction Categories | 10 | `Category 1` a `Category 10` |
| Transactions | 50 | Alternando EXPENSE/REVENUE (intervalos de 3 dias) |

O cenario **onboarding** e **peak-traffic** criam dados adicionais (novos farmers) durante a execucao.

---

## Interpretando Resultados

### Metricas Importantes

- **http_req_duration p(95)**: Tempo que 95% das requests levam. Principal metrica de performance.
- **http_req_failed**: Percentual de requests com status >= 400. Indica erros funcionais.
- **http_reqs**: Total de requests e requests/segundo. Indica throughput.
- **iterations**: Quantas vezes o fluxo completo foi executado.

### Sinais de Problema

| Sintoma | Causa Provavel |
|---------|----------------|
| p95 alto, error rate baixo | API lenta mas funcional — gargalo no banco ou CPU |
| p95 baixo, error rate alto | Requests falhando rapido — auth, validacao ou rate limit |
| p95 crescente durante o teste | Degradacao sob carga — memory leak ou pool exhaustion |
| Balanced nao melhora vs single | Gargalo no banco, nao na API |
