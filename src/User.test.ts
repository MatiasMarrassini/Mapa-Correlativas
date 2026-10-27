import { expect, test } from "@jest/globals";
import { resolverUsuario } from "./User";
import { registroInicial } from "./storage";

test("ultimaCarrera inexistente cae al plan por defecto", () => {
  const u = resolverUsuario(
    { ...registroInicial(), ultimaCarrera: "plan-borrado" },
    0,
  );
  expect(u.carrera.id).toBe("uade-informatica-2021");
});

test("restaura orientación y fin de carrera guardados", () => {
  const r = {
    ...registroInicial(),
    ultimaCarrera: "informatica",
    carreras: { informatica: { materias: [], finDeCarrera: "tesis" } },
  };
  const u = resolverUsuario(r, 3);
  expect(u.carrera.id).toBe("informatica");
  expect(u.finDeCarrera?.id).toBe("tesis");
  expect(u.revision).toBe(3);
});
