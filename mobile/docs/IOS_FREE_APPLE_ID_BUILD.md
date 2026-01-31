# Install on Your iPhone with a Free Apple ID (No $99 Program)

You can install the app on **your own iPhone** using a **free Apple ID**. Builds expire after **7 days**; then rebuild and reinstall.

---

## 1. Prerequisites

- **Expo account** (free): [expo.dev](https://expo.dev) → Sign up
- **Apple ID** (free): [appleid.apple.com](https://appleid.apple.com)
- **iPhone** with a cable or same Wi‑Fi for installation

---

## 2. Install EAS CLI and log in

```bash
npm install -g eas-cli
eas login
```

Use your Expo account email/password.

---

## 3. Build for iOS (from project root)

```bash
cd mobile
eas build --profile preview --platform ios
```

When EAS asks:

- **"Would you like to log in to your Apple account?"** → **Yes**
- Enter your **Apple ID** (email) and **password**
- If it asks for **Two‑Factor Authentication** → enter the code from your iPhone/Mac
- **"Select a team"** → choose the one that says **Personal Team** (or your name). Do **not** pick a team that says "Apple Developer Program" unless you’ve paid.
- For **provisioning** → choose **Let EAS handle it** (recommended)

EAS will build in the cloud. Wait until the build status is **Finished**.

---

## 4. Install on your iPhone

When the build is done:

1. EAS shows a **link** in the terminal and in the [Expo dashboard](https://expo.dev) → your project → **Builds**.
2. **On your iPhone**, open that link in **Safari** (not Chrome).
3. Tap **Install** (or the install button shown).
4. If iOS says **"Untrusted Enterprise Developer"**:
   - Go to **Settings → General → VPN & Device Management**
   - Tap your developer profile (your email)
   - Tap **Trust**
5. Open the app from the home screen.

The app will work for **7 days**. After that, run the build again and reinstall.

---

## 5. If EAS asks for credentials again

You can set credentials once and reuse them:

```bash
cd mobile
eas credentials --platform ios
```

- Choose **Build credentials** (or the option that matches building the app).
- When asked for Apple ID, sign in with your **free Apple ID**.
- Select your **Personal Team**.
- Let EAS create/manage the provisioning profile and certificate.

Then run:

```bash
eas build --profile preview --platform ios
```

and it will use the stored credentials.

---

## Summary

| Step | Command / Action |
|------|------------------|
| 1 | `eas login` (Expo account) |
| 2 | `eas build --profile preview --platform ios` |
| 3 | Sign in with **free Apple ID** when asked |
| 4 | Choose **Personal Team** |
| 5 | Open build link on iPhone in Safari → Install → Trust in Settings if needed |

No Apple Developer Program ($99) required; builds are valid for 7 days on your device.
