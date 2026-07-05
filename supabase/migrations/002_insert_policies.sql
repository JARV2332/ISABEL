-- ISABEL — políticas de inserción con clave publishable/anon
-- Ejecutar después de 001_interactions.sql

create policy "Allow public insert interactions"
  on public.interactions for insert
  with check (true);

create policy "Allow public insert iot_events"
  on public.iot_events for insert
  with check (true);
