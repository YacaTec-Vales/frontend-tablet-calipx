# app-card

Contenedor para separar visualmente bloques de información, ideal para la vista amplia de una Tablet (Dashboard, detalles de solicitudes, etc).

## Uso

```html
<app-card title="Datos de la Distribuidora" subtitle="Auditoría de datos generales">
  <p>Contenido interno de la tarjeta...</p>
</app-card>
```

## Propiedades

- `title`: `string`. Título en el encabezado. (Opcional, si no se envía no se pinta el header).
- `subtitle`: `string`. Subtítulo bajo el título principal.
- `extraClasses`: `string`. Utilizado para pasar utilidades de Tailwind extra (ej. colores de bordes).
- `noPadding`: `boolean`. Default: `false`. Ideal cuando el contenido es una tabla o lista que debe tocar los bordes del card.
