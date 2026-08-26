# Convención de Commits — Vales YacaTec

> **Estado del documento:** Versión 1.0 — Estándar oficial del equipo.
> **Aplica a:** todos los repositorios del proyecto (`docu`, `backend-api`, `frontend-desktop-Tecu`, `frontend-tablet-Calipx`, `frontend-mobile-poch`, `frontend-global-styles`, `infrastructure`).
> **Idioma:** Español, minúsculas, sin acentos en los prefijos.

Este documento es la **fuente de verdad** para escribir mensajes de commit en todos los repos del proyecto. Cualquier PR o commit que no cumpla con esta convención debe corregirse antes de hacer merge.

---

## 1. Formato general

Seguimos [Conventional Commits](https://www.conventionalcommits.org/) adaptado al español y al contexto del proyecto.

```
<tipo>(<scope>): <descripción corta en minúsculas, sin punto final>
```

### Reglas duras

1. **Idioma:** todo el mensaje en **español**.
2. **Minúsculas:** el `tipo`, el `scope` y la descripción van en minúsculas.
3. **Sin acentos en el prefijo:** escribir `feat`, `fix`, `docs`, `chore`, etc. (no `féat`, `fixx`).
4. **Sin punto final:** la descripción termina sin punto.
5. **Modo imperativo:** la descripción se lee como una orden: *"añadir…"*, *"corregir…"*, *"actualizar…"*.
6. **Una sola línea:** el mensaje es de **una sola línea**. No usar body ni footer.
7. **Máximo 72 caracteres** en el subject completo (`tipo(scope): descripción`).
8. **Scope obligatorio** en este proyecto (salvo `chore`).
9. **Sin rastro de IA:** el mensaje del commit NO debe incluir
   trailers `Co-Authored-By`, `Assisted-By` ni cualquier otra
   atribucion a un modelo de lenguaje, asistente de IA o autor
   automatico. El commit se atribuye **solo** al programador que
   lo firma (`git config user.name`). Esta regla aplica tambien
   a cualquier hook de git, template de commit o wrapper del
   equipo que pudiera inyectar trailers automaticos.

---

## 2. Tipos permitidos

| Tipo | Cuándo usarlo | Ejemplo |
|---|---|---|
| `feat` | Se añade una funcionalidad, regla, documento o sección nueva | `feat(docs): añadir sección de reportes del sistema` |
| `fix` | Se corrige un bug, una regla, una fórmula, una descripción incorrecta | `fix(docs): corregir fórmula del pago quincenal` |
| `docs` | Cambios en archivos de documentación que no añaden ni corrigen reglas (READMEs, índices, navegación) | `docs(readme): actualizar índice de archivos` |
| `refactor` | Reorganización del contenido sin cambio funcional (mover secciones, renombrar, dividir archivos) | `refactor(docs): reorganizar sección de roles por dominio` |
| `chore` | Mantenimiento del repo: `.gitignore`, estructura de carpetas, configuración, limpieza | `chore: ignorar archivos locales de Excel` |
| `style` | Cambios puramente de formato (espacios, saltos de línea, tablas) sin tocar contenido | `style(docs): uniformar tablas de configuración` |
| `test` | Añadir o corregir pruebas (cuando aplique a docs: scripts de validación) | `test(docs): validar que no haya referencias a entidades en sistema/maestro.md` |

### Tipos NO permitidos

- ❌ `wip`, `wip:`, `tmp`, `prueba`, `cambios`, `arreglo`, `cosa` —这些都是 placeholder.
- ❌ Mezclar inglés y español (`feat: add sección`).
- ❌ Emojis (`feat: 🚀 añadir vale`).
- ❌ Mensajes vagos (`fix: corregir cosas`, `docs: update`).
- ❌ Atribuciones automaticas (`Co-Authored-By: Claude …`,
  `Assisted-By: Copilot …`, etc.). El commit se firma solo con el
  programador; ver regla 9 de "Reglas duras".

---

## 3. Scopes por repositorio

El `scope` indica **dónde** se hizo el cambio. Es obligatorio.

### 3.1 Repositorio `docu` (este repo)

| Scope | Aplica a |
|---|---|
| `docs` | `sistema/maestro.md`, `sistema/modelo-datos.md`, `sistema/transcripcion.md`, `sistema/fuentes/`, anexos de reglas |
| `readme` | `README.md` |
| `pdfs` | Inclusión o re-anotación de los PDFs fuente |
| `standards` | Este y futuros documentos de estandarización (commits, comentarios, código, etc.) |

### 3.2 Repositorio `backend-api` (NestJS)

| Scope | Aplica a |
|---|---|
| `auth` | Autenticación, JWT, sesión, roles |
| `mail` | Módulo de mail (SMTP, plantillas, notificaciones, dispatcher) |
| `distribuidoras` | Módulo de distribuidoras |
| `clientes` | Módulo de clientes finales |
| `vales` | Otorgamiento, pagos, reglas del 50% |
| `relaciones` | Cortes, generación, totales |
| `conciliacion` | Parsing del Excel del banco, match, quejas |
| `config` | Catálogo de configuraciones |
| `reportes` | Generación de los 5 reportes del sistema |
| `seed` | Scripts de carga inicial |
| `tests` | Pruebas unitarias / e2e |

### 3.3 Repos `frontend-*` (Angular)

| Scope | Aplica a |
|---|---|
| `ui` | Componentes visuales, layout, diseño |
| `forms` | Formularios reactivos, validaciones |
| `services` | Servicios (HTTP, auth, estado) |
| `guards` | Guards de rutas, role-based |
| `routing` | Configuración de rutas |
| `i18n` | Textos en español, mensajes al usuario |
| `permissions` | Permisos por rol reflejados en UI |

---

## 4. Ejemplos buenos vs. malos

### ✅ Buenos

```
feat(docs): añadir sección de comportamientos de pago
fix(docs): corregir la fórmula del 50% con tolerancia
feat(docs): crear convención de commits del equipo
refactor(docs): reorganizar sistema/ por dominio
docs(readme): referenciar el archivo de convenciones
chore: actualizar .gitignore para ignorar xlsx privados
style(docs): uniformar uso de mayúsculas en glosario
```

### ❌ Malos

```
feat: add new section                              → inglés, sin scope
feat(docs): Nueva sección.                        → mayúscula, punto final
fix(docs): arreglo de bug                          → palabra vaga ("arreglo"), no dice qué
Update README                                      → sin tipo, sin scope, inglés
feat(docs): añadir sección de comportamientos      → falta la ñ en "comportamientos" (regla: NO acentos en el prefijo, pero sí en el resto)
:wip: avance de cosas                              → tipo inválido, formato roto
feat(docs): añadir vale, generar vale, etc.        → múltiples cambios en un commit
```

---

## 5. Procedimiento al hacer commit

1. **Antes de commit**, verifica el diff: `git diff --staged`.
2. **Un commit = un cambio lógico.** No mezclar reglas nuevas con correcciones de estilo.
3. Si el cambio toca **varias reglas de negocio**, dividir en varios commits.
4. El mensaje debe **leer bien en la línea de historial**: alguien que vea `git log --oneline` debe entender qué se hizo.
5. **No usar `git commit -m` con commits rotos** (palabras sueltas, sin tipo). Tómate el tiempo de redactar.

---

## 6. Herramientas recomendadas

- **commitlint** + **husky** para validar el formato en hook pre-commit (config opcional por repo).
- **conventional-changelog** para generar `CHANGELOG.md` automático a partir de los commits.
- **gitlint** para revisión local del mensaje antes de hacer push.

---

## 7. Relación con otros documentos

- [`README.md`](./README.md) — vista general del repo `docu`.
- [`sistema/maestro.md`](./sistema/maestro.md) — vista principal del sistema consolidada (sin modelo de datos).
- [`sistema/modelo-datos.md`](./sistema/modelo-datos.md) — diagrama ER (Mermaid) de la base de datos.
- [`sistema/transcripcion.md`](./sistema/transcripcion.md) — transcripcion fuente de la clase.
- [`sistema/fuentes/`](./sistema/fuentes/) — PDFs y Excel originales.
- `CONVENCIONES-COMENTARIOS.md` — *(próximamente)* estándar de comentarios en el código.
- [`proceso-ramas-gitflow.md`](./proceso-ramas-gitflow.md) — estrategia de ramas, RC, hotfix y releases.

---

## 8. Convenciones de Pull Request

Este apartado define el estándar para crear y revisar PRs en todos los repositorios del proyecto. El objetivo es trazabilidad, agilidad y consistencia para un equipo pequeño (5 personas).

### 8.1 Convención para el Título del PR

El título del PR **debe seguir exactamente el mismo formato de Conventional Commits** que los commits:

```
<tipo>(<scope>): <descripción corta en minúsculas, sin punto final>
```

**Ejemplos:**

```
feat(auth): agregar autenticación de dos factores (2fa)
fix(backend): corregir timeout en conexión a postgres
ci(actions): agregar workflow de release para staging
refactor(styles): migrar submódulo de estilos globales a https
```

**Reglas:**
- El título se valida por CI (PR Lint) y se convierte en el mensaje del **squash merge** al integrar a `develop`, `staging` o `main`.
- Aplica la misma tabla de tipos y scopes que la sección 2 y 3.
- No usar emojis, no mezclar inglés/español, no exceder 72 caracteres.

### 8.2 Plantilla Ligera de PR (`.github/PULL_REQUEST_TEMPLATE.md`)

Cada repositorio debe incluir este archivo en `.github/PULL_REQUEST_TEMPLATE.md`. GitHub lo carga automáticamente al abrir un PR:

```markdown
## 📝 Descripción
Un resumen de 1 a 2 oraciones sobre qué cambia este PR y por qué.

## 🛠️ Cambios realizados
- [ ] Cambio 1 (ej. Se actualizó la variable de entorno en staging)
- [ ] Cambio 2 (ej. Ajuste en tsconfig.json para resolver los paths de estilos)

## 🧪 ¿Cómo probar estos cambios?
1. Ir a la rama/entorno X.
2. Ejecutar `npm run test` o probar el endpoint `POST /api/v1/...`.
3. Verificar que el resultado sea Y.

## 📸 Capturas de pantalla / Evidencia (Opcional)
*Aplica si hay cambios visuales en el Frontend o capturas de pruebas exitosas.*
```

**Campos obligatorios:** Descripción, Cambios realizados, Cómo probar.
**Campo opcional:** Capturas de pantalla (solo para cambios visuales en frontend).

### 8.3 Tres Reglas de Oro para PRs en Equipos Pequeños

| Regla | Qué significa |
|---|---|
| **PRs Pequeños y Enfocados (Atomic PRs)** | Un PR = una sola cosa bien hecha. Preferible 3 PRs de 50 líneas que 1 PR de 1,000 líneas tocando 15 archivos. |
| **Auto-Revisión previa** | Antes de pedir review, el autor revisa su propio diff en GitHub. Elimina el 80% de errores tontos (variables no usadas, `console.log` olvidados, typos). |
| **Criterios de Merge (Definición de Hecho)** | 1. CI/CD verde (todos los status checks). 2. **1 sola aprobación** de otro miembro del equipo (exigir 2 bloquea el desarrollo en equipos de 5). |

### 8.4 Anatomía obligatoria de un PR (resumen)

| Elemento | Regla |
|---|---|
| Título | Conventional Commit: `feat(scope): descripción`, `fix(scope): ...` — se valida por CI y se convierte en el mensaje del squash |
| Cuerpo | Plantilla del repo (`.github/PULL_REQUEST_TEMPLATE.md`) |
| Enlace | `Closes #<issue>` (cierre automático) o `Refs #<issue>` si es parcial |
| Tamaño | Objetivo ≤ 400 líneas modificadas; PRs grandes se dividen |
| Autor | No puede aprobar su propio PR (GitHub lo impide) |
| Asignados | Autor como *assignee*; revisor(es) en *reviewers* |

### 8.5 Beneficios inmediatos

- **Trazabilidad:** En 6 meses sabrás exactamente qué hizo cada PR sin adivinar.
- **Changelogs automáticos:** Al usar títulos Conventional Commits, herramientas como `conventional-changelog` generan `CHANGELOG.md` automático en cada release (`v0.0.1`, `v1.0.0`, etc.) desde los workflows de GitHub Actions.
- **Integración con releases:** El título del PR = mensaje del commit squash = entrada en notas de release GitHub.

---

*Documento mantenido en `/docu/CONVENCIONES-COMMITS.md`. Cualquier cambio en la convención debe aprobarse en equipo y versionarse.*
