# Nabbi (be-u) — Docker, environments, and agent playbook

**Product:** Nabbi  
**Repo path:** `/home/spotynet/projects/apps/be-u`  
**GitHub:** `Spotynet/be-u`  
**Audience:** AI agents and humans making changes, reviews, or deploys.

Spotynet-wide pattern (for Jay and other apps):  
[`/home/spotynet/projects/apps/docker-ecr-playbook.md`](../docker-ecr-playbook.md)

---

## Architecture (read this first)

```text
DEV (shared Spotynet EC2)
  Browser → host nginx :443
              → 127.0.0.1:3020   ← Nabbi gateway ONLY
                   project nginx (Compose)
                     ├─ nabbi-dev.spotynet.com        → web:3008
                     ├─ nabbi-mobile-dev.spotynet.com → mobile:3009
                     └─ nabbi-api-dev.spotynet.com    → api:3007

PROD (dedicated EC2)
  Browser → project nginx :80
              → web / mobile / api (same service names)
  App code runs from ECR images (not bind mounts)
```

| Rule | Nabbi detail |
|------|----------------|
| One Compose stack | `compose.yaml` + `compose.prod.yaml` |
| Services | `api`, `web`, `mobile`, `nginx` — **one process per container** |
| App ports | `expose` only; nginx publishes the host port |
| Shared EC2 gateway | `127.0.0.1:3020` — never bind Nabbi nginx to host `:80` here |
| Secrets | `backend/.env` (gitignored) — Django/DB/S3/OAuth |
| Registry config | `deploy.env` (gitignored) — `AWS_ACCOUNT_ID`, region, image tag |
| Images | ECR `apps/nabbi/{api,web,mobile}` |
| No GitHub Actions for images | `./build.sh` pushes to ECR |

---

## Three commands

| Script | Machine | What it does |
|--------|---------|----------------|
| [`./dev.sh`](dev.sh) | Dev / shared EC2 | `compose.yaml` **build** + bind mounts + hot reload |
| [`./build.sh`](build.sh) | Builder (often shared EC2) | Build **prod** images → push ECR |
| [`./deploy.sh`](deploy.sh) | **Prod only** | Pull ECR → `up` → migrate |

```text
edit code  →  ./dev.sh
release    →  git checkout <default-branch> && ./build.sh
prod       →  ./deploy.sh
```

### Branch guard

`./build.sh` **refuses ECR push** unless the current git branch equals the repo default branch (`origin/HEAD`, currently `master`).  
Local-only: `PUSH=0 ./build.sh`. Emergency: `ALLOW_NON_DEFAULT_BRANCH=1`.

---

## Containers and Dockerfiles

| Service | Dev (`compose.yaml`) | Prod (`compose.prod.yaml`) | Dockerfile |
|---------|----------------------|----------------------------|------------|
| `api` | `runserver`, mount `./backend` | gunicorn, image from ECR, non-root | [`docker/api/Dockerfile`](docker/api/Dockerfile) |
| `web` | `next dev --turbopack`, mount `./web` | Next standalone `node server.js` | [`docker/web/Dockerfile`](docker/web/Dockerfile) (`development` / `production`) |
| `mobile` | `expo start --web`, mount `./mobile` | `expo export` → nginx static | [`docker/mobile/Dockerfile`](docker/mobile/Dockerfile) |
| `nginx` | `127.0.0.1:3020:80` | `:80` | Official `nginx:1.27-alpine` + [`nginx/default.conf.template`](nginx/default.conf.template) |

Helpers:

- [`deploy/lib-ecr.sh`](deploy/lib-ecr.sh) — registry resolution + ECR login  
- [`deploy/aws-ecr.md`](deploy/aws-ecr.md) — IAM/ECR AWS setup  
- [`deploy/README.md`](deploy/README.md) — short ops checklist  

Inter-service API URL inside Compose: `BACKEND_ORIGIN=http://api:3007` (not `127.0.0.1`).

---

## Environment files

| File | Gitignored? | Purpose |
|------|-------------|---------|
| `backend/.env` | Yes | App secrets: `SECRET_KEY`, `DEBUG`, `DB_*`, S3, Google, email |
| `backend/.env.example` | No | Template for `backend/.env` |
| `deploy.env` | Yes | `AWS_REGION`, `AWS_ACCOUNT_ID`, `NABBI_IMAGE_TAG` — **no AWS access keys** |
| `deploy.env.example` | No | Template for `deploy.env` |
| Domains in `dev.sh` / `deploy.sh` | Committed | Hostnames for nginx |

**Do not** put ECR credentials in `backend/.env`. Auth is EC2 instance role + `aws ecr get-login-password`.

Current builder account (Spotynet shared): see `deploy.env` on host or `AWS_ACCOUNT_ID` in example docs (`484907486766`).

Image URL shape:

```text
${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/apps/nabbi/api:<sha|master>
.../apps/nabbi/web:<tag>
.../apps/nabbi/mobile:<tag>
```

---

## Setup recipes

### New / existing **dev** machine

```bash
# Docker + compose; user in docker group
git clone https://github.com/Spotynet/be-u.git && cd be-u
cp backend/.env.example backend/.env   # fill secrets
sudo ./deploy/bootstrap-shared.sh      # or ./dev.sh && sudo ./deploy/apply-nginx.sh
./dev.sh
```

Gateway checks:

```bash
curl -sI -H 'Host: nabbi-dev.spotynet.com' http://127.0.0.1:3020/ | head -3
curl -sI -H 'Host: nabbi-api-dev.spotynet.com' http://127.0.0.1:3020/ | head -3
curl -sI -H 'Host: nabbi-mobile-dev.spotynet.com' http://127.0.0.1:3020/ | head -3
```

### **Build** (push images)

Needs: AWS CLI, instance role with ECR **push** on `apps/nabbi/*`, `deploy.env`.

```bash
cp deploy.env.example deploy.env   # AWS_ACCOUNT_ID=...
git checkout master && git pull
./build.sh
```

### **Prod**

Needs: AWS CLI, instance role with ECR **pull**, `backend/.env`, `deploy.env`.  
**Never** run `./deploy.sh` on the shared Spotynet multi-app EC2 (binds `:80`).

```bash
NABBI_IMAGE_TAG=<sha> ./deploy.sh
# or ./deploy.sh  # pulls :master by default
./deploy.sh down
```

---

## Making code changes (agent checklist)

1. Prefer editing on default branch for releases; feature branches OK for `./dev.sh` and `PUSH=0 ./build.sh`.  
2. After backend dependency changes: rebuild api image / `./dev.sh --build` path (`./dev.sh` already uses `up -d --build`).  
3. After changing Compose/nginx: recreate nginx if template changed.  
4. `BACKEND_ORIGIN` must stay `http://api:3007` in Docker; browser API URL is HTTPS public host.  
5. Prod web/mobile bake `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*` at **`./build.sh` time**.  
6. Do not reintroduce supervisor mega-containers or GHCR/Actions image pipelines unless explicitly requested.  
7. Deprecated: [`scripts/deploy.sh`](scripts/deploy.sh) (PM2/venv).

---

## Related docs

| Doc | Use |
|-----|-----|
| [`deploy/README.md`](deploy/README.md) | Day-to-day ops |
| [`deploy/aws-ecr.md`](deploy/aws-ecr.md) | IAM policies, ECR repos |
| [`../docker-ecr-playbook.md`](../docker-ecr-playbook.md) | Copy this pattern to Jay / other apps |
| [`../setup.md`](../setup.md) | Older Spotynet Compose gateway notes (Jay-era); prefer playbook for ECR |
