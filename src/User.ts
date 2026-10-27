import React from "react";
import { CARRERAS } from "./carreras";
import { PLAN_POR_DEFECTO } from "./planes";
import {
  armarCarreraData,
  cargarRegistro,
  conCarreraElegida,
  guardarRegistro,
} from "./storage";
import { UserType } from "./types/User";

// No hay login: el "usuario" es lo que esta guardado en el navegador
// (ver `storage.ts`). Al iniciar se abre el ultimo plan usado, con su orientacion
// y fin de carrera
export const resolverUsuario = (
  registro: UserType.Registro,
  revision: number,
): UserType.Info => {
  const carrera =
    CARRERAS.find((c) => c.id === registro.ultimaCarrera) ??
    CARRERAS.find((c) => c.id === PLAN_POR_DEFECTO)!;
  const carreraData = registro.carreras[carrera.id];
  const orientacion = carreraData?.orientacion
    ? carrera.orientaciones?.find((o) => o.nombre === carreraData.orientacion)
    : undefined;
  const finDeCarrera = carreraData?.finDeCarrera
    ? carrera.finDeCarrera?.find((f) => f.id === carreraData.finDeCarrera)
    : undefined;
  return { carrera, orientacion, finDeCarrera, registro, revision };
};

const User = (): UserType.Context => {
  const [user, setUser] = React.useState<UserType.Info>(() =>
    resolverUsuario(cargarRegistro(), 0),
  );

  // Unica via para escribir el registro: actualiza el estado y lo persiste
  const actualizarRegistro = (
    fn: (registro: UserType.Registro) => UserType.Registro,
  ) => {
    setUser((prev) => {
      const registro = fn(prev.registro);
      if (JSON.stringify(registro) === JSON.stringify(prev.registro))
        return prev;
      guardarRegistro(registro);
      return { ...prev, registro };
    });
  };

  // Guarda el mapa del plan actual con toda su metadata. Se llama solo, en cada cambio
  const saveUserGraph: UserType.SaveGraph = (
    user,
    materias,
    checkboxes,
    optativas,
    aplazos,
    elecciones,
  ) => {
    const carreraData = armarCarreraData({
      materias,
      orientacion: user.orientacion?.nombre,
      finDeCarrera: user.finDeCarrera?.id,
      checkboxes,
      optativas,
      aplazos,
      elecciones,
    });
    actualizarRegistro((registro) => {
      const carreras = { ...registro.carreras };
      if (carreraData) carreras[user.carrera.id] = carreraData;
      else delete carreras[user.carrera.id];
      return conCarreraElegida({ ...registro, carreras }, user.carrera.id);
    });
  };

  // Reemplaza todo el avance por el de un archivo importado
  const importarRegistro = (registro: UserType.Registro) => {
    guardarRegistro(registro);
    setUser((prev) => resolverUsuario(registro, prev.revision + 1));
  };

  return {
    user,
    setUser,
    saveUserGraph,
    actualizarRegistro,
    importarRegistro,
  };
};

export default User;
