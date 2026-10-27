import { expect, test } from "@jest/globals";
import { CARRERAS } from "./carreras";
import {
  facultadDePlan,
  planesDeFacultad,
  tieneCBC,
  unidadTexto,
  PLAN_POR_DEFECTO,
} from "./planes";

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
