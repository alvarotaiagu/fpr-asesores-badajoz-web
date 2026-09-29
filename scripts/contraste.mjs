/* Contraste WCAG de cada pareja de texto y fondo que usa la web.
   Replica los color-mix(in srgb, …) de :root y compone los colores con alfa
   sobre el fondo real antes de medir (un rgba no tiene contraste propio).

   node scripts/contraste.mjs      (sale con código 1 si alguna pareja no llega)
*/
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const aHex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
const mezcla = (a, pa, b) => a.map((v, i) => v * pa + b[i] * (1 - pa));           // color-mix(in srgb, a pa, b)
const sobre = (c, alfa, fondo) => c.map((v, i) => v * alfa + fondo[i] * (1 - alfa)); // compone el alfa
const lin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
const L = c => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

const C = {
  verde: hex('#425448'), rotulo: hex('#1F3D36'), hueso: hex('#F3F1EA'), blanco: hex('#FFFFFF'),
  tinta: hex('#17201C'), salvia: hex('#DDE5DE')
};
C.tintaSuave = mezcla(C.tinta, 0.76, C.hueso);
C.huesoSuave = mezcla(C.hueso, 0.80, C.rotulo);
C.acentoClaro = mezcla(C.salvia, 0.86, C.verde);
C.verdeMedio = mezcla(C.verde, 0.58, C.salvia);
C.indiceApagado = mezcla(C.tinta, 0.62, C.hueso);
C.denso = mezcla(C.tinta, 0.72, C.blanco);
C.cabeceraSobreRotulo = sobre(C.hueso, 0.86, C.rotulo);       // la cabecera fija pasando por la herencia o el pie
C.lupa = mezcla(C.salvia, 0.94, C.blanco);                   // fondo de la lupa (94 % salvia sobre el blanco de la lectura)

const parejas = [
  // [texto, fondo, qué, mínimo]
  ['verde', 'hueso', 'verde del logo sobre hueso (cursivas, versalitas, enlaces)', 4.5],
  ['blanco', 'verde', 'blanco sobre verde (botones, placas, pila)', 4.5],
  ['verde', 'salvia', 'verde sobre salvia (carta, dónde)', 4.5],
  ['verde', 'blanco', 'verde sobre blanco (opiniones, factura, placa girada)', 4.5],
  ['tinta', 'hueso', 'tinta sobre hueso', 4.5],
  ['tintaSuave', 'hueso', 'secundario sobre hueso', 4.5],
  ['tintaSuave', 'salvia', 'secundario sobre salvia', 4.5],
  ['tintaSuave', 'blanco', 'secundario sobre blanco (leyenda de la factura)', 4.5],
  ['indiceApagado', 'hueso', 'índice de la pila, áreas aún no vistas', 4.5],
  ['denso', 'blanco', 'párrafo de jerga del glosario', 4.5],
  ['verde', 'lupa', 'texto de la lupa', 4.5],
  ['hueso', 'rotulo', 'hueso sobre rótulo (herencia, pie)', 4.5],
  ['huesoSuave', 'rotulo', 'secundario sobre rótulo', 4.5],
  ['acentoClaro', 'rotulo', 'cursivas y números sobre rótulo', 4.5],
  ['acentoClaro', 'verde', 'número de las placas sobre verde', 4.5],
  ['tinta', 'cabeceraSobreRotulo', 'cabecera fija (86 % hueso) sobre la sección oscura', 4.5],
  ['verde', 'cabeceraSobreRotulo', 'verde de la cabecera fija sobre la sección oscura', 4.5],
  ['verde', 'hueso', 'placa vacía del progreso (borde) sobre hueso: componente de interfaz', 3]
];

let malas = 0;
console.log('Contraste (WCAG 2.x)');
console.log('-'.repeat(92));
for (const [t, f, que, min] of parejas) {
  const r = ratio(C[t], C[f]);
  const ok = r >= min;
  if (!ok) malas++;
  console.log((ok ? 'ok   ' : 'NO   ') + r.toFixed(2).padStart(6) + ':1  ≥' + min + '  ' + que + '  (' + aHex(C[t]) + ' / ' + aHex(C[f]) + ')');
}
console.log('-'.repeat(92));
console.log('Derivados: tinta-suave ' + aHex(C.tintaSuave) + ' · hueso-suave ' + aHex(C.huesoSuave) + ' · acento-claro ' + aHex(C.acentoClaro) + ' · verde-medio ' + aHex(C.verdeMedio));
if (malas) { console.log(malas + ' pareja(s) por debajo.'); process.exitCode = 1; } else console.log('Todas las parejas pasan.');
