# Frontend Development Standards & Guidelines

This document outlines the coding standards, folder structure, and best practices for the nabbi frontend application. Use this as a reference for all development tasks to ensure consistency and maintainability.

## 📁 Folder Structure & Architecture

### Core Principles

- **Separation of Concerns**: Pages only render, Components handle UI, Features handle business logic
- **Feature-Based Organization**: Group related functionality together
- **Clean Imports**: Use barrel exports (`index.ts`) for clean imports
- **Scalability**: Structure should support adding new features easily

### Folder Organization

```
web/
├── app/                          # Next.js App Router (rendering only)
│   ├── [feature]/               # Feature-specific pages
│   │   └── page.tsx            # Minimal page that renders components
│   ├── layout.tsx               # Root layout with providers
│   └── globals.css              # Global styles and theme variables
├── components/                   # Reusable UI components
│   ├── [feature]/               # Feature-specific components
│   │   ├── ComponentName.tsx    # Feature component
│   │   └── index.ts             # Barrel exports
│   ├── ui/                      # Generic UI components
│   ├── layout/                  # Layout-related components
│   └── [shared]/                # Shared components across features
├── features/                     # Business logic and feature code
│   └── [feature]/               # Feature-specific logic
│       ├── hooks/               # Custom hooks for state/logic
│       ├── types/               # TypeScript type definitions
│       ├── utils/               # Utility functions
│       └── index.ts             # Feature barrel exports
├── lib/                         # Core utilities and configurations
│   └── api.ts                   # API client and utilities
└── types/                       # Global type definitions
    └── api.ts                   # Global API types and re-exports
```

### File Naming Conventions

- **Components**: PascalCase (`LoginForm.tsx`, `UserProfile.tsx`)
- **Hooks**: camelCase starting with 'use' (`useAuth.tsx`, `useTheme.tsx`)
- **Types**: PascalCase (`User.ts`, `LoginCredentials.ts`)
- **Utils**: camelCase (`tokenUtils.ts`, `validationUtils.ts`)
- **Pages**: lowercase (`page.tsx`, `layout.tsx`)

## 🎨 Theme System & Styling

### Theme Architecture

- **CSS Custom Properties**: All colors defined in `globals.css`
- **Tailwind Integration**: Custom properties mapped to Tailwind classes
- **Dynamic Theming**: Theme switching via data attributes
- **Consistent Colors**: Use semantic color names (primary, secondary, accent, etc.)

### Available Themes

- `light` - Default light theme
- `dark` - Dark theme for low-light environments
- `blue` - Professional blue theme
- `green` - Natural green theme
- `purple` - Creative purple theme (brand theme)

### Color Usage Guidelines

```css
/* Use semantic color classes */
bg-background           /* Main background */
bg-card                /* Card backgrounds */
text-foreground        /* Primary text */
text-foreground-muted  /* Secondary text */
text-primary           /* Brand/primary color */
border-border          /* Borders */
```

### Theme-Aware Component Pattern

```typescript
// ✅ Good: Use theme-aware classes
<div className="bg-card text-foreground border-border">

// ❌ Bad: Hardcoded colors
<div className="bg-white text-black border-gray-300">
```

### Responsive Design

- **Mobile-First**: Design for mobile, enhance for larger screens
- **Breakpoints**: Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`, `xl:`)
- **Grid Systems**: Use CSS Grid and Flexbox for layouts
- **Touch-Friendly**: Ensure 44px minimum touch targets

### Responsive Patterns

```typescript
// ✅ Good: Mobile-first responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ✅ Good: Responsive spacing
<div className="p-4 md:p-6 lg:p-8">

// ✅ Good: Responsive typography
<h1 className="text-2xl md:text-3xl lg:text-4xl">
```

## 🧩 Component Development Standards

### Component Structure

```typescript
// 1. Imports (external libraries first, then internal)
import {useState} from "react";
import {useAuth} from "@/features/auth/hooks/useAuth";

// 2. Type definitions
interface ComponentProps {
  title: string;
  onAction?: () => void;
}

// 3. Component implementation
export const ComponentName = ({title, onAction}: ComponentProps) => {
  // Hooks and state
  const {user} = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Event handlers
  const handleClick = () => {
    onAction?.();
  };

  // Render
  return (
    <div className="bg-card text-foreground">
      <h2 className="text-lg font-semibold">{title}</h2>
      {/* Component content */}
    </div>
  );
};
```

### Component Guidelines

- **Single Responsibility**: Each component should have one clear purpose
- **Props Interface**: Always define TypeScript interfaces for props
- **Default Props**: Use default parameters instead of defaultProps
- **Event Handlers**: Use descriptive names (`handleSubmit`, `handleInputChange`)
- **Conditional Rendering**: Use logical operators and ternary operators appropriately

### Reusable Component Patterns

```typescript
// ✅ Good: Flexible, reusable component
interface ButtonProps {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button = ({
  variant = "primary",
  size = "md",
  disabled = false,
  children,
  onClick,
}: ButtonProps) => {
  const baseClasses = "font-semibold rounded-lg transition-colors";
  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary-hover",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary-hover",
    outline: "border border-border bg-transparent hover:bg-background-secondary",
  };
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      disabled={disabled}
      onClick={onClick}>
      {children}
    </button>
  );
};
```

## 🔧 State Management & Data Flow

### State Management Patterns

- **Local State**: Use `useState` for component-specific state
- **Shared State**: Use custom hooks for feature-specific shared state
- **Global State**: Use React Context for app-wide state (auth, theme)
- **Server State**: Use API hooks with proper error handling

### Custom Hook Patterns

```typescript
// ✅ Good: Feature-specific hook with proper typing
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
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

### Data Flow Principles

- **Unidirectional**: Data flows down, events flow up
- **Props Down**: Pass data through props
- **Events Up**: Use callback props for child-to-parent communication
- **Context for Deep**: Use context for deeply nested data sharing

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
  // ... other user properties
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  // ... other auth methods
}

// features/auth/index.ts
export {useAuth, AuthProvider} from "./hooks/useAuth";
export type {User, AuthContextType, LoginCredentials} from "./types";
```

## 📱 Responsive Design Standards

### Breakpoint Strategy

- **Mobile**: 320px - 767px (default, no prefix)
- **Tablet**: 768px - 1023px (`md:` prefix)
- **Desktop**: 1024px - 1279px (`lg:` prefix)
- **Large Desktop**: 1280px+ (`xl:` prefix)

### Layout Patterns

```typescript
// ✅ Good: Responsive grid layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">

// ✅ Good: Responsive flexbox
<div className="flex flex-col md:flex-row gap-4 md:gap-8">

// ✅ Good: Responsive spacing
<div className="p-4 md:p-6 lg:p-8 xl:p-12">

// ✅ Good: Responsive typography
<h1 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl">
```

### Mobile-First Approach

```typescript
// ✅ Good: Mobile-first design
<div className="
  w-full                    // Mobile: full width
  md:w-1/2                  // Tablet: half width
  lg:w-1/3                  // Desktop: third width
  xl:w-1/4                  // Large: quarter width
">

// ❌ Bad: Desktop-first design
<div className="
  w-1/4                     // Desktop: quarter width
  lg:w-1/3                  // Large: third width
  md:w-1/2                  // Tablet: half width
  w-full                    // Mobile: full width (overridden)
">
```

## 🎨 UI/UX Standards

### Design System

- **Consistent Spacing**: Use Tailwind's spacing scale (4, 8, 12, 16, 24, 32, etc.)
- **Typography Scale**: Use consistent text sizes and weights
- **Color Harmony**: Maintain color relationships across themes
- **Interactive States**: Define hover, focus, active, and disabled states

### Accessibility Standards

- **Semantic HTML**: Use proper HTML elements (`button`, `nav`, `main`, etc.)
- **ARIA Labels**: Add labels for screen readers when needed
- **Keyboard Navigation**: Ensure all interactive elements are keyboard accessible
- **Color Contrast**: Maintain WCAG AA contrast ratios
- **Focus Indicators**: Clear focus states for keyboard navigation

### Loading States

```typescript
// ✅ Good: Consistent loading pattern
{
  isLoading ? (
    <div className="flex items-center justify-center p-8">
      <svg className="animate-spin h-6 w-6 text-primary" /* spinner */ />
      <span className="ml-2 text-foreground-muted">Loading...</span>
    </div>
  ) : (
    <div>{/* Content */}</div>
  );
}
```

### Error Handling

```typescript
// ✅ Good: User-friendly error display
{
  error && (
    <div className="bg-error-light border border-error/50 rounded-lg p-4">
      <div className="text-sm text-error">{error}</div>
    </div>
  );
}
```

## 📝 Code Quality Standards

### TypeScript Guidelines

- **Strict Mode**: Enable strict TypeScript settings
- **Interface over Type**: Use interfaces for object shapes
- **Explicit Types**: Avoid `any`, use proper typing
- **Generic Types**: Use generics for reusable components and hooks

### Import Organization

```typescript
// 1. React and Next.js imports
import {useState, useEffect} from "react";
import {useRouter} from "next/navigation";

// 2. Third-party libraries
import {clsx} from "clsx";

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

- **Code Splitting**: Use dynamic imports for large components
- **Image Optimization**: Use Next.js Image component
- **Bundle Analysis**: Monitor bundle size and optimize imports
- **Lazy Loading**: Implement lazy loading for non-critical components

### Performance Patterns

```typescript
// ✅ Good: Dynamic import for code splitting
const HeavyComponent = dynamic(() => import("./HeavyComponent"), {
  loading: () => <div>Loading...</div>,
});

// ✅ Good: Memoization for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);

// ✅ Good: Callback memoization
const handleClick = useCallback(() => {
  onAction(id);
}, [id, onAction]);
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
import {render, screen, fireEvent} from "@testing-library/react";
import {LoginForm} from "./LoginForm";

test("should submit form with valid credentials", async () => {
  const mockLogin = jest.fn();
  render(<LoginForm onLogin={mockLogin} />);

  fireEvent.change(screen.getByLabelText(/email/i), {
    target: {value: "test@example.com"},
  });
  fireEvent.change(screen.getByLabelText(/password/i), {
    target: {value: "password123"},
  });
  fireEvent.click(screen.getByRole("button", {name: /login/i}));

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
- [ ] Ensure responsive design
- [ ] Test with all themes
- [ ] Add proper error handling
- [ ] Include loading states
- [ ] Follow accessibility guidelines
- [ ] Write unit tests

### Code Review Checklist

- [ ] Follows folder structure conventions
- [ ] Uses theme-aware styling
- [ ] Implements responsive design
- [ ] Has proper TypeScript typing
- [ ] Includes error handling
- [ ] Follows naming conventions
- [ ] Has clean imports
- [ ] Includes loading states
- [ ] Meets accessibility standards
- [ ] Has appropriate tests

## 🔗 Quick Reference

### Common Imports

```typescript
// Auth
import {useAuth} from "@/features/auth/hooks/useAuth";
import {LoginForm, RegisterForm} from "@/components/auth";

// Theme
import {useTheme} from "@/components/ThemeProvider";
import {ThemeToggle} from "@/components/ThemeToggle";

// UI Components
import {Button} from "@/components/ui/Button";
import {Card} from "@/components/ui/Card";
import {Input} from "@/components/ui/Input";

// Layout
import {ProtectedRoute} from "@/components/layout/ProtectedRoute";
```

### Common Patterns

```typescript
// Theme-aware styling
className = "bg-card text-foreground border-border";

// Responsive grid
className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";

// Loading state
{
  isLoading ? <LoadingSpinner /> : <Content />;
}

// Error state
{
  error && <ErrorMessage message={error} />;
}
```

---

**Remember**: These standards ensure consistency, maintainability, and scalability. Always refer to this document when implementing new features or reviewing code.

