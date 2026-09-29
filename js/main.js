/* ═══════════════════════════════════════════════════════════════════════════
   FPR Asesores Consultores · «Tres placas»
   Tres placas verde rótulo tapan la pantalla y se recogen hacia arriba; en el
   hero el logo ya está en su sitio y el doble círculo se dibuja. Al bajar,
   las tres placas del logo crecen, se separan hasta ser tres columnas y giran
   para enseñar lo que se hace en cada área. El resto de la web repite el
   ritmo de tres: rejilla, separadores, progreso de la cabecera y cursor.

   Banderas separadas a propósito:
     gsapReady  → hay motor de animación (GSAP + ScrollTrigger cargados)
     movimiento → además el usuario NO ha pedido reducir el movimiento
   Con movimiento reducido el CONTENIDO sigue funcionando (estado en vivo, la
   lupa, el índice de la pila, las opiniones); lo que se apaga es el viaje.

   Los módulos (data-modulo) se pueden borrar del HTML: cada bloque comprueba
   que sus piezas existen y que se ven antes de crear ScrollTriggers.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Los tres móviles del cartel de Instagram. Sin atribuirlos a nadie y
     pendientes de que digan si se publican: para quitarlos, false. */
  var MOVILES_PUBLICABLES = true;
  var MOVILES = ['678 73 34 22', '686 30 90 01', '667 01 93 32'];

  var html = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var esTactil = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var gsapReady = !!(window.gsap && window.ScrollTrigger);
  var movimiento = gsapReady && !reduce;
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;

  if (gsapReady) {
    gsap.registerPlugin(ST);
    gsap.ticker.lagSmoothing(80, 33);   /* un atasco en la carga en frío no se salta la cortina */
  }
  html.classList.add(movimiento ? 'con-movimiento' : 'sin-movimiento');
  if (!gsapReady) html.classList.add('sin-gsap');

  function $(s, raiz) { return (raiz || document).querySelector(s); }
  function $$(s, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(s)); }
  function esMovil() { return window.matchMedia('(max-width: 900px)').matches; }
  function sobria() { return html.classList.contains('densidad-sobria'); }
  function seVe(el) { return !!el && document.contains(el) && el.getClientRects().length > 0; }
  function alturaCabecera() { return parseFloat(getComputedStyle(html).getPropertyValue('--cab')) || 76; }
  function tope() { return alturaCabecera() + window.innerHeight * 0.03; }
  function acotar(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function cuandoVisible(nodos, umbral, alEntrar) {
    nodos = nodos.filter(Boolean);
    if (!nodos.length) return;
    if (!('IntersectionObserver' in window)) { nodos.forEach(alEntrar); return; }
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        obs.unobserve(en.target);
        alEntrar(en.target);
      });
    }, { threshold: umbral });
    nodos.forEach(function (n) { obs.observe(n); });
  }

  /* Cada sección registra su montar(); remontar() los llama en orden de
     documento (los pins se crean de arriba abajo) y refresca ScrollTrigger. */
  var montajes = [];
  function registrar(fn) { montajes.push(fn); fn(); }
  function remontar() {
    montajes.forEach(function (fn) { fn(); });
    if (ST) ST.refresh();
  }

  /* ───────────────────────── Lenis ───────────────────────── */
  var lenis = null;
  if (movimiento && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.12, wheelMultiplier: 1, smoothWheel: true });
    lenis.on('scroll', ST.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  }

  function irA(destino) {
    var desfase = -alturaCabecera() + 1;
    if (destino === '#inicio') {             /* el hero está anclado: su rect no dice dónde empieza */
      if (lenis) lenis.scrollTo(0, { duration: 1.4 }); else window.scrollTo(0, 0);
      return;
    }
    if (lenis) { lenis.scrollTo(destino, { offset: desfase, duration: 1.6 }); return; }
    var el = document.querySelector(destino);
    if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.pageYOffset + desfase);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id === '#' || !document.querySelector(id)) return;
    e.preventDefault();
    cerrarMenu();
    irA(id);
  });

  /* ───────────────────── titulares partidos ───────────────────── */
  function partir(el) {
    var modo = el.dataset.revelar;
    var texto = el.textContent.replace(/\s+/g, ' ').trim();
    el.setAttribute('aria-label', texto);
    var nodos = Array.prototype.slice.call(el.childNodes);
    el.textContent = '';
    var piezas = [];
    function partirTexto(trozo, destino) {
      trozo.split(/([ \t\n\r]+)/).forEach(function (palabra) {   /* el espacio duro (&nbsp;) no parte: «en Badajoz» va junto */
        if (!palabra) return;
        if (/^[ \t\n\r]+$/.test(palabra)) { destino.appendChild(document.createTextNode(' ')); return; }
        var caja = document.createElement('span');
        caja.className = 'palabra';
        caja.setAttribute('aria-hidden', 'true');
        if (modo === 'letras') {
          palabra.split('').forEach(function (c) {
            var s = document.createElement('span');
            s.className = 'letra';
            s.textContent = c;
            caja.appendChild(s);
            piezas.push(s);
          });
        } else {
          var s = document.createElement('span');
          s.className = 'palabra-int';
          s.textContent = palabra;
          caja.appendChild(s);
          piezas.push(s);
        }
        destino.appendChild(caja);
      });
    }
    nodos.forEach(function (n) {
      if (n.nodeType === 3) { partirTexto(n.textContent, el); return; }
      var envoltorio = n.cloneNode(false);
      partirTexto(n.textContent, envoltorio);
      el.appendChild(envoltorio);
    });
    return piezas;
  }
  function revelar(el, piezas, retardo) {
    /* y:0 explícito: GSAP lee el translate3d del CSS como píxeles, no como yPercent */
    gsap.to(piezas, {
      y: 0, yPercent: 0, duration: 1.1, ease: 'expo.out', delay: retardo || 0,
      stagger: el.dataset.revelar === 'letras' ? 0.022 : 0.06
    });
  }
  $$('[data-revelar]').forEach(function (el) {
    var piezas = partir(el);
    if (!movimiento) return;
    if (el.closest('.hero')) {
      document.addEventListener('cortina-abriendose', function () { revelar(el, piezas, 0.35); }, { once: true });
      return;
    }
    cuandoVisible([el], 0.3, function () { revelar(el, piezas); });
  });

  /* ───────────────── cortina: tres placas que se recogen hacia arriba ───────────────── */
  (function cortina() {
    var cort = document.getElementById('cortina');
    if (!cort) return;
    var hecho = false, abierta = false, tl = null;

    function abriendose() {
      if (abierta) return;
      abierta = true;
      document.dispatchEvent(new CustomEvent('cortina-abriendose'));
    }
    function retirar() {
      if (hecho) return;
      hecho = true;
      abriendose();
      cort.classList.add('oculta');
      if (lenis) lenis.start();
      if (ST) ST.refresh();
      document.dispatchEvent(new CustomEvent('cortina-retirada'));
    }

    if (!movimiento) {
      /* sin GSAP o con movimiento reducido se retira igual: nunca tapa la página */
      setTimeout(retirar, 60);
      return;
    }
    if (lenis) lenis.stop();

    var placas = $$('.cortina__placa', cort);
    var letras = $$('.cortina__letra', cort);
    var mascaras = $$('.cortina__mascara', cort);
    var leyenda = document.getElementById('cortina-leyenda');

    /* el CSS ya las tiene escondidas (translateY 112 %); GSAP leería eso como píxeles en y:
       se fija y:0 y el desplazamiento en yPercent, que es lo que anima */
    gsap.set(letras, { y: 0, yPercent: 112 });
    tl = gsap.timeline({ onComplete: retirar, delay: 0.1 });
    tl.to(letras, { yPercent: 0, duration: 0.95, ease: 'expo.out', stagger: 0.09 }, 0.1)
      .fromTo(leyenda, { opacity: 0, letterSpacing: '0.9em' }, { opacity: 1, letterSpacing: '0.5em', duration: 1, ease: 'expo.out', immediateRender: false }, 0.45)
      .to(leyenda, { opacity: 0, duration: 0.35, ease: 'power2.in' }, 1.45)
      .add(abriendose, 1.55)
      /* se recogen hacia arriba, escalonadas: ~90 ms entre placas */
      .to(placas, { yPercent: -101, duration: 1.05, ease: 'expo.inOut', stagger: 0.09 }, 1.55)
      .to(mascaras, { yPercent: -45, duration: 1.05, ease: 'expo.inOut', stagger: 0.09 }, 1.55);   /* paralaje: la letra entera sube más que su placa */

    /* al primer gesto no se hace esperar a nadie: acelera lo que queda */
    function prisa() { if (tl && !hecho) tl.timeScale(4); }
    ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(function (ev) {
      window.addEventListener(ev, prisa, { once: true, passive: true });
    });
    /* red de seguridad: pase lo que pase, a los 6 s la cortina se va */
    setTimeout(retirar, 6000);
    window.__fprCortina = { get tl() { return tl; } };
  })();

  /* ───────────────── hero: el logo se dibuja; al bajar, las placas crecen y giran ───────────────── */
  (function hero() {
    var seccion = document.getElementById('inicio');
    var svg = document.getElementById('logo-hero');
    if (!seccion || !svg) return;
    var texto = $('.hero__texto', seccion);
    var anillos = $('.logo__anillos', svg);
    var leyendaG = $('.logo__leyenda-g', svg);
    var leyenda = $('.logo__leyenda', svg);
    var grupoPlacas = $('.logo__placas', svg);
    var rects = $$('.logo__placa', svg);
    var letrasLogo = $$('.logo__letra', svg);
    var trazas = $$('.logo__traza', svg);
    var triptico = document.getElementById('triptico');
    var placas = $$('.placa', triptico);
    var giros = placas.map(function (p) { return $('.placa__giro', p); });
    var rotulos = placas.map(function (p) { return $('.placa__rotulo', p); });
    var letrasPlaca = placas.map(function (p) { return $('.placa__letra', p); });
    var pie = $('.triptico__pie', triptico);
    var pista = $('.hero__pista', seccion);
    var st = null, tl = null, tarjetas = [];

    /* ── la entrada, tras la cortina: el doble círculo se dibuja con dos
       trazos de pincel que corren en sentidos opuestos (una máscara que
       avanza sobre el anillo relleno), las placas suben desde la base
       escalonadas y las letras aparecen al final ── */
    if (movimiento) {
      var largos = trazas.map(function (t) { return t.getTotalLength(); });
      trazas.forEach(function (t, i) { t.style.strokeDasharray = largos[i]; t.style.strokeDashoffset = largos[i]; });
      gsap.set(rects, { scaleY: 0, transformOrigin: '50% 100%' });
      gsap.set(letrasLogo, { autoAlpha: 0, y: 10 });
      gsap.set(leyenda, { autoAlpha: 0 });
      var entrada = $$('.estado, .hero__sub, .hero__acciones', texto);
      gsap.set(entrada, { autoAlpha: 0, y: 22 });
      if (pista) gsap.set(pista, { autoAlpha: 0 });
      document.addEventListener('cortina-abriendose', function () {
        var t = gsap.timeline();
        trazas.forEach(function (tr, i) {
          /* autoRound:false: con valores pequeños GSAP redondea y el trazo «salta» */
          t.to(tr, { strokeDashoffset: 0, duration: 1.7, ease: 'power2.inOut', autoRound: false }, 0.15 + i * 0.12);
        });
        t.to(rects, { scaleY: 1, duration: 1.05, ease: 'expo.out', stagger: 0.12 }, 0.35)
          .to(letrasLogo, { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', stagger: 0.09 }, 1.2)
          .to(leyenda, { autoAlpha: 1, duration: 0.9, ease: 'power2.out' }, 1.45)
          .to(entrada, { autoAlpha: 1, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.1 }, 0.55);
        if (pista) t.to(pista, { autoAlpha: 1, duration: 0.8 }, 1.8);
      }, { once: true });
    }

    function limpiar() {
      if (st) { st.kill(); st = null; }
      if (tl) { tl.kill(); tl = null; }
      tarjetas.forEach(function (s) { s.kill(); });
      tarjetas = [];
      seccion.classList.remove('hero--escena', 'hero--tarjetas');
      if (gsapReady) {
        gsap.set(placas, { clearProps: 'left,top,width,height,opacity,visibility' });
        gsap.set(giros, { clearProps: 'transform' });
        gsap.set(rotulos.concat(letrasPlaca, [pie]), { clearProps: 'opacity,visibility,transform' });
        gsap.set([texto, anillos, leyendaG, grupoPlacas], { clearProps: 'opacity,visibility,transform' });
      }
    }

    /* dónde está cada placa dentro del logo, en coordenadas del hero (sin transform) */
    function huecos() {
      var hr = seccion.getBoundingClientRect();
      var sr = svg.getBoundingClientRect();
      var k = sr.width / 600;
      return rects.map(function (r) {
        var x = +r.getAttribute('x'), y = +r.getAttribute('y');
        return { left: sr.left - hr.left + x * k, top: sr.top - hr.top + y * k, width: 120 * k, height: 252 * k };
      });
    }
    /* las tres columnas que ocupan el ancho */
    function columnas() {
      var W = seccion.clientWidth, H = window.innerHeight;
      var m = parseFloat(getComputedStyle(seccion).paddingLeft) || 40;
      var g = parseFloat(getComputedStyle(triptico).columnGap) || parseFloat(getComputedStyle(html).getPropertyValue('--canal')) || 28;
      var arriba = alturaCabecera() + H * 0.035;
      var abajo = H - H * 0.035 - (pie ? pie.offsetHeight + H * 0.04 : 60);
      var ancho = (W - 2 * m - 2 * g) / 3;
      var alto = Math.min(abajo - arriba, ancho * 2.1);
      var top = arriba + (abajo - arriba - alto) / 2;
      return [0, 1, 2].map(function (i) { return { left: m + i * (ancho + g), top: top, width: ancho, height: alto }; });
    }

    function montar() {
      limpiar();
      if (!movimiento || sobria()) return;             /* quieto: tarjetas ya giradas (o fuera, en la sobria) */

      if (esMovil() || window.innerHeight < 560) {
        /* móvil: las placas apiladas giran de una en una al entrar */
        seccion.classList.add('hero--tarjetas');
        giros.forEach(function (g) {
          var tw = gsap.fromTo(g, { rotationY: 0 }, { rotationY: 180, ease: 'power2.inOut', paused: true, immediateRender: false });
          tarjetas.push(ST.create({ trigger: g, start: 'top 86%', end: 'top 42%', scrub: 0.5, animation: tw }));
        });
        return;
      }

      seccion.classList.add('hero--escena');
      var desde = huecos(), hasta = columnas();
      placas.forEach(function (p, i) { gsap.set(p, { left: desde[i].left, top: desde[i].top, width: desde[i].width, height: desde[i].height, autoAlpha: 0 }); });
      gsap.set(giros, { rotationY: 0 });
      gsap.set(rotulos, { autoAlpha: 0, y: 24 });
      gsap.set(letrasPlaca, { autoAlpha: 1 });
      gsap.set(pie, { autoAlpha: 0 });

      tl = gsap.timeline({ defaults: { ease: 'none' } });
      /* el relevo: las placas del SVG ceden su sitio a las de verdad, idénticas */
      tl.set(placas, { autoAlpha: 1 }, 0.001)
        .set(grupoPlacas, { autoAlpha: 0 }, 0.001)
        .to(texto, { autoAlpha: 0, y: -50, duration: 1.1, ease: 'power2.in' }, 0)
        .to([anillos, leyendaG], { autoAlpha: 0, duration: 0.9 }, 0.2);
      if (pista) tl.to(pista, { autoAlpha: 0, duration: 0.4 }, 0);
      /* crecen y se separan hasta ser tres columnas */
      placas.forEach(function (p, i) {
        tl.to(p, { left: hasta[i].left, top: hasta[i].top, width: hasta[i].width, height: hasta[i].height, duration: 3.2, ease: 'power2.inOut' }, 0.6 + i * 0.04);   /* casi a la vez: con más escalonado se pisan al crecer */
      });
      tl.to(letrasPlaca, { autoAlpha: 0, duration: 0.7 }, 1.7)
        .fromTo(rotulos, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.12, ease: 'power2.out', immediateRender: false }, 3.4)
        .fromTo(pie, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.8, immediateRender: false }, 4.2);
      /* y giran, una tras otra, para enseñar qué se hace en cada una */
      giros.forEach(function (g, i) {
        tl.to(g, { rotationY: 180, duration: 1.8, ease: 'power2.inOut' }, 5 + i * 0.35);
      });
      tl.to({}, { duration: 1.6 });   /* respiro: las tres se leen quietas antes de soltar el anclaje */

      st = ST.create({
        trigger: seccion, start: 'top top', end: '+=230%',
        pin: true, scrub: 0.6, anticipatePin: 1,
        animation: tl
      });
    }
    registrar(montar);
    window.__fprHero = { get st() { return st; } };
  })();

  /* ───────────────── estado en vivo (Europe/Madrid) ───────────────── */
  var FRANJAS = { 1: [9, 14], 2: [9, 14], 3: [9, 14], 4: [9, 14], 5: [9, 14], 6: null, 0: null };
  var NOMBRES = ['el domingo', 'el lunes', 'el martes', 'el miércoles', 'el jueves', 'el viernes', 'el sábado'];
  function ahoraMadrid() {
    var partes = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    var o = {};
    partes.forEach(function (p) { o[p.type] = p.value; });
    return { dia: { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[o.weekday], h: parseInt(o.hour, 10) % 24 + parseInt(o.minute, 10) / 60 };
  }
  function estadoAhora() {
    var t = ahoraMadrid(), hoy = FRANJAS[t.dia];
    if (hoy && t.h >= hoy[0] && t.h < hoy[1]) return { abierto: true, texto: 'Abierto ahora · hasta las 14:00', dia: t.dia };
    if (hoy && t.h < hoy[0]) return { abierto: false, texto: 'Abrimos hoy a las 9:00', dia: t.dia };
    for (var d = 1; d <= 7; d++) {
      var dia = (t.dia + d) % 7;
      if (FRANJAS[dia]) return { abierto: false, texto: 'Abrimos ' + (d === 1 ? 'mañana' : NOMBRES[dia]) + ' a las 9:00', dia: t.dia };
    }
    return { abierto: false, texto: 'Cerrado', dia: t.dia };
  }
  (function estadoVivo() {
    var nodos = ['estado-hero', 'horario-estado'].map(function (id) { return document.getElementById(id); }).filter(Boolean);
    var tabla = document.getElementById('horario-tabla');
    function pintar() {
      var e = estadoAhora();
      nodos.forEach(function (n) {
        n.dataset.estado = e.abierto ? 'abierto' : 'cerrado';
        $('span', n).textContent = e.texto;
      });
      if (tabla) $$('tr', tabla).forEach(function (tr) { tr.classList.toggle('hoy', tr.dataset.dias.split(',').indexOf(String(e.dia)) !== -1); });
    }
    pintar();
    setInterval(pintar, 60000);
  })();

  /* ───────────────── marquesina a dos velocidades, ligada al scroll ───────────────── */
  (function marquesina() {
    var carriles = $$('.marquesina__carril');
    if (!carriles.length) return;
    var velocidadScroll = 0;
    if (lenis) lenis.on('scroll', function (e) { velocidadScroll = Math.min(Math.abs(e.velocity || 0) * 0.35, 9); });
    carriles.forEach(function (pista) {
      var grupo = pista.firstElementChild;
      var copias = Math.ceil((window.innerWidth * 2) / Math.max(1, grupo.offsetWidth)) + 1;
      for (var i = 0; i < copias; i++) {
        var c = grupo.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        pista.appendChild(c);
      }
      if (!movimiento) return;
      var base = parseFloat(pista.dataset.velocidad) || 0.5;
      var x = base < 0 ? -grupo.offsetWidth : 0;
      /* rAF propio: ningún tween de GSAP toca esta propiedad */
      (function paso() {
        var ancho = grupo.offsetWidth;
        x -= base + (base < 0 ? -1 : 1) * velocidadScroll * Math.abs(base);
        if (ancho) { if (x <= -ancho) x += ancho; if (x > 0) x -= ancho; }
        pista.style.transform = 'translate3d(' + x.toFixed(2) + 'px,0,0)';
        requestAnimationFrame(paso);
      })();
    });
    if (movimiento) gsap.ticker.add(function () { velocidadScroll *= 0.92; });
  })();

  /* ───────────────── separadores: tres barras que suben escalonadas ───────────────── */
  (function separadores() {
    if (!movimiento) return;
    var todos = $$('.separador');
    todos.forEach(function (s) { gsap.set($$('i', s), { scaleY: 0 }); });
    cuandoVisible(todos, 0.6, function (s) {
      var barras = $$('i', s);
      if (sobria()) { gsap.set(barras, { scaleY: 1 }); return; }
      gsap.to(barras, { scaleY: 1, duration: 1.1, ease: 'expo.out', stagger: 0.09 });
    });
    document.addEventListener('densidad-cambiada', function () {
      if (sobria()) todos.forEach(function (s) { gsap.set($$('i', s), { scaleY: 1 }); });
    });
  })();

  /* ───────────────── qué hacemos: la pila de placas e índice ───────────────── */
  (function servicios() {
    var lista = document.getElementById('pila');
    var items = $$('.pila__item');
    if (!lista || !items.length) return;
    var indice = $$('#indice li');
    var disparos = [];

    /* todas miden lo que la más alta: la condición para que la pila no se
       deshaga por la última. Se mide el contenido, no la pantalla. */
    function igualar() {
      var placas = items.map(function (it) { return $('.placa-servicio', it); });
      lista.style.removeProperty('--alto-placa');
      if (getComputedStyle(items[0]).position !== 'sticky') return;
      placas.forEach(function (p) { p.style.height = 'auto'; });
      var alto = Math.max.apply(null, placas.map(function (p) { return p.offsetHeight; }));
      placas.forEach(function (p) { p.style.removeProperty('height'); });
      lista.style.setProperty('--alto-placa', alto + 'px');
    }

    function montar() {
      disparos.forEach(function (d) { d.kill(); });
      disparos = [];
      items.forEach(function (it) {
        var p = $('.placa-servicio', it);
        if (gsapReady) gsap.set(p, { clearProps: 'transform' });
        p.style.removeProperty('--oscuro');
      });
      igualar();
      if (!movimiento || sobria() || getComputedStyle(items[0]).position !== 'sticky') return;
      var arriba = Math.round(tope());
      items.forEach(function (it, i) {
        var siguiente = items[i + 1];
        if (!siguiente) return;
        var tw = gsap.fromTo($('.placa-servicio', it), { scale: 1, '--oscuro': 0 }, { scale: 0.94, '--oscuro': 0.3, ease: 'none', paused: true, immediateRender: false });
        disparos.push(ST.create({
          trigger: siguiente, start: 'top bottom',
          end: 'top ' + arriba + 'px',        /* acaba justo cuando la siguiente se posa */
          scrub: true, animation: tw
        }));
      });
    }
    registrar(montar);

    /* el índice sigue a la pila (contenido: también con movimiento reducido) */
    function revisar() {
      if (!indice.length) return;
      var pegada = getComputedStyle(items[0]).position === 'sticky';
      var umbral = pegada ? tope() + 2 : window.innerHeight * 0.55;
      var n = items.filter(function (li) { return li.getBoundingClientRect().top <= umbral; }).length;
      indice.forEach(function (li) {
        var i = Number(li.dataset.i);
        li.classList.toggle('activo', i <= n);
        li.classList.toggle('actual', i === n);
      });
    }
    window.addEventListener('scroll', revisar, { passive: true });
    if (lenis) lenis.on('scroll', revisar);
    revisar();
  })();

  /* ───────────────── módulo «carta»: el sobre se abre y la carta se anota ───────────────── */
  (function carta() {
    var escena = document.getElementById('escena-carta');
    if (!escena) return;
    var solapa = document.getElementById('sobre-solapa');
    var hoja = document.getElementById('hoja-carta');
    var marcas = $$('.marcado svg', escena);
    var notas = $$('.nota', escena);
    var flechas = $$('.nota__flecha path', escena);
    if (!movimiento || !solapa || !hoja) return;
    /* el reposo del CSS es la carta ya fuera; se lee antes de guardarla */
    var fin = { y: gsap.getProperty(hoja, 'y'), r: gsap.getProperty(hoja, 'rotation') };
    var largos = flechas.map(function (f) { return f.getTotalLength(); });
    function preparar() {
      gsap.set(solapa, { rotationX: 180, transformPerspective: 900, transformOrigin: '50% 100%', zIndex: 4 });
      gsap.set(hoja, { y: 150, rotation: 0 });
      gsap.set(marcas, { clipPath: 'inset(0 100% 0 0)' });
      gsap.set(notas, { autoAlpha: 0, x: 8 });
      flechas.forEach(function (f, i) { f.style.strokeDasharray = largos[i]; f.style.strokeDashoffset = largos[i]; });
    }
    preparar();
    cuandoVisible([escena], 0.4, function () {
      var t = gsap.timeline({ delay: 0.2 });
      t.to(solapa, { rotationX: 0, duration: 0.7, ease: 'power2.inOut' }, 0)
        .set(solapa, { zIndex: 1 }, 0.36)
        .to(hoja, { y: fin.y, rotation: fin.r, duration: 1.1, ease: 'expo.out' }, 0.55)
        .to(marcas[0], { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power2.inOut' }, 1.5)
        .to(flechas[0], { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, 1.8)
        .to(notas[0], { autoAlpha: 1, x: 0, duration: 0.6, ease: 'expo.out' }, 1.95);
      if (marcas[1]) t.to(marcas[1], { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power2.inOut' }, 2.4);
      if (flechas[1]) t.to(flechas[1], { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, 2.7);
      if (notas[1]) t.to(notas[1], { autoAlpha: 1, x: 0, duration: 0.6, ease: 'expo.out' }, 2.85);
    });
  })();

  /* ───────────────── módulo «factura»: la barra se separa en tres tramos ───────────────── */
  (function factura() {
    var barra = document.getElementById('factura-barra');
    if (!barra) return;
    var tramos = $$('.tramo', barra);
    var etis = $$('.factura__leyenda .eti');
    var valores = tramos.map(function (t) { return Number(t.dataset.v); });
    var total = valores.reduce(function (a, b) { return a + b; }, 0);
    var HUECO = 10;
    var colores = null, st = null;

    function leerColores() {
      /* el color final de cada tramo, del CSS; al principio, los tres son el verde del logo */
      colores = tramos.map(function (t) { t.style.removeProperty('background'); return getComputedStyle(t).backgroundImage !== 'none' ? getComputedStyle(t).backgroundImage : getComputedStyle(t).backgroundColor; });
    }
    function pintar(p) {
      var g = HUECO * acotar((p - 0.15) / 0.55, 0, 1);
      var acumulado = 0;
      tramos.forEach(function (t, i) {
        var f = valores[i] / total;
        t.style.left = 'calc((100% - ' + (2 * g).toFixed(2) + 'px) * ' + acumulado.toFixed(4) + ' + ' + (i * g).toFixed(2) + 'px)';
        t.style.width = 'calc((100% - ' + (2 * g).toFixed(2) + 'px) * ' + f.toFixed(4) + ')';
        t.style.background = p < 0.35 ? 'var(--verde)' : '';
        acumulado += f;
      });
      etis.forEach(function (e, i) {
        var on = p >= 0.4 + i * 0.12;
        e.style.opacity = on ? '1' : '0';
        e.style.transform = on ? 'none' : 'translateY(8px)';
      });
      barra.dataset.progreso = p.toFixed(2);
    }
    function montar() {
      if (st) { st.kill(); st = null; }
      leerColores();
      if (!movimiento || !seVe(barra)) { pintar(1); return; }
      etis.forEach(function (e) { e.style.transition = 'opacity .5s, transform .5s'; });
      pintar(0);
      st = ST.create({ trigger: barra, start: 'top 88%', end: 'top 38%', scrub: 0.4, onUpdate: function (s) { pintar(s.progress); } });
      pintar(st.progress);
    }
    registrar(montar);
  })();

  /* ───────────────── lo que dicen: una cita cada vez, con flechas o con el scroll ───────────────── */
  (function opiniones() {
    var seccion = document.getElementById('opiniones');
    var citas = $$('.cita', seccion || document);
    if (!seccion || !citas.length) return;
    var barras = document.getElementById('cita-barras');
    var marcas = citas.map(function () { var b = document.createElement('b'); barras.appendChild(b); return b; });
    var actual = -1, st = null, ultimoScroll = -1;

    /* Un solo relevo vivo a la vez. Con el scroll los relevos llegan seguidos:
       si cada uno lanzaba sus propios tweens (con retardo), los del anterior
       seguían vivos y volvían a encender una cita que ya se iba, y se veían
       dos o tres encima. Ahora cada relevo mata el anterior, apaga del todo
       las que no intervienen y encadena: sale la que se ve y DESPUÉS entra la nueva. */
    var relevo = null;
    var LIMPIAR = 'transform,opacity,visibility';
    function laQueSeVe() {
      var mejor = null, max = 0.05;
      citas.forEach(function (c) {
        var s = getComputedStyle(c), o = s.visibility === 'hidden' ? 0 : parseFloat(s.opacity);
        if (o > max) { max = o; mejor = c; }
      });
      return mejor;
    }
    function mostrar(i, suave) {
      i = (i + citas.length) % citas.length;
      if (i === actual) return;
      actual = i;
      var entra = citas[i];
      var sale = gsapReady ? laQueSeVe() : null;   /* se mide ANTES de cambiar las clases */
      if (relevo) { relevo.kill(); relevo = null; }
      citas.forEach(function (c, k) { c.classList.toggle('activa', k === i); c.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
      marcas.forEach(function (b, k) { b.classList.toggle('on', k === i); });
      if (!(movimiento && suave && !sobria())) {
        if (gsapReady) gsap.set(citas, { clearProps: LIMPIAR });
        return;
      }
      citas.forEach(function (c) { if (c !== sale && c !== entra) gsap.set(c, { clearProps: LIMPIAR }); });
      relevo = gsap.timeline();
      if (sale && sale !== entra) {
        relevo.to(sale, { autoAlpha: 0, y: -18, duration: 0.28, ease: 'power2.in', overwrite: true })
          .set(sale, { clearProps: LIMPIAR });
      }
      relevo.fromTo(entra,
        { autoAlpha: sale === entra ? gsap.getProperty(entra, 'opacity') : 0, y: sale === entra ? gsap.getProperty(entra, 'y') : 26 },
        { autoAlpha: 1, y: 0, duration: 0.7, ease: 'expo.out', overwrite: true, clearProps: LIMPIAR });
    }
    mostrar(0, false);
    document.getElementById('cita-antes').addEventListener('click', function () { mostrar(actual - 1, true); });
    document.getElementById('cita-despues').addEventListener('click', function () { mostrar(actual + 1, true); });

    /* con el scroll, al pasar por la sección, se relevan solas (contenido: vale con movimiento reducido) */
    function montar() {
      if (st) { st.kill(); st = null; }
      ultimoScroll = -1;
      if (!gsapReady || sobria()) return;
      st = ST.create({
        trigger: seccion, start: 'top 55%', end: 'bottom 45%',
        onUpdate: function (s) {
          var i = Math.min(citas.length - 1, Math.floor(s.progress * citas.length));
          if (i !== ultimoScroll) { ultimoScroll = i; mostrar(i, true); }
        }
      });
    }
    registrar(montar);
  })();

  /* ───────────────── módulo «herencias»: las placas bajan por las ramas ───────────────── */
  (function herencias() {
    var seccion = document.getElementById('herencias');
    var svg = document.getElementById('arbol');
    if (!seccion || !svg) return;
    var ramas = $$('.arbol__rama', svg);
    var placas = $$('.arbol__placa', svg);
    var pasos = $$('#pasos li');
    var largos = ramas.map(function (r) { return r.getTotalLength(); });
    var ORIGEN = [[272, 100], [300, 100], [328, 100]];
    var st = null;
    function suave(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

    function pintar(k) {
      /* pasos: uno por fase */
      pasos.forEach(function (p, i) { p.classList.toggle('on', k >= [0, 0.2, 0.4, 0.6, 0.8][i]); });
      /* ramas que se dibujan */
      var d = suave(acotar((k - 0.04) / 0.3, 0, 1));
      ramas.forEach(function (r, i) { r.style.strokeDasharray = largos[i]; r.style.strokeDashoffset = largos[i] * (1 - d); });
      /* las placas salen del círculo y bajan por su rama hasta quedar sobre cada figura */
      placas.forEach(function (g, i) {
        var mv = suave(acotar((k - 0.3 - i * 0.08) / 0.46, 0, 1));
        var o = ORIGEN[i], a = ramas[i].getPointAtLength(0);
        var salida = acotar(mv / 0.25, 0, 1), recorrido = acotar((mv - 0.25) / 0.75, 0, 1);
        var x = o[0] + (a.x - o[0]) * salida, y = o[1] + (a.y - o[1]) * salida;
        if (recorrido > 0) { var q = ramas[i].getPointAtLength(largos[i] * recorrido); x = q.x; y = q.y + 30 * recorrido; }
        g.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ')');
      });
      seccion.dataset.progreso = k.toFixed(2);
    }
    function montar() {
      if (st) { st.kill(); st = null; }
      if (!movimiento || !seVe(seccion)) { pintar(1); return; }   /* reducido: el final quieto */
      pintar(0);
      var cabe = seccion.offsetHeight <= window.innerHeight + 4;
      /* si no cabe (móvil): el árbol se queda fijo arriba (sticky en el CSS) y el
         reparto va al ritmo de la lista que se lee debajo; si no, el árbol ya se
         habría ido por arriba cuando las placas bajan */
      var texto = seccion.querySelector('.herencias__texto');
      var fijo = !cabe && getComputedStyle(seccion.querySelector('.arbol')).position === 'sticky';
      st = ST.create({
        trigger: cabe || !fijo || !texto ? seccion : texto,
        start: cabe ? 'top top' : (fijo ? 'top 92%' : 'top 65%'),
        end: cabe ? '+=150%' : (fijo ? 'bottom 62%' : 'bottom 75%'),
        pin: cabe, scrub: 0.5, anticipatePin: 1,
        onUpdate: function (s) { pintar(s.progress); }
      });
      pintar(st.progress);
    }
    registrar(montar);
  })();

  /* ───────────────── módulo «glosario»: la lupa que traduce ───────────────── */
  (function glosario() {
    var caja = document.getElementById('lectura');
    var lupa = document.getElementById('lupa');
    var texto = document.getElementById('lupa-texto');
    if (!caja || !lupa || !texto) return;
    var terminos = $$('b[data-claro]', caja);
    if (!terminos.length) return;
    var x = 0, y = 0, tx = 0, ty = 0, auto = movimiento, t0 = performance.now(), actual = null, corriendo = false, dentro = false, arrastre = false;

    function centroDe(b) {
      var r = caja.getBoundingClientRect(), q = b.getClientRects()[0];
      if (!q) return [x, y];                 /* módulo oculto (densidad sobria): no hay dónde medir */
      return [q.left - r.left + q.width / 2, q.top - r.top + q.height / 2];
    }
    function mover(cx, cy) {
      var r = caja.getBoundingClientRect();
      tx = acotar(cx - r.left, 0, r.width); ty = acotar(cy - r.top, 0, r.height);
      auto = false;
      if (!movimiento) { x = tx; y = ty; paso(); }
    }
    function elegir() {
      var r = caja.getBoundingClientRect(), mejor = null, md = 1e9;
      terminos.forEach(function (b) {
        Array.prototype.forEach.call(b.getClientRects(), function (q) {
          var dx = Math.max(q.left - r.left - x, 0, x - (q.right - r.left)), dy = Math.max(q.top - r.top - y, 0, y - (q.bottom - r.top));
          var d = dx * dx + dy * dy;
          if (d < md) { md = d; mejor = b; }
        });
      });
      if (!mejor) return;
      if (mejor !== actual) {
        if (actual) actual.classList.remove('on');
        actual = mejor;
        mejor.classList.add('on');
        texto.textContent = mejor.dataset.claro;
      }
    }
    function paso(now) {
      if (auto) {
        var k = Math.floor(Math.max(0, (now || performance.now()) - t0) / 2400) % terminos.length;
        var c = centroDe(terminos[k]); tx = c[0]; ty = c[1];
      }
      if (movimiento) { x += (tx - x) * 0.12; y += (ty - y) * 0.12; } else { x = tx; y = ty; }
      lupa.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      elegir();
    }
    function bucle(now) {
      if (!dentro || !movimiento) { corriendo = false; return; }
      paso(now);
      requestAnimationFrame(bucle);
    }
    function arrancar() { if (!corriendo && movimiento) { corriendo = true; requestAnimationFrame(bucle); } }

    /* estado inicial: sobre el primer término */
    var c0 = centroDe(terminos[0]); x = tx = c0[0]; y = ty = c0[1];
    paso();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { dentro = e[0].isIntersecting; if (dentro) { t0 = performance.now(); arrancar(); } }, { threshold: 0.1 }).observe(caja);
    }
    caja.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse' || arrastre) mover(e.clientX, e.clientY); });
    caja.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && movimiento) { auto = true; t0 = performance.now(); } document.documentElement.classList.remove('lupa-activa'); });
    caja.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') html.classList.add('lupa-activa'); });
    /* táctil: la lupa se arrastra con el dedo; un toque en un término la lleva allí */
    lupa.addEventListener('pointerdown', function (e) { arrastre = true; lupa.setPointerCapture(e.pointerId); mover(e.clientX, e.clientY); });
    lupa.addEventListener('pointermove', function (e) { if (arrastre) mover(e.clientX, e.clientY); });
    lupa.addEventListener('pointerup', function () { arrastre = false; });
    lupa.addEventListener('pointercancel', function () { arrastre = false; });
    terminos.forEach(function (b) { b.addEventListener('click', function () { var c = centroDe(b), r = caja.getBoundingClientRect(); mover(r.left + c[0], r.top + c[1]); }); });
    function recolocar() { var c = centroDe(actual || terminos[0]); x = tx = c[0]; y = ty = c[1]; paso(); }
    window.addEventListener('resize', function () { if (!movimiento) recolocar(); });
    document.addEventListener('densidad-cambiada', function () { setTimeout(recolocar, 60); });   /* vuelve a verse tras la sobria */
  })();

  /* ───────────────── móviles: tras una constante, sin atribuirlos a nadie ───────────────── */
  (function moviles() {
    if (!MOVILES_PUBLICABLES) return;
    $$('[data-moviles]').forEach(function (n) {
      n.textContent = 'También: ';
      MOVILES.forEach(function (m, i) {
        var a = document.createElement('a');
        a.href = 'tel:+34' + m.replace(/\s/g, '');
        a.textContent = m;
        n.appendChild(a);
        if (i < MOVILES.length - 1) n.appendChild(document.createTextNode(' · '));
      });
    });
  })();

  /* ───────────────── mapa solo bajo clic ───────────────── */
  (function mapa() {
    var btn = document.getElementById('mapa-boton');
    var caja = document.getElementById('mapa-consentimiento');
    if (!btn || !caja) return;
    btn.addEventListener('click', function () {
      var marco = document.createElement('iframe');
      marco.src = caja.dataset.mapSrc;
      marco.loading = 'lazy';
      marco.title = 'Mapa: FPR Asesores Consultores, avenida Tomás Romero de Castilla, 4, Badajoz';
      marco.referrerPolicy = 'no-referrer-when-downgrade';
      caja.parentNode.replaceChild(marco, caja);
    });
  })();

  /* ───────────────── aviso de cookies ───────────────── */
  (function cookies() {
    var caja = document.getElementById('cookies');
    var ok = document.getElementById('cookies-aceptar');
    var ajustes = document.getElementById('cookies-ajustes');
    if (!caja || !ok) return;
    var guardado = null;
    try { guardado = localStorage.getItem('fpr-cookies'); } catch (e) {}
    function abrir() { caja.hidden = false; document.body.classList.add('cookies-visibles'); }
    if (guardado !== 'ok') abrir();
    ok.addEventListener('click', function () {
      caja.hidden = true;                     /* el CSS pone display solo si NO hay [hidden] */
      document.body.classList.remove('cookies-visibles');
      try { localStorage.setItem('fpr-cookies', 'ok'); } catch (e) {}
    });
    if (ajustes) ajustes.addEventListener('click', function () { abrir(); ok.focus(); });
  })();

  /* ───────────────── cabecera, menú y progreso ───────────────── */
  var cabecera = document.getElementById('cabecera');
  var boton = document.getElementById('hamburguesa');
  function cerrarMenu() {
    if (!cabecera || !boton || !cabecera.classList.contains('menu-abierto')) return;
    cabecera.classList.remove('menu-abierto');
    boton.setAttribute('aria-expanded', 'false');
    $('.visualmente-oculto', boton).textContent = 'Abrir menú';
    if (lenis) lenis.start();
  }
  if (boton) {
    boton.addEventListener('click', function () {
      var abierto = cabecera.classList.toggle('menu-abierto');
      boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
      $('.visualmente-oculto', boton).textContent = abierto ? 'Cerrar menú' : 'Abrir menú';
      if (lenis) { if (abierto) lenis.stop(); else lenis.start(); }
    });
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarMenu(); });

  /* la placa compacta de la cabecera se rellena de abajo arriba: un tercio de página por placa */
  (function progreso() {
    var rellenos = $$('#progreso i');
    var pedido = false;
    function actualizar() {
      pedido = false;
      var y = window.pageYOffset;
      if (cabecera) cabecera.classList.toggle('cabecera--fija', y > 8);
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? acotar(y / max, 0, 1) : 0;
      rellenos.forEach(function (r, i) { r.style.transform = 'scaleY(' + acotar(p * 3 - i, 0, 1).toFixed(3) + ')'; });
      if (cabecera) cabecera.dataset.progreso = p.toFixed(3);
    }
    function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(actualizar); } }
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', pedir);
    if (lenis) lenis.on('scroll', pedir);
    actualizar();
  })();

  /* ───────────────── botones magnéticos ───────────────── */
  (function imanes() {
    if (!movimiento || esTactil) return;
    $$('.iman').forEach(function (el) {
      var aX = gsap.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' });
      var aY = gsap.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' });
      el.addEventListener('pointermove', function (e) {
        var c = el.getBoundingClientRect();
        aX((e.clientX - (c.left + c.width / 2)) * 0.3);
        aY((e.clientY - (c.top + c.height / 2)) * 0.4);
      });
      el.addEventListener('pointerleave', function () { aX(0); aY(0); });
    });
  })();

  /* ───────────────── cursor propio: punto verde y aro; sobre enlaces, tres barritas ───────────────── */
  (function cursor() {
    if (!movimiento || esTactil) return;
    var c = document.createElement('div');
    var p = document.createElement('div');
    c.className = 'cursor';
    p.className = 'cursor-punto';
    c.innerHTML = '<i></i><i></i><i></i>';
    [c, p].forEach(function (n) { n.setAttribute('aria-hidden', 'true'); document.body.appendChild(n); });
    var aX = gsap.quickTo(c, 'x', { duration: 0.28, ease: 'power3.out' });
    var aY = gsap.quickTo(c, 'y', { duration: 0.28, ease: 'power3.out' });
    var ultimo = null;
    function mostrar(si) { c.classList.toggle('cursor--vivo', si); p.classList.toggle('cursor--vivo', si); }
    function estado(objetivo) {
      if (objetivo === ultimo) return;
      ultimo = objetivo;
      var sobre = !!(objetivo && objetivo.closest && objetivo.closest('a, button, .map-consent button, .lupa'));
      var lupa = !!(objetivo && objetivo.closest && objetivo.closest('.lectura'));
      c.classList.toggle('cursor--activo', sobre && !lupa);
      p.classList.toggle('cursor-punto--activo', sobre && !lupa);
      c.classList.toggle('cursor--lupa', lupa);
      p.classList.toggle('cursor--lupa', lupa);
    }
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      if (!c.classList.contains('cursor--vivo')) {
        gsap.set(c, { x: e.clientX, y: e.clientY });
        html.classList.add('con-cursor');        /* el del sistema se oculta cuando el propio ya se ve */
        mostrar(true);
      }
      gsap.set(p, { x: e.clientX, y: e.clientY });
      aX(e.clientX); aY(e.clientY);
      estado(e.target);                          /* por pointermove, no pointerover: no falla tras recargar */
    });
    html.addEventListener('mouseleave', function () { mostrar(false); });
    html.addEventListener('mouseenter', function () { if (html.classList.contains('con-cursor')) mostrar(true); });
  })();

  var anio = document.getElementById('anio');
  if (anio) anio.textContent = new Date().getFullYear();

  /* las medidas cambian cuando llegan las fuentes y con cualquier relayout tardío */
  if (gsapReady) {
    var anchoAntes = window.innerWidth, altoAntes = window.innerHeight, espera;
    function tarde() {
      clearTimeout(espera);
      espera = setTimeout(remontar, 200);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(tarde);
    window.addEventListener('resize', function () {
      /* la barra de direcciones del móvil cambia el alto: solo se remonta si cambia el ancho o mucho el alto */
      if (window.innerWidth === anchoAntes && Math.abs(window.innerHeight - altoAntes) < 120) return;
      anchoAntes = window.innerWidth; altoAntes = window.innerHeight;
      tarde();
    });
    if ('ResizeObserver' in window) {
      var altoDoc = 0, obsEspera;
      new ResizeObserver(function () {
        var h = document.body.scrollHeight;
        if (Math.abs(h - altoDoc) < 2) return;
        altoDoc = h;
        clearTimeout(obsEspera);
        obsEspera = setTimeout(function () { ST.refresh(); }, 180);
      }).observe(document.body);
    }
  }
  document.addEventListener('densidad-cambiada', function () { setTimeout(remontar, 40); });

  /* ═══════════════════════════════════════════════════════════════════════
     [MANDO DE MAQUETA] — SOLO REVISIÓN INTERNA. NO PUBLICAR.
     Borrar este bloque entero, el bloque CSS marcado igual en estilos.css,
     el <div class="mando"> del HTML y la parte de densidad del <head>.
     ═══════════════════════════════════════════════════════════════════════ */
  (function mandoMaqueta() {
    var mando = document.getElementById('mando');
    if (!mando) return;
    /* solo con ?revision: el enlace que recibe el cliente sale limpio */
    if (!/[?&]revision\b/.test(window.location.search)) return;
    mando.hidden = false;
    var botones = $$('[data-densidad]', mando);
    function aplicar(d) {
      html.classList.remove('densidad-placas', 'densidad-sobria');
      html.classList.add('densidad-' + d);
      botones.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.densidad === d ? 'true' : 'false'); });
      try { localStorage.setItem('fpr-densidad', d); } catch (e) {}
      document.dispatchEvent(new CustomEvent('densidad-cambiada', { detail: d }));
    }
    var actual = html.classList.contains('densidad-sobria') ? 'sobria' : 'placas';
    botones.forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.densidad === actual ? 'true' : 'false');
      b.addEventListener('click', function () { aplicar(b.dataset.densidad); });
    });
  })();
  /* ═══════════ fin del bloque [MANDO DE MAQUETA] ═══════════ */

})();
