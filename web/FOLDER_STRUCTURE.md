# Project Folder Structure

This document outlines the new folder structure that separates rendering logic from business logic.

## 🏗️ New Structure Overview

```
web/
├── app/                          # Next.js App Router pages (rendering only)
│   ├── login/page.tsx           # Simple page that renders LoginForm + WelcomeSection
│   ├── register/page.tsx        # Simple page that renders RegisterForm + WelcomeSection
│   ├── dashboard/page.tsx       # Dashboard page
│   ├── layout.tsx               # Root layout with providers
│   └── globals.css              # Global styles
├── components/                   # Reusable UI components
│   ├── auth/                    # Authentication-related components
│   │   ├── LoginForm.tsx        # Login form logic and UI
│   │   ├── RegisterForm.tsx     # Registration form logic and UI
│   │   ├── WelcomeSection.tsx   # Welcome message component
│   │   ├── AuthLayout.tsx       # Shared layout for auth pages
│   │   └── index.ts             # Exports for auth components
│   ├── layout/                  # Layout-related components
│   │   ├── ProtectedRoute.tsx   # Route protection component
│   │   └── index.ts             # Exports for layout components
│   ├── ui/                      # Basic UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   ├── ThemeToggle.tsx          # Theme switching component
│   ├── ThemeProvider.tsx        # Theme context provider
│   └── ClientThemeProvider.tsx  # Client-side theme provider
├── features/                     # Business logic and feature-specific code
│   └── auth/                    # Authentication feature
│       ├── hooks/               # Custom hooks for auth logic
│       │   └── useAuth.tsx      # Authentication hook and context
│       ├── types/               # TypeScript types for auth
│       │   └── index.ts         # Auth-related type definitions
│       └── index.ts             # Feature exports
├── lib/                         # Utility libraries
│   └── api.ts                   # API client and utilities
├── types/                       # Global type definitions
│   └── api.ts                   # API types (re-exports from features)
└── hooks/                       # Legacy hooks (to be moved to features)
    └── useAuth.tsx              # OLD - moved to features/auth/hooks/
```

## 🎯 Key Principles

### 1. **Separation of Concerns**

- **Pages (`app/`)**: Only handle routing and render components
- **Components (`components/`)**: Handle UI logic and presentation
- **Features (`features/`)**: Handle business logic, state management, and data fetching

### 2. **Feature-Based Organization**

Each feature (like `auth`) contains:

- `hooks/`: Custom hooks for state management and side effects
- `types/`: TypeScript definitions specific to the feature
- `utils/`: Utility functions specific to the feature
- `index.ts`: Clean exports for the feature

### 3. **Component Organization**

- **Feature-specific components** (`components/auth/`): Components tied to specific features
- **Layout components** (`components/layout/`): Components that affect page layout
- **UI components** (`components/ui/`): Reusable, generic UI components

## 📁 Detailed Structure

### Authentication Feature (`features/auth/`)

```
features/auth/
├── hooks/
│   └── useAuth.tsx              # Authentication context and hook
├── types/
│   └── index.ts                 # User, LoginCredentials, RegisterData, etc.
└── index.ts                     # Clean exports: useAuth, AuthProvider, types
```

### Auth Components (`components/auth/`)

```
components/auth/
├── LoginForm.tsx                # Login form with validation and submission
├── RegisterForm.tsx             # Registration form with validation
├── WelcomeSection.tsx           # Reusable welcome message component
├── AuthLayout.tsx               # Shared layout for auth pages
└── index.ts                     # Clean exports for all auth components
```

### Pages (`app/`)

```typescript
// app/login/page.tsx
import {LoginForm, WelcomeSection, AuthLayout} from "@/components/auth";

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
      <WelcomeSection title="¡BIENVENIDO A nabbi!" description="Your welcome message..." />
    </AuthLayout>
  );
}
```

## 🔄 Migration Benefits

### Before (Mixed Concerns)

- Pages contained both routing and business logic
- Components mixed UI and data fetching
- Hard to test and maintain
- Difficult to reuse logic across components

### After (Separated Concerns)

- **Pages**: Clean, focused on rendering
- **Components**: Reusable, focused on UI
- **Features**: Testable, focused on business logic
- **Easy to extend**: Add new features without touching existing code

## 🚀 Usage Examples

### Adding a New Auth Feature

1. Add hook to `features/auth/hooks/`
2. Add types to `features/auth/types/`
3. Create component in `components/auth/`
4. Use in pages by importing from components

### Adding a New Feature (e.g., Services)

1. Create `features/services/` with hooks, types, utils
2. Create `components/services/` for service-related UI
3. Pages import from components, components use feature hooks

This structure promotes:

- ✅ **Maintainability**: Clear separation of concerns
- ✅ **Reusability**: Components and hooks can be reused
- ✅ **Testability**: Business logic is isolated and testable
- ✅ **Scalability**: Easy to add new features without refactoring
- ✅ **Team Collaboration**: Clear boundaries for different developers
