# Sistema de Temas - Be-U

Este documento explica cómo usar el sistema de temas implementado en el proyecto Be-U.

## Características

- ✅ **5 temas predefinidos**: Light, Dark, Blue, Green, Purple
- ✅ **Variables CSS personalizadas** para todos los colores
- ✅ **Componentes reutilizables** que se adaptan automáticamente
- ✅ **Cambio de tema en tiempo real** sin recarga de página
- ✅ **Persistencia** del tema seleccionado en localStorage
- ✅ **Transiciones suaves** entre temas
- ✅ **Tipos TypeScript** completos

## Estructura de Archivos

```
web/
├── tailwind.config.js          # Configuración de Tailwind con variables CSS
├── app/globals.css             # Variables CSS para todos los temas
├── components/
│   ├── ThemeProvider.tsx       # Provider y hook para manejo de temas
│   ├── ThemeToggle.tsx         # Componente para cambiar temas
│   └── ui/                     # Componentes UI que usan el sistema de temas
│       ├── Card.tsx
│       ├── Button.tsx
│       └── Input.tsx
```

## Temas Disponibles

### 1. Light (Por defecto)

- **Colores**: Azul profesional con fondo blanco
- **Uso**: Ideal para aplicaciones corporativas y profesionales

### 2. Dark

- **Colores**: Azul claro sobre fondo oscuro
- **Uso**: Perfecto para uso nocturno y reducir fatiga visual

### 3. Blue

- **Colores**: Paleta completa de azules
- **Uso**: Tema acuático y refrescante

### 4. Green

- **Colores**: Verdes naturales y frescos
- **Uso**: Ideal para aplicaciones de salud y bienestar

### 5. Purple

- **Colores**: Púrpuras creativos y modernos
- **Uso**: Perfecto para aplicaciones creativas y artísticas

## Variables CSS Disponibles

### Colores de Fondo

```css
--color-background              /* Fondo principal */
--color-background-secondary    /* Fondo secundario */
```

### Colores de Texto

```css
--color-foreground              /* Texto principal */
--color-foreground-secondary    /* Texto secundario */
--color-foreground-muted        /* Texto atenuado */
```

### Colores de Tarjetas

```css
--color-card                    /* Fondo de tarjetas */
--color-card-foreground         /* Texto en tarjetas */
--color-card-border             /* Borde de tarjetas */
```

### Colores Primarios

```css
--color-primary                 /* Color primario */
--color-primary-foreground      /* Texto sobre primario */
--color-primary-hover           /* Hover del primario */
--color-primary-light           /* Versión clara del primario */
--color-primary-dark            /* Versión oscura del primario */
```

### Colores de Estado

```css
--color-success                 /* Éxito */
--color-warning                 /* Advertencia */
--color-error                   /* Error */
```

## Uso en Componentes

### Hook useTheme

```typescript
import {useTheme} from "@/components/ThemeProvider";

function MyComponent() {
  const {theme, setTheme, availableThemes} = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme("dark")}>Switch to Dark</button>
    </div>
  );
}
```

### Componente ThemeToggle

```typescript
import { ThemeToggle } from '@/components/ThemeToggle';

// Variante dropdown (por defecto)
<ThemeToggle />

// Variante compacta
<ThemeToggle variant="compact" />

// Variante botón
<ThemeToggle variant="button" />
```

### Clases de Tailwind

```typescript
// Fondo
<div className="bg-background">          // Fondo principal
<div className="bg-card">                // Fondo de tarjeta

// Texto
<h1 className="text-foreground">         // Texto principal
<p className="text-foreground-secondary"> // Texto secundario

// Botones
<button className="bg-primary text-primary-foreground hover:bg-primary-hover">
<button className="bg-secondary text-secondary-foreground">

// Bordes
<div className="border border-border">   // Borde estándar
<div className="border border-card-border"> // Borde de tarjeta
```

## Componentes UI

### Card

```typescript
import {Card, CardHeader, CardContent, CardFooter} from "@/components/ui/Card";

<Card hover>
  <CardHeader>
    <h3>Title</h3>
  </CardHeader>
  <CardContent>
    <p>Content goes here</p>
  </CardContent>
  <CardFooter>
    <button>Action</button>
  </CardFooter>
</Card>;
```

### Button

```typescript
import { Button } from '@/components/ui/Button';

<Button variant="primary" size="lg">Primary Button</Button>
<Button variant="secondary">Secondary Button</Button>
<Button variant="accent">Accent Button</Button>
<Button variant="success">Success Button</Button>
<Button variant="warning">Warning Button</Button>
<Button variant="error">Error Button</Button>
<Button variant="ghost">Ghost Button</Button>
```

### Input

```typescript
import {Input} from "@/components/ui/Input";

<Input
  label="Email"
  placeholder="Enter your email"
  error="This field is required"
  helperText="We'll never share your email"
/>;
```

## Configuración

### 1. Configurar el ThemeProvider

En `app/layout.tsx`:

```typescript
import {ThemeProvider} from "@/components/ThemeProvider";

export default function RootLayout({children}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider defaultTheme="light">{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

### 2. Agregar Nuevos Temas

En `app/globals.css`, agregar un nuevo tema:

```css
[data-theme="orange"] {
  --color-background: #fff7ed;
  --color-foreground: #9a3412;
  --color-primary: #ea580c;
  /* ... más variables */
}
```

En `components/ThemeProvider.tsx`, agregar el tema a `availableThemes`:

```typescript
const availableThemes = [
  // ... temas existentes
  {
    value: "orange" as Theme,
    label: "Orange",
    description: "Warm orange theme",
  },
];
```

### 3. Personalizar Variables

Para cambiar colores específicos, modifica las variables CSS en `globals.css`:

```css
:root {
  --color-primary: #your-color;
  --color-primary-hover: #your-hover-color;
}
```

## Mejores Prácticas

### 1. Usar Variables CSS

```typescript
// ✅ Correcto
<div className="bg-card text-card-foreground">

// ❌ Incorrecto
<div className="bg-white text-black">
```

### 2. Usar Componentes UI

```typescript
// ✅ Correcto
<Button variant="primary">Click me</Button>

// ❌ Incorrecto
<button className="bg-blue-500 text-white px-4 py-2">
```

### 3. Probar en Todos los Temas

Siempre verifica que tus componentes se vean bien en todos los temas disponibles.

### 4. Usar Transiciones

```typescript
// ✅ Correcto
<div className="theme-transition">

// ❌ Incorrecto
<div> // Sin transición
```

## Ejemplos de Uso

### Página con Cambio de Tema

```typescript
"use client";

import {ThemeToggle} from "@/components/ThemeToggle";
import {Card, CardContent} from "@/components/ui/Card";
import {Button} from "@/components/ui/Button";

export default function MyPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b border-border">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-foreground">My App</h1>
          <ThemeToggle variant="compact" />
        </div>
      </header>

      <main className="p-8">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-card-foreground mb-4">Welcome</h2>
            <p className="text-foreground-secondary mb-4">
              This page adapts to the selected theme.
            </p>
            <Button variant="primary">Get Started</Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```

## Troubleshooting

### Problema: Los colores no cambian

**Solución**: Verifica que estés usando las clases de Tailwind correctas (`bg-card` en lugar de `bg-white`).

### Problema: Transiciones no funcionan

**Solución**: Asegúrate de que el elemento tenga la clase `theme-transition`.

### Problema: Tema no se persiste

**Solución**: Verifica que el `ThemeProvider` esté configurado correctamente en el layout.

### Problema: Hydration mismatch

**Solución**: El hook `useTheme` maneja esto automáticamente, pero asegúrate de que no estés usando `useTheme` en el servidor.

## Extensibilidad

El sistema está diseñado para ser fácilmente extensible:

1. **Nuevos temas**: Agrega variables CSS y actualiza `availableThemes`
2. **Nuevos colores**: Agrega variables CSS y actualiza `tailwind.config.js`
3. **Nuevos componentes**: Usa las variables CSS existentes
4. **Personalización**: Modifica las variables CSS según tus necesidades

¡El sistema de temas está listo para usar y es completamente personalizable!
