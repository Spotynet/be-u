# Nabbi / be-u — Setup & Use Guide

Folder: `/home/spotynet/projects/apps/be-u` (product: Nabbi).  
Pattern: same as Jay — see `/home/spotynet/projects/apps/setup.md`.

## Architecture (shared EC2)

```text
Browser → host nginx :443
  → 127.0.0.1:3020 (project nginx)
       ├─ nabbi-dev.spotynet.com        → web:3008 (Next.js)
       ├─ nabbi-mobile-dev.spotynet.com → mobile:3009 (Expo web)
       └─ nabbi-api-dev.spotynet.com    → api:3007 (Django)
```

| | Value |
|--|--------|
| Gateway | `127.0.0.1:3020` |
| Domains | Set in `dev.sh` / `deploy.sh` |
| Secrets | `backend/.env` (gitignored) |

## Once on shared EC2

```bash
cd /home/spotynet/projects/apps/be-u
# backend/.env must already exist
sudo ./deploy/bootstrap-shared.sh
# or: ./dev.sh && sudo ./deploy/apply-nginx.sh
```

## Day-to-day (dev)

```bash
./dev.sh
docker compose -f compose.yaml logs -f
docker compose -f compose.yaml down
```

## Production (dedicated machine only)

```bash
# Edit domains at top of deploy.sh, or pass args:
./deploy.sh be-u.ai api.be-u.ai app.be-u.ai
./deploy.sh down
```

Do **not** run `./deploy.sh` on the shared Spotynet EC2 (binds `:80`).

## Verify

```bash
curl -sI -H 'Host: nabbi-dev.spotynet.com' http://127.0.0.1:3020/ | head -5
curl -sI -H 'Host: nabbi-api-dev.spotynet.com' http://127.0.0.1:3020/ | head -5
curl -sI -H 'Host: nabbi-mobile-dev.spotynet.com' http://127.0.0.1:3020/ | head -5
curl -skI --resolve nabbi-dev.spotynet.com:443:127.0.0.1 https://nabbi-dev.spotynet.com/ | head -5
```
