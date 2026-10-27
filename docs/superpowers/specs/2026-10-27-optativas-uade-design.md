# Elegir optativas (UADE) — Diseño

Fecha: 2026-10-27 · Pedido por: Matías Marrassini · Proyecto: Mapa de Correlativas (`MatiasMarrassini/Mapa-Correlativas`)

## Intención

El plan de Ingeniería en Informática de UADE (1621) tiene tres lugares de optativa (Optativa I, II y III, 68 hs cada uno). Hoy son nodos genéricos. Matías encontró la lista oficial de optativas (≈80 materias, algunas con correlativas) y quiere poder **elegir qué optativa cursa en cada lugar**, ver su nombre en el mapa y que se respeten sus correlativas.

Sigue siendo un proyecto para mostrar en el CV: importa que se vea bien y que el código quede prolijo.

## Comportamiento (decidido con Matías)

1. **Elegir:** al hacer clic en un nodo de optativa (Optativa I, II o III), en la barra superior donde hoy aparecen nota y botones aparece un **selector** con las optativas del plan. Se puede **recorrer la lista y también filtrar escribiendo** parte del nombre. Incluye la opción de dejarla **sin elegir**.
2. **Mostrar:** el nodo pasa a mostrar el lugar y la materia elegida (p. ej. "Optativa I" + "Testing de Aplicaciones").
3. **Horas:** cada lugar sigue valiendo **68 hs**, sea cual sea la optativa elegida (la lista oficial no informa horas).
4. **Correlativas con materias del plan** (p. ej. Investigación Operativa ← Probabilidad y Estadística; Electrotecnia ← Física II): aparece la flecha desde esa materia al nodo de la optativa y el nodo queda bloqueado hasta aprobarla, como cualquier materia.
5. **Correlativas con otra optativa** (p. ej. Desarrollo Gerencial ← Dirección de Empresas; Sistemas Digitales II ← Sistemas Digitales I): la optativa queda **bloqueada** y se muestra un **aviso** del estilo *"Esta materia requiere la optativa Dirección de Empresas como correlativa anterior"*. Se desbloquea cuando esa optativa está **elegida en otro lugar y aprobada**.
6. **No se repite:** una misma optativa (mismo código) no se puede elegir en dos lugares. Las que figuran repetidas con códigos distintos en la lista oficial (Liderazgo y Negociación 1.1.093 / 2.6.076; Obligaciones y Contratos 2.3.003 / V2.3.003) quedan como opciones separadas, tal cual la lista.
7. **Cambiar:** se puede cambiar de optativa o volver a "sin elegir" en cualquier momento.
8. **Guardado:** la elección se guarda automáticamente con el resto del avance y viaja en exportar/importar.

## No-objetivos

- Horas distintas por optativa.
- Optativas para otros planes (FIUBA ya tiene su propio esquema de electivas y no se toca). La estructura puede ser genérica, pero solo se cargan datos de UADE.
- Mostrar las ≈80 optativas como nodos sueltos en el grafo.
- Validar que la optativa sea "elegible" según orientación, cupos, etc.

## Anti-objetivos

- Que se rompa algo de FIUBA o del resto del plan de UADE (habilitación, progreso 100 %, guardado).
- Que un avance guardado/exportado antes de esta función deje de cargar (tiene que seguir siendo válido).
- Que un archivo importado con una elección inválida (optativa inexistente, repetida, tipo incorrecto) rompa la app: se rechaza o se ignora esa elección, nunca pantalla en blanco.

## Diseño

### Datos

- Nuevo archivo `src/data/uade-informatica-2021-optativas.json` con la lista oficial (ver Anexo): `{ id, materia, correlativas? }` (`correlativas` con ids separados por `-`, como el resto de los json). Nombres en mayúsculas/minúsculas normales, como el resto del plan (la fuente está en MAYÚSCULAS). *(Decisión de Claude.)*
- El plan (`UserType.Carrera`) suma un campo opcional que declara qué nodos son lugares de optativa y la lista de materias elegibles, p. ej. `optativasDelPlan: { lugares: ["OPT1", "OPT2", "OPT3"], materias: [...] }`. *(Nombre exacto a criterio del builder, pero **no** puede llamarse `optativas`: ese nombre ya existe en la app para los "créditos por fuera del plan".)*
- Las correlativas de una optativa pueden apuntar a: un id del plan (materia normal) o un id de la lista de optativas. Un test de datos verifica que toda correlativa exista en uno de los dos.

### Guardado

- `CarreraData` suma `elecciones?: { [lugarId: string]: string }` (lugar → id de optativa). Campo opcional: los registros viejos siguen siendo válidos y no cambia `version`.
- `parsearRegistro` valida `elecciones` (objeto de strings). Al cargar, una elección cuyo id no existe en la lista, o que repite una optativa ya elegida en otro lugar, se **ignora** (ese lugar queda sin elegir) en vez de rechazar todo el archivo. *(Decisión de Claude.)* Como `parsearRegistro` no sabe a qué plan pertenece cada dato, ahí solo se valida la forma; el filtrado de ids desconocidos o repetidos se hace al poblar el grafo del plan.
- `armarCarreraData` incluye `elecciones` solo si hay alguna; tener solo elecciones alcanza para que el plan se guarde.

### Grafo

- El nodo del lugar muestra "Optativa I" y, si hay elección, el nombre de la materia debajo.
- Al elegir/cambiar/quitar, se actualizan las flechas de ese nodo: flechas **visibles** desde cada correlativa que sea materia del plan; si la correlativa es otra optativa elegida en otro lugar, flecha desde ese lugar. Si la correlativa es una optativa no elegida, no hay flecha (hay aviso).
- Habilitación de un lugar = sus correlativas del plan aprobadas **y** cada correlativa-optativa elegida en otro lugar y aprobada. Sin elección, el lugar se comporta como hoy (sin correlativas). Hoy `Node.isHabilitada` solo mira flechas visibles entrantes; una correlativa-optativa no elegida no tiene flecha, así que hace falta un chequeo explícito además de las flechas.
- El aviso se muestra mientras la correlativa-optativa no esté elegida **y** aprobada.
- Si la correlativa está elegida en un lugar posterior (p. ej. Optativa III habilita a Optativa I), la flecha va "hacia atrás"; es aceptable porque los niveles de los nodos son fijos.
- Nombres largos en el nodo: se cortan en varias líneas como el resto de las materias (formato a criterio del builder).
- La aprobación/nota de un lugar es del **lugar**: cambiar la optativa elegida no borra la aprobación. *(Decisión de Claude: el usuario está corrigiendo qué materia cursó, no desaprobando.)*

### Interfaz

- **Selector:** visible en la barra superior cuando el nodo seleccionado es un lugar de optativa. Campo de texto que filtra por nombre (sin distinguir mayúsculas ni tildes) y por código, más la lista desplazable debajo; cada opción muestra nombre y código. Primera opción "Sin elegir". Las optativas ya elegidas en otro lugar aparecen deshabilitadas con la indicación del lugar (p. ej. "elegida en Optativa II"). *(Componente exacto a criterio del builder; Chakra UI ya está en el proyecto.)*
- **Aviso:** en la barra superior, junto al estado de la materia, un badge naranja como el de "Requiere X créditos": *"Requiere la optativa {nombre} como correlativa anterior"*, uno por cada correlativa-optativa no cumplida.
- Debe entrar en ancho de celular (375 px).

## Criterios de "listo"

- `npx tsc --noEmit`, `npm test` y `CI=true npm run build` pasan.
- En UADE: elegir Testing de Aplicaciones en Optativa I → el nodo lo muestra; recargar → sigue elegida.
- Elegir Investigación Operativa → aparece la flecha desde Probabilidad y Estadística y queda bloqueada hasta aprobarla.
- Elegir Desarrollo Gerencial en Optativa II → bloqueada con el aviso; elegir Dirección de Empresas en Optativa I y aprobarla → Optativa II se habilita y aparece la flecha I → II.
- No se puede elegir la misma optativa en dos lugares.
- Exportar → importar conserva las elecciones; un avance exportado antes de esta función se sigue importando.
- FIUBA sin cambios.

## Anexo: lista oficial de optativas (Plan 1621)

Transcripta de las capturas que pasó Matías. Columna "requisitos": todas "Sin requisitos". Sin correlativa = vacío.

| Código | Materia | Correlativa |
|---|---|---|
| 1.1.030 | Dirección de Empresas | |
| 1.1.031 | Desarrollo Gerencial | 1.1.030 |
| 1.1.082 | Planeamiento y Control de Gestión | 1.1.031 |
| 1.1.093 | Liderazgo y Negociación | |
| 1.1.096 | Simulaciones de Negocios | |
| 1.1.151 | La Gestión en la Salud Humana | |
| 1.1.157 | Herramientas Informáticas para la Gestión Hospitalaria y Sanatorial | |
| 1.1.158 | Auditoría Médica | |
| 1.1.164 | Sistemas Integrados de Gestión Empresarial | |
| 1.2.001 | Marketing | |
| 1.2.080 | Plataformas y Negocios Web | |
| 1.4.044 | Gestión Financiera | 1.4.076 |
| 1.4.076 | Fundamentos de Economía | |
| 1.4.114 | Economía de la Salud | |
| 2.1.149 | Gestión de Políticas Públicas | |
| 2.1.153 | Gestión de Municipios y Desarrollo Local | |
| 2.1.154 | Finanzas Públicas y Administración Presupuestaria | |
| 2.3.001 | Introducción al Derecho | |
| 2.3.003 | Obligaciones y Contratos | 2.3.001 |
| 2.3.015 | Derecho Constitucional | 2.3.001 |
| 2.3.069 | Derecho Administrativo | 2.3.015 |
| 2.3.087 | Derecho del Trabajo y de la Seguridad Social | |
| 2.3.118 | Aspectos Médicos Legales y Bioética | |
| 2.3.174 | Ciberdelitos I | |
| 2.5.011 | Teoría de la Administración Pública | |
| 2.5.022 | Políticas de Prevención del Narcotráfico y las Adicciones | |
| 2.6.055 | Taller Multimedia | |
| 2.6.076 | Liderazgo y Negociación | |
| 2.8.038 | Recursos Técnicos de la Industria del Entretenimiento | |
| 2.8.042 | Convergencia y Paradigmas Tecnológicos | |
| 2.8.109 | Management de Deportes Electrónicos y Gaming | |
| 2.8.165 | Práctica y Entrenamiento de Alta Competencia en eSports: MOBA | |
| 2.8.167 | Práctica y Entrenamiento de Alta Competencia en eSports: FPS | |
| 3.1.041 | Investigación Operativa | 3.1.049 (plan) |
| 3.1.042 | Fundamentos de Epidemiología, Estadística y Salud Pública | |
| 3.2.066 | Introducción a la Actividad Agropecuaria | |
| 3.2.071 | Biología y Fisiología Molecular | 3.2.181 |
| 3.2.082 | Microbiología General | 3.2.181 |
| 3.2.083 | Genética Molecular | 3.2.181 |
| 3.2.088 | Bioinformática | |
| 3.2.181 | Introducción a la Biología Molecular y Celular | |
| 3.3.060 | Sistemas Digitales I | 3.3.068 |
| 3.3.061 | Sistemas Digitales II | 3.3.060 |
| 3.3.064 | Costos Industriales | |
| 3.3.067 | Electrotecnia | 3.1.055 (plan) |
| 3.3.068 | Fundamentos de Electrónica | |
| 3.3.069 | Campos y Ondas Electromagnéticas | 3.1.055 (plan) |
| 3.3.075 | Programación y Control de la Producción | |
| 3.3.101 | Instalaciones Electromecánicas | 3.3.067 |
| 3.3.104 | Máquinas Hidráulicas y Circuitos Termohidráulicos | |
| 3.3.111 | Procesos Industriales | |
| 3.3.124 | Tecnología de los Materiales Electrónicos | 3.1.055 (plan) |
| 3.3.125 | Teoría de los Circuitos | 3.3.067 |
| 3.3.126 | Laboratorio de Mediciones Electrónicas | 3.3.068 |
| 3.3.127 | Sistemas Embebidos | 3.3.060 |
| 3.4.085 | Teleinformática y Redes II | |
| 3.4.131 | Gestión de Personas en Organizaciones de Tecnología | |
| 3.4.176 | Introducción al Diseño de Videojuegos | |
| 3.4.180 | Diseño de Interfaces y UX | |
| 3.4.226 | Diseño y Desarrollo Web | |
| 3.4.228 | Testing de Aplicaciones | |
| 3.5.005 | Tecnologías para la Frontera Agropecuaria | |
| 3.5.009 | Sistemas de Información Geográfica | |
| 3.5.010 | Innovaciones Tecnológicas | |
| 3.5.014 | Agricultura de Precisión | |
| 4.3.014 | Análisis y Desarrollo de Audiencias | |
| 4.3.016 | Taller de Narrativas Digitales | |
| 4.3.027 | Periodismo de Datos | |
| 4.3.040 | Plataformas Mediáticas | |
| 4.3.043 | Management de Plataformas de Entretenimiento | |
| 4.6.061 | Comunicación en Redes Sociales | |
| 4.8.001 | Tecnología Digital para el Diseño | |
| 4.8.070 | Teoría y Práctica del Sonido: Edición de Sonido, Audio Digital | |
| 4.8.082 | Diseño Audiovisual I | |
| 4.8.087 | Sonido y Elaboración de Banda Sonora | |
| 4.8.130 | Diseño de Experiencia de Usuario | |
| 5.4.001 | Experiencia Internacional de Aprendizaje | |
| V1.1.146 | Consultoría | |
| V2.3.003 | Obligaciones y Contratos | 2.3.001 |
| V3.1.017 | Programación Operativa | |

(81 materias. 3.1.049 = Probabilidad y Estadística y 3.1.055 = Física II, del plan.)
