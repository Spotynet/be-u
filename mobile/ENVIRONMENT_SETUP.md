# Environment Variables Setup

## API base URL

The app reads `EXPO_PUBLIC_API_URL` via `lib/apiConfig.ts` (path must include `/api`).

### Local (`.env`)

```bash
# Dev API (default fallback in code)
EXPO_PUBLIC_API_URL=https://nabbi-api-dev.spotynet.com/api

# Or local Django
# EXPO_PUBLIC_API_URL=http://127.0.0.1:3007/api
```

### EAS profiles (`eas.json`)

| Profile | `EXPO_PUBLIC_API_URL` |
|---------|------------------------|
| development | `http://127.0.0.1:3007/api` |
| preview | `https://nabbi-api-dev.spotynet.com/api` |
| production | `https://api.nabbi.app/api` |

### Notes

- `EXPO_PUBLIC_*` vars are baked into the client at build time.
- Restart Expo after changing local `.env`.
- Do not commit secrets; API URL is public by design.
- Legal/contact URLs live in `constants/legal.ts` (`https://nabbi.app/...`).
