# app-table

Componente base para mostrar listados de información en formato tabular, especialmente útil en pantallas de Tablet donde hay suficiente ancho. 

El componente renderiza los encabezados automáticamente a partir del Input `columns`, y permite proyectar el contenido dinámico de las filas (`<tr>`) mediante `<ng-content>`, lo cual brinda máxima flexibilidad para meter botones, badges o inputs dentro de cada celda.

## Uso

```html
<app-table [columns]="['Folio', 'Distribuidora', 'Estado', 'Acciones']" [isEmpty]="datos.length === 0">
  
  <tr *ngFor="let item of datos" class="bg-white border-b hover:bg-gray-50">
    <th scope="row" class="px-6 py-4 font-bold text-gray-900">{{ item.folio }}</th>
    <td class="px-6 py-4">{{ item.nombre }}</td>
    <td class="px-6 py-4">
      <app-badge [text]="item.estado" variant="warning"></app-badge>
    </td>
    <td class="px-6 py-4">
      <app-button variant="primary" size="sm">Aprobar</app-button>
    </td>
  </tr>

</app-table>
```

## Propiedades

- `columns`: `string[]`. Arreglo con los títulos de cada columna (se renderizan en mayúsculas).
- `isEmpty`: `boolean`. Si es `true`, muestra el mensaje de que no hay registros y se pinta debajo de los encabezados. Default: `false`.
- `emptyMessage`: `string`. Mensaje a mostrar cuando `isEmpty` es `true`. Default: `'No hay registros disponibles.'`.
