-- =====================================================================
--  Vintage Boutique — Configuración de Supabase
--  ---------------------------------------------------------------------
--  Cómo usarlo:
--    1. Entra a supabase.com → tu proyecto "vintageboutiqueadmin-eng"
--    2. En el menú lateral: SQL Editor → New query
--    3. Pega TODO este archivo y presiona "Run"
--    4. Debe decir "Success. No rows returned"
--
--  Solo hay que correrlo UNA vez.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Tabla de prendas
-- ---------------------------------------------------------------------
create table if not exists public.prendas (
  id              text primary key,
  tienda          text        not null,
  precio          numeric(10,2) not null default 0,
  talla           text        not null default '',
  marca           text        not null default '',
  vendido         boolean     not null default false,
  foto_url        text,
  fecha_creacion  timestamptz not null default now(),
  actualizado     timestamptz not null default now()
);

create index if not exists prendas_tienda_fecha_idx
  on public.prendas (tienda, fecha_creacion desc);

create index if not exists prendas_vendido_idx
  on public.prendas (tienda, vendido);


-- ---------------------------------------------------------------------
-- 2. Seguridad a nivel de fila (RLS)
--
--    La app no tiene login (así lo pidió el negocio: los vendedores no
--    deben escribir contraseñas). Por eso la llave "anon" puede leer y
--    escribir en esta tabla.
--
--    IMPORTANTE: cualquiera que tenga la llave anon podría leer o borrar
--    el inventario. Como la app se publica en GitHub Pages, la llave es
--    visible. Riesgo real: bajo (son fotos de ropa en venta que de todos
--    modos se publican en redes), pero conviene saberlo.
--    Si más adelante quieres cerrarlo, la vía es agregar login por PIN
--    con Supabase Auth y cambiar estas políticas a "authenticated".
-- ---------------------------------------------------------------------
alter table public.prendas enable row level security;

drop policy if exists "prendas lectura publica"   on public.prendas;
drop policy if exists "prendas insercion publica" on public.prendas;
drop policy if exists "prendas update publico"    on public.prendas;
drop policy if exists "prendas delete publico"    on public.prendas;

create policy "prendas lectura publica"
  on public.prendas for select to anon, authenticated using (true);

create policy "prendas insercion publica"
  on public.prendas for insert to anon, authenticated with check (true);

create policy "prendas update publico"
  on public.prendas for update to anon, authenticated using (true) with check (true);

create policy "prendas delete publico"
  on public.prendas for delete to anon, authenticated using (true);


-- ---------------------------------------------------------------------
-- 3. Bucket de fotos (público, para que las imágenes se vean directo)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];


-- ---------------------------------------------------------------------
-- 4. Políticas del bucket
-- ---------------------------------------------------------------------
drop policy if exists "fotos lectura publica"  on storage.objects;
drop policy if exists "fotos subida publica"   on storage.objects;
drop policy if exists "fotos update publico"   on storage.objects;
drop policy if exists "fotos borrado publico"  on storage.objects;

create policy "fotos lectura publica"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'fotos');

create policy "fotos subida publica"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'fotos');

create policy "fotos update publico"
  on storage.objects for update to anon, authenticated
  using (bucket_id = 'fotos') with check (bucket_id = 'fotos');

create policy "fotos borrado publico"
  on storage.objects for delete to anon, authenticated
  using (bucket_id = 'fotos');


-- ---------------------------------------------------------------------
-- 5. Vista de apoyo para reportes (útil desde tu app de Streamlit)
-- ---------------------------------------------------------------------
create or replace view public.resumen_prendas as
select
  tienda,
  count(*)                                        as total,
  count(*) filter (where vendido)                 as vendidas,
  count(*) filter (where not vendido)             as disponibles,
  round(avg(precio), 2)                           as precio_promedio,
  round(sum(precio) filter (where vendido), 2)    as venta_total,
  max(fecha_creacion)                             as ultima_publicacion
from public.prendas
group by tienda;


-- =====================================================================
--  Listo. Ahora copia Project URL y la llave anon (Settings → API)
--  y pégalas en el archivo config.js de la app.
-- =====================================================================
