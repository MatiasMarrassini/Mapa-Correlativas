import { expect, test } from "@jest/globals";
import { ajustarProporciones, cambioElAncho } from "./utils";
import { GraphType } from "./types/Graph";

const seg = (creditosNecesarios: number): GraphType.Credito => ({
  nombre: "x",
  nombrecorto: "x",
  bg: "",
  color: "",
  creditos: 0,
  creditosNecesarios,
});
const suma = (cs: GraphType.Credito[]) =>
  cs.reduce((a, c) => a + (c.proportion ?? 0), 0);

test.each([
  [[38, 200, 24, 8, 12]], // FIUBA típico
  [[4226, 8]], // UADE: obligatorias + inglés
  [[100]], // un solo segmento
  [[8, 8, 8]], // solo checkboxes
])("las proporciones suman 10 (%j)", (necesarios: number[]) => {
  const cs = necesarios.map(seg);
  ajustarProporciones(cs);
  expect(suma(cs)).toBe(10);
  cs.forEach((c) => expect(c.proportion).toBeGreaterThanOrEqual(1));
});

test("cambioElAncho: solo un cambio de ancho reencuadra el mapa", () => {
  expect(cambioElAncho(undefined, 375)).toBe(true); // primera vez
  expect(cambioElAncho(375, 375)).toBe(false); // solo cambió el alto
  expect(cambioElAncho(375, 812)).toBe(true); // rotó el celular
  expect(cambioElAncho(375, undefined)).toBe(false); // todavía sin medir
});
