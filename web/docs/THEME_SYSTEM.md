# Sistema de Temas - nabbi (web)

Cómo funciona el ThemeProvider y las variables CSS en web.

> **Brand / tokens / CTA / forms:** [`DESIGN_SYSTEM.md`](../../DESIGN_SYSTEM.md)

## Temas de producto

Solo **`light`** y **`dark`**:

| Tema | Fondo (`--color-background`) | Primary |
|------|------------------------------|---------|
| `light` | `#FAF8F3` (cream) | `#558367` |
| `dark` | `#0F1A14` (forest) | `#558367` |

Los temas `blue` / `green` / `purple` fueron eliminados. Si `localStorage.theme` tiene un valor legacy, se migra a `light`.

## Archivos

```
web/
├── app/globals.css                 # Tokens :root / [data-theme="light|dark"]
├── constants/brand.ts              # getSurfaces(mode)
├── components/ThemeProvider.tsx    # light | dark
├── components/ThemeModeSwitch.tsx  # Toggle sol/luna
└── components/ThemeToggle.tsx      # Dropdown (mismas opciones)
```

## Uso

```typescript
import {useTheme} from "@/components/ThemeProvider";
import {ThemeModeSwitch} from "@/components/ThemeModeSwitch";

const {theme, setTheme} = useTheme();
setTheme("dark"); // o "light"

<ThemeModeSwitch />
```

## Clases Tailwind

```typescript
<div className="bg-background text-foreground">
<button className="bg-primary text-primary-foreground">
<button className="bg-secondary text-secondary-foreground"> {/* CTA yellow */}
```
