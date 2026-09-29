/* PNG a partir de los SVG del logo (con Bodoni Moda cargada para la leyenda):
     assets/logo/logo.png, logo-claro.png   (1200 × 1200, transparentes)
     assets/logo/icono-512.png              (la placa compacta sobre hueso)
     assets/apple-touch-icon.png            (180 × 180)
     assets/og-fpr.png                      (1200 × 630, para compartir)

   node scripts/generar-logo.mjs && node scripts/exportar-logo.mjs
*/
import { chromium } from 'file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = f => fs.readFileSync(path.join(raiz, f), 'utf8');
const FUENTES = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,600;1,6..96,400&family=Hanken+Grotesk:wght@500;600&display=swap">';
const navegador = await chromium.launch();

async function foto(html, ancho, alto, salida, transparente = false) {
  const p = await navegador.newPage({ viewport: { width: ancho, height: alto } });
  await p.setContent('<!doctype html><html><head>' + FUENTES + '<style>html,body{margin:0;background:transparent}</style></head><body>' + html + '</body></html>', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready.then(() => 0));
  await p.screenshot({ path: path.join(raiz, salida), omitBackground: transparente });
  await p.close();
  console.log('escrito', salida);
}

const logo = leer('assets/logo/logo.svg').replace('width="600" height="600"', 'width="1200" height="1200"');
const logoClaro = leer('assets/logo/logo-claro.svg').replace('width="600" height="600"', 'width="1200" height="1200"');
const favicon = leer('assets/favicon.svg');
await foto(logo, 1200, 1200, 'assets/logo/logo.png', true);
await foto(logoClaro, 1200, 1200, 'assets/logo/logo-claro.png', true);
await foto(favicon.replace('<svg ', '<svg width="512" height="512" '), 512, 512, 'assets/logo/icono-512.png');
await foto(favicon.replace('<svg ', '<svg width="180" height="180" ').replace('rx="12"', 'rx="0"'), 180, 180, 'assets/apple-touch-icon.png');

/* imagen para compartir: el logo sobre hueso y el titular */
const og = `<div style="width:1200px;height:630px;background:#F3F1EA;display:flex;align-items:center;gap:64px;padding:0 80px;box-sizing:border-box;font-family:'Hanken Grotesk',sans-serif;color:#17201C">
  <div style="width:420px;flex:none">${leer('assets/logo/logo.svg').replace('width="600" height="600"', 'width="420" height="420"')}</div>
  <div>
    <p style="margin:0 0 18px;font:600 15px/1 'Bodoni Moda',serif;letter-spacing:.3em;text-transform:uppercase;color:#425448">Empresas · Autónomos · Particulares</p>
    <p style="margin:0;font:400 62px/1.04 'Bodoni Moda',serif;letter-spacing:-.01em">Asesoría fiscal, laboral y contable <i style="color:#425448">en&nbsp;Badajoz.</i></p>
    <p style="margin:26px 0 0;font:500 22px/1.4 'Hanken Grotesk',sans-serif;color:#4C524D">Av. Tomás Romero de Castilla, 4 · 924 91 04 78</p>
  </div>
</div>`;
await foto(og, 1200, 630, 'assets/og-fpr.png');
await navegador.close();
