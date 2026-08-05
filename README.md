# Vintage Boutique — App de prendas

App para que los vendedores fotografíen una prenda, le pongan precio, talla y
marca, y la compartan al Estado de WhatsApp o a TikTok con un toque.

Es una **PWA**: se instala en el teléfono desde el navegador (sin Play Store),
funciona sin internet y respalda todo en Supabase cuando hay señal.

---

## Lo que vas a necesitar

| Cuenta | Para qué | Ya la tienes |
|---|---|---|
| GitHub (`vintageboutiqueadmin-eng`) | Publicar la app | Sí |
| Supabase (proyecto `vintageboutiqueadmin-en…`) | Respaldo en la nube | Sí |
| Un teléfono Android por tienda | Usar la app | Sí |

Costo total: **Q0**. Todo cabe en los planes gratuitos.

---

## Paso 1 — Preparar Supabase (10 minutos, una sola vez)

1. Entra a [supabase.com](https://supabase.com) y abre tu proyecto.
2. Menú lateral → **SQL Editor** → **New query**.
3. Abre el archivo `supabase-setup.sql` de esta carpeta, copia **todo** el
   contenido y pégalo en el editor.
4. Presiona **Run** (o `Ctrl + Enter`). Debe decir *Success. No rows returned*.
5. **Settings** → **Data API** → copia el **API URL**.
   Viene así: `https://xxxxxxx.supabase.co/rest/v1/`
   → tú necesitas **solo hasta `.supabase.co`**, sin el `/rest/v1/`.
6. **Settings** → **API Keys** → pestaña *Publishable and secret API keys* →
   botón de copiar de la **Publishable key** (empieza con `sb_publishable_`).

   > ⚠️ Copia la **Publishable**, nunca la **Secret** (`sb_secret_`). La secreta
   > da acceso total y no debe salir de tu computadora.

   Déjalos a la mano; los usas en el Paso 3.

> Con esto quedan creadas la tabla `prendas`, el bucket de fotos `fotos`, los
> permisos, y una vista `resumen_prendas` que puedes leer después desde tu app
> de Streamlit para reportes.

---

## Paso 2 — Publicar la app en GitHub Pages (10 minutos)

1. En GitHub, arriba a la derecha: **+** → **New repository**.
2. Nombre: `vintage-boutique-prendas`. Marca **Public**. Crea el repositorio.
3. En la página del repo nuevo, haz clic en **uploading an existing file**.
4. Arrastra **todos** los archivos de esta carpeta (no la carpeta — los
   archivos sueltos):

   ```
   index.html
   app.js
   config.js
   sw.js
   manifest.webmanifest
   logo.png
   favicon.png
   icon-192.png
   icon-512.png
   icon-maskable.png
   apple-touch-icon.png
   ```

5. Abajo, botón verde **Commit changes**.
6. Pestaña **Settings** del repo → menú lateral **Pages**.
7. En *Source* elige **Deploy from a branch**, rama **main**, carpeta **/ (root)**
   → **Save**.
8. Espera 1–2 minutos y recarga esa página. Aparecerá la dirección:

   ```
   https://vintageboutiqueadmin-eng.github.io/vintage-boutique-prendas/
   ```

   Esa es la dirección de la app. Guárdala.

---

## Paso 3 — Conectar la app con Supabase (2 minutos)

1. En el repo de GitHub, abre el archivo **`config.js`** y haz clic en el
   lápiz ✏️ para editarlo.
2. Pega los dos datos del Paso 1 entre las comillas:

   ```js
   SUPABASE_URL:      "https://pyelkmsxhnvxcqibxqrt.supabase.co",
   SUPABASE_ANON_KEY: "sb_publishable_CEKs2h...",
   ```

   La URL ya viene puesta en el archivo; solo falta la llave.

3. **Commit changes**.

Si dejas esos dos campos vacíos, la app igual funciona — pero guardando solo en
el teléfono, sin respaldo.

---

## Paso 4 — Instalar en los teléfonos de las tiendas

En **cada** teléfono Android:

1. Abre **Chrome** y entra a la dirección del Paso 2.
2. Menú **⋮** (arriba a la derecha) → **Agregar a pantalla principal** →
   **Instalar**.
3. Se crea el ícono de Vintage Boutique en la pantalla de inicio. Ábrelo desde
   ahí de ahora en adelante (así se ve como app, sin barra de navegador).
4. La primera vez pregunta **en qué tienda estás** — elige la correcta.
   Solo se pregunta una vez; después se cambia desde el engranaje ⚙️.

> **Importante:** cada tienda debe elegir su propia tienda. El inventario que ve
> cada teléfono es el de su tienda.

---

## Cómo se usa (esto es lo que hay que enseñarles)

1. Botón grande **+** (abajo a la derecha).
2. **Abrir cámara** → tomar la foto de la prenda.
3. Escribir **precio** y **talla** (la marca es opcional). Hay botones rápidos
   de talla para no escribir.
4. **Continuar** → la app arma sola la imagen con el logo, el precio y la talla.
5. Elegir:
   - **Compartir a WhatsApp** → se abre el menú de compartir de Android, se elige
     WhatsApp → **Estado** → enviar.
   - **Compartir a TikTok** → igual, pero eligiendo TikTok.
   - **Guardar en la app** → queda en el inventario.
   - **Guardar en la galería** → queda la foto en el teléfono.
6. Cuando la prenda se venda: en el inventario, botón **Vendido**.

El archivo `GUIA-VENDEDORES.md` es una hoja de una página para imprimir y pegar
en el mostrador.

---

## Lo que la app SÍ y NO puede hacer

**Sí:**

- Funciona sin internet (guarda y sube después, sin perder nada).
- Respalda fotos e inventario en la nube automáticamente.
- Si un teléfono se pierde o se formatea, al instalar la app en el nuevo y
  elegir la misma tienda **el historial se recupera solo** desde Supabase.
- Cada tienda ve solo su inventario.

**No:**

- **No publica sola** en el Estado de WhatsApp ni en TikTok. Ninguna app externa
  puede hacerlo — ambas plataformas exigen que la persona confirme dentro de su
  app. Lo que hace la app es dejar la imagen lista y abrir el menú de compartir,
  de modo que solo queden **dos toques**.
- No quita el fondo de las fotos. Para que se vean parejas, lo más barato y
  efectivo es colgar una **tela lisa** (de un solo color) en cada tienda y
  fotografiar siempre contra ella. Es la Opción A de la especificación.

---

## Espacio en el plan gratis de Supabase

- **1 GB** de fotos. Cada foto compuesta pesa entre 200 y 400 KB → alcanzan
  aproximadamente **2,500 a 5,000 prendas**.
- **500 MB** de base de datos: los datos de texto son mínimos, no es problema.
- **5 GB** de descarga al mes.

Cuando se llene, hay dos salidas: borrar prendas vendidas viejas desde la app,
o subir a Supabase Pro (unos USD 25/mes). Con el ritmo de dos tiendas eso
debería tardar meses.

---

## Cómo hacer cambios después

Cualquier cambio se hace editando los archivos en GitHub y guardando; los
teléfonos toman la versión nueva al abrir la app.

**Importante:** si cambias `index.html` o `app.js`, abre también `sw.js` y sube
el número de versión:

```js
const VERSION = 'vb-v1';   // cámbialo a 'vb-v2', 'vb-v3', etc.
```

Si no lo cambias, los teléfonos siguen usando la versión guardada.
(`config.js` es la excepción: los cambios de llaves se toman solos.)

---

## Reportes desde Streamlit

Tu app de Streamlit (`Analisis_Y_Reportes`) puede leer estos datos directo:

```python
import streamlit as st, pandas as pd, requests

URL  = st.secrets["SUPABASE_URL"]
KEY  = st.secrets["SUPABASE_ANON_KEY"]
cab  = {"apikey": KEY, "Authorization": f"Bearer {KEY}"}

prendas = pd.DataFrame(requests.get(f"{URL}/rest/v1/prendas?select=*", headers=cab).json())
resumen = pd.DataFrame(requests.get(f"{URL}/rest/v1/resumen_prendas?select=*", headers=cab).json())

st.dataframe(resumen)
```

Con eso puedes sacar: prendas publicadas por día, rotación (cuánto tardan en
venderse), precio promedio por tienda y qué rango de precio se mueve más rápido.

---

## Nota de seguridad

La app no pide contraseña — es a propósito, para que los vendedores no tengan
que recordar nada. Eso implica que la llave `anon` viaja dentro de la app, y
alguien que la encuentre podría leer o borrar el inventario.

El riesgo real es bajo: son fotos de ropa que de todos modos se publican en
redes sociales. Si más adelante quieres cerrarlo, la vía es agregar un PIN por
tienda con Supabase Auth y cambiar las políticas del SQL de `anon` a
`authenticated`.

---

## Fuera de alcance (posibles fases siguientes)

- Integración con Odoo 12 (publicar el inventario cruzado).
- Recorte automático de fondo con IA.
- Publicación automática en TikTok (requiere aprobación de TikTok como
  desarrollador).
- Analítica de qué prendas generan más interacción.
