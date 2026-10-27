import { UserType } from "./types/User";

// Logica para elegir que optativa se cursa en cada lugar de optativa del plan
// (ej. en UADE: Optativa I, II y III). Todo puro, el estado vive en Graph.ts

const lugares = (carrera: UserType.Carrera) =>
  carrera.optativasDelPlan?.lugares ?? [];

export const esLugarOptativa = (carrera: UserType.Carrera, id: string) =>
  lugares(carrera).includes(id);

export const optativaPorId = (carrera: UserType.Carrera, id: string) =>
  carrera.optativasDelPlan?.materias.find((m) => m.id === id);

// Se queda solo con elecciones validas: lugares del plan, optativas que existen,
// y sin repetir una optativa en dos lugares (gana el primer lugar)
export const limpiarElecciones = (
  carrera: UserType.Carrera,
  elecciones: unknown,
): UserType.Elecciones => {
  const limpias: UserType.Elecciones = {};
  if (typeof elecciones !== "object" || elecciones === null) return limpias;
  const datos = elecciones as Record<string, unknown>;
  lugares(carrera).forEach((lugar) => {
    const id = datos[lugar];
    if (
      typeof id === "string" &&
      optativaPorId(carrera, id) &&
      !Object.values(limpias).includes(id)
    )
      limpias[lugar] = id;
  });
  return limpias;
};

export const lugarDeOptativa = (
  elecciones: UserType.Elecciones,
  optativaId: string,
) => Object.keys(elecciones).find((lugar) => elecciones[lugar] === optativaId);

// Las correlativas de una optativa pueden ser materias del plan u otras optativas
export const correlativasDeEleccion = (
  carrera: UserType.Carrera,
  optativaId: string,
) => {
  const ids = (optativaPorId(carrera, optativaId)?.correlativas ?? "")
    .split("-")
    .filter(Boolean);
  return {
    delPlan: ids.filter((id) => !optativaPorId(carrera, id)),
    optativas: ids.filter((id) => optativaPorId(carrera, id)),
  };
};

// Correlativas-optativa que todavia no se cumplen para lo elegido en un lugar:
// no estan elegidas en ningun lugar, o su lugar no esta aprobado
export const requisitosPendientes = (
  carrera: UserType.Carrera,
  elecciones: UserType.Elecciones,
  lugarId: string,
  estaAprobado: (nodoId: string) => boolean,
) => {
  const elegida = elecciones[lugarId];
  if (!elegida) return [];
  return correlativasDeEleccion(carrera, elegida)
    .optativas.filter((id) => {
      const lugar = lugarDeOptativa(elecciones, id);
      return !lugar || !estaAprobado(lugar);
    })
    .map((id) => optativaPorId(carrera, id)!);
};

const normalizar = (texto: string) =>
  texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Filtra por nombre (sin importar tildes ni mayusculas) o por codigo, en orden alfabetico
export const filtrarOptativas = (
  materias: UserType.OptativaJSON[],
  texto: string,
) => {
  const buscado = normalizar(texto.trim());
  return materias
    .filter(
      (m) =>
        normalizar(m.materia).includes(buscado) ||
        m.id.toLowerCase().includes(buscado),
    )
    .sort((a, b) => a.materia.localeCompare(b.materia, "es"));
};
