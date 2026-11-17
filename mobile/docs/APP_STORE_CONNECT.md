# App Store Connect checklist (nabbi iOS)

Use this after production DNS + API (`api.nabbi.app`) and legal pages (`nabbi.app`) are live.

## 1. Apple accounts

- [ ] Enrolled in [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
- [ ] App Store Connect access for the same team
- [ ] Expo/EAS Apple credentials: `cd mobile && eas credentials` (Distribution cert + App Store provisioning for `com.beu.nabbi`)

## 2. Create the app record

In [App Store Connect](https://appstoreconnect.apple.com) → My Apps → **+**:

| Field | Value |
|-------|--------|
| Platforms | iOS |
| Name | nabbi (must be unique on the store) |
| Primary language | Spanish (Mexico) recommended |
| Bundle ID | `com.beu.nabbi` |
| SKU | e.g. `nabbi-ios-001` |
| User Access | Full Access |

After creation, copy:

- **Apple ID** (email used for the developer account)
- **Apple Team ID** (Membership details)
- **Apple App ID / ASC App ID** (App Information → Apple ID — numeric)

Paste them into `mobile/eas.json` → `submit.production.ios`:

```json
"ios": {
  "appleId": "you@company.com",
  "ascAppId": "1234567890",
  "appleTeamId": "ABCD123456"
}
```

## 3. Metadata (required to submit)

- [ ] Subtitle (≤30 chars)
- [ ] Description
- [ ] Keywords
- [ ] Support URL → `https://nabbi.app/contacto`
- [ ] Marketing URL (optional) → `https://nabbi.app`
- [ ] **Privacy Policy URL** → `https://nabbi.app/aviso-de-privacidad`
- [ ] Category (e.g. Lifestyle / Health & Fitness — pick one primary)
- [ ] Copyright → `© 2026 Spotynet S.A. de C.V.`

## 4. Age rating & UGC

Answer the questionnaire honestly. nabbi has:

- User-generated posts, photos, comments, reviews
- Report / block (already in app)
- No gambling; confirm other content declarations

## 5. App Privacy (Nutrition Labels)

Declare data collected by the app **and** SDKs (Expo, Maps, push, auth). Typical nabbi types:

- Contact info (email, name, phone)
- Location (when in use — nearby services / reservation tracking)
- Photos / user content
- Identifiers (account / device for push)
- Usage / diagnostics if any crash/analytics SDK is added later

Link same privacy policy URL. Update if practices change.

## 6. Review information

- [ ] **Demo account** (client + optionally provider) that stays valid during review
- [ ] Notes: Sign in with Apple / Google / email magic code; how to book; how to delete account (Settings → Privacidad y Seguridad)
- [ ] Contact phone + email for App Review
- [ ] Backend `https://api.nabbi.app` must be **live** during review

## 7. Screenshots

Required sizes depend on devices you support (`supportsTablet: true` in `app.json`):

- [ ] iPhone 6.7" (and/or 6.5")
- [ ] iPad 13" (or current required iPad size)

Show real nabbi UI (home, booking, profile/feed) — no Expo template splash/icons in shots.

## 8. Build & submit

```bash
cd mobile
eas build --profile production --platform ios
# After TestFlight smoke test:
eas submit --profile production --platform ios
```

Or attach the build to a version in App Store Connect and submit for review manually.

## 9. Pre-submit smoke test (TestFlight)

- [ ] Login: email, Google, Sign in with Apple
- [ ] Privacy + Terms open `nabbi.app` pages (200 OK)
- [ ] Account deletion flow
- [ ] Report / block on a post or profile
- [ ] Maps / location prompt
- [ ] Camera / photo library for posts
- [ ] Push permission (if prompted)
- [ ] No crashes on cold start against `api.nabbi.app`

## Placeholders still in repo

`eas.json` `submit.production.ios` currently has placeholder strings (`APPLE_ID_EMAIL_HERE`, etc.). Replace them before non-interactive `eas submit`, or omit/empty them to let EAS prompt interactively.
