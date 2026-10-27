import React from "react";
import { SettingsIcon } from "@chakra-ui/icons";
import {
  Button,
  Menu,
  MenuButton,
  MenuItemOption,
  MenuList,
  MenuOptionGroup,
  Icon,
  IconButton,
  Tooltip,
  Box,
  PlacementWithLogical,
  ResponsiveValue,
} from "@chakra-ui/react";
import { Property } from "csstype";
import { FaUndo } from "react-icons/fa";
import { GraphContext, UserContext } from "../../MapContext";
import ExportarImportar from "./ExportarImportar";

const ButtonProps = {
  bg: "teal.500",
  color: "white",
  _hover: { bg: "teal.600" },
  _active: { bg: "teal.600" },
  size: "sm",
};

const TooltipProps = {
  closeOnClick: true,
  hasArrow: true,
  placement: "bottom" as PlacementWithLogical,
  textAlign: "center" as ResponsiveValue<Property.TextAlign>,
};

// Menu para elegir orientacion y fin de carrera (solo si el plan tiene algo para elegir)
// Es un botoncito de settings arriba a la izquierda de la app
// Tambien los botones para exportar/importar el avance y reiniciar los cuatrimestres planeados
// (no hay boton de guardar: todo se guarda solo)
const UserMenu = () => {
  const { user } = React.useContext(UserContext);

  const {
    restartGraphCuatris,
    getters,
    changeOrientacion,
    changeFinDeCarrera,
    getNode,
  } = React.useContext(GraphContext);
  const tieneConfiguracion =
    user.carrera.eligeOrientaciones || user.carrera.finDeCarrera;
  return (
    <Box>
      {tieneConfiguracion && (
        <Menu
          closeOnSelect={false}
          defaultIsOpen={
            (user.carrera.eligeOrientaciones && !user.orientacion) ||
            (user.carrera.finDeCarrera && !user.finDeCarrera)
          }
        >
          <MenuButton as={Button} leftIcon={<SettingsIcon />} {...ButtonProps}>
            Configuración
          </MenuButton>
          <MenuList>
            {user.carrera.finDeCarrera && (
              <MenuOptionGroup
                onChange={(value) => {
                  changeFinDeCarrera(value as string);
                }}
                value={user.finDeCarrera?.id || "none"}
                title="Fin de Carrera"
                type="radio"
              >
                <MenuItemOption type="checkbox" value={"none"}>
                  No me decidí
                </MenuItemOption>

                {user.carrera.finDeCarrera &&
                  Object.values(user.carrera.finDeCarrera).map((v) => (
                    <MenuItemOption type="checkbox" value={v.id} key={v.id}>
                      {getNode(v.materia)?.materia}
                    </MenuItemOption>
                  ))}
              </MenuOptionGroup>
            )}

            {user.carrera.eligeOrientaciones && (
              <MenuOptionGroup
                onChange={(value) => {
                  changeOrientacion(value as string);
                }}
                value={user.orientacion?.nombre || "none"}
                title="Orientación"
                type="radio"
              >
                <MenuItemOption type="checkbox" value={"none"}>
                  No me decidí
                </MenuItemOption>

                {user.carrera.orientaciones &&
                  user.carrera.orientaciones
                    .filter((o) => !o.nonEligible)
                    .map((o) => (
                      <MenuItemOption
                        type="checkbox"
                        value={o.nombre}
                        key={o.nombre}
                      >
                        {o.nombre}
                      </MenuItemOption>
                    ))}
              </MenuOptionGroup>
            )}
          </MenuList>
        </Menu>
      )}
      <ExportarImportar />
      {getters.Cuatrimestres().length > 0 && (
        <Tooltip {...TooltipProps} label="Limpiar todos los cuatris">
          <IconButton
            {...ButtonProps}
            ml={2}
            onClick={restartGraphCuatris}
            aria-label="Limpiar la data de los cuatrimestres"
          >
            <Icon boxSize={4} as={FaUndo} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export default UserMenu;
