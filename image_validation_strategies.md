# Estrategias de Validación de Imágenes en Angular

Cuando se suben imágenes (como fotos de credenciales del INE, comprobantes, etc.) desde una aplicación web o móvil, es importante implementar controles en el Frontend para asegurar la calidad, el formato y la veracidad de los archivos antes de enviarlos a la base de datos o servidor de almacenamiento (S3).

A continuación se presentan tres niveles de validación que puedes implementar dependiendo del nivel de control que necesites.

---

## 1. Validación Básica (Nativa - Sin librerías)

Si solo necesitas asegurarte de que el usuario seleccione una imagen y no intente subir archivos exageradamente grandes, puedes usar JavaScript nativo (la interfaz `File`) sin instalar nada extra.

```typescript
function validarArchivoBasico(file: File): string | null {
  // 1. Validar Tipo (MIME Type)
  const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
  if (!tiposPermitidos.includes(file.type)) {
    return 'Error: Solo se permiten imágenes JPG, PNG o WebP.';
  }

  // 2. Validar Tamaño (Ejemplo: máximo 5MB)
  const maxSize = 5 * 1024 * 1024; // 5 MB en bytes
  if (file.size > maxSize) {
    return 'Error: La imagen es muy pesada. (Máximo 5MB)';
  }
  
  return null; // El archivo es válido
}
```

> [!TIP]
> **Pros:** Fácil y rápido de implementar.
> **Contras:** Fácil de evadir si el usuario simplemente le cambia el nombre a `virus.exe` por `foto.jpg`.

---

## 2. Validación Real de Contenido (Magic Numbers)

A veces los usuarios o bots cambian la extensión de un archivo malicioso a `.jpg` para engañar al sistema. Para leer la firma "real" del archivo (conocida como *magic numbers*), puedes usar la librería externa **`file-type`**.

**Instalación:**
```bash
npm install file-type
```

**Uso:**
Esta librería lee los primeros bytes del archivo (el encabezado hexadecimal) y determina si genuinamente es una imagen por dentro, sin importar lo que diga el nombre de la extensión. Es ideal por motivos de seguridad en servidores.

---

## 3. Validación Inteligente de Identificaciones (Ej. Saber si es un INE)

Si tu objetivo de negocio es evitar que la gente suba **"fotos de perros"** en el paso donde se solicita la foto de su identificación, el Frontend por sí solo no sabe qué hay dentro de los píxeles. Necesitas Inteligencia Artificial (IA) u OCR (Reconocimiento Óptico de Caracteres).

### Opciones de Servidor (Recomendado)
*   **Google Cloud Vision API:** Le envías la imagen al servidor y Google extrae todo el texto. Si el texto incluye la palabra `"INSTITUTO NACIONAL ELECTORAL"`, apruebas la subida.
*   **AWS Rekognition:** Tiene servicios específicos creados explícitamente para analizar identificaciones y pasaportes.

### Opción Frontend (Tesseract.js)
Puedes hacer el reconocimiento de texto **directamente en el navegador** del usuario sin consumir cuota de backend instalando Tesseract:

**Instalación:**
```bash
npm install tesseract.js
```
Es una librería pesada, pero te permite extraer texto para buscar palabras clave antes de hacer la llamada a tu API `POST /api/v1/uploads`.

---

## Recomendación Crítica: Compresión en Frontend

> [!IMPORTANT]
> **No confíes en que el usuario subirá fotos optimizadas.** Las fotos modernas tomadas con la cámara de un iPhone o Samsung pueden pesar entre **10 MB y 15 MB**.

Si los usuarios suben fotos en crudo, llenarán rápidamente tu disco duro o tu bucket de S3, además de agotar sus datos móviles y hacer que tu aplicación se sienta lenta.

**Librería Recomendada:** `browser-image-compression`

**Instalación:**
```bash
npm install browser-image-compression
```

**Por qué usarla:**
Comprime mágicamente imágenes de 10MB a menos de **500KB** directamente en el teléfono/navegador del usuario *antes* de enviarla por internet. Mantiene la calidad completamente legible (suficiente para que el administrador verifique los datos del INE), ahorrando costos de almacenamiento y acelerando los flujos.
