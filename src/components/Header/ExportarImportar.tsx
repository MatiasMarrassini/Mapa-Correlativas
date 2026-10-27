import React from "react";
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
  Icon,
  IconButton,
  Tooltip,
  useToast,
} from "@chakra-ui/react";
import { FaDownload, FaUpload } from "react-icons/fa";
import { UserContext } from "../../MapContext";
import { exportarRegistro, parsearRegistro } from "../../storage";
import { UserType } from "../../types/User";

const ButtonProps = {
  bg: "teal.500",
  color: "white",
  _hover: { bg: "teal.600" },
  _active: { bg: "teal.600" },
  size: "sm",
};

const fechaDeHoy = () => {
  const hoy = new Date();
  const dosDigitos = (n: number) => String(n).padStart(2, "0");
  return `${hoy.getFullYear()}-${dosDigitos(hoy.getMonth() + 1)}-${dosDigitos(hoy.getDate())}`;
};

// Botones para bajar todo el avance a un .json y para volver a cargarlo
// (sirve de respaldo, o para pasar el avance a otro navegador)
const ExportarImportar = () => {
  const { user, importarRegistro } = React.useContext(UserContext);
  const toast = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const [aImportar, setAImportar] = React.useState<UserType.Registro | null>(
    null,
  );

  const exportar = () => {
    const blob = new Blob([exportarRegistro(user.registro)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mapa-correlativas-${fechaDeHoy()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const elegirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    // Reseteamos el input para poder volver a elegir el mismo archivo
    e.target.value = "";
    if (!archivo) return;
    const registro = parsearRegistro(await archivo.text());
    if (!registro) {
      toast({
        status: "error",
        variant: "subtle",
        title: "El archivo no es un avance válido",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    setAImportar(registro);
  };

  const confirmar = () => {
    if (aImportar) importarRegistro(aImportar);
    setAImportar(null);
  };

  return (
    <>
      <Tooltip closeOnClick hasArrow placement="bottom" label="Exportar avance">
        <IconButton
          {...ButtonProps}
          ml={2}
          onClick={exportar}
          aria-label="Exportar avance"
        >
          <Icon boxSize={4} as={FaDownload} />
        </IconButton>
      </Tooltip>
      <Tooltip closeOnClick hasArrow placement="bottom" label="Importar avance">
        <IconButton
          {...ButtonProps}
          ml={2}
          onClick={() => inputRef.current?.click()}
          aria-label="Importar avance"
        >
          <Icon boxSize={4} as={FaUpload} />
        </IconButton>
      </Tooltip>
      <input
        ref={inputRef}
        type="file"
        accept=".json,application/json"
        hidden
        onChange={elegirArchivo}
      />
      <AlertDialog
        isOpen={!!aImportar}
        leastDestructiveRef={cancelRef}
        onClose={() => setAImportar(null)}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Importar avance</AlertDialogHeader>
            <AlertDialogBody>
              Esto reemplaza todo tu avance guardado. ¿Seguir?
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => setAImportar(null)}>
                Cancelar
              </Button>
              <Button colorScheme="teal" ml={3} onClick={confirmar}>
                Importar
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default ExportarImportar;
