-- ISABEL — tablas para buildathon
-- Ejecutar en Supabase SQL Editor

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

create policy "Allow public read interactions"
  on public.interactions for select using (true);

create policy "Allow public read iot_events"
  on public.iot_events for select using (true);

-- Inserciones vía service role (API server / n8n)
