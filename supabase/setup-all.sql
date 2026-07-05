-- ISABEL — setup completo Supabase (pegar en SQL Editor o scripts/supabase-setup.mjs)
-- Tablas + RLS lectura/escritura para clave publishable/anon

create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  module_id text not null,
  event_type text not null default 'message',
  input_text text,
  output_text text,
  audio_url text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.iot_events (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  led_state text,
  device_connected boolean default true,
  payload jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists interactions_created_at_idx
  on public.interactions (created_at desc);

create index if not exists iot_events_created_at_idx
  on public.iot_events (created_at desc);

alter table public.interactions enable row level security;
alter table public.iot_events enable row level security;

drop policy if exists "Allow public read interactions" on public.interactions;
drop policy if exists "Allow public read iot_events" on public.iot_events;
drop policy if exists "Allow public insert interactions" on public.interactions;
drop policy if exists "Allow public insert iot_events" on public.iot_events;

create policy "Allow public read interactions"
  on public.interactions for select using (true);

create policy "Allow public read iot_events"
  on public.iot_events for select using (true);

create policy "Allow public insert interactions"
  on public.interactions for insert with check (true);

create policy "Allow public insert iot_events"
  on public.iot_events for insert with check (true);

-- Reportes comunitarios de accesibilidad (Módulo Movilidad)
create table if not exists public.accessibility_reports (
  id uuid primary key default gen_random_uuid(),
  place_id text not null,
  place_name text not null,
  category text not null,
  latitude double precision not null,
  longitude double precision not null,
  address text,
  phone text,
  rating text not null check (rating in ('accessible', 'partial', 'inaccessible')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists accessibility_reports_place_id_idx
  on public.accessibility_reports (place_id);

alter table public.accessibility_reports enable row level security;

drop policy if exists "Allow public read accessibility_reports" on public.accessibility_reports;
drop policy if exists "Allow public insert accessibility_reports" on public.accessibility_reports;

create policy "Allow public read accessibility_reports"
  on public.accessibility_reports for select using (true);

create policy "Allow public insert accessibility_reports"
  on public.accessibility_reports for insert with check (true);
