/* =====================================================================
   CONFIGURACIÓN — Vintage Boutique
   ---------------------------------------------------------------------
   Este es el ÚNICO archivo que hay que editar.

   1. Entra a supabase.com → tu proyecto → Settings → API Keys
   2. Copia la "Publishable key" (empieza con sb_publishable_) y pégala
      en SUPABASE_ANON_KEY. También sirve la llave "anon" antigua
      (pestaña "Legacy anon, service_role API keys").
   3. En Settings → Data API copia el "API URL" y pégalo en SUPABASE_URL,
      pero SIN el /rest/v1/ del final.
   4. Guarda el archivo y súbelo a GitHub

   Si dejas los dos campos vacíos ("") la app funciona igual, pero
   guardando solo en el teléfono, sin respaldo en la nube.
   ===================================================================== */

window.VB_CONFIG = {

  SUPABASE_URL:      "https://pyelkmsxhnvxcqibxqrt.supabase.co",
  SUPABASE_ANON_KEY: "",   // pega aquí la Publishable key (sb_publishable_...)

  BUCKET: "fotos",

  // Las dos tiendas. El vendedor elige la suya la primera vez que abre la app.
  TIENDAS: [
    { id: "7a", nombre: "7a avenida, zona 1" },
    { id: "6a", nombre: "6a avenida, zona 1" }
  ]
};
