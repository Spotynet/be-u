# Backend/Frontend Connection Setup Summary

This document summarizes the CORS configuration and API utilities setup for the Be-U application.

## Backend CORS Configuration

### 1. Dependencies Added

- `django-cors-headers==4.3.1` added to `requirements.txt`

### 2. Django Settings Updated (`backend/settings.py`)

- Added `corsheaders` to `INSTALLED_APPS`
- Added `corsheaders.middleware.CorsMiddleware` to `MIDDLEWARE` (at the top)
- Configured CORS settings:
  - Allowed origins for localhost:3000 and localhost:3001
  - Credentials enabled
  - All origins allowed in development mode
  - Proper headers and methods configured

### 3. CORS Configuration Details

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Next.js development server
    "http://127.0.0.1:3000",
    "http://localhost:3001",  # Alternative port
    "http://127.0.0.1:3001",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = DEBUG  # Only allow all origins in development
```

## Frontend API Utilities

### 1. Enhanced API Client (`web/lib/api.ts`)

- **Base Configuration**: Axios instance with timeout and headers
- **Request Interceptor**: Automatically adds auth tokens
- **Response Interceptor**: Handles 401 errors and redirects to login
- **Generic API Methods**: GET, POST, PUT, PATCH, DELETE
- **Specialized API Modules**:
  - `authApi`: Authentication operations
  - `userApi`: User management
  - `serviceApi`: Service management
  - `reservationApi`: Reservation management
  - `reviewApi`: Review management

### 2. Utility Functions

- **Token Management**: `tokenUtils` for localStorage operations
- **API Utilities**: `apiUtils` for file uploads, retries, batching, debouncing
- **Error Handling**: `errorUtils` for consistent error processing

### 3. Enhanced TypeScript Types (`web/types/api.ts`)

- **User Interface**: Extended with profile fields
- **Service Interface**: Complete service model
- **Reservation Interface**: Full reservation model
- **Review Interface**: Complete review model
- **API Types**: Request/response types for all operations
- **Filter Types**: Search and filter interfaces
- **Constants**: API endpoints, status codes, error messages

### 4. Authentication Hook (`web/hooks/useAuth.ts`)

- **Context Provider**: Global authentication state
- **Methods**: login, register, logout, updateProfile, changePassword
- **State Management**: user, isLoading, isAuthenticated, error
- **Error Handling**: Integrated with errorUtils
- **Auto-refresh**: Token validation and user data refresh

### 5. Protected Route Component (`web/components/ProtectedRoute.tsx`)

- **Authentication Check**: Redirects unauthenticated users
- **Role-based Access**: Support for staff/superuser roles
- **Loading States**: Proper loading indicators
- **Custom Fallbacks**: Configurable fallback content
- **Access Denied**: Proper error handling for insufficient permissions

## Key Features

### 1. Comprehensive Error Handling

- Network error detection
- Authentication error handling
- Permission error handling
- Validation error extraction
- Consistent error messages

### 2. Advanced API Features

- File upload with progress tracking
- Request retry with exponential backoff
- Batch request processing
- Debounced search functionality
- Query string building utilities

### 3. Type Safety

- Complete TypeScript interfaces
- Generic API response types
- Proper error type definitions
- Endpoint constants with type safety

### 4. Authentication Flow

- Token-based authentication
- Automatic token refresh
- Secure token storage
- Session management
- Role-based access control

## Usage Examples

### Basic API Call

```typescript
import {serviceApi} from "@/lib/api";

const services = await serviceApi.getServices({page: 1, search: "massage"});
```

### Authentication

```typescript
import {useAuth} from "@/hooks/useAuth";

const {login, user, isAuthenticated} = useAuth();
await login({email: "user@example.com", password: "password"});
```

### Protected Route

```typescript
import {ProtectedRoute} from "@/components/ProtectedRoute";

<ProtectedRoute requireRoles={["staff"]}>
  <AdminPanel />
</ProtectedRoute>;
```

### Error Handling

```typescript
import {errorUtils} from "@/lib/api";

try {
  await apiCall();
} catch (error) {
  console.error(errorUtils.getErrorMessage(error));
}
```

## Environment Setup

### Backend

1. Install dependencies: `pip install -r requirements.txt`
2. Run migrations: `python manage.py migrate`
3. Start server: `python manage.py runserver 8000`

### Frontend

1. Install dependencies: `npm install`
2. Set environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   ```
3. Start development server: `npm run dev`

## Testing the Connection

1. **Start Backend**: `cd backend && python manage.py runserver 8000`
2. **Start Frontend**: `cd web && npm run dev`
3. **Test CORS**: Open browser dev tools and check for CORS errors
4. **Test API**: Make API calls from the frontend to verify connection

## Security Considerations

1. **CORS Configuration**: Only allows specific origins in production
2. **Token Storage**: Uses localStorage (consider httpOnly cookies for production)
3. **Error Handling**: Doesn't expose sensitive information in error messages
4. **Role-based Access**: Proper permission checking in protected routes

## Next Steps

1. **Create Superuser**: `python manage.py createsuperuser`
2. **Test Authentication**: Use the login/register forms
3. **Implement API Endpoints**: Create Django views for the API calls
4. **Add Validation**: Implement proper form validation
5. **Add Loading States**: Implement proper loading indicators
6. **Error Boundaries**: Add React error boundaries for better error handling

## Documentation

- **API Usage**: See `web/docs/API_USAGE.md`
- **API Examples**: See `web/docs/API_EXAMPLES.md`
- **Backend Proxy**: See `web/docs/BACKEND_PROXY.md`
- **Theme System**: See `web/docs/THEME_SYSTEM.md`

The setup is now complete and ready for development!


