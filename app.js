/* =====================================================================
   Vintage Boutique — App de publicación de prendas
   PWA sin dependencias. Funciona sin internet; sincroniza a Supabase
   cuando hay señal. Datos separados por tienda.

   Una foto puede llevar varias prendas (blusa + pantalón). Cada prenda
   tiene su precio, talla y marca, y se vende por separado.
   ===================================================================== */

'use strict';

/* ---------------------------------------------------------------- CONFIG */
const CFG    = window.VB_CONFIG || {};
const NUBE   = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY);
const BUCKET = CFG.BUCKET || 'fotos';
const TIENDAS = CFG.TIENDAS || [
  { id: '7a', nombre: '7a avenida, zona 1' },
  { id: '6a', nombre: '6a avenida, zona 1' }
];
const LOGO_URL   = 'logo.png';        // "Boutique" en negro — para fotos claras
const LOGO_CLARO = 'logo-claro.png';  // "Boutique" en crema — para fondos oscuros
const FUENTE     = '-apple-system, "Segoe UI", Roboto, Arial, sans-serif';
const TIKTOK_URL = CFG.TIKTOK_URL || 'https://www.tiktok.com/@vintageboutiquegt';
const FN_DETECTAR = CFG.FUNCION_DETECTAR || '';   // Edge Function de detección (opcional)
const ANCHO_FOTO = 1400;   // px del lado mayor de la foto guardada
const CALIDAD    = 0.85;   // calidad JPEG

/* ------------------------------------------------------------------ SVG */
const I = {
  camara:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3Z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  atras:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  compartir:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>',
  bajar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>',
  mas:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  etiqueta:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0l-7.2-7.2A2 2 0 0 1 2.8 12V4a1 1 0 0 1 1-1h8a2 2 0 0 1 1.4.6l7.2 7.2a2 2 0 0 1 .2 2.6Z"/><circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" stroke="none"/></svg>',
  deshacer:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v6h6"/><path d="M3.5 13a9 9 0 1 0 2.6-6.4L3 9"/></svg>',
  basura:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>',
  config:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 8a1.7 1.7 0 0 0-.4-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V8a1.7 1.7 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>',
  cerrar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  girar:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h4l2-3h6l2 3h4v13H3z"/><path d="M12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="m9.5 13.5 1.5-1.5-1.5-1.5"/></svg>',
  varita:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 19 9-9M13.5 4.5 15 3M19 9l1.5-1.5M15.5 8.5 17 10M9 3l.7 2M21 15l-2-.7"/><path d="m14 10 4-4-3-3-4 4z"/></svg>',
  lapiz:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>'
};

/* ----------------------------------------------------------- UTILIDADES */
const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  .replace(/"/g,'&quot;').replace(/'/g,'&#39;');

function quetzales(v){
  const n = parseFloat(v);
  return isNaN(n) ? 'Q0.00' : 'Q' + n.toFixed(2);
}
function uid(){
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/* ------------------------------------------------- ALMACENAMIENTO LOCAL */
const DB_NOMBRE = 'vintage-boutique';
let _db = null;

function abrirDB(){
  if (_db) return Promise.resolve(_db);
  return new Promise((ok, mal) => {
    const p = indexedDB.open(DB_NOMBRE, 2);
    p.onupgradeneeded = (ev) => {
      const db = p.result;
      if (!db.objectStoreNames.contains('prendas')) db.createObjectStore('prendas', { keyPath:'id' });
      if (!db.objectStoreNames.contains('cola'))    db.createObjectStore('cola',    { keyPath:'id' });
      if (!db.objectStoreNames.contains('fotos'))   db.createObjectStore('fotos',   { keyPath:'grupo' });

      // Las prendas publicadas antes de esta versión: cada una pasa a ser su
      // propia foto, conservando imagen, precio, talla y estado de vendida.
      if (ev.oldVersion >= 1 && ev.oldVersion < 2){
        const t  = p.transaction;
        const sp = t.objectStore('prendas');
        const sf = t.objectStore('fotos');
        sp.openCursor().onsuccess = (e) => {
          const c = e.target.result;
          if (!c) return;
          const v = c.value;
          if (!v.grupo){
            sf.put({
              grupo: v.id, tienda: v.tienda,
              // si guardamos la foto sin editar podemos rearmar la imagen;
              // si solo queda la ya compuesta, se comparte tal cual (legado)
              blob: v.blobOriginal || v.blob || null,
              legado: !v.blobOriginal,
              foto_url: v.foto_url || null, ruta: v.ruta || null,
              fecha_creacion: v.fecha_creacion
            });
            v.grupo = v.id;
            v.tipo  = v.tipo || '';
            v.orden = 0;
            delete v.blob; delete v.blobOriginal;
            c.update(v);
          }
          c.continue();
        };
      }
    };
    p.onsuccess = () => { _db = p.result; ok(_db); };
    p.onerror   = () => mal(p.error);
  });
}
function tx(store, modo, fn){
  return abrirDB().then(db => new Promise((ok, mal) => {
    const t = db.transaction(store, modo);
    const r = fn(t.objectStore(store));
    t.oncomplete = () => ok(r && r.result !== undefined ? r.result : undefined);
    t.onerror    = () => mal(t.error);
  }));
}
const dbTodo    = (s)      => tx(s, 'readonly',  o => o.getAll());
const dbLeer    = (s, id)  => tx(s, 'readonly',  o => o.get(id));
const dbGuardar = (s, v)   => tx(s, 'readwrite', o => o.put(v));
const dbBorrar  = (s, id)  => tx(s, 'readwrite', o => o.delete(id));

/* ------------------------------------------------------- ESTADO GLOBAL */
const S = {
  tienda: localStorage.getItem('vb_tienda') || null,
  vista:  'home',
  paso:   1,
  filtro: 'disponibles',
  fotos:  [],             // [{grupo, blob, foto_url, ..., prendas:[...]}]

  // --- flujo de alta ---
  fotoBlob: null,
  previaURL: null,
  marcas: [],             // [{tipo, precio, talla, marca, x, y}]
  editando: null,         // índice de la prenda que se está llenando
  compuestaURL: null,
  compuestaBlob: null,
  grupoGuardado: null,

  pendientes: 0,
  sincronizando: false
};
const urls = new Map();

function urlFoto(f){
  if (f.blob){
    if (!urls.has(f.grupo)) urls.set(f.grupo, URL.createObjectURL(f.blob));
    return urls.get(f.grupo);
  }
  return f.foto_url || '';
}

/* ------------------------------------------------------------- IMÁGENES */
function cargarImagen(src){
  return new Promise((ok, mal) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload  = () => ok(im);
    im.onerror = mal;
    im.src = src;
  });
}
const aBlob = (canvas) => new Promise(ok => canvas.toBlob(b => ok(b), 'image/jpeg', CALIDAD));

/** Reduce la foto de la cámara a algo manejable. */
const comprimir = (origen) => comprimirA(origen, ANCHO_FOTO);

async function comprimirA(origen, lado){
  const url = origen instanceof Blob ? URL.createObjectURL(origen) : origen;
  try{
    const im = await cargarImagen(url);
    const escala = Math.min(1, lado / Math.max(im.width, im.height));
    const c = document.createElement('canvas');
    c.width  = Math.round(im.width  * escala);
    c.height = Math.round(im.height * escala);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    return await aBlob(c);
  } finally {
    if (origen instanceof Blob) URL.revokeObjectURL(url);
  }
}

/* ------------------------------------------------------- COMPOSICIÓN */

/* Rojo del sello: más intenso que el rojo de marca, para que se lea de golpe
   sobre la foto y desde la miniatura del estado de WhatsApp. */
const ROJO_VENDIDO = '#E02B20';

const fuenteSello = (altoLin) => '900 ' + Math.round(altoLin * 0.40) + 'px ' + FUENTE;

function medirSello(g, altoLin){
  g.font = fuenteSello(altoLin);
  return g.measureText('VENDIDO').width + altoLin * 0.44;
}

/** Pastilla roja con la palabra VENDIDO, alineada a la línea de la prenda. */
function dibujarSello(g, x, y, altoLin){
  g.font = fuenteSello(altoLin);
  const anchoTexto = g.measureText('VENDIDO').width;
  const alto = Math.round(altoLin * 0.60);
  const ancho = Math.round(anchoTexto + altoLin * 0.44);
  const arriba = y - Math.round(alto * 0.78);
  const r = alto / 2;

  g.beginPath();
  if (g.roundRect) g.roundRect(x, arriba, ancho, alto, r);
  else {
    g.moveTo(x + r, arriba);
    g.arcTo(x + ancho, arriba, x + ancho, arriba + alto, r);
    g.arcTo(x + ancho, arriba + alto, x, arriba + alto, r);
    g.arcTo(x, arriba + alto, x, arriba, r);
    g.arcTo(x, arriba, x + ancho, arriba, r);
  }
  g.fillStyle = ROJO_VENDIDO;
  g.fill();

  g.fillStyle = '#FFFFFF';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('VENDIDO', x + ancho / 2, arriba + alto / 2 + Math.round(alto * 0.04));
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}

/** Recorta un texto con … si no cabe en el ancho dado. */
function recortar(g, texto, maxAncho){
  if (g.measureText(texto).width <= maxAncho) return texto;
  let t = texto;
  while (t.length > 1 && g.measureText(t + '…').width > maxAncho) t = t.slice(0, -1);
  return t + '…';
}

function dibujarMarcador(g, W, H, x, y, numero, vendida){
  const r = Math.round(W * 0.042);
  const cx = Math.max(r + 8, Math.min(W - r - 8, x * W));
  const cy = Math.max(r + 8, Math.min(H - r - 8, y * H));

  g.save();
  g.shadowColor = 'rgba(11,39,35,0.45)';
  g.shadowBlur  = Math.round(W * 0.014);
  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2);
  g.fillStyle = vendida ? ROJO_VENDIDO : '#D69A2D'; g.fill();
  g.restore();

  g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2);
  g.lineWidth = Math.max(2, Math.round(W * 0.005));
  g.strokeStyle = '#FBF7F0'; g.stroke();

  g.fillStyle = vendida ? '#FBF7F0' : '#0B2723';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '900 ' + Math.round(r * 1.15) + 'px ' + FUENTE;
  g.fillText(String(numero), cx, cy + Math.round(r * 0.06));
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}

/**
 * Arma la imagen que se publica: foto + logo + una línea por prenda.
 * `prendas` va en orden; las vendidas salen atenuadas con su sello.
 */
async function componer(fotoBlob, prendas, opciones){
  opciones = opciones || {};
  const url = URL.createObjectURL(fotoBlob);
  try{
    const foto = await cargarImagen(url);
    const W = 1080;
    const H = Math.round(foto.height / foto.width * W);
    const c = $('#lienzo');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.drawImage(foto, 0, 0, W, H);

    const margen  = Math.round(W * 0.055);
    const varias  = prendas.length > 1;
    const altoLin = varias ? Math.round(H * 0.070) : 0;
    const franja  = varias
      ? Math.min(Math.round(H * 0.55), Math.round(H * 0.13 + altoLin * prendas.length))
      : Math.round(H * 0.30);

    const deg = g.createLinearGradient(0, H - franja, 0, H);
    deg.addColorStop(0,    'rgba(11,39,35,0)');
    deg.addColorStop(0.45, 'rgba(11,39,35,0.58)');
    deg.addColorStop(1,    'rgba(11,39,35,0.94)');
    g.fillStyle = deg;
    g.fillRect(0, H - franja, W, franja);

    const base = H - Math.round(H * 0.048);

    // Pie fijo
    g.fillStyle = 'rgba(251,247,240,0.62)';
    g.font = '700 ' + Math.round(H * 0.021) + 'px ' + FUENTE;
    g.fillText(opciones.pie || 'PIEZA ÚNICA · DISPONIBLE HOY', margen, base);

    if (!varias){
      // ---------- Una sola prenda: precio grande, como siempre ----------
      const p = prendas[0] || {};
      let detalle = 'Talla ' + (p.talla || '—');
      if (p.marca && p.marca.trim()) detalle += '   ·   ' + p.marca.trim();
      if (p.tipo) detalle = p.tipo + '   ·   ' + detalle;

      g.fillStyle = '#FBF7F0';
      g.font = '600 ' + Math.round(H * 0.031) + 'px ' + FUENTE;
      g.fillText(recortar(g, detalle, W - margen * 2), margen, base - Math.round(H * 0.038));

      g.fillStyle = '#D69A2D';
      g.font = '800 ' + Math.round(H * 0.072) + 'px ' + FUENTE;
      g.fillText(quetzales(p.precio), margen, base - Math.round(H * 0.085));

    } else {
      // ---------- Varias prendas: una línea numerada por prenda ----------
      let y = base - Math.round(H * 0.042);
      for (let i = prendas.length - 1; i >= 0; i--){
        const p = prendas[i];
        const apagada = !!p.vendido;
        let x = margen;

        // círculo con el número
        const r = Math.round(altoLin * 0.34);
        g.beginPath(); g.arc(x + r, y - r * 0.55, r, 0, Math.PI * 2);
        g.fillStyle = apagada ? ROJO_VENDIDO : '#D69A2D';
        g.fill();
        g.fillStyle = apagada ? '#FBF7F0' : '#0B2723';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = '900 ' + Math.round(r * 1.2) + 'px ' + FUENTE;
        g.fillText(String(i + 1), x + r, y - r * 0.5);
        g.textAlign = 'left'; g.textBaseline = 'alphabetic';
        x += r * 2 + Math.round(W * 0.022);

        const tipo = (p.tipo || 'Prenda').toUpperCase();
        const txtPrecio = quetzales(p.precio);
        let cola = 'Talla ' + (p.talla || '—');
        if (p.marca && p.marca.trim()) cola += ' · ' + p.marca.trim();

        // Si el vendedor escribió un tipo largo ("Chumpa de cuero"), encogemos
        // la línea hasta que quepa en vez de que se salga de la foto.
        const hueco = W - margen - x;
        const sep = Math.round(W * 0.020);
        // el sello VENDIDO va aparte, en rojo fuerte, no diluido en la talla
        const anchoSello = apagada ? medirSello(g, altoLin) + sep : 0;
        const ancho = (k) => {
          g.font = '800 ' + Math.round(altoLin * 0.40 * k) + 'px ' + FUENTE;
          const a = g.measureText(tipo).width;
          g.font = '900 ' + Math.round(altoLin * 0.50 * k) + 'px ' + FUENTE;
          const b = g.measureText(txtPrecio).width;
          g.font = '600 ' + Math.round(altoLin * 0.34 * k) + 'px ' + FUENTE;
          return a + b + g.measureText(cola).width + sep * 2 + anchoSello;
        };
        let k = 1;
        while (k > 0.60 && ancho(k) > hueco) k -= 0.06;

        // tipo
        g.fillStyle = apagada ? 'rgba(251,247,240,0.45)' : '#FBF7F0';
        g.font = '800 ' + Math.round(altoLin * 0.40 * k) + 'px ' + FUENTE;
        g.fillText(tipo, x, y);
        x += g.measureText(tipo).width + sep;

        // precio
        g.fillStyle = apagada ? 'rgba(224,43,32,0.92)' : '#D69A2D';
        g.font = '900 ' + Math.round(altoLin * 0.50 * k) + 'px ' + FUENTE;
        g.fillText(txtPrecio, x, y);
        x += g.measureText(txtPrecio).width + sep;

        // talla y marca (lo último que se recorta si aún no cabe)
        g.fillStyle = apagada ? 'rgba(251,247,240,0.55)' : 'rgba(251,247,240,0.88)';
        g.font = '600 ' + Math.round(altoLin * 0.34 * k) + 'px ' + FUENTE;
        const anchoCola = W - margen - x - (apagada ? medirSello(g, altoLin) + sep : 0);
        const colaFinal = recortar(g, cola, anchoCola);
        g.fillText(colaFinal, x, y);

        // sello VENDIDO: pastilla roja fuerte al final de la línea
        if (apagada){
          x += g.measureText(colaFinal).width + sep;
          dibujarSello(g, x, y, altoLin);
        }

        y -= altoLin;
      }

      // marcadores sobre la foto
      prendas.forEach((p, i) => {
        if (typeof p.x === 'number' && typeof p.y === 'number'){
          dibujarMarcador(g, W, H, p.x, p.y, i + 1, !!p.vendido);
        }
      });
    }

    // Sello VENDIDO grande, solo cuando hay UNA prenda: si son varias, cada
    // línea ya lleva su propia pastilla roja y la franja taparía los marcadores.
    if (opciones.vendida && !varias){
      const altoFranja = Math.round(H * 0.115);
      const yFranja = H - franja - Math.round(H * 0.012) - altoFranja;
      const yy = Math.max(Math.round(H * 0.10), yFranja);
      g.fillStyle = ROJO_VENDIDO;
      g.fillRect(0, yy, W, altoFranja);
      g.fillStyle = '#FFFFFF';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      try{ g.letterSpacing = '0.16em'; }catch(e){}
      g.font = '900 ' + Math.round(altoFranja * 0.66) + 'px ' + FUENTE;
      g.fillText('VENDIDO', W / 2, yy + altoFranja / 2 + Math.round(altoFranja * 0.03));
      g.textAlign = 'left'; g.textBaseline = 'alphabetic';
      try{ g.letterSpacing = '0px'; }catch(e){}
    }

    // Logo arriba a la derecha, sin recuadro. El resplandor claro deja que
    // "Boutique" se lea también sobre fotos oscuras.
    try{
      const logo = await cargarImagen(LOGO_URL);
      const lw = Math.round(W * 0.30);
      const lh = Math.round(logo.height / logo.width * lw);
      g.save();
      g.shadowColor = 'rgba(255,255,255,0.55)';
      g.shadowBlur  = Math.round(W * 0.012);
      g.drawImage(logo, W - lw - margen, margen, lw, lh);
      g.shadowColor = 'rgba(0,0,0,0.18)';
      g.shadowBlur  = Math.round(W * 0.008);
      g.drawImage(logo, W - lw - margen, margen, lw, lh);
      g.restore();
    }catch(e){ /* si el logo no carga, la foto igual sirve */ }

    return await aBlob(c);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* --------------------------------------------------- SUPABASE (REST API) */
// Las llaves nuevas ("sb_publishable_…") van SOLO en la cabecera apikey.
const LLAVE_NUEVA = String(CFG.SUPABASE_ANON_KEY || '').startsWith('sb_');

function cab(extra){
  const base = { apikey: CFG.SUPABASE_ANON_KEY };
  if (!LLAVE_NUEVA) base.Authorization = 'Bearer ' + CFG.SUPABASE_ANON_KEY;
  return Object.assign(base, extra || {});
}
const urlPublica = (ruta) => CFG.SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + ruta;

async function subirFoto(ruta, blob){
  const r = await fetch(CFG.SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + ruta, {
    method:'POST',
    headers: cab({ 'Content-Type':'image/jpeg', 'x-upsert':'true', 'cache-control':'31536000' }),
    body: blob
  });
  if (!r.ok && r.status !== 409) throw new Error('storage ' + r.status + ' ' + await r.text());
  return urlPublica(ruta);
}
async function guardarFilas(filas){
  if (!filas.length) return;
  const r = await fetch(CFG.SUPABASE_URL + '/rest/v1/prendas', {
    method:'POST',
    headers: cab({ 'Content-Type':'application/json', Prefer:'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify(filas)
  });
  if (!r.ok) throw new Error('rest ' + r.status + ' ' + await r.text());
}
const filaDe = (p, f) => ({
  id: p.id, grupo: p.grupo, tienda: p.tienda, tipo: p.tipo || '',
  precio: parseFloat(p.precio) || 0, talla: p.talla || '', marca: p.marca || '',
  vendido: !!p.vendido, x: p.x == null ? null : p.x, y: p.y == null ? null : p.y,
  foto_url: (f && f.foto_url) || null, fecha_creacion: p.fecha_creacion,
  actualizado: new Date().toISOString()
});

/* --------------------------------------------------------------- COLA */
async function encolar(id, op, extra){
  await dbGuardar('cola', Object.assign({ id, op, t: Date.now() }, extra || {}));
  actualizarSync();
  sincronizar();
}

let _sinc = false;
async function sincronizar(){
  if (!NUBE || _sinc || !navigator.onLine){ actualizarSync(); return; }
  _sinc = true; S.sincronizando = true; actualizarSync();
  try{
    const cola = (await dbTodo('cola')).sort((a,b) => a.t - b.t);
    for (const item of cola){
      try{
        if (item.op === 'borrarGrupo'){
          await fetch(CFG.SUPABASE_URL + '/rest/v1/prendas?grupo=eq.' + encodeURIComponent(item.id),
            { method:'DELETE', headers: cab() }).catch(()=>{});
          if (item.ruta){
            await fetch(CFG.SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + item.ruta,
              { method:'DELETE', headers: cab() }).catch(()=>{});
          }
        } else if (item.op === 'borrarPrenda'){
          await fetch(CFG.SUPABASE_URL + '/rest/v1/prendas?id=eq.' + encodeURIComponent(item.id),
            { method:'DELETE', headers: cab() }).catch(()=>{});
        } else {
          const f = await dbLeer('fotos', item.id);
          if (!f){ await dbBorrar('cola', item.id); continue; }
          if (!f.foto_url && f.blob){
            const ruta = f.tienda + '/' + f.grupo + '.jpg';
            f.foto_url = await subirFoto(ruta, f.blob);
            f.ruta = ruta;
            await dbGuardar('fotos', f);
          }
          const todas = await dbTodo('prendas');
          await guardarFilas(todas.filter(p => p.grupo === f.grupo).map(p => filaDe(p, f)));
        }
        await dbBorrar('cola', item.id);
      }catch(e){
        console.warn('No se pudo sincronizar', item.id, e);
        break;   // sin señal: reintenta después, sin perder nada
      }
    }
  } finally {
    _sinc = false; S.sincronizando = false;
    await actualizarSync();
  }
}

/** Recupera el historial de la tienda en un teléfono nuevo o formateado. */
async function traerDeLaNube(){
  if (!NUBE || !navigator.onLine || !S.tienda) return;
  try{
    const r = await fetch(CFG.SUPABASE_URL + '/rest/v1/prendas?select=*&tienda=eq.' +
      encodeURIComponent(S.tienda) + '&order=fecha_creacion.desc&limit=1500', { headers: cab() });
    if (!r.ok) return;
    const filas = await r.json();
    const locales = new Set((await dbTodo('prendas')).map(p => p.id));
    const gruposLocales = new Set((await dbTodo('fotos')).map(f => f.grupo));
    let nuevas = 0;

    for (const fl of filas){
      const grupo = fl.grupo || fl.id;
      if (!gruposLocales.has(grupo)){
        await dbGuardar('fotos', {
          grupo, tienda: fl.tienda, blob: null, foto_url: fl.foto_url,
          ruta: fl.tienda + '/' + grupo + '.jpg', fecha_creacion: fl.fecha_creacion
        });
        gruposLocales.add(grupo);
      }
      if (locales.has(fl.id)) continue;
      await dbGuardar('prendas', {
        id: fl.id, grupo, tienda: fl.tienda, tipo: fl.tipo || '', precio: fl.precio,
        talla: fl.talla, marca: fl.marca, vendido: fl.vendido,
        x: fl.x, y: fl.y, fecha_creacion: fl.fecha_creacion
      });
      nuevas++;
    }
    if (nuevas){ await cargarDatos(); pintar(); }
  }catch(e){ console.warn('No se pudo leer la nube:', e); }
}

async function actualizarSync(){
  S.pendientes = (await dbTodo('cola')).length;
  const el = $('#sync');
  if (el) el.outerHTML = htmlSync();
}

/* ------------------------------------------------------------- DATOS */
async function cargarDatos(){
  const [fotos, prendas] = await Promise.all([dbTodo('fotos'), dbTodo('prendas')]);
  const porGrupo = new Map();
  prendas.filter(p => p.tienda === S.tienda).forEach(p => {
    if (!porGrupo.has(p.grupo)) porGrupo.set(p.grupo, []);
    porGrupo.get(p.grupo).push(p);
  });
  S.fotos = fotos
    .filter(f => f.tienda === S.tienda && porGrupo.has(f.grupo))
    .map(f => Object.assign({}, f, {
      prendas: porGrupo.get(f.grupo).sort((a,b) => (a.orden||0) - (b.orden||0))
    }))
    .sort((a,b) => (b.fecha_creacion || '').localeCompare(a.fecha_creacion || ''));
}

async function guardarSiHaceFalta(){
  if (S.grupoGuardado) return S.grupoGuardado;
  const grupo = uid();
  const fecha = new Date().toISOString();
  await dbGuardar('fotos', {
    grupo, tienda: S.tienda, blob: S.fotoBlob,
    foto_url: null, ruta: null, fecha_creacion: fecha
  });
  for (let i = 0; i < S.marcas.length; i++){
    const m = S.marcas[i];
    await dbGuardar('prendas', {
      id: uid(), grupo, tienda: S.tienda, orden: i,
      tipo: m.tipo || '', precio: m.precio, talla: m.talla, marca: m.marca,
      x: m.x, y: m.y, vendido: false, fecha_creacion: fecha
    });
  }
  S.grupoGuardado = grupo;
  await encolar(grupo, 'subir');
  await cargarDatos();
  toast(S.marcas.length > 1 ? 'Guardadas en el inventario' : 'Guardada en el inventario');
  return grupo;
}

async function alternarVendido(id){
  const p = await dbLeer('prendas', id);
  if (!p) return;
  p.vendido = !p.vendido;
  await dbGuardar('prendas', p);
  await encolar(p.grupo, 'subir');
  await cargarDatos();
  pintar();

  if (!p.vendido){ toast('Otra vez disponible'); return; }

  const f = S.fotos.find(x => x.grupo === p.grupo);
  const quedan = f ? f.prendas.filter(x => !x.vendido).length : 0;
  modal({
    titulo: '¿Avisar que se vendió?',
    texto: quedan
      ? 'Publica la foto otra vez: ' + (p.tipo || 'la prenda') + ' sale marcada como vendida y ' +
        'las otras ' + (quedan === 1 ? 'sigue' : 'siguen') + ' con su precio.'
      : 'Publica la misma foto con el sello VENDIDO encima. Sirve para que la gente vea ' +
        'que la ropa se mueve rápido y no deje pasar la siguiente.',
    si: 'Sí, publicar', no: 'No, gracias',
    alConfirmar: () => compartirFoto(p.grupo)
  });
}

async function eliminarPrenda(id){
  const p = await dbLeer('prendas', id);
  if (!p) return;
  await dbBorrar('prendas', id);
  await encolar(id, 'borrarPrenda');
  const quedan = (await dbTodo('prendas')).filter(x => x.grupo === p.grupo);
  if (!quedan.length) await eliminarFoto(p.grupo, true);
  await cargarDatos();
  pintar();
  toast('Prenda eliminada');
}

async function eliminarFoto(grupo, silencioso){
  const f = await dbLeer('fotos', grupo);
  const prendas = (await dbTodo('prendas')).filter(p => p.grupo === grupo);
  for (const p of prendas) await dbBorrar('prendas', p.id);
  await dbBorrar('fotos', grupo);
  if (urls.has(grupo)){ URL.revokeObjectURL(urls.get(grupo)); urls.delete(grupo); }
  await encolar(grupo, 'borrarGrupo', { ruta: f && f.ruta });
  if (!silencioso){ await cargarDatos(); pintar(); toast('Publicación eliminada'); }
}

/* --------------------------------------------------------- COMPARTIR */
async function blobFoto(f){
  if (f.blob) return f.blob;
  if (f.foto_url){
    const r = await fetch(f.foto_url);
    return await r.blob();
  }
  return null;
}
function puedeCompartirArchivos(){
  try{
    const prueba = new File([new Blob([''], { type:'image/jpeg' })], 'p.jpg', { type:'image/jpeg' });
    return !!(navigator.canShare && navigator.canShare({ files:[prueba] }));
  }catch(e){ return false; }
}
/** Devuelve 'compartido' | 'descargado' | 'cancelado'. */
async function compartir(blob, texto){
  const archivo = new File([blob], 'prenda.jpg', { type:'image/jpeg' });
  if (puedeCompartirArchivos()){
    try{
      await navigator.share({ files:[archivo], text: texto || '' });
      return 'compartido';
    }catch(e){
      if (e && e.name === 'AbortError') return 'cancelado';
    }
  }
  descargar(blob);
  toast('Imagen descargada — compártela desde la galería');
  return 'descargado';
}
function descargar(blob){
  const u = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = u; a.download = 'prenda-' + Date.now() + '.jpg';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(u), 4000);
}

function textoDe(prendas, todasVendidas){
  if (todasVendidas) return '¡VENDIDA! Vintage Boutique — cada prenda es única: la que te gusta, no espera.';
  const partes = prendas.filter(p => !p.vendido).map(p =>
    (p.tipo ? p.tipo + ' ' : '') + quetzales(p.precio) + ' talla ' + (p.talla || '—') +
    (p.marca ? ' ' + p.marca : ''));
  return partes.join('  ·  ') + ' — pieza única, disponible hoy en Vintage Boutique.';
}

/** Las publicaciones hechas con la versión anterior ya traen el precio
 *  quemado en la imagen: se comparten tal cual, solo agregándoles el sello. */
function esLegado(f){
  return f.legado === true || (!f.blob && f.prendas.some(p => p.x == null));
}
async function selloEncima(blobImagen){
  const url = URL.createObjectURL(blobImagen);
  try{
    const im = await cargarImagen(url);
    const W = im.width, H = im.height;
    const c = $('#lienzo'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.drawImage(im, 0, 0);
    const alto = Math.round(H * 0.115);
    const y = Math.round(H * 0.795) - alto;
    g.fillStyle = ROJO_VENDIDO;
    g.fillRect(0, y, W, alto);
    g.fillStyle = '#FFFFFF';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    try{ g.letterSpacing = '0.16em'; }catch(e){}
    g.font = '900 ' + Math.round(alto * 0.66) + 'px ' + FUENTE;
    g.fillText('VENDIDO', W / 2, y + alto / 2 + Math.round(alto * 0.03));
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    try{ g.letterSpacing = '0px'; }catch(e){}
    return await aBlob(c);
  } finally { URL.revokeObjectURL(url); }
}

/** Recompone y comparte una publicación ya guardada (respeta lo vendido). */
async function compartirFoto(grupo){
  const f = S.fotos.find(x => x.grupo === grupo);
  if (!f){ toast('No se pudo abrir la foto'); return; }
  const base = await blobFoto(f);
  if (!base){ toast('No se pudo abrir la foto'); return; }
  toast('Preparando la imagen…');
  const todasVendidas = f.prendas.every(p => p.vendido);

  const img = esLegado(f)
    ? (todasVendidas ? await selloEncima(base) : base)
    : await componer(base, f.prendas, {
        vendida: todasVendidas,
        pie: todasVendidas ? 'PIEZA ÚNICA · YA SE VENDIÓ' : 'PIEZA ÚNICA · DISPONIBLE HOY'
      });

  await compartir(img, textoDe(f.prendas, todasVendidas));
}

/* ------------------------------------------------ DETECCIÓN AUTOMÁTICA */
/** Llama a la Edge Function de Supabase que mira la foto y devuelve las
 *  prendas que trae puestas el maniquí, con su posición. Si no está
 *  configurada o falla, la vendedora las marca tocando la foto. */
async function detectarPrendas(blob){
  if (!FN_DETECTAR) return null;
  // Mandamos una copia chica: para ubicar las prendas sobra, y así la
  // detección cuesta y tarda unas 3 veces menos.
  const chica = await comprimirA(blob, 800);
  const b64 = await new Promise(ok => {
    const fr = new FileReader();
    fr.onload = () => ok(String(fr.result).split(',')[1]);
    fr.readAsDataURL(chica);
  });
  const r = await fetch(FN_DETECTAR, {
    method:'POST',
    headers: cab({ 'Content-Type':'application/json' }),
    body: JSON.stringify({ imagen: b64 })
  });
  if (!r.ok) throw new Error('detección ' + r.status);
  const datos = await r.json();
  return (datos.prendas || []).slice(0, 4);
}

/* --------------------------------------------------------------- UI */
function toast(msg){
  const viejo = $('#toast'); if (viejo) viejo.remove();
  const d = document.createElement('div');
  d.id = 'toast'; d.className = 'toast'; d.textContent = msg;
  document.body.appendChild(d);
  setTimeout(() => { if (d.parentNode) d.remove(); }, 2400);
}

function modal({ titulo, texto, si, no, alConfirmar, alCerrar, enlace, tono }){
  const velo = document.createElement('div');
  velo.className = 'velo';
  const claseSi = tono === 'peligro' ? 'btn-si' : 'btn-ok';
  const accion = enlace
    ? '<a class="' + claseSi + '" href="' + esc(enlace) + '" target="_blank" rel="noopener" ' +
      'data-x="si" style="flex:1;text-align:center;text-decoration:none;padding:14px;' +
      'border-radius:14px;font-size:15px;font-weight:800;display:block">' + esc(si) + '</a>'
    : '<button class="' + claseSi + '" data-x="si">' + esc(si) + '</button>';
  velo.innerHTML =
    '<div class="modal"><h3>' + esc(titulo) + '</h3><p>' + esc(texto) + '</p>' +
    '<div class="fila">' +
      (no ? '<button class="btn-no" data-x="no">' + esc(no) + '</button>' : '') +
      accion +
    '</div></div>';
  velo.addEventListener('click', (e) => {
    const x = e.target.getAttribute && e.target.getAttribute('data-x');
    if (x === 'si'){ velo.remove(); if (alConfirmar) alConfirmar(); if (alCerrar) alCerrar(); }
    else if (x === 'no' || e.target === velo){ velo.remove(); if (alCerrar) alCerrar(); }
  });
  document.body.appendChild(velo);
}

function htmlSync(){
  if (!NUBE) return '<div id="sync" class="sync off"><span class="dot"></span>' +
    '<span class="txt">Guardando solo en este teléfono</span></div>';
  if (!navigator.onLine) return '<div id="sync" class="sync off"><span class="dot"></span>' +
    '<span class="txt">Sin internet — se guarda aquí y se sube después</span></div>';
  if (S.sincronizando) return '<div id="sync" class="sync pend"><span class="dot"></span>' +
    '<span class="txt">Subiendo a la nube…</span></div>';
  if (S.pendientes) return '<div id="sync" class="sync pend"><span class="dot"></span>' +
    '<span class="txt">' + S.pendientes + ' pendiente' + (S.pendientes > 1 ? 's' : '') + ' de subir</span></div>';
  return '<div id="sync" class="sync"><span class="dot"></span>' +
    '<span class="txt">Todo respaldado en la nube</span></div>';
}

function nombreTienda(){
  const t = TIENDAS.find(x => x.id === S.tienda);
  return t ? t.nombre : '';
}

/* ------------------------------------------------------------ CÁMARA */
let _stream = null;
let _camaraTrasera = true;

async function abrirCamara(){
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    $('#filecam').click(); return;   // respaldo: cámara del sistema
  }
  try{
    _stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: _camaraTrasera ? { ideal: 'environment' } : { ideal: 'user' },
        width:  { ideal: 2160 },
        height: { ideal: 2880 }
      },
      audio: false
    });
  }catch(e){
    console.warn('Cámara no disponible, usamos la del sistema', e);
    $('#filecam').click();
    return;
  }

  const capa = document.createElement('div');
  capa.className = 'camara';
  capa.id = 'camara';
  capa.innerHTML =
    '<video id="video" playsinline autoplay muted></video>' +
    '<div class="cam-guia"></div>' +
    '<div class="cam-barra">' +
      '<button class="cam-ic" data-cam="cerrar" aria-label="Cerrar">' + I.cerrar + '</button>' +
      '<button class="cam-obt" data-cam="foto" aria-label="Tomar foto"><span></span></button>' +
      '<button class="cam-ic" data-cam="girar" aria-label="Girar cámara">' + I.girar + '</button>' +
    '</div>' +
    '<div class="cam-tip">Encuadra la prenda completa</div>';
  document.body.appendChild(capa);

  const v = $('#video');
  v.srcObject = _stream;
  try{ await v.play(); }catch(e){}
}

function cerrarCamara(){
  if (_stream){ _stream.getTracks().forEach(t => t.stop()); _stream = null; }
  const c = $('#camara'); if (c) c.remove();
}

async function dispararFoto(){
  const v = $('#video');
  if (!v || !v.videoWidth) return;
  const c = document.createElement('canvas');
  c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext('2d').drawImage(v, 0, 0);
  const blob = await aBlob(c);
  cerrarCamara();
  await usarFoto(blob);
}

async function usarFoto(blob){
  toast('Preparando la foto…');
  try{
    S.fotoBlob = await comprimir(blob);
    if (S.previaURL) URL.revokeObjectURL(S.previaURL);
    S.previaURL = URL.createObjectURL(S.fotoBlob);
    S.marcas = [];
    S.paso = 2;
    pintar();
    intentarDeteccion();
  }catch(err){
    console.error(err); toast('No se pudo leer la foto');
  }
}

async function intentarDeteccion(){
  if (!FN_DETECTAR || !navigator.onLine || !S.fotoBlob) return;
  const av = $('#detectando'); if (av) av.classList.remove('oculto');
  try{
    const encontradas = await detectarPrendas(S.fotoBlob);
    if (encontradas && encontradas.length && !S.marcas.length){
      S.marcas = encontradas.map(p => ({
        tipo: p.tipo || '', precio: '', talla: '', marca: '',
        x: Math.min(0.95, Math.max(0.05, p.x)), y: Math.min(0.95, Math.max(0.05, p.y))
      }));
      pintar();
      toast(S.marcas.length + (S.marcas.length === 1 ? ' prenda encontrada' : ' prendas encontradas'));
    }
  }catch(e){
    console.warn('Detección no disponible', e);
  } finally {
    const a = $('#detectando'); if (a) a.classList.add('oculto');
  }
}

/* ------------------------------------------------------------ PANTALLAS */
function vistaBienvenida(){
  return '<div class="bienvenida">' +
    '<img src="' + LOGO_CLARO + '" alt="Vintage Boutique">' +
    '<h2>¿En qué tienda estás?</h2>' +
    '<p>Elige tu tienda una sola vez. Cada tienda ve su propio inventario.</p>' +
    TIENDAS.map(t =>
      '<button class="big mustard" data-tienda="' + esc(t.id) + '">' +
        '<span class="ic">' + I.etiqueta + '</span>' +
        '<span><span class="lbl">Tienda ' + esc(t.id) + '</span>' +
        '<span class="sub">' + esc(t.nombre) + '</span></span>' +
      '</button>'
    ).join('') +
  '</div>';
}

function vistaHome(){
  const lista = S.fotos.filter(f =>
    S.filtro === 'disponibles' ? f.prendas.some(p => !p.vendido) :
    S.filtro === 'vendidos'    ? f.prendas.every(p => p.vendido) : true);

  let disponibles = 0;
  S.fotos.forEach(f => f.prendas.forEach(p => { if (!p.vendido) disponibles++; }));

  const cuerpo = lista.length === 0
    ? '<div class="vacio">' + I.etiqueta + '<p>' +
        (S.filtro === 'vendidos' ? 'Todavía no hay prendas vendidas'
         : 'Todavía no hay prendas.<br>Toca el botón <b>+</b> para agregar la primera.') +
      '</p></div>'
    : '<div class="grid">' + lista.map(f => {
        const todas = f.prendas.every(p => p.vendido);
        return '<div class="card">' +
          '<div class="ph">' +
            '<img src="' + esc(urlFoto(f)) + '" alt="Prenda" loading="lazy">' +
            (f.prendas.length > 1 ? f.prendas.map((p, i) =>
              (typeof p.x === 'number'
                ? '<span class="pin' + (p.vendido ? ' v' : '') + '" style="left:' +
                  (p.x*100).toFixed(1) + '%;top:' + (p.y*100).toFixed(1) + '%">' + (i+1) + '</span>'
                : '')).join('') : '') +
            (todas ? '<div class="badge">VENDIDO</div>' : '') +
          '</div>' +
          '<div class="info">' +
            f.prendas.map((p, i) =>
              '<div class="renglon' + (p.vendido ? ' vend' : '') + '">' +
                (f.prendas.length > 1 ? '<span class="num">' + (i+1) + '</span>' : '') +
                '<span class="tx">' +
                  '<b>' + esc(quetzales(p.precio)) + '</b>' +
                  '<i>' + (p.tipo ? esc(p.tipo) + ' · ' : '') + 'Talla ' + esc(p.talla || '—') +
                    (p.marca ? ' · ' + esc(p.marca) : '') + '</i>' +
                '</span>' +
                '<button class="tg' + (p.vendido ? ' done' : '') + '" data-vendido="' + esc(p.id) + '">' +
                  (p.vendido ? I.deshacer : I.check) + '</button>' +
              '</div>').join('') +
            '<div class="card-acciones">' +
              '<button class="mini s" data-share="' + esc(f.grupo) + '">' + I.compartir + 'Compartir</button>' +
              '<button class="mini b" data-borrar="' + esc(f.grupo) + '" aria-label="Eliminar">' + I.basura + '</button>' +
            '</div>' +
          '</div>' +
        '</div>'; }).join('') + '</div>';

  return '<div class="hdr">' +
      '<span class="hdr-logo"><img src="' + LOGO_CLARO + '" alt="Vintage Boutique"></span>' +
      '<div><h1>Mis prendas</h1>' +
      '<div class="sub">' + disponibles + ' disponible' + (disponibles === 1 ? '' : 's') +
        ' · ' + esc(nombreTienda()) + '</div></div>' +
      '<div class="spacer"></div>' +
      '<button class="iconbtn" data-ajustes="1" aria-label="Ajustes">' + I.config + '</button>' +
    '</div>' +
    htmlSync() +
    '<div class="body">' +
      '<div class="filtros">' +
        ['disponibles','vendidos','todos'].map(k =>
          '<button class="chip' + (S.filtro === k ? ' on' : '') + '" data-filtro="' + k + '">' +
          k.charAt(0).toUpperCase() + k.slice(1) + '</button>').join('') +
      '</div>' + cuerpo +
    '</div>' +
    '<button class="fab" data-nueva="1" aria-label="Agregar prenda">' + I.mas + '</button>';
}

function editorPrenda(){
  const i = S.editando;
  if (i == null || !S.marcas[i]) return '';
  const m = S.marcas[i];
  return '<div class="velo" id="editor">' +
    '<div class="hoja">' +
      '<div class="hoja-hdr">' +
        '<b>Prenda ' + (i + 1) + '</b>' +
        '<button class="iconbtn chico" data-cerraredit="1" aria-label="Cerrar">' + I.cerrar + '</button>' +
      '</div>' +
      '<div class="campo"><label>¿Qué prenda es?</label>' +
        '<input id="e-tipo" type="text" placeholder="Ej. Blusa, Pantalón, Bolsa…" ' +
        'maxlength="28" value="' + esc(m.tipo) + '"></div>' +
      '<div class="campo"><label>Precio (Q)</label>' +
        '<input id="e-precio" class="grande" type="number" inputmode="decimal" placeholder="0.00" ' +
        'value="' + esc(m.precio) + '"></div>' +
      '<div class="campo"><label>Talla</label>' +
        '<input id="e-talla" type="text" placeholder="Ej. M, 32, 8, Única…" value="' + esc(m.talla) + '">' +
        '<p class="ayuda">Escríbela tal como viene en la prenda.</p></div>' +
      '<div class="campo"><label>Marca <span class="opt">(opcional)</span></label>' +
        '<input id="e-marca" type="text" placeholder="Ej. Levi\'s, Nike…" value="' + esc(m.marca) + '"></div>' +
      '<div class="hoja-pie">' +
        '<button class="btn-no" data-quitar="' + i + '">Quitar</button>' +
        '<button class="btn-ok" data-cerraredit="1">Listo</button>' +
      '</div>' +
    '</div></div>';
}

function vistaAgregar(){
  const titulo = S.paso === 1 ? 'Tomar foto'
              : S.paso === 2 ? 'Marcar las prendas'
              : 'Lista para publicar';
  let cuerpo = '';

  if (S.paso === 1){
    cuerpo =
      '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;padding:44px 0">' +
        '<div style="width:158px;height:158px;border-radius:34px;background:var(--teal);color:var(--cream);display:flex;align-items:center;justify-content:center">' +
          '<span style="width:66px;height:66px;display:block">' + I.camara + '</span></div>' +
        '<p style="text-align:center;max-width:280px;line-height:1.45;margin:0">' +
          'Toca el botón para abrir la cámara y fotografiar la prenda.</p>' +
        '<div style="width:100%;max-width:300px;display:flex;flex-direction:column;gap:11px">' +
          '<button class="big mustard" data-camara="1">' +
            '<span class="ic">' + I.camara + '</span>' +
            '<span><span class="lbl">Abrir cámara</span></span></button>' +
          '<button class="big ghost" data-galeria="1">' +
            '<span class="ic">' + I.bajar + '</span>' +
            '<span><span class="lbl">Elegir de la galería</span></span></button>' +
        '</div>' +
      '</div>';
  }

  if (S.paso === 2){
    const listas = S.marcas.filter(m => m.precio && m.talla).length;
    cuerpo =
      '<div class="marcador" id="marcador">' +
        '<img src="' + esc(S.previaURL || '') + '" alt="Prenda" draggable="false">' +
        S.marcas.map((m, i) =>
          '<span class="pin gr' + (m.precio && m.talla ? '' : ' pend') + '" data-editar="' + i + '" ' +
          'style="left:' + (m.x*100).toFixed(1) + '%;top:' + (m.y*100).toFixed(1) + '%">' + (i+1) + '</span>'
        ).join('') +
        '<div class="detectando oculto" id="detectando"><span class="spin"></span>Buscando prendas…</div>' +
      '</div>' +
      '<p class="pie">Toca sobre cada prenda de la foto para ponerle su precio y talla.</p>' +

      (S.marcas.length
        ? '<div class="listaP">' + S.marcas.map((m, i) =>
            '<div class="itemP' + (m.precio && m.talla ? '' : ' pend') + '" data-editar="' + i + '">' +
              '<span class="num">' + (i+1) + '</span>' +
              '<span class="tx"><b>' + (m.tipo ? esc(m.tipo) : 'Sin definir') + '</b>' +
              '<i>' + (m.precio ? esc(quetzales(m.precio)) : 'Falta el precio') +
              (m.talla ? ' · Talla ' + esc(m.talla) : ' · Falta la talla') + '</i></span>' +
              '<span class="ed">' + I.lapiz + '</span>' +
            '</div>').join('') + '</div>'
        : '') +

      (FN_DETECTAR
        ? '<button class="big ghost" data-detectar="1" style="margin-top:4px">' +
            '<span class="ic">' + I.varita + '</span>' +
            '<span><span class="lbl">Buscar prendas sola</span>' +
            '<span class="sub">La app las marca y tú pones los precios</span></span></button>'
        : '') +

      '<button class="big mustard" data-continuar="1" style="margin-top:10px"' +
        (listas ? '' : ' disabled') + '>' +
        '<span class="ic">' + I.check + '</span>' +
        '<span><span class="lbl">Continuar</span>' +
        (listas ? '<span class="sub">' + listas + (listas === 1 ? ' prenda lista' : ' prendas listas') + '</span>' : '') +
        '</span></button>' +
      editorPrenda();
  }

  if (S.paso === 3){
    cuerpo =
      '<img id="previa3" class="previa" alt="Vista previa"' +
        (S.compuestaURL ? ' src="' + esc(S.compuestaURL) + '"' : '') + '>' +
      '<p class="pie">Así se verá la foto al publicarla, con tu logo incluido.</p>' +
      '<div class="acciones">' +
        '<button class="big mustard" data-compartir="wa">' +
          '<span class="ic">' + I.compartir + '</span><span>' +
          '<span class="lbl">Compartir a WhatsApp</span>' +
          '<span class="sub">Elige “Estado” y confirma</span></span></button>' +
        '<button class="big ghost" data-compartir="tt">' +
          '<span class="ic">' + I.compartir + '</span><span>' +
          '<span class="lbl">Compartir a TikTok</span>' +
          '<span class="sub">Se abre TikTok — solo confirma</span></span></button>' +
        '<button class="big teal" data-guardar="1">' +
          '<span class="ic">' + I.check + '</span><span>' +
          '<span class="lbl">Solo guardar</span>' +
          '<span class="sub">Queda en el inventario, sin publicar</span></span></button>' +
        '<button class="big ghost" data-bajar="1">' +
          '<span class="ic">' + I.bajar + '</span><span>' +
          '<span class="lbl">Guardar en la galería</span></span></button>' +
      '</div>';
  }

  return '<div class="hdr">' +
      '<button class="iconbtn" data-atras="1" aria-label="Atrás">' + I.atras + '</button>' +
      '<div><h1>' + titulo + '</h1></div>' +
    '</div>' +
    '<div class="pasos">' + [1,2,3].map(n =>
      '<i class="' + (n <= S.paso ? 'on' : '') + '"></i>').join('') + '</div>' +
    '<div class="body" style="display:flex;flex-direction:column">' + cuerpo + '</div>';
}

function pintar(){
  const app = $('#app');
  if (!S.tienda)              app.innerHTML = vistaBienvenida();
  else if (S.vista === 'add') app.innerHTML = vistaAgregar();
  else                        app.innerHTML = vistaHome();

  if (S.vista === 'add' && S.paso === 2 && S.editando != null){
    const m = S.marcas[S.editando];
    const ti = $('#e-tipo'), p = $('#e-precio'), t = $('#e-talla'), k = $('#e-marca');
    if (ti) ti.addEventListener('input', e => { m.tipo = e.target.value; });
    if (p) p.addEventListener('input', e => { m.precio = e.target.value; });
    if (t) t.addEventListener('input', e => { m.talla  = e.target.value; });
    if (k) k.addEventListener('input', e => { m.marca  = e.target.value; });
    if (p && !m.precio) setTimeout(() => p.focus(), 120);
  }
}

function reiniciarFlujo(){
  if (S.previaURL)    URL.revokeObjectURL(S.previaURL);
  if (S.compuestaURL) URL.revokeObjectURL(S.compuestaURL);
  S.previaURL = null; S.compuestaURL = null; S.compuestaBlob = null;
  S.fotoBlob = null; S.marcas = []; S.editando = null; S.grupoGuardado = null;
  S.paso = 1; S.vista = 'home';
  pintar();
}

async function prepararPrevia(){
  S.paso = 3; pintar();
  try{
    const listas = S.marcas.filter(m => m.precio && m.talla);
    S.compuestaBlob = await componer(S.fotoBlob, listas, {});
    if (S.compuestaURL) URL.revokeObjectURL(S.compuestaURL);
    S.compuestaURL = URL.createObjectURL(S.compuestaBlob);
    const im = $('#previa3'); if (im) im.src = S.compuestaURL;
  }catch(e){
    console.error(e); toast('No se pudo preparar la imagen');
  }
}

/* ------------------------------------------------------------ EVENTOS */
document.addEventListener('click', async (ev) => {
  // --- toque sobre la foto para agregar un marcador ---
  const lienzoMarcas = ev.target.closest && ev.target.closest('#marcador');
  if (lienzoMarcas && !ev.target.closest('[data-editar]')){
    const img = lienzoMarcas.querySelector('img');
    const r = img.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width;
    const y = (ev.clientY - r.top)  / r.height;
    if (x >= 0 && x <= 1 && y >= 0 && y <= 1 && S.marcas.length < 4){
      S.marcas.push({ tipo:'', precio:'', talla:'', marca:'', x, y });
      S.editando = S.marcas.length - 1;
      pintar();
    } else if (S.marcas.length >= 4){
      toast('Máximo 4 prendas por foto');
    }
    return;
  }

  const el = ev.target.closest('[data-tienda],[data-filtro],[data-nueva],[data-atras],' +
    '[data-camara],[data-galeria],[data-cam],[data-editar],[data-cerraredit],' +
    '[data-quitar],[data-detectar],[data-continuar],[data-guardar],[data-compartir],' +
    '[data-bajar],[data-vendido],[data-borrar],[data-share],[data-ajustes]');
  if (!el) return;
  const d = el.dataset;

  if (d.tienda){
    S.tienda = d.tienda;
    localStorage.setItem('vb_tienda', d.tienda);
    await cargarDatos(); pintar(); traerDeLaNube(); return;
  }
  if (d.filtro){ S.filtro = d.filtro; pintar(); return; }
  if (d.nueva) { S.vista = 'add'; S.paso = 1; pintar(); return; }

  if (d.atras){
    if (S.paso === 1) reiniciarFlujo();
    else { S.paso--; S.editando = null; pintar(); }
    return;
  }

  if (d.camara)  { await abrirCamara(); return; }
  if (d.galeria) { $('#filein').click(); return; }

  if (d.cam){
    if (d.cam === 'cerrar'){ cerrarCamara(); return; }
    if (d.cam === 'foto')  { await dispararFoto(); return; }
    if (d.cam === 'girar') { _camaraTrasera = !_camaraTrasera; cerrarCamara(); await abrirCamara(); return; }
  }

  if (d.editar != null){ S.editando = parseInt(d.editar, 10); pintar(); return; }
  if (d.cerraredit){ S.editando = null; pintar(); return; }
  if (d.quitar != null){
    S.marcas.splice(parseInt(d.quitar, 10), 1);
    S.editando = null; pintar(); return;
  }
  if (d.detectar){
    if (!navigator.onLine){ toast('Necesita internet — márcalas tocando la foto'); return; }
    S.marcas = []; pintar();
    await intentarDeteccion();
    if (!S.marcas.length) toast('No encontró prendas — márcalas tocando la foto');
    return;
  }

  if (d.continuar){ await prepararPrevia(); return; }
  if (d.guardar) { await guardarSiHaceFalta(); reiniciarFlujo(); return; }
  if (d.bajar)   { if (S.compuestaBlob){ descargar(S.compuestaBlob); toast('Guardada en la galería'); } return; }

  if (d.compartir){
    if (!S.compuestaBlob) return;
    const esTikTok = d.compartir === 'tt';
    const listas = S.marcas.filter(m => m.precio && m.talla);
    const texto = esTikTok
      ? 'Vintage Boutique · ' + listas.map(m => quetzales(m.precio)).join(' · ') +
        ' #vintage #ropausada #guatemala #thrift #segundamano'
      : textoDe(listas, false);

    if (esTikTok && puedeCompartirArchivos()) descargar(S.compuestaBlob);
    const r = await compartir(S.compuestaBlob, texto);
    if (r === 'cancelado') return;
    await guardarSiHaceFalta();

    if (esTikTok){
      modal({
        titulo: 'Abrir TikTok',
        texto: 'La foto también quedó guardada en la galería. Si TikTok no se abrió solo, ' +
               'toca el botón: adentro dale a + y elige la foto más reciente.',
        si: 'Abrir TikTok', no: 'Ya está', enlace: TIKTOK_URL, alCerrar: reiniciarFlujo
      });
    } else reiniciarFlujo();
    return;
  }

  if (d.vendido){ await alternarVendido(d.vendido); return; }
  if (d.share)  { await compartirFoto(d.share); return; }

  if (d.borrar){
    const f = S.fotos.find(x => x.grupo === d.borrar);
    const n = f ? f.prendas.length : 1;
    modal({
      titulo: n > 1 ? '¿Eliminar la publicación?' : '¿Eliminar esta prenda?',
      texto: (n > 1 ? 'Se quitan las ' + n + ' prendas de esta foto' : 'Se quita del inventario') +
             ', en este teléfono y en la nube. No se puede deshacer.',
      si:'Sí, eliminar', no:'Cancelar', tono:'peligro',
      alConfirmar: () => eliminarFoto(d.borrar)
    });
    return;
  }

  if (d.ajustes){
    modal({
      titulo:'Cambiar de tienda',
      texto:'Estás en: ' + nombreTienda() + '. Al cambiar verás el inventario de la otra. ' +
            (NUBE ? 'Tus prendas están respaldadas en la nube.' : 'Los datos se guardan solo en este teléfono.'),
      si:'Cambiar de tienda', no:'Cerrar',
      alConfirmar: async () => {
        localStorage.removeItem('vb_tienda');
        S.tienda = null; S.fotos = []; pintar();
      }
    });
    return;
  }
});

['#filein', '#filecam'].forEach(sel => {
  $(sel).addEventListener('change', async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (f) await usarFoto(f);
  });
});

window.addEventListener('online',  () => { actualizarSync(); sincronizar(); traerDeLaNube(); });
window.addEventListener('offline', () => actualizarSync());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) cerrarCamara(); else sincronizar();
});

/* --------------------------------------------------------------- INICIO */
(async function inicio(){
  try{ await cargarDatos(); }catch(e){ console.error('IndexedDB', e); }
  pintar();
  await actualizarSync();
  sincronizar();
  traerDeLaNube();
  setInterval(sincronizar, 60000);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
