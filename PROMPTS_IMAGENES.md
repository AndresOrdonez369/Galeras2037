# GALERAS 2037: prompts de imágenes

30 imágenes para la web y las slides. Cada una tiene un **nombre de archivo fijo**: guárdala con ese nombre en `assets/img/` (sirve `.jpg`, `.png` o `.webp`) y aparece sola en su lugar. Mientras falte, se ve un marcador "Señal pendiente" con el nombre.

---

## Cómo usarlos

1. **Copia el bloque completo** de cada imagen. Ya incluye estilo, composición y formato.
2. **Midjourney:** agrega al final los parámetros que aparecen en *MJ*.
3. **ChatGPT / Gemini / Ideogram / Firefly:** pega el prompt tal cual; el formato ya está escrito dentro. Si la herramienta tiene campo de "negative prompt", usa el bloque **Evitar**.
4. **Genera 4 variantes y escoge** la que mejor cumpla el **"Debe tener"**. Si una imagen trae letras legibles o deformes, regenérala. El texto lo ponemos nosotros en la página.
5. Resolución mínima: **1920 px en el lado largo** para fondos 16:9 y **1400 px** para las verticales.
6. Pásame las imágenes y yo reviso encuadre, color y peso (las optimizo para que la web cargue rápido).

### Biblia de estilo (lo que hace que las 30 parezcan de la misma película)

- **Mundo:** Pasto, Nariño, año 2037. *Cyberpunk del Sur*: la tecnología llega usada, reparada y pintada a mano. Nada de Tokio ni de neón rosado.
- **Materiales:** rótulos pintados a mano, lonas de polietileno azul y naranja decoloradas por el sol, zinc corrugado, pantallas LED ámbar baratas, cables enredados, ceniza volcánica fina en el aire.
- **Luz:** sodio naranja de calle mezclado con luz cian de pantallas; cielo nublado color ceniza; asfalto húmedo.
- **Paleta:** gris ceniza · azul lona `#1F5FA8` · naranja lona `#F26B1D` · amarillo rótulo `#F2C230` · rojo rótulo `#C8261E`.
- **Cámara:** fotograma de cine, ARRI Alexa 35, lente anamórfico de 35 mm, grano de película suave, bruma volumétrica.
- **Personas:** gente andina y mestiza de Nariño, con dignidad y sin estereotipos. Tapabocas, respiradores o pañoletas contra la ceniza. Ruanas, chaquetas técnicas remendadas.
- **El Galeras:** volcán cónico ancho y oscuro, con fumarola gris y un resplandor naranja tenue en el cráter. Siempre al fondo, como hito.

### Evitar (negative prompt común)

```
neon pink, magenta, purple neon, Blade Runner skyline, Tokyo, Hong Kong, Asian signage, kanji, glossy chrome, clean utopian sci-fi, flying cars, readable text, letters, words, typography, logos, watermark, signature, extra fingers, deformed hands, distorted faces, cartoon, anime, plastic 3D render look, oversaturated HDR
```

**MJ (Midjourney), parámetros base:** `--style raw --v 7 --s 150 --no neon pink, magenta, text, letters, logo, watermark`

---

## A. Portada y web

### 01 · `p00-portada`
**Uso:** portada de las slides y cierre · **Formato:** 16:9 · **Debe tener:** la ciudad de noche, el Galeras al fondo, espacio oscuro abajo a la izquierda para el título.

```
Cinematic wide establishing shot of the city of Pasto, Colombia, in the year 2037, seen at blue hour from a hillside of the Atriz valley. A dense Andean city of low colonial buildings with clay-tile roofs mixed with patched concrete towers, tangled power lines, and rooftop water tanks. Thousands of warm sodium-orange streetlights and a few cold cyan screens glow through a haze of fine volcanic ash. In the background, the wide dark cone of the Galeras volcano dominates the skyline, with a slow gray ash plume and a faint orange glow at the crater. Hand-painted signs and sun-bleached blue and orange tarps are visible on the nearest rooftops. Overcast ash-gray sky, melancholic and beautiful, dystopian but lived-in. Composition: volcano on the right third, the bottom-left 40% of the frame darker and calm (space for a title). Photorealistic film still, ARRI Alexa 35, anamorphic 35mm lens, soft film grain, volumetric haze. Color palette of ash gray, tarp blue, tarp orange, signal yellow and signal red. No readable text. Aspect ratio 16:9.
```
*MJ:* `--ar 16:9` + parámetros base

### 02 · `hero-fallback`
**Uso:** imagen de respaldo de la web (si no hay 3D) y la que aparece al compartir el link · **Formato:** 16:9 · **Debe tener:** la misma calle del mundo 3D, con un rótulo de zinc gigante colgando en medio.

```
Night street of an open-air market in Pasto, Colombia, 2037, seen from eye level down the middle of the street. Both sides are lined with market stalls under sagging, sun-bleached blue and orange polyethylene tarps, lit from below by bare warm bulbs. Strings of light bulbs and tangled black cables cross overhead. A huge corrugated zinc sign hangs across the street with bold hand-painted blocky lettering in yellow and red (lettering abstract, not readable). Hand-painted vertical shop signs on the facades, a cheap amber LED ticker screen. Fine volcanic ash falls like snow in the light. At the vanishing point, the dark cone of the Galeras volcano with a faint orange crater glow. Wet asphalt reflections, sodium-orange light mixed with cyan screen light. A few people with ash masks and ruanas. Photorealistic cinematic film still, ARRI Alexa 35, anamorphic 35mm, film grain, volumetric haze. No readable text. Aspect ratio 16:9.
```
*MJ:* `--ar 16:9` + parámetros base

---

## B. Tarjetas de zona (fondos 16:9, con espacio a la izquierda para el texto)

> En todas, el **sujeto va en el tercio derecho** y la **mitad izquierda queda más oscura y tranquila**: ahí va la tarjeta de la zona.

### 03 · `z1-transmision`
**Uso:** Zona 1 · Transmisión · **Debe tener:** un punto de control en una plaza colonial, con ceniza y pantallas.

```
A civil evacuation checkpoint in the colonial central square of Pasto, Colombia, in 2037, at night. Metal crowd barriers, a makeshift tent made of blue tarp, workers in reflective vests and ash respirators handing out paper ID cards to a queue of people wearing ruanas. A hand-painted warning sign on a sheet of zinc and a portable amber LED message board (unreadable). A white colonial church facade and an equestrian-statue silhouette in the haze behind. Fine volcanic ash falling, floodlights creating volumetric beams, sodium-orange and cold cyan light. Composition: action concentrated on the right third, the left half darker and empty. Photorealistic cinematic film still, ARRI Alexa 35, anamorphic 35mm, film grain. No readable text. Aspect ratio 16:9.
```
*MJ:* `--ar 16:9` + parámetros base

### 04 · `z2-experiencia`
**Uso:** Zona 2 · Diseñar la experiencia · **Debe tener:** emoción de descubrimiento; una niña, una consola rota y el volcán.

```
A 10-year-old Andean girl wearing an oversized patched jacket and a cloth ash mask pulled down to her chin stands on a market crate holding a cracked, taped-up handheld game console whose screen glows cyan on her face. She looks up, mesmerized, toward the distant Galeras volcano glowing faintly orange beyond the tarps of a busy night market in Pasto, Colombia, 2037. Blue and orange tarps, hand-painted signs, light-bulb strings, falling ash. Wonder and curiosity, not fear. Composition: girl on the right third, medium shot from a low angle; left half soft, dark and out of focus. Photorealistic cinematic film still, ARRI Alexa 35, anamorphic 35mm, shallow depth of field, film grain. No readable text. Aspect ratio 16:9.
```
*MJ:* `--ar 16:9` + parámetros base

### 05 · `z3-distopias`
**Uso:** Zona 3 · Distopías · **Debe tener:** el Carnaval de Negros y Blancos convertido en distopía de vigilancia.

```
The Carnival of Blacks and Whites (Carnaval de Negros y Blancos) in Pasto, Colombia, reimagined in a dystopian 2037. A crowd of revelers covered in white talcum powder and black face paint dances in a narrow street while small surveillance drones with red lenses hover above and scan faces with thin cyan laser grids. Clouds of white talc in the air mix with gray volcanic ash. Some revelers hold up colorful handmade masks; the face paint works as camouflage against facial recognition. A giant papier-mâché carnival float figure, half-painted, half exposed wire armature, looms in the background. Energy, defiance and joy under surveillance. Composition: crowd and drones on the right two thirds, left side darker. Photorealistic cinematic film still, ARRI Alexa 35, anamorphic 35mm, motion blur in the dancers, film grain. No readable text. Aspect ratio 16:9.
```
*MJ:* `--ar 16:9` + parámetros base

### 06 · `z4-espacio`
**Uso:** Zona 4 · El espacio también escribe · **Debe tener:** que la ciudad se lea como un nivel de videojuego visto desde arriba.

```
High aerial three-quarter view, almost isometric, of a labyrinth of market alleys in Pasto, Colombia, 2037, at night, reading like a video game level map. Rows of blue and orange tarp roofs form clear paths; one main street is brighter (the critical path), side alleys are darker with a single glowing point of interest; a small plaza acts as a node; the river forms a dark edge; the Galeras volcano is visible on the horizon as the landmark. Warm sodium lights trace the routes like breadcrumbs. Fine ash haze, cinematic and readable, like a level designer's dream. Composition: the readable structure on the right two thirds, left side darker. Photorealistic aerial drone film still, tilt-shift feel, film grain. No readable text. Aspect ratio 16:9.
```
*MJ:* `--ar 16:9` + parámetros base

### 07 · `z5-niebla`
**Uso:** Zona 5 · Niebla de guerra · **Debe tener:** neblina espesa, una linterna que revela una pista.

```
A narrow alley in Pasto, Colombia, 2037, filled with thick volcanic ash fog at night. A person in a ruana and respirator, seen from behind, points a flashlight whose cone cuts through the fog and reveals, on a zinc wall, a single hand-painted red circle mark (a clue). Everything beyond the light is hidden: shapes of tarps, cables and doorways barely suggested. Mystery, tension, discovery. Composition: figure and beam on the right third, left half almost black fog. Photorealistic cinematic film still, ARRI Alexa 35, anamorphic 35mm, strong volumetric light, film grain. No readable text. Aspect ratio 16:9.
```
*MJ:* `--ar 16:9` + parámetros base

### 08 · `z6-vertical`
**Uso:** Zona 6 · Vertical slice · **Debe tener:** jóvenes filmando con un celular y luz de celofán; cine hecho con nada.

```
Three young Colombian students make a short film at night inside an abandoned market stall in Pasto, 2037. One holds a smartphone on a small handheld tripod, filming; another holds a phone flashlight covered with orange cellophane; the third holds a flashlight with cyan cellophane, creating a dramatic two-color light on a cardboard model of a city on a crate. Crumpled paper, aluminum foil, black cardboard flags, ash in the air, blue tarp walls. Focus, creativity, DIY cinema energy. Composition: the group on the right third, the left half darker. Photorealistic behind-the-scenes cinematic still, ARRI Alexa 35, anamorphic 35mm, film grain. No readable text. Aspect ratio 16:9.
```
*MJ:* `--ar 16:9` + parámetros base

### 09 · `z7-estreno`
**Uso:** Zona 7 · Estreno · **Debe tener:** una proyección comunitaria sobre una pared de zinc.

```
An outdoor community film screening in a night market in Pasto, Colombia, 2037. A projector on a stack of crates throws a bright beam through falling ash onto a large wall of corrugated zinc sheets, where a glowing image of a dark volcano is projected. A small crowd of silhouettes sits on plastic chairs and crates, some wearing ash masks, faces lit by the screen. Blue and orange tarps, strings of bulbs. Warm, communal, triumphant. Composition: screen and beam on the right two thirds, audience silhouettes in the foreground, left side darker. Photorealistic cinematic film still, ARRI Alexa 35, anamorphic 35mm, volumetric projector beam, film grain. No readable text. Aspect ratio 16:9.
```
*MJ:* `--ar 16:9` + parámetros base

---

## C. Imágenes de contenido

### 10 · `c01-plano-plano`
**Uso:** slide "Plano y plano" · **Formato:** 4:5 vertical · **Debe tener:** el mapa A3 del taller filmado con un celular. Es la idea central del taller.

```
Overhead photograph of a wooden workshop table: a large hand-drawn level map on A3 grid paper, with walls filled in with thick black marker, colored round stickers (red, yellow, blue, green), small paper figures and blue triangle camera marks. A smartphone mounted on a tiny tripod films the map from above; a phone flashlight covered with orange cellophane lights the paper from the side, casting long shadows of the paper figures. Hands of a participant placing a sticker. Black corner squares on the paper. Tactile, creative, workshop atmosphere, warm and cinematic. Photorealistic, 35mm lens, shallow depth of field, film grain. No readable text. Aspect ratio 4:5.
```
*MJ:* `--ar 4:5` + parámetros base

### 11 · `c02-estudio-aaa`
**Uso:** slide "El método de un estudio" · **Formato:** 3:4 · **Debe tener:** una sala de estudio de videojuegos con mapas de nivel en las paredes.

```
Inside a video game studio war room at night: walls covered with printed level maps, paper prototypes, sticky notes, whiteboards with flow diagrams and grey-box screenshots; several monitors showing an untextured grey-box 3D level; a small team of developers of diverse Latin American backgrounds discussing around a table full of paper maps and dice. Warm desk lamps mixed with cyan monitor light, a city at night with a distant volcano visible through the window. Professional, focused, collaborative. Photorealistic cinematic still, 35mm lens, film grain. No readable text on screens or paper. Aspect ratio 3:4.
```
*MJ:* `--ar 3:4` + parámetros base

### 12 · `c03-arcade-mercado`
**Uso:** slide "Historia I" · **Formato:** 2:1 horizontal · **Debe tener:** una máquina arcade vieja en un puesto del mercado.

```
An old 1980s arcade cabinet, repainted by hand in yellow and red with chipped paint, stands inside a market stall under a blue tarp in Pasto, Colombia, 2037. Its CRT screen glows with abstract pixel shapes; two kids in ash masks play while a vendor repairs another cabinet with exposed circuit boards. Tangled cables, a car battery as power supply, falling ash in the warm bulb light. Nostalgic and inventive. Photorealistic cinematic still, 35mm, film grain. No readable text. Aspect ratio 2:1.
```
*MJ:* `--ar 2:1` + parámetros base

### 13 · `c04-circulo-magico`
**Uso:** slide "El círculo mágico" · **Formato:** 3:4 · **Debe tener:** niños jugando dentro de un círculo de tiza en una plaza con ceniza.

```
Children playing inside a large circle drawn with white chalk on the ash-covered stones of a colonial plaza in Pasto, Colombia, 2037. Inside the circle the ash has been swept clean and the kids play a game with stones and hopscotch-like marks; outside the circle the gray ash covers everything and adults pass by with masks, ignoring them. The circle feels like a different world with its own rules. Late afternoon hazy light, long shadows. Photorealistic cinematic still, slightly high angle, 35mm, film grain. No readable text. Aspect ratio 3:4.
```
*MJ:* `--ar 3:4` + parámetros base

### 14 · `c05-celula0-rostro`
**Uso:** ejemplo maestro "Célula 0: Contrabando de Rostros" · **Formato:** 4:5 · **Debe tener:** un rostro pintado de negro y blanco que engaña a una cámara. Es la imagen más importante del ejemplo.

```
Close-up portrait of a young Andean woman from Pasto, Colombia, in 2037, her face covered with bold asymmetric black paint and white talcum powder patterns from the Carnival of Blacks and Whites, designed as camouflage against facial recognition. She stares defiantly at a small street surveillance camera on a pole in the foreground, whose cyan scanning light fails to lock on her face. White talc and gray volcanic ash float in the air. Background: blurred blue and orange tarps and warm bulbs. Powerful, dignified, rebellious. Photorealistic cinematic portrait, ARRI Alexa 35, 50mm, shallow depth of field, film grain. No readable text. Aspect ratio 4:5.
```
*MJ:* `--ar 4:5` + parámetros base

### 15 · `c06-utopia-distopia`
**Uso:** slide "Utopía, distopía, heterotopía" · **Formato:** 3:4 · **Debe tener:** la misma calle, partida en dos futuros.

```
A single street in Pasto, Colombia, split vertically down the middle into two futures in one seamless image. Left half: a utopian 2037 with green rooftop gardens, solar panels, clean water channels, people walking in sunlight, bright colorful tarps. Right half: a dystopian 2037 of the same street, covered in gray volcanic ash, boarded windows, surveillance cameras, people in respirators under a dark sky. The same colonial facades and the same Galeras volcano at the end of the street in both halves. Photorealistic cinematic still, centered symmetrical composition, 35mm, film grain. No readable text. Aspect ratio 3:4.
```
*MJ:* `--ar 3:4` + parámetros base

### 16 · `c07-panoptico`
**Uso:** slide "Lentes filosóficos I: el panóptico" · **Formato:** 2:1 · **Debe tener:** una torre de iglesia convertida en torre de vigilancia.

```
The bell tower of a colonial cathedral in Pasto, Colombia, 2037, converted into a surveillance tower: dozens of security cameras, antennas and cyan scanning lights bolted onto the old stone and white plaster, cables hanging down. Below, a circular plaza where tiny people walk in ash, all visible from the tower. Night, low clouds lit by the tower's lights, volcanic haze. Ominous, quiet, all-seeing. Photorealistic cinematic still, low angle, anamorphic 35mm, film grain. No readable text. Aspect ratio 2:1.
```
*MJ:* `--ar 2:1` + parámetros base

### 17 · `c08-cyberpunk-sur`
**Uso:** slide "Cyberpunk del Sur" · **Formato:** 3:4 · **Debe tener:** una chiva (bus escalera colombiano) convertida en bus cyberpunk. Es lo más "nuestro" del mundo.

```
A traditional Colombian chiva bus (colorful wooden "escalera" rural bus) retrofitted in 2037 with cyberpunk technology: hand-painted geometric patterns in yellow, red, blue and green, cheap amber LED strips, a solar panel roof rack piled with sacks and crates, antennas, a cracked screen on its side, passengers in ruanas and ash masks hanging from the ladder. It drives through a narrow street in Pasto at dusk with falling volcanic ash; the Galeras volcano is faint in the background. High tech, low life, Andean pride. Photorealistic cinematic still, 35mm anamorphic, film grain. No readable text. Aspect ratio 3:4.
```
*MJ:* `--ar 3:4` + parámetros base

### 18 · `c09-transhumano-mopa`
**Uso:** slide "Transhumanismo" · **Formato:** 3:4 · **Debe tener:** una artesana del barniz de Pasto (mopa-mopa) decorando un brazo prostético.

```
In a small artisan workshop in Pasto, Colombia, 2037, an older Andean woman artisan applies thin colorful sheets of traditional Barniz de Pasto (mopa-mopa resin lacquer) with a small knife onto a sleek black robotic prosthetic arm resting on her workbench, creating intricate geometric and floral patterns in red, green and gold. The arm's owner, a young man, sits beside her. Wooden tools, jars of resin, a magnifying lamp, warm light mixed with a cyan light from the prosthetic's joints. Craft meets technology, respectful and intimate. Photorealistic cinematic still, 50mm, shallow depth of field, film grain. No readable text. Aspect ratio 3:4.
```
*MJ:* `--ar 3:4` + parámetros base

### 19 · `c10-caverna`
**Uso:** slide "Lentes filosóficos I: la caverna" · **Formato:** 2:1 · **Debe tener:** la caverna de Platón actualizada: gente mirando sombras proyectadas por celulares.

```
A modern reinterpretation of Plato's allegory of the cave: inside a dark volcanic rock cave, a row of people sit with their backs to the entrance, staring at a cave wall where giant moving shadows are projected by the light of several smartphones held up behind them. At the far bright entrance, the ash-filled daylight and the silhouette of a volcano. Mysterious, philosophical, cinematic chiaroscuro. Photorealistic cinematic still, wide shot, anamorphic 35mm, film grain. No readable text. Aspect ratio 2:1.
```
*MJ:* `--ar 2:1` + parámetros base

### 20 · `c11-buen-vivir`
**Uso:** slide "Otra forma de imaginar el futuro" · **Formato:** 3:4 · **Debe tener:** un futuro deseable andino (contrapunto de la distopía).

```
A hopeful solarpunk future in the Andes of Nariño, Colombia, 2037: green terraced fields on the slopes above the city of Pasto, community gardens, small wind turbines and solar panels made from recycled materials, a family harvesting potatoes and corn together, an indigenous elder teaching children, colorful ruanas, clean water channels. The Galeras volcano is calm in the distance under a bright partly cloudy sky. Warm, communal, balanced, not naive. Photorealistic cinematic still, golden hour, 35mm, film grain. No readable text. Aspect ratio 3:4.
```
*MJ:* `--ar 3:4` + parámetros base

### 21 · `c12-piranesi-pasto`
**Uso:** slide "Piranesi: espacios imposibles" · **Formato:** 3:4 · **Debe tener:** un grabado al estilo Piranesi, con arquitectura colonial convertida en cárcel imposible.

```
An 18th-century etching in the style of Giovanni Battista Piranesi's "Carceri d'invenzione": an impossible prison of colonial Andean architecture, with massive stone arches, endless staircases that lead nowhere, suspended wooden bridges, chains and pulleys, tiny human figures, smoke rising, and through a huge arch the faint cone of a volcano. Dense cross-hatching, black ink on aged cream paper, dramatic perspective and oppressive scale. Monochrome etching, highly detailed. No text. Aspect ratio 3:4.
```
*MJ:* `--ar 3:4 --style raw --v 7 --no color, text, letters, watermark`

### 22 · `c13-plaza-metafisica`
**Uso:** slide "Plazas vacías, sombras largas" · **Formato:** 3:4 · **Debe tener:** pintura metafísica al estilo De Chirico, de una plaza de Pasto.

```
A metaphysical painting in the style of Giorgio de Chirico: an empty colonial plaza in Pasto with long arcades, extremely long dramatic shadows, a lone statue on a pedestal, a small distant figure, a deep green-black sky and the smooth cone of a volcano on the horizon emitting a thin plume, as if it were a factory chimney. Flat oil-paint texture, warm ochre and terracotta buildings against the dark sky, eerie stillness, anticipation. Oil painting on canvas. No text. Aspect ratio 3:4.
```
*MJ:* `--ar 3:4 --style raw --v 7 --no text, letters, watermark, photo`

### 23 · `c14-galeras-hito`
**Uso:** slide "El Galeras ya es un hito" · **Formato:** 3:4 · **Debe tener:** una calle recta que termina en el volcán; el volcán como imán visual.

```
A long straight sloping street in Pasto, Colombia, 2037, framed by colonial houses with balconies, hand-painted signs, cables and sun-bleached tarps, leading the eye perfectly to the huge Galeras volcano that fills the end of the street, with a gray plume and faint orange glow. A lone pedestrian in a ruana walks toward it. Strong one-point perspective, the volcano as an irresistible visual magnet. Dusk, ash haze, sodium streetlights turning on. Photorealistic cinematic still, 35mm anamorphic, film grain. No readable text. Aspect ratio 3:4.
```
*MJ:* `--ar 3:4` + parámetros base

### 24 · `c15-camino-critico`
**Uso:** slide "Camino crítico y desvío" · **Formato:** 3:4 · **Debe tener:** un camino principal iluminado y un desvío oscuro con una recompensa que brilla.

```
A fork in a night market alley in Pasto, Colombia, 2037, seen from the player's point of view. The main path ahead is clearly lit by a row of warm bulbs and orange tarps, leading to a visible exit with a bright opening. To the side, a darker narrow alley with a single intriguing glowing object at its far end (a lantern or a small shrine with candles), inviting exploration. Ash falling, wet ground reflecting the lights. Feels like a beautifully designed video game level. Photorealistic cinematic still, 24mm, film grain. No readable text. Aspect ratio 3:4.
```
*MJ:* `--ar 3:4` + parámetros base

### 25 · `c16-planta-camara`
**Uso:** slide "La planta de cámara" · **Formato:** 3:4 · **Debe tener:** un dibujo técnico de un set visto desde arriba, con posiciones de cámara. Sin texto.

```
A hand-drawn film director's floor plan (camera blocking diagram) seen from directly above, on cream graph paper: the layout of a market street with stalls drawn as rectangles, walls filled in black marker, blue triangle symbols for camera positions with light blue view cones, dashed arrows for actor movement, a few round colored stickers (red, yellow, blue, green), pencil circles for sound zones, small eraser marks and coffee stain. Clean, readable, beautiful technical drawing. Flat top-down scan, evenly lit, no perspective. No letters, no numbers, no text. Aspect ratio 3:4.
```
*MJ:* `--ar 3:4 --style raw --v 7 --no text, letters, numbers, watermark, perspective`

### 26 · `c17-niebla-postits`
**Uso:** slide "Protocolo de playtest" · **Formato:** 3:4 · **Debe tener:** manos jugando un mapa de papel tapado con post-its.

```
Overhead photograph of a playtest on a workshop table: a hand-drawn A3 grid paper level map partially covered with square yellow and orange sticky notes hiding unexplored rooms (fog of war). One hand moves a small wooden game token along a corridor; another hand lifts a sticky note revealing a red sticker underneath. Around the map: an observation sheet, pencils, colored stickers, and an orange-filtered phone flashlight casting side light. Focused, tactile, game-design atmosphere. Photorealistic, 35mm, shallow depth of field, film grain. No readable text. Aspect ratio 3:4.
```
*MJ:* `--ar 3:4` + parámetros base

### 27 · `c18-fotosecuencia`
**Uso:** slide "La Jetée" · **Formato:** 3:4 · **Debe tener:** fotografía en blanco y negro, fija y melancólica, como homenaje (no copia) a La Jetée.

```
Black and white still photograph, grainy 1960s documentary style: a woman in a coat stands on the observation terrace of a small mountain airport, the wind moving her hair, looking toward the runway where an old propeller plane waits; beyond it, the silhouette of a volcano with a thin plume. A frozen moment of memory, melancholic and mysterious. High contrast monochrome, heavy film grain, slight motion blur, 50mm lens. An original homage to photo-novel science fiction, not a recreation of any existing film frame. No text. Aspect ratio 3:4.
```
*MJ:* `--ar 3:4 --style raw --v 7 --no color, text, watermark`

### 28 · `c19-celofan`
**Uso:** slide "Dirección de arte con $5.000" · **Formato:** 3:4 · **Debe tener:** el truco del celofán, claro y replicable.

```
Behind-the-scenes photo of a tiny DIY film set on a table: a cardboard and paper miniature of a market street with crumpled paper rubble and aluminum foil, lit dramatically by two smartphone flashlights, one covered with orange cellophane (from the back, as backlight) and one with cyan cellophane (from the side), creating cinematic two-tone light and long shadows. A third phone on a mini tripod films the scene. Black cardboard used as a light flag. Simple, cheap, magical. Photorealistic, 35mm, shallow depth of field, film grain. No readable text. Aspect ratio 3:4.
```
*MJ:* `--ar 3:4` + parámetros base

### 29 · `c20-la-cocha-seca`
**Uso:** portada del archivo profundo · **Formato:** 16:9 · **Debe tener:** la Laguna de La Cocha seca, con lanchas varadas; sujeto a la derecha.

```
The Laguna de La Cocha lake in Nariño, Colombia, in a dystopian 2037, almost completely dried up: cracked mud flats, colorful wooden boats stranded on the dry lakebed, the small island in the distance now a hill, a few people walking with plastic water containers toward a rusty water vending machine glowing cyan. Andean mountains covered in low clouds, gray ash light. Sad, quiet, powerful. Composition: boats and machine on the right third, the left half calm and darker. Photorealistic cinematic film still, anamorphic 35mm, film grain. No readable text. Aspect ratio 16:9.
```
*MJ:* `--ar 16:9` + parámetros base

### 30 · `c21-mercado-memorias`
**Uso:** slide de pausa "Refugio" · **Formato:** 16:9 · **Debe tener:** un puesto que vende memorias en frascos; sujeto a la IZQUIERDA (el texto va a la derecha).

```
A strange market stall in Pasto, Colombia, 2037, that sells memories: rows of glass jars and old USB drives on wooden shelves, each jar glowing softly with a tiny moving scene inside (a birthday, a carnival, a lake), price tags hand-painted (unreadable). An elderly vendor in a ruana and a cloth ash mask holds a jar up to the light for a young customer. Blue tarp roof, warm bulbs, falling ash, cyan glow from the jars. Poetic, melancholic, magical realism. Composition: stall and vendor on the LEFT third, the right half darker and calm. Photorealistic cinematic film still, anamorphic 35mm, film grain. No readable text. Aspect ratio 16:9.
```
*MJ:* `--ar 16:9` + parámetros base

---

## D. Foto real (no IA)

### `andres-retrato`
**Uso:** web (sección Tallerista) y slide "Quién te habla" · **Formato:** vertical 4:5, mínimo 1200 × 1500 px.
Una foto tuya real: medio cuerpo, fondo oscuro o neutro, luz lateral cálida. Si quieres que dialogue con el mundo, puede ser con una lámpara naranja de un lado y una luz fría (pantalla o celular) del otro. **No la generes con IA.**

---

## Lista de control

| # | Archivo | Formato | Dónde aparece |
|---|---|---|---|
| 01 | `p00-portada` | 16:9 | Slides: portada y cierre |
| 02 | `hero-fallback` | 16:9 | Web: respaldo y enlace compartido |
| 03 | `z1-transmision` | 16:9 | Zona 1 |
| 04 | `z2-experiencia` | 16:9 | Zona 2 |
| 05 | `z3-distopias` | 16:9 | Zona 3 |
| 06 | `z4-espacio` | 16:9 | Zona 4 |
| 07 | `z5-niebla` | 16:9 | Zona 5 |
| 08 | `z6-vertical` | 16:9 | Zona 6 |
| 09 | `z7-estreno` | 16:9 | Zona 7 |
| 10 | `c01-plano-plano` | 4:5 | Plano y plano |
| 11 | `c02-estudio-aaa` | 3:4 | El método de un estudio |
| 12 | `c03-arcade-mercado` | 2:1 | Historia I |
| 13 | `c04-circulo-magico` | 3:4 | El círculo mágico |
| 14 | `c05-celula0-rostro` | 4:5 | Célula 0 |
| 15 | `c06-utopia-distopia` | 3:4 | Utopía / distopía |
| 16 | `c07-panoptico` | 2:1 | El panóptico |
| 17 | `c08-cyberpunk-sur` | 3:4 | Cyberpunk del Sur |
| 18 | `c09-transhumano-mopa` | 3:4 | Transhumanismo |
| 19 | `c10-caverna` | 2:1 | La caverna |
| 20 | `c11-buen-vivir` | 3:4 | Otra forma de imaginar el futuro |
| 21 | `c12-piranesi-pasto` | 3:4 | Piranesi |
| 22 | `c13-plaza-metafisica` | 3:4 | De Chirico |
| 23 | `c14-galeras-hito` | 3:4 | El Galeras es un hito |
| 24 | `c15-camino-critico` | 3:4 | Camino crítico |
| 25 | `c16-planta-camara` | 3:4 | La planta de cámara |
| 26 | `c17-niebla-postits` | 3:4 | Protocolo de playtest |
| 27 | `c18-fotosecuencia` | 3:4 | La Jetée |
| 28 | `c19-celofan` | 3:4 | Luz de celofán |
| 29 | `c20-la-cocha-seca` | 16:9 | Archivo profundo |
| 30 | `c21-mercado-memorias` | 16:9 | Refugio (pausa) |
| — | `andres-retrato` | 4:5 | Foto real tuya |

**Prioridad si hay poco tiempo:** 01, 14, 17, 10, 23, 03–09 (las 7 zonas). Con esas 12 el deck ya se siente completo.
