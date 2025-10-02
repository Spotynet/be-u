# Mobile Development Standards & Guidelines

This document outlines the coding standards, folder structure, and best practices for the Be-U mobile application built with Expo Go and React Native. Use this as a reference for all mobile development tasks to ensure consistency and maintainability.

## 📁 Folder Structure & Architecture

### Core Principles

- **Expo Router**: Use file-based routing with Expo Router for navigation
- **Feature-Based Organization**: Group related functionality together
- **Clean Imports**: Use barrel exports (`index.ts`) for clean imports
- **Cross-Platform**: Ensure code works on iOS, Android, and Web
- **Performance**: Optimize for mobile performance and battery life

### Folder Organization

```
mobile/
├── app/                          # Expo Router file-based routing
│   ├── (tabs)/                   # Tab navigation group
│   │   ├── _layout.tsx          # Tab layout configuration
│   │   ├── index.tsx            # Home tab (default)
│   │   └── [feature].tsx        # Feature-specific tabs
│   ├── [feature]/               # Feature-specific routes
│   │   └── [id].tsx            # Dynamic routes with parameters
│   ├── _layout.tsx              # Root layout with providers
│   └── modal.tsx                # Modal screens
├── components/                   # Reusable UI components
│   ├── [feature]/               # Feature-specific components
│   │   ├── ComponentName.tsx    # Feature component
│   │   └── index.ts             # Barrel exports
│   ├── ui/                      # Generic UI components
│   │   ├── Button.tsx           # Custom button component
│   │   ├── Card.tsx             # Card component
│   │   └── Input.tsx            # Input component
│   └── [shared]/                # Shared components across features
├── features/                     # Business logic and feature code
│   └── [feature]/               # Feature-specific logic
│       ├── hooks/               # Custom hooks for state/logic
│       ├── types/               # TypeScript type definitions
│       ├── utils/               # Utility functions
│       ├── services/            # API services and data fetching
│       └── index.ts             # Feature barrel exports
├── constants/                    # App constants and configurations
│   ├── theme.ts                 # Theme colors and typography
│   └── config.ts                # App configuration
├── hooks/                       # Global custom hooks
├── lib/                         # Core utilities and configurations
│   ├── api.ts                   # API client and utilities
│   └── storage.ts               # AsyncStorage utilities
├── types/                       # Global type definitions
│   └── global.ts                # Global types and interfaces
└── assets/                      # Static assets
    ├── images/                  # Image assets
    ├── fonts/                   # Custom fonts
    └── icons/                   # Icon assets
```

### File Naming Conventions

- **Screens**: PascalCase (`HomeScreen.tsx`, `ProfileScreen.tsx`)
- **Components**: PascalCase (`LoginForm.tsx`, `UserProfile.tsx`)
- **Hooks**: camelCase starting with 'use' (`useAuth.tsx`, `useTheme.tsx`)
- **Types**: PascalCase (`User.ts`, `LoginCredentials.ts`)
- **Utils**: camelCase (`tokenUtils.ts`, `validationUtils.ts`)
- **Routes**: lowercase (`_layout.tsx`, `page.tsx`) - Expo Router convention

## 🎨 Theme System & Styling

### Theme Architecture

- **NativeWind**: Use Tailwind CSS for styling with NativeWind
- **Cross-Platform Colors**: Use theme-aware color system
- **Responsive Design**: Adapt to different screen sizes
- **Dark Mode**: Support system dark mode preference

### Available Themes

- `light` - Default light theme
- `dark` - Dark theme for low-light environments
- `system` - Follow system preference (default)

### Color Usage Guidelines

```typescript
// Use theme-aware colors from constants/theme.ts
import { Colors } from '@/constants/theme';

// ✅ Good: Theme-aware styling
<View style={{ backgroundColor: Colors.light.background }}>
  <Text style={{ color: Colors.light.text }}>Content</Text>
</View>

// ✅ Good: Using NativeWind with theme
<View className="bg-background dark:bg-background-dark">
  <Text className="text-foreground dark:text-foreground-dark">Content</Text>
</View>
```

### NativeWind Configuration

```typescript
// ✅ Good: NativeWind classes
<View className="flex-1 bg-background p-4">
  <Text className="text-lg font-semibold text-foreground">
    Title
  </Text>
</View>

// ✅ Good: Responsive design with NativeWind
<View className="flex-col md:flex-row gap-4 p-4">
  <View className="flex-1 bg-card rounded-lg p-4">
    <Text className="text-foreground">Content</Text>
  </View>
</View>
```

### Cross-Platform Styling

```typescript
// ✅ Good: Platform-specific styling
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 44 : 24,
    paddingHorizontal: 16,
  },
});

// ✅ Good: Using NativeWind with platform classes
<View className="pt-ios:pt-11 pt-android:pt-6 px-4">
```

## 🧩 Component Development Standards

### Component Structure

```typescript
// 1. Imports (external libraries first, then internal)
import React, {useState, useEffect} from "react";
import {View, Text, TouchableOpacity} from "react-native";
import {useRouter} from "expo-router";
import {useAuth} from "@/features/auth/hooks/useAuth";

// 2. Type definitions
interface ComponentProps {
  title: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

// 3. Component implementation
export const ComponentName = ({title, onAction, children}: ComponentProps) => {
  // Hooks and state
  const router = useRouter();
  const {user} = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Event handlers
  const handlePress = () => {
    onAction?.();
  };

  // Render
  return (
    <View className="flex-1 bg-background p-4">
      <Text className="text-lg font-semibold text-foreground">{title}</Text>
      {children}
      <TouchableOpacity className="bg-primary p-3 rounded-lg mt-4" onPress={handlePress}>
        <Text className="text-primary-foreground text-center font-medium">Action</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Component Guidelines

- **Single Responsibility**: Each component should have one clear purpose
- **Props Interface**: Always define TypeScript interfaces for props
- **Default Props**: Use default parameters instead of defaultProps
- **Event Handlers**: Use descriptive names (`handlePress`, `handleSubmit`)
- **Conditional Rendering**: Use logical operators and ternary operators appropriately
- **Platform Compatibility**: Ensure components work on iOS, Android, and Web

### Reusable Component Patterns

```typescript
// ✅ Good: Flexible, reusable component
interface ButtonProps {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  children: React.ReactNode;
  onPress?: () => void;
  className?: string;
}

export const Button = ({
  variant = "primary",
  size = "md",
  disabled = false,
  children,
  onPress,
  className = "",
}: ButtonProps) => {
  const baseClasses = "rounded-lg justify-center items-center";
  const variantClasses = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    outline: "border border-border bg-transparent",
  };
  const sizeClasses = {
    sm: "px-3 py-2",
    md: "px-4 py-3",
    lg: "px-6 py-4",
  };

  return (
    <TouchableOpacity
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        disabled ? "opacity-50" : ""
      } ${className}`}
      disabled={disabled}
      onPress={onPress}>
      <Text className={`font-medium ${variant === "outline" ? "text-foreground" : "text-white"}`}>
        {children}
      </Text>
    </TouchableOpacity>
  );
};
```

## 🧭 Navigation & Routing

### Expo Router Standards

- **File-Based Routing**: Use Expo Router's file-based routing system
- **Layout Files**: Use `_layout.tsx` for nested layouts
- **Dynamic Routes**: Use `[param].tsx` for dynamic parameters
- **Groups**: Use `(group)` for route grouping without affecting URL

### Navigation Patterns

```typescript
// ✅ Good: Using Expo Router navigation
import {useRouter, useLocalSearchParams} from "expo-router";

export const ProfileScreen = () => {
  const router = useRouter();
  const {userId} = useLocalSearchParams<{userId: string}>();

  const navigateToEdit = () => {
    router.push(`/profile/edit/${userId}`);
  };

  return (
    <View>
      <TouchableOpacity onPress={navigateToEdit}>
        <Text>Edit Profile</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Tab Navigation

```typescript
// ✅ Good: Tab layout configuration
import {Tabs} from "expo-router";
import {Ionicons} from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        tabBarStyle: {
          backgroundColor: Colors.light.background,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({color, focused}) => (
            <Ionicons name={focused ? "home" : "home-outline"} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({color, focused}) => (
            <Ionicons name={focused ? "search" : "search-outline"} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}
```

## 🔧 State Management & Data Flow

### State Management Patterns

- **Local State**: Use `useState` for component-specific state
- **Shared State**: Use custom hooks for feature-specific shared state
- **Global State**: Use Redux Toolkit for app-wide state management
- **Server State**: Use API hooks with proper error handling

### Redux Toolkit Integration

```typescript
// ✅ Good: Redux slice with proper typing
import {createSlice, PayloadAction} from "@reduxjs/toolkit";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.isLoading = false;
      state.user = action.payload;
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const {loginStart, loginSuccess, loginFailure} = authSlice.actions;
export default authSlice.reducer;
```

### Custom Hook Patterns

```typescript
// ✅ Good: Feature-specific hook with proper typing
import {useSelector, useDispatch} from "react-redux";
import {RootState} from "@/lib/store";

export const useAuth = () => {
  const dispatch = useDispatch();
  const {user, isLoading, error} = useSelector((state: RootState) => state.auth);

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch(loginStart());
      const response = await authApi.login(credentials);
      dispatch(loginSuccess(response.data.user));
    } catch (err) {
      dispatch(loginFailure(err.message));
    }
  };

  return {user, isLoading, error, login};
};

// ✅ Good: API hook with error handling
export const useServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await servicesApi.getAll();
      setServices(response.data);
    } catch (err) {
      setError(errorUtils.getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return {services, isLoading, error, fetchServices};
};
```

## 📱 Mobile-Specific Standards

### Performance Optimization

- **FlatList**: Use FlatList for large lists instead of ScrollView
- **Image Optimization**: Use Expo Image for optimized image loading
- **Lazy Loading**: Implement lazy loading for heavy components
- **Memory Management**: Properly clean up timers and subscriptions

### Performance Patterns

```typescript
// ✅ Good: Optimized list rendering
import {FlatList} from "react-native";

export const ServiceList = ({services}: {services: Service[]}) => {
  const renderItem = useCallback(({item}: {item: Service}) => <ServiceCard service={item} />, []);

  const keyExtractor = useCallback((item: Service) => item.id.toString(), []);

  return (
    <FlatList
      data={services}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
};

// ✅ Good: Optimized image loading
import {Image} from "expo-image";

export const ServiceImage = ({uri, alt}: {uri: string; alt: string}) => (
  <Image
    source={{uri}}
    style={{width: 100, height: 100}}
    contentFit="cover"
    transition={200}
    placeholder="blurhash"
  />
);
```

### Platform-Specific Features

```typescript
// ✅ Good: Platform-specific implementations
import {Platform, Alert} from "react-native";
import * as Haptics from "expo-haptics";

export const handleButtonPress = async () => {
  // Haptic feedback for iOS
  if (Platform.OS === "ios") {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  // Show alert
  Alert.alert("Success", "Action completed");
};
```

### Touch and Gesture Handling

```typescript
// ✅ Good: Proper touch handling
import {TouchableOpacity, TouchableWithoutFeedback} from "react-native";
import {GestureDetector, Gesture} from "react-native-gesture-handler";

// For simple touch
<TouchableOpacity onPress={handlePress} activeOpacity={0.7} className="bg-primary p-4 rounded-lg">
  <Text>Press me</Text>
</TouchableOpacity>;

// For complex gestures
const panGesture = Gesture.Pan().onUpdate((event) => {
  // Handle pan gesture
});

<GestureDetector gesture={panGesture}>
  <View className="w-full h-20 bg-gray-200" />
</GestureDetector>;
```

## 🎯 Feature Development Standards

### Feature Structure

```
features/[feature-name]/
├── hooks/
│   ├── use[FeatureName].tsx     # Main feature hook
│   └── use[FeatureName]Data.tsx # Data fetching hook
├── types/
│   └── index.ts                 # Feature-specific types
├── utils/
│   └── [feature]Utils.ts        # Feature utility functions
├── services/
│   └── [feature]Api.ts          # API service functions
└── index.ts                     # Feature barrel exports
```

### Feature Implementation

```typescript
// features/auth/types/index.ts
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

// features/auth/services/authApi.ts
import axios from "axios";

export const authApi = {
  login: async (credentials: LoginCredentials) => {
    const response = await axios.post("/auth/login", credentials);
    return response.data;
  },

  logout: async () => {
    await axios.post("/auth/logout");
  },

  getProfile: async () => {
    const response = await axios.get("/auth/profile");
    return response.data;
  },
};

// features/auth/index.ts
export {useAuth, AuthProvider} from "./hooks/useAuth";
export type {User, AuthContextType, LoginCredentials} from "./types";
export {authApi} from "./services/authApi";
```

## 📱 Responsive Design Standards

### Screen Size Adaptation

- **Flexible Layouts**: Use Flexbox for responsive layouts
- **Safe Areas**: Handle device safe areas (notches, status bars)
- **Orientation**: Support both portrait and landscape orientations
- **Accessibility**: Ensure proper accessibility support

### Responsive Patterns

```typescript
// ✅ Good: Responsive layout with NativeWind
<View className="flex-1 p-4">
  <View className="flex-col md:flex-row gap-4">
    <View className="flex-1 bg-card rounded-lg p-4">
      <Text className="text-lg font-semibold text-foreground">Content</Text>
    </View>
    <View className="flex-1 bg-card rounded-lg p-4">
      <Text className="text-lg font-semibold text-foreground">Content</Text>
    </View>
  </View>
</View>;

// ✅ Good: Safe area handling
import {useSafeAreaInsets} from "react-native-safe-area-context";

export const Screen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
        paddingLeft: insets.left,
        paddingRight: insets.right,
      }}
      className="flex-1 bg-background">
      <Text>Content</Text>
    </View>
  );
};
```

### Accessibility Standards

```typescript
// ✅ Good: Accessible components
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Login button"
  accessibilityHint="Tap to login to your account"
  accessibilityRole="button"
  onPress={handleLogin}
  className="bg-primary p-4 rounded-lg"
>
  <Text className="text-white font-medium text-center">
    Login
  </Text>
</TouchableOpacity>

// ✅ Good: Screen reader support
<Text
  accessibilityRole="header"
  accessibilityLevel={1}
  className="text-2xl font-bold text-foreground"
>
  Welcome
</Text>
```

## 🎨 UI/UX Standards

### Design System

- **Consistent Spacing**: Use consistent spacing scale (4, 8, 12, 16, 24, 32, etc.)
- **Typography Scale**: Use consistent text sizes and weights
- **Touch Targets**: Ensure minimum 44px touch targets
- **Loading States**: Provide clear loading and error states

### Loading States

```typescript
// ✅ Good: Consistent loading pattern
import {ActivityIndicator} from "react-native";

export const LoadingSpinner = () => (
  <View className="flex-1 justify-center items-center bg-background">
    <ActivityIndicator size="large" color="#3b82f6" />
    <Text className="mt-4 text-foreground-muted">Loading...</Text>
  </View>
);

// ✅ Good: Conditional rendering with loading
{
  isLoading ? (
    <LoadingSpinner />
  ) : error ? (
    <View className="flex-1 justify-center items-center p-4">
      <Text className="text-error text-center">{error}</Text>
      <TouchableOpacity onPress={retry} className="mt-4 bg-primary px-4 py-2 rounded-lg">
        <Text className="text-white">Retry</Text>
      </TouchableOpacity>
    </View>
  ) : (
    <View>{/* Content */}</View>
  );
}
```

### Error Handling

```typescript
// ✅ Good: User-friendly error display
export const ErrorMessage = ({message, onRetry}: {message: string; onRetry?: () => void}) => (
  <View className="bg-error-light border border-error/50 rounded-lg p-4 m-4">
    <Text className="text-sm text-error mb-2">{message}</Text>
    {onRetry && (
      <TouchableOpacity onPress={onRetry} className="bg-error px-3 py-1 rounded self-start">
        <Text className="text-white text-sm">Retry</Text>
      </TouchableOpacity>
    )}
  </View>
);
```

## 📝 Code Quality Standards

### TypeScript Guidelines

- **Strict Mode**: Enable strict TypeScript settings
- **Interface over Type**: Use interfaces for object shapes
- **Explicit Types**: Avoid `any`, use proper typing
- **Generic Types**: Use generics for reusable components and hooks

### Import Organization

```typescript
// 1. React and React Native imports
import React, {useState, useEffect} from "react";
import {View, Text, TouchableOpacity, Alert} from "react-native";

// 2. Expo and third-party libraries
import {useRouter} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
import {useSafeAreaInsets} from "react-native-safe-area-context";

// 3. Internal imports (features first, then components)
import {useAuth} from "@/features/auth/hooks/useAuth";
import {Button} from "@/components/ui/Button";
import {ThemeToggle} from "@/components/ThemeToggle";

// 4. Type imports
import type {User, LoginCredentials} from "@/features/auth/types";
```

### Naming Conventions

- **Components**: PascalCase (`UserProfile`, `LoginForm`)
- **Hooks**: camelCase with 'use' prefix (`useAuth`, `useLocalStorage`)
- **Functions**: camelCase (`handleSubmit`, `validateEmail`)
- **Constants**: UPPER_SNAKE_CASE (`API_ENDPOINTS`, `MAX_FILE_SIZE`)
- **Files**: Match the default export (`UserProfile.tsx` exports `UserProfile`)

## 🚀 Performance Standards

### Optimization Guidelines

- **Bundle Size**: Monitor and optimize bundle size
- **Image Optimization**: Use Expo Image with proper caching
- **List Performance**: Use FlatList for large datasets
- **Memory Management**: Clean up subscriptions and timers

### Performance Patterns

```typescript
// ✅ Good: Memoization for expensive calculations
import {useMemo, useCallback} from "react";

const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// ✅ Good: Callback memoization
const handlePress = useCallback(
  (id: string) => {
    onItemPress(id);
  },
  [onItemPress]
);

// ✅ Good: Component memoization
const ServiceCard = React.memo(({service}: {service: Service}) => (
  <View className="bg-card p-4 rounded-lg">
    <Text className="text-foreground">{service.name}</Text>
  </View>
));
```

## 🧪 Testing Standards

### Testing Strategy

- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user flows
- **Accessibility Tests**: Ensure components meet accessibility standards

### Testing Patterns

```typescript
// ✅ Good: Component testing
import {render, fireEvent} from "@testing-library/react-native";
import {LoginForm} from "./LoginForm";

test("should submit form with valid credentials", async () => {
  const mockLogin = jest.fn();
  const {getByPlaceholderText, getByText} = render(<LoginForm onLogin={mockLogin} />);

  fireEvent.changeText(getByPlaceholderText("Email"), "test@example.com");
  fireEvent.changeText(getByPlaceholderText("Password"), "password123");
  fireEvent.press(getByText("Login"));

  expect(mockLogin).toHaveBeenCalledWith({
    email: "test@example.com",
    password: "password123",
  });
});
```

## 📋 Checklist for New Features

### Development Checklist

- [ ] Create feature folder in `features/[feature-name]/`
- [ ] Define types in `features/[feature-name]/types/`
- [ ] Create custom hooks in `features/[feature-name]/hooks/`
- [ ] Build components in `components/[feature-name]/`
- [ ] Create barrel exports in `index.ts` files
- [ ] Update global types if needed
- [ ] Ensure cross-platform compatibility
- [ ] Test on iOS, Android, and Web
- [ ] Add proper error handling
- [ ] Include loading states
- [ ] Follow accessibility guidelines
- [ ] Optimize for performance
- [ ] Write unit tests

### Code Review Checklist

- [ ] Follows folder structure conventions
- [ ] Uses theme-aware styling with NativeWind
- [ ] Implements responsive design
- [ ] Has proper TypeScript typing
- [ ] Includes error handling
- [ ] Follows naming conventions
- [ ] Has clean imports
- [ ] Includes loading states
- [ ] Meets accessibility standards
- [ ] Works on all platforms (iOS, Android, Web)
- [ ] Has appropriate tests
- [ ] Optimized for performance

## 🔗 Quick Reference

### Common Imports

```typescript
// Navigation
import {useRouter, useLocalSearchParams} from "expo-router";

// Components
import {View, Text, TouchableOpacity, FlatList} from "react-native";
import {Ionicons} from "@expo/vector-icons";

// Auth
import {useAuth} from "@/features/auth/hooks/useAuth";
import {LoginForm, RegisterForm} from "@/components/auth";

// Theme
import {Colors} from "@/constants/theme";

// UI Components
import {Button} from "@/components/ui/Button";
import {Card} from "@/components/ui/Card";
import {Input} from "@/components/ui/Input";
```

### Common Patterns

```typescript
// Theme-aware styling
className = "bg-background text-foreground border-border";

// Safe area handling
const insets = useSafeAreaInsets();

// Responsive design
className = "flex-col md:flex-row gap-4";

// Loading state
{
  isLoading ? <LoadingSpinner /> : <Content />;
}

// Error state
{
  error && <ErrorMessage message={error} onRetry={retry} />;
}

// Navigation
const router = useRouter();
router.push("/path");
```

---

**Remember**: These standards ensure consistency, maintainability, and cross-platform compatibility. Always refer to this document when implementing new features or reviewing mobile code.
