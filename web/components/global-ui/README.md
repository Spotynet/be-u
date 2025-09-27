# Global UI Components

Esta carpeta contiene componentes de UI reutilizables que utilizan las clases de los temas del sistema.

## ThemeInput

Un componente de input reutilizable que se adapta a diferentes temas y estilos.

### Props

| Prop         | Tipo                                     | Default     | Descripción                 |
| ------------ | ---------------------------------------- | ----------- | --------------------------- |
| `label`      | `string`                                 | -           | Etiqueta del input          |
| `error`      | `string`                                 | -           | Mensaje de error            |
| `helperText` | `string`                                 | -           | Texto de ayuda              |
| `icon`       | `ReactNode`                              | -           | Icono a mostrar en el input |
| `variant`    | `"default" \| "minimal" \| "futuristic"` | `"default"` | Estilo del input            |
| `size`       | `"sm" \| "md" \| "lg"`                   | `"md"`      | Tamaño del input            |

### Variantes

#### Default

- Estilo estándar con bordes y fondo
- Usa las clases de tema del sistema
- Ideal para formularios regulares

#### Minimal

- Estilo minimalista con solo borde inferior
- Fondo transparente
- Ideal para formularios limpios

#### Futuristic

- Estilo futurista con efectos de neón
- Fondo semi-transparente con blur
- Bordes púrpura con sombras
- Ideal para interfaces modernas

### Ejemplos de Uso

```tsx
import { ThemeInput } from '@/components/global-ui';

// Input básico
<ThemeInput
  label="Email"
  placeholder="Ingresa tu email"
  type="email"
/>

// Input con icono
<ThemeInput
  label="Usuario"
  placeholder="Ingresa tu usuario"
  icon={<UserIcon />}
/>

// Input minimalista
<ThemeInput
  label="Contraseña"
  type="password"
  variant="minimal"
  placeholder="Ingresa tu contraseña"
/>

// Input futurista
<ThemeInput
  label="Código"
  variant="futuristic"
  size="lg"
  placeholder="Ingresa el código"
/>

// Input con error
<ThemeInput
  label="Email"
  error="El email es requerido"
  placeholder="Ingresa tu email"
/>
```

### Integración con Temas

El componente utiliza automáticamente las clases CSS del sistema de temas:

- `text-foreground` - Color del texto
- `bg-input` - Fondo del input
- `border-input-border` - Color del borde
- `focus:ring-input-focus` - Anillo de enfoque
- `text-error` - Color de error
- `text-foreground-muted` - Texto secundario

Estas clases se adaptan automáticamente cuando cambias el tema de la aplicación.
