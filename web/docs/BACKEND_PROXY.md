# Configuración de Proxy para Backend Django

Este documento explica cómo configurar el proxy en Next.js para que el backend Django corra en la misma dirección que el frontend pero en la ruta `/api`.

## Configuración Actual

### 1. Next.js Proxy (next.config.ts)

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
```

### 2. Configuración de API (lib/api.ts)

```typescript
// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api";
```

## Cómo Funciona

1. **Frontend**: Se ejecuta en `http://localhost:3000`
2. **Backend**: Se ejecuta en `http://localhost:8000`
3. **Proxy**: Next.js redirige automáticamente las llamadas de `/api/*` a `http://localhost:8000/api/*`

## Flujo de Llamadas

```
Frontend (localhost:3000) → /api/auth/login/ → Backend (localhost:8000/api/auth/login/)
```

## Configuración de Entorno

### Desarrollo Local

Crea un archivo `.env.local` en la raíz del proyecto web:

```env
# Para desarrollo local
NEXT_PUBLIC_API_URL=/api
```

### Producción

```env
# Para producción
NEXT_PUBLIC_API_URL=https://tu-dominio.com/api
```

## Configuración del Backend Django

### 1. Configurar CORS

En `backend/settings.py`:

```python
# Configuración CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Frontend Next.js
    "https://tu-dominio.com",  # Producción
]

CORS_ALLOW_CREDENTIALS = True

# Headers permitidos
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]
```

### 2. Configurar URLs

En `backend/urls.py`:

```python
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('api/', include('tu_app.urls')),
    # ... otras URLs
]

# Para servir archivos estáticos en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

### 3. Configurar Settings

En `backend/settings.py`:

```python
# Configuración para desarrollo
DEBUG = True

# Hosts permitidos
ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'tu-dominio.com']

# Configuración de base de datos
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Configuración de archivos estáticos
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
```

## Comandos para Ejecutar

### Desarrollo

1. **Backend Django**:
```bash
cd backend
python manage.py runserver 8000
```

2. **Frontend Next.js**:
```bash
cd web
npm run dev
```

### Producción

1. **Backend Django**:
```bash
cd backend
python manage.py collectstatic
gunicorn backend.wsgi:application --bind 0.0.0.0:8000
```

2. **Frontend Next.js**:
```bash
cd web
npm run build
npm start
```

## Estructura de URLs

### Frontend
- `http://localhost:3000/` - Página principal
- `http://localhost:3000/login` - Página de login
- `http://localhost:3000/register` - Página de registro

### Backend (a través del proxy)
- `http://localhost:3000/api/auth/login/` → `http://localhost:8000/api/auth/login/`
- `http://localhost:3000/api/auth/register/` → `http://localhost:8000/api/auth/register/`
- `http://localhost:3000/api/users/` → `http://localhost:8000/api/users/`

## Ventajas de esta Configuración

1. **Mismo dominio**: Frontend y backend comparten el mismo dominio
2. **Sin problemas de CORS**: Las llamadas son del mismo origen
3. **Fácil despliegue**: Un solo dominio para ambos servicios
4. **Cookies compartidas**: Las cookies se pueden compartir entre frontend y backend
5. **SSL/TLS**: Un solo certificado SSL para ambos servicios

## Troubleshooting

### Error: CORS
- Verifica que `CORS_ALLOWED_ORIGINS` incluya tu frontend
- Asegúrate de que `CORS_ALLOW_CREDENTIALS = True`

### Error: 404 en /api
- Verifica que el backend esté ejecutándose en el puerto 8000
- Revisa que las URLs del backend estén configuradas correctamente

### Error: Proxy no funciona
- Reinicia el servidor de Next.js después de cambiar `next.config.ts`
- Verifica que no haya conflictos de puertos

## Ejemplo de Llamada API

```typescript
// En el frontend
import { authApi } from '@/lib/api';

// Esta llamada irá a: http://localhost:3000/api/auth/login/
// Que será redirigida a: http://localhost:8000/api/auth/login/
const response = await authApi.login({
  email: 'user@example.com',
  password: 'password123'
});
```

¡Con esta configuración, tu frontend y backend funcionarán como si fueran un solo servicio!

