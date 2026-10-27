import { beforeEach, expect, test } from "@jest/globals";
import {
  STORAGE_KEY,
  registroInicial,
  parsearRegistro,
  cargarRegistro,
  guardarRegistro,
  exportarRegistro,
  armarCarreraData,
  conCarreraElegida,
} from "./storage";

beforeEach(() => window.localStorage.clear());

test("sin nada guardado arranca con el registro inicial", () => {
  expect(cargarRegistro()).toEqual(registroInicial());
  expect(registroInicial().ultimaCarrera).toBe("uade-informatica-2021");
});

test("guardar y cargar devuelve lo mismo", () => {
  const r = {
    ...registroInicial(),
    carreras: { "informatica-2020": { materias: [{ id: "CB001", nota: 7 }] } },
  };
  guardarRegistro(r);
  expect(cargarRegistro()).toEqual(r);
});

test("basura o formato viejo en localStorage no rompe", () => {
  window.localStorage.setItem(STORAGE_KEY, "{no es json");
  expect(cargarRegistro()).toEqual(registroInicial());
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ padron: "123", carreras: 5 }),
  );
  expect(cargarRegistro()).toEqual(registroInicial());
});

test("parsearRegistro rechaza formas inválidas", () => {
  [
    "[]",
    "42",
    "null",
    '{"carreras":[]}',
    '{"carreras":{"x":{"materias":[{"nota":4}]}}}',
    '{"carreras":{"x":{"materias":"nada"}}}',
  ].forEach((t) => expect([t, parsearRegistro(t)]).toEqual([t, null]));
});

test("parsearRegistro completa campos y descarta claves ajenas", () => {
  const r = parsearRegistro(JSON.stringify({ padron: "1", carreras: {} }));
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
  expect(
    armarCarreraData({
      materias: [{ id: "3.4.069", nota: 8 }],
      optativas: [],
      aplazos: 0,
    }),
  ).toEqual({ materias: [{ id: "3.4.069", nota: 8 }] });
});

test("armarCarreraData: solo el CBC y nada más no se guarda", () => {
  expect(
    armarCarreraData({
      materias: [{ id: "CBC", nota: 0 }],
      optativas: [],
      aplazos: 0,
    }),
  ).toBeUndefined();
});

test("armarCarreraData: un checkbox solo alcanza para guardar", () => {
  expect(
    armarCarreraData({
      materias: [],
      checkboxes: ["Examen de Inglés"],
      optativas: [],
      aplazos: 0,
    }),
  ).toEqual({ materias: [], checkboxes: ["Examen de Inglés"] });
});
