# Restart Servers to Apply Admin Fix

## Step 1: Stop Current Servers

- Stop your Django backend (Ctrl+C)
- Stop your Next.js frontend (Ctrl+C)

## Step 2: Restart Backend

```bash
cd backend
python manage.py runserver 8000
```

## Step 3: Restart Frontend (in a new terminal)

```bash
cd web
npm run dev
```

## Step 4: Test Admin Access

Navigate to: http://localhost:3000/api/admin/

You should now see the Django admin login page with proper styling!

## If you need a superuser account:

```bash
cd backend
python manage.py createsuperuser
```
