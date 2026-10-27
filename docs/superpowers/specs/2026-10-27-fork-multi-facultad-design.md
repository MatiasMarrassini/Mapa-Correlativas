# Fork multi-facultad de FIUBA-Map — Diseño

Fecha: 2026-10-27 · Autor del pedido: Matías Marrassini

## Intención

Hacer un fork de [fdelmazo/FIUBA-Map](https://github.com/fdelmazo/FIUBA-Map) en el GitHub de Matías que:

1. Sume su carrera (Ingeniería en Informática, UADE, plan 2021).
2. Deje de depender de FIUBA: que funcione para **cualquier facultad**, con o sin CBC, midiendo el avance en créditos u horas.
3. Funcione **sin servidor ni login**: los datos quedan en el navegador.

**Por qué:** es principalmente un proyecto **para mostrar** en su perfil (CV). Que alguien lo use de verdad es secundario. Por eso importan más la **prolijidad del código y del diff** que las funciones nuevas. Es la versión chica; después viene un proyecto aparte, más grande, desde cero (UADE-MAP), que **no** es parte de este documento.

## Cómo se usa (flujo objetivo)

- **Local:** clonar → `npm install` → `npm start` → se abre en `localhost:3000`.
- **Publicado:** GitHub Pages del fork, con el link en el README, para probarlo con un clic.
- Arriba se elige **Facultad** y luego **Carrera/Plan**. Se marcan materias. Al volver a abrir (o al volver a elegir ese plan) aparece **como se dejó**.

## Objetivos

- Selector de dos niveles: **Facultad → Carrera/Plan**.
- Cada plan declara en su configuración:
  - **unidad**: `créditos` u `horas`;
  - si **tiene CBC** o no.
  La app se adapta sola (textos, barra de progreso, CBC). **No hay opción para el usuario**: es configuración del plan.
- Guardado 100% local (`localStorage`), independiente por plan.
- **Exportar / importar** el avance a/desde un archivo `.json`.
- Quitar todo lo que depende del autor original o de un servidor: login/padrón, proxy de base de datos (`api/`, jsonbin), formulario de bugs/sugerencias, links a cafecito/FIUBA-Plan.
- Mantener el crédito al proyecto original en el README (licencia MIT, se conserva `LICENSE`).
- Deploy a GitHub Pages del fork.

## No-objetivos

- Cuentas de usuario, sincronización entre dispositivos, cualquier backend.
- Rediseño visual o nuevas funciones más allá de las listadas.
- Cargar planes de otras facultades además de FIUBA (las que ya trae) y UADE Informática 2021. La estructura debe permitirlo, pero no se cargan.
- Contribuir los cambios de vuelta al repo original (no se descarta, pero no guía el diseño).

## Anti-objetivos (cosas que lo harían un fracaso aunque funcione)

- Que el diff contra el original sea un desorden (archivos reformateados enteros, cambios de finales de línea CRLF/LF, código muerto comentado). Un lector del repo tiene que poder ver qué se cambió y por qué.
- Que agregar una facultad nueva requiera tocar componentes. Debe bastar con un JSON de materias + entradas de configuración.
- Que sigan quedando restos de login (campo padrón, "cerrar sesión", `padron: "Local"`, funciones no-op) o pedidos a servicios externos.
- Que se rompan las carreras de FIUBA (CBC, créditos, orientaciones, tesis/TPP, optativas, aplazos siguen funcionando igual).
- Que se pierda el crédito al autor original.

## Punto de partida

- Fork del repo original y trabajo **sobre su `main` actual** (no sobre la copia vieja de agosto 2025 que Matías modificó). El `main` actual trae correcciones de correlativas y un modelo de guardado más limpio (ver abajo). *(Decisión de Claude.)*
- La copia modificada de Matías (carpeta `FIUBA-Map-master/` local) es **referencia** para portar: allí ya están resueltos, contra la versión vieja,
  - `src/data/uade-informatica-2021.json` (52 materias, correlativas validadas) y `plan-estudios-uade-informatica-1621.txt` (fuente);
  - la unidad `"horas"` en el tipo `Carrera` y los textos que cambian según la unidad (`ProgressBar`, `MateriaStatus`, `Creditos`);
  - el manejo de carreras sin CBC y sin electivas en `Graph.ts` (no empujar el segmento CBC/electivas si no hay, ajustar el último segmento de la barra en vez de `creditos[1]`, no aprobar `"CBC"` si el nodo no existe);
  - guardar las posiciones de los nodos movidos a mano (`nodePositions`) — **no se porta** (ver §4).
  Se portan las ideas, no el código tal cual: la base cambió (el modelo de usuario/guardado es otro).
- El repo original ya tiene workflows de GitHub Actions (`node.js.yml` para deploy a Pages, `verify-ts-pr.yml` para chequeo de tipos).

## Diseño

### 1. Configuración: facultades, carreras y planes

Hoy `src/carreras.ts` exporta `CARRERAS` (planes, cada uno con su JSON) y `PLANES` (agrupa planes por carrera, lo usa `DropdownCarreras`).

Se agrega el nivel **facultad**:

- Cada agrupación de `PLANES` pertenece a una facultad (p. ej. un campo `facultad: "fiuba" | "uade"` o una lista `FACULTADES` que contiene sus carreras — la forma exacta queda al builder).
- Lista de facultades con al menos `id` y `nombre` (`FIUBA`, `UADE`).
- Cada plan (`UserType.Carrera`) suma:
  - `unidad?: "creditos" | "horas"` — por defecto `"creditos"`;
  - CBC: lo declara el propio JSON del plan — un plan **tiene CBC si su JSON tiene el nodo `"CBC"`** (todos los de FIUBA lo tienen; el de UADE no). No se agrega un flag aparte que pueda contradecir a los datos. *(Decisión de Claude, ajustada al planificar.)*
- UADE Informática 2021: `unidad: "horas"`, sin CBC, `creditos.total: 4226` (decisión de Matías; coincide con la fuente `plan-estudios-uade-informatica-1621.txt`), `electivas: 0`, link a la página de la carrera en UADE.
- **Examen de Inglés (2.4.216) no suma horas** (decisión de Matías): se **saca del JSON de materias** y se modela como **requisito a tildar** en `creditos.checkbox`, igual que FIUBA modela su prueba de nivel de inglés. Si alguna materia del JSON lo tuviera como correlativa, se quita esa correlativa. Con esto el JSON suma 4226 hs.

Agregar una facultad = agregar su(s) JSON en `src/data/` + entradas en `carreras.ts`. Nada más.

### 2. Selector (opción A, elegida por Matías)

- Reemplaza al dropdown actual de carreras, en el mismo lugar de la barra superior (a la derecha).
- **Dos desplegables:** `Facultad ▾` y `Carrera/Plan ▾`. El segundo muestra solo lo de la facultad elegida, con los badges de año como hoy.
- Al cambiar de facultad se carga el **último plan usado en esa facultad**; si nunca se usó, el primero de la lista. *(Decisión de Claude.)*
- Cada cambio de plan carga el avance guardado de ese plan (o un plan vacío; si el plan tiene CBC, se aprueba el CBC como hace hoy el original).
- En mobile debe seguir entrando en la barra (el original ya muestra nombres cortos en pantallas chicas; seguir ese criterio).

### 3. Modo créditos/horas y CBC

Comportamiento derivado de la configuración del plan, sin interacción del usuario:

- **Unidad:** todos los textos que dicen "créditos" (barra de progreso, popover de créditos, estado de materia "Otorga X…", "Requiere X…") usan la unidad del plan.
- **Sin CBC:** no aparece el segmento CBC en la barra, no se crea/aprueba el nodo CBC, no aparecen textos de "con CBC". Las referencias a CBC del código (`Graph.ts`, `Node.ts`, `MateriaControl`, `MateriaDisplay`, `MateriaStatus`, `Promedio`, `constants.ts`…) deben tolerar su ausencia.
- **Sin electivas:** si el plan no tiene electivas, no se muestra ese segmento.
- La barra de progreso debe sumar 100% con cualquier combinación de segmentos (el ajuste de proporciones no puede depender de índices fijos).

### 4. Guardado local

El `main` actual del original ya guarda **un único registro** por usuario:

```ts
DBRecord { padron, ultimaCarrera, carreras: { [carreraid]: CarreraData } }
CarreraData { orientacion?, finDeCarrera?, materias, checkboxes?, optativas?, aplazos? }
```

Se reutiliza ese modelo, pero persistido en `localStorage` en lugar del proxy:

- Una sola clave (p. ej. `mapa-correlativas`) con el registro completo, sin `padron`. Se lee al iniciar y se escribe en cada cambio (ver abajo); la selección de plan/facultad y el avance viven en el mismo registro.
- `ultimaCarrera` → plan que se abre al iniciar. Se suma lo necesario para recordar el último plan por facultad.
- **No** se guardan posiciones de nodos movidos a mano. *(Decisión de Claude, revisada al planificar: el grafo usa layout jerárquico y `actualizarNiveles` recalcula columnas en cada cambio, así que las posiciones guardadas se pisarían; no vale la complejidad en un fork de cambios simples.)*
- **Cuándo se guarda: automáticamente, en cada cambio** (decisión de Matías). Se **elimina el botón "Guardar"**. Todo lo que hoy persiste `saveUserGraph` (materias con nota/cuatrimestre, checkboxes, optativas, aplazos, orientación, fin de carrera) se escribe en `localStorage` apenas cambia, igual que el plan/facultad seleccionados. Contexto: en el original, cambiar de plan sin apretar "Guardar" descarta los cambios sin aviso; eso desaparece. Escribir con un pequeño *debounce* si hace falta (p. ej. al arrastrar nodos) queda a criterio del builder.
- El botón de "reiniciar cuatrimestres planeados" del original se mantiene.
- Leer/escribir `localStorage` siempre dentro de `try/catch`; si falla, la app funciona igual pero sin guardar.
- Se elimina: `api/`, `callProxy`/`dbLogin`/`dbCreate`/`dbSave`, `DB_PROXY` y demás constantes de Google Forms/Sheets, `submitBug` y el componente de sugerencias, `PadronInput`, el menú de usuario con "cerrar sesión", y del contexto de usuario todo lo de `padron`, `logged`, `loading`, `loggingIn`, `dbUnavailable`, `login/signup/logout`. Los componentes que los usen se simplifican en consecuencia.

### 5. Exportar / importar

- Dos acciones en la barra superior, donde estaba "Guardar" (íconos con tooltip).
- **Exportar:** descarga un `.json` con el registro completo (todas las facultades y planes) más un campo de versión de formato. Nombre sugerido: `mapa-correlativas-AAAA-MM-DD.json`.
- **Importar:** elegir un archivo `.json` → validar que tenga la forma esperada → pedir confirmación ("Esto reemplaza tu avance guardado") → reemplazar el registro → recargar el plan actual.
- Archivo inválido → mensaje de error (toast) y no se toca nada.
- Reemplazo total, no merge. *(Decisión de Claude: más simple y predecible.)*

### 6. Nombre, README, licencia y deploy

- **Nombre** (decisión de Matías): repo **`MatiasMarrassini/Mapa-Correlativas`** (fork de `fdelmazo/FIUBA-Map`, renombrado) y app **"Mapa de Correlativas"**.
  - Se reemplaza "FIUBA Map" y `fede.dm` en `<title>`, metas `og:*`/canonical de `public/index.html`, encabezado y cualquier texto visible. La imagen `public/fmap.png` se reemplaza por una captura de la app nueva (o se quita la meta si no hay captura todavía).
  - URL publicada: `https://matiasmarrassini.github.io/Mapa-Correlativas/` → `package.json → homepage`, metas y README.
- **Quién crea el fork:** Claude, con el `gh` de Matías (ya autenticado), **previa confirmación de Matías** antes de crear el fork, pushear o activar Pages. El trabajo se hace en una rama y se integra a `main` del fork al final.
- README propio: qué es, captura, link a GitHub Pages, cómo correrlo, **cómo agregar una facultad** (formato del JSON de materias), qué se cambió respecto del original, y crédito explícito: "Basado en FIUBA-Map de Federico del Mazo (MIT)".
- Se conserva `LICENSE` del original.
- `package.json → homepage` apunta al GitHub Pages del fork. El workflow de deploy debe publicar en el fork (verificar que la action actual funcione en otro repo; si no, reemplazar por una estándar).
- El `.gitignore` del original se mantiene.
- El plan por defecto al abrir por primera vez: UADE Informática 2021. *(Decisión de Claude: es la carrera de Matías y la razón del fork.)*

## Criterios de "listo"

- `npm start` levanta sin errores y `npx tsc --noEmit` pasa.
- Con UADE: se ve el grafo, la barra cuenta horas sin CBC ni electivas y llega a 100% con todo aprobado.
- Con cualquier plan de FIUBA: comportamiento igual al original (CBC aprobado al iniciar, créditos, orientaciones, tesis/TPP).
- Cambiar facultad/plan y volver conserva el avance sin apretar nada; recargar la página también.
- Exportar → borrar datos del navegador → importar restaura todo.
- No hay requests de red a servicios externos (verificable en la pestaña Network).
- No queda UI ni código de login/padrón.
- Publicado en GitHub Pages y enlazado desde el README.

## Queda a criterio del builder

- Forma exacta de la configuración de facultades en `carreras.ts`.
- Nombres de claves de `localStorage` y del campo de versión del export.
- Iconografía y textos de los botones de exportar/importar.
- Orden de los commits (preferible: commits chicos y temáticos, para que el historial del fork se lea bien).

## Preguntas abiertas

Ninguna.
