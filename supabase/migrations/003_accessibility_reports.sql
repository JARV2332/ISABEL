-- Reportes comunitarios de accesibilidad (Módulo Movilidad — Guatemala)

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

create index if not exists accessibility_reports_created_at_idx
  on public.accessibility_reports (created_at desc);

alter table public.accessibility_reports enable row level security;

drop policy if exists "Allow public read accessibility_reports" on public.accessibility_reports;
drop policy if exists "Allow public insert accessibility_reports" on public.accessibility_reports;

create policy "Allow public read accessibility_reports"
  on public.accessibility_reports for select using (true);

create policy "Allow public insert accessibility_reports"
  on public.accessibility_reports for insert with check (true);
