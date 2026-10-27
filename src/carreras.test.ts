import { expect, test } from "@jest/globals";
import { CARRERAS, PLANES, FACULTADES } from "./carreras";

test("cada correlativa apunta a una materia del mismo plan", () => {
  CARRERAS.forEach((c) => {
    const ids = new Set(c.graph.map((m) => m.id));
    c.graph.forEach((m) =>
      (m.correlativas ?? "")
        .split("-")
        .filter(Boolean)
        .forEach((id) =>
          expect([c.id, m.id, id, ids.has(id)]).toEqual([c.id, m.id, id, true]),
        ),
    );
  });
});

test("cada plan pertenece a exactamente una entrada de PLANES con facultad válida", () => {
  const facultades = FACULTADES.map((f) => f.id);
  CARRERAS.forEach((c) => {
    const grupos = PLANES.filter((p) => p.planes.includes(c.id));
    expect([c.id, grupos.length]).toEqual([c.id, 1]);
    expect(facultades).toContain(grupos[0]!.facultad);
  });
});

test("UADE Informática 2021: horas, sin CBC, 4226 hs y el inglés como requisito", () => {
  const uade = CARRERAS.find((c) => c.id === "uade-informatica-2021")!;
  expect(uade.unidad).toBe("horas");
  expect(uade.creditos.total).toBe(4226);
  expect(uade.graph.reduce((acc, m) => acc + m.creditos, 0)).toBe(4226);
  expect(uade.graph.some((m) => m.id === "CBC" || m.id === "2.4.216")).toBe(
    false,
  );
  expect(uade.creditos.checkbox?.map((c) => c.nombrecorto)).toEqual(["Inglés"]);
});

test("UADE: Matemática Discreta es correlativa de Teoría de la Computación, no de Física II", () => {
  const uade = CARRERAS.find((c) => c.id === "uade-informatica-2021")!;
  const correlativas = (id: string) =>
    uade.graph
      .find((m) => m.id === id)
      ?.correlativas?.split("-")
      .sort();
  expect(correlativas("3.1.055")).toEqual(["3.1.052"]);
  expect(correlativas("3.4.215")).toEqual(["3.1.024", "3.4.077"]);
});

test("optativas del plan: lugares existen, ids únicos y correlativas válidas", () => {
  CARRERAS.filter((c) => c.optativasDelPlan).forEach((c) => {
    const { lugares, materias } = c.optativasDelPlan!;
    const delPlan = new Set(c.graph.map((m) => m.id));
    const optativas = new Set(materias.map((m) => m.id));
    lugares.forEach((l) =>
      expect([c.id, l, delPlan.has(l)]).toEqual([c.id, l, true]),
    );
    expect(optativas.size).toBe(materias.length);
    materias.forEach((m) =>
      (m.correlativas ?? "")
        .split("-")
        .filter(Boolean)
        .forEach((id) =>
          expect([m.id, id, delPlan.has(id) || optativas.has(id)]).toEqual([
            m.id,
            id,
            true,
          ]),
        ),
    );
  });
});

test("UADE tiene 80 optativas y 3 lugares", () => {
  const uade = CARRERAS.find((c) => c.id === "uade-informatica-2021")!;
  expect(uade.optativasDelPlan?.lugares).toEqual(["OPT1", "OPT2", "OPT3"]);
  expect(uade.optativasDelPlan?.materias).toHaveLength(80);
});
