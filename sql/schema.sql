-- SQL schema generated per SPEC
-- Enable required extension
create extension if not exists pgcrypto;

-- Trigger function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text check (role in ('admin','staff','customer','vendor')) default 'customer',
  company text,
  phone text,
  region text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- Customers
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  name text not null,
  website text,
  billing_address jsonb,
  shipping_address jsonb,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
drop trigger if exists trg_customers_updated on public.customers;
create trigger trg_customers_updated
  before update on public.customers
  for each row execute function public.handle_updated_at();

-- Processes
create table if not exists public.processes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  is_active boolean default true,
  meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
drop trigger if exists trg_processes_updated on public.processes;
create trigger trg_processes_updated
  before update on public.processes
  for each row execute function public.handle_updated_at();

-- Materials
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  process_code text references public.processes(code),
  name text not null,
  density_kg_m3 numeric,
  cost_per_kg numeric,
  machinability_factor numeric default 1.0,
  is_active boolean default true,
  meta jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(process_code, name)
);
drop trigger if exists trg_materials_updated on public.materials;
create trigger trg_materials_updated
  before update on public.materials
  for each row execute function public.handle_updated_at();

-- Finishes
create table if not exists public.finishes (
  id uuid primary key default gen_random_uuid(),
  process_code text references public.processes(code),
  name text not null,
  type text,
  cost_per_m2 numeric default 0,
  setup_fee numeric default 0,
  lead_time_days integer default 0,
  is_active boolean default true,
  meta jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(process_code, name)
);
drop trigger if exists trg_finishes_updated on public.finishes;
create trigger trg_finishes_updated
  before update on public.finishes
  for each row execute function public.handle_updated_at();

-- Tolerances
create table if not exists public.tolerances (
  id uuid primary key default gen_random_uuid(),
  process_code text references public.processes(code),
  name text not null,
  tol_min_mm numeric,
  tol_max_mm numeric,
  cost_multiplier numeric default 1.0,
  is_active boolean default true,
  meta jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(process_code, name)
);
drop trigger if exists trg_tolerances_updated on public.tolerances;
create trigger trg_tolerances_updated
  before update on public.tolerances
  for each row execute function public.handle_updated_at();

-- Rate cards
create table if not exists public.rate_cards (
  id uuid primary key default gen_random_uuid(),
  region text,
  currency text default 'USD',
  three_axis_rate_per_min numeric,
  five_axis_rate_per_min numeric,
  turning_rate_per_min numeric,
  sheet_setup_fee numeric default 0,
  bend_rate_per_bend numeric default 0,
  laser_rate_per_min numeric default 0,
  fdm_rate_per_cm3 numeric default 0,
  sla_rate_per_cm3 numeric default 0,
  sls_rate_per_cm3 numeric default 0,
  injection_mold_setup numeric default 0,
  injection_part_rate numeric default 0,
  machine_setup_fee numeric default 0,
  tax_rate numeric default 0,
  shipping_flat numeric default 0,
  is_active boolean default true,
  meta jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
drop trigger if exists trg_rate_cards_updated on public.rate_cards;
create trigger trg_rate_cards_updated
  before update on public.rate_cards
  for each row execute function public.handle_updated_at();

-- Parts
create table if not exists public.parts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  file_url text not null,
  file_name text,
  file_ext text,
  size_bytes bigint,
  bbox jsonb,
  surface_area_mm2 numeric,
  volume_mm3 numeric,
  units text default 'mm',
  process_code text,
  preview_url text,
  status text default 'uploaded',
  dfm jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
drop trigger if exists trg_parts_updated on public.parts;
create trigger trg_parts_updated
  before update on public.parts
  for each row execute function public.handle_updated_at();

-- Quotes
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  status text check (status in ('draft','sent','accepted','rejected','expired','abandoned','paid','in_production','completed')) default 'draft',
  currency text default 'USD',
  region text,
  subtotal numeric default 0,
  tax numeric default 0,
  shipping numeric default 0,
  total numeric default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
drop trigger if exists trg_quotes_updated on public.quotes;
create trigger trg_quotes_updated
  before update on public.quotes
  for each row execute function public.handle_updated_at();

-- Quote items
create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  part_id uuid references public.parts(id) on delete set null,
  process_code text,
  material_id uuid references public.materials(id),
  finish_id uuid references public.finishes(id),
  tolerance_id uuid references public.tolerances(id),
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  line_total numeric not null default 0,
  pricing_breakdown jsonb,
  lead_time_days integer,
  dfm jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
drop trigger if exists trg_quote_items_updated on public.quote_items;
create trigger trg_quote_items_updated
  before update on public.quote_items
  for each row execute function public.handle_updated_at();

-- Messages
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  sender_role text,
  content text not null,
  attachments jsonb,
  created_at timestamptz default now()
);

-- Payments
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete set null,
  amount numeric not null,
  currency text default 'USD',
  provider text default 'stripe',
  external_id text,
  status text,
  raw jsonb,
  created_at timestamptz default now()
);

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid references public.quotes(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  status text check (status in ('created','scheduled','in_production','qa','ready_to_ship','shipped','delivered','closed')) default 'created',
  currency text default 'USD',
  total numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
drop trigger if exists trg_orders_updated on public.orders;
create trigger trg_orders_updated
  before update on public.orders
  for each row execute function public.handle_updated_at();

-- Order items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  quote_item_id uuid references public.quote_items(id) on delete set null,
  part_id uuid references public.parts(id) on delete set null,
  process_code text,
  quantity integer not null default 1,
  unit_price numeric,
  line_total numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
drop trigger if exists trg_order_items_updated on public.order_items;
create trigger trg_order_items_updated
  before update on public.order_items
  for each row execute function public.handle_updated_at();

-- Production steps
create table if not exists public.production_steps (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  step text,
  status text default 'pending',
  notes text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now()
);

-- Shipments
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  carrier text,
  tracking_number text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  address jsonb,
  documents jsonb,
  created_at timestamptz default now()
);

-- Activities
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  part_id uuid references public.parts(id) on delete set null,
  type text,
  data jsonb,
  created_at timestamptz default now()
);

-- Abandoned quotes
create table if not exists public.abandoned_quotes (
  id uuid primary key default gen_random_uuid(),
  email text,
  part_file_url text,
  activity jsonb,
  is_claimed boolean default false,
  created_at timestamptz default now()
);

-- Custom forms
create table if not exists public.custom_forms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  audience text check (audience in ('customer','admin')) default 'customer',
  schema jsonb not null,
  is_active boolean default true,
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
drop trigger if exists trg_custom_forms_updated on public.custom_forms;
create trigger trg_custom_forms_updated
  before update on public.custom_forms
  for each row execute function public.handle_updated_at();

-- Custom form responses
create table if not exists public.custom_form_responses (
  id uuid primary key default gen_random_uuid(),
  form_id uuid references public.custom_forms(id) on delete cascade,
  respondent_id uuid references public.profiles(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  order_id uuid references public.orders(id) on delete set null,
  data jsonb not null,
  created_at timestamptz default now()
);
