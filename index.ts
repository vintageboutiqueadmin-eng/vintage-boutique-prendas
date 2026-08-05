/* =====================================================================
   Vintage Boutique — Detección automática de prendas
   ---------------------------------------------------------------------
   Edge Function de Supabase. Recibe la foto, se la muestra a un modelo
   de visión y devuelve qué prendas trae puestas el maniquí y dónde está
   cada una, para que la app ponga los marcadores solita.

   La llave de la IA vive AQUÍ, en el servidor. Nunca viaja al teléfono.

   Cómo publicarla (una sola vez, desde tu computadora):
     1. npm install -g supabase
     2. supabase login
     3. supabase link --project-ref pyelkmsxhnvxcqibxqrt
     4. supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
     5. supabase secrets set LLAVE_APP=sb_publishable_...   (la misma de config.js)
     6. supabase functions deploy detectar-prendas --no-verify-jwt

   Después pega la URL que te devuelve en config.js, en FUNCION_DETECTAR.
   ===================================================================== */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const MODELO = Deno.env.get('MODELO_IA') || 'claude-haiku-4-5';

const INSTRUCCIONES = `Eres el asistente de una tienda de ropa usada en Guatemala.

En la foto hay UN maniquí (o una persona) en primer plano con ropa puesta.
Detrás casi siempre hay percheros, estantes y más ropa de la tienda:
ESO NO CUENTA. Ignora por completo la ropa del fondo, la de los percheros,
la de otros maniquíes y cualquier prenda que no esté puesta en el maniquí
principal del centro de la foto.

Devuelve una entrada por cada prenda VISIBLE Y PUESTA en ese maniquí
principal — normalmente entre 1 y 3 (por ejemplo blusa y pantalón).

Para cada prenda:
- "tipo": exactamente una de estas palabras: Blusa, Pantalón, Vestido, Falda,
  Chumpa, Short, Suéter, Zapatos, Accesorio.
- "x" y "y": el centro de esa prenda, en proporción del ancho y del alto de
  la imagen (0 = borde izquierdo/superior, 1 = borde derecho/inferior).
  Colócalo sobre la tela, en la parte más ancha y visible de la prenda.

Si es un vestido o un enterizo de una sola pieza, devuelve una sola entrada.
Si no logras ver bien ninguna prenda puesta, devuelve la lista vacía.`;

const HERRAMIENTA = {
  name: 'reportar_prendas',
  description: 'Reporta las prendas que trae puestas el maniquí principal.',
  input_schema: {
    type: 'object',
    properties: {
      prendas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            tipo: {
              type: 'string',
              enum: ['Blusa','Pantalón','Vestido','Falda','Chumpa','Short','Suéter','Zapatos','Accesorio']
            },
            x: { type: 'number', minimum: 0, maximum: 1 },
            y: { type: 'number', minimum: 0, maximum: 1 }
          },
          required: ['tipo','x','y']
        }
      }
    },
    required: ['prendas']
  }
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const responder = (obj: unknown, status = 200) =>
    new Response(JSON.stringify(obj), {
      status, headers: { ...CORS, 'Content-Type': 'application/json' }
    });

  try {
    // Solo la app de la tienda puede llamar aquí
    const esperada = Deno.env.get('LLAVE_APP');
    if (esperada && req.headers.get('apikey') !== esperada) {
      return responder({ error: 'no autorizado' }, 401);
    }

    const llaveIA = Deno.env.get('ANTHROPIC_API_KEY');
    if (!llaveIA) return responder({ error: 'falta ANTHROPIC_API_KEY' }, 500);

    const { imagen } = await req.json();
    if (!imagen) return responder({ error: 'falta la imagen' }, 400);

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': llaveIA,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 700,
        tools: [HERRAMIENTA],
        tool_choice: { type: 'tool', name: 'reportar_prendas' },
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imagen } },
            { type: 'text', text: INSTRUCCIONES }
          ]
        }]
      })
    });

    if (!r.ok) {
      const detalle = await r.text();
      console.error('IA', r.status, detalle);
      return responder({ error: 'la IA no respondió', prendas: [] }, 502);
    }

    const datos = await r.json();
    const uso = datos.usage || {};
    const bloque = (datos.content || []).find((c: any) => c.type === 'tool_use');
    const prendas = (bloque?.input?.prendas || [])
      .filter((p: any) => typeof p.x === 'number' && typeof p.y === 'number')
      .slice(0, 4);

    console.log('detectadas', prendas.length, 'tokens', uso.input_tokens, '/', uso.output_tokens);
    return responder({ prendas });

  } catch (e) {
    console.error(e);
    return responder({ error: String(e), prendas: [] }, 500);
  }
});
