# Elegir optativas (UADE) — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Poder elegir qué optativa se cursa en cada lugar (Optativa I/II/III) del plan de UADE, con sus correlativas, aviso de correlativa-optativa pendiente, guardado y exportar/importar.

**Architecture:** La lista de optativas es un json aparte declarado en el plan (`optativasDelPlan`). La lógica (limpiar elecciones, correlativas, requisitos pendientes, filtro) va en un módulo puro `src/optativas.ts` con tests. `Graph.ts` guarda las elecciones en estado, las persiste vía `CarreraData.elecciones`, agrega flechas visibles con id `opt:` y suma un chequeo de requisitos-optativa a la habilitación. La UI suma un selector filtrable y un badge de aviso en la barra superior.

**Tech Stack:** React 18 + TypeScript 4.9 (CRA), Chakra UI 2, vis-network (react-graph-vis), Jest.

**Spec:** `docs/superpowers/specs/2026-10-27-optativas-uade-design.md`

## Global Constraints

- Repo `Mapa-Correlativas`, rama de trabajo `optativas` desde `main`. Push/merge/publicar solo con confirmación de Matías en el chat.
- Sin dependencias nuevas. Tests importan `expect`/`test` de `@jest/globals`.
- Identificadores y comentarios en español. Prettier solo sobre archivos tocados. No reformatear archivos enteros.
- El campo del plan **no** se llama `optativas` (ya existe para "créditos por fuera del plan"): se llama `optativasDelPlan`.
- Cada lugar vale lo que dice su nodo en el plan (68 hs); la optativa elegida no cambia horas.
- Registros viejos (sin `elecciones`) siguen siendo válidos; `version` sigue en 1.
- FIUBA sin cambios.
- Verificación base de cada tarea: `npx tsc --noEmit` y `CI=true npm test -- --watchAll=false` pasan; la última tarea además `CI=true npm run build`.

## Review Focus

1. **Elección con id desconocido o repetida en el registro** (archivo editado a mano, optativa sacada de la lista): ese lugar queda sin elegir, el resto carga. → Test de `limpiarElecciones` (Tarea 2).
2. **Elecciones guardadas que apuntan a lugares que no existen en el plan** (claves basura): se ignoran. → Test de `limpiarElecciones` (Tarea 2).
3. **Cambiar o quitar una optativa con correlativas**: las flechas viejas desaparecen y no quedan duplicadas. → Verificación manual en Tarea 4.
4. **Correlativa-optativa elegida en otro lugar pero desaprobada después**: el lugar dependiente se vuelve a bloquear y reaparece el aviso. → Test de `requisitosPendientes` (Tarea 2) + manual (Tarea 5).
5. **Filtro con tildes/mayúsculas** ("diseno" encuentra "Diseño…", "TESTING" encuentra "Testing…", código "3.4.228"). → Test de `filtrarOptativas` (Tarea 2).

---

### Task 1: Datos de optativas

**Files:**
- Create: `src/data/uade-informatica-2021-optativas.json` (las 81 filas del Anexo del spec: `{ "id", "materia", "correlativas"? }`, nombres como en el Anexo)
- Modify: `src/types/User.ts` (`OptativaJSON`, `OptativasDelPlan`, `Carrera.optativasDelPlan?`)
- Modify: `src/carreras.ts` (UADE: `optativasDelPlan: { lugares: ["OPT1", "OPT2", "OPT3"], materias: require("./data/uade-informatica-2021-optativas.json") }`)
- Test: `src/carreras.test.ts`

**Interfaces:**
- Produces: `UserType.OptativaJSON { id: string; materia: string; correlativas?: string }`, `UserType.OptativasDelPlan { lugares: string[]; materias: OptativaJSON[] }`.

- [ ] **Step 1: Test** en `src/carreras.test.ts`:

```ts
test("optativas del plan: lugares existen, ids únicos y correlativas válidas", () => {
  CARRERAS.filter((c) => c.optativasDelPlan).forEach((c) => {
    const { lugares, materias } = c.optativasDelPlan!;
    const delPlan = new Set(c.graph.map((m) => m.id));
    const optativas = new Set(materias.map((m) => m.id));
    lugares.forEach((l) => expect([c.id, l, delPlan.has(l)]).toEqual([c.id, l, true]));
    expect(optativas.size).toBe(materias.length);
    materias.forEach((m) =>
      (m.correlativas ?? "").split("-").filter(Boolean).forEach((id) =>
        expect([m.id, id, delPlan.has(id) || optativas.has(id)]).toEqual([m.id, id, true]),
      ),
    );
  });
});

test("UADE tiene 81 optativas y 3 lugares", () => {
  const uade = CARRERAS.find((c) => c.id === "uade-informatica-2021")!;
  expect(uade.optativasDelPlan?.lugares).toEqual(["OPT1", "OPT2", "OPT3"]);
  expect(uade.optativasDelPlan?.materias).toHaveLength(81);
});
```
- [ ] **Step 2:** Correr → FAIL (no existe `optativasDelPlan`).
- [ ] **Step 3:** Implementar tipos, json y entrada en `carreras.ts`.
- [ ] **Step 4:** Correr → PASS; `tsc` OK.
- [ ] **Step 5: Commit** `feat: lista de optativas de UADE`

---

### Task 2: Lógica de optativas

**Files:**
- Create: `src/optativas.ts`
- Test: `src/optativas.test.ts`

**Interfaces:**
- Consumes: `UserType.Carrera.optativasDelPlan` (Tarea 1).
- Produces (todas puras):
  - `type Elecciones = { [lugarId: string]: string }` (exportado también como `UserType.Elecciones`, ver Tarea 3)
  - `esLugarOptativa(carrera, id: string): boolean`
  - `optativaPorId(carrera, id: string): UserType.OptativaJSON | undefined`
  - `limpiarElecciones(carrera, elecciones: unknown): Elecciones` — solo claves que son lugares, valores que son ids de optativa existentes, sin repetir (gana el primer lugar en el orden de `lugares`). Si `elecciones` no es objeto → `{}`.
  - `lugarDeOptativa(elecciones, optativaId): string | undefined`
  - `correlativasDeEleccion(carrera, optativaId): { delPlan: string[]; optativas: string[] }`
  - `requisitosPendientes(carrera, elecciones, lugarId, estaAprobado: (nodoId: string) => boolean): UserType.OptativaJSON[]` — correlativas-optativa de la optativa elegida en `lugarId` que no están elegidas en otro lugar o cuyo lugar no está aprobado. Sin elección → `[]`.
  - `filtrarOptativas(materias, texto): OptativaJSON[]` — por nombre (sin tildes ni mayúsculas) o código; texto vacío → todas. Orden alfabético por nombre (`localeCompare` "es").

- [ ] **Step 1: Tests** `src/optativas.test.ts` (usar la carrera real de UADE de `CARRERAS`):

```ts
const uade = CARRERAS.find((c) => c.id === "uade-informatica-2021")!;

test("limpiarElecciones descarta lugares, ids y repetidas inválidas", () => {
  expect(limpiarElecciones(uade, { OPT1: "3.4.228", OPT2: "3.4.228", OPT3: "no-existe", BASURA: "1.2.001" }))
    .toEqual({ OPT1: "3.4.228" });
  expect(limpiarElecciones(uade, "nada")).toEqual({});
  expect(limpiarElecciones(uade, { OPT2: 5 })).toEqual({});
});

test("correlativasDeEleccion separa plan y optativas", () => {
  expect(correlativasDeEleccion(uade, "3.1.041")).toEqual({ delPlan: ["3.1.049"], optativas: [] });
  expect(correlativasDeEleccion(uade, "1.1.031")).toEqual({ delPlan: [], optativas: ["1.1.030"] });
  expect(correlativasDeEleccion(uade, "3.4.228")).toEqual({ delPlan: [], optativas: [] });
});

test("requisitosPendientes: no elegida, elegida sin aprobar, elegida y aprobada", () => {
  const nombres = (os: { materia: string }[]) => os.map((o) => o.materia);
  const nada = () => false;
  expect(nombres(requisitosPendientes(uade, { OPT2: "1.1.031" }, "OPT2", nada))).toEqual(["Dirección de Empresas"]);
  expect(nombres(requisitosPendientes(uade, { OPT1: "1.1.030", OPT2: "1.1.031" }, "OPT2", nada))).toEqual(["Dirección de Empresas"]);
  expect(requisitosPendientes(uade, { OPT1: "1.1.030", OPT2: "1.1.031" }, "OPT2", (id) => id === "OPT1")).toEqual([]);
  expect(requisitosPendientes(uade, {}, "OPT1", nada)).toEqual([]);
});

test("filtrarOptativas ignora tildes, mayúsculas y busca por código", () => {
  const m = uade.optativasDelPlan!.materias;
  expect(filtrarOptativas(m, "diseno").map((o) => o.id)).toEqual(expect.arrayContaining(["3.4.180", "3.4.226", "4.8.130"]));
  expect(filtrarOptativas(m, "TESTING").map((o) => o.id)).toEqual(["3.4.228"]);
  expect(filtrarOptativas(m, "3.4.228").map((o) => o.id)).toEqual(["3.4.228"]);
  expect(filtrarOptativas(m, "")).toHaveLength(81);
});

test("lugarDeOptativa y esLugarOptativa", () => {
  expect(lugarDeOptativa({ OPT3: "1.2.001" }, "1.2.001")).toBe("OPT3");
  expect(lugarDeOptativa({}, "1.2.001")).toBeUndefined();
  expect(esLugarOptativa(uade, "OPT2")).toBe(true);
  expect(esLugarOptativa(uade, "3.4.069")).toBe(false);
});
```
- [ ] **Step 2:** Correr → FAIL.
- [ ] **Step 3:** Implementar `src/optativas.ts`. Normalizar con `texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()`.
- [ ] **Step 4:** Correr → PASS.
- [ ] **Step 5: Commit** `feat: lógica para elegir optativas`

---

### Task 3: Guardar las elecciones

**Files:**
- Modify: `src/types/User.ts` (`Elecciones`, `CarreraData.elecciones?`, `SaveGraph` suma `elecciones: Elecciones`)
- Modify: `src/storage.ts` (`esCarreraData` valida `elecciones` opcional como objeto de strings; `armarCarreraData` recibe `elecciones?` y lo incluye si tiene claves, y cuenta para "no vacío")
- Modify: `src/User.ts` (`saveUserGraph` pasa `elecciones` a `armarCarreraData`), `src/Graph.ts` (llamada a `saveUserGraph` con `{}` por ahora)
- Test: `src/storage.test.ts`

- [ ] **Step 1: Tests:** en "rechaza campos opcionales con forma inválida" sumar `conCarrera({ elecciones: [] })` y `conCarrera({ elecciones: { OPT1: 3 } })`; en "acepta un registro completo válido" sumar `elecciones: { OPT1: "3.4.228" }`; test nuevo:

```ts
test("armarCarreraData: solo elecciones alcanza para guardar", () => {
  expect(armarCarreraData({ materias: [], optativas: [], aplazos: 0, elecciones: { OPT1: "3.4.228" } }))
    .toEqual({ materias: [], elecciones: { OPT1: "3.4.228" } });
  expect(armarCarreraData({ materias: [], optativas: [], aplazos: 0, elecciones: {} })).toBeUndefined();
});
```
- [ ] **Step 2:** Correr → FAIL.
- [ ] **Step 3:** Implementar.
- [ ] **Step 4:** Correr → PASS; `tsc` OK.
- [ ] **Step 5: Commit** `feat: guardar las optativas elegidas`

---

### Task 4: Optativas en el grafo

**Files:**
- Modify: `src/Graph.ts`, `src/Node.ts`, `src/types/Graph.ts`, `src/types/Node.ts` (si hace falta), `src/types/ReactGraphVis.ts` (`Edges.add`, `Edges.remove`)

**Interfaces:**
- Consumes: Tarea 2 y 3.
- Produces en `GraphType.Context`:
  - `elecciones: UserType.Elecciones`
  - `elegirOptativa(lugarId: string, optativaId: string | undefined): void`
  - `requisitosOptativa(lugarId: string): UserType.OptativaJSON[]` (= `requisitosPendientes` con `estaAprobado = (id) => !!getNode(id)?.aprobada`)
- `GraphType.Info` suma `requisitosOptativa(id: string): UserType.OptativaJSON[]` y `nombreEleccion(id: string): string | undefined`.

- [ ] **Step 1: Estado:** `const [elecciones, setElecciones] = React.useState<UserType.Elecciones>({})`. En la población: `setElecciones(limpiarElecciones(user.carrera, map?.elecciones))` (o `{}` sin mapa). `saveGraph` pasa `elecciones`; el efecto de autosave suma `elecciones` a sus deps.
- [ ] **Step 2: Flechas:** función `actualizarAristasOptativas(elecciones)` que borra las aristas con id que empieza con `opt:` y agrega, por cada lugar con elección: desde cada correlativa del plan (`opt:${desde}->${lugar}`), y desde el lugar donde esté elegida cada correlativa-optativa. Mismo `smooth` que las demás aristas. Se llama en un efecto con deps `[elecciones, network]` (con el guard `graph.key === network.key`), seguido de `actualizar()`.
- [ ] **Step 3: Nodo:** `Node.actualizar` usa `ctx.nombreEleccion(this.id)` para agregar el nombre elegido debajo del nombre del lugar (con `breakWords`). `Node.isHabilitada` exige además `ctx.requisitosOptativa(this.id).length === 0`.
- [ ] **Step 4: API:** `elegirOptativa` hace `setElecciones` (quitando la optativa de cualquier otro lugar no hace falta: el selector no lo permite; igual pasar el resultado por `limpiarElecciones`). Exponer `elecciones`, `elegirOptativa`, `requisitosOptativa` en el contexto.
- [ ] **Step 5: Verificar** `tsc` + tests y a mano (con la consola, llamando a la UI de la Tarea 5 todavía no existe: usar un registro inyectado en `localStorage` con `elecciones`): con `{ OPT1: "3.1.041" }` aparece flecha desde Probabilidad y Estadística y OPT1 bloqueada; con `{ OPT2: "1.1.031" }` OPT2 bloqueada; con `{ OPT1: "1.1.030", OPT2: "1.1.031" }` y OPT1 aprobada, OPT2 habilitada y flecha OPT1→OPT2; recargar conserva. FIUBA igual.
- [ ] **Step 6: Commit** `feat: optativas elegidas en el grafo`

---

### Task 5: Selector y aviso

**Files:**
- Create: `src/components/Header/SelectorOptativa.tsx`
- Modify: `src/components/Header/MateriaDisplay.tsx` (renderiza `<SelectorOptativa />` entre `MateriaStatus` y `MateriaControl`), `src/components/Header/MateriaStatus.tsx` (badges de aviso)

- [ ] **Step 1: Selector** (solo si `esLugarOptativa(user.carrera, displayedNode)`): `Popover` de Chakra con botón que muestra la elección actual o "Elegir optativa"; adentro `Input` con placeholder "Buscar por nombre o código" que filtra con `filtrarOptativas`, y lista desplazable (`maxHeight` ~50vh) con "Sin elegir" primero y cada optativa como "Nombre · código". Las elegidas en otro lugar, deshabilitadas con "(elegida en Optativa II)" usando el nombre del nodo del lugar. Click → `elegirOptativa` y cerrar.
- [ ] **Step 2: Aviso** en `MateriaStatus`: por cada `requisitosOptativa(node.id)`, `Badge` naranja outline: `Requiere la optativa {materia} como correlativa anterior`.
- [ ] **Step 3: Verificar** `tsc` + tests y a mano: criterios del spec (elegir Testing → nodo lo muestra, recargar conserva; Investigación Operativa → flecha y bloqueo; Desarrollo Gerencial en II → aviso, Dirección de Empresas en I + aprobar → se habilita; no se puede repetir; filtro "diseno"); importar un avance viejo sin elecciones funciona; ancho 375 px.
- [ ] **Step 4: Commit** `feat: selector de optativas con filtro y aviso de correlativas`

---

### Task 6: README y verificación final

- [ ] **Step 1:** README: en "Qué hace" sumar "**Optativas:** en planes que lo declaran (UADE), elegís qué optativa cursás en cada lugar, con sus correlativas". En "Cómo agregar una facultad", una línea sobre `optativasDelPlan`.
- [ ] **Step 2:** `npx tsc --noEmit`, `CI=true npm test -- --watchAll=false`, `CI=true npm run build`.
- [ ] **Step 3: Commit** `docs: optativas en el README`
