# API Usage Examples

This document provides practical examples of how to use the API utilities in your nabbi application.

## Basic Setup

### 1. Import the API utilities

```typescript
import {
  api,
  authApi,
  userApi,
  serviceApi,
  reservationApi,
  reviewApi,
  apiUtils,
  errorUtils,
  tokenUtils,
} from "@/lib/api";
import {
  LoginCredentials,
  RegisterData,
  CreateServiceData,
  CreateReservationData,
  CreateReviewData,
} from "@/types/api";
```

### 2. Use the authentication hook

```typescript
import {useAuth} from "@/hooks/useAuth";

function MyComponent() {
  const {user, isAuthenticated, login, logout, updateProfile, changePassword, error, clearError} =
    useAuth();

  // Your component logic here
}
```

## Authentication Examples

### Login

```typescript
const handleLogin = async (credentials: LoginCredentials) => {
  try {
    await login(credentials);
    // User is now logged in and redirected
  } catch (error) {
    console.error("Login failed:", errorUtils.getErrorMessage(error));
  }
};
```

### Register

```typescript
const handleRegister = async (userData: RegisterData) => {
  try {
    await register(userData);
    // User is now registered and logged in
  } catch (error) {
    console.error("Registration failed:", errorUtils.getErrorMessage(error));
  }
};
```

### Update Profile

```typescript
const handleUpdateProfile = async (profileData: Partial<User>) => {
  try {
    await updateProfile(profileData);
    // Profile updated successfully
  } catch (error) {
    console.error("Profile update failed:", errorUtils.getErrorMessage(error));
  }
};
```

### Change Password

```typescript
const handleChangePassword = async (passwordData: {oldPassword: string; newPassword: string}) => {
  try {
    await changePassword(passwordData);
    // Password changed successfully
  } catch (error) {
    console.error("Password change failed:", errorUtils.getErrorMessage(error));
  }
};
```

## Service Management Examples

### Get All Services

```typescript
const fetchServices = async () => {
  try {
    const response = await serviceApi.getServices({
      page: 1,
      search: "massage",
      category: "wellness",
    });
    console.log("Services:", response.data.results);
  } catch (error) {
    console.error("Failed to fetch services:", errorUtils.getErrorMessage(error));
  }
};
```

### Create a Service

```typescript
const createService = async (serviceData: CreateServiceData) => {
  try {
    const response = await serviceApi.createService(serviceData);
    console.log("Service created:", response.data);
  } catch (error) {
    console.error("Failed to create service:", errorUtils.getErrorMessage(error));
  }
};
```

### Upload Service Image

```typescript
const uploadServiceImage = async (serviceId: number, file: File) => {
  try {
    const response = await apiUtils.uploadFile(
      file,
      `/services/${serviceId}/upload-image/`,
      (progress) => {
        console.log(`Upload progress: ${progress}%`);
      }
    );
    console.log("Image uploaded:", response.data);
  } catch (error) {
    console.error("Failed to upload image:", errorUtils.getErrorMessage(error));
  }
};
```

## Reservation Management Examples

### Get User Reservations

```typescript
const fetchUserReservations = async (userId: number) => {
  try {
    const response = await reservationApi.getReservations({
      user: userId,
      status: "confirmed",
    });
    console.log("Reservations:", response.data.results);
  } catch (error) {
    console.error("Failed to fetch reservations:", errorUtils.getErrorMessage(error));
  }
};
```

### Create a Reservation

```typescript
const createReservation = async (reservationData: CreateReservationData) => {
  try {
    const response = await reservationApi.createReservation(reservationData);
    console.log("Reservation created:", response.data);
  } catch (error) {
    console.error("Failed to create reservation:", errorUtils.getErrorMessage(error));
  }
};
```

### Cancel a Reservation

```typescript
const cancelReservation = async (reservationId: number) => {
  try {
    const response = await reservationApi.cancelReservation(reservationId);
    console.log("Reservation cancelled:", response.data);
  } catch (error) {
    console.error("Failed to cancel reservation:", errorUtils.getErrorMessage(error));
  }
};
```

## Review Management Examples

### Get Service Reviews

```typescript
const fetchServiceReviews = async (serviceId: number) => {
  try {
    const response = await reviewApi.getReviews({
      service: serviceId,
      minRating: 4,
    });
    console.log("Reviews:", response.data.results);
  } catch (error) {
    console.error("Failed to fetch reviews:", errorUtils.getErrorMessage(error));
  }
};
```

### Create a Review

```typescript
const createReview = async (reviewData: CreateReviewData) => {
  try {
    const response = await reviewApi.createReview(reviewData);
    console.log("Review created:", response.data);
  } catch (error) {
    console.error("Failed to create review:", errorUtils.getErrorMessage(error));
  }
};
```

## Advanced Examples

### Retry Failed Requests

```typescript
const fetchDataWithRetry = async () => {
  try {
    const data = await apiUtils.retryRequest(
      () => serviceApi.getServices(),
      3, // max retries
      1000 // initial delay in ms
    );
    console.log("Data fetched with retry:", data);
  } catch (error) {
    console.error("Failed after retries:", errorUtils.getErrorMessage(error));
  }
};
```

### Batch Requests

```typescript
const fetchMultipleData = async () => {
  try {
    const [services, reservations, reviews] = await apiUtils.batchRequests([
      () => serviceApi.getServices(),
      () => reservationApi.getReservations(),
      () => reviewApi.getReviews(),
    ]);

    console.log("Batch data:", {services, reservations, reviews});
  } catch (error) {
    console.error("Batch request failed:", errorUtils.getErrorMessage(error));
  }
};
```

### Debounced Search

```typescript
const [searchTerm, setSearchTerm] = useState("");

const debouncedSearch = apiUtils.debounce(async (term: string) => {
  if (term) {
    try {
      const response = await serviceApi.getServices({search: term});
      console.log("Search results:", response.data.results);
    } catch (error) {
      console.error("Search failed:", errorUtils.getErrorMessage(error));
    }
  }
}, 300);

useEffect(() => {
  debouncedSearch(searchTerm);
}, [searchTerm]);
```

## Error Handling Examples

### Comprehensive Error Handling

```typescript
const handleApiCall = async () => {
  try {
    const response = await serviceApi.getServices();
    return response.data;
  } catch (error) {
    if (errorUtils.isNetworkError(error)) {
      console.error("Network error - check your connection");
    } else if (errorUtils.isAuthError(error)) {
      console.error("Authentication error - please login again");
      // Redirect to login
    } else if (errorUtils.isPermissionError(error)) {
      console.error("Permission error - insufficient privileges");
    } else if (errorUtils.isValidationError(error)) {
      const validationErrors = errorUtils.getValidationErrors(error);
      console.error("Validation errors:", validationErrors);
    } else {
      console.error("Unexpected error:", errorUtils.getErrorMessage(error));
    }
    throw error;
  }
};
```

## Protected Route Examples

### Basic Protected Route

```typescript
import {ProtectedRoute} from "@/components/ProtectedRoute";

function Dashboard() {
  return (
    <ProtectedRoute>
      <div>Protected content here</div>
    </ProtectedRoute>
  );
}
```

### Admin Only Route

```typescript
function AdminPanel() {
  return (
    <ProtectedRoute requireRoles={["staff", "superuser"]}>
      <div>Admin content here</div>
    </ProtectedRoute>
  );
}
```

### Custom Fallback

```typescript
function PremiumContent() {
  return (
    <ProtectedRoute
      fallback={
        <div className="text-center p-8">
          <h2>Premium Content</h2>
          <p>Please upgrade your account to access this content.</p>
        </div>
      }>
      <div>Premium content here</div>
    </ProtectedRoute>
  );
}
```

## Form Integration Examples

### Login Form

```typescript
import {useState} from "react";
import {useAuth} from "@/hooks/useAuth";

function LoginForm() {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const {login, error, clearError} = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        placeholder="Email"
      />
      <input
        type="password"
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        placeholder="Password"
      />
      {error && (
        <div className="error-message">
          {error}
          <button type="button" onClick={clearError}>
            ×
          </button>
        </div>
      )}
      <button type="submit">Login</button>
    </form>
  );
}
```

## Best Practices

1. **Always handle errors**: Use the `errorUtils` to get meaningful error messages
2. **Use TypeScript types**: Import and use the provided types for better type safety
3. **Implement loading states**: Use the `isLoading` state from hooks
4. **Clear errors**: Use `clearError` when user starts typing or retries
5. **Use protected routes**: Wrap sensitive content with `ProtectedRoute`
6. **Debounce search**: Use `apiUtils.debounce` for search functionality
7. **Retry failed requests**: Use `apiUtils.retryRequest` for network issues
8. **Batch requests**: Use `apiUtils.batchRequests` for multiple API calls

## Environment Configuration

Make sure to set up your environment variables:

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

For production:

```env
# .env.production
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```


