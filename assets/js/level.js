// GALERAS 2037 · el nivel "Contrabando de Rostros" (Célula 0)
// Fuente única: la escena 3D, el plano de papel, el tour guiado y el modo jugable leen de aquí.
// Coordenadas en metros. La ruta avanza hacia -X, del mercado al Galeras.

export const LEVEL = {
  market: { x0: 13, x1: -38, half: 3.1 },           // Plaza de mercado El Potrerillo
  street: { x0: -38, x1: -76, half: 3.6 },          // Calle Real 2037 (colonial)
  alley: { x: -45, w: 4, z0: 3.6, z1: 22, xEnd: -76 }, // desvío por San Juan Bautista
  plaza: { x0: -76, x1: -124, z0: -24, z1: 24 },     // Plaza de Nariño
  avenue: { x0: -124, x1: -176, half: 4.2 },         // salida al páramo
  statue: { x: -100, z: 2 },
  cathedral: { x: -100, z: -33, w: 26, d: 16 },
  sanjuan: { x: -60, z: 30 },
  float: { x: -113, z: -13 },
  scanner: { x: -57 },
  gate: { x: -174 },
  acceso: { x: 12, z: 0 },
  pistas: [
    { id: 1, x: -21, z: 2.6, nombre: 'Talco bajo la mesa', texto: 'Una vendedora esconde talco de carnaval bajo la mesa. En 2037 es contrabando.' },
    { id: 2, x: -61, z: 21.5, nombre: 'Máscaras confiscadas', texto: 'En el atrio de San Juan, un altar improvisado con máscaras que la Alcaldía confiscó.' },
    { id: 3, x: -97, z: 5.5, nombre: 'El Ojo de Atriz', texto: 'El holograma de la estatua de Nariño revela que la torre de la catedral reconoce cada rostro.' },
  ],
  presion: { x: -57, z: 0 },
  decision: { x: -110, z: -8.5 },
  salida: { x: -174, z: 0 },
  // camino crítico (mínimo para terminar) y desvío opcional
  path: [[13, 0], [-20, 0], [-38, 0], [-57, 0], [-76, 0], [-88, -5], [-100, -8], [-110, -8.5], [-124, -1], [-150, 0], [-174, 0]],
  detour: [[-45, 0], [-45, 12], [-48, 20.5], [-62, 20.5], [-76, 20], [-86, 12], [-92, 5]],
  branchA: [[-110, -8.5], [-120, -14], [-128, -6]],   // pintarse: desaparecer
  branchB: [[-110, -8.5], [-118, 2], [-128, 4]],     // máscara legal: quedar registrado
  soundZones: [[-10, 0, 9], [-57, 0, 7], [-100, 0, 16], [-160, 0, 12]],
};

// Extensión del plano de papel (mismo trazado que el mundo)
export const MAP = { x0: -192, x1: 20, z0: -46, z1: 46 };

// Capítulos del tour. p = inicio en el progreso del scroll (0–1).
// cam: posición, mirada y lente. labels: anotaciones de diseñador ancladas al mundo.
export const CHAPTERS = [
  {
    id: 'llegada', p: 0, kicker: 'Pasto · Nariño · 2037', title: 'Galeras 2037',
    text: 'Un nivel completo, hecho con el método del taller. Baja para recorrerlo.',
    cine: 'Plano de ubicación: primero, dónde estamos.',
    pasto: 'Pasto: 2.500 m de altura, al pie del Galeras.',
    cam: { pos: [24, 1.75, 0.6], look: [-60, 6.4, 0], fov: 52 },
    labels: [
      { at: [19, 2.6, 6.2], tag: 'Pasto real', title: 'Pasto, 500 años', text: 'Fundada en 1537: en 2037 cumple cinco siglos.' },
    ],
  },
  {
    id: 'acceso', p: 0.075, kicker: 'Capítulo 1 · Acceso', title: 'Plaza de mercado El Potrerillo',
    text: 'El nivel enseña a mirar: arriba los rótulos, al fondo el volcán.',
    cine: 'El plano general que abre la película.',
    pasto: 'El Potrerillo es una de las grandes plazas de mercado de Pasto.',
    cam: { pos: [7, 2.3, -1.6], look: [-40, 5.2, 0.6], fov: 50 },
    labels: [
      { at: [-30, 2.8, -2.75], tag: 'Pasto real', title: 'Negros y Blancos', text: 'Patrimonio de la Humanidad desde 2009.' },
      { at: [-640, 215, 10], tag: 'Hito', title: 'El Galeras', text: 'Se ve desde todo el nivel. Orienta sin flechas.' },
      { at: [-19, 9.2, 0], tag: 'Acceso', title: 'Potrerillo, 2037', text: 'Mercado popular, bajo lonas solares.' },
    ],
  },
  {
    id: 'camino', p: 0.15, kicker: 'Capítulo 2 · Camino crítico', title: 'La ruta mínima para terminar',
    text: 'La línea naranja es la ruta mínima. Los bombillos la marcan.',
    cine: 'El montaje: el ritmo con que cambian los espacios.',
    pasto: 'Del mercado a la Plaza de Nariño, como en la ciudad real.',
    cam: { pos: [22, 40, 14], look: [-100, 0, -4], fov: 52 },
    design: 1,
    labels: [
      { at: [-57, 0.5, 0], tag: 'Camino crítico', title: 'Una sola línea legible', text: 'Se lee sin mapa.' },
      { at: [-100, 0.5, -8], tag: 'Nodo', title: 'Plaza de Nariño', text: 'Todas las rutas se cruzan aquí.' },
    ],
  },
  {
    id: 'pista1', p: 0.235, kicker: 'Capítulo 3 · Pistas', title: 'El espacio cuenta la historia',
    text: 'Talco escondido: la regla del mundo, sin una palabra.',
    cine: 'Plano detalle: el objeto cuenta la historia.',
    pasto: 'El talco es el centro del Día de Negros y Blancos.',
    cam: { pos: [-13, 2.5, -2.4], look: [-21, 1.1, 2.6], fov: 44 },
    design: 0.6,
    labels: [
      { at: [-21, 1.6, 2.6], tag: 'Pista 01', title: 'Talco bajo la mesa', text: 'En 2037, pintarse es contrabando.' },
    ],
  },
  {
    id: 'presion', p: 0.315, kicker: 'Capítulo 4 · Punto de presión', title: 'El escáner de la Calle Real',
    text: 'Un arco escanea rostros. Cruzarlo te registra.',
    cine: 'Suspenso: el público ve la amenaza antes.',
    pasto: 'Las calles coloniales son estrechas: el espacio ya presiona.',
    cam: { pos: [-41, 2.1, -2.2], look: [-58, 3.4, 0.6], fov: 48 },
    design: 0.6,
    labels: [
      { at: [-68, 2.8, -3.05], tag: 'Pasto real', title: 'Barniz de Pasto', text: 'Mopa-mopa: salvaguardia urgente, UNESCO 2020.' },
      { at: [-57, 5.6, 0], tag: 'Presión', title: 'Arco del Ojo de Atriz', text: 'Te identifica al cruzar.' },
      { at: [-45, 2.5, 6], tag: 'Desvío', title: 'Un callejón a la derecha', text: 'Ruta opcional: más larga, sin cámaras.' },
    ],
  },
  {
    id: 'desvio', p: 0.395, kicker: 'Capítulo 5 · Desvío y recompensa', title: 'El atrio de San Juan Bautista',
    text: 'Quien explora encuentra la pista 2. La ruta opcional paga.',
    cine: 'Fuera de campo: lo que el camino no muestra.',
    pasto: 'San Juan Bautista, uno de los templos más antiguos de Pasto.',
    cam: { pos: [-52.5, 3.2, 19.8], look: [-60.5, 7, 29], fov: 64 },
    design: 0.8,
    labels: [
      { at: [-53.4, 2.6, 27.9], tag: 'Pasto real', title: 'San Juan Bautista', text: 'Uno de los templos más antiguos de Pasto.' },
      { at: [-61, 1.8, 21.5], tag: 'Pista 02', title: 'Máscaras confiscadas', text: 'Recompensa por explorar.' },
      { at: [-60, 11, 30], tag: 'Hito local', title: 'San Juan Bautista', text: 'Iglesia colonial, ahora refugio.' },
    ],
  },
  {
    id: 'plaza', p: 0.475, kicker: 'Capítulo 6 · El nodo', title: 'Plaza de Nariño',
    text: 'Todas las rutas se cruzan. Desde la torre, el Ojo de Atriz vigila.',
    cine: 'La ventana indiscreta al revés: la ciudad te mira.',
    pasto: 'El corazón del centro histórico, con la estatua de Nariño.',
    cam: { pos: [-86, 21, 27], look: [-104, 3, -14], fov: 54 },
    design: 0.7,
    labels: [
      { at: [-84, 2.6, -21.7], tag: 'Pasto real', title: 'Plaza de Nariño', text: 'Corazón del centro histórico.' },
      { at: [-110.4, 26, -27.6], tag: 'Panóptico', title: 'El Ojo de Atriz', text: 'Mira todo, nadie lo ve mirar.' },
      { at: [-100, 7, 2], tag: 'Pista 03', title: 'Holograma de Nariño', text: 'La estatua revela quién vigila.' },
    ],
  },
  {
    id: 'decision', p: 0.555, kicker: 'Capítulo 7 · Decisión', title: 'Pintarse o ponerse la máscara legal',
    text: 'Talco para desaparecer, o máscara con chip para pasar registrado.',
    cine: 'El dilema del protagonista, en manos del público.',
    pasto: 'Las carrozas del Carnaval se construyen durante meses.',
    cam: { pos: [-99, 3.4, -9], look: [-115, 4.2, -13.5], fov: 50 },
    design: 1,
    labels: [
      { at: [-113, 9, -13], tag: 'Decisión', title: 'La carroza a medio pintar', text: 'Mitad armazón, mitad color.' },
      { at: [-122, 0.8, -12], tag: 'Ruta A', title: 'Pintarse', text: 'Desaparecer.' },
      { at: [-121, 0.8, 3], tag: 'Ruta B', title: 'Máscara legal', text: 'Pasar registrado.' },
    ],
  },
  {
    id: 'salida', p: 0.635, kicker: 'Capítulo 8 · Salida transformada', title: 'La puerta del páramo',
    text: 'Una chakana de luz abre el páramo. Nadie sale igual.',
    cine: 'El arco de transformación del personaje.',
    pasto: 'El Galeras se vigila día y noche desde Pasto.',
    cam: { pos: [-120, 2.6, 2.5], look: [-176, 8, 0], fov: 46 },
    design: 0.6,
    labels: [
      { at: [-158, 2.6, -3.75], tag: 'Pasto real', title: 'Volcán Galeras', text: 'Unos 4.276 m, vigilado día y noche.' },
      { at: [-174, 12, 0], tag: 'Salida', title: 'Chakana del páramo', text: 'Futurismo andino.' },
    ],
  },
  {
    id: 'plano', p: 0.715, kicker: 'Capítulo 9 · El plano', title: 'Toda ciudad empezó como un plano',
    text: 'Muros, pistas, presión, decisión y salida: el nivel en papel.',
    cine: 'La planta de cámara: sirve para jugar y para rodar.',
    pasto: 'Cada célula convierte un lugar de Pasto en un plano así.',
    cam: { top: true },
    labels: [],
  },
  {
    id: 'playtest', p: 0.8, kicker: 'Capítulo 10 · Playtest', title: 'Observar sin explicar',
    text: 'Donde el jugador se detiene, el diseño aún no se lee.',
    cine: 'La proyección de prueba antes del corte final.',
    pasto: 'En el taller, otra célula juega tu plano en silencio.',
    cam: { top: true },
    labels: [],
  },
  {
    id: 'toma', p: 0.885, kicker: 'Capítulo 11 · La toma', title: 'Hoy dibujamos planos para rodar planos',
    text: 'El mismo nivel ya es un set de rodaje.',
    cine: 'Producción virtual: el motor es el set.',
    pasto: 'FICPA: aquí se estrena lo que se rueda.',
    cam: { pos: [-84, 1.4, 13], look: [-170, 15, -6], fov: 40 },
    labels: [],
  },
];

// Notas del playtest sobre el plano (aparecen en el capítulo 10)
export const PLAYTEST_NOTES = [
  { at: [-57, 0, 0], u: 0.34, text: 'Dudó 20 s frente al escáner' },
  { at: [-110, 0, -8.5], u: 0.72, text: 'No vio la decisión hasta acercarse' },
];

// Principios que aparecen mientras se juega: diseño + cine + Pasto
export const PRINCIPLES = [
  { id: 'hito', x: 10, z: 0, r: 7, tag: 'Level design · Hito', title: 'El Galeras te orienta',
    text: 'Se ve desde todo el nivel: nadie se pierde.', cine: 'El plano de ubicación.', taller: 'Dibuja algo que se vea desde todo el mapa.' },
  { id: 'migas', x: -8, z: 0, r: 5, tag: 'Level design · Migas de pan', title: 'Sigue la luz',
    text: 'Los bombillos marcan el camino. Sin flechas.', cine: 'La luz dirige la mirada.', taller: 'Marca con puntos la luz que guía.' },
  { id: 'presion', x: -48, z: 0, r: 6, tag: 'Level design · Punto de presión', title: 'El arco te vigila',
    text: 'Cruzarlo te registra. ¿Buscas otra ruta?', cine: 'Suspenso: ves la amenaza antes.', taller: 'Sticker amarillo donde haya que pensar.' },
  { id: 'desvio', x: -45, z: 9, r: 5, tag: 'Level design · Desvío y recompensa', title: 'El callejón de San Juan',
    text: 'Más largo, sin cámaras y con premio.', cine: 'Lo que pasa fuera de campo.', taller: 'Dibuja una ruta opcional con premio.' },
  { id: 'nodo', x: -82, z: 0, r: 7, tag: 'Level design · Nodo', title: 'Plaza de Nariño',
    text: 'Todas las rutas se cruzan aquí.', cine: 'El plano general.', taller: 'Deja un espacio donde todo se cruce.' },
  { id: 'decision', x: -108, z: -6, r: 6, tag: 'Game design · Decisión significativa', title: 'Una elección con costo',
    text: 'Pintarte o registrarte. Las dos cuestan.', cine: 'El dilema del protagonista.', taller: 'Sticker azul y el costo de cada opción.' },
  { id: 'salida', x: -150, z: 0, r: 8, tag: 'Level design · Salida transformada', title: 'La puerta del páramo',
    text: 'Se ve desde lejos. Llegas cambiado.', cine: 'El arco de transformación.', taller: 'Que la salida se vea antes de llegar.' },
];

// Objetos con los que se interactúa (E o botón): cada uno enseña un principio
export const INTERACTABLES = [
  { id: 'cuyexpress', x: -2.4, z: -1, r: 3, label: 'Mirar el cuy mensajero', focus: [-6.5, 2.4, -2.1],
    title: 'Cuy Express', text: 'Reparte paquetes por todo Nariño.',
    tag: 'Level design · Vida de fondo', principle: 'Un fondo vivo hace creíble el mundo.', cine: 'Los extras y la acción de fondo.', taller: 'Dibuja algo que se mueva solo.' },
  { id: 'pista1', x: -21, z: 2.9, r: 3, label: 'Examinar el puesto', pista: 1, focus: [-21, 0.45, 3.0],
    title: 'Talco bajo la mesa', text: 'En 2037, pintarse es contrabando.',
    tag: 'Game design · Pista', principle: 'Un objeto enseña la regla, sin texto.', cine: 'El plano detalle.', taller: 'Sticker rojo: un objeto que revele una regla.' },
  { id: 'vendedora', x: -41.5, z: -2.6, r: 3, label: 'Hablar con la vendedora', focus: [-42.6, 1.6, -3.1],
    title: 'Doña Rosario', text: '«Por el arco te leen la cara, mijo. Por San Juan, no.»',
    tag: 'Level design · Información anticipada', principle: 'Antes del peligro, una pista.', cine: 'El diálogo que siembra lo que vendrá.', taller: 'Alguien que avise antes del peligro.' },
  { id: 'boletin', x: -50, z: 1.8, r: 3, label: 'Leer el aviso', focus: [-52, 2.6, 3.4],
    title: 'Control biométrico a 20 m', text: 'El aviso llega antes que el arco.',
    tag: 'Game design · Telegrafiar', principle: 'Telegrafiar: anunciar la amenaza.', cine: 'La bomba bajo la mesa (Hitchcock).', taller: 'Anuncia la amenaza con luz o sonido.' },
  { id: 'pista2', x: -61, z: 22, r: 3, label: 'Examinar el altar', pista: 2, focus: [-61, 1.6, 27.4],
    title: 'Máscaras confiscadas', text: 'Un altar con lo que la Alcaldía quitó.',
    tag: 'Level design · Recompensa por explorar', principle: 'La ruta opcional paga.', cine: 'Lo que estaba fuera de campo.', taller: 'Esconde una pista en el desvío.' },
  { id: 'secreto', x: -69, z: 21, r: 2.4, label: 'Recoger la máscara', focus: [-69.5, 0.6, 21.4],
    title: 'Máscara de barniz', text: 'Tras una columna. Solo para curiosos.',
    tag: 'Level design · Secreto', principle: 'Premia la curiosidad sin castigar.', cine: 'El detalle de la segunda mirada.', taller: 'Esconde un detalle no obligatorio.' },
  { id: 'totem', x: -80, z: 5.5, r: 3, label: 'Mirar el mapa', focus: [-80.6, 2, 6.4],
    title: 'Usted está aquí', text: 'Catedral al sur, carroza al suroeste, salida al oeste.',
    tag: 'Level design · Orientación en el nodo', principle: 'En el nodo, muestra el todo.', cine: 'El plano general antes de la acción.', taller: 'Desde tu nodo, que se vean las rutas.' },
  { id: 'pista3', x: -97, z: 5.5, r: 3, label: 'Tocar el holograma', pista: 3, focus: [-100, 5.2, 2],
    title: 'El Ojo de Atriz', text: 'La torre de la catedral reconoce cada rostro.',
    tag: 'Game design · Revelación', principle: 'La revelación ordena todo.', cine: 'El giro de guion.', taller: 'La última pista cambia el sentido.' },
  { id: 'asadero', x: -118.6, z: 12.4, r: 3, label: 'Hablar con el asadero', focus: [-121.2, 1.3, 13],
    title: 'Asadero de cuy', text: '«Los cuyes ya vuelan, mijo. La receta es la de mi abuela.»',
    tag: 'Game design · Identidad del lugar', principle: 'Lo local hace creíble el futuro.', cine: 'El diseño de producción.', taller: 'Una comida u oficio de tu barrio, en 2037.' },
];

// Capa de información: datos reales de Pasto, en placas holográficas del nivel.
// Se examinan como los objetos, pero se coleccionan aparte (no cuentan como principios).
export const DATOS = [
  { id: 'dato-500', dato: true, x: 19, z: 3.4, r: 3, label: 'Leer: Pasto, 500 años', focus: [19, 1.9, 6.2], short: 'PASTO · 1537–2037',
    title: 'Pasto, 500 años', tag: 'Pasto real · Historia',
    text: 'Fundada en 1537, según la fecha más citada. En 2037 cumple cinco siglos.',
    why: 'Fechas reales hacen creíble la ficción.',
    taller: 'Escribe el año y el lugar de tu nivel.' },
  { id: 'dato-carnaval', dato: true, x: -30, z: -1.2, r: 3, label: 'Leer: el Carnaval', focus: [-30, 2.1, -2.75], short: 'NEGROS Y BLANCOS',
    title: 'Carnaval de Negros y Blancos', tag: 'Pasto real · Patrimonio',
    text: 'Del 2 al 7 de enero. Patrimonio de la Humanidad (UNESCO, 2009).',
    why: 'La tradición se volvió la mecánica: pintarse.',
    taller: 'Convierte una tradición en regla.' },
  { id: 'dato-barniz', dato: true, x: -68, z: -1.4, r: 3, label: 'Leer: el barniz de Pasto', focus: [-68, 2.1, -3.05], short: 'MOPA-MOPA',
    title: 'Barniz de Pasto', tag: 'Pasto real · Oficio',
    text: 'Resina de mopa-mopa estirada a mano. Salvaguardia urgente (UNESCO, 2020).',
    why: 'Un oficio en riesgo es el tesoro del nivel.',
    taller: 'Lo más valioso: lo que casi desaparece.' },
  { id: 'dato-sanjuan', dato: true, x: -54.6, z: 25.4, r: 2.8, label: 'Leer: San Juan Bautista', focus: [-53.4, 1.9, 27.9], short: 'SAN JUAN BAUTISTA',
    title: 'Iglesia de San Juan Bautista', tag: 'Pasto real · Patrimonio',
    text: 'Junto a la plaza donde la tradición sitúa la fundación de la ciudad.',
    why: 'Lo antiguo es refugio: aquí no hay cámaras.',
    taller: 'Un lugar viejo de tu ciudad como refugio.' },
  { id: 'dato-narino', dato: true, x: -84, z: -19.2, r: 3, label: 'Leer: la Plaza de Nariño', focus: [-84, 1.9, -21.7], short: 'PLAZA DE NARIÑO',
    title: 'Plaza de Nariño', tag: 'Pasto real · Historia',
    text: 'Lleva el nombre de Antonio Nariño, capturado en Pasto en 1814.',
    why: 'El nodo acumula la historia de la ciudad.',
    taller: 'Escribe qué pasó en tu nodo antes.' },
  { id: 'dato-galeras', dato: true, x: -158, z: -1.6, r: 3, label: 'Leer: el volcán Galeras', focus: [-158, 1.9, -3.75], short: 'VOLCÁN GALERAS',
    title: 'Volcán Galeras', tag: 'Pasto real · Territorio',
    text: 'Unos 4.276 m. Uno de los volcanes más activos de Colombia.',
    why: 'El hito más fuerte es el que ya conoces.',
    taller: 'El hito que se ve desde todo tu nivel.' },
];

// Zonas del nivel: nombre de locación (como en un guion) y su función de diseño
export const ZONES = {
  potrerillo: { slug: 'EXT. PLAZA DE MERCADO EL POTRERILLO · NOCHE', role: 'Acceso · aquí el nivel te enseña a mirar' },
  calle: { slug: 'EXT. CALLE REAL · NOCHE', role: 'Punto de presión · el arco escanea rostros' },
  sanjuan: { slug: 'EXT. CALLEJÓN DE SAN JUAN BAUTISTA · NOCHE', role: 'Desvío · la ruta sin cámaras' },
  plaza: { slug: 'EXT. PLAZA DE NARIÑO · NOCHE', role: 'Nodo · todas las rutas se cruzan aquí' },
  avenida: { slug: 'EXT. AVENIDA AL PÁRAMO · NOCHE', role: 'Salida · el Galeras siempre al fondo' },
};

// La misión, paso a paso (se muestra como lista en el HUD)
export const MISSION = [
  { id: 'pistas', text: 'Encuentra 3 pistas', hint: 'Sigue la brújula y las etiquetas rojas.' },
  { id: 'decision', text: 'Decide en la carroza', hint: 'Plaza de Nariño, esquina suroeste.' },
  { id: 'salida', text: 'Sal al páramo', hint: 'Cortina verde: ya puedes pasar.' },
];

// Ruta de aprendizaje del modo jugable: 9 lecciones en orden, una a la vez.
// Cada una dice qué hacer (objetivo), cómo (teclas) y qué oficio enseña (disc: level, game o cine).
// El Cuy Express las explica en el cuadro de diálogo; al cumplirla, dice lo aprendido.
export const LECCIONES = [
  { id: 'examinar', disc: 'level', concepto: 'Vida de fondo', objetivo: 'Examina al Cuy Express', meta: 'cuyexpress',
    teclas: { pc: 'W A S D camina · E examina', tactil: 'Joystick camina · botón amarillo examina' },
    explica: 'Camina hasta mi puesto de envíos, aquí adelante. Lo que tenga una etiqueta encima se puede examinar.',
    aprendiste: 'el mundo se mueve aunque nadie lo mire. Eso lo hace creíble.' },
  { id: 'pista1', disc: 'game', concepto: 'Un objeto enseña la regla', objetivo: 'Encuentra la pista 1',
    explica: 'Sigue los bombillos: son migas de pan. La pista 1 está escondida en un puesto del mercado.',
    aprendiste: 'una pista enseña la regla sin texto. Aquí, pintarse es contrabando.' },
  { id: 'general', disc: 'cine', concepto: 'Plano general', objetivo: 'Rueda un plano general',
    teclas: { pc: 'C pone el lente · F rueda', tactil: 'Botón Lente · botón rojo rueda' },
    explica: 'Ahora eres camarógrafo. Pon el lente de 24 mm, encuadra la calle completa y rueda.',
    aprendiste: 'el plano general dice dónde estamos.' },
  { id: 'pista2', disc: 'level', concepto: 'Punto de presión y desvío', objetivo: 'Encuentra la pista 2',
    explica: 'Más adelante, un arco escanea rostros: es un punto de presión. Doña Rosario conoce una ruta sin cámaras.',
    aprendiste: 'el desvío es más largo, pero paga: sin cámaras y con premio.' },
  { id: 'detalle', disc: 'cine', concepto: 'Plano detalle', objetivo: 'Rueda un plano detalle',
    teclas: { pc: 'C hasta 85 mm · acércate · F rueda', tactil: 'Lente de 85 mm · acércate · botón rojo' },
    explica: 'Pon el lente de 85 mm y acércate a un objeto. El detalle muestra la pista de cerca.',
    aprendiste: 'el plano detalle obliga a mirar lo importante.' },
  { id: 'pista3', disc: 'game', concepto: 'Revelación', objetivo: 'Encuentra la pista 3 en la plaza',
    explica: 'La Plaza de Nariño es un nodo: todas las rutas se cruzan ahí. La última pista cambia el sentido de todo.',
    aprendiste: 'la revelación ordena todo lo que viste antes.' },
  { id: 'contrapicado', disc: 'cine', concepto: 'Contrapicado', objetivo: 'Rueda un contrapicado',
    teclas: { pc: 'Mira hacia arriba · F rueda', tactil: 'Arrastra hacia abajo para mirar arriba · botón rojo' },
    explica: 'Mira desde abajo la torre del Ojo, o un cuy gigante. Así se filma el poder.',
    aprendiste: 'desde abajo, lo filmado se ve grande y amenazante.' },
  { id: 'decision', disc: 'game', concepto: 'Decisión significativa', objetivo: 'Decide en la carroza',
    explica: 'Ve a la carroza, al suroeste de la plaza. Elijas lo que elijas, algo te va a costar.',
    aprendiste: 'una decisión pesa cuando las dos opciones cuestan.' },
  { id: 'salida', disc: 'level', concepto: 'Salida transformada', objetivo: 'Sal al páramo',
    explica: 'La puerta verde del páramo se ve desde lejos, con el Galeras detrás. Sal por ella.',
    aprendiste: 'la salida se ve antes de llegar, y llegas cambiado.' },
];
