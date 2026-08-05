/* =====================================================================
   Vintage Boutique — App de publicación de prendas
   PWA sin dependencias. Funciona sin internet; sincroniza a Supabase
   cuando hay señal. Datos separados por tienda.
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
const TIKTOK_URL = CFG.TIKTOK_URL || 'https://www.tiktok.com/@vintageboutiquegt';
const FUENTE     = '-apple-system, "Segoe UI", Roboto, Arial, sans-serif';
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
  config:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.7 8a1.7 1.7 0 0 0-.4-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V8a1.7 1.7 0 0 0 1.5 1H22a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>'
};

/* ----------------------------------------------------------- UTILIDADES */
const $ = (s) => document.querySelector(s);
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
    const p = indexedDB.open(DB_NOMBRE, 1);
    p.onupgradeneeded = () => {
      const db = p.result;
      if (!db.objectStoreNames.contains('prendas')) db.createObjectStore('prendas', { keyPath:'id' });
      if (!db.objectStoreNames.contains('cola'))    db.createObjectStore('cola',    { keyPath:'id' });
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
  prendas: [],
  fotoOriginal: null,     // Blob de la foto sin editar
  fotoCompuesta: null,    // Blob de la foto final con precio/talla/logo
  previaURL: null,
  precio: '', talla: '', marca: '',
  idGuardado: null,       // evita duplicar si comparte a WhatsApp y luego a TikTok
  pendientes: 0,
  sincronizando: false
};
const urls = new Map();   // id -> objectURL (para liberar memoria)

function urlDe(p){
  if (p.blob){
    if (!urls.has(p.id)) urls.set(p.id, URL.createObjectURL(p.blob));
    return urls.get(p.id);
  }
  return p.foto_url || '';
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
function aBlob(canvas){
  return new Promise(ok => canvas.toBlob(b => ok(b), 'image/jpeg', CALIDAD));
}

/** Reduce la foto de la cámara (suelen ser 4000px / 5 MB) a algo manejable. */
async function comprimir(file){
  const url = URL.createObjectURL(file);
  try{
    const im = await cargarImagen(url);
    const escala = Math.min(1, ANCHO_FOTO / Math.max(im.width, im.height));
    const c = document.createElement('canvas');
    c.width  = Math.round(im.width  * escala);
    c.height = Math.round(im.height * escala);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    return await aBlob(c);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Dibuja la imagen final: foto + franja con precio/talla/marca + logo. */
async function componer(fotoBlob, datos){
  const url = URL.createObjectURL(fotoBlob);
  try{
    const foto = await cargarImagen(url);
    const W = 1080;
    const H = Math.round(foto.height / foto.width * W);
    const c = $('#lienzo');
    c.width = W; c.height = H;
    const g = c.getContext('2d');

    g.drawImage(foto, 0, 0, W, H);

    // Franja inferior en degradado (teal de marca)
    const franja = Math.round(H * 0.30);
    const deg = g.createLinearGradient(0, H - franja, 0, H);
    deg.addColorStop(0,   'rgba(11,39,35,0)');
    deg.addColorStop(0.45,'rgba(11,39,35,0.55)');
    deg.addColorStop(1,   'rgba(11,39,35,0.93)');
    g.fillStyle = deg;
    g.fillRect(0, H - franja, W, franja);

    // Bloque de texto anclado al borde inferior
    const margen  = Math.round(W * 0.055);
    const base    = H - Math.round(H * 0.048);   // línea base del texto más bajo
    g.textBaseline = 'alphabetic';

    // "Pieza única" — refuerza la urgencia (inventario de ropa usada)
    g.fillStyle = 'rgba(251,247,240,0.62)';
    g.font = '700 ' + Math.round(H * 0.021) + 'px ' + FUENTE;
    g.fillText('PIEZA ÚNICA · DISPONIBLE HOY', margen, base);

    // Talla + marca
    let detalle = 'Talla ' + (datos.talla || '—');
    if (datos.marca && datos.marca.trim()) detalle += '   ·   ' + datos.marca.trim();
    g.fillStyle = '#FBF7F0';
    g.font = '600 ' + Math.round(H * 0.031) + 'px ' + FUENTE;
    g.fillText(detalle, margen, base - Math.round(H * 0.038));

    // Precio
    g.fillStyle = '#D69A2D';
    g.font = '800 ' + Math.round(H * 0.072) + 'px ' + FUENTE;
    g.fillText(quetzales(datos.precio), margen, base - Math.round(H * 0.085));

    // Logo arriba a la derecha, sin recuadro. Un resplandor claro muy suave
    // permite que la palabra "Boutique" (negra) se lea también sobre fotos
    // oscuras, sin generar halos visibles sobre fondos claros.
    try{
      const logo = await cargarImagen(LOGO_URL);
      const lw = Math.round(W * 0.30);
      const lh = Math.round(logo.height / logo.width * lw);
      const x = W - lw - margen, y = margen;
      g.save();
      g.shadowColor = 'rgba(255,255,255,0.55)';
      g.shadowBlur  = Math.round(W * 0.012);
      g.drawImage(logo, x, y, lw, lh);
      g.shadowColor = 'rgba(0,0,0,0.18)';
      g.shadowBlur  = Math.round(W * 0.008);
      g.drawImage(logo, x, y, lw, lh);
      g.restore();
    }catch(e){ /* si el logo no carga, la foto igual sirve */ }

    return await aBlob(c);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Toma la imagen ya compuesta y le quema encima la franja VENDIDO, centrada
 *  y justo arriba del precio. Reescribe el pie para que no quede diciendo
 *  "DISPONIBLE HOY" en una prenda que ya se vendió. */
async function marcarVendidoEnImagen(blobCompuesta, datos){
  const url = URL.createObjectURL(blobCompuesta);
  try{
    const foto = await cargarImagen(url);
    const W = foto.width, H = foto.height;
    const c = $('#lienzo');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.drawImage(foto, 0, 0);

    // Tapamos el bloque de texto anterior con un degradado que abajo llega a
    // opaco, y lo volvemos a escribir. Como las medidas son las mismas que en
    // componer(), el precio y la talla caen exactamente encima de sí mismos.
    const franja = Math.round(H * 0.30);
    const deg = g.createLinearGradient(0, H - franja, 0, H);
    deg.addColorStop(0,    'rgba(11,39,35,0)');
    deg.addColorStop(0.55, 'rgba(11,39,35,0.72)');
    deg.addColorStop(0.80, 'rgba(11,39,35,1)');
    deg.addColorStop(1,    'rgba(11,39,35,1)');
    g.fillStyle = deg;
    g.fillRect(0, H - franja, W, franja);

    const margen = Math.round(W * 0.055);
    const base   = H - Math.round(H * 0.048);
    g.textAlign = 'left';
    g.textBaseline = 'alphabetic';

    g.fillStyle = 'rgba(251,247,240,0.62)';
    g.font = '700 ' + Math.round(H * 0.021) + 'px ' + FUENTE;
    g.fillText('PIEZA ÚNICA · YA SE VENDIÓ', margen, base);

    let detalle = 'Talla ' + ((datos && datos.talla) || '—');
    if (datos && datos.marca && datos.marca.trim()) detalle += '   ·   ' + datos.marca.trim();
    g.fillStyle = '#FBF7F0';
    g.font = '600 ' + Math.round(H * 0.031) + 'px ' + FUENTE;
    g.fillText(detalle, margen, base - Math.round(H * 0.038));

    g.fillStyle = '#D69A2D';
    g.font = '800 ' + Math.round(H * 0.072) + 'px ' + FUENTE;
    g.fillText(quetzales(datos && datos.precio), margen, base - Math.round(H * 0.085));

    // Franja VENDIDO: ancha, centrada, justo encima del precio
    const altoFranja = Math.round(H * 0.098);
    const yFranja    = Math.round(H * 0.795) - altoFranja;

    g.fillStyle = 'rgba(176,65,62,0.95)';
    g.fillRect(0, yFranja, W, altoFranja);

    g.fillStyle = '#FBF7F0';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    try{ g.letterSpacing = '0.16em'; }catch(e){}
    g.font = '900 ' + Math.round(altoFranja * 0.62) + 'px ' + FUENTE;
    g.fillText('VENDIDO', W / 2, yFranja + altoFranja / 2 + Math.round(altoFranja * 0.03));

    // dejamos el contexto como estaba para las siguientes composiciones
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    try{ g.letterSpacing = '0px'; }catch(e){}

    return await aBlob(c);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* --------------------------------------------------- SUPABASE (REST API) */
// Supabase tiene dos generaciones de llaves:
//  · las nuevas ("sb_publishable_…") van SOLO en la cabecera apikey;
//    mandarlas también en Authorization hace que la petición falle.
//  · las antiguas (JWT, empiezan con "eyJ…") aceptan las dos.
const LLAVE_NUEVA = String(CFG.SUPABASE_ANON_KEY || '').startsWith('sb_');

function cab(extra){
  const base = { apikey: CFG.SUPABASE_ANON_KEY };
  if (!LLAVE_NUEVA) base.Authorization = 'Bearer ' + CFG.SUPABASE_ANON_KEY;
  return Object.assign(base, extra || {});
}
function urlPublica(ruta){
  return CFG.SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + ruta;
}
async function subirFoto(ruta, blob){
  const r = await fetch(CFG.SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + ruta, {
    method:'POST',
    headers: cab({ 'Content-Type':'image/jpeg', 'x-upsert':'true', 'cache-control':'31536000' }),
    body: blob
  });
  if (!r.ok && r.status !== 409) throw new Error('storage ' + r.status + ' ' + await r.text());
  return urlPublica(ruta);
}
async function guardarFila(p){
  const r = await fetch(CFG.SUPABASE_URL + '/rest/v1/prendas', {
    method:'POST',
    headers: cab({ 'Content-Type':'application/json', Prefer:'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify({
      id: p.id, tienda: p.tienda, precio: parseFloat(p.precio) || 0,
      talla: p.talla || '', marca: p.marca || '', vendido: !!p.vendido,
      foto_url: p.foto_url || null, fecha_creacion: p.fecha_creacion,
      actualizado: new Date().toISOString()
    })
  });
  if (!r.ok) throw new Error('rest ' + r.status + ' ' + await r.text());
}
async function borrarRemoto(p){
  await fetch(CFG.SUPABASE_URL + '/rest/v1/prendas?id=eq.' + encodeURIComponent(p.id),
    { method:'DELETE', headers: cab() }).catch(()=>{});
  if (p.ruta){
    await fetch(CFG.SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + p.ruta,
      { method:'DELETE', headers: cab() }).catch(()=>{});
  }
}

/* --------------------------------------------------------------- COLA */
async function encolar(id, op, extra){
  await dbGuardar('cola', Object.assign({ id, op, t: Date.now() }, extra || {}));
  actualizarSync();
  sincronizar();
}

let _sincronizando = false;
async function sincronizar(){
  if (!NUBE || _sincronizando || !navigator.onLine) { actualizarSync(); return; }
  _sincronizando = true; S.sincronizando = true; actualizarSync();
  try{
    const cola = (await dbTodo('cola')).sort((a,b) => a.t - b.t);
    for (const item of cola){
      try{
        if (item.op === 'borrar'){
          await borrarRemoto(item);
        } else {
          const p = await dbLeer('prendas', item.id);
          if (!p){ await dbBorrar('cola', item.id); continue; }
          if (!p.foto_url && p.blob){
            const ruta = p.tienda + '/' + p.id + '.jpg';
            p.foto_url = await subirFoto(ruta, p.blob);
            p.ruta = ruta;
            await dbGuardar('prendas', p);
          }
          await guardarFila(p);
        }
        await dbBorrar('cola', item.id);
      }catch(e){
        console.warn('No se pudo sincronizar', item.id, e);
        break;   // sin señal o error: reintenta después, sin perder nada
      }
    }
  } finally {
    _sincronizando = false; S.sincronizando = false;
    await actualizarSync();
  }
}

/** Trae del servidor las prendas de esta tienda que no estén en el teléfono
 *  (recupera el historial en un equipo nuevo o después de un formateo). */
async function traerDeLaNube(){
  if (!NUBE || !navigator.onLine || !S.tienda) return;
  try{
    const r = await fetch(CFG.SUPABASE_URL + '/rest/v1/prendas?select=*&tienda=eq.' +
      encodeURIComponent(S.tienda) + '&order=fecha_creacion.desc&limit=800', { headers: cab() });
    if (!r.ok) return;
    const filas = await r.json();
    const locales = new Set(S.prendas.map(p => p.id));
    let nuevas = 0;
    for (const f of filas){
      if (locales.has(f.id)) continue;
      await dbGuardar('prendas', {
        id:f.id, tienda:f.tienda, precio:f.precio, talla:f.talla, marca:f.marca,
        vendido:f.vendido, foto_url:f.foto_url, ruta:f.tienda + '/' + f.id + '.jpg',
        fecha_creacion:f.fecha_creacion, blob:null, blobOriginal:null
      });
      nuevas++;
    }
    if (nuevas){ await cargarPrendas(); pintar(); }
  }catch(e){ console.warn('No se pudo leer la nube:', e); }
}

async function actualizarSync(){
  S.pendientes = (await dbTodo('cola')).length;
  const el = $('#sync');
  if (el) el.outerHTML = htmlSync();
}

/* ------------------------------------------------------------- DATOS */
async function cargarPrendas(){
  const todas = await dbTodo('prendas');
  S.prendas = todas
    .filter(p => p.tienda === S.tienda)
    .sort((a,b) => (b.fecha_creacion || '').localeCompare(a.fecha_creacion || ''));
}

/** Guarda la prenda del flujo actual. Si ya se guardó (porque compartió
 *  primero a WhatsApp y luego a TikTok), no la duplica. */
async function guardarSiHaceFalta(){
  if (S.idGuardado) return S.idGuardado;
  const id = uid();
  const p = {
    id,
    tienda: S.tienda,
    precio: S.precio,
    talla:  S.talla,
    marca:  S.marca,
    vendido: false,
    fecha_creacion: new Date().toISOString(),
    blob: S.fotoCompuesta,
    blobOriginal: S.fotoOriginal,   // se conserva por si hay que recomponer
    foto_url: null,
    ruta: null
  };
  await dbGuardar('prendas', p);
  S.idGuardado = id;
  await encolar(id, 'subir');
  await cargarPrendas();
  toast('Guardada en el inventario');
  return id;
}

async function alternarVendido(id){
  const p = await dbLeer('prendas', id);
  if (!p) return;
  p.vendido = !p.vendido;
  await dbGuardar('prendas', p);
  await encolar(id, 'subir');
  await cargarPrendas();
  pintar();

  if (!p.vendido){ toast('Otra vez disponible'); return; }

  modal({
    titulo: '¿Avisar que se vendió?',
    texto: 'Publica la misma foto con el sello VENDIDO encima. Sirve para que la gente vea ' +
           'que la ropa se mueve rápido y no deje pasar la siguiente.',
    si: 'Sí, publicar', no: 'No, gracias',
    alConfirmar: () => compartirVendida(id)
  });
}

/** Comparte la foto de una prenda ya vendida, con el sello VENDIDO quemado. */
async function compartirVendida(id){
  const p = await dbLeer('prendas', id);
  const base = p && await blobDe(p);
  if (!base){ toast('No se pudo abrir la foto'); return; }
  toast('Preparando la imagen…');
  const conSello = await marcarVendidoEnImagen(base, p);
  await compartir(conSello,
    '¡VENDIDA! ' + quetzales(p.precio) + ' · Talla ' + p.talla +
    ' — Vintage Boutique. Cada prenda es única: la que te gusta, no espera.');
}

async function eliminarPrenda(id){
  const p = await dbLeer('prendas', id);
  await dbBorrar('prendas', id);
  if (urls.has(id)){ URL.revokeObjectURL(urls.get(id)); urls.delete(id); }
  if (p) await encolar(id, 'borrar', { ruta:p.ruta, tienda:p.tienda });
  await cargarPrendas();
  pintar();
  toast('Prenda eliminada');
}

/* --------------------------------------------------------- COMPARTIR */
async function blobDe(p){
  if (p.blob) return p.blob;
  if (p.foto_url){
    const r = await fetch(p.foto_url);
    return await r.blob();
  }
  return null;
}
/** ¿El teléfono puede compartir archivos con el menú nativo de Android? */
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
      if (e && e.name === 'AbortError') return 'cancelado';   // el vendedor canceló
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
  const claseSi = tono === 'peligro' ? 'btn-si' : (no ? 'btn-ok' : 'btn-ok');
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
  const lista = S.prendas.filter(p =>
    S.filtro === 'disponibles' ? !p.vendido :
    S.filtro === 'vendidos'    ?  p.vendido : true);

  const disponibles = S.prendas.filter(p => !p.vendido).length;

  const cuerpo = lista.length === 0
    ? '<div class="vacio">' + I.etiqueta + '<p>' +
        (S.filtro === 'vendidos' ? 'Todavía no hay prendas vendidas'
         : 'Todavía no hay prendas.<br>Toca el botón <b>+</b> para agregar la primera.') +
      '</p></div>'
    : '<div class="grid">' + lista.map(p =>
        '<div class="card">' +
          '<div class="ph">' +
            '<img src="' + esc(urlDe(p)) + '" alt="Prenda" loading="lazy">' +
            (p.vendido ? '<div class="badge">VENDIDO</div>' : '') +
          '</div>' +
          '<div class="info">' +
            '<div class="precio">' + esc(quetzales(p.precio)) + '</div>' +
            '<div class="detalle">Talla ' + esc(p.talla || '—') +
              (p.marca ? ' · ' + esc(p.marca) : '') + '</div>' +
            '<div class="card-acciones">' +
              '<button class="mini v' + (p.vendido ? ' done' : '') + '" data-vendido="' + esc(p.id) + '">' +
                (p.vendido ? I.deshacer + 'Disponible' : I.check + 'Vendido') + '</button>' +
              '<button class="mini s" data-share="' + esc(p.id) + '" aria-label="Compartir">' +
                I.compartir + '</button>' +
            '</div>' +
            '<button class="mini" data-borrar="' + esc(p.id) + '" ' +
              'style="margin-top:6px;width:100%;background:transparent;color:#B0413E;font-size:11px">' +
              I.basura + 'Eliminar</button>' +
          '</div>' +
        '</div>').join('') + '</div>';

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

function vistaAgregar(){
  const titulo = S.paso === 1 ? 'Tomar foto'
              : S.paso === 2 ? 'Detalles de la prenda'
              : 'Lista para publicar';

  let cuerpo = '';

  if (S.paso === 1){
    cuerpo =
      '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;padding:44px 0">' +
        '<div style="width:158px;height:158px;border-radius:34px;background:var(--teal);color:var(--cream);display:flex;align-items:center;justify-content:center">' +
          '<span style="width:66px;height:66px;display:block">' + I.camara + '</span></div>' +
        '<p style="text-align:center;max-width:280px;line-height:1.45;margin:0">' +
          'Toca el botón para abrir la cámara y fotografiar la prenda.</p>' +
        '<div style="width:100%;max-width:300px">' +
          '<button class="big mustard" data-camara="1">' +
            '<span class="ic">' + I.camara + '</span>' +
            '<span><span class="lbl">Abrir cámara</span></span></button>' +
        '</div>' +
      '</div>';
  }

  if (S.paso === 2){
    cuerpo =
      (S.previaURL ? '<img src="' + esc(S.previaURL) + '" alt="Prenda" class="previa" ' +
        'style="max-height:250px;object-fit:cover;margin-bottom:20px">' : '') +
      '<div class="campo"><label>Precio (Q)</label>' +
        '<input id="in-precio" class="grande" type="number" inputmode="decimal" ' +
        'placeholder="0.00" value="' + esc(S.precio) + '"></div>' +
      '<div class="campo"><label>Talla</label>' +
        '<input id="in-talla" type="text" placeholder="Ej. M, 32, 8, Única…" value="' + esc(S.talla) + '">' +
        '<p class="ayuda">Escribe la talla tal como viene en la prenda — cada tipo de ropa usa su propia numeración.</p></div>' +
      '<div class="campo"><label>Marca <span class="opt">(opcional)</span></label>' +
        '<input id="in-marca" type="text" placeholder="Ej. Levi\'s, Nike…" value="' + esc(S.marca) + '"></div>' +
      '<button class="big mustard" data-continuar="1"' + (S.precio && S.talla ? '' : ' disabled') + '>' +
        '<span class="ic">' + I.check + '</span>' +
        '<span><span class="lbl">Continuar</span></span></button>';
  }

  if (S.paso === 3){
    cuerpo =
      '<img id="previa3" class="previa" alt="Vista previa"' +
        (S.previaURL ? ' src="' + esc(S.previaURL) + '"' : '') + '>' +
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
  if (!S.tienda)            app.innerHTML = vistaBienvenida();
  else if (S.vista === 'add') app.innerHTML = vistaAgregar();
  else                       app.innerHTML = vistaHome();

  if (S.vista === 'add' && S.paso === 2){
    const p = $('#in-precio'), t = $('#in-talla'), m = $('#in-marca');
    p.addEventListener('input', e => { S.precio = e.target.value; refrescarContinuar(); });
    t.addEventListener('input', e => { S.talla  = e.target.value; refrescarContinuar(); });
    m.addEventListener('input', e => { S.marca  = e.target.value; });
  }
}
function refrescarContinuar(){
  const b = document.querySelector('[data-continuar]');
  if (b) b.disabled = !(S.precio && S.talla);
}

function reiniciarFlujo(){
  if (S.previaURL) URL.revokeObjectURL(S.previaURL);
  S.previaURL = null; S.fotoOriginal = null; S.fotoCompuesta = null;
  S.precio = ''; S.talla = ''; S.marca = ''; S.idGuardado = null;
  S.paso = 1; S.vista = 'home';
  pintar();
}

/* ------------------------------------------------------------ EVENTOS */
document.addEventListener('click', async (ev) => {
  const el = ev.target.closest('[data-tienda],[data-filtro],[data-nueva],[data-atras],' +
    '[data-camara],[data-continuar],[data-guardar],[data-compartir],' +
    '[data-bajar],[data-vendido],[data-borrar],[data-share],[data-ajustes]');
  if (!el) return;
  const d = el.dataset;

  if (d.tienda){
    S.tienda = d.tienda;
    localStorage.setItem('vb_tienda', d.tienda);
    await cargarPrendas(); pintar(); traerDeLaNube(); return;
  }
  if (d.filtro){ S.filtro = d.filtro; pintar(); return; }
  if (d.nueva) { S.vista = 'add'; S.paso = 1; pintar(); return; }

  if (d.atras){
    if (S.paso === 1) reiniciarFlujo();
    else { S.paso--;
           if (S.paso === 2 && S.fotoOriginal){
             if (S.previaURL) URL.revokeObjectURL(S.previaURL);
             S.previaURL = URL.createObjectURL(S.fotoOriginal);
           }
           pintar(); }
    return;
  }

  if (d.camara){ $('#filein').click(); return; }

  if (d.continuar){
    S.paso = 3; pintar();
    try{
      S.fotoCompuesta = await componer(S.fotoOriginal,
        { precio:S.precio, talla:S.talla, marca:S.marca });
      if (S.previaURL) URL.revokeObjectURL(S.previaURL);
      S.previaURL = URL.createObjectURL(S.fotoCompuesta);
      const im = $('#previa3'); if (im) im.src = S.previaURL;
    }catch(e){
      console.error(e); toast('No se pudo preparar la imagen');
    }
    return;
  }

  if (d.guardar){ await guardarSiHaceFalta(); reiniciarFlujo(); return; }
  if (d.bajar)  { if (S.fotoCompuesta){ descargar(S.fotoCompuesta); toast('Guardada en la galería'); } return; }

  if (d.compartir){
    if (!S.fotoCompuesta) return;
    const esTikTok = d.compartir === 'tt';
    const texto = esTikTok
      ? 'Vintage Boutique · ' + quetzales(S.precio) + ' · Talla ' + S.talla +
        ' #vintage #ropausada #guatemala #thrift #segundamano'
      : quetzales(S.precio) + ' · Talla ' + S.talla + (S.marca ? ' · ' + S.marca : '') +
        ' — pieza única, disponible hoy en Vintage Boutique.';

    // Para TikTok dejamos además la foto en la galería, para que el vendedor
    // la encuentre en "recientes". (Si el teléfono no puede compartir archivos,
    // compartir() ya la descarga solo — no la bajamos dos veces.)
    if (esTikTok && puedeCompartirArchivos()) descargar(S.fotoCompuesta);

    const r = await compartir(S.fotoCompuesta, texto);
    if (r === 'cancelado') return;       // se arrepintió: lo dejamos donde estaba

    await guardarSiHaceFalta();          // queda en el inventario sin preguntar

    if (esTikTok){
      modal({
        titulo: 'Abrir TikTok',
        texto: 'La foto también quedó guardada en la galería. Si TikTok no se abrió solo, ' +
               'toca el botón: adentro dale a + y elige la foto más reciente.',
        si: 'Abrir TikTok', no: 'Ya está',
        enlace: TIKTOK_URL,
        alCerrar: reiniciarFlujo
      });
    } else {
      reiniciarFlujo();
    }
    return;
  }

  if (d.vendido){ await alternarVendido(d.vendido); return; }

  if (d.share){
    const p = await dbLeer('prendas', d.share);
    if (!p){ toast('No se pudo abrir la foto'); return; }
    if (p.vendido){ await compartirVendida(p.id); return; }
    const b = await blobDe(p);
    if (b) await compartir(b, quetzales(p.precio) + ' · Talla ' + p.talla +
      (p.marca ? ' · ' + p.marca : '') + ' — pieza única, disponible hoy en Vintage Boutique.');
    else toast('No se pudo abrir la foto');
    return;
  }

  if (d.borrar){
    modal({
      titulo:'¿Eliminar esta prenda?',
      texto:'Se quita del inventario en este teléfono y en la nube. No se puede deshacer.',
      si:'Sí, eliminar', no:'Cancelar', tono:'peligro',
      alConfirmar: () => eliminarPrenda(d.borrar)
    });
    return;
  }

  if (d.ajustes){
    modal({
      titulo:'Cambiar de tienda',
      texto:'Estás en: ' + nombreTienda() + '. Al cambiar de tienda verás el inventario de la otra. ' +
            (NUBE ? 'Tus prendas están respaldadas en la nube.' : 'Los datos se guardan solo en este teléfono.'),
      si:'Cambiar de tienda', no:'Cerrar',
      alConfirmar: async () => {
        localStorage.removeItem('vb_tienda');
        S.tienda = null; S.prendas = []; pintar();
      }
    });
    return;
  }
});

$('#filein').addEventListener('change', async (e) => {
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!f) return;
  toast('Preparando la foto…');
  try{
    S.fotoOriginal = await comprimir(f);
    if (S.previaURL) URL.revokeObjectURL(S.previaURL);
    S.previaURL = URL.createObjectURL(S.fotoOriginal);
    S.paso = 2; pintar();
  }catch(err){
    console.error(err); toast('No se pudo leer la foto');
  }
});

window.addEventListener('online',  () => { actualizarSync(); sincronizar(); traerDeLaNube(); });
window.addEventListener('offline', () => actualizarSync());
document.addEventListener('visibilitychange', () => { if (!document.hidden) sincronizar(); });

/* --------------------------------------------------------------- INICIO */
(async function inicio(){
  try{
    await cargarPrendas();
  }catch(e){ console.error('IndexedDB', e); }
  pintar();
  await actualizarSync();
  sincronizar();
  traerDeLaNube();
  setInterval(sincronizar, 60000);

  if ('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
