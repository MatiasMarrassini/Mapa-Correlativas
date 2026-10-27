import React from "react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Input,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { GraphContext, UserContext } from "../../MapContext";
import {
  esLugarOptativa,
  filtrarOptativas,
  lugarDeOptativa,
  optativaPorId,
} from "../../optativas";

// Selector para elegir que optativa se cursa en el lugar de optativa seleccionado
// Se puede recorrer la lista o escribir para filtrar por nombre o codigo
const SelectorOptativa = () => {
  const { user } = React.useContext(UserContext);
  const { displayedNode, elecciones, elegirOptativa, getNode } =
    React.useContext(GraphContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [busqueda, setBusqueda] = React.useState("");
  const buscadorRef = React.useRef<HTMLInputElement>(null);

  const materias = user.carrera.optativasDelPlan?.materias ?? [];
  const filtradas = React.useMemo(
    () => filtrarOptativas(materias, busqueda),
    [materias, busqueda],
  );

  if (!esLugarOptativa(user.carrera, displayedNode)) return null;

  const elegida = elecciones[displayedNode];
  const elegir = (id: string | undefined) => {
    elegirOptativa(displayedNode, id);
    setBusqueda("");
    onClose();
  };

  return (
    <Popover
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={onClose}
      initialFocusRef={buscadorRef}
      placement="bottom"
      isLazy
    >
      <PopoverTrigger>
        <Button
          size="sm"
          colorScheme="whiteAlpha"
          variant="outline"
          color="white"
          rightIcon={<ChevronDownIcon />}
          maxWidth={{ base: "40vw", md: "30ch" }}
        >
          <Text noOfLines={1}>
            {elegida
              ? optativaPorId(user.carrera, elegida)?.materia
              : "Elegir optativa"}
          </Text>
        </Button>
      </PopoverTrigger>
      <PopoverContent width={{ base: "90vw", md: "28rem" }}>
        <PopoverBody>
          <Input
            size="sm"
            mb={2}
            ref={buscadorRef}
            placeholder="Buscar por nombre o código"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <Box maxHeight="50vh" overflowY="auto">
            <Button
              size="sm"
              variant="ghost"
              width="100%"
              justifyContent="flex-start"
              fontWeight={elegida ? "normal" : "bold"}
              onClick={() => elegir(undefined)}
            >
              Sin elegir
            </Button>
            {filtradas.map((o) => {
              const lugar = lugarDeOptativa(elecciones, o.id);
              const enOtroLugar = !!lugar && lugar !== displayedNode;
              return (
                <Button
                  key={o.id}
                  size="sm"
                  variant="ghost"
                  width="100%"
                  height="auto"
                  py={1}
                  justifyContent="flex-start"
                  textAlign="left"
                  whiteSpace="normal"
                  fontWeight={o.id === elegida ? "bold" : "normal"}
                  isDisabled={enOtroLugar}
                  onClick={() => elegir(o.id)}
                >
                  {o.materia} · {o.id}
                  {enOtroLugar &&
                    ` (elegida en ${getNode(lugar)?.materia ?? lugar})`}
                </Button>
              );
            })}
          </Box>
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};

export default SelectorOptativa;
