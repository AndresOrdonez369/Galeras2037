# GALERAS 2037 · sitio y slides

Sitio del taller **Galeras 2037: del plano al mundo jugable** (FICPA 2026). Contiene la experiencia 3D de Pasto 2037, la información del taller y las slides en HTML. Funciona sin internet.

## Abrirlo en el computador del taller

Doble clic en **`iniciar.bat`**. Se abre `http://localhost:2037`.

O desde una terminal en esta carpeta:

```bash
node server.js
```

> Hay que abrirlo con el servidor. Si abres `index.html` con doble clic, el 3D y el plano no cargan (el navegador bloquea los módulos sin servidor).

La terminal también muestra una dirección del tipo `http://192.168.x.x:2037`. Los celulares conectados al mismo wifi pueden abrir esa dirección.

## Durante el taller

- Guía para exponer, slide por slide: **GUIA_EXPOSITOR.md**.
- Preparación (pasos, compras, impresión, actividades y tiempos): **PREPARACION_TALLER.md**.
- Kit imprimible (fichas, plano A3, cartas, storyboard): **/kit** en la web.
- Escáner de planos (foto del A3 → mundo 3D recorrible): **/escaner** en la web. Procedimiento en la sección 3b de la guía.
- En la ventana de presentador (**P**), «Empezar el taller» activa el reloj que dice si vas a tiempo y qué slides opcionales saltar.

| Qué | Cómo |
|---|---|
| **Modo transmisión** (el recorrido corre solo, sin interfaz) | En la página principal, tecla **T** (o `/?transmision`) |
| Ir directo a un capítulo del nivel | `/#nivel-6` (0 = llegada … 11 = la toma) o el índice de capítulos a la derecha |
| **Jugar el nivel** | Botón "Jugar el nivel". Lo guía el Cuy Express en un cuadro de diálogo (E, Espacio o un toque para seguir) por 9 lecciones en orden; la lección actual queda arriba al centro (tócala para repetirla). Las lecciones están en `LECCIONES` de `assets/js/level.js`. Teclado: W A S D / flechas, arrastrar para mirar, Shift corre, **E** examina, **F** toma un plano (clasifica general, detalle o contrapicado), **C** lentes de cine con visor (nombra en vivo el tipo de plano), **M** plano A3 (minimapa), **L** capa de diseñador, Esc sale. En celular: joystick, botón amarillo y botón rojo. Con sonido sintetizado (botón Sonido). Al final, informe con las 9 lecciones |
| **Escáner** | `/escaner/`: célula → foto → 4 esquinas → corregir → Levantar en 3D (Revelar, Órbita, Recorrer, Plano, Captura). Se guarda por célula en ese navegador |
| **Slides** | `/slides/` |
| Siguiente / anterior | **→ ←**, espacio, o los botones de abajo a la derecha |
| Pantalla completa | **F** |
| Notas del tallerista | **N** |
| Ventana de presentador (notas, siguiente slide, reloj) | **P** |
| Temporizador de misión | **S** para iniciar o pausar, **R** para reiniciar |
| Archivo profundo | **A**, o `/slides/?archivo` |
| Modo lectura (todas las slides en scroll) | **L**, o `/slides/?leer` (en celular vertical se activa solo) |
| Índice | **I** o el botón ☰ |

## Imágenes

Las slides ya traen imágenes: son **renders del nivel 3D** hechos con `tools/render.html` (la portada es tu imagen generada con IA, `assets/img/imagen1`). Para regenerarlos después de cambiar el nivel: `GALERAS_DEV=1 PORT=2038 node server.js`, abre `http://localhost:2038/tools/render.html` y ejecuta `renderAll()` en la consola. Ese modo de servidor puede escribir archivos: úsalo solo mientras renderizas.

Si generas una imagen con IA, guárdala con el mismo nombre (por ejemplo `assets/img/z3-distopias.jpg`) y reemplaza al render.


Los prompts están en **`PROMPTS_IMAGENES.md`**. Guarda cada imagen en `assets/img/` con el nombre exacto que indica el prompt (`.jpg`, `.png` o `.webp`) y aparece sola.

En el mismo modo de servidor, `http://localhost:2038/tools/contacto.html` arma una hoja de contactos con todas las imágenes para revisarlas de un vistazo (guarda `assets/img/zz-contacto.jpg`: bórrala antes de publicar).

## Pruebas y depuración

| Qué | Cómo |
|---|---|
| Escáner con una foto sintética (perspectiva y luz despareja) | Abre `/escaner/?debug`, y en la consola: `import('/tools/prueba-escaner.js').then(m => m.run())`. Devuelve el error de las 4 esquinas en píxeles |
| Saltar a un punto del nivel jugable | `/?debug&jugar=x,z,yaw[,pitch]` (opcional: `&lente=24`, 35 u 85, y `&accion=e`, `pintarse` o `mascara`). Con `?debug`, la consola expone `window.juego` |

## Estructura

```
index.html            página principal (3D + taller)
slides/index.html     deck de slides
assets/css            estilos (base, sitio, slides)
escaner/index.html    escáner de planos (foto → 3D)
kit/index.html        kit imprimible
assets/js             market.js (escena 3D y plano), site.js, slides.js, escaner.js, qr.js, img.js
assets/fonts          Bungee, Bungee Shade, Doto, Atkinson Hyperlegible (SIL OFL)
assets/img            aquí van las imágenes generadas
vendor/three          Three.js r169 (MIT), local para funcionar sin internet
PLAN_TALLER.md        plan del taller
PROMPTS_IMAGENES.md   prompts de imágenes
PRODUCT.md            contexto de producto (Impeccable)
```

## Publicarlo

Es un sitio estático: sirve para GitHub Pages, Netlify o cualquier hosting. El QR de la slide de cierre se genera solo con la dirección desde la que se abren las slides.
