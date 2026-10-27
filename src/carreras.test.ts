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
