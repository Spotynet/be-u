# Nabbi / be-u — Setup & Use Guide

Docker Compose + per-project nginx (Jay pattern). Company playbook: [`../setup.md`](../setup.md).

## Architecture

**Shared EC2 (dev)**

```text
Browser → host nginx :443 (TLS + IP allowlist)
  → 127.0.0.1:3020
       ├─ nabbi-dev.spotynet.com        → web:3008
       ├─ nabbi-mobile-dev.spotynet.com → mobile:3009
       └─ nabbi-api-dev.spotynet.com    → api:3007
            (Next rewrites use BACKEND_ORIGIN=http://api:3007)
```

**Dedicated prod:** `./deploy.sh` → project nginx on `:80`.

## Commands

| Action | Command |
|--------|---------|
| First-time shared EC2 | `sudo ./deploy/bootstrap-shared.sh` |
| Dev start / refresh | `./dev.sh` |
| Host nginx → 3020 only | `sudo ./deploy/apply-nginx.sh` |
| Prod (dedicated) | `./deploy.sh` |
| Stop prod | `./deploy.sh down` |

## Domains

Defined in scripts (not `.env`):

- Dev: `nabbi-dev` / `nabbi-api-dev` / `nabbi-mobile-dev` `.spotynet.com`
- Prod defaults in `deploy.sh`: `be-u.ai` / `api.be-u.ai` / `app.be-u.ai`

## Secrets

`backend/.env` (gitignored). See `.env.example` and `backend/.env.example`.
