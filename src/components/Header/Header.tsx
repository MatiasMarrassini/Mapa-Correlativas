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
    height: { base: "8.7rem", md: "4.5rem" },
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
          <DropdownCarreras />
        </Flex>
      )}
    </Box>
  );
};

export default Header;
