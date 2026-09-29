/* Comprueba contra los archivos que el mando de maqueta ya no está.
   La receta del README no se escribe de memoria: se comprueba.

   node scripts/comprobar-borrado.mjs              (los archivos del sitio)
   node scripts/comprobar-borrado.mjs <carpeta>    (otra copia, p. ej. la que
                                                    deja verificar.mjs al probar la receta)
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const RASTROS = [
  ['index.html',      /\[MANDO DE MAQUETA\]/,   'comentarios [MANDO DE MAQUETA]'],
  ['index.html',      /id="mando"/,             'el <div class="mando">'],
  ['index.html',      /fpr-densidad/,           'la parte de densidad del script del <head>'],
  ['index.html',      /densidad-placas/,        'la clase densidad-placas del <html>'],
  ['css/estilos.css', /\[MANDO DE MAQUETA\]/,   'el bloque CSS del mando'],
  ['css/estilos.css', /densidad-sobria/,        'las reglas de la densidad sobria'],
  ['js/main.js',      /\[MANDO DE MAQUETA\]/,   'el bloque JS del mando'],
  ['js/main.js',      /mandoMaqueta/,           'la función mandoMaqueta()'],
  ['js/main.js',      /densidad-sobria/,        'la función sobria() mirando la clase'],
  ['privacidad.html', /fpr-densidad/,           'la fila del aviso de cookies']
];

export function rastros(dir) {
  return RASTROS.map(([archivo, patron, que]) => ({ archivo, que, queda: patron.test(fs.readFileSync(path.join(dir, archivo), 'utf8')) }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = rastros(raiz);
  console.log('Rastros del mando de maqueta en ' + raiz);
  console.log('-'.repeat(70));
  r.forEach(x => console.log((x.queda ? 'QUEDA ' : 'limpio') + '  ' + x.archivo.padEnd(18) + x.que));
  console.log('-'.repeat(70));
  const n = r.filter(x => x.queda).length;
  if (n) { console.log(n + ' rastro(s). No entregar todavía.'); process.exitCode = 1; }
  else console.log('Sin rastros del mando. Se puede entregar.');
}
