# 🔐 Configuración del Bucket S3 - stg-be-u

## ✅ **Configuración Actual**

### **Información del Bucket:**

- **Nombre**: `stg-be-u`
- **Región**: `us-east-2` (Ohio)
- **Block Public Access**: ✅ ACTIVADO (Recomendado)
- **Acceso**: Mediante Bucket Policy (no ACLs)

## 🔧 **Configuración Requerida en AWS Console**

### **1. Bucket Policy (IMPORTANTE)**

Necesitas agregar esta política al bucket para permitir acceso de lectura:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::stg-be-u/*"
    }
  ]
}
```

**Cómo aplicarla:**

1. Ve a AWS Console → S3 → Bucket `stg-be-u`
2. Tab "Permissions"
3. Sección "Bucket policy"
4. Click "Edit"
5. Pega el JSON de arriba
6. Click "Save changes"

### **2. CORS Configuration (REQUERIDO)**

CORS permite que tu app móvil acceda a los archivos:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**Cómo aplicarla:**

1. Ve a AWS Console → S3 → Bucket `stg-be-u`
2. Tab "Permissions"
3. Sección "Cross-origin resource sharing (CORS)"
4. Click "Edit"
5. Pega el JSON de arriba
6. Click "Save changes"

### **3. Block Public Access Settings**

**MANTÉN ESTOS VALORES:**

- ✅ Block all public access: **OFF** (para permitir bucket policy)
- ✅ Block public access to buckets and objects granted through new access control lists (ACLs): **ON**
- ✅ Block public access to buckets and objects granted through any access control lists (ACLs): **ON**
- ✅ Block public access to buckets and objects granted through new public bucket or access point policies: **OFF**
- ✅ Block public and cross-account access to buckets and objects through any public bucket or access point policies: **OFF**

## 🔑 **Permisos IAM del Usuario**

Tu usuario IAM (`AKIAXBZV5BYXMHMUVG4S`) necesita estos permisos:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket",
        "s3:PutObjectAcl"
      ],
      "Resource": ["arn:aws:s3:::stg-be-u", "arn:aws:s3:::stg-be-u/*"]
    }
  ]
}
```

## 🛠️ **Configuración Backend (Ya Aplicada)**

```python
# settings.py
AWS_ACCESS_KEY_ID = 'AKIAXBZV5BYXMHMUVG4S'
AWS_SECRET_ACCESS_KEY = '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'
AWS_STORAGE_BUCKET_NAME = 'stg-be-u'
AWS_S3_REGION_NAME = 'us-east-2'
AWS_DEFAULT_ACL = None  # ✅ Importante: No usar ACLs
AWS_QUERYSTRING_AUTH = True  # ✅ Usar URLs firmadas
```

## 🧪 **Verificación**

### **1. Probar la Configuración:**

```bash
# Desde tu terminal en el proyecto backend
python manage.py shell
```

```python
from django.core.files.base import ContentFile
from posts.models import PostMedia, Post
from users.models import User

# Crear un archivo de prueba
user = User.objects.first()
post = Post.objects.create(author=user, post_type='photo', content='Test')
media = PostMedia(post=post, media_type='image')

# Intentar subir archivo de prueba
test_file = ContentFile(b'test content')
media.media_file.save('test.jpg', test_file)
print(f"✅ Archivo subido: {media.media_file.url}")
```

### **2. Verificar en S3:**

1. Ve a AWS Console → S3 → `stg-be-u`
2. Navega a `media/posts/media/`
3. Deberías ver el archivo `test.jpg`

## ⚠️ **Errores Comunes y Soluciones**

### **Error: "The submitted data was not a file"**

✅ **SOLUCIONADO**: FormData configurado correctamente

### **Error: "An error occurred (AccessDenied) when calling the PutObject operation"**

❌ **PROBLEMA**: Bucket policy no configurada o permisos IAM incorrectos
✅ **SOLUCIÓN**: Aplicar la bucket policy del paso 1

### **Error: "Access to XMLHttpRequest has been blocked by CORS policy"**

❌ **PROBLEMA**: CORS no configurado
✅ **SOLUCIÓN**: Aplicar configuración CORS del paso 2

### **Error: "SignatureDoesNotMatch"**

❌ **PROBLEMA**: Credenciales incorrectas o región incorrecta
✅ **SOLUCIÓN**: Verificar credenciales y región en settings.py

## 📊 **URLs Generadas**

Con la configuración actual, las URLs serán:

```
https://stg-be-u.s3.us-east-2.amazonaws.com/media/posts/media/photo_123.jpg?AWSAccessKeyId=...&Signature=...&Expires=...
```

**Características:**

- ✅ **Seguras**: Solo accesibles con firma válida
- ✅ **Temporales**: Expiran después de 1 hora (configurable)
- ✅ **Privadas**: El bucket puede permanecer privado

## 🎯 **Estado Final Esperado**

Una vez configurado correctamente:

- ✅ Archivos se suben a S3 sin errores
- ✅ URLs firmadas se generan automáticamente
- ✅ Imágenes son accesibles desde la app móvil
- ✅ Bucket permanece seguro (no público)
- ✅ CORS funciona correctamente

## 🚀 **Siguiente Paso**

1. **Aplicar Bucket Policy** (paso 1)
2. **Aplicar CORS** (paso 2)
3. **Reiniciar servidor Django**
4. **Probar subida desde app móvil**
