# Nabbi / be-u — Setup & Use Guide

Three commands:

| Script | Machine | Purpose |
|--------|---------|---------|
| [`./dev.sh`](../dev.sh) | Dev (shared Spotynet EC2) | Local Compose build + hot reload → `:3020` |
| [`./build.sh`](../build.sh) | Builder / dev | Build prod images → push ECR `apps/nabbi/*` |
| [`./deploy.sh`](../deploy.sh) | Prod only | Pull ECR → up → migrate → `:80` |

```text
dev:     edit → ./dev.sh
release: ./build.sh          → ECR
prod:    ./deploy.sh         → pull + run
```

No GitHub Actions in the image path. Git is only for source.

## Dev machine (new box)

1. Install Docker (+ Compose); user in `docker` group  
2. `git clone` / `git pull`  
3. `cp backend/.env.example backend/.env` and fill secrets  
4. Host nginx → `127.0.0.1:3020` (`sudo ./deploy/bootstrap-shared.sh` or `apply-nginx.sh`)  
5. `./dev.sh`  

No ECR / `deploy.env` required for pure dev.

## Build + push (builder / often same as shared EC2)

AWS: ECR repos + push IAM — see [aws-ecr.md](aws-ecr.md).

```bash
cp deploy.env.example deploy.env   # once; set AWS_ACCOUNT_ID
# AWS CLI + instance role with ECR push

git checkout master   # required for push (default branch from origin/HEAD)
./build.sh
# tags: git SHA + :master (default branch name)
# PUSH=0 ./build.sh                # local tags only; any branch OK
# ALLOW_NON_DEFAULT_BRANCH=1 ./build.sh   # emergency only
```

## Prod machine

```bash
git clone … && cd be-u
cp backend/.env.example backend/.env   # prod secrets, DEBUG=False
cp deploy.env.example deploy.env       # AWS_ACCOUNT_ID=
# instance role: ECR pull; AWS CLI installed

NABBI_IMAGE_TAG=<sha_from_build> ./deploy.sh
# or after :master was pushed:
./deploy.sh

./deploy.sh down
```

Do **not** run `./deploy.sh` on the shared Spotynet EC2 (binds `:80`).

## Image names

```text
${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/apps/nabbi/api:<tag>
.../apps/nabbi/web:<tag>
.../apps/nabbi/mobile:<tag>
```

## Verify

```bash
# Image URL shape
NABBI_IMAGE_REGISTRY=111.dkr.ecr.us-east-1.amazonaws.com/apps/nabbi \
NABBI_IMAGE_TAG=deadbeef \
  docker compose -f compose.yaml -f compose.prod.yaml config | grep image:

# Dev
curl -sI -H 'Host: nabbi-dev.spotynet.com' http://127.0.0.1:3020/ | head -3
```

## Deprecated

- `.github/workflows/publish-and-deploy.yml` — removed; use `./build.sh`  
- `scripts/deploy.sh` (PM2) — deprecated  
