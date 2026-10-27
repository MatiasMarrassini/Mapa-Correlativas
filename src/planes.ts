import { PLANES } from "./carreras";
import { UserType } from "./types/User";

// Plan que se abre la primera vez que alguien entra
export const PLAN_POR_DEFECTO = "uade-informatica-2021";

export const facultadDePlan = (carreraid: string) =>
  PLANES.find((p) => p.planes.includes(carreraid))?.facultad;

// Todos los planes de una facultad, en el orden en que aparecen en `PLANES`
export const planesDeFacultad = (facultadid: string) =>
  PLANES.filter((p) => p.facultad === facultadid).flatMap((p) => p.planes);

// Un plan tiene CBC si su json tiene el nodo que lo agrupa
export const tieneCBC = (carrera: UserType.Carrera) =>
  carrera.graph.some((m) => m.id === "CBC");

export const unidadTexto = (carrera: UserType.Carrera) =>
  carrera.unidad === "horas" ? "horas" : "créditos";
