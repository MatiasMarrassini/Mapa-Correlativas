import { Flex, useColorModeValue } from "@chakra-ui/react";
import React from "react";
import { UserContext } from "../../MapContext";
import Creditos from "./Creditos";
import ProgressBar from "./ProgressBar";
import Promedio from "./Promedio";

// Footer con los creditos (u horas), la barra de progreso y el promedio
const Footer = () => {
  const { user } = React.useContext(UserContext);

  return (
    // el position relative nos asegura que los popups se vean
    <Flex
      alignItems="center"
      position="relative"
      bg={useColorModeValue("headerbg", "headerbgdark")}
      key={user.carrera.id}
    >
      <Creditos />
      <ProgressBar />
      <Promedio />
    </Flex>
  );
};

export default Footer;
