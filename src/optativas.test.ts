import { expect, test } from "@jest/globals";
import { CARRERAS } from "./carreras";
import {
  correlativasDeEleccion,
  esLugarOptativa,
  filtrarOptativas,
  limpiarElecciones,
  lugarDeOptativa,
  requisitosPendientes,
} from "./optativas";

const uade = CARRERAS.find((c) => c.id === "uade-informatica-2021")!;

test("limpiarElecciones descarta lugares, ids y repetidas inválidas", () => {
  expect(
    limpiarElecciones(uade, {
      OPT1: "3.4.228",
      OPT2: "3.4.228",
      OPT3: "no-existe",
      BASURA: "1.2.001",
    }),
  ).toEqual({ OPT1: "3.4.228" });
  expect(limpiarElecciones(uade, "nada")).toEqual({});
  expect(limpiarElecciones(uade, { OPT2: 5 })).toEqual({});
});

test("correlativasDeEleccion separa plan y optativas", () => {
  expect(correlativasDeEleccion(uade, "3.1.041")).toEqual({
    delPlan: ["3.1.049"],
    optativas: [],
  });
  expect(correlativasDeEleccion(uade, "1.1.031")).toEqual({
    delPlan: [],
    optativas: ["1.1.030"],
  });
  expect(correlativasDeEleccion(uade, "3.4.228")).toEqual({
    delPlan: [],
    optativas: [],
  });
});

test("requisitosPendientes: no elegida, elegida sin aprobar, elegida y aprobada", () => {
  const nombres = (os: { materia: string }[]) => os.map((o) => o.materia);
  const nada = () => false;
  expect(
    nombres(requisitosPendientes(uade, { OPT2: "1.1.031" }, "OPT2", nada)),
  ).toEqual(["Dirección de Empresas"]);
  expect(
    nombres(
      requisitosPendientes(
        uade,
        { OPT1: "1.1.030", OPT2: "1.1.031" },
        "OPT2",
        nada,
      ),
    ),
  ).toEqual(["Dirección de Empresas"]);
  expect(
    requisitosPendientes(
      uade,
      { OPT1: "1.1.030", OPT2: "1.1.031" },
      "OPT2",
      (id) => id === "OPT1",
    ),
  ).toEqual([]);
  expect(requisitosPendientes(uade, {}, "OPT1", nada)).toEqual([]);
});

test("filtrarOptativas ignora tildes, mayúsculas y busca por código", () => {
  const m = uade.optativasDelPlan!.materias;
  expect(filtrarOptativas(m, "diseno").map((o) => o.id)).toEqual(
    expect.arrayContaining(["3.4.180", "3.4.226", "4.8.130"]),
  );
  expect(filtrarOptativas(m, "TESTING").map((o) => o.id)).toEqual(["3.4.228"]);
  expect(filtrarOptativas(m, "3.4.228").map((o) => o.id)).toEqual(["3.4.228"]);
  expect(filtrarOptativas(m, "")).toHaveLength(80);
});

test("lugarDeOptativa y esLugarOptativa", () => {
  expect(lugarDeOptativa({ OPT3: "1.2.001" }, "1.2.001")).toBe("OPT3");
  expect(lugarDeOptativa({}, "1.2.001")).toBeUndefined();
  expect(esLugarOptativa(uade, "OPT2")).toBe(true);
  expect(esLugarOptativa(uade, "3.4.069")).toBe(false);
});
