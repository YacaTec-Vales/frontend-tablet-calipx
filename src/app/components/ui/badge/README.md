# app-badge

Etiquetas visuales utilizadas para mostrar estados del flujo de negocio (Ej: VERIFICADA, RECHAZADA, PRE-AUTORIZADO).

## Uso

```html
<app-badge text="VERIFICADA" variant="success"></app-badge>
<app-badge text="RECHAZADA" variant="error"></app-badge>
<app-badge text="EN REVISIÓN" variant="warning"></app-badge>
```

## Propiedades

- `text`: `string`. Texto a mostrar dentro del badge.
- `variant`: `success` | `error` | `warning` | `info` | `default`. Determina el color (verde, rojo, amarillo, azul, gris). Default: `default`.
