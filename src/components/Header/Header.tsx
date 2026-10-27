import {
  ScaleFade,
  Flex,
  Box,
  useColorModeValue,
  ResponsiveValue,
} from "@chakra-ui/react";
import { GraphContext } from "../../MapContext";
import MateriaDisplay from "./MateriaDisplay";
import DropdownCarreras from "./DropdownCarreras";
import DropdownFacultades from "./DropdownFacultades";
import UserMenu from "./UserMenu";
import React from "react";
import { Property } from "csstype";

// Componente toplevel de header
// Si tengo una materia clickeada, muestra sus controles
// Si no, muestra el menu del usuario (configuracion, exportar/importar) y
//  el selector de carrera
const Header = () => {
  const { displayedNode } = React.useContext(GraphContext);
  const CommonProps = {
    // En celular la barra crece si hace falta (ej. con el selector de optativas)
    height: { base: "auto", md: "4.5rem" },
    minHeight: { base: "8.7rem", md: "4.5rem" },
    bg: useColorModeValue("headerbg", "headerbgdark"),
  };

  const FlexProps = {
    py: { base: 4, md: 2 },
    px: 4,
    gap: 4,
    align: "center",
    justify: "space-between",
    flexWrap: "wrap" as ResponsiveValue<Property.FlexWrap>,
    justifyContent: { base: "space-around", md: "space-between" },
  };

  const AntiFlexProps = {
    height: 0,
    minHeight: 0,
    p: 0,
    m: 0,
  };

  return (
    <Box {...CommonProps}>
      <ScaleFade in={!!displayedNode} transition={{ enter: { delay: 0.0015 } }}>
        <Flex
          {...CommonProps}
          {...(displayedNode && FlexProps)}
          {...(!displayedNode && AntiFlexProps)}
        >
          <MateriaDisplay />
        </Flex>
      </ScaleFade>
      {!displayedNode && (
        <Flex {...CommonProps} {...(!displayedNode && FlexProps)}>
          <UserMenu />
          <Flex gap={2} align="center">
            <DropdownFacultades />
            <DropdownCarreras />
          </Flex>
        </Flex>
      )}
    </Box>
  );
};

export default Header;
