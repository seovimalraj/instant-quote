begin;
create table if not exists public.machines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  process_code text not null references public.processes(code),
  axis_count int default 3,
  envelope_mm jsonb, -- {x:..., y:..., z:...}
  rate_per_min numeric not null,
  setup_fee numeric default 0,
  overhead_multiplier numeric default 1.0,
  expedite_multiplier numeric default 1.2,
  utilization_target numeric default 0.7,
  margin_pct numeric default 0.15,
  is_active boolean default true,
  meta jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.machine_materials (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references public.machines(id) on delete cascade,
  material_id uuid references public.materials(id) on delete cascade,
  material_rate_multiplier numeric default 1.0, -- extra penalty for hard-to-cut materials
  unique (machine_id, material_id)
);

create table if not exists public.machine_finishes (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid references public.machines(id) on delete cascade,
  finish_id uuid references public.finishes(id) on delete cascade,
  finish_rate_multiplier numeric default 1.0,
  unique (machine_id, finish_id)
);

-- geometry helpers already exist on parts, ensure indexes
create index if not exists idx_parts_process on public.parts(process_code);
create index if not exists idx_quote_items_quote on public.quote_items(quote_id);

-- quotes: add machine selection
alter table public.quote_items add column if not exists machine_id uuid references public.machines(id);

commit;
