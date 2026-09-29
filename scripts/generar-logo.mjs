/* El logo de FPR, redibujado a mano en vectores a partir de
   fpr-asesoria-fiscal-contable-badajoz-bocetos/fuentes/logo-recorte-x2.png.
   No se calca ningún bitmap: las placas son rectángulos medidos, las letras
   F, P y R son trazados propios de didona (asta gruesa, perfiles finos) y el
   doble círculo de pincel son dos trazos RELLENOS de grosor variable, con las
   puntas afiladas, algo desplazados entre sí.

   node scripts/generar-logo.mjs

   Escribe:
     assets/logo/simbolos.txt      el sprite <symbol> que va en index.html
     assets/logo/logo.svg          completo, verde sobre transparente
     assets/logo/logo-claro.svg    completo, hueso (para fondos oscuros)
     assets/logo/compacto.svg      solo las tres placas
     assets/favicon.svg            la placa compacta sobre hueso
   y, si index.html tiene los marcadores SPRITE:INICIO / SPRITE:FIN, mete el
   sprite entre ellos.

   Pendiente: pedir el archivo original del logo (ver README).
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERDE = '#425448';
const HUESO = '#F3F1EA';
const r1 = n => Math.round(n * 10) / 10;

/* ── letras: caja 60 × 70, línea base en y = 70. Todos los subtrazados en el
   mismo sentido (horario), para que con nonzero los solapes no abran huecos. ── */
const rect = (x, y, w, h) => `M${x} ${y}H${r1(x + w)}V${r1(y + h)}H${x}Z`;
const GLIFOS = {
  F: [
    rect(14, 0, 11, 70),                 // asta
    rect(8, 68.4, 26, 1.6),              // remate inferior
    rect(8, 0, 44, 1.6),                 // brazo superior (perfil fino)
    'M48 0H52V17H50.5Z',                 // cuña del brazo
    rect(25, 33, 17, 1.6),               // brazo medio
    rect(41, 26, 1.5, 16)                // remate del brazo medio
  ].join(''),
  P: [
    rect(13, 0, 11, 70),
    rect(7, 68.4, 25, 1.6),
    rect(7, 0, 6, 1.6),
    'M24 0H35C47 0 53 8 53 17.5C53 27 47 35 35 35H24V33.4H34C40 33.4 42.5 27 42.5 17.5C42.5 8 40 1.6 34 1.6H24Z'
  ].join(''),
  R: [
    rect(11, 0, 11, 70),
    rect(5, 68.4, 25, 1.6),
    rect(5, 0, 6, 1.6),
    'M22 0H33C45 0 51 8 51 17.5C51 27 45 35 33 35H22V33.4H32C38 33.4 40.5 27 40.5 17.5C40.5 8 38 1.6 32 1.6H22Z',
    'M29 33.4H39.5L53.5 68.4H43Z',        // pierna
    rect(39, 68.4, 18, 1.6)              // remate de la pierna
  ].join('')
};

/* ── doble círculo de pincel ──
   Cada anillo es una pincelada que da algo más de una vuelta: línea central
   con un leve bamboleo y una deriva (acaba unos px fuera de donde empezó),
   y un grosor que respira y se afila en las dos puntas. Se dibuja el
   contorno exterior hacia delante y el interior de vuelta: un solo relleno. */
function pincelada({ cx, cy, R, a0, vuelta, sentido, W, deriva, fase }) {
  const N = 260;
  const fuera = [], dentro = [], centro = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const a = a0 + sentido * u * vuelta;
    const r = R + 2.1 * Math.sin(2 * a + fase) + 1.1 * Math.sin(5 * a + fase * 1.7) + deriva * u;
    const afilado = Math.pow(Math.min(1, u / 0.07), 0.75) * Math.pow(Math.min(1, (1 - u) / 0.12), 0.85);
    const w = W * (1 + 0.34 * Math.sin(3 * a + fase) + 0.18 * Math.sin(7 * a - fase)) * Math.max(afilado, 0.04);
    const c = Math.cos(a), s = Math.sin(a);
    fuera.push([cx + (r + w / 2) * c, cy + (r + w / 2) * s]);
    dentro.push([cx + (r - w / 2) * c, cy + (r - w / 2) * s]);
    centro.push([cx + r * c, cy + r * s]);
  }
  const linea = pts => pts.map((p, i) => (i ? 'L' : 'M') + r1(p[0]) + ' ' + r1(p[1])).join('');
  return {
    relleno: linea(fuera) + dentro.reverse().map(p => 'L' + r1(p[0]) + ' ' + r1(p[1])).join('') + 'Z',
    traza: linea(centro)
  };
}
const A1 = pincelada({ cx: 300, cy: 300, R: 281, a0: -2.25, vuelta: Math.PI * 2 + 0.34, sentido: 1, W: 7.6, deriva: 3.2, fase: 0.6 });
const A2 = pincelada({ cx: 296.5, cy: 303, R: 274.5, a0: 0.95, vuelta: Math.PI * 2 + 0.22, sentido: -1, W: 3.9, deriva: -2.4, fase: 2.1 });

/* ── composición del logo en una caja de 600 × 600 ── */
const PLACAS = [104, 240, 376].map(x => ({ x, y: 152, w: 120, h: 252 }));   // proporción 1 : 2,1
const LETRA = { alto: 54, base: 24 };                                      // alto de caja y distancia al pie
const letraEn = (p, l, fill) => {
  const esc = LETRA.alto / 70, w = 60 * esc;
  const x = r1(p.x + p.w / 2 - w / 2), y = r1(p.y + p.h - LETRA.base - LETRA.alto);
  return `<path transform="translate(${x} ${y}) scale(${r1(esc * 1000) / 1000})" d="${GLIFOS[l]}" fill="${fill}"/>`;
};
const LEYENDA = (fill, fuente) => `<text x="104" y="446" textLength="392" lengthAdjust="spacing" font-family="${fuente}" font-size="19.5" font-weight="600" fill="${fill}" letter-spacing="5">ASESORES CONSULTORES</text>`;

function logoSuelto(tinta, placaLetra, fondoLetra) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600" role="img" aria-label="FPR Asesores Consultores">
  <title>FPR Asesores Consultores</title>
  <path d="${A1.relleno}" fill="${tinta}"/>
  <path d="${A2.relleno}" fill="${tinta}"/>
  ${PLACAS.map(p => `<rect x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" fill="${tinta}"/>`).join('\n  ')}
  ${PLACAS.map((p, i) => letraEn(p, 'FPR'[i], fondoLetra)).join('\n  ')}
  ${LEYENDA(tinta, "'Bodoni Moda', Didot, 'Bodoni 72', 'Times New Roman', serif")}
</svg>
`;
}

const compactoPlacas = fill => [5, 24, 43].map(x => `<rect x="${x}" y="15" width="16" height="34" fill="${fill}"/>`).join('');
const compacto = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="FPR"><title>FPR</title>${compactoPlacas(VERDE)}</svg>\n`;
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="${HUESO}"/>${compactoPlacas(VERDE)}</svg>\n`;

/* ── sprite para la página: las letras y los anillos como <symbol> ── */
const simbolos = [
  ...Object.entries(GLIFOS).map(([l, d]) => `  <symbol id="g-${l}" viewBox="0 0 60 70"><path fill="currentColor" d="${d}"/></symbol>`),
  `  <symbol id="anillos" viewBox="0 0 600 600"><path fill="currentColor" d="${A1.relleno}"/><path fill="currentColor" d="${A2.relleno}"/></symbol>`
].join('\n');

fs.writeFileSync(path.join(raiz, 'assets/logo/simbolos.txt'), simbolos + '\n');
fs.writeFileSync(path.join(raiz, 'assets/logo/trazas.json'), JSON.stringify({ anillo1: A1.relleno, anillo2: A2.relleno, traza1: A1.traza, traza2: A2.traza }, null, 0) + '\n');
fs.writeFileSync(path.join(raiz, 'assets/logo/logo.svg'), logoSuelto(VERDE, VERDE, '#FFFFFF'));
fs.writeFileSync(path.join(raiz, 'assets/logo/logo-claro.svg'), logoSuelto(HUESO, HUESO, '#1F3D36'));
fs.writeFileSync(path.join(raiz, 'assets/logo/compacto.svg'), compacto);
fs.writeFileSync(path.join(raiz, 'assets/favicon.svg'), favicon);

/* el logo del hero y del pie lleva los anillos en línea (el del hero se dibuja con máscara) */
const bloques = {
  'SPRITE': simbolos,
  'ANILLO1': A1.relleno, 'ANILLO2': A2.relleno, 'TRAZA1': A1.traza, 'TRAZA2': A2.traza
};
const indice = path.join(raiz, 'index.html');
if (fs.existsSync(indice)) {
  let html = fs.readFileSync(indice, 'utf8');
  const antes = html;
  html = html.replace(/(<!-- SPRITE:INICIO -->)[\s\S]*?(<!-- SPRITE:FIN -->)/, (m, a, b) => a + '\n' + simbolos + '\n  ' + b);
  for (const k of ['ANILLO1', 'ANILLO2', 'TRAZA1', 'TRAZA2']) {
    html = html.replace(new RegExp('(data-trazo="' + k + '"[^>]*?\\sd=")[^"]*(")', 'g'), (m, a, b) => a + bloques[k] + b);
  }
  if (html !== antes) fs.writeFileSync(indice, html);
  console.log(html !== antes ? 'index.html actualizado' : 'index.html sin cambios');
}
console.log('logo generado:', Object.keys(bloques).map(k => k + ' ' + bloques[k].length).join(', '));
