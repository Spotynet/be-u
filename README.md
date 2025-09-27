# Be-U Project

Plataforma de bienestar y belleza personal. Descubre servicios, reserva citas y conéctate con profesionales que te ayudan a ser tu mejor versión.

## 🚀 Inicio Rápido

### Opción 1: Script Automático (Recomendado)

**Windows:**

```bash
start-servers.bat
```

**Linux/Mac:**

```bash
chmod +x start-servers.sh
./start-servers.sh
```

### Opción 2: Manual

**1. Backend Django (Puerto 8000):**

```bash
cd backend
python run_server.py
```

**2. Frontend Next.js (Puerto 3000):**

```bash
cd web
npm run dev
```

## 🌐 URLs de Desarrollo

- **Frontend**: http://localhost:3000/
- **API**: http://localhost:3000/api/ (proxied)
- **Admin Django**: http://localhost:3000/api/admin/

## 📁 Estructura del Proyecto

```
be-u/
├── backend/                 # Django Backend
│   ├── backend/            # Configuración principal
│   ├── users/              # App de usuarios
│   ├── services/           # App de servicios
│   ├── reservations/       # App de reservas
│   ├── reviews/            # App de reseñas
│   └── run_server.py       # Script para ejecutar en puerto 3000
├── web/                    # Next.js Frontend
│   ├── app/                # App Router de Next.js
│   ├── components/         # Componentes reutilizables
│   ├── lib/                # Utilidades (API, etc.)
│   └── docs/               # Documentación
├── mobile/                 # React Native App
└── start-servers.*         # Scripts para iniciar servidores
```

## 🛠️ Tecnologías

### Backend

- **Django 5.2** - Framework web
- **Django REST Framework** - API REST
- **PostgreSQL** - Base de datos (producción)
- **SQLite** - Base de datos (desarrollo)

### Frontend

- **Next.js 15** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Axios** - Cliente HTTP

### Mobile

- **React Native** - Desarrollo móvil
- **Expo** - Herramientas de desarrollo

## 📚 Documentación

- [API Usage Guide](web/docs/API_USAGE.md)
- [Theme System](web/docs/THEME_SYSTEM.md)
- [Backend Setup](backend/README.md)

## 🔧 Configuración

### Variables de Entorno

**Frontend** (`web/.env.local`):

```env
NEXT_PUBLIC_API_URL=/api
```

**Backend** (`backend/.env`):

```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
```

## 🚀 Despliegue

### Desarrollo

1. Ejecutar `start-servers.bat` (Windows) o `./start-servers.sh` (Linux/Mac)
2. Acceder a http://localhost:3001

### Producción

- Backend: Configurar en servidor con puerto 3000
- Frontend: Build y deploy en servidor web
- Mobile: Build con Expo/EAS

## 📝 Notas

- El backend Django corre en puerto 8000 (interno)
- El frontend Next.js corre en puerto 3000 (público)
- Las llamadas a `/api/*` se redirigen automáticamente al backend Django
- No se necesita CORS gracias al proxy de Next.js
- El admin de Django está disponible en `http://localhost:3000/api/admin/`
