# Guía: Detección de Dispositivos en Angular con CDK y Tailwind CSS

Esta guía explica cómo implementar la detección de dispositivos (Mobile, Tablet, Desktop) en tus proyectos de Angular utilizando `@angular/cdk/layout`. Esta configuración está optimizada para ser **100% compatible con Tailwind CSS y Flowbite**.

---

## 1. Instalación

Si aún no tienes Angular CDK instalado en tu proyecto, ejecuta el siguiente comando en tu terminal:

```bash
npm install @angular/cdk
```

> [!NOTE]
> No necesitas instalar todo Angular Material, el CDK (Component Dev Kit) es un paquete independiente y ligero que proporciona utilidades como esta sin afectar tus estilos visuales.

---

## 2. Configuración del Módulo

Debes importar el `LayoutModule` en el módulo principal de tu aplicación o en el módulo específico donde vayas a utilizar el detector de breakpoints.

Abre tu archivo `app.module.ts` (o el módulo correspondiente) y añade la importación:

```typescript
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LayoutModule } from '@angular/cdk/layout'; // <-- 1. Importar LayoutModule

import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    LayoutModule // <-- 2. Añadirlo a los imports
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

---

## 3. Implementación en el Componente (TypeScript)

Para mantener la coherencia perfecta con las clases responsivas de Tailwind (`md:`, `lg:`), usaremos sus mismas medidas en píxeles.

*   **Mobile**: Menos de 768px
*   **Tablet**: Entre 768px y 1023px
*   **Desktop**: 1024px o más

En tu componente (por ejemplo, `layout.component.ts`), implementa la lógica usando el `BreakpointObserver`:

```typescript
import { Component, OnDestroy, OnInit } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-layout-responsivo',
  templateUrl: './layout-responsivo.component.html'
})
export class LayoutResponsivoComponent implements OnInit, OnDestroy {

  // Subject para limpiar la suscripción cuando el componente se destruya
  private destroyed = new Subject<void>();
  
  // Variables de estado para los 3 "fronts"
  isMobile: boolean = false;
  isTablet: boolean = false;
  isDesktop: boolean = false;

  // Medidas exactas basadas en Tailwind CSS
  private mobileQuery = '(max-width: 767px)';
  private tabletQuery = '(min-width: 768px) and (max-width: 1023px)';
  private desktopQuery = '(min-width: 1024px)';

  constructor(private breakpointObserver: BreakpointObserver) { }

  ngOnInit() {
    this.breakpointObserver
      .observe([this.mobileQuery, this.tabletQuery, this.desktopQuery])
      .pipe(takeUntil(this.destroyed))
      .subscribe(() => {
        // Se ejecuta cada vez que la pantalla cruza uno de los breakpoints
        
        this.isMobile = this.breakpointObserver.isMatched(this.mobileQuery);
        this.isTablet = this.breakpointObserver.isMatched(this.tabletQuery);
        this.isDesktop = this.breakpointObserver.isMatched(this.desktopQuery);

        this.validarProporciones();
      });
  }

  // Método donde puedes colocar tu lógica específica para cada dispositivo
  validarProporciones() {
    if (this.isMobile) {
      console.log('Inicializando vista para MOBILE');
      // Lógica específica para mobile (ej. cerrar menús laterales por defecto)
    } 
    else if (this.isTablet) {
      console.log('Inicializando vista para TABLET');
      // Lógica específica para tablet
    } 
    else if (this.isDesktop) {
      console.log('Inicializando vista para DESKTOP');
      // Lógica específica para desktop (ej. abrir menús laterales)
    }
  }

  ngOnDestroy() {
    // Evita fugas de memoria (memory leaks)
    this.destroyed.next();
    this.destroyed.complete();
  }
}
```

> [!IMPORTANT]
> El uso de `takeUntil(this.destroyed)` en el `pipe` es crucial. Si no cancelas la suscripción al destruir el componente, Angular seguirá escuchando los cambios de tamaño de pantalla en segundo plano, lo que puede causar problemas de rendimiento o errores.

---

## 4. Uso en la Plantilla (HTML)

Ahora que tienes las variables `isMobile`, `isTablet` e `isDesktop` evaluándose en tiempo real, puedes usarlas en tu HTML para renderizar u ocultar los diferentes "fronts" de los que hablabas.

```html
<!-- Cargar el "Front" de Desktop -->
<div *ngIf="isDesktop">
  <app-desktop-view></app-desktop-view>
</div>

<!-- Cargar el "Front" de Tablet -->
<div *ngIf="isTablet">
  <app-tablet-view></app-tablet-view>
</div>

<!-- Cargar el "Front" de Mobile -->
<div *ngIf="isMobile">
  <app-mobile-view></app-mobile-view>
</div>

<!-- Ejemplo combinando con Flowbite -->
<div class="p-4" [ngClass]="{
  'bg-blue-100': isDesktop,
  'bg-green-100': isTablet,
  'bg-yellow-100': isMobile
}">
  <h2 class="text-xl font-bold">
    Vista actual: 
    <span *ngIf="isDesktop">Desktop</span>
    <span *ngIf="isTablet">Tablet</span>
    <span *ngIf="isMobile">Mobile</span>
  </h2>
</div>
```

> [!TIP]
> **Rendimiento:** Utilizar `*ngIf` es mejor que ocultar cosas con clases CSS (como `hidden md:block`) si los componentes son muy pesados (tablas gigantes, gráficos, etc.), porque `*ngIf` evita que esos componentes pesados siquiera se procesen o existan en el DOM si no estás en la pantalla correcta.
