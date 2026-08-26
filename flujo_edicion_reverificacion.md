# Flujo de Edición y Re-Verificación (Solicitudes Devueltas)

Este documento detalla el ciclo de vida de una solicitud que ha sido devuelta por Gerencia, el proceso de corrección por parte del Coordinador y la emisión final del dictamen por el Verificador.

## 1. El Inicio (Solicitud Devuelta)
El flujo comienza cuando Gerencia (desde el Frontend de Escritorio) detecta un error en una solicitud (por ejemplo, el apellido está mal escrito como "Grcía" en lugar de "García"). La solicitud es devuelta y regresa al flujo de la Tablet.

## 2. La Corrección (El Coordinador - Sin Tokens)
El Coordinador abre la Tablet, localiza la solicitud devuelta y entra a la pantalla de edición.

- **Ausencia de bloqueos por Token:** El Coordinador corrige el apellido a "García" y hace clic en Guardar. La Tablet envía la corrección al servidor (`PATCH /api/v1/solicitudes/{id}`) de forma libre, sin solicitar autorización ni PIN de un Gerente.
- **Auditoría Automática (Backend):** El Frontend no envía un historial de modificaciones. El registro estricto recae completamente en el Backend (NestJS). Al recibir el `PATCH`, el servidor compara la data vieja ("Grcía") contra la nueva ("García") y guarda en secreto en la base de datos de auditoría quién hizo el cambio y a qué hora.

## 3. La Re-Verificación (El Verificador - Payload Explícito)
Una vez que la solicitud está corregida, pasa de nuevo a la bandeja del Verificador para obtener el visto bueno definitivo.

- El Verificador acude a campo, toma las 3 fotografías reglamentarias y confirma que los datos ahora son correctos.
- Al oprimir el botón **"CUMPLE"** para emitir su dictamen, la Tablet construye el payload de verificación.
- **Inyección de Estado:** Para asegurar que la solicitud no se quede estancada, la Tablet inyecta explícitamente el campo `status: 'DICTAMINADA'` dentro del paquete JSON enviado al endpoint `POST /api/v1/solicitudes/{id}/verificar`.

## 4. Retorno Exitoso a Gerencia
El servidor recibe el dictamen positivo del Verificador junto con la directiva explícita del estado.

- El Backend obedece la orden de la Tablet y sella oficialmente el estado de la solicitud en la base de datos como **"DICTAMINADA"**.
- Como el Frontend de Escritorio está programado para filtrar su bandeja de Gerencia estrictamente buscando el estado `DICTAMINADA`, en el instante en que el Gerente recargue su pantalla, la solicitud corregida aparecerá mágicamente lista para la autorización del crédito final.
