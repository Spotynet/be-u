# Backend Django - Be-U

## Configuración y Ejecución

### 1. Instalar Dependencias

```bash
cd backend
pip install -r requirements.txt
```

### 2. Ejecutar Migraciones

```bash
python manage.py migrate
```

### 3. Crear Superusuario (Opcional)

```bash
python manage.py createsuperuser
```

### 4. Ejecutar el Servidor

**Opción 1: Usando el script personalizado**

```bash
python run_server.py
```

**Opción 2: Usando manage.py directamente**

```bash
python manage.py runserver 8000
```

El servidor se ejecutará en `http://localhost:8000`

## Endpoints Disponibles

### Test

- `GET http://localhost:3000/api/test/` - Endpoint de prueba (a través del proxy)

### Admin Django

- `GET http://localhost:3000/api/admin/` - Panel de administración (a través del proxy)

### Autenticación

- `POST http://localhost:3000/api/auth/login/` - Login de usuario
- `POST http://localhost:3000/api/auth/register/` - Registro de usuario
- `POST http://localhost:3000/api/auth/logout/` - Logout de usuario

### Usuarios

- `GET http://localhost:3000/api/users/` - Lista de usuarios
- `GET http://localhost:3000/api/users/{id}/` - Detalle de usuario
- `GET http://localhost:3000/api/users/me/` - Usuario actual

## Ejemplo de Uso

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Registro

```bash
curl -X POST http://localhost:3000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "firstName": "John", "lastName": "Doe"}'
```

## Configuración con Frontend

El backend Django funciona con proxy de Next.js:

- **Backend Django**: `http://localhost:8000` (interno)
- **Frontend Next.js**: `http://localhost:3000` (público)
- **API endpoints**: `http://localhost:3000/api/*` → `http://localhost:8000/api/*`
- **Admin Django**: `http://localhost:3000/api/admin/`

## Estructura del Proyecto

```
backend/
├── backend/
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── users/
│   ├── models.py
│   ├── views.py
│   ├── serializers.py
│   ├── auth_views.py
│   └── urls.py
├── services/
├── reservations/
├── reviews/
└── manage.py
```
