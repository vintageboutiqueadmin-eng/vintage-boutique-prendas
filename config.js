/* =====================================================================
   CONFIGURACIÓN — Vintage Boutique
   ---------------------------------------------------------------------
   Este es el ÚNICO archivo que hay que editar.

   1. Entra a supabase.com → tu proyecto → Settings → API
   2. Copia "Project URL"  y pégalo en SUPABASE_URL
   3. Copia la llave "anon public" y pégala en SUPABASE_ANON_KEY
   4. Guarda el archivo y súbelo a GitHub

   Si dejas los dos campos vacíos ("") la app funciona igual, pero
   guardando solo en el teléfono, sin respaldo en la nube.
   ===================================================================== */

window.VB_CONFIG = {

  SUPABASE_URL:      "",   // ej: "https://abcdefghijk.supabase.co"
  SUPABASE_ANON_KEY: "",   // ej: "eyJhbGciOiJIUzI1NiIsInR5cCI6..."

  BUCKET: "fotos",

  // Las dos tiendas. El vendedor elige la suya la primera vez que abre la app.
  TIENDAS: [
    { id: "7a", nombre: "7a avenida, zona 1" },
    { id: "6a", nombre: "6a avenida, zona 1" }
  ]
};
