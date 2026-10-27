import { NodeType } from "./types/Node";
import { GraphType } from "./types/Graph";

export const promediar = (materias: NodeType[]) => {
  const sum = materias.reduce((acc, node: NodeType) => {
    acc += node.nota;
    return acc;
  }, 0);
  return sum ? (sum / materias.length).toFixed(2) : 0;
};

export const accCreditos = (
  acc: number,
  node: NodeType | GraphType.Optativa,
) => {
  acc += node.creditos;
  return acc;
};

export const accCreditosNecesarios = (
  acc: number,
  grupo: GraphType.Credito,
) => {
  acc += grupo.creditosNecesarios;
  return acc;
};

export const accProportion = (acc: number, grupo: GraphType.Credito) => {
  if (grupo.proportion) {
    acc += grupo.proportion;
  }
  return acc;
};

export const getCurrentCuatri = () => {
  const today = new Date();
  let cuatri = today.getFullYear();
  const month = today.getMonth();
  // recordemos que el month esta 0-indexed
  // 1C entre marzo (2) y julio (6)
  // 2C entre agosto (7) y febrero (1)
  if (month < 2) cuatri -= 0.5;
  else if (month > 6) cuatri += 0.5;
  return cuatri;
};

// Le da a cada barrita de progreso un tamaño proporcional a su peso sobre el total
// (en una grilla de 10 columnas, minimo 1 cada una), y la diferencia de redondeo
// se la come la barrita mas grande
export const ajustarProporciones = (creditos: GraphType.Credito[]) => {
  const totalNecesarios = creditos.reduce(accCreditosNecesarios, 0);
  creditos.forEach((c) => {
    c.proportion =
      Math.round((c.creditosNecesarios / totalNecesarios) * 10) || 1;
  });

  const masGrande = creditos.reduce<GraphType.Credito | undefined>(
    (max, c) =>
      !max || c.creditosNecesarios > max.creditosNecesarios ? c : max,
    undefined,
  );
  if (masGrande?.proportion)
    masGrande.proportion += 10 - creditos.reduce(accProportion, 0);
};
