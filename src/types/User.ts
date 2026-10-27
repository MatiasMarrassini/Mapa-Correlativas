import React from "react";
import { GraphType } from "./Graph";
import { COLORS } from "../theme";

export namespace UserType {
  interface MateriaCredito {
    id: string;
    nombrecorto: string;
    bg: string;
    color: string;
  }

  interface Checkbox {
    nombre: string;
    nombrecorto: string;
    bg: string;
    color: string;
    check?: boolean;
  }

  interface OrientacionCredito {
    orientacion: number;
    electivas: Electivas;
  }

  interface Creditos {
    total: number;
    electivas?: number | Electivas;
    checkbox?: Checkbox[];
    materias?: MateriaCredito[];
    orientacion?: { [key: string]: OrientacionCredito };
  }

  export interface MateriaJSON {
    id: string;
    materia: string;
    creditos: number;
    categoria: string;
    level: number;
    correlativas: string | undefined;
    requiere: number | undefined;
    requiereCBC: boolean | undefined;
  }

  export interface Electivas {
    tesis: number;
    tpp: number;
    [key: string]: number;
  }

  export interface Orientacion {
    colorScheme: keyof typeof COLORS;
    nombre: string;
    nonEligible?: true;
    color?: string;
  }

  export interface FinDeCarrera {
    id: string;
    materia: string;
  }

  // Una materia que se puede elegir para un lugar de optativa del plan
  export interface OptativaJSON {
    id: string;
    materia: string;
    // ids separados por guiones: pueden ser materias del plan u otras optativas
    correlativas?: string;
  }

  // Que nodos del plan son lugares de optativa (ej. Optativa I) y que materias se pueden elegir
  export interface OptativasDelPlan {
    lugares: string[];
    materias: OptativaJSON[];
  }

  // Lugar de optativa -> id de la optativa elegida
  export type Elecciones = { [lugarId: string]: string };

  export interface Facultad {
    id: string;
    nombre: string;
  }

  export interface Carrera {
    id: string;
    link: string;
    ano: number;
    // Por defecto se cuentan créditos; algunas facultades (ej. UADE) cuentan horas
    unidad?: "creditos" | "horas";
    optativasDelPlan?: OptativasDelPlan;
    beta?: boolean;
    graph: MateriaJSON[];
    creditos: Creditos;
    eligeOrientaciones?: true;
    orientaciones?: Orientacion[];
    finDeCarrera?: FinDeCarrera[];
  }

  export interface Materia {
    id: string;
    nota: number;
    cuatrimestre?: number;
  }

  export interface CarreraData {
    orientacion?: string;
    finDeCarrera?: string;
    materias: Materia[];
    checkboxes?: string[];
    optativas?: GraphType.Optativa[];
    aplazos?: number;
    elecciones?: Elecciones;
  }

  // Todo lo que se guarda en el navegador (y lo que se exporta/importa)
  export interface Registro {
    version: 1;
    ultimaCarrera: string;
    ultimaPorFacultad: { [facultadid: string]: string };
    carreras: { [carreraid: string]: CarreraData };
  }

  export interface SaveGraph {
    (
      user: Info,
      materias: Materia[],
      checkboxes: string[] | undefined,
      optativas: GraphType.Optativa[],
      aplazos: number,
      elecciones: Elecciones,
    ): void;
  }

  export interface Context {
    user: Info;
    setUser: React.Dispatch<React.SetStateAction<Info>>;
    saveUserGraph: SaveGraph;
    actualizarRegistro(fn: (registro: Registro) => Registro): void;
    importarRegistro(registro: Registro): void;
  }

  export interface Info {
    carrera: Carrera;
    orientacion: Orientacion | undefined | null;
    finDeCarrera: FinDeCarrera | undefined | null;
    registro: Registro;
    // Sube cada vez que se importa un registro, para volver a poblar el grafo
    revision: number;
  }
}
