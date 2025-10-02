# Be-U Mobile App

A React Native mobile application built with Expo Go, following the Mobile Development Standards.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npx expo start
```

3. Open the app on your device:
   - Install Expo Go app on your phone
   - Scan the QR code from the terminal
   - Or press `i` for iOS simulator, `a` for Android emulator

## 📁 Project Structure

```
mobile/
├── app/                          # Expo Router file-based routing
│   ├── (tabs)/                   # Tab navigation group
│   │   ├── _layout.tsx          # Tab layout configuration
│   │   ├── index.tsx            # Home tab
│   │   └── explore.tsx          # Explore tab
│   ├── _layout.tsx              # Root layout with providers
│   └── modal.tsx                # Modal screens
├── components/                   # Reusable UI components
│   └── ui/                      # Generic UI components
│       ├── Button.tsx           # Custom button component
│       ├── Card.tsx             # Card component
│       ├── Input.tsx            # Input component
│       └── index.ts             # Barrel exports
├── features/                     # Business logic and feature code
│   └── auth/                    # Authentication feature
│       ├── hooks/               # Custom hooks
│       ├── types/               # TypeScript type definitions
│       ├── services/            # API services
│       └── index.ts             # Feature barrel exports
├── constants/                    # App constants and configurations
│   └── theme.ts                 # Theme colors and typography
├── lib/                         # Core utilities and configurations
│   └── api.ts                   # API client and utilities
├── types/                       # Global type definitions
│   └── global.ts                # Global types and interfaces
└── assets/                      # Static assets
```

## 🎨 Theme System

The app uses a comprehensive theme system with:

- **Light/Dark Mode Support**: Automatic theme switching based on system preference
- **NativeWind Integration**: Tailwind CSS classes for styling
- **Consistent Color Palette**: Brand colors with semantic naming
- **Typography Scale**: Consistent text sizes and weights

### Usage

```tsx
// Using theme-aware classes
<View className="bg-background p-4">
  <Text className="text-foreground text-lg font-semibold">Hello World</Text>
</View>;

// Using theme colors in components
import {Colors} from "@/constants/theme";
import {useColorScheme} from "@/hooks/use-color-scheme";

const colorScheme = useColorScheme();
const backgroundColor = Colors[colorScheme ?? "light"].background;
```

## 🧩 Components

### UI Components

- **Button**: Customizable button with variants (primary, secondary, outline)
- **Card**: Container component with consistent styling
- **Input**: Form input with label and error handling

### Usage

```tsx
import {Button, Card, Input} from "@/components/ui";

<Card>
  <Input label="Email" placeholder="Enter your email" error={emailError} />
  <Button variant="primary" onPress={handleSubmit}>
    Submit
  </Button>
</Card>;
```

## 🔐 Authentication

The app includes a complete authentication system:

- **AuthProvider**: Context provider for auth state
- **useAuth Hook**: Hook for accessing auth functionality
- **API Integration**: Ready for backend integration

### Usage

```tsx
import {useAuth} from "@/features/auth";

const {user, isAuthenticated, login, logout} = useAuth();
```

## 📱 Navigation

Built with Expo Router for file-based routing:

- **Tab Navigation**: Bottom tab navigator
- **Stack Navigation**: Modal and screen transitions
- **Type-safe Routes**: TypeScript support for navigation

## 🛠 Development

### Code Standards

This project follows the Mobile Development Standards:

- **TypeScript**: Strict typing throughout
- **Component Structure**: Consistent component patterns
- **Import Organization**: Clean import statements
- **Error Handling**: Proper error boundaries and handling
- **Performance**: Optimized for mobile performance

### Available Scripts

- `npm start`: Start the development server
- `npm run android`: Run on Android
- `npm run ios`: Run on iOS
- `npm run web`: Run on web

## 🔗 Backend Integration

The app is configured to work with the Be-U backend API:

- **Base URL**: Configurable via environment variables
- **Authentication**: JWT token-based auth
- **Error Handling**: Centralized error handling
- **Type Safety**: Full TypeScript integration

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Mobile Development Standards](./MOBILE_STANDARDS.md)
