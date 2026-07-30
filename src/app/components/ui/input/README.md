# app-input

Componente de formulario reutilizable que soporta múltiples tipos (texto, textarea y subida de archivos), además de interactuar nativamente con `[(ngModel)]` de Angular gracias a `ControlValueAccessor`.

## Uso (Texto)

```html
<app-input 
  label="Nombre de Distribuidora" 
  placeholder="Ej. María López" 
  [(ngModel)]="nombre">
</app-input>
```

## Uso (Textarea)

```html
<app-input 
  type="textarea"
  label="Dictamen u Observaciones" 
  [rows]="5"
  hint="Explica por qué estás rechazando la solicitud."
  [(ngModel)]="comentarios">
</app-input>
```

## Uso (Subida de Evidencia / Archivos)

El tipo `file` tiene un diseño especial arrastrable.

```html
<app-input 
  type="file"
  label="Fotografía del Domicilio" 
  [(ngModel)]="archivoDomicilio">
</app-input>
```

## Propiedades

- `type`: `'text' | 'email' | 'password' | 'number' | 'textarea' | 'file'`. Default: `'text'`.
- `label`: `string`.
- `placeholder`: `string`.
- `hint`: `string` (Texto secundario explicativo debajo del input).
- `rows`: `number`. (Aplica solo a tipo `textarea`). Default: `4`.
