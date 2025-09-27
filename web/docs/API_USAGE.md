# API Utilities Usage Guide

Este documento explica cómo usar las utilidades de API creadas para el proyecto Be-U.

## Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto web con:

```env
NEXT_PUBLIC_API_URL=/api
```

### Estructura de Archivos

```
web/
├── lib/
│   └── api.ts              # Utilidades principales de API
├── types/
│   └── api.ts              # Tipos TypeScript para API
├── hooks/
│   └── useAuth.ts          # Hook de autenticación
└── components/
    └── ProtectedRoute.tsx  # Componente de protección de rutas
```

## Uso Básico

### Importar las utilidades

```typescript
import {api, authApi, tokenUtils} from "@/lib/api";
import {LoginCredentials, RegisterData} from "@/types/api";
```

### Llamadas API Genéricas

```typescript
// GET request
const users = await api.get("/users/");

// POST request
const newUser = await api.post("/users/", {name: "John", email: "john@example.com"});

// PUT request
const updatedUser = await api.put("/users/1/", {name: "Jane"});

// DELETE request
await api.delete("/users/1/");
```

### Autenticación

```typescript
// Login
const credentials: LoginCredentials = {
  email: "user@example.com",
  password: "password123",
};
const response = await authApi.login(credentials);
tokenUtils.setToken(response.data.token);

// Register
const registerData: RegisterData = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  password: "password123",
};
const response = await authApi.register(registerData);

// Logout
await authApi.logout();
tokenUtils.removeToken();
```

### Manejo de Errores

```typescript
try {
  const response = await authApi.login(credentials);
  // Manejar respuesta exitosa
} catch (error) {
  const apiError = error as ApiError;
  console.error("Error:", apiError.message);
  console.error("Status:", apiError.status);
  console.error("Validation errors:", apiError.errors);
}
```

## Hook de Autenticación

### Usar el AuthProvider

Envuelve tu aplicación con el AuthProvider en `layout.tsx`:

```typescript
import {AuthProvider} from "@/hooks/useAuth";

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

### Usar el hook useAuth

```typescript
import {useAuth} from "@/hooks/useAuth";

function MyComponent() {
  const {user, isAuthenticated, login, logout, isLoading} = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.firstName}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={() => login({email: "test@test.com", password: "password"})}>Login</button>
      )}
    </div>
  );
}
```

## Protección de Rutas

```typescript
import {ProtectedRoute} from "@/components/ProtectedRoute";

function Dashboard() {
  return (
    <ProtectedRoute>
      <div>Contenido protegido</div>
    </ProtectedRoute>
  );
}
```

## Configuración del Backend Django

Para que funcione correctamente, tu backend Django debe tener estos endpoints:

### URLs de Autenticación

```python
# urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)

urlpatterns = [
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/profile/', views.ProfileView.as_view(), name='profile'),
    path('', include(router.urls)),
]
```

### Configuración CORS

Asegúrate de configurar CORS en tu Django:

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Tu frontend Next.js
]

CORS_ALLOW_CREDENTIALS = True
```

### Autenticación JWT (Opcional)

Si usas JWT, instala `djangorestframework-simplejwt`:

```bash
pip install djangorestframework-simplejwt
```

```python
# settings.py
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}
```

## Ejemplos de Uso en Componentes

### Página de Login

```typescript
"use client";

import {useState} from "react";
import {useAuth} from "@/hooks/useAuth";
import {LoginCredentials} from "@/types/api";

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginCredentials>({
    email: "",
    password: "",
  });
  const {login, error, isLoading} = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData);
    } catch (err) {
      // Error ya manejado por el hook
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
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
```

## Características

- ✅ Configuración automática de tokens de autenticación
- ✅ Interceptores para manejo de errores comunes
- ✅ Tipos TypeScript completos
- ✅ Hook de autenticación con contexto
- ✅ Protección de rutas
- ✅ Manejo de errores consistente
- ✅ Timeout configurable
- ✅ Soporte para refresh tokens
- ✅ Funciones de utilidad para tokens
