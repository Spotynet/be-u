# Testing a Fully Native iOS Build with Expo

This guide covers how to run and test an Expo app as a **native iOS build** (not Expo Go).

---

## Important: iOS Builds Require macOS for Local Testing

- **iOS Simulator** and **Xcode** only run on **macOS**. You cannot run the iOS Simulator on Windows.
- You **can** create iOS builds from Windows using **EAS Build** (cloud). You then install the build on a physical iPhone or use a Mac to run the simulator.

---

## Option 1: EAS Build (Cloud) — Works from Windows or Mac

Use this to produce a real iOS build without a Mac.

### 1. Install EAS CLI

```bash
npm install -g eas-cli
```

### 2. Log in to Expo

```bash
eas login
```

### 3. Configure the project (if not already)

```bash
cd mobile
eas build:configure
```

### 4. Build for iOS

**Development build** (for dev client, connects to your bundler):

```bash
eas build --profile development --platform ios
```

**Preview build** (internal testing, no dev client):

```bash
eas build --profile preview --platform ios
```

**Production build**:

```bash
eas build --profile production --platform ios
```

### 5. Install the build

- **Physical iPhone**: When the build finishes, EAS gives you a link. Open it on your iPhone, install the profile if prompted, then install the app.
- **iOS Simulator**: You need a Mac. In EAS dashboard, download the build; for simulator you need a simulator-specific build (see below).

---

## Option 2: Local iOS Build + Simulator (Mac Only)

Use this when you have a Mac and want to run the app in the iOS Simulator.

### 1. Install on your Mac

| Tool | Purpose | Install |
|------|---------|--------|
| **Xcode** | iOS SDK, Simulator, signing | [Mac App Store](https://apps.apple.com/app/xcode/id497799835) or [developer.apple.com](https://developer.apple.com/xcode/) |
| **Xcode Command Line Tools** | Build from terminal | `xcode-select --install` |
| **CocoaPods** | iOS native dependencies | `sudo gem install cocoapods` (or `brew install cocoapods`) |
| **Node.js** | JS tooling | [nodejs.org](https://nodejs.org) or `brew install node` |

### 2. Install project dependencies

```bash
cd mobile
npm install
```

### 3. Run on iOS Simulator (development build)

**Development client** (Expo dev client, loads your JS from Metro):

```bash
npx expo run:ios
```

Pick a simulator when prompted. This builds the native app once and opens the simulator.

**Specific simulator**:

```bash
npx expo run:ios --device "iPhone 16"
```

### 4. Run a “preview-like” native build locally

To test the same kind of app as your EAS Preview build (no dev client, bundled JS):

- Use EAS Build with profile `preview` and install the resulting app on a device, or  
- On Mac you can run `npx expo run:ios` and then create a release-style scheme in Xcode if you need to test a bundled build locally (advanced).

For most “native iOS test” scenarios, `npx expo run:ios` on a Mac is enough.

---

## Option 3: Simulator Build via EAS (Mac or CI)

To get an **iOS build that runs in the Simulator** (e.g. to download from EAS and run on a Mac):

1. Add a simulator-specific profile in `eas.json`:

```json
"build": {
  "development": { ... },
  "preview": { ... },
  "preview-simulator": {
    "ios": {
      "simulator": true
    },
    "distribution": "internal",
    "env": {
      "EXPO_PUBLIC_API_URL": "https://stg.be-u.ai/api"
    }
  },
  "production": { ... }
}
```

2. Build:

```bash
eas build --profile preview-simulator --platform ios
```

3. When the build is done, download the `.tar.gz` from EAS, unpack it, and run the `.app` in the iOS Simulator on your Mac.

---

## Apple Developer Account

| Goal | Account |
|------|--------|
| **iOS Simulator only** (local on Mac) | No paid account needed |
| **Install on your own iPhone** (development/ad hoc) | **Apple Developer Program** (paid, $99/year) |
| **TestFlight / App Store** | **Apple Developer Program** (paid) |

For EAS Build:

- Simulator builds: often no paid account.
- Device builds: EAS will prompt you to sign in with an Apple ID; for internal distribution you typically need a paid Apple Developer account and to set up credentials (EAS can do this for you: `eas credentials`).

---

## Quick Reference

| Scenario | Command / Action |
|----------|------------------|
| Build in cloud (any OS) | `eas build --profile preview --platform ios` |
| Run in simulator (Mac) | `npx expo run:ios` |
| Install on iPhone | Use link from EAS after build, or TestFlight |
| Simulator build from EAS | Add `"simulator": true` profile → `eas build --profile preview-simulator --platform ios` |

---

## Your Project’s Profiles (`eas.json`)

- **development** — Dev client, `EXPO_PUBLIC_API_URL` = localhost.
- **preview** — Internal testing, `EXPO_PUBLIC_API_URL` = stg.be-u.ai.
- **production** — Production, same API, version auto-increment.

Use **preview** for a “fully native iOS test build” that hits staging; use **development** when you want to point at your local backend and use the dev client.
