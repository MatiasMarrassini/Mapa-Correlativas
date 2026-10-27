# Mapa de Correlativas (fork multi-facultad) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir un fork de `fdelmazo/FIUBA-Map` en "Mapa de Correlativas": multi-facultad (FIUBA + UADE), créditos u horas y CBC según el plan, sin login ni servidor, con guardado automático en `localStorage` y exportar/importar.

**Architecture:** Se parte del `main` actual del original. La persistencia pasa a un módulo puro `src/storage.ts` que guarda un único `Registro` (mismo modelo `carreras: {[id]: CarreraData}` que ya usa el original, sin `padron`). `User.ts` expone ese registro y una única vía de escritura (`actualizarRegistro`); `Graph.ts` guarda automáticamente cada vez que el grafo cambia. Las facultades son un nivel de configuración en `carreras.ts`; helpers puros en `src/planes.ts`.

**Tech Stack:** React 18 + TypeScript 4.9 (Create React App / `react-scripts` 5), Chakra UI 2, vis-network vía `react-graph-vis`, Jest (incluido en `react-scripts`).

**Spec:** `docs/superpowers/specs/2026-10-27-fork-multi-facultad-design.md` (leer antes de empezar).

## Global Constraints

- Repo: `MatiasMarrassini/Mapa-Correlativas` (fork de `fdelmazo/FIUBA-Map`). App: **"Mapa de Correlativas"**. URL: `https://matiasmarrassini.github.io/Mapa-Correlativas/`.
- Base: rama `main` actual del original. Trabajo en la rama `multi-facultad`; se integra a `main` del fork al final.
- **Nada de crear el fork, pushear, cambiar settings del repo ni activar Pages sin confirmación explícita de Matías en el chat.**
- El repo guarda LF (`core.autocrlf=true` en Windows). No commitear CRLF ni reformatear archivos enteros: el diff contra el original tiene que leerse limpio. Formato: Prettier con el `.prettierrc` del repo, solo sobre archivos tocados.
- Sin requests de red a servicios externos. Sin dependencias nuevas (no cambia `package-lock.json`).
- Comentarios e identificadores en español, como el resto del código.
- Plan por defecto la primera vez: `uade-informatica-2021`.
- UADE: `unidad: "horas"`, sin CBC, `creditos.total: 4226`, `electivas: 0`; "Examen de Inglés" (2.4.216) fuera del JSON y como `creditos.checkbox`.
- Acceso a `localStorage` siempre dentro de `try/catch`.
- Crédito explícito en README: "Basado en FIUBA-Map de Federico del Mazo (MIT)". Se conserva `LICENSE`.
- Verificación base de cada tarea: `npx tsc --noEmit` y `npm test -- --watchAll=false` pasan.

## Review Focus

1. **`localStorage` con basura o formato viejo** (JSON inválido, objeto sin `carreras`, clave `padron` del original): la app arranca en el plan por defecto sin romperse. → Test en Tarea 3.
2. **Registro que apunta a un plan que ya no existe** (`ultimaCarrera` o `ultimaPorFacultad` con un id borrado/renombrado): se cae al plan por defecto / al primero de la facultad. → Tests en Tareas 2 y 3.
3. **Plan sin CBC con una sola materia aprobada**: el original borraba el mapa si `materias.length <= 1` (asumía el CBC siempre guardado); en UADE eso perdería esa materia. → Test de `armarCarreraData` en Tarea 3.
4. **Archivo importado válido como JSON pero con otra forma** (otro programa, un array, `carreras` no-objeto, materias sin `id`): se rechaza y no se toca nada. → Test en Tarea 3.
5. **Barra de progreso con combinaciones de segmentos distintas** (sin CBC, sin electivas, solo checkboxes): las proporciones suman 10 y nada depende de `creditos[1]`. → Test de `ajustarProporciones` en Tarea 6.

---

### Task 1: Fork, clon y rama de trabajo

**Files:**
- Create (en el clon): `docs/superpowers/specs/2026-10-27-fork-multi-facultad-design.md`, `docs/superpowers/plans/2026-10-27-fork-multi-facultad.md` (copiados desde `FIUBA-Map-master/docs/superpowers/` de la copia vieja)
- Modify: `package.json` (script `test`)

**Interfaces:**
- Produces: clon en `C:\Users\marra\Desktop\Proyectos Programacion\Proyecto Correlativas Mapa Carrera\Mapa-Correlativas`, rama `multi-facultad`, `npm test` disponible.

- [ ] **Step 1: Confirmar con Matías** que se crea el fork `MatiasMarrassini/Mapa-Correlativas` con su `gh`. No seguir sin un "sí" en el chat.
- [ ] **Step 2: Crear y clonar**

```bash
gh repo fork fdelmazo/FIUBA-Map --fork-name Mapa-Correlativas --clone=false
gh repo clone MatiasMarrassini/Mapa-Correlativas "C:/Users/marra/Desktop/Proyectos Programacion/Proyecto Correlativas Mapa Carrera/Mapa-Correlativas"
```
No usar `--default-branch-only`: la rama por defecto del original es `gh-pages` y se necesita `main`.

- [ ] **Step 3: Rama de trabajo:** `git checkout main && git checkout -b multi-facultad`. Verificar `git log -1` = último commit de `main` del original.
- [ ] **Step 4:** Agregar `"test": "react-scripts test"` a `scripts` de `package.json`. Copiar spec y plan a `docs/superpowers/`. `npm install`.
- [ ] **Step 5: Verificar:** `npx tsc --noEmit` pasa; `npm test -- --watchAll=false --passWithNoTests` termina OK.
- [ ] **Step 6: Commit** `chore: agregar script de tests y documentos de diseño`

---

### Task 2: Facultades, plan de UADE y helpers de planes

**Files:**
- Modify: `src/types/User.ts` (tipo `Carrera`, nuevo `Facultad`)
- Modify: `src/carreras.ts` (`FACULTADES`, campo `facultad` en `PLANES`, entrada UADE)
- Create: `src/data/uade-informatica-2021.json` (desde la copia vieja, **sin** 2.4.216)
- Create: `src/planes.ts`
- Test: `src/planes.test.ts`, `src/carreras.test.ts`

**Interfaces:**
- Produces:
  - `UserType.Carrera.unidad?: "creditos" | "horas"`
  - `interface UserType.Facultad { id: string; nombre: string }`
  - `FACULTADES: UserType.Facultad[]` = `[{ id: "fiuba", nombre: "FIUBA" }, { id: "uade", nombre: "UADE" }]`
  - cada entrada de `PLANES` suma `facultad: string` (todas las existentes `"fiuba"`; nueva `{ nombre: "Ingeniería en Informática", nombrecorto: "Informática", facultad: "uade", planes: ["uade-informatica-2021"] }`)
  - `PLAN_POR_DEFECTO = "uade-informatica-2021"` (exportado de `planes.ts`)
  - `facultadDePlan(carreraid: string): string | undefined`
  - `planesDeFacultad(facultadid: string): string[]` (ids en el orden de `PLANES`)
  - `tieneCBC(carrera: UserType.Carrera): boolean` (= el JSON tiene un nodo con id `"CBC"`)
  - `unidadTexto(carrera: UserType.Carrera): "créditos" | "horas"`

- [ ] **Step 1: Tests de datos** en `src/carreras.test.ts`:

```ts
import { CARRERAS, PLANES, FACULTADES } from "./carreras";

test("cada correlativa apunta a una materia del mismo plan", () => {
  CARRERAS.forEach((c) => {
    const ids = new Set(c.graph.map((m) => m.id));
    c.graph.forEach((m) =>
      (m.correlativas ?? "").split("-").filter(Boolean)
        .forEach((id) => expect([c.id, m.id, ids.has(id)]).toEqual([c.id, m.id, true])),
    );
  });
});

test("cada plan pertenece a exactamente una entrada de PLANES con facultad válida", () => {
  const facultades = FACULTADES.map((f) => f.id);
  CARRERAS.forEach((c) => {
    const grupos = PLANES.filter((p) => p.planes.includes(c.id));
    expect(grupos).toHaveLength(1);
    expect(facultades).toContain(grupos[0]!.facultad);
  });
});

test("UADE Informática 2021: horas, sin CBC, 4226 hs y el inglés como requisito", () => {
  const uade = CARRERAS.find((c) => c.id === "uade-informatica-2021")!;
  expect(uade.unidad).toBe("horas");
  expect(uade.creditos.total).toBe(4226);
  expect(uade.graph.reduce((acc, m) => acc + m.creditos, 0)).toBe(4226);
  expect(uade.graph.some((m) => m.id === "CBC" || m.id === "2.4.216")).toBe(false);
  expect(uade.creditos.checkbox?.map((c) => c.nombrecorto)).toEqual(["Inglés"]);
});
```

- [ ] **Step 2: Tests de helpers** en `src/planes.test.ts`:

```ts
import { CARRERAS } from "./carreras";
import { facultadDePlan, planesDeFacultad, tieneCBC, unidadTexto, PLAN_POR_DEFECTO } from "./planes";

const plan = (id: string) => CARRERAS.find((c) => c.id === id)!;

test("facultadDePlan", () => {
  expect(facultadDePlan("uade-informatica-2021")).toBe("uade");
  expect(facultadDePlan("informatica-2020")).toBe("fiuba");
  expect(facultadDePlan("no-existe")).toBeUndefined();
});
test("planesDeFacultad", () => {
  expect(planesDeFacultad("uade")).toEqual(["uade-informatica-2021"]);
  expect(planesDeFacultad("fiuba")).toContain("informatica-2020");
  expect(planesDeFacultad("fiuba")).not.toContain("uade-informatica-2021");
  expect(planesDeFacultad("no-existe")).toEqual([]);
});
test("tieneCBC y unidadTexto", () => {
  expect(tieneCBC(plan("informatica-2020"))).toBe(true);
  expect(tieneCBC(plan("uade-informatica-2021"))).toBe(false);
  expect(unidadTexto(plan("informatica-2020"))).toBe("créditos");
  expect(unidadTexto(plan("uade-informatica-2021"))).toBe("horas");
});
test("el plan por defecto existe", () => {
  expect(CARRERAS.some((c) => c.id === PLAN_POR_DEFECTO)).toBe(true);
});
```

- [ ] **Step 3: Correr y ver que fallan:** `npm test -- --watchAll=false` → FAIL (no existen `FACULTADES`, `planes.ts`, el JSON de UADE).
- [ ] **Step 4: Implementar.** Tipos; `FACULTADES` y `facultad` en `carreras.ts`; entrada UADE en `CARRERAS` (`id: "uade-informatica-2021"`, `link: "https://www.uade.edu.ar/facultad-de-ingenieria-y-ciencias-exactas/"`, `ano: 2021`, `unidad: "horas"`, `graph: require("./data/uade-informatica-2021.json")`, `creditos: { total: 4226, electivas: 0, checkbox: [{ nombre: "Examen de Inglés", nombrecorto: "Inglés", bg: COLORS.enfinal[50], color: "enfinal" }] }`); JSON copiado desde la copia vieja quitando la línea de `2.4.216` (ninguna materia lo tiene como correlativa); `src/planes.ts` con los cuatro helpers y la constante. Sumar un comentario breve arriba de `FACULTADES` explicando cómo agregar una facultad.
- [ ] **Step 5: Correr:** `npm test -- --watchAll=false` → PASS; `npx tsc --noEmit` → OK.
- [ ] **Step 6: Commit** `feat: agregar facultades y el plan de Informática de UADE`

---

### Task 3: Módulo de guardado local

**Files:**
- Modify: `src/types/User.ts` (agrega `Registro`)
- Create: `src/storage.ts`
- Test: `src/storage.test.ts`

**Interfaces:**
- Consumes: `PLAN_POR_DEFECTO`, `facultadDePlan` (Tarea 2).
- Produces:
  - ```ts
    interface UserType.Registro {
      version: 1;
      ultimaCarrera: string;
      ultimaPorFacultad: { [facultadid: string]: string };
      carreras: { [carreraid: string]: CarreraData };
    }
    ```
    (`CarreraData` queda como en el original.)
  - `STORAGE_KEY = "mapa-correlativas"`
  - `registroInicial(): UserType.Registro` → `{ version: 1, ultimaCarrera: PLAN_POR_DEFECTO, ultimaPorFacultad: {}, carreras: {} }`
  - `parsearRegistro(texto: string): UserType.Registro | null` — `null` si no es JSON, no es objeto, `carreras` no es objeto, o alguna `CarreraData.materias` no es array de `{ id: string, nota: number }`. Completa campos faltantes (`ultimaPorFacultad: {}`, `ultimaCarrera: PLAN_POR_DEFECTO`) y descarta claves desconocidas (p. ej. `padron`).
  - `cargarRegistro(): UserType.Registro` — lee `STORAGE_KEY`; si falta, falla o `parsearRegistro` da `null` → `registroInicial()`.
  - `guardarRegistro(registro: UserType.Registro): void`
  - `exportarRegistro(registro: UserType.Registro): string` — `JSON.stringify(registro, null, 2)`
  - `armarCarreraData(datos: { materias: UserType.Materia[]; orientacion?: string; finDeCarrera?: string; checkboxes?: string[]; optativas: GraphType.Optativa[]; aplazos: number }): UserType.CarreraData | undefined` — `undefined` si no hay nada que guardar (ninguna materia salvo `"CBC"`, sin checkboxes, optativas, aplazos, orientación ni fin de carrera). Omite campos vacíos como el original.
  - `conCarreraElegida(registro: UserType.Registro, carreraid: string): UserType.Registro` — setea `ultimaCarrera` y `ultimaPorFacultad[facultadDePlan(carreraid)]`.

- [ ] **Step 1: Tests** en `src/storage.test.ts`:

```ts
import { STORAGE_KEY, registroInicial, parsearRegistro, cargarRegistro, guardarRegistro,
  exportarRegistro, armarCarreraData, conCarreraElegida } from "./storage";

beforeEach(() => window.localStorage.clear());

test("sin nada guardado arranca con el registro inicial", () => {
  expect(cargarRegistro()).toEqual(registroInicial());
  expect(registroInicial().ultimaCarrera).toBe("uade-informatica-2021");
});
test("guardar y cargar devuelve lo mismo", () => {
  const r = { ...registroInicial(), carreras: { "informatica-2020": { materias: [{ id: "CB001", nota: 7 }] } } };
  guardarRegistro(r);
  expect(cargarRegistro()).toEqual(r);
});
test("basura o formato viejo en localStorage no rompe", () => {
  window.localStorage.setItem(STORAGE_KEY, "{no es json");
  expect(cargarRegistro()).toEqual(registroInicial());
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ padron: "123", carreras: 5 }));
  expect(cargarRegistro()).toEqual(registroInicial());
});
test("parsearRegistro rechaza formas inválidas", () => {
  ["[]", "42", "null", '{"carreras":[]}', '{"carreras":{"x":{"materias":[{"nota":4}]}}}']
    .forEach((t) => expect(parsearRegistro(t)).toBeNull());
});
test("parsearRegistro completa campos y descarta claves ajenas", () => {
  const r = parsearRegistro(JSON.stringify({ padron: "1", carreras: {} }))!;
  expect(r).toEqual(registroInicial());
});
test("exportar y volver a parsear es identidad", () => {
  const r = conCarreraElegida(registroInicial(), "informatica-2020");
  expect(parsearRegistro(exportarRegistro(r))).toEqual(r);
});
test("conCarreraElegida recuerda el último plan por facultad", () => {
  const r = conCarreraElegida(registroInicial(), "informatica-2020");
  expect(r.ultimaCarrera).toBe("informatica-2020");
  expect(r.ultimaPorFacultad).toEqual({ fiuba: "informatica-2020" });
});
test("armarCarreraData: plan sin CBC con una sola materia se guarda", () => {
  expect(armarCarreraData({ materias: [{ id: "3.4.069", nota: 8 }], optativas: [], aplazos: 0 }))
    .toEqual({ materias: [{ id: "3.4.069", nota: 8 }] });
});
test("armarCarreraData: solo el CBC y nada más no se guarda", () => {
  expect(armarCarreraData({ materias: [{ id: "CBC", nota: 0 }], optativas: [], aplazos: 0 })).toBeUndefined();
});
test("armarCarreraData: un checkbox solo alcanza para guardar", () => {
  expect(armarCarreraData({ materias: [], checkboxes: ["Examen de Inglés"], optativas: [], aplazos: 0 }))
    .toEqual({ materias: [], checkboxes: ["Examen de Inglés"] });
});
```

- [ ] **Step 2: Correr y ver que fallan** (`storage.ts` no existe).
- [ ] **Step 3: Implementar** `src/storage.ts` y el tipo `Registro`. `parsearRegistro` copia solo `version`, `ultimaCarrera`, `ultimaPorFacultad`, `carreras`.
- [ ] **Step 4: Correr:** tests PASS y `npx tsc --noEmit` OK. En esta tarea `Registro` se **agrega** junto a `DBRecord` (nadie usa todavía `storage.ts`); `DBRecord` se borra en la Tarea 4.
- [ ] **Step 5: Commit** `feat: módulo de guardado local con exportar/importar`

---

### Task 4: Sacar login y servidor; guardado automático

**Files:**
- Modify: `src/types/User.ts` (`Info`, `Context`, `SaveGraph`), `src/types/Graph.ts` (`Context`: sin `logged` ni `saveGraph`)
- Rewrite: `src/User.ts`
- Modify: `src/Graph.ts` (población, autosave, `changeCarrera`, CBC al iniciar, `showLabels`)
- Modify: `src/components/Header/Header.tsx`, `src/components/Header/UserMenu.tsx`, `src/components/Header/MateriaControl.tsx`, `src/components/Footer/Footer.tsx`, `src/components/Body/Body.tsx`, `src/components/Body/Controls.tsx`, `src/constants.ts`
- Delete: `api/`, `src/dbutils.ts`, `src/components/Header/PadronInput.tsx`, `src/components/Body/Sugerencias.tsx`, `src/components/Body/LoadingGraph.tsx` (y cualquier tipo/constante que quede sin uso)

**Interfaces:**
- Consumes: `storage.ts` (Tarea 3), `tieneCBC`, `PLAN_POR_DEFECTO` (Tarea 2).
- Produces:
  - `UserType.Info = { carrera; orientacion; finDeCarrera; registro: Registro; revision: number }` (`revision` sube en cada import para forzar la re-población del grafo).
  - `UserType.Context = { user; setUser; saveUserGraph: SaveGraph; actualizarRegistro(fn: (r: Registro) => Registro): void; importarRegistro(r: Registro): void }`
  - `SaveGraph = (user: Info, materias, checkboxes, optativas, aplazos) => void` (sincrónico)
  - `resolverUsuario(registro: Registro, revision: number): Info` en `src/User.ts` (exportada): carrera = `ultimaCarrera` si existe en `CARRERAS`, si no `PLAN_POR_DEFECTO`; orientación y fin de carrera desde `registro.carreras[carrera.id]`.

- [ ] **Step 1: Test** `src/User.test.ts`:

```ts
import { resolverUsuario } from "./User";
import { registroInicial } from "./storage";

test("ultimaCarrera inexistente cae al plan por defecto", () => {
  const u = resolverUsuario({ ...registroInicial(), ultimaCarrera: "plan-borrado" }, 0);
  expect(u.carrera.id).toBe("uade-informatica-2021");
});
test("restaura orientación y fin de carrera guardados", () => {
  const r = { ...registroInicial(), ultimaCarrera: "informatica-2020",
    carreras: { "informatica-2020": { materias: [], finDeCarrera: "tesis" } } };
  expect(resolverUsuario(r, 0).finDeCarrera?.id).toBe("tesis");
});
```
(`"tesis"` es el id real de `finDeCarrera` en los planes de Informática de `carreras.ts`.)

- [ ] **Step 2: Correr y ver que falla.**
- [ ] **Step 3: Reescribir `src/User.ts`.** Estado inicial = `resolverUsuario(cargarRegistro(), 0)` (sincrónico, sin spinner). `actualizarRegistro` usa `setUser(prev => …)` funcional y llama `guardarRegistro` con el registro nuevo. `saveUserGraph` arma `CarreraData` con `armarCarreraData`, borra o setea `registro.carreras[carrera.id]`, aplica `conCarreraElegida` y escribe vía `actualizarRegistro` solo si el JSON cambió. `importarRegistro(r)` → `guardarRegistro(r)` + `setUser(resolverUsuario(r, prev.revision + 1))`.
- [ ] **Step 4: `src/Graph.ts`.**
  - Población: `user.record` → `user.registro`; deps `[user.revision, graph.key, network]`; en la rama "sin mapa" aprobar `"CBC"` solo si `tieneCBC(user.carrera)`.
  - Autosave: `const [cambios, setCambios] = React.useState(0)`; al final de `actualizar()` → `setCambios((c) => c + 1)`. Nuevo efecto con deps `[cambios, optativas, aplazos, user.orientacion, user.finDeCarrera]` que hace `if (!network || graph.key !== network.key) return;` y llama a la función interna de guardado (la ex-`saveGraph`, ya no exportada). **Sin debounce**: un cambio justo antes de cambiar de plan tiene que quedar guardado.
  - `changeCarrera(id)`: además de `setUser`, `actualizarRegistro((r) => conCarreraElegida(r, id))`.
  - `showLabels: true` (antes `logged`). Quitar `logged` y `saveGraph` del objeto que retorna.
  - Los planes `beta` también se guardan (la restricción del original existía por la base remota). Borrar el tipo `DBRecord`.
- [ ] **Step 5: Componentes.** `Header`: siempre `<UserMenu />` + selector. `UserMenu`: sin `padron`, sin "Cerrar sesión", sin botón Guardar ni el estado `saving`; el menú de configuración (orientación / fin de carrera) se muestra solo si `user.carrera.eligeOrientaciones || user.carrera.finDeCarrera`, con ícono y texto "Configuración"; se mantiene "Limpiar todos los cuatris". `MateriaControl`: sacar la condición `logged`. `Footer`: siempre visible (sin `Collapse in={logged}`). `Body`: sacar `loggingIn`/`LoadingGraph`. `Controls`: queda el toggle de tema y un link a `https://github.com/MatiasMarrassini/Mapa-Correlativas`; fuera FIUBA-Plan, cafecito y Sugerencias. `constants.ts`: fuera formularios, `SPREADSHEET`, `KEY`, `DB_PROXY`, `BUGS_FORM*`.
- [ ] **Step 6: Verificar:** `npx tsc --noEmit`, `npm test -- --watchAll=false` PASS. `npm start`, y a mano en el navegador:
  - abre en UADE sin pedir padrón; aprobar una materia, recargar → sigue aprobada;
  - pasar a `informatica-2020` (con el menú viejo de carreras, todavía sin facultades), aprobar algo y **en el mismo segundo** volver a UADE → al regresar a FIUBA lo aprobado está;
  - FIUBA arranca con el CBC aprobado; la pestaña Network no muestra requests externos.
- [ ] **Step 7: Commit** `feat: guardado automático local y sin login`

---

### Task 5: Selector de facultad

**Files:**
- Create: `src/components/Header/DropdownFacultades.tsx`
- Modify: `src/components/Header/DropdownCarreras.tsx` (filtra `PLANES` por facultad actual), `src/components/Header/Header.tsx`, `src/Graph.ts`, `src/types/Graph.ts`

**Interfaces:**
- Consumes: `FACULTADES`, `facultadDePlan`, `planesDeFacultad` (Tarea 2); `changeCarrera`, `user.registro.ultimaPorFacultad` (Tarea 4).
- Produces: `GraphType.Context.changeFacultad(facultadid: string): void` — va a `registro.ultimaPorFacultad[facultadid]` si existe y sigue en `planesDeFacultad(facultadid)`; si no, al primero de `planesDeFacultad(facultadid)`.

- [ ] **Step 1: Implementar `changeFacultad`** en `Graph.ts` (delegando en `changeCarrera`).
- [ ] **Step 2: `DropdownFacultades`**: `Menu` de Chakra con el mismo estilo de botón que `DropdownCarreras` (outline, blanco), muestra `nombre` de la facultad actual (`facultadDePlan(user.carrera.id)`), lista `FACULTADES`, la actual en negrita.
- [ ] **Step 3: `DropdownCarreras`**: `PLANES.filter((p) => p.facultad === facultadDePlan(user.carrera.id))`. Resto igual.
- [ ] **Step 4: `Header`**: a la derecha, `<Flex gap={2}><DropdownFacultades /><DropdownCarreras /></Flex>`.
- [ ] **Step 5: Verificar** `tsc` + tests, y a mano: UADE → FIUBA abre el primer plan de FIUBA; elegir `informatica-2020`, volver a UADE y otra vez a FIUBA → abre `informatica-2020`; el menú de carreras de UADE muestra solo "Ingeniería en Informática"; en ancho mobile (375 px) los dos menús entran en la barra.
- [ ] **Step 6: Commit** `feat: selector de facultad`

---

### Task 6: Créditos u horas y CBC opcional en la interfaz

**Files:**
- Modify: `src/utils.ts` (+ `ajustarProporciones`), `src/Graph.ts` (`updateCreditos`), `src/components/Footer/ProgressBar.tsx`, `src/components/Footer/Creditos.tsx`, `src/components/Footer/Promedio.tsx`, `src/components/Header/MateriaStatus.tsx`
- Test: `src/utils.test.ts`

**Interfaces:**
- Consumes: `tieneCBC`, `unidadTexto` (Tarea 2).
- Produces: `ajustarProporciones(creditos: GraphType.Credito[]): void` — calcula `proportion` de cada segmento como hoy (`Math.round(necesarios / total * 10) || 1`) y corrige la diferencia a 10 sobre el segmento **con más `creditosNecesarios`** (en vez de `creditos[1]`).

- [ ] **Step 1: Tests** `src/utils.test.ts`:

```ts
import { ajustarProporciones } from "./utils";
import { GraphType } from "./types/Graph";

const seg = (creditosNecesarios: number) =>
  ({ nombre: "x", nombrecorto: "x", bg: "", color: "", creditos: 0, creditosNecesarios }) as GraphType.Credito;
const suma = (cs: GraphType.Credito[]) => cs.reduce((a, c) => a + (c.proportion ?? 0), 0);

test.each([
  [[38, 200, 24, 8, 12]],   // FIUBA típico
  [[4226, 8]],              // UADE: obligatorias + inglés
  [[100]],                  // un solo segmento
  [[8, 8, 8]],              // solo checkboxes
])("las proporciones suman 10 (%j)", (necesarios) => {
  const cs = necesarios.map(seg);
  ajustarProporciones(cs);
  expect(suma(cs)).toBe(10);
  cs.forEach((c) => expect(c.proportion).toBeGreaterThanOrEqual(1));
});
```

- [ ] **Step 2: Correr y ver que falla.**
- [ ] **Step 3: Implementar** `ajustarProporciones` y usarla en `updateCreditos` (reemplaza el bloque de `totalNecesarios`/`obligatoriasCredito`).
- [ ] **Step 4: `updateCreditos`:** el segmento CBC solo si `getters.CBC().length > 0`; el de Electivas se omite **solo** si `getCorrectCreditos().electivas === 0` y no hay electivas aprobadas ni optativas (así ningún plan de FIUBA cambia).
- [ ] **Step 5: Textos:** `ProgressBar` ("X de Y créditos/horas"), `Creditos` (título "Créditos"/"Horas" y textos de optativas), `MateriaStatus` ("Otorga X …", "Requiere X …"; las aclaraciones "(con CBC)/(sin CBC)" solo si `tieneCBC`), `Promedio` (bloque "Promedio con CBC" solo si `tieneCBC`). Usar `unidadTexto(user.carrera)`; capitalizar donde el original usa mayúscula.
- [ ] **Step 6: Verificar** `tsc` + tests, y a mano en UADE: la barra muestra "Obligatorias" + "Inglés", sin CBC ni Electivas; el contador dice "Horas … de 4226"; aprobar todo + tildar Inglés → 100 %. En `informatica-2020` todo se ve igual que en el original.
- [ ] **Step 7: Commit** `feat: unidad de créditos u horas y CBC opcional según el plan`

---

### Task 7: Exportar e importar

**Files:**
- Create: `src/components/Header/ExportarImportar.tsx`
- Modify: `src/components/Header/UserMenu.tsx` (los íconos van donde estaba "Guardar")

**Interfaces:**
- Consumes: `exportarRegistro`, `parsearRegistro` (Tarea 3); `user.registro`, `importarRegistro` (Tarea 4).

- [ ] **Step 1: Exportar:** `IconButton` con tooltip "Exportar avance" (ícono `FaDownload`); arma un `Blob` con `exportarRegistro(user.registro)` y lo descarga como `mapa-correlativas-AAAA-MM-DD.json` (fecha local).
- [ ] **Step 2: Importar:** `IconButton` "Importar avance" (`FaUpload`) que abre un `<input type="file" accept=".json,application/json" hidden>`. Al elegir archivo: leer texto → `parsearRegistro`; si `null`, toast de error "El archivo no es un avance válido" y nada más; si es válido, `AlertDialog` de Chakra "Esto reemplaza todo tu avance guardado. ¿Seguir?" → confirmar llama `importarRegistro`. Resetear el `value` del input para poder reimportar el mismo archivo.
- [ ] **Step 3: Verificar** `tsc` + tests, y a mano: exportar → en DevTools borrar `localStorage` y recargar (vuelve a UADE vacío) → importar → vuelve todo, incluido el plan de FIUBA; importar un `.json` cualquiera → toast de error y nada cambia; cancelar el diálogo → nada cambia.
- [ ] **Step 4: Commit** `feat: exportar e importar el avance`

---

### Task 8: Nombre, README y CI

**Files:**
- Modify: `package.json` (`name: "mapa-correlativas"`, `homepage: "https://matiasmarrassini.github.io/Mapa-Correlativas"`), `public/index.html` (`<title>Mapa de Correlativas</title>`, `og:title`, `og:url`, canonical, `og:image` → `https://matiasmarrassini.github.io/Mapa-Correlativas/fmap.png`), `public/fmap.png` (captura nueva de la app con UADE), `README.md`, `.github/workflows/node.js.yml` (+ `- run: npm test -- --watchAll=false` después del chequeo de tipos)
- Modify: cualquier texto visible con "FIUBA Map" o `fede.dm` (buscar con `grep -rni "fiuba map\|fede.dm" src public`)

- [ ] **Step 1:** Cambios de nombre y metas. Captura nueva para `fmap.png` (con `npm start`, UADE con algunas materias aprobadas).
- [ ] **Step 2: README**: título "Mapa de Correlativas"; qué es (1–2 párrafos); link a GitHub Pages; captura; cómo correrlo (`npm install`, `npm start`, `npm test`); **cómo agregar una facultad** (formato del JSON de materias: `id`, `materia`, `creditos`, `correlativas` con ids separados por `-`, `categoria`, `level`; entradas en `FACULTADES`, `PLANES` y `CARRERAS`; `unidad` y CBC); qué cambió respecto del original (multi-facultad, horas, sin login, guardado local, exportar/importar); sección de crédito: "Basado en [FIUBA-Map](https://github.com/fdelmazo/FIUBA-Map) de Federico del Mazo (MIT)".
- [ ] **Step 3: Verificar:** `grep -rni "fede.dm" src public README.md package.json` vacío; `npm run build` OK.
- [ ] **Step 4: Commit** `docs: renombrar a Mapa de Correlativas y nuevo README`

---

### Task 9: Publicar y verificación final

- [ ] **Step 1: Verificación final local** contra los "Criterios de listo" del spec: `npx tsc --noEmit`, `npm test -- --watchAll=false`, `npm run build`, y recorrida manual (UADE horas 100 %, FIUBA igual al original, cambio de facultad/plan conserva avance, recarga conserva, exportar → borrar → importar, Network sin requests externos, sin restos de login: `grep -rni "padron\|logout\|login" src` solo puede devolver nada o comentarios irrelevantes).
- [ ] **Step 2: Confirmar con Matías** antes de: pushear, integrar a `main`, cambiar la rama por defecto, habilitar Actions/permisos de escritura del workflow y activar Pages. Mostrarle el resumen de commits (`git log --oneline main..multi-facultad`).
- [ ] **Step 3: Con su OK:**

```bash
git push -u origin multi-facultad
git checkout main && git merge --ff-only multi-facultad && git push origin main
gh repo edit MatiasMarrassini/Mapa-Correlativas --default-branch main --description "Mapa interactivo de materias y correlativas, multi-facultad (fork de FIUBA-Map)"
gh api -X PUT repos/MatiasMarrassini/Mapa-Correlativas/actions/permissions -F enabled=true -f allowed_actions=all
gh api -X PUT repos/MatiasMarrassini/Mapa-Correlativas/actions/permissions/workflow -f default_workflow_permissions=write
```
Si el push a `main` no dispara el workflow (Actions estaba deshabilitado en el fork), relanzarlo con `gh workflow run node.js.yml --ref main` o un push vacío.

- [ ] **Step 4:** Cuando el workflow publique la rama `gh-pages`, activar Pages si no quedó activo: `gh api -X POST repos/MatiasMarrassini/Mapa-Correlativas/pages -f "source[branch]=gh-pages" -f "source[path]=/"` (si responde 409, ya existe: `-X PUT` con los mismos campos).
- [ ] **Step 5: Verificar** que `https://matiasmarrassini.github.io/Mapa-Correlativas/` carga, abre en UADE y guarda al recargar.
