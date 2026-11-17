# Be-U Mobile App

A React Native mobile application built with Expo, following nabbi Mobile Development Standards and the cross-platform [Design System](../DESIGN_SYSTEM.md).

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

2. **Set up environment variables:**

Create a `.env` file in the `mobile/` directory with:

```env
# API Configuration
EXPO_PUBLIC_API_URL=https://nabbi-api-dev.spotynet.com/api

# App Configuration
EXPO_PUBLIC_APP_NAME=nabbi
EXPO_PUBLIC_APP_VERSION=1.0.0
```

3. Start the development server:

```bash
npx expo start --clear
```

4. Open the app on your device:
   - Install Expo Go app on your phone
   - Scan the QR code from the terminal
   - Or press `i` for iOS simulator, `a` for Android emulator

## 📁 Project Structure

```
mobile/
├── app/                          # Expo Router file-based routing
│   ├── (tabs)/                   # Tab navigation group
│   │   ├── _layout.tsx          # Tab layout configuration
│   │   ├── index.tsx            # Home/Feed tab
│   │   ├── explore.tsx          # Explore tab (3 progressive views)
│   │   ├── be-u.tsx             # AI Chat tab
│   │   ├── reservas.tsx         # Reservations tab
│   │   └── perfil.tsx           # Profile tab
│   ├── _layout.tsx              # Root layout with providers
│   ├── map.tsx                  # 🗺️ Full-screen map page (NEW)
│   ├── login.tsx                # Login screen
│   ├── register.tsx             # Register screen
│   └── modal.tsx                # Modal screens
├── components/                   # Reusable UI components
│   └── ui/                      # Generic UI components
│       ├── Button.tsx           # Custom button component
│       ├── Card.tsx             # Card component
│       ├── Input.tsx            # Input component
│       └── index.ts             # Barrel exports
├── features/                     # Business logic and feature code
│   ├── auth/                    # Authentication feature
│   ├── reservations/            # Reservations feature
│   ├── reviews/                 # Reviews feature
│   ├── services/                # Services feature
│   └── users/                   # Users feature
│       ├── hooks/               # Custom hooks
│       ├── types/               # TypeScript type definitions
│       ├── services/            # API services
│       └── index.ts             # Feature barrel exports
├── constants/                    # App constants and configurations
│   ├── theme.ts                 # Theme colors and typography
│   └── categories.ts            # 🎯 Main & sub-categories (NEW)
├── lib/                         # Core utilities and configurations
│   └── api.ts                   # API client and utilities
├── types/                       # Global type definitions
│   └── global.ts                # Global types (ServiceCategory, etc.)
├── assets/                      # Static assets
├── MOBILE_STANDARDS.md          # Development standards
├── EXPLORE_SCREEN_REDESIGN.md   # 📱 Explore page documentation
├── MAP_PAGE_GUIDE.md            # 🗺️ Map page guide (NEW)
└── README.md                    # This file
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

### Key Pages

#### Home Feed (`/index`) 🎨 ✨

**Masonry-style dynamic feed** - Completely unique in the market:

- **Masonry Layout**: Cards of different sizes (Small, Medium, Large)
- **7 Card Types**: Hero, Story Highlights, Reviews, Services, Promos, Tips, Before/After
- **Category Colors**: Visual identification (Belleza 💄, Wellness 🧘, Mascotas 🐾)
- **Dynamic Experience**: Asymmetric layout type Pinterest+
- **Visual Priority**: Important content = larger cards

**Differentiator**: Unlike traditional feeds (Instagram, Facebook), Be-U uses a dynamic mosaic that creates a visually rich and engaging experience. Each scroll reveals something new and surprising.

See [HOME_FEED_REDESIGN.md](./HOME_FEED_REDESIGN.md) for complete documentation.

#### Explore Page (`/explore`) 🌟 ✨

**Discovery Experience** - Inspired by Spotify/Apple App Store:

- **Hero Featured Card**: Immersive 420px card showcasing premium services
- **Quick Categories**: Horizontal scroll with visual chips (Belleza, Wellness, Mascotas)
- **Near You Section**: Nearby establishments with direct map integration
- **Trending Now**: Most booked services with flame icon
- **Curated Collections**: Editorial-style spotlights (Spas, Hair, Pets)
- **Quick Actions Grid**: Fast access to Reservations, Favorites, Map, Offers

**Philosophy**: Effortless discovery through visual storytelling, not structured navigation

See [EXPLORE_DISCOVER_REDESIGN.md](./EXPLORE_DISCOVER_REDESIGN.md) for complete documentation.

#### Map Page (`/map`) 🗺️ ✨

Dedicated full-screen map experience:

- **Full-Screen Map**: Interactive map with all establishments
- **Category Filters**: Filter by Belleza, Wellness, or Mascotas
- **Search Bar**: Find specific services or places
- **Interactive Pins**: Color-coded pins (normal, favorite, selected)
- **Rich Bottom Card**: Complete info with navigation & booking actions
- **Floating Controls**: Quick access to location & list view

**Access**: From explore page → "Explorar en Mapa" card

See [MAP_PAGE_GUIDE.md](./MAP_PAGE_GUIDE.md) for detailed documentation.

#### Profile Page (`/perfil`) 👤 ✨

**3 Different Profile Types** with tab-based navigation:

**🧑 Client Profile**:

- Personal stats (Reservations, Reviews, Favorites)
- Quick actions (View bookings, favorites, settings)
- Consumption-focused interface

**✂️ Professional Profile**:

- Services list with prices and duration
- Portfolio grid (3 columns)
- Verified badge
- Personal agenda and statistics
- Independent freelancer focus

**🏢 Salon/Business Profile**:

- Business information (address, phone, team size)
- Photo gallery of establishment
- Team members showcase
- Complete business management
- Multi-professional administration

See [PROFILE_TYPES_GUIDE.md](./PROFILE_TYPES_GUIDE.md) for complete documentation.

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

The app is configured to work with the nabbi backend API (dev: `https://nabbi-api-dev.spotynet.com/api`, prod: `https://api.nabbi.app/api`):

- **Base URL**: Configurable via `EXPO_PUBLIC_API_URL` environment variable
- **Authentication**: JWT token-based auth with automatic header injection
- **Error Handling**: Centralized error handling with user-friendly messages
- **Type Safety**: Full TypeScript integration with shared types
- **Auto Retry**: Automatic token refresh on 401 responses

### API Configuration

The API client (`lib/api.ts`) automatically:

1. ✅ Uses the base URL from environment variables
2. ✅ Adds authentication tokens to requests
3. ✅ Handles 401 errors and clears tokens
4. ✅ Provides type-safe request methods (GET, POST, PUT, DELETE)

### Environment Variables

All environment variables must be prefixed with `EXPO_PUBLIC_` to be accessible in the app:

```env
EXPO_PUBLIC_API_URL=https://nabbi-api-dev.spotynet.com/api
```

## 🎯 App Architecture

Be-U is organized around **3 main service categories**:

1. **💄 Cuidado y Belleza** (Beauty & Care)

   - Peluquería y Barbería
   - Manicure y Pedicura
   - Cuidado Facial y Corporal
   - Maquillaje
   - Pestañas y Cejas

2. **🧘 Bienestar y Ejercicio** (Wellness & Exercise)

   - Spa y Relajación
   - Yoga, Pilates, Meditación
   - Nutrición y Alimentación
   - Terapias Alternativas
   - Coaching Personal

3. **🐾 Mascotas** (Pets)
   - Cuidado y Alojamiento
   - Grooming
   - Salud y Bienestar
   - Productos y Accesorios
   - Servicios Especializados

All features, services, and UI components are organized according to these categories.

See [MOBILE_STANDARDS.md](./MOBILE_STANDARDS.md) for complete category structure.  
Visual language (colors, type, CTAs, forms): [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md).

## 📚 Resources

### Documentation

- [Mobile Development Standards](./MOBILE_STANDARDS.md) - Development guidelines & architecture
- [Design System](../DESIGN_SYSTEM.md) - Cross-platform UI (tokens, typography, components, forms)
- [Home Feed Redesign](./HOME_FEED_REDESIGN.md) - 🎨 Masonry feed documentation
- [Explore Discover Experience](./EXPLORE_DISCOVER_REDESIGN.md) - 🌟 New explore page (v2.0)
- [Map Page Guide](./MAP_PAGE_GUIDE.md) - 🗺️ Map functionality
- [Profile Types Guide](./PROFILE_TYPES_GUIDE.md) - 👤 3 profile types (Client, Professional, Salon)

### External Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
