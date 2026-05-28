# CI/CD com Jenkins — CrescCampo API

## Visão Geral

Este documento descreve a configuração de CI/CD do projeto CrescCampo API utilizando Jenkins em container, Docker Compose e pipeline automatizado via Jenkinsfile.

## Estrutura dos arquivos

```
├── Dockerfile              # Imagem de produção da API (multi-stage)
├── Dockerfile.jenkins      # Imagem customizada do Jenkins com Node.js e Docker CLI
├── docker-compose.yml      # Orquestração dos containers
├── Jenkinsfile             # Pipeline CI/CD
└── scripts/
    └── notify.sh           # Script de notificação via e-mail
```

---

## Pré-requisitos

- Docker instalado e rodando
- Docker Compose instalado
- Git

---

## Como rodar

### 1. Subir os containers

```bash
docker compose up -d --build
```

O `--build` é necessário na primeira vez para construir a imagem customizada do Jenkins.

### 2. Acessar o Jenkins

Após subir os containers, acesse:

```
http://localhost:8080
```

Na primeira execução o Jenkins vai pedir uma senha de administrador. Para obtê-la, rode:

```bash
docker exec cresccampo-jenkins cat /var/jenkins_home/secrets/initialAdminPassword
```

### 3. Configurar o Jenkins

1. Cole a senha obtida no passo anterior
2. Selecione **"Install suggested plugins"**
3. Crie o usuário administrador
4. Acesse a interface do Jenkins

### 4. Configurar as Credenciais

> ⚠️ As credenciais ficam salvas no volume local do Jenkins (`jenkins_data`). Cada membro do grupo precisa configurar as credenciais na própria máquina!

#### Credencial do GitHub

Necessária para o Jenkins acessar o repositório privado.

1. Vá em **Manage Jenkins → Credentials → System → Global → Add Credentials**
2. Preencha:
   - **Kind** → `Username with password`
   - **Username** → seu usuário do GitHub
   - **Password** → token gerado em **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)** com permissão `repo`
   - **ID** → `github-credentials`
   - **Description** → `GitHub CrescCampo`
3. Clique em **Create**

#### Credencial do Docker Hub

Necessária para o Jenkins publicar a imagem no Docker Hub.

1. Vá em **Manage Jenkins → Credentials → System → Global → Add Credentials**
2. Preencha:
   - **Kind** → `Username with password`
   - **Username** → `kauamoreirabatista`
   - **Password** → token do Docker Hub
   - **ID** → `dockerhub-credentials`
   - **Description** → `Docker Hub CrescCampo`
3. Clique em **Create**

#### Variáveis de ambiente para notificação por e-mail

Necessárias para o Jenkins enviar notificações sem hardcode.

1. Vá em **Manage Jenkins → System**
2. Na seção **Global properties** marque **Environment variables**
3. Adicione:
   - **Name** → `EMAIL_REMETENTE` / **Value** → e-mail remetente (ex: `cresccampo@gmail.com`)
   - **Name** → `EMAIL_DESTINATARIO` / **Value** → e-mail destinatário
   - **Name** → `EMAIL_APP_PASSWORD` / **Value** → senha de app gerada no Google (16 caracteres)
4. Clique em **Save**

> **Como gerar a Senha de App do Google:**
> 1. Acesse `myaccount.google.com`
> 2. Segurança → Verificação em duas etapas (ative se necessário)
> 3. Acesse `myaccount.google.com/apppasswords`
> 4. Crie uma senha para "Jenkins" e copie os 16 caracteres gerados

---

### 5. Criar a Pipeline

1. Clique em **"New Item"**
2. Digite o nome `cresccampo-pipeline`
3. Selecione **"Multibranch Pipeline"**
4. Clique em **OK**
5. Em **Branch Sources** clique em **"Add source"** → **Git**
6. Cole a URL do repositório: `https://github.com/CrescCampo/api.git`
7. Selecione a credencial `github-credentials`
8. Em **Build Configuration** selecione `by Jenkinsfile`
9. Clique em **Save**

O Jenkins vai escanear o repositório automaticamente e detectar o `Jenkinsfile`!

---

## Containers

| Container | Imagem | Porta | Descrição |
|---|---|---|---|
| `cresccampo-api` | `kauamoreirabatista/cresccampo-api:latest` | `3000` | API REST puxada do Docker Hub |
| `cresccampo-postgres` | `postgres:16.11-alpine3.23` | `5432` | Banco de dados PostgreSQL |
| `cresccampo-jenkins` | `Dockerfile.jenkins` (local) | `8080`, `50000` | Jenkins CI/CD |
| `jaeger` | `jaegertracing/jaeger:latest` | `16686`, `4317`, `4318` | Rastreamento distribuído |

---

## Pipeline (Jenkinsfile)

O pipeline possui 4 etapas:

| Etapa | Status | Descrição |
|---|---|---|
| **Testes** | ✅ Ativo | Instala dependências e roda os testes E2E com Vitest |
| **Build** | ✅ Ativo | Compila o TypeScript e arquiva o `dist/` como artefato |
| **Docker Build e Push** | ✅ Ativo | Builda a imagem e publica no Docker Hub |
| **Notificação por e-mail** | ✅ Ativo | Envia e-mail com o resultado do pipeline via `scripts/notify.sh` |

### Variáveis de ambiente

| Variável | Onde configurar | Descrição |
|---|---|---|
| `DOCKER_IMAGE` | Jenkinsfile | Nome da imagem no Docker Hub (`kauamoreirabatista/cresccampo-api`) |
| `DOCKER_TAG` | Jenkinsfile | Tag da imagem (número do build) |
| `EMAIL_REMETENTE` | Jenkins → System → Environment variables | E-mail remetente |
| `EMAIL_DESTINATARIO` | Jenkins → System → Environment variables | E-mail destinatário |
| `EMAIL_APP_PASSWORD` | Jenkins → System → Environment variables | Senha de app do Gmail |
| `DOCKER_USER` | Credencial `dockerhub-credentials` | Usuário do Docker Hub |
| `DOCKER_PASS` | Credencial `dockerhub-credentials` | Token do Docker Hub |

> ⚠️ Nenhuma informação sensível está hardcoded — tudo é configurado via variáveis de ambiente e credenciais do Jenkins.

---

## Dockerfile.jenkins

A imagem customizada do Jenkins instala:

- **Node.js 20** — para rodar os testes e o build da API
- **Docker CLI** — para criar containers via TestContainers durante os testes e publicar a imagem no Docker Hub

O container Jenkins roda como `root` e tem acesso ao Docker Engine do host via `/var/run/docker.sock`, permitindo que os testes E2E criem containers temporários de PostgreSQL automaticamente via TestContainers.

> **Nota:** O Jenkins roda como `root` porque no Docker Desktop (Windows) o `docker.sock` pertence ao grupo root (GID 0). Em produção num servidor Linux, o GID pode ser ajustado dinamicamente para evitar o uso de root.

---

## Uso de IA

Esta configuração de CI/CD foi desenvolvida com apoio do **Claude (Anthropic)** como ferramenta de aprendizado e orientação. A IA foi utilizada para:

- Explicar conceitos de Docker, Docker Compose e Jenkins
- Orientar a criação do `Dockerfile.jenkins`
- Auxiliar na escrita do `Jenkinsfile`
- Explicar o funcionamento do `docker.sock` e grupos de permissão no Linux
- Orientar a configuração de credenciais no Jenkins
- Diagnosticar e resolver o problema de acesso do TestContainers ao Docker Engine
- Auxiliar na escrita do `scripts/notify.sh` para envio de e-mail via Gmail SMTP

Todo o conteúdo foi compreendido, revisado e validado pela integrante responsável por essa etapa.

---

# Status do Projeto S07 — NP2
## CrescCampo API — DevOps na prática

---

## 3.1 Dockerfile e Pipeline Jenkins

| Requisito | Status | Observação |
|---|---|---|
| Pipeline com execução dos testes | ✅ Feito | Stage `Testes` — rodando e passando |
| Pipeline com build/empacotamento | ✅ Feito | Stage `Build` — `dist/` arquivado |
| Pipeline com notificação por e-mail | ✅ Feito | `scripts/notify.sh` via Gmail SMTP |
| Pacote armazenado como artefato | ✅ Feito | `dist/**` arquivado com fingerprint |
| Relatório de testes como artefato | ✅ Feito | `test-results/e2e/Junit.xml` arquivado |
| Script separado para notificação | ✅ Feito | `scripts/notify.sh` |
| E-mail não hardcoded | ✅ Feito | Variáveis `EMAIL_REMETENTE`, `EMAIL_DESTINATARIO`, `EMAIL_APP_PASSWORD` |
| Software instalado via Dockerfile | ✅ Feito | Node.js 20 e Docker CLI no `Dockerfile.jenkins` |
| Pipeline apenas via Jenkinsfile | ✅ Feito | Nenhuma etapa criada pela interface gráfica |
| Jenkins em modo container | ✅ Feito | `jenkins/jenkins:lts` no Docker Compose |

---

## 3.2 Docker Hub

| Requisito | Status | Observação |
|---|---|---|
| Criar imagem a partir do Dockerfile | ✅ Feito | Stage `Docker Build e Push` no Jenkinsfile |
| Publicar imagem no Docker Hub | ✅ Feito | `kauamoreirabatista/cresccampo-api` |
| Entregar link da imagem | ✅ Feito | `https://hub.docker.com/r/kauamoreirabatista/cresccampo-api` |

---

## 3.3 Docker Compose com 4+ Containers

| Requisito | Status | Observação |
|---|---|---|
| Mínimo 4 containers | ✅ Feito | api + postgres + jenkins + jaeger |
| Comunicação entre 2+ containers | ✅ Feito | API se comunica com postgres e jaeger |
| Um container via Dockerfile local | ✅ Feito | Jenkins usa `Dockerfile.jenkins` |
| Um container puxado do Docker Hub | ✅ Feito | API puxada de `kauamoreirabatista/cresccampo-api` |
| Volumes para persistência | ✅ Feito | PostgreSQL (`./db`) + Jenkins (`jenkins_data`) |

---
