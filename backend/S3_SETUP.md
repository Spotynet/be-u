# Configuración de AWS S3 para Be-U

## 📋 Datos Necesarios

Para configurar S3, necesitas los siguientes datos de tu bucket de AWS:

### 1. Credenciales de AWS

- **AWS_ACCESS_KEY_ID**: Tu clave de acceso de AWS
- **AWS_SECRET_ACCESS_KEY**: Tu clave secreta de AWS
- **AWS_STORAGE_BUCKET_NAME**: Nombre de tu bucket S3
- **AWS_S3_REGION_NAME**: Región donde está tu bucket (ej: us-east-1, us-west-2, etc.)

### 2. Configuración del Bucket

- El bucket debe tener permisos públicos para lectura
- Debe permitir CORS para el dominio de tu aplicación
- Debe tener la política de bucket configurada para permitir subidas

## 🔧 Configuración

### 1. Actualizar settings.py

Reemplaza los valores en `backend/backend/settings.py`:

```python
# AWS S3 Configuration
AWS_ACCESS_KEY_ID = 'TU_AWS_ACCESS_KEY_ID'
AWS_SECRET_ACCESS_KEY = 'TU_AWS_SECRET_ACCESS_KEY'
AWS_STORAGE_BUCKET_NAME = 'TU_BUCKET_NAME'
AWS_S3_REGION_NAME = 'us-east-1'  # Cambia a tu región
```

### 2. Política de Bucket S3

Agrega esta política a tu bucket S3:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::TU_BUCKET_NAME/*"
    }
  ]
}
```

### 3. Configuración CORS

Agrega esta configuración CORS a tu bucket:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

## 🚀 Uso

### Subir Archivos

Los archivos se suben automáticamente a S3 cuando se crean posts con media:

```python
# Ejemplo de uso en el frontend
const formData = new FormData();
formData.append('post_type', 'photo');
formData.append('content', 'Mi publicación');
formData.append('media', file); // Archivo de imagen o video

fetch('/api/posts/', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`
    },
    body: formData
});
```

### URLs de Archivos

Los archivos se almacenan en S3 y las URLs se generan automáticamente:

- **Estructura**: `https://tu-bucket.s3.amazonaws.com/media/posts/media/archivo.jpg`
- **Acceso**: Los archivos son públicos y accesibles directamente

## 📁 Estructura de Archivos en S3

```
tu-bucket/
└── media/
    └── posts/
        └── media/
            ├── imagen1.jpg
            ├── video1.mp4
            └── imagen2.png
```

## 🔒 Seguridad

- Los archivos son públicos por defecto
- Se puede configurar autenticación adicional si es necesario
- Las URLs incluyen timestamps para evitar caché

## 🧪 Pruebas

Para probar la configuración:

1. Ejecuta las migraciones: `python manage.py migrate`
2. Crea un post con media desde el frontend
3. Verifica que el archivo se suba a S3
4. Verifica que la URL del archivo sea accesible

## ⚠️ Notas Importantes

- Asegúrate de que tu bucket tenga los permisos correctos
- Las credenciales de AWS deben tener permisos de S3
- El bucket debe estar en la región especificada
- Los archivos se almacenan con nombres únicos para evitar conflictos
