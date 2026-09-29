# FPR Asesores Consultores · Badajoz · «Tres placas»

Web de una página para **FPR Asesores Consultores** («FPR Asesoría Fiscal y Contable» en Google), asesoría fiscal, laboral y contable en la avenida Tomás Romero de Castilla, 4, D, de Badajoz. Es un negocio real que **no ha pedido la web**: se le enseña como propuesta. Hoy no tiene web (la ficha de Google dice «Añadir sitio web»).

> **Estado: maqueta de presentación, terminada y verificada en local (181 comprobaciones).**
> Todas las páginas llevan `noindex, nofollow`. Lleva un mando de revisión interno (solo con `?revision`) que se borra antes de entregar y varios datos marcados como `[PENDIENTE]`.

Datos, fuentes y lo que está sin confirmar: `../fpr-asesoria-fiscal-contable-badajoz-bocetos/DATOS-FPR.md`. Prompt: `../fpr-asesoria-fiscal-contable-badajoz-bocetos/PROMPT-tres-placas.md`.

## El dominio ya es suyo

**fprasesores.es** está registrado a su nombre (el correo va por One.com) y tiene un WordPress (tema OceanWP) en modo «Página en construcción» desde 2024: por la REST se ve vacío, con la página de ejemplo y las imágenes de demostración del tema, subidas en mayo–julio de 2024 y tocado por última vez el 14-01-2026. Llevan dos años intentando tener web. **Esta podría ir en ese dominio**: es un argumento para la llamada.

## Concepto: «Tres placas»

La idea que ordena la web sale de **lo que ya es suyo**: el logo de tres placas verdes con la F, la P y la R, el doble círculo de pincel, el verde y el rótulo de la fachada. Por eso no afirma nada que pueda resultarles ajeno.

**Por qué es amplia y no de nicho.** No gira alrededor de una reseña, de un servicio ni de un susto (la carta de Hacienda fue la primera idea y se descartó por eso). Las cinco áreas de su cartel tienen el mismo peso. Las ideas más concretas son **módulos que se quitan** sin tocar lo demás.

Las placas son el sistema de la web, no un adorno:

- **Cortina**: tres placas verde rótulo tapan la pantalla, cada una con su letra en blanco, grande y abajo; suben las letras, aparece «Asesores Consultores» y las placas se recogen hacia arriba escalonadas (expo.inOut, 90 ms entre placas) y destapan el hero con el logo ya en su sitio. Se acelera al primer gesto. Se retira sin GSAP, con movimiento reducido (ni un fotograma), con `<noscript>` y con dos redes de seguridad (6 s en `main.js`, 8 s en línea en el `<head>`).
- **Hero anclado con scrub**: el logo completo sobre hueso. El doble círculo **se dibuja** con dos trazos de pincel que corren en sentidos opuestos (una máscara que avanza sobre el anillo **relleno**, no `dasharray` sobre un trazo), las placas suben desde la base y las letras aparecen al final. Al bajar, las tres placas **crecen y se separan** hasta ser tres columnas altas, las letras se apagan, aparecen «01 Fiscal · 02 Laboral · 03 Contable» y giran en `rotateY` para enseñar una frase de cada área. Estado en vivo (Europe/Madrid): «Abierto ahora · hasta las 14:00» o «Abrimos mañana/el lunes a las 9:00». En móvil: texto arriba, logo debajo y las tres placas apiladas que giran de una en una al entrar.
- **Rejilla de tres columnas** en todas las secciones.
- **Separadores**: tres barras verticales finas que suben escalonadas.
- **Progreso**: la placa compacta de la cabecera; sus tres placas se rellenan de verde de abajo arriba, un tercio de página cada una (se comprueba que se ve de verdad con `elementFromPoint`).
- **Cursor**: punto verde y aro; sobre un enlace el aro se convierte en tres barritas. Nada en táctil. Encima de la lupa se aparta.
- **Menú móvil**: la hamburguesa son tres placas finas.

Secciones, en orden: hero · marquesina a dos velocidades (áreas / público) · qué hacemos (pila sticky de cinco placas altas, con índice que la sigue) · módulo **carta** · módulo **factura** · lo que dicen · módulo **herencias** · módulo **glosario** · horario y dónde estamos · pie.

**Paleta**: verde del logo `#425448`, verde del rótulo `#1F3D36`, hueso `#F3F1EA`, blanco de placa `#FFFFFF`, tinta `#17201C`, salvia `#DDE5DE`. Sin acento ajeno a la marca: las estrellas y los detalles van en verde. Los tonos secundarios salen de `color-mix` y todos pasan 4,5:1 (`node scripts/contraste.mjs`, que replica las mezclas y compone el alfa): verde sobre hueso 7,2:1, blanco sobre verde 8,1:1.
**Tipografías**: Bodoni Moda (la familia de las letras del logo; cursiva para el acento; las versalitas espaciadas de la leyenda como estilo de etiquetas) y Hanken Grotesk.
**Tono**: de usted y en plural («le atendemos», «nuestra asesoría»), como contestan ellos en Google. Sin suponer el género del equipo (un test lo vigila fuera de las citas literales). **No se da ningún significado a «FPR»** (otro test falla si aparece «Fiscal · Personas · Resuelto» o parecido).
**Imágenes**: ninguna foto de stock ni retrato. La fachada de Instagram es una captura con la interfaz de Google encima y poca resolución, así que se **dibujó en SVG** (ladrillo, rótulo con las tres placas, vinilos redondos) para el hueco del mapa.

## Qué la separa de las otras asesorías

| Web | Su motivo | Aquí |
|---|---|---|
| Enrique Botejara (Badajoz) | Balanza que se nivela, latón, Libre Caslon + Public Sans | Ni balanza ni latón ni esas letras. El gesto son placas que crecen y giran |
| Jorge Miralles (Badajoz) | Mesa: papeles que vuelan al montón, grapa, bandeja, ventanilla, semáforo; Instrument Serif + Figtree | Nada de papeles volando ni de mesa. Sin esas tipografías |
| Pozo Rondón (Badajoz, también verde) | Balanza, radar, nóminas abiertas; verde `#1E5C3F` | Se distingue por la **forma**: rectángulos verticales, círculo de pincel, didona. El verde es otro (gris, el de su logo) |
| Rivand | Dial de trimestres con el plazo en vivo | Ni dial ni calendario fiscal. Lo único «en vivo» es el horario |
| «Sello», «Casillas», «Cinta sumadora», «Expediente» | Sellos, casillas, tiras de sumadora, carpetas | Nada de eso |

`verificar.mjs` falla si aparecen esas tipografías o las palabras balanza, grapa, bandeja, semáforo o turnero.

Lo que sí comparte con las hermanas es el kit: GSAP + ScrollTrigger, Lenis desde jsDelivr, char-reveal, botones magnéticos, marquesina, cursor propio, cortina, cookies y mando de densidades. De Miralles salen los archivos de servicio (legales, 404, manifest, `servir.mjs`, `versionar.mjs` y la base de `verificar.mjs`), no su estructura.

## Los módulos: cómo quitarlos

Cada idea concreta va en su propia sección, que se borra **entera** (con su comentario de encabezado) sin tocar nada más. El JS comprueba que existen y que se ven antes de crear sus ScrollTrigger, y `verificar.mjs` quita cada uno y los cuatro a la vez comprobando que no hay errores, ni pins huérfanos, ni scroll horizontal, y que se llega al pie.

| Módulo | Qué es | Para quitarlo, en `index.html` |
|---|---|---|
| `carta` | «¿Le ha llegado una carta de Hacienda?»: el sobre se abre, sale la carta y se dibujan dos notas en el margen | Borrar `<!-- … MÓDULO «carta» … -->` y su `<section data-modulo="carta">` |
| `factura` | «Lo que cobra no es todo suyo»: la barra de 1.210 € se separa en 850 / 150 / 210 con el scroll | Ídem con `data-modulo="factura"` |
| `herencias` | «Una herencia, paso a paso»: las placas bajan del círculo por tres ramas a tres figuras, y se encienden los cinco pasos (anclado con scrub) | Ídem con `data-modulo="herencias"` |
| `glosario` | «Dicho en claro»: la lupa que traduce la jerga (en táctil se arrastra con el dedo) | Ídem con `data-modulo="glosario"` |

Opcional, para dejarlo limpio: borrar también sus bloques en `css/estilos.css` (marcados «módulo: …») y en `js/main.js` (`carta()`, `factura()`, `herencias()`, `glosario()`); si no se borran no hacen nada. La pila de servicios se come su hueco con `.servicios + *`, así que da igual qué sección venga detrás.

Salvaguardas de contenido: la carta es genérica y sin logos oficiales, sin «sin cita» ni plazos prometidos; la factura lleva la nota del ejemplo (IVA 21 %, retención 15 %) y ninguna cifra de ahorro; la herencia no tiene cuotas, plazos ni parentescos, y el texto dice que el reparto no tiene por qué ser a partes iguales; el glosario no cita artículos ni leyes.

## Lista de `[PENDIENTE]`

- [ ] **Qué significa «FPR»** y **quién atiende** (nombres y, si quieren, fotos). No se inventa nada: ni significado ni equipo.
- [ ] **De quién es cada móvil y si se publican** (678 73 34 22, 686 30 90 01, 667 01 93 32, del cartel de Instagram). Van en línea secundaria, sin atribuirlos a nadie, tras `var MOVILES_PUBLICABLES = true;` al principio de `js/main.js`: con `false` desaparecen de la web y el fijo sigue (probado).
- [ ] **WhatsApp**: no se pone ninguno hasta saber si alguno lo tiene (un test falla si aparece).
- [ ] **Horario de tarde y de verano**: esopiniones daba 17:00–19:00 (dato antiguo) y Google solo de mañana. En la web, «Horario de tarde y de verano: consúltenos».
- [ ] **Razón social y NIF** (y el titular) para el aviso legal y la privacidad: marcados `[PENDIENTE]`.
- [ ] **El archivo original del logo.** El de la web está **redibujado a mano** en SVG a partir de `fuentes/logo-recorte-x2.png` (`scripts/generar-logo.mjs`): placas medidas, letras F, P, R como trazados propios de didona y el doble círculo como dos pinceladas **rellenas** de grosor variable. Parecido, no idéntico: hay que pedir el original.
- [ ] **Verde exacto del rótulo**: se usa `#1F3D36` (muestreado de la fachada) solo para fondos oscuros; el del logo es `#425448`.
- [ ] **Si quieren la web en fprasesores.es.**
- [ ] El literal de su descripción en Páginas Amarillas (la página da 403).

## Estructura

```
index.html          cortina, cabecera (progreso), hero, marquesina, servicios, 4 módulos, opiniones, dónde, pie, cookies, mando
404.html            «Aquí falta una placa.» Rutas absolutas bajo /fpr-asesores-badajoz-web/
aviso-legal.html    borrador con titular, razón social y NIF [PENDIENTE] y el email real
privacidad.html     borrador; lista lo que se guarda en localStorage
manifest.json
css/estilos.css
js/main.js          GSAP 3.12.5 + ScrollTrigger + Lenis 1.1.13, desde jsDelivr
assets/             favicon.svg (la placa compacta), apple-touch-icon.png, og-fpr.png, logo/ (SVG y PNG, completo, claro y compacto)
scripts/            generar-logo.mjs, exportar-logo.mjs, servir.mjs, verificar.mjs, contraste.mjs, comprobar-borrado.mjs, versionar.mjs
screenshots/        escritorio y móvil: cortina, hero al principio, a mitad del scrub y con las placas giradas, módulos, sobria, sin GSAP, reducido, 404, legales
```

## Revisar en local

```
node scripts/servir.mjs              # http://127.0.0.1:4196/fpr-asesores-badajoz-web/  (con el mando: …/index.html?revision)
node scripts/verificar.mjs           # 181 comprobaciones con Playwright
node scripts/verificar.mjs --capturas
node scripts/contraste.mjs
node scripts/generar-logo.mjs && node scripts/exportar-logo.mjs   # si cambia el logo
node scripts/versionar.mjs           # antes de cada commit que toque CSS o JS
```

`verificar.mjs` sirve el sitio bajo el prefijo del repo, recorre con `mouse.wheel` (Lenis) y comprueba, entre otras cosas:

- **Prohibidos** en las cuatro páginas: el recuento de reseñas (`\b(\d+|una|diez)\s+(reseñas?|opiniones)`), «clientes satisfechos», `aggregateRating`, «WhatsApp», un significado inventado de las siglas, «sin cita», «sin permanencia», «le ahorramos», antigüedad o fechas relativas, las tipografías y motivos de Botejara, Miralles y Pozo Rondón. `noindex` en todas; JSON-LD `AccountingService` con dirección, teléfono y horario y sin `aggregateRating`; CSS y JS versionados; Lenis desde jsDelivr.
- **Checklist de la memoria**, un punto por comprobación: cursor (el del sistema oculto, tres barritas con relleno ≥ .35 sobre enlaces, nada en táctil); pila sticky en página limpia bajando en pasos de 90 px (nadie se suelta antes, nada asoma bajo la última, salen juntas, sin hueco; comprobado también que **falla** con la última sin margen o más baja); menú con `100dvh` y desenfoque con la cabecera ya fija; `.cookies:not([hidden])`; cortina que tapa, es de otro color, se recoge escalonada y acaba en `display:none` en las tres pasadas.
- **Hero**: el círculo se dibuja (fotogramas intermedios de la máscara) y los dos trazos van en sentidos opuestos; a mitad las placas crecen; luego tres columnas sin pisarse y con Fiscal, Laboral y Contable; al final giradas y **legibles** (el dorso delante, la frase entera).
- **Módulos**: la carta sale y se anota; la barra de la factura termina en tres tramos separados de tres colores, sin etiquetas encima; la herencia se ancla y acaba con las tres placas sobre los herederos y los cinco pasos encendidos; la lupa traduce lo que tiene debajo, también arrastrada con el dedo.
- **Opiniones**: literales, con nombre de pila y fuente exacta, una cada vez (nunca dos encima, ni al hacer scroll ni con las flechas seguidas), 5,0 en Google sin recuento y botón a la ficha real con las reseñas abiertas (sin parámetros de rastreo).
- **Densidades**, **sin GSAP** (CDN bloqueado), **movimiento reducido**, **cuatro móviles** (360×640, 375×667, 390×844, 768×1024: texto arriba y logo debajo, nada se sale, placas giradas y legibles), **quitar cada módulo y los cuatro**, `MOVILES_PUBLICABLES = false`, rendimiento (huecos entre fotogramas desde `fonts.ready`), 404 bajo el prefijo y legales.
- **La receta de borrado del mando**, aplicada de verdad a una copia: sin rastros (`comprobar-borrado.mjs`) y la web sigue funcionando.

## Decisiones técnicas

- Cada propiedad tiene un solo dueño: el scrub mueve `left/top/width/height` de la `.placa` (con `container-type: size`, las letras y los rótulos crecen con ella) y el `rotateY` de su `.placa__giro`; la subida del logo se anima en los `rect` del SVG, que ceden el sitio a las placas de verdad en el primer instante del scrub. Nada de `rotate`/`scale` en el CSS de lo que toca GSAP.
- `backface-visibility: hidden` en las dos caras, ningún `filter` ni sombra animados. La placa tapada de la pila se oscurece con una capa que solo cambia de opacidad.
- Banderas separadas: `gsapReady` (hay motor) y `movimiento` (además, sin movimiento reducido). El estado en vivo, la lupa, el índice de la pila y las opiniones funcionan con movimiento reducido; lo que se apaga es el viaje. Sin GSAP y con movimiento reducido, el CSS de reposo **es el estado final** (tarjetas giradas, factura separada, herencia repartida).
- `remontar()` vuelve a montar todas las secciones en orden de documento (los pins de arriba abajo) al cambiar el ancho, al llegar las fuentes y al cambiar de densidad; un `ResizeObserver` refresca ScrollTrigger con cualquier cambio de alto.
- `versionar.mjs` solo toca atributos `href="…"`/`src="…"`: el de Miralles versionaba la primera mención del archivo y aquí se comió un comentario del HTML.

## Quitar el mando de maqueta antes de entregar

El mando **solo aparece si la URL lleva `?revision`**; el enlace que se manda al cliente, sin el parámetro, sale limpio, y sin `?revision` tampoco se aplica una densidad guardada.

Dos densidades:

- **Placas** (cargada): la cortina, el hero con las placas que crecen y giran, separadores animados, progreso en la cabecera y los cuatro módulos.
- **Sobria**: el hero sin scrub (logo que se dibuja y titular), los servicios en rejilla de tres columnas en vez de pila, separadores quietos y los cuatro módulos fuera. A cambio, las opiniones se leen **todas a la vez**, que la de Placas no enseña. Sirve para enseñar en la llamada que la web aguanta sin los adornos.

Pasos (los aplica `verificar.mjs` a una copia y comprueba el resultado con `comprobar-borrado.mjs`):

1. `index.html`:
   - En el `<script>` del `<head>`, borrar desde `/* la densidad guardada solo cuenta…` hasta el `} catch (e) {}` del final, y la línea `[MANDO DE MAQUETA] — la parte de la densidad…` de su comentario. **La red de seguridad de la cortina (`setTimeout` de 8 s) se queda.**
   - Borrar el comentario `[MANDO DE MAQUETA]` del final y el `<div class="mando">`.
   - Quitar `densidad-placas` de la clase del `<html>`.
   - Si eligen la **Sobria**: antes, pasar sus reglas a CSS normal (quitar el prefijo `.densidad-sobria` en `estilos.css`) y borrar los cuatro módulos y el `<div class="triptico">`.
2. `css/estilos.css`: borrar todo lo que hay entre `[MANDO DE MAQUETA]` y `fin del bloque [MANDO DE MAQUETA]`.
3. `js/main.js`: borrar `mandoMaqueta()` entre los mismos comentarios y dejar `function sobria() { return false; }` (o `true` si eligen la Sobria).
4. `privacidad.html`: borrar la fila `fpr-densidad`.
5. Pasar `node scripts/comprobar-borrado.mjs`.

## Antes de publicar como web del cliente

- [ ] Resolver los pendientes de arriba y pedir el logo original.
- [ ] Borrar el mando y pasar `comprobar-borrado.mjs`.
- [ ] Quitar el `noindex` de las cuatro páginas.
- [ ] `node scripts/versionar.mjs` y `node scripts/verificar.mjs`.
