# app-button

Botón estándar de la plataforma de la tablet. Soporta proyección de contenido (`<ng-content>`) para añadir texto o íconos SVG.

## Uso

```html
<app-button variant="primary" size="md" (onClick)="doSomething()">
  Aceptar
</app-button>

<app-button variant="error" size="md">
  Rechazar
</app-button>
```

## Propiedades

- `variant`: `primary` (guindo) | `secondary` | `outline` | `error` (rojo). Default: `primary`.
- `size`: `sm` | `md` | `lg`. Default: `md`.
- `disabled`: `boolean`. Default: `false`.
- `fullWidth`: `boolean`. Default: `false`.
- `type`: `button` | `submit` | `reset`. Default: `button`.
