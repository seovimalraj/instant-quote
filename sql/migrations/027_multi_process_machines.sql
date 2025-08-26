begin;
alter table public.materials add column if not exists category text check (category in ('metal','resin','alloy','plastic')) default null;
alter table public.machines add column if not exists process_kind text check (process_kind in ('cnc_milling','cnc_turning','injection_molding','casting')) default 'cnc_milling';
alter table public.machines add column if not exists max_work_envelope_mm jsonb;
alter table public.machines add column if not exists params jsonb;
create table if not exists public.machine_resins (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references public.machines(id) on delete cascade,
  material_id uuid references public.materials(id) on delete cascade,
  resin_rate_multiplier numeric default 1.0,
  unique(machine_id, material_id)
);
create table if not exists public.machine_alloys (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references public.machines(id) on delete cascade,
  material_id uuid references public.materials(id) on delete cascade,
  alloy_rate_multiplier numeric default 1.0,
  unique(machine_id, material_id)
);
alter table public.quote_items add column if not exists process_kind text;
update public.quote_items set process_kind = coalesce(process_kind, (select p.process_code from public.parts p where p.id = public.quote_items.part_id)) where process_kind is null;
commit;
