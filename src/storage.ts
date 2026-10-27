import { facultadDePlan, PLAN_POR_DEFECTO } from "./planes";
import { GraphType } from "./types/Graph";
import { UserType } from "./types/User";

// Todo el avance vive en el navegador, bajo una sola clave de localStorage
// No hay login ni base de datos: si se borran los datos del navegador, se pierde
// (para eso esta exportar/importar)
export const STORAGE_KEY = "mapa-correlativas";

export const registroInicial = (): UserType.Registro => ({
  version: 1,
  ultimaCarrera: PLAN_POR_DEFECTO,
  ultimaPorFacultad: {},
  carreras: {},
});

const esObjeto = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null && !Array.isArray(x);

// Un campo opcional esta bien si falta o si cumple la condicion
const opcional = (x: unknown, ok: (x: unknown) => boolean) =>
  x === undefined || ok(x);
const esString = (x: unknown) => typeof x === "string";
const esNumero = (x: unknown) => typeof x === "number";
const esListaDe = (ok: (x: unknown) => boolean) => (x: unknown) =>
  Array.isArray(x) && x.every(ok);

const esMateria = (m: unknown) =>
  esObjeto(m) &&
  esString(m.id) &&
  esNumero(m.nota) &&
  opcional(m.cuatrimestre, esNumero);

const esOptativa = (o: unknown) =>
  esObjeto(o) && esNumero(o.id) && esString(o.nombre) && esNumero(o.creditos);

// Validamos todo lo que despues usa el grafo: un campo con otra forma lo rompe
const esCarreraData = (x: unknown) =>
  esObjeto(x) &&
  esListaDe(esMateria)(x.materias) &&
  opcional(x.orientacion, esString) &&
  opcional(x.finDeCarrera, esString) &&
  opcional(x.checkboxes, esListaDe(esString)) &&
  opcional(x.optativas, esListaDe(esOptativa)) &&
  opcional(x.aplazos, esNumero);

// Valida un registro que viene de afuera (localStorage o un archivo importado)
// Si la forma no es la esperada devuelve null; si faltan campos opcionales los completa
export const parsearRegistro = (texto: string): UserType.Registro | null => {
  let data: unknown;
  try {
    data = JSON.parse(texto);
  } catch {
    return null;
  }
  if (!esObjeto(data) || !esObjeto(data.carreras)) return null;
  if (!Object.values(data.carreras).every(esCarreraData)) return null;
  if (
    !opcional(
      data.ultimaPorFacultad,
      (x) => esObjeto(x) && Object.values(x).every(esString),
    )
  )
    return null;

  const inicial = registroInicial();
  return {
    version: 1,
    ultimaCarrera:
      typeof data.ultimaCarrera === "string"
        ? data.ultimaCarrera
        : inicial.ultimaCarrera,
    ultimaPorFacultad:
      (data.ultimaPorFacultad as UserType.Registro["ultimaPorFacultad"]) ??
      inicial.ultimaPorFacultad,
    carreras: data.carreras as UserType.Registro["carreras"],
  };
};

export const cargarRegistro = (): UserType.Registro => {
  try {
    const texto = window.localStorage.getItem(STORAGE_KEY);
    return (texto && parsearRegistro(texto)) || registroInicial();
  } catch {
    return registroInicial();
  }
};

export const guardarRegistro = (registro: UserType.Registro) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(registro));
  } catch {
    // Sin localStorage (modo privado, cuota llena) la app anda igual, pero sin guardar
  }
};

export const exportarRegistro = (registro: UserType.Registro) =>
  JSON.stringify(registro, null, 2);

// Arma lo que se guarda de un plan, omitiendo lo vacio
// Si no hay nada que guardar (a lo sumo el CBC aprobado por defecto), devuelve undefined
export const armarCarreraData = (datos: {
  materias: UserType.Materia[];
  orientacion?: string;
  finDeCarrera?: string;
  checkboxes?: string[];
  optativas: GraphType.Optativa[];
  aplazos: number;
}): UserType.CarreraData | undefined => {
  const {
    materias,
    orientacion,
    finDeCarrera,
    checkboxes,
    optativas,
    aplazos,
  } = datos;
  const vacio =
    materias.every((m) => m.id === "CBC") &&
    !orientacion &&
    !finDeCarrera &&
    !checkboxes?.length &&
    !optativas.length &&
    !aplazos;
  if (vacio) return undefined;

  return {
    materias,
    ...(orientacion && { orientacion }),
    ...(finDeCarrera && { finDeCarrera }),
    ...(checkboxes?.length && { checkboxes }),
    ...(optativas.length && { optativas }),
    ...(aplazos && { aplazos }),
  };
};

// Marca un plan como el ultimo usado, en general y dentro de su facultad
export const conCarreraElegida = (
  registro: UserType.Registro,
  carreraid: string,
): UserType.Registro => {
  const facultad = facultadDePlan(carreraid);
  return {
    ...registro,
    ultimaCarrera: carreraid,
    ultimaPorFacultad: facultad
      ? { ...registro.ultimaPorFacultad, [facultad]: carreraid }
      : registro.ultimaPorFacultad,
  };
};
