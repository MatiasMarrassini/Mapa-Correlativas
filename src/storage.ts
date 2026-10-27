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

const esCarreraData = (x: unknown) =>
  esObjeto(x) &&
  Array.isArray(x.materias) &&
  x.materias.every(
    (m) =>
      esObjeto(m) && typeof m.id === "string" && typeof m.nota === "number",
  );

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

  const inicial = registroInicial();
  return {
    version: 1,
    ultimaCarrera:
      typeof data.ultimaCarrera === "string"
        ? data.ultimaCarrera
        : inicial.ultimaCarrera,
    ultimaPorFacultad: esObjeto(data.ultimaPorFacultad)
      ? (data.ultimaPorFacultad as UserType.Registro["ultimaPorFacultad"])
      : inicial.ultimaPorFacultad,
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
