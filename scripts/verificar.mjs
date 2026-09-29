/* Verificación de la maqueta FPR Asesores Consultores («Tres placas»).
   Levanta un servidor estático bajo el prefijo del repo (como GitHub Pages),
   abre el sitio con Playwright y recorre con la rueda (Lenis) comprobando:
   cortina que se recoge escalonada y se retira siempre, doble círculo que se
   dibuja con máscara en sentidos opuestos, placas del hero que crecen a
   columnas y terminan giradas y legibles, pila sticky (la última), progreso
   de la cabecera visible de verdad, cursor, menú con blur, cookies, mapa,
   módulos (y quitarlos), densidades, sin GSAP, movimiento reducido, cuatro
   móviles y que no aparece nada de la lista de prohibidos.

   node scripts/verificar.mjs             (todo)
   node scripts/verificar.mjs --capturas  (además guarda screenshots/)
*/
import { chromium } from 'file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { rastros } from './comprobar-borrado.mjs';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const conCapturas = process.argv.includes('--capturas');
if (conCapturas) fs.mkdirSync(path.join(raiz, 'screenshots'), { recursive: true });
const foto = n => path.join(raiz, 'screenshots', n);
const SIN_AVISO = '#cookies { visibility: hidden !important; }';   /* las capturas, sin el aviso de cookies delante */
const PREFIJO = '/fpr-asesores-badajoz-web';
const tipos = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json'
};

/* se sirve bajo el prefijo del repo, como en GitHub Pages: así el 404 con rutas absolutas se prueba de verdad */
function servir(dir, puerto) {
  const s = http.createServer((req, res) => {
    let limpia = decodeURIComponent(req.url.split('?')[0]);
    if (limpia.startsWith(PREFIJO)) limpia = limpia.slice(PREFIJO.length) || '/';
    const destino = path.join(dir, limpia === '/' ? 'index.html' : limpia);
    if (!destino.startsWith(dir)) { res.writeHead(403).end(); return; }
    if (!fs.existsSync(destino) || fs.statSync(destino).isDirectory()) {
      res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(path.join(dir, '404.html')));
      return;
    }
    res.writeHead(200, { 'content-type': tipos[path.extname(destino)] || 'application/octet-stream' });
    res.end(fs.readFileSync(destino));
  });
  return new Promise(r => s.listen(puerto, '127.0.0.1', () => r(s)));
}

const fallos = [];
const notas = [];
function comprobar(ok, mensaje) { (ok ? notas : fallos).push((ok ? 'OK   ' : 'FALLA') + ' · ' + mensaje); }
const J = o => JSON.stringify(o);

async function rueda(page, vueltas, paso = 600, espera = 220) {
  for (let i = 0; i < vueltas; i++) { await page.mouse.wheel(0, paso); await page.waitForTimeout(espera); }
  await page.waitForTimeout(1600);
}
async function alFinal(page) {
  let ant = -1;
  for (let i = 0; i < 140; i++) {
    await page.mouse.wheel(0, 700);
    await page.waitForTimeout(130);
    const y = await page.evaluate(() => Math.round(window.scrollY));
    if (y === ant) break;
    ant = y;
  }
  await page.waitForTimeout(2500);
}
async function hasta(page, selector, margen = 0) {
  for (let i = 0; i < 90; i++) {
    const top = await page.evaluate(s => document.querySelector(s).getBoundingClientRect().top, selector);
    if (top <= 100 + margen && top > -40) break;
    const paso = top > 0 ? Math.min(600, Math.max(100, top - 70)) : Math.max(-600, top - 90);
    await page.mouse.wheel(0, paso);
    await page.waitForTimeout(170);
  }
  await page.waitForTimeout(1700);
}
/* con Lenis scrollY va por detrás: se avanza hasta que el progreso del hero llegue */
async function progresoHero(page, objetivo) {
  for (let i = 0; i < 80; i++) {
    const p = await page.evaluate(() => window.__fprHero && window.__fprHero.st ? window.__fprHero.st.progress : -1);
    if (p >= objetivo) break;
    await page.mouse.wheel(0, 120);
    await page.waitForTimeout(160);
  }
  await page.waitForTimeout(1300);
  return page.evaluate(() => window.__fprHero.st.progress);
}

async function nuevaPagina(navegador, opciones = {}) {
  const contexto = await navegador.newContext({
    viewport: opciones.viewport || { width: 1440, height: 900 },
    reducedMotion: opciones.reducedMotion || 'no-preference',
    hasTouch: !!opciones.tactil, isMobile: !!opciones.tactil,
    deviceScaleFactor: 1
  });
  if (opciones.sinCookies) await contexto.addInitScript(() => { try { localStorage.setItem('fpr-cookies', 'ok'); } catch (e) {} });
  const page = await contexto.newPage();
  const errores = [];
  const caidas = [];
  page.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', e => errores.push('pageerror: ' + e.message));
  page.on('requestfailed', r => caidas.push(r.url() + ' → ' + (r.failure()?.errorText || '')));
  page.on('response', r => { if (r.status() >= 400) caidas.push(r.status() + ' ' + r.url()); });
  return { contexto, page, errores, caidas };
}
const caidasPropias = c => c.filter(x => !/favicon\.ico|google\.com\/maps|gstatic|googleapis\.com\/maps|maps\.google|google\.com\/(gen_204|log)/.test(x));

/* estado de las placas del hero */
const placasHero = page => page.evaluate(() => {
 /* la capa de la escena lleva pointer-events:none: para elementFromPoint se le devuelve un momento */
 const tri = document.getElementById('triptico');
 tri.style.pointerEvents = 'auto';
 const res = [...document.querySelectorAll('#triptico .placa')].map(p => {
  const r = p.getBoundingClientRect();
  const giro = p.querySelector('.placa__giro');
  const m = new DOMMatrix(getComputedStyle(giro).transform);
  const dorso = p.querySelector('.placa__dorso');
  const frase = p.querySelector('.placa__frase');
  const cx = r.left + r.width / 2, cy = r.top + r.height * 0.8;
  const enPunto = document.elementFromPoint(cx, cy);
  return {
    x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
    vis: getComputedStyle(p).visibility, op: +getComputedStyle(p).opacity,
    m11: +m.m11.toFixed(2),
    dorsoDelante: !!enPunto && dorso.contains(enPunto),
    fraseCabe: frase.scrollHeight <= frase.clientHeight + 1 && frase.getBoundingClientRect().bottom <= r.bottom + 1,
    letra: +getComputedStyle(p.querySelector('.placa__letra')).opacity
  };
 });
 tri.style.pointerEvents = '';
 return res;
});

/* aplica la receta del README («Quitar el mando de maqueta») a una copia */
function aplicarReceta(dir) {
  const f = n => path.join(dir, n);
  let html = fs.readFileSync(f('index.html'), 'utf8');
  html = html.replace(/\n\s*\/\* la densidad guardada solo cuenta[\s\S]*?\} catch \(e\) \{\}\n/, '\n')
    .replace(/\n\s*\[MANDO DE MAQUETA\] — la parte de la densidad es eliminable, ver README\. \*\//, ' */')
    .replace(/<!-- ═+\s*\n\s*\[MANDO DE MAQUETA\][\s\S]*?-->\s*\n<div class="mando"[\s\S]*?\n<\/div>\n/, '')
    .replace(' densidad-placas"', '"');
  fs.writeFileSync(f('index.html'), html);
  let css = fs.readFileSync(f('css/estilos.css'), 'utf8');
  css = css.replace(/\/\* ═+\s*\n\s*\[MANDO DE MAQUETA\][\s\S]*?fin del bloque \[MANDO DE MAQUETA\] ═+ \*\/\n/, '');
  fs.writeFileSync(f('css/estilos.css'), css);
  let js = fs.readFileSync(f('js/main.js'), 'utf8');
  js = js.replace(/\s*\/\* ═+\s*\n\s*\[MANDO DE MAQUETA\][\s\S]*?fin del bloque \[MANDO DE MAQUETA\] ═+ \*\//, '')
    .replace("function sobria() { return html.classList.contains('densidad-sobria'); }", 'function sobria() { return false; }');
  fs.writeFileSync(f('js/main.js'), js);
  let priv = fs.readFileSync(f('privacidad.html'), 'utf8');
  priv = priv.replace(/\s*<tr><td><code>fpr-densidad<\/code>.*?<\/tr>/, '');
  fs.writeFileSync(f('privacidad.html'), priv);
}

const base = 'http://127.0.0.1:4197' + PREFIJO;
const servidor = await servir(raiz, 4197);
const navegador = await chromium.launch();

try {
  /* ───── 0. lo que no puede aparecer en ninguna página ───── */
  const paginas = ['index.html', 'aviso-legal.html', 'privacidad.html', '404.html'];
  const prohibidos = [
    [/\b(\d+|una|diez)\s+(reseñas?|opiniones)/i, 'el recuento de reseñas'],
    [/clientes satisfechos|nuestros clientes|cientos de|miles de/i, 'prueba social en plural'],
    [/aggregateRating/, 'aggregateRating'],
    [/WhatsApp|wa\.me/i, 'WhatsApp (no sabemos si alguno lo tiene)'],
    [/sin permanencia|sin compromiso|sin cita|le ahorramos|gratis/i, 'condiciones o promesas («sin cita», «le ahorramos»…)'],
    [/años de experiencia|desde (19|20)\d\d|hace \d+ años/i, 'antigüedad o fechas relativas'],
    [/Libre Caslon|Public Sans|Instrument Serif|Figtree/, 'tipografías de Botejara o Miralles'],
    [/balanza|grapa|semáforo|turnero|bandeja/i, 'motivos de Botejara, Miralles o Pozo Rondón']
  ];
  for (const p of paginas) {
    const texto = fs.readFileSync(path.join(raiz, p), 'utf8');
    comprobar(/<meta charset="utf-8">\s*<meta name="robots" content="noindex, nofollow">/.test(texto), p + ': noindex, nofollow justo tras el charset');
    prohibidos.forEach(([re, que]) => comprobar(!re.test(texto), p + ': no aparece ' + que));
    /* un significado inventado de las siglas: el patrón con alguna palabra desplegada */
    const siglas = [...texto.matchAll(/F(iscal)?\s*·?\s*P(ersonas)?\s*·?\s*R(esuelto)?/g)].filter(m => m[1] || m[2] || m[3]).map(m => m[0]);
    comprobar(siglas.length === 0, p + ': ningún significado inventado de «FPR»' + (siglas.length ? ' → ' + siglas.join(' | ') : ''));
  }
  {
    const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
    const css = fs.readFileSync(path.join(raiz, 'css/estilos.css'), 'utf8');
    const js = fs.readFileSync(path.join(raiz, 'js/main.js'), 'utf8');
    const ld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
    let datos = null;
    try { datos = JSON.parse(ld[1]); } catch (e) {}
    comprobar(datos && datos['@type'] === 'AccountingService' && !datos.aggregateRating && datos.address?.postalCode === '06011' && datos.telephone === '+34924910478' && datos.openingHoursSpecification?.[0]?.opens === '09:00',
      'JSON-LD AccountingService con dirección, teléfono y horario, sin aggregateRating');
    comprobar(/estilos\.css\?v=[0-9a-f]{8}"/.test(html) && /main\.js\?v=[0-9a-f]{8}"/.test(html), 'CSS y JS versionados con ?v=<huella> (node scripts/versionar.mjs)');
    comprobar(/cdn\.jsdelivr\.net\/npm\/lenis@/.test(html) && !/cdnjs\.cloudflare\.com\/ajax\/libs\/lenis/.test(html), 'Lenis desde jsDelivr, no desde cdnjs');
    comprobar(/\.cookies:not\(\[hidden\]\)\s*\{\s*display:\s*flex/.test(css), 'CSS: .cookies:not([hidden]){display:flex}');
    comprobar(/height:\s*100dvh/.test(css), 'CSS: el menú móvil lleva height:100dvh');
    comprobar(/--tinta-suave:\s*color-mix/.test(css) && /--acento-claro:\s*color-mix/.test(css), 'CSS: los tonos derivados salen de color-mix');
    comprobar(/Bodoni\+Moda/.test(html) && /Hanken\+Grotesk/.test(html), 'tipografías: Bodoni Moda y Hanken Grotesk');
    const heroCss = (css.match(/\n\.hero \{[\s\S]*?\n\}/) || [''])[0];
    comprobar(/min-height/.test(heroCss) && !/\n\s*height:/.test(heroCss), 'CSS: el hero usa min-height, nunca height fija');
    comprobar(!/filter\s*:|shadowBlur|boxShadow\s*:|backdropFilter/.test(js), 'JS: ningún filter ni sombra animados por fotograma');
    comprobar(/ResizeObserver/.test(js) && /ST\.refresh\(\)/.test(js), 'JS: ResizeObserver + ScrollTrigger.refresh()');
    comprobar(/var MOVILES_PUBLICABLES = (true|false);/.test(js), 'JS: los móviles van tras la constante MOVILES_PUBLICABLES');
    comprobar(/backface-visibility:\s*hidden/.test(css), 'CSS: las caras de las placas con backface-visibility:hidden');
    /* el logo: redibujado a mano, sin bitmap */
    const simbolos = ['g-F', 'g-P', 'g-R', 'anillos'].every(id => new RegExp('<symbol id="' + id + '"').test(html));
    const anillo = (html.match(/data-trazo="ANILLO1" d="([^"]*)"/) || [])[1] || '';
    const favicon = fs.readFileSync(path.join(raiz, 'assets/favicon.svg'), 'utf8');
    comprobar(simbolos && anillo.length > 1000 && anillo.endsWith('Z') && !/<image|data:image|\.png/.test(html.match(/<svg class="logo-hero"[\s\S]*?<\/svg>/)[0]),
      'logo en SVG: letras F·P·R y doble círculo como trazos rellenos (sin bitmap)');
    comprobar((favicon.match(/<rect/g) || []).length === 4 && !/<text/.test(favicon), 'favicon: la placa compacta (tres placas), sin texto');
    comprobar(/mask="url\(#m-anillo1\)"/.test(html) && /mask="url\(#m-anillo2\)"/.test(html) && /maskUnits="userSpaceOnUse" x="0" y="0"/.test(html),
      'el doble círculo se dibuja con máscara (userSpaceOnUse con x=0 y=0), no con dasharray sobre su trazo');
    comprobar(/<section[^>]*data-modulo="carta"/.test(html) && /data-modulo="factura"/.test(html) && /data-modulo="herencias"/.test(html) && /data-modulo="glosario"/.test(html),
      'los cuatro módulos van en su <section data-modulo>');
    ['manifest.json', '404.html', 'aviso-legal.html', 'privacidad.html', 'assets/apple-touch-icon.png', 'assets/logo/icono-512.png', 'assets/og-fpr.png', 'assets/logo/logo.svg']
      .forEach(a => comprobar(fs.existsSync(path.join(raiz, a)), 'existe ' + a));
  }

  /* ───── 1. escritorio, pasada normal ───── */
  {
    const { contexto, page, errores, caidas } = await nuevaPagina(navegador);
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.documentElement.classList.contains('con-movimiento') || document.documentElement.classList.contains('sin-movimiento'));

    /* cortina: fotogramas intermedios, la única forma de ver que se recoge escalonada */
    let cubreAlEntrar = null, escalonada = null, colorCortina = '', letrasSuben = new Set(), trazas = [], fotoMedia = false;
    for (let i = 0; i < 120; i++) {
      const s = await page.evaluate(() => {
        const c = document.getElementById('cortina');
        const tr = [...document.querySelectorAll('.logo__traza')].map(t => parseFloat(getComputedStyle(t).strokeDashoffset) || 0);
        const rects = [...document.querySelectorAll('.logo__placa')].map(r => Math.round(r.getBoundingClientRect().height));
        if (getComputedStyle(c).display === 'none') return { fuera: true, tr, rects };
        const placas = [...c.querySelectorAll('.cortina__placa')].map(p => { const r = p.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; });
        const letra = new DOMMatrix(getComputedStyle(c.querySelector('.cortina__letra')).transform).m42;
        return { placas, color: getComputedStyle(c.querySelector('.cortina__placa')).backgroundColor, letra: Math.round(letra), tr, rects };
      });
      trazas.push(s.tr.map(Math.round).join(','));
      if (s.fuera) { if (i > 3 && trazas.length > 90) break; await page.waitForTimeout(40); continue; }
      colorCortina = s.color;
      letrasSuben.add(s.letra);
      if (cubreAlEntrar === null) cubreAlEntrar = s.placas.length === 3 && s.placas.every(p => p[1] === 0) && Math.abs(s.placas[0][0]) <= 1 && s.placas[2][0] + s.placas[2][2] >= 1439 && s.placas.every(p => p[3] >= 899);
      const tops = s.placas.map(p => p[1]);
      if (tops[0] < -60 && tops[0] < tops[1] - 4 && tops[1] < tops[2] - 4 && tops[2] > -850) {
        escalonada = escalonada || tops;
        if (conCapturas && !fotoMedia) { fotoMedia = true; await page.screenshot({ style: SIN_AVISO, path: foto('00b-cortina-se-recoge.png') }); }
      }
      if (i === 12 && conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('00a-cortina-letras.png') });
      await page.waitForTimeout(40);
    }
    comprobar(cubreAlEntrar, 'cortina: tres placas tapan la pantalla de lado a lado al entrar');
    comprobar(colorCortina === 'rgb(31, 61, 54)', 'cortina: verde rótulo, no el hueso del hero que destapa → ' + colorCortina);
    comprobar(letrasSuben.size >= 4, 'cortina: las letras F, P y R suben desde su máscara (' + letrasSuben.size + ' posiciones)');
    comprobar(!!escalonada, 'cortina: las placas se recogen hacia arriba escalonadas → ' + J(escalonada));
    await page.waitForTimeout(1500);
    const cortinaFinal = await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display);
    comprobar(cortinaFinal === 'none', 'cortina: acaba en display:none (pasada normal) → ' + cortinaFinal);
    /* el doble círculo se dibuja: la máscara pasa por valores intermedios, y los dos trazos corren en sentidos opuestos */
    const intermedios = new Set(trazas.filter(t => t.split(',').every(v => +v > 5)).map(t => t)).size;
    comprobar(intermedios >= 4, 'hero: el doble círculo se dibuja poco a poco (' + intermedios + ' fotogramas intermedios de la máscara)');
    const sentidos = await page.evaluate(() => [...document.querySelectorAll('.logo__traza')].map(t => {
      const a = t.getPointAtLength(0), b = t.getPointAtLength(40);
      return Math.sign((a.x - 300) * (b.y - 300) - (a.y - 300) * (b.x - 300));
    }));
    comprobar(sentidos[0] === -sentidos[1] && sentidos[0] !== 0, 'hero: los dos trazos de pincel corren en sentidos opuestos → ' + J(sentidos));
    comprobar(await page.evaluate(() => !!window.Lenis && document.documentElement.classList.contains('lenis')), 'Lenis cargado y gobernando el scroll');
    const reposo = await page.evaluate(() => ({
      pin: !!document.querySelector('.pin-spacer #inicio'),
      escena: document.getElementById('inicio').classList.contains('hero--escena'),
      logo: getComputedStyle(document.querySelector('.logo__placas')).opacity,
      titulo: document.getElementById('hero-titulo').getAttribute('aria-label'),
      desborda: document.documentElement.scrollWidth - innerWidth
    }));
    comprobar(reposo.pin && reposo.escena && reposo.logo === '1' && /Asesoría fiscal, laboral y contable en.Badajoz\./.test(reposo.titulo) && reposo.desborda <= 1,
      'hero al entrar: logo completo en su sitio, titular, anclado, sin scroll horizontal → ' + J(reposo));
    const estado = await page.evaluate(() => {
      const partes = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      const o = {}; partes.forEach(p => { o[p.type] = p.value; });
      const dia = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday];
      const h = parseInt(o.hour, 10) % 24 + parseInt(o.minute, 10) / 60;
      const abierto = dia >= 1 && dia <= 5 && h >= 9 && h < 14;
      const e = document.getElementById('estado-hero');
      return { texto: e.textContent.trim(), estado: e.dataset.estado, esperado: abierto ? 'abierto' : 'cerrado' };
    });
    comprobar(estado.estado === estado.esperado && /^(Abierto ahora · hasta las 14:00|Abrimos (hoy|mañana|el \w+) a las 9:00)$/.test(estado.texto),
      'hero: estado en vivo (Europe/Madrid) → ' + J(estado));
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('01-hero-escritorio.png') });

    /* cursor propio */
    await page.mouse.move(700, 300);
    await page.mouse.move(720, 330, { steps: 4 });
    await page.waitForTimeout(400);
    const cursorLibre = await page.evaluate(() => ({
      sistema: getComputedStyle(document.body).cursor,
      aro: getComputedStyle(document.querySelector('.cursor')).opacity,
      punto: getComputedStyle(document.querySelector('.cursor-punto')).opacity
    }));
    comprobar(cursorLibre.sistema === 'none' && cursorLibre.aro === '1' && cursorLibre.punto === '1', 'cursor: punto y aro visibles, el del sistema oculto → ' + J(cursorLibre));
    const boton = await page.locator('.hero__acciones .boton').first().boundingBox();
    await page.mouse.move(boton.x + boton.width / 2, boton.y + boton.height / 2, { steps: 6 });
    await page.waitForTimeout(700);
    const cursorBoton = await page.evaluate(() => {
      const c = document.querySelector('.cursor');
      const fondo = getComputedStyle(c).backgroundColor.match(/[\d.]+/g).map(Number);
      return { activo: c.classList.contains('cursor--activo'), alfa: fondo[3] ?? 1, barras: [...c.querySelectorAll('i')].map(i => +new DOMMatrix(getComputedStyle(i).transform).d.toFixed(2)), sistema: getComputedStyle(document.querySelector('.hero__acciones .boton')).cursor };
    });
    comprobar(cursorBoton.activo && cursorBoton.alfa >= 0.35 && cursorBoton.barras.length === 3 && cursorBoton.barras.every(d => d > 0.95) && cursorBoton.sistema === 'none',
      'cursor: sobre un enlace el aro se convierte en tres barritas (relleno ≥ .35) → ' + J(cursorBoton));
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('01b-cursor-barritas.png'), clip: { x: boton.x - 50, y: boton.y - 50, width: boton.width + 100, height: boton.height + 100 } });
    await page.mouse.move(720, 450, { steps: 4 });
    await page.waitForTimeout(300);

    /* el scrub: las placas crecen, se separan y giran */
    const W = 1440, H = 900;
    await progresoHero(page, 0.2);
    const medio = await placasHero(page);
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('02-hero-a-mitad.png') });
    comprobar(medio.every(p => p.vis === 'visible' && p.w > 130 && p.w < W * 0.3) && medio[0].x < medio[1].x && medio[1].x < medio[2].x,
      'hero a mitad: las tres placas del logo están creciendo y separándose → ' + J(medio.map(p => [p.x, p.w, p.h])));
    await progresoHero(page, 0.45);
    const columnas = await placasHero(page);
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('02b-hero-columnas.png') });
    const rotulos = await page.evaluate(() => [...document.querySelectorAll('#triptico .placa__rotulo')].map(r => r.textContent.replace(/\s+/g, '')));
    comprobar(columnas.every(p => p.w > W * 0.25 && p.h > H * 0.55) && columnas.every((p, i) => i === 0 || p.x >= columnas[i - 1].x + columnas[i - 1].w) && columnas.every(p => p.letra < 0.05),
      'hero: tres columnas altas que ocupan el ancho, sin pisarse, y sin las letras → ' + J(columnas.map(p => [p.x, p.w, p.h])));
    comprobar(J(rotulos) === J(['01Fiscal', '02Laboral', '03Contable']), 'hero: en las caras, las tres primeras áreas → ' + J(rotulos));
    await progresoHero(page, 0.9);           /* giradas del todo y aún ancladas (el respiro final) */
    const giradas = await placasHero(page);
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('03-hero-placas-giradas.png') });
    comprobar(giradas.every(p => p.m11 <= -0.98 && p.dorsoDelante && p.fraseCabe),
      'hero: las tres placas terminan giradas y legibles (dorso delante, frase entera) → ' + J(giradas.map(p => [p.m11, p.dorsoDelante, p.fraseCabe])));
    const textoFuera = await page.evaluate(() => +getComputedStyle(document.querySelector('.hero__texto')).opacity);
    comprobar(textoFuera < 0.05, 'hero: el texto se aparta para dejar sitio a las columnas');

    /* marquesina a dos velocidades */
    await hasta(page, '.marquesina', 200);
    const marq = await page.evaluate(async () => {
      const carriles = [...document.querySelectorAll('.marquesina__carril')];
      const leer = () => carriles.map(c => new DOMMatrix(getComputedStyle(c).transform).m41);
      const a = leer();
      await new Promise(r => setTimeout(r, 600));
      const b = leer();
      return { avance: b.map((v, i) => Math.round(v - a[i])), textos: carriles.map(c => c.firstElementChild.textContent) };
    });
    comprobar(marq.avance[0] < -3 && marq.avance[1] > 3 && marq.textos[0] === 'FiscalLaboralContableHerenciasTrámites y subvenciones' && marq.textos[1] === 'EmpresasAutónomosParticularesBadajoz',
      'marquesina: dos filas, sentidos opuestos, áreas y público → ' + J(marq));

    /* separadores: tres barras que suben */
    await hasta(page, '#servicios');
    const sep = await page.evaluate(() => [...document.querySelectorAll('#servicios .separador i')].map(i => +new DOMMatrix(getComputedStyle(i).transform).d.toFixed(2)));
    comprobar(sep.length === 3 && sep.every(d => d > 0.98), 'separadores: tres barras finas que han subido → ' + J(sep));

    /* pila de placas */
    const alturas = await page.evaluate(() => [...document.querySelectorAll('.placa-servicio')].map(t => ({ alto: t.offsetHeight, cabe: t.scrollHeight <= t.clientHeight + 1, ancho: t.offsetWidth })));
    comprobar(new Set(alturas.map(a => a.alto)).size === 1 && alturas.every(a => a.cabe && a.alto > a.ancho * 1.15), 'pila: cinco placas altas y verticales, todas del mismo alto y con el contenido dentro → ' + J(alturas));
    const areas = await page.evaluate(() => [...document.querySelectorAll('.placa-servicio h3')].map(h => h.textContent));
    comprobar(J(areas) === J(['Fiscal', 'Laboral', 'Contable', 'Herencias', 'Trámites y subvenciones']), 'pila: las cinco áreas en el orden de su cartel');
    if (conCapturas) { await hasta(page, '.pila__item:nth-child(3)', 20); await page.screenshot({ style: SIN_AVISO, path: foto('04-servicios-pila.png') }); }

    /* progreso de la cabecera: visible de verdad y rellenándose */
    const prog = await page.evaluate(() => {
      const p = document.getElementById('progreso').getBoundingClientRect();
      const en = document.elementFromPoint(p.left + p.width / 2, p.top + p.height / 2);
      return { seVe: !!en && document.getElementById('progreso').contains(en), relleno: [...document.querySelectorAll('#progreso i')].map(i => +new DOMMatrix(getComputedStyle(i).transform).d.toFixed(2)) };
    });
    comprobar(prog.seVe && prog.relleno[0] > 0.2 && prog.relleno[2] === 0, 'progreso: la placa compacta se ve (elementFromPoint) y va rellenando la primera placa → ' + J(prog));
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('04b-progreso-cabecera.png'), clip: { x: 50, y: 10, width: 300, height: 56 } });

    /* módulo carta */
    await hasta(page, '#carta', 60);
    await page.waitForTimeout(3600);
    const carta = await page.evaluate(() => ({
      y: Math.round(new DOMMatrix(getComputedStyle(document.getElementById('hoja-carta')).transform).m42),
      notas: [...document.querySelectorAll('.nota')].map(n => getComputedStyle(n).opacity),
      flechas: [...document.querySelectorAll('.nota__flecha path')].map(f => Math.round(parseFloat(getComputedStyle(f).strokeDashoffset) || 0)),
      copy: document.querySelector('.carta__texto').textContent.includes('Tráigala. La leemos con usted, le explicamos qué pide y preparamos la respuesta.')
    }));
    comprobar(carta.y < -60 && carta.notas.every(o => o === '1') && carta.flechas.every(v => v === 0) && carta.copy, 'carta: sale del sobre, las notas se dibujan en el margen, copy literal → ' + J(carta));
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('05-modulo-carta.png') });

    /* módulo factura */
    await hasta(page, '#factura', 0);
    /* poco a poco hasta que el scrub de la barra termine: con pasos grandes Lenis se pasa de sección */
    for (let i = 0; i < 20 && (await page.evaluate(() => +document.getElementById('factura-barra').dataset.progreso)) < 0.99; i++) {
      await page.mouse.wheel(0, 90);
      await page.waitForTimeout(260);
    }
    await page.waitForTimeout(1200);
    const factura = await page.evaluate(() => {
      const b = document.getElementById('factura-barra');
      const t = [...b.querySelectorAll('.tramo')].map(s => { const r = s.getBoundingClientRect(); const e = getComputedStyle(s); return { x: r.left, d: r.right, fondo: e.backgroundImage !== 'none' ? e.backgroundImage : e.backgroundColor, texto: s.textContent.trim() }; });
      return {
        progreso: +b.dataset.progreso,
        huecos: [Math.round(t[1].x - t[0].d), Math.round(t[2].x - t[1].d)],
        colores: new Set(t.map(s => s.fondo)).size,
        sinEtiquetas: t.every(s => !s.texto),
        leyenda: [...document.querySelectorAll('.factura__leyenda .eti')].map(e => getComputedStyle(e).opacity),
        nota: document.querySelector('.factura__nota').textContent.trim()
      };
    });
    comprobar(factura.progreso >= 0.99 && factura.huecos.every(h => h >= 8) && factura.colores === 3 && factura.sinEtiquetas && factura.leyenda.every(o => o === '1'),
      'factura: la barra termina separada en tres tramos de tres colores, leyenda debajo y sin etiquetas encima → ' + J(factura));
    comprobar(factura.nota === 'Ejemplo con el IVA general (21 %) y la retención general de profesionales (15 %). Cada caso puede ser distinto.', 'factura: nota visible del ejemplo');
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('06-modulo-factura.png') });

    /* opiniones */
    await hasta(page, '#opiniones', 0);
    const op = await page.evaluate(() => ({
      nota: document.querySelector('.opiniones__cifra').textContent.trim() + ' ' + document.querySelector('.opiniones__donde').textContent.trim(),
      firmas: [...document.querySelectorAll('.cita figcaption')].map(f => f.textContent.trim()),
      activas: document.querySelectorAll('.cita.activa').length,
      enlace: document.querySelector('.opiniones__nota a').href
    }));
    comprobar(op.nota === '5,0 en Google' && op.activas === 1, 'opiniones: 5,0 en Google, sin recuento, una cita cada vez → ' + J(op.nota));
    comprobar(J(op.firmas) === J(['Manuel · reseña en Google', 'Carmen · reseña en Google', 'Sandrus · reseña en Google', 'Rosa · opinión en esopiniones']), 'opiniones: nombre de pila y fuente exacta de cada una');
    comprobar(/google\.com\/maps\/place\/FPR/.test(op.enlace) && op.enlace.includes('!9m1!1b1') && !/g_ep|entry=/.test(op.enlace), 'opiniones: el botón abre la ficha real con las reseñas, sin parámetros de rastreo');
    const antes = await page.evaluate(() => document.querySelector('.cita.activa figcaption').textContent);
    await page.click('#cita-despues');
    await page.waitForTimeout(1200);
    const despues = await page.evaluate(() => document.querySelector('.cita.activa figcaption').textContent);
    comprobar(antes !== despues, 'opiniones: la flecha releva la cita (' + antes + ' → ' + despues + ')');
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('07-opiniones.png') });

    /* módulo herencias: anclado con scrub */
    await hasta(page, '#herencias', 0);
    const hPin = await page.evaluate(() => !!document.querySelector('.pin-spacer #herencias'));
    await rueda(page, 3, 300, 250);
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('08-herencia-a-mitad.png') });
    for (let i = 0; i < 30 && (await page.evaluate(() => +document.getElementById('herencias').dataset.progreso)) < 0.99; i++) {
      await page.mouse.wheel(0, 120);
      await page.waitForTimeout(220);
    }
    await page.waitForTimeout(1200);
    const her = await page.evaluate(() => {
      const s = document.getElementById('herencias');
      return {
        progreso: +s.dataset.progreso,
        placas: [...document.querySelectorAll('.arbol__placa')].map(g => g.getAttribute('transform').match(/[\d.]+/g).map(n => Math.round(+n))),
        pasos: document.querySelectorAll('#pasos li.on').length
      };
    });
    comprobar(hPin, 'herencias: la sección se ancla');
    comprobar(her.progreso >= 0.99 && her.placas.every((p, i) => Math.abs(p[0] - [110, 300, 490][i]) <= 2 && Math.abs(p[1] - 264) <= 4) && her.pasos === 5,
      'herencias: las tres placas terminan sobre los herederos, el círculo vacío y los cinco pasos encendidos → ' + J(her));
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('09-herencia-final.png') });

    /* módulo glosario: la lupa traduce lo que tiene debajo */
    await hasta(page, '#glosario', 0);
    const termino = await page.locator('.denso b[data-claro]').nth(2).boundingBox();
    await page.mouse.move(termino.x + termino.width / 2, termino.y + termino.height / 2, { steps: 10 });
    await page.waitForTimeout(1600);
    const lupa = await page.evaluate(() => ({ texto: document.getElementById('lupa-texto').textContent, on: document.querySelector('.denso b.on')?.textContent, cursor: getComputedStyle(document.querySelector('.cursor')).opacity }));
    comprobar(lupa.on === 'regularización' && lupa.texto === 'Hacienda le pide que corrija algo' && lupa.cursor === '0', 'glosario: la lupa traduce el término que tiene debajo (y el cursor se aparta) → ' + J(lupa));
    const leyes = await page.evaluate(() => /art(í|i)culo|\bley\b|real decreto|\bLGT\b|\bRD\b/i.test(document.querySelector('.denso').textContent));
    comprobar(!leyes, 'glosario: el texto denso no cita artículos ni leyes');
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('10-glosario-lupa.png') });
    await page.mouse.move(720, 450, { steps: 3 });

    /* horario y dónde */
    await hasta(page, '#donde', 0);
    const donde = await page.evaluate(() => ({
      estado: document.getElementById('horario-estado').dataset.estado,
      hoy: !!document.querySelector('#horario-tabla tr.hoy'),
      nota: document.querySelector('.horario__nota').textContent.trim(),
      moviles: [...document.querySelectorAll('.datos__moviles a')].map(a => a.getAttribute('href')),
      alrededor: document.querySelector('.datos__moviles').textContent,
      email: !!document.querySelector('.datos a[href="mailto:fpr@fprasesores.es"]'),
      fijo: document.querySelector('.datos__fijo').getAttribute('href')
    }));
    comprobar(/abierto|cerrado/.test(donde.estado) && donde.hoy && donde.nota === 'Horario de tarde y de verano: consúltenos.', 'dónde: estado en vivo, hoy marcado y la nota del horario de tarde y verano');
    comprobar(donde.fijo === 'tel:+34924910478' && J(donde.moviles) === J(['tel:+34678733422', 'tel:+34686309001', 'tel:+34667019332']) && donde.alrededor === 'También: 678 73 34 22 · 686 30 90 01 · 667 01 93 32' && donde.email,
      'dónde: el fijo primero y los tres móviles en línea secundaria, sin atribuirlos a nadie → ' + J(donde.alrededor));
    const iframesAntes = await page.$$eval('iframe', n => n.length);
    await page.click('#mapa-boton');
    await page.waitForTimeout(900);
    const src = await page.$eval('iframe', f => f.src).catch(() => '');
    comprobar(iframesAntes === 0 && /google\.com\/maps\?q=.*output=embed/.test(src), 'mapa: el iframe no existe hasta pulsar y usa maps?q=…&output=embed');
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('11-donde.png') });

    await alFinal(page);
    const fin = await page.evaluate(() => ({ relleno: [...document.querySelectorAll('#progreso i')].map(i => +new DOMMatrix(getComputedStyle(i).transform).d.toFixed(2)), pie: document.getElementById('pie').getBoundingClientRect().top < innerHeight }));
    comprobar(fin.relleno.every(d => d >= 0.99) && fin.pie, 'progreso: al final de la página las tres placas están llenas → ' + J(fin));
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('12-pie.png') });

    /* cookies */
    const ck = await page.evaluate(() => ({ oculto: document.getElementById('cookies').hidden, display: getComputedStyle(document.getElementById('cookies')).display }));
    comprobar(!ck.oculto && ck.display === 'flex', 'cookies: el aviso se ve al entrar');
    await page.click('#cookies-aceptar');
    await page.waitForTimeout(300);
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display) === 'none', 'cookies: el botón lo cierra de verdad');
    await page.click('#cookies-ajustes');
    await page.waitForTimeout(300);
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cookies')).display) === 'flex', 'cookies: «Ajustes de cookies» del pie vuelve a abrir el aviso');
    await page.click('#cookies-aceptar');
    const mando = await page.evaluate(() => { const m = document.getElementById('mando'); return { oculto: m.hidden, display: getComputedStyle(m).display }; });
    comprobar(mando.oculto && mando.display === 'none', 'sin ?revision el mando de maqueta no se ve');

    await page.click('.cabecera__marca');
    await page.waitForTimeout(2400);
    comprobar((await page.evaluate(() => Math.round(window.scrollY))) < 5, 'la marca de la cabecera vuelve arriba del todo (hero anclado)');
    const texto = await page.evaluate(() => document.body.textContent);
    comprobar(!/(\d+|una|diez)\s+(reseñas?|opiniones)/i.test(texto) && !/clientes satisfechos/i.test(texto), 'texto de la página: ni recuento de reseñas ni «clientes satisfechos»');
    const propio = await page.evaluate(() => { const c = document.body.cloneNode(true); c.querySelectorAll('blockquote').forEach(b => b.remove()); return c.textContent; });
    comprobar(!/\batentas\b|\bnosotras\b|\blas asesoras\b/i.test(propio), 'tono: no se supone el género del equipo fuera de las citas literales');
    comprobar(errores.length === 0, 'consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    const cp = caidasPropias(caidas);
    comprobar(cp.length === 0, 'sin peticiones caídas' + (cp.length ? ' → ' + cp.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 1b. la pila, en página limpia y bajando desde arriba en pasos de ~90 px ─────
     El fallo clásico está en la ÚLTIMA placa. */
  {
    const { contexto, page } = await nuevaPagina(navegador, { sinCookies: true });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    await page.mouse.move(720, 450);
    await hasta(page, '.pila__item:nth-child(4)', 300);
    const tope = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.pila__item')).top));
    let ultimo = null, sueltaAntes = null, asomaDebajo = null, seSeparan = null, ultimaPosada = false;
    for (let i = 0; i < 55; i++) {
      await page.mouse.wheel(0, 90);
      await page.waitForTimeout(170);
      const m = await page.evaluate(() => [...document.querySelectorAll('.pila__item')].map(li => { const r = li.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; }));
      ultimo = m;
      const ultima = m[m.length - 1], anteriores = m.slice(0, -1);
      if (!ultimaPosada && ultima[0] > tope + 2 && ultima[0] < 900 && anteriores.some(a => a[0] < tope - 2)) sueltaAntes = sueltaAntes || { paso: i, m };
      if (Math.abs(ultima[0] - tope) <= 2) {
        ultimaPosada = true;
        if (anteriores.some(a => a[1] > ultima[1] + 1)) asomaDebajo = asomaDebajo || { paso: i, m };
      }
      if (ultimaPosada && anteriores.some(a => Math.abs(a[0] - ultima[0]) > 2)) seSeparan = seSeparan || { paso: i, m };
    }
    const sinLlegar = ultimaPosada ? '' : ' (la última no llegó a posarse: ' + J(ultimo) + ')';
    comprobar(ultimaPosada && !sueltaAntes, 'pila: ninguna placa se suelta antes de que se pose la última' + (sueltaAntes ? ' → ' + J(sueltaAntes) : '') + sinLlegar);
    comprobar(ultimaPosada && !asomaDebajo, 'pila: la última tapa entera a la anterior' + (asomaDebajo ? ' → ' + J(asomaDebajo) : '') + sinLlegar);
    comprobar(ultimaPosada && !seSeparan, 'pila: al acabarse, las cinco salen juntas' + (seSeparan ? ' → ' + J(seSeparan) : '') + sinLlegar);
    const hueco = await page.evaluate(() => {
      const u = document.querySelector('.pila__item:last-child .placa-servicio').getBoundingClientRect();
      const s = document.querySelector('.servicios + *').getBoundingClientRect();
      return Math.round(s.top - u.bottom);
    });
    comprobar(hueco < 200, 'pila: sin un hueco vacío grande tras la última placa (' + hueco + 'px)');
    await contexto.close();
  }

  /* ───── 1c. rendimiento: huecos entre fotogramas durante el scroll, desde fonts.ready ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador, { sinCookies: true });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    await page.evaluate(() => document.fonts.ready.then(() => {
      window.__huecos = []; let ant = performance.now();
      (function paso(t) { if (t - ant > 50) window.__huecos.push(Math.round(t - ant)); ant = t; requestAnimationFrame(paso); })(performance.now());
    }));
    await page.waitForTimeout(300);
    await page.mouse.move(720, 450);
    for (let i = 0; i < 30; i++) { await page.mouse.wheel(0, 420); await page.waitForTimeout(120); }
    await page.waitForTimeout(1500);
    const huecos = await page.evaluate(() => window.__huecos || []);
    comprobar(huecos.length <= 4 && Math.max(0, ...huecos) < 200, 'rendimiento: scroll sin tareas largas propias (huecos >50 ms tras fonts.ready: ' + J(huecos) + ')');
    await contexto.close();
  }

  /* ───── 1c bis. cortina: las letras no se ven antes de subir (el usuario las vio aparecer, irse y volver) ───── */
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const { contexto, page } = await nuevaPagina(navegador, { viewport: vp, sinCookies: true });
    await contexto.addInitScript(() => {
      window.__letra = [];
      const t0 = performance.now();
      (function mirar() {
        const l = document.querySelector('.cortina__letra'), m = document.querySelector('.cortina__mascara'), c = document.getElementById('cortina');
        if (l && m && c && getComputedStyle(c).display !== 'none') {
          const rl = l.getBoundingClientRect(), rm = m.getBoundingClientRect();
          window.__letra.push([Math.round(performance.now() - t0), rl.height ? Math.max(0, Math.min(1, (rm.bottom - rl.top) / rl.height)) : 0]);
        }
        requestAnimationFrame(mirar);
      })();
    });
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3200);
    const m = await page.evaluate(() => window.__letra);
    /* hasta que la letra está entera, cuánto asoma nunca baja: ni un fotograma visible antes de la subida */
    let max = 0, baja = null;
    for (const [t, a] of m) { if (a < max - 0.05 && !baja) baja = { t, a: +a.toFixed(2), antes: +max.toFixed(2) }; max = Math.max(max, a); if (a >= 0.99) break; }
    comprobar(m.length > 5 && m[0][1] < 0.05 && !baja && max >= 0.99, 'cortina ' + vp.width + '×' + vp.height + ': las letras empiezan escondidas y suben una sola vez (sin aparecer, irse y volver) → ' + J({ primera: m[0], baja, max: +max.toFixed(2) }));
    await contexto.close();
  }

  /* ───── 1d. opiniones: nunca dos citas encima, ni al hacer scroll ni con las flechas seguidas ─────
     El usuario lo vio al hacer scroll: los relevos llegaban seguidos y los fundidos del anterior
     volvían a encender una cita que ya se iba (hasta 3–4 visibles a la vez). */
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const { contexto, page } = await nuevaPagina(navegador, { viewport: vp, sinCookies: true });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    await page.evaluate(() => {
      window.__citas = { max: 0, encima: 0 };
      (function mirar() {
        const n = [...document.querySelectorAll('.cita')].filter(c => { const s = getComputedStyle(c); return s.visibility !== 'hidden' && +s.opacity > 0.05; }).length;
        window.__citas.max = Math.max(window.__citas.max, n);
        if (n > 1) window.__citas.encima++;
        requestAnimationFrame(mirar);
      })();
    });
    await page.mouse.move(vp.width / 2, vp.height / 2);
    for (let i = 0; i < 80; i++) {
      const t = await page.evaluate(() => document.getElementById('opiniones').getBoundingClientRect().top);
      if (t < vp.height * 0.9) break;
      await page.mouse.wheel(0, 400); await page.waitForTimeout(120);
    }
    for (let i = 0; i < 16; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(90); }
    await page.waitForTimeout(1200);
    const conRueda = await page.evaluate(() => ({ ...window.__citas }));
    await page.evaluate(() => { document.getElementById('cita-despues').scrollIntoView({ block: 'center' }); return 0; });
    await page.waitForTimeout(800);
    for (let i = 0; i < 4; i++) { await page.click('#cita-despues'); await page.waitForTimeout(150); }
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => ({
      ...window.__citas,
      activa: (() => { const a = document.querySelector('.cita.activa'); const s = getComputedStyle(a); return s.visibility === 'visible' && +s.opacity > 0.99; })()
    }));
    comprobar(conRueda.max === 1 && r.max === 1 && r.activa,
      'opiniones ' + vp.width + '×' + vp.height + ': nunca dos citas encima (al hacer scroll ni con las flechas seguidas) y la que queda se ve entera → ' + J({ conRueda, flechas: r }));
    await contexto.close();
  }

  /* ───── 2. las dos densidades ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador);
    await page.goto(base + '/index.html?revision', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('mando')).visibility === 'hidden'), 'mando: se aparta mientras el aviso de cookies está en pantalla');
    await page.click('#cookies-aceptar');
    await page.waitForTimeout(500);
    comprobar(await page.evaluate(() => !document.getElementById('mando').hidden && getComputedStyle(document.getElementById('mando')).visibility !== 'hidden'), 'mando: aparece con ?revision al cerrar las cookies');
    await page.click('[data-densidad="sobria"]');
    await page.waitForTimeout(1200);
    const s = await page.evaluate(() => {
      const tops = [...document.querySelectorAll('.pila__item')].slice(0, 3).map(li => Math.round(li.getBoundingClientRect().top));
      return {
        clase: document.documentElement.className.includes('densidad-sobria'),
        triptico: getComputedStyle(document.getElementById('triptico')).display,
        pinHero: !!document.querySelector('.pin-spacer #inicio'),
        pins: document.querySelectorAll('.pin-spacer').length,
        modulos: [...document.querySelectorAll('[data-modulo]')].map(m => getComputedStyle(m).display),
        pilaEnRejilla: getComputedStyle(document.querySelector('.pila__item')).position === 'static' && new Set(tops).size === 1,
        separadores: [...document.querySelectorAll('.separador i')].filter(i => i.getClientRects().length).every(i => new DOMMatrix(getComputedStyle(i).transform).d > 0.99),
        citas: [...document.querySelectorAll('.cita')].map(c => getComputedStyle(c).opacity),
        logo: getComputedStyle(document.querySelector('.logo__placas')).opacity,
        desborda: document.documentElement.scrollWidth - innerWidth,
        pulsado: document.querySelector('[data-densidad="sobria"]').getAttribute('aria-pressed')
      };
    });
    comprobar(s.clase && s.pulsado === 'true', 'sobria: cambia la clase del <html> y el botón queda pulsado');
    comprobar(s.triptico === 'none' && !s.pinHero && s.logo === '1', 'sobria: el hero sin scrub, con el logo y el titular → ' + J({ triptico: s.triptico, pinHero: s.pinHero }));
    comprobar(s.modulos.length === 4 && s.modulos.every(d => d === 'none') && s.pins === 0, 'sobria: los cuatro módulos fuera y ningún pin → ' + J(s.modulos));
    comprobar(s.pilaEnRejilla, 'sobria: servicios en rejilla de tres columnas en vez de pila');
    comprobar(s.separadores, 'sobria: separadores quietos');
    comprobar(s.citas.every(o => o === '1'), 'sobria: añade algo que la de Placas no tiene: las opiniones, todas a la vez');
    comprobar(s.desborda <= 1, 'sobria: sin desbordamiento horizontal');
    if (conCapturas) {
      await page.evaluate(() => { window.scrollTo(0, 0); return 0; });
      await page.waitForTimeout(700);
      await page.screenshot({ style: SIN_AVISO, path: foto('20-sobria-hero.png') });
      await page.mouse.move(720, 450);
      await hasta(page, '#servicios');
      await page.screenshot({ style: SIN_AVISO, path: foto('21-sobria-servicios.png') });
      await hasta(page, '#opiniones');
      await page.screenshot({ style: SIN_AVISO, path: foto('22-sobria-opiniones.png') });
    }
    await page.reload({ waitUntil: 'domcontentloaded' });
    comprobar((await page.evaluate(() => document.documentElement.className)).includes('densidad-sobria'), 'la densidad elegida se aplica sin parpadeo al recargar');
    await page.waitForTimeout(4200);
    await page.click('[data-densidad="placas"]');
    await page.waitForTimeout(1200);
    const vuelta = await page.evaluate(() => ({ pin: !!document.querySelector('.pin-spacer #inicio'), modulos: [...document.querySelectorAll('[data-modulo]')].every(m => getComputedStyle(m).display !== 'none'), herenciaPin: !!document.querySelector('.pin-spacer #herencias') }));
    comprobar(vuelta.pin && vuelta.modulos && vuelta.herenciaPin, 'se vuelve a Placas: hero y herencia anclados y los módulos de vuelta → ' + J(vuelta));
    comprobar(errores.length === 0, 'densidades: consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    await contexto.close();
  }
  {
    const { contexto, page } = await nuevaPagina(navegador);
    await contexto.addInitScript(() => { try { localStorage.setItem('fpr-densidad', 'sobria'); } catch (e) {} });
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    comprobar((await page.evaluate(() => document.documentElement.className)).includes('densidad-placas'), 'sin ?revision una densidad guardada no se aplica');
    await contexto.close();
  }

  /* ───── 2b. la receta de borrado del mando, aplicada de verdad a una copia ───── */
  {
    const copia = fs.mkdtempSync(path.join(os.tmpdir(), 'fpr-receta-'));
    fs.cpSync(raiz, copia, { recursive: true, filter: s => !/[\\/](screenshots|node_modules|\.git)([\\/]|$)/.test(s) });
    aplicarReceta(copia);
    const quedan = rastros(copia).filter(r => r.queda);
    comprobar(quedan.length === 0, 'receta del README: tras aplicarla no queda rastro del mando (comprobar-borrado.mjs)' + (quedan.length ? ' → ' + quedan.map(q => q.archivo + ': ' + q.que).join(' | ') : ''));
    const srv = await servir(copia, 4198);
    const { contexto, page, errores } = await nuevaPagina(navegador, { sinCookies: true });
    await page.goto('http://127.0.0.1:4198' + PREFIJO + '/index.html?revision', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    const r = await page.evaluate(() => ({ mando: !!document.getElementById('mando'), pin: !!document.querySelector('.pin-spacer #inicio'), cortina: getComputedStyle(document.getElementById('cortina')).display }));
    comprobar(!r.mando && r.pin && r.cortina === 'none' && errores.length === 0, 'receta del README: la web sin mando funciona igual (sin errores, hero anclado) → ' + J(r) + (errores.length ? ' ' + errores.join(' | ') : ''));
    await contexto.close();
    srv.close();
    fs.rmSync(copia, { recursive: true, force: true });
  }

  /* ───── 3. quitar cada módulo (y los cuatro a la vez) no rompe nada ───── */
  const htmlOriginal = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8');
  const quitar = (html, mod) => html.replace(new RegExp('\\n\\s*<!-- ═+ MÓDULO «' + mod + '»[^>]*-->\\s*\\n\\s*<section[^>]*data-modulo="' + mod + '"[\\s\\S]*?</section>'), '');
  for (const grupo of [['carta'], ['factura'], ['herencias'], ['glosario'], ['carta', 'factura', 'herencias', 'glosario']]) {
    let html = htmlOriginal;
    grupo.forEach(m => { html = quitar(html, m); });
    const quitados = grupo.every(m => !html.includes('data-modulo="' + m + '"'));
    const { contexto, page, errores } = await nuevaPagina(navegador, { sinCookies: true });
    await page.route('**' + PREFIJO + '/index.html', r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }));
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    await page.mouse.move(720, 450);
    await alFinal(page);
    const r = await page.evaluate(() => {
      const todos = window.ScrollTrigger.getAll();
      const huerfanos = todos.filter(st => !document.contains(st.trigger) || (st.pin && !document.contains(st.pin)));
      const espaciadores = [...document.querySelectorAll('.pin-spacer')];
      return {
        triggers: todos.length, huerfanos: huerfanos.length,
        espaciadoresVacios: espaciadores.filter(e => !e.firstElementChild).length,
        espaciadores: espaciadores.length, pinsVivos: todos.filter(st => st.pin).length,
        pie: document.getElementById('pie').getBoundingClientRect().top < innerHeight,
        desborda: document.documentElement.scrollWidth - innerWidth,
        hero: !!document.querySelector('.pin-spacer #inicio')
      };
    });
    comprobar(quitados && errores.length === 0 && r.huerfanos === 0 && r.espaciadoresVacios === 0 && r.espaciadores === r.pinsVivos && r.pie && r.desborda <= 1 && r.hero,
      'sin el módulo ' + grupo.join(' + ') + ': sin errores ni pins huérfanos, se llega al pie → ' + J(r) + (errores.length ? ' ' + errores.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 4. móvil 390×844 (táctil) ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador, { viewport: { width: 390, height: 844 }, tactil: true });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    const m0 = await page.evaluate(() => ({
      cursor: !!document.querySelector('.cursor') && getComputedStyle(document.querySelector('.cursor')).display !== 'none',
      tarjetas: document.getElementById('inicio').classList.contains('hero--tarjetas'),
      desborda: document.documentElement.scrollWidth - innerWidth
    }));
    comprobar(!m0.cursor && m0.tarjetas && m0.desborda <= 1, 'móvil: sin cursor propio en táctil, placas como tarjetas, sin scroll horizontal → ' + J(m0));
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('30-movil-hero.png') });
    await page.click('#cookies-aceptar');
    await page.click('#hamburguesa');
    await page.waitForTimeout(800);
    comprobar(await page.evaluate(() => document.getElementById('hamburguesa').getAttribute('aria-expanded')) === 'true', 'móvil: el menú abre');
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('31-movil-menu.png') });
    await page.click('#hamburguesa');
    await page.waitForTimeout(800);
    comprobar(await page.evaluate(() => document.getElementById('hamburguesa').getAttribute('aria-expanded')) === 'false', 'móvil: el mismo botón cierra el menú');
    /* las tarjetas giran de una en una al entrar */
    await page.evaluate(() => { document.querySelector('#triptico .placa:nth-child(2)').scrollIntoView({ block: 'end' }); return 0; });
    await page.waitForTimeout(900);
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('32-movil-placas-girando.png') });
    await page.evaluate(() => { document.querySelector('#triptico .placa:nth-child(3)').scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); return 0; });
    await page.waitForTimeout(1200);
    const tj = await placasHero(page);
    if (conCapturas) {
      /* las tres ya giradas, de un vistazo */
      await page.evaluate(() => { const t = document.getElementById('triptico'); window.scrollTo(0, t.getBoundingClientRect().top + scrollY - 80); return 0; });
      await page.waitForTimeout(900);
      await page.screenshot({ style: SIN_AVISO, path: foto('33-movil-placas-giradas.png') });
    }
    comprobar(tj.every(p => p.m11 <= -0.98 && p.fraseCabe), 'móvil: las tres placas giran de una en una y terminan legibles → ' + J(tj.map(p => [p.m11, p.fraseCabe])));
    /* con la cabecera ya fija, el menú (dentro de una cabecera con blur) */
    await page.evaluate(() => { window.scrollTo(0, 2600); return 0; });
    await page.waitForTimeout(700);
    const cerrado = await page.evaluate(() => { const n = document.getElementById('menu').getBoundingClientRect(); return { fija: document.getElementById('cabecera').classList.contains('cabecera--fija'), bottom: Math.round(n.bottom), alto: Math.round(n.height), vis: getComputedStyle(document.getElementById('menu')).visibility }; });
    comprobar(cerrado.fija && (cerrado.bottom <= 1 || cerrado.vis === 'hidden') && cerrado.alto >= 800, 'móvil: con la cabecera fija el menú cerrado no asoma → ' + J(cerrado));
    await page.click('#hamburguesa');
    await page.waitForTimeout(900);
    const abierto = await page.evaluate(() => { const r = document.getElementById('menu').getBoundingClientRect(); return { alto: Math.round(r.height), top: Math.round(r.top), filtro: getComputedStyle(document.getElementById('menu')).backdropFilter }; });
    comprobar(abierto.alto >= 800 && abierto.top === 0 && /blur/.test(abierto.filtro), 'móvil: con la cabecera fija el menú abierto ocupa 100dvh, con desenfoque → ' + J(abierto));
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('31b-movil-menu-fija.png') });
    await page.click('#hamburguesa');
    await page.waitForTimeout(700);
    if (conCapturas) {
      for (const [sel, n] of [['#servicios', '34-movil-servicios'], ['#factura', '35-movil-factura'], ['#herencias', '36-movil-herencia'], ['#glosario', '37-movil-glosario'], ['#donde', '38-movil-donde']]) {
        await page.evaluate(s => { document.querySelector(s).scrollIntoView(); return 0; }, sel);
        await page.waitForTimeout(1600);
        await page.screenshot({ style: SIN_AVISO, path: foto(n + '.png') });
      }
    }
    /* la lupa se arrastra con el dedo */
    await page.evaluate(() => { document.getElementById('lectura').scrollIntoView({ block: 'center' }); return 0; });
    await page.waitForTimeout(900);
    const antesLupa = await page.evaluate(() => document.getElementById('lupa-texto').textContent);
    const lb = await page.locator('#lupa').boundingBox();
    /* el primer renglón del término: si se parte en dos, el centro de su caja cae entre líneas */
    const t5 = await page.evaluate(() => { const q = document.querySelectorAll('.denso b[data-claro]')[4].getClientRects()[0]; return { x: q.left, y: q.top, width: q.width, height: q.height }; });
    const cdp = await contexto.newCDPSession(page);
    const toque = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    await toque('touchStart', lb.x + lb.width / 2, lb.y + lb.height / 2);
    for (let i = 1; i <= 8; i++) await toque('touchMove', lb.x + lb.width / 2 + (t5.x + t5.width / 2 - lb.x - lb.width / 2) * i / 8, lb.y + lb.height / 2 + (t5.y + t5.height / 2 - lb.y - lb.height / 2) * i / 8);
    await toque('touchEnd');
    await page.waitForTimeout(1500);
    const despuesLupa = await page.evaluate(() => document.getElementById('lupa-texto').textContent);
    comprobar(despuesLupa === 'Darse de alta como autónomo' && despuesLupa !== antesLupa, 'móvil: la lupa se arrastra con el dedo y traduce el término (' + antesLupa + ' → ' + despuesLupa + ')');
    comprobar(errores.length === 0, 'móvil: consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 4b. cuatro tamaños de móvil: nada se pisa ───── */
  for (const vp of [{ width: 360, height: 640 }, { width: 375, height: 667 }, { width: 390, height: 844 }, { width: 768, height: 1024 }]) {
    const { contexto, page } = await nuevaPagina(navegador, { viewport: vp, tactil: true, sinCookies: true });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    const r = await page.evaluate(() => {
      const caja = e => { const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; };
      const texto = caja(document.querySelector('.hero__texto'));
      const logo = caja(document.querySelector('.hero__logo'));
      const hijos = [...document.querySelectorAll('.hero__texto > *, .hero__acciones > *')].map(caja);
      const fuera = [...document.querySelectorAll('.hero__texto *, .hero__logo, .triptico .placa, .cabecera > *')].filter(e => e.getClientRects().length && !e.closest('.triptico .placa__giro')).map(caja).filter(c => c[0] < -1 || c[2] > innerWidth + 1).length;
      const cab = document.getElementById('cabecera').getBoundingClientRect().bottom;
      return { texto, logo, arriba: texto[3] <= logo[1] + 1, bajoCabecera: texto[1] >= cab - 1, fuera, desborda: document.documentElement.scrollWidth - innerWidth, hijos: hijos.length };
    });
    comprobar(r.arriba && r.bajoCabecera && r.fuera === 0 && r.desborda <= 1, 'hero ' + vp.width + '×' + vp.height + ': texto arriba y logo debajo, bajo la cabecera, nada se sale, sin scroll horizontal → ' + J(r));
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('3b-hero-' + vp.width + 'x' + vp.height + '.png') });
    await page.evaluate(() => { document.querySelector('#triptico .placa:nth-child(3)').scrollIntoView({ block: 'start' }); window.scrollBy(0, -60); return 0; });
    await page.waitForTimeout(1300);
    const tj = await placasHero(page);
    comprobar(tj.every(p => p.m11 <= -0.98 && p.fraseCabe && p.x >= 0 && p.x + p.w <= vp.width), 'placas ' + vp.width + '×' + vp.height + ': giradas, legibles y dentro de la pantalla');
    await contexto.close();
  }

  /* ───── 4c. móvil: el reparto de la herencia se ve entero y los separadores van juntos ─────
     El usuario vio el árbol cortado bajo la cabecera con las placas a medio camino: el scrub
     corría cuando el árbol ya se había ido por arriba. Ahora el árbol es sticky en móvil. */
  for (const vp of [{ width: 390, height: 844 }, { width: 360, height: 640 }]) {
    const { contexto, page, errores } = await nuevaPagina(navegador, { viewport: vp, tactil: true, sinCookies: true });
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(4000);
    const sep = await page.evaluate(() => {
      const barras = [...document.querySelector('#servicios .separador').querySelectorAll('i')].map(i => i.getBoundingClientRect());
      return { ancho: Math.round(barras[2].right - barras[0].left), gruesas: barras.every(b => b.width >= 3) };
    });
    comprobar(sep.ancho <= 30 && sep.gruesas, 'separador ' + vp.width + '×' + vp.height + ': en móvil las tres barras van juntas, como las placas del logo → ' + J(sep));
    await page.evaluate(() => { const s = document.getElementById('herencias'); window.scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight); return 0; });
    await page.waitForTimeout(800);
    const filas = [];
    for (let i = 0; i < 80; i++) {
      await page.mouse.wheel(0, 70);
      await page.waitForTimeout(110);
      const r = await page.evaluate(() => {
        const a = document.getElementById('arbol').getBoundingClientRect();
        const cab = document.getElementById('cabecera').getBoundingClientRect().bottom;
        return { p: +document.getElementById('herencias').dataset.progreso, entero: a.top >= cab - 1 && a.bottom <= innerHeight + 1, pasos: document.querySelectorAll('#pasos li.on').length };
      });
      filas.push(r);
      if (r.p >= 1 && filas.filter(f => f.p >= 1).length > 3) break;
    }
    const enMarcha = filas.filter(f => f.p > 0.02 && f.p < 0.98);
    const fin = filas[filas.length - 1];
    comprobar(enMarcha.length >= 10 && enMarcha.every(f => f.entero) && fin.p === 1 && fin.pasos === 5,
      'herencia ' + vp.width + '×' + vp.height + ': mientras las placas bajan, el árbol se ve entero bajo la cabecera, y termina con los cinco pasos → ' + J({ fotogramas: enMarcha.length, cortados: enMarcha.filter(f => !f.entero).length, fin }));
    if (conCapturas && vp.width === 390) {
      await page.evaluate(() => { const s = document.getElementById('herencias'); window.scrollTo(0, s.getBoundingClientRect().top + scrollY - innerHeight * 0.1); return 0; });
      await page.waitForTimeout(1200);
      await page.screenshot({ style: SIN_AVISO, path: foto('36-movil-herencia.png') });
    }
    comprobar(errores.length === 0, 'móvil ' + vp.width + ': consola sin errores en la herencia' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 5. sin GSAP (CDN caído) ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador);
    await page.route('**/cdn.jsdelivr.net/**', r => r.abort());
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const e = await page.evaluate(() => ({
      cortina: getComputedStyle(document.getElementById('cortina')).display,
      clases: document.documentElement.className,
      placas: [...document.querySelectorAll('#triptico .placa__dorso')].map(d => getComputedStyle(d).display !== 'none' && d.getBoundingClientRect().height > 50),
      apagados: [...document.querySelectorAll('h1, h2, h3, p, li, .placa, .placa-servicio, .logo__placa, .logo__letra')].filter(n => {
        const s = getComputedStyle(n); return parseFloat(s.opacity) < 0.15 && n.getClientRects().length && !n.closest('.cortina') && s.visibility !== 'hidden';
      }).map(n => n.className.baseVal ?? n.className ?? n.tagName)
    }));
    comprobar(e.cortina === 'none' && !e.clases.includes('con-movimiento') && e.clases.includes('sin-gsap'), 'sin GSAP: la cortina se retira y no se activa con-movimiento → ' + J({ cortina: e.cortina, clases: e.clases }));
    comprobar(e.placas.every(Boolean) && e.apagados.length === 0, 'sin GSAP: las placas del hero se leen (dorso) y nada queda apagado' + (e.apagados.length ? ' → ' + e.apagados.join(',') : ''));
    const fin = await page.evaluate(() => ({ factura: +document.getElementById('factura-barra').dataset.progreso, herencia: +document.getElementById('herencias').dataset.progreso, pasos: [...document.querySelectorAll('#pasos li')].map(l => getComputedStyle(l).opacity), estado: document.getElementById('horario-estado').dataset.estado, moviles: document.querySelectorAll('.datos__moviles a').length }));
    comprobar(fin.factura === 1 && fin.herencia === 1 && fin.pasos.every(o => o === '1') && /abierto|cerrado/.test(fin.estado) && fin.moviles === 3, 'sin GSAP: factura separada, herencia en su final, horario calculado → ' + J(fin));
    await page.evaluate(() => { document.getElementById('lectura').scrollIntoView({ block: 'center' }); return 0; });
    await page.waitForTimeout(400);
    const t = await page.locator('.denso b[data-claro]').nth(1).boundingBox();
    await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 4 });
    await page.waitForTimeout(300);
    comprobar(await page.evaluate(() => document.getElementById('lupa-texto').textContent) === 'Un adelanto de su renta, cada trimestre', 'sin GSAP: la lupa sigue traduciendo');
    await page.evaluate(() => { document.getElementById('opiniones').scrollIntoView(); return 0; });
    await page.click('#cita-despues');
    comprobar(await page.evaluate(() => document.querySelector('.cita.activa figcaption').textContent) === 'Carmen · reseña en Google', 'sin GSAP: las flechas de las opiniones funcionan');
    if (conCapturas) { await page.evaluate(() => { window.scrollTo(0, 0); return 0; }); await page.waitForTimeout(300); await page.screenshot({ style: SIN_AVISO, path: foto('40-sin-gsap.png') }); }
    const propios = errores.filter(x => !/Failed to load resource|ERR_FAILED/.test(x));
    comprobar(propios.length === 0, 'sin GSAP: consola sin errores propios' + (propios.length ? ' → ' + propios.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 6. movimiento reducido ───── */
  {
    const { contexto, page, errores } = await nuevaPagina(navegador, { reducedMotion: 'reduce' });
    await page.goto(base + '/index.html', { waitUntil: 'domcontentloaded' });
    const temprano = await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display);
    await page.waitForTimeout(2000);
    comprobar(temprano === 'none', 'movimiento reducido: la cortina no aparece ni un fotograma');
    const r = await page.evaluate(() => ({
      clase: document.documentElement.className,
      marq: [...document.querySelectorAll('.marquesina__carril')].map(c => getComputedStyle(c).transform),
      factura: +document.getElementById('factura-barra').dataset.progreso,
      herencia: +document.getElementById('herencias').dataset.progreso,
      pasos: document.querySelectorAll('#pasos li.on').length,
      pin: document.querySelectorAll('.pin-spacer').length,
      estado: document.getElementById('estado-hero').dataset.estado
    }));
    comprobar(!r.clase.includes('con-movimiento') && r.marq.every(t => t === 'none') && r.pin === 0, 'movimiento reducido: sin con-movimiento, marquesina quieta, sin anclajes');
    comprobar(r.factura === 1 && r.herencia === 1 && r.pasos === 5 && /abierto|cerrado/.test(r.estado), 'movimiento reducido: el estado final quieto (factura, herencia con los cinco pasos) y el estado en vivo → ' + J(r));
    await page.evaluate(() => { document.getElementById('lectura').scrollIntoView({ block: 'center' }); return 0; });
    await page.waitForTimeout(300);
    const t = await page.locator('.denso b[data-claro]').nth(3).boundingBox();
    await page.mouse.move(t.x + t.width / 2, t.y + t.height / 2, { steps: 4 });
    await page.waitForTimeout(300);
    comprobar(await page.evaluate(() => document.getElementById('lupa-texto').textContent) === 'Decir que sí a lo que le han dejado y repartirlo', 'movimiento reducido: la lupa funciona (contenido, no movimiento)');
    await page.evaluate(() => { document.getElementById('servicios').scrollIntoView(); window.scrollBy(0, 1200); return 0; });
    await page.waitForTimeout(400);
    comprobar(await page.evaluate(() => document.querySelectorAll('#indice li.activo').length) >= 2, 'movimiento reducido: el índice de la pila sigue a las placas');
    if (conCapturas) { await page.evaluate(() => { window.scrollTo(0, 0); return 0; }); await page.waitForTimeout(300); await page.screenshot({ style: SIN_AVISO, path: foto('41-movimiento-reducido.png') }); }
    comprobar(errores.length === 0, 'movimiento reducido: consola sin errores' + (errores.length ? ' → ' + errores.join(' | ') : ''));
    await contexto.close();
  }

  /* ───── 7. los móviles se apagan con una línea ───── */
  {
    const { contexto, page } = await nuevaPagina(navegador, { sinCookies: true });
    const js = fs.readFileSync(path.join(raiz, 'js/main.js'), 'utf8').replace('var MOVILES_PUBLICABLES = true;', 'var MOVILES_PUBLICABLES = false;');
    await page.route('**/js/main.js*', r => r.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: js }));
    await page.goto(base + '/index.html', { waitUntil: 'networkidle' });
    const r = await page.evaluate(() => ({ enlaces: document.querySelectorAll('[data-moviles] a').length, texto: /678|686|667/.test(document.body.textContent), fijo: !!document.querySelector('a[href="tel:+34924910478"]') }));
    comprobar(r.enlaces === 0 && !r.texto && r.fijo, 'con MOVILES_PUBLICABLES = false no queda ningún móvil y el fijo sigue → ' + J(r));
    await contexto.close();
  }

  /* ───── 8. 404 bajo el prefijo del repo ───── */
  {
    const { contexto, page, caidas } = await nuevaPagina(navegador);
    const resp = await page.goto(base + '/no-existe/ni-esto.html', { waitUntil: 'networkidle' });
    const titulo = await page.textContent('h1').catch(() => '');
    comprobar(resp.status() === 404 && /placa/i.test(titulo || ''), '404 propio con el lenguaje del sitio → "' + titulo + '"');
    const propias = caidas.filter(c => !c.includes('/no-existe/'));
    comprobar(propias.length === 0, '404: sin recursos rotos a otra profundidad' + (propias.length ? ' → ' + propias.join(' | ') : ''));
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('50-404.png') });
    await contexto.close();
  }

  /* ───── 9. páginas legales ───── */
  for (const p of ['aviso-legal.html', 'privacidad.html']) {
    const { contexto, page, errores, caidas } = await nuevaPagina(navegador, { viewport: { width: 390, height: 844 } });
    await page.goto(base + '/' + p, { waitUntil: 'networkidle' });
    comprobar(errores.length === 0 && caidas.length === 0, p + ': sin errores ni recursos rotos' + (caidas.length ? ' → ' + caidas.join(' | ') : ''));
    const texto = await page.evaluate(() => document.body.textContent);
    comprobar(/\[PENDIENTE: NIF\]/.test(texto) && /\[PENDIENTE: razón social\]/.test(texto) && /fpr@fprasesores\.es/.test(texto), p + ': razón social y NIF como [PENDIENTE] y el email real');
    if (p === 'aviso-legal.html') comprobar(/\[PENDIENTE: titular\]/.test(texto), p + ': el titular como [PENDIENTE]');
    if (conCapturas) await page.screenshot({ style: SIN_AVISO, path: foto('60-' + p.replace('.html', '') + '.png') });
    await contexto.close();
  }
} finally {
  await navegador.close();
  servidor.close();
}

console.log('\n' + notas.join('\n'));
if (fallos.length) {
  console.log('\n──────── FALLOS ────────\n' + fallos.join('\n'));
  process.exitCode = 1;
} else {
  console.log('\nTodo en orden: ' + notas.length + ' comprobaciones.');
}
