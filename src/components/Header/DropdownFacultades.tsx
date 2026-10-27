import React from "react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from "@chakra-ui/react";
import { FACULTADES } from "../../carreras";
import { GraphContext, UserContext } from "../../MapContext";
import { facultadDePlan } from "../../planes";

// Componente para elegir facultad (el de carreras muestra solo las de la facultad elegida)
const DropdownFacultades = () => {
  const { user } = React.useContext(UserContext);
  const { changeFacultad } = React.useContext(GraphContext);
  const actual = facultadDePlan(user.carrera.id);
  const facultad = FACULTADES.find((f) => f.id === actual);

  return (
    <Box>
      <Menu placement="bottom" isLazy>
        <MenuButton
          colorScheme="whiteAlpha"
          variant="outline"
          color="white"
          borderRadius="md"
          as={Button}
          rightIcon={<ChevronDownIcon />}
        >
          {facultad?.nombre}
        </MenuButton>
        <MenuList>
          {FACULTADES.map((f) => (
            <MenuItem key={f.id} onClick={() => changeFacultad(f.id)}>
              <Text as={f.id === actual ? "b" : "p"}>{f.nombre}</Text>
            </MenuItem>
          ))}
        </MenuList>
      </Menu>
    </Box>
  );
};

export default DropdownFacultades;
