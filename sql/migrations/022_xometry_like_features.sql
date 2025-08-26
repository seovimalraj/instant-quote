begin;
alter table public.quotes add column if not exists is_itar boolean default false;
create table if not exists public.certifications (id uuid primary key default gen_random_uuid(), code text unique not null, name text not null, description text, created_at timestamptz default now());
create table if not exists public.vendor_certifications (id uuid primary key default gen_random_uuid(), vendor_id uuid references public.vendors(id) on delete cascade, certification_id uuid references public.certifications(id) on delete cascade, unique(vendor_id, certification_id));
create table if not exists public.machine_capacity_days (id uuid primary key default gen_random_uuid(), machine_id uuid references public.machines(id) on delete cascade, day date not null, minutes_available int not null, minutes_reserved int not null default 0, unique(machine_id, day));
create table if not exists public.shared_links (id uuid primary key default gen_random_uuid(), quote_id uuid references public.quotes(id) on delete cascade, token text unique not null, expires_at timestamptz, created_by uuid references public.profiles(id), created_at timestamptz default now());
alter table public.rate_cards add column if not exists carbon_offset_rate_per_order numeric default 0;
create table if not exists public.team_defaults (id uuid primary key default gen_random_uuid(), owner_id uuid references public.profiles(id) on delete cascade, default_process text, default_material_id uuid, default_finish_id uuid, default_tolerance_id uuid, default_quantities int[] default '{1,5,10,25}', default_lead_time text default 'standard', created_at timestamptz default now(), updated_at timestamptz default now());
commit;
