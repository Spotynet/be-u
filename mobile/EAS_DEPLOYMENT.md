# EAS Deployment Guide

## Domains

| Environment | API (`EXPO_PUBLIC_API_URL`) | Web / legal |
|-------------|----------------------------|-------------|
| Development | `http://127.0.0.1:3007/api` | local |
| Preview | `https://nabbi-api-dev.spotynet.com/api` | Spotynet dev |
| Production (App Store) | `https://api.nabbi.app/api` | `https://nabbi.app` |

Configured in `eas.json` per build profile.

## Build commands

```bash
cd mobile

eas build --profile development --platform ios
eas build --profile preview --platform ios
eas build --profile production --platform ios
```

## Submit (App Store)

1. Fill `submit.production.ios` in `eas.json` (see `docs/APP_STORE_CONNECT.md`).
2. Ensure production API + legal pages are live.
3. Run:

```bash
eas submit --profile production --platform ios
```

## OTA updates

```bash
eas update --branch production --message "Production update"
```

`runtimeVersion.policy` is `sdkVersion` in `app.json`.

## Local development

```bash
# mobile/.env
EXPO_PUBLIC_API_URL=https://nabbi-api-dev.spotynet.com/api
```

Restart Expo after changing env vars.

## Legal URLs (in-app)

Defined in `constants/legal.ts`:

- Privacy: `https://nabbi.app/aviso-de-privacidad`
- Terms: `https://nabbi.app/terminos-y-condiciones`
- Contact: `https://nabbi.app/contacto` / `contacto@nabbi.app`
