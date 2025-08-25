-- RLS policies generated per SPEC

-- Helper function to check admin or staff roles
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin','staff')
  );
$$ language sql stable;

-- Profiles
alter table public.profiles enable row level security;
drop policy if exists profiles_self_select on public.profiles;
create policy profiles_self_select on public.profiles
  for select using (auth.uid() = id or public.is_admin());
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- Customers
alter table public.customers enable row level security;
drop policy if exists customers_owner_select on public.customers;
create policy customers_owner_select on public.customers
  for select using (owner_id = auth.uid() or public.is_admin());
drop policy if exists customers_owner_insert on public.customers;
create policy customers_owner_insert on public.customers
  for insert with check (owner_id = auth.uid());
drop policy if exists customers_owner_update on public.customers;
create policy customers_owner_update on public.customers
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists customers_admin_all on public.customers;
create policy customers_admin_all on public.customers
  for all using (public.is_admin()) with check (public.is_admin());

-- Processes
alter table public.processes enable row level security;
drop policy if exists processes_public_select on public.processes;
create policy processes_public_select on public.processes
  for select using (is_active or public.is_admin());
drop policy if exists processes_admin_all on public.processes;
create policy processes_admin_all on public.processes
  for all using (public.is_admin()) with check (public.is_admin());

-- Materials
alter table public.materials enable row level security;
drop policy if exists materials_public_select on public.materials;
create policy materials_public_select on public.materials
  for select using (is_active or public.is_admin());
drop policy if exists materials_admin_all on public.materials;
create policy materials_admin_all on public.materials
  for all using (public.is_admin()) with check (public.is_admin());

-- Finishes
alter table public.finishes enable row level security;
drop policy if exists finishes_public_select on public.finishes;
create policy finishes_public_select on public.finishes
  for select using (is_active or public.is_admin());
drop policy if exists finishes_admin_all on public.finishes;
create policy finishes_admin_all on public.finishes
  for all using (public.is_admin()) with check (public.is_admin());

-- Tolerances
alter table public.tolerances enable row level security;
drop policy if exists tolerances_public_select on public.tolerances;
create policy tolerances_public_select on public.tolerances
  for select using (is_active or public.is_admin());
drop policy if exists tolerances_admin_all on public.tolerances;
create policy tolerances_admin_all on public.tolerances
  for all using (public.is_admin()) with check (public.is_admin());

-- Rate cards
alter table public.rate_cards enable row level security;
drop policy if exists rate_cards_public_select on public.rate_cards;
create policy rate_cards_public_select on public.rate_cards
  for select using (is_active or public.is_admin());
drop policy if exists rate_cards_admin_all on public.rate_cards;
create policy rate_cards_admin_all on public.rate_cards
  for all using (public.is_admin()) with check (public.is_admin());

-- Machines
alter table public.machines enable row level security;
drop policy if exists machines_admin_all on public.machines;
create policy machines_admin_all on public.machines
  for all using (public.is_admin()) with check (public.is_admin());

-- Machine materials
alter table public.machine_materials enable row level security;
drop policy if exists machine_materials_admin_all on public.machine_materials;
create policy machine_materials_admin_all on public.machine_materials
  for all using (public.is_admin()) with check (public.is_admin());

-- Machine finishes
alter table public.machine_finishes enable row level security;
drop policy if exists machine_finishes_admin_all on public.machine_finishes;
create policy machine_finishes_admin_all on public.machine_finishes
  for all using (public.is_admin()) with check (public.is_admin());

-- Parts
alter table public.parts enable row level security;
drop policy if exists parts_owner_select on public.parts;
create policy parts_owner_select on public.parts
  for select using (owner_id = auth.uid() or public.is_admin());
drop policy if exists parts_owner_insert on public.parts;
create policy parts_owner_insert on public.parts
  for insert with check (owner_id = auth.uid());
drop policy if exists parts_owner_update on public.parts;
create policy parts_owner_update on public.parts
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists parts_admin_all on public.parts;
create policy parts_admin_all on public.parts
  for all using (public.is_admin()) with check (public.is_admin());

-- Quotes
alter table public.quotes enable row level security;
drop policy if exists quotes_access on public.quotes;
create policy quotes_access on public.quotes
  for select using (
    public.is_admin() or created_by = auth.uid() or
    exists (select 1 from public.customers c where c.id = customer_id and c.owner_id = auth.uid())
  );
drop policy if exists quotes_modify on public.quotes;
create policy quotes_modify on public.quotes
  for insert with check (
    created_by = auth.uid() and exists (select 1 from public.customers c where c.id = customer_id and c.owner_id = auth.uid())
  );
drop policy if exists quotes_update on public.quotes;
create policy quotes_update on public.quotes
  for update using (
    public.is_admin() or created_by = auth.uid() or
    exists (select 1 from public.customers c where c.id = customer_id and c.owner_id = auth.uid())
  ) with check (
    created_by = auth.uid() or public.is_admin()
  );

-- Quote items
alter table public.quote_items enable row level security;
drop policy if exists quote_items_access on public.quote_items;
create policy quote_items_access on public.quote_items
  for select using (
    public.is_admin() or exists (
      select 1 from public.quotes q
      join public.customers c on c.id = q.customer_id
      where q.id = quote_id and (q.created_by = auth.uid() or c.owner_id = auth.uid())
    )
  );
drop policy if exists quote_items_modify on public.quote_items;
create policy quote_items_modify on public.quote_items
  for all using (
    public.is_admin() or exists (
      select 1 from public.quotes q
      join public.customers c on c.id = q.customer_id
      where q.id = quote_id and (q.created_by = auth.uid() or c.owner_id = auth.uid())
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.quotes q
      join public.customers c on c.id = q.customer_id
      where q.id = quote_id and (q.created_by = auth.uid() or c.owner_id = auth.uid())
    )
  );

-- Orders
alter table public.orders enable row level security;
drop policy if exists orders_access on public.orders;
create policy orders_access on public.orders
  for select using (
    public.is_admin() or exists (
      select 1 from public.customers c where c.id = customer_id and c.owner_id = auth.uid()
    )
  );
drop policy if exists orders_modify on public.orders;
create policy orders_modify on public.orders
  for update using (
    public.is_admin() or exists (
      select 1 from public.customers c where c.id = customer_id and c.owner_id = auth.uid()
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.customers c where c.id = customer_id and c.owner_id = auth.uid()
    )
  );

-- Order items
alter table public.order_items enable row level security;
drop policy if exists order_items_access on public.order_items;
create policy order_items_access on public.order_items
  for select using (
    public.is_admin() or exists (
      select 1 from public.orders o
      join public.customers c on c.id = o.customer_id
      where o.id = order_id and c.owner_id = auth.uid()
    )
  );
drop policy if exists order_items_modify on public.order_items;
create policy order_items_modify on public.order_items
  for all using (
    public.is_admin() or exists (
      select 1 from public.orders o
      join public.customers c on c.id = o.customer_id
      where o.id = order_id and c.owner_id = auth.uid()
    )
  ) with check (
    public.is_admin() or exists (
      select 1 from public.orders o
      join public.customers c on c.id = o.customer_id
      where o.id = order_id and c.owner_id = auth.uid()
    )
  );

-- Messages
alter table public.messages enable row level security;
drop policy if exists messages_access on public.messages;
create policy messages_access on public.messages
  for select using (
    public.is_admin() or exists (
      select 1 from public.quotes q
      join public.customers c on c.id = q.customer_id
      where q.id = quote_id and (q.created_by = auth.uid() or c.owner_id = auth.uid())
    )
  );
drop policy if exists messages_modify on public.messages;
create policy messages_modify on public.messages
  for insert with check (
    public.is_admin() or exists (
      select 1 from public.quotes q
      join public.customers c on c.id = q.customer_id
      where q.id = quote_id and (q.created_by = auth.uid() or c.owner_id = auth.uid())
    )
  );

-- Payments
alter table public.payments enable row level security;
drop policy if exists payments_access on public.payments;
create policy payments_access on public.payments
  for select using (
    public.is_admin() or exists (
      select 1 from public.quotes q
      join public.customers c on c.id = q.customer_id
      where q.id = quote_id and c.owner_id = auth.uid()
    )
  );
drop policy if exists payments_insert on public.payments;
create policy payments_insert on public.payments
  for insert with check (public.is_admin());

-- Activities
alter table public.activities enable row level security;
drop policy if exists activities_access on public.activities;
create policy activities_access on public.activities
  for select using (
    public.is_admin() or actor_id = auth.uid() or exists (
      select 1 from public.customers c where c.id = customer_id and c.owner_id = auth.uid()
    )
  );
drop policy if exists activities_insert on public.activities;
create policy activities_insert on public.activities
  for insert with check (auth.uid() = actor_id);

drop policy if exists activities_admin_all on public.activities;
create policy activities_admin_all on public.activities
  for all using (public.is_admin()) with check (public.is_admin());

-- Shipments
alter table public.shipments enable row level security;
drop policy if exists shipments_access on public.shipments;
create policy shipments_access on public.shipments
  for select using (
    public.is_admin() or exists (
      select 1 from public.orders o join public.customers c on c.id = o.customer_id
      where o.id = order_id and c.owner_id = auth.uid()
    )
  );
drop policy if exists shipments_admin_all on public.shipments;
create policy shipments_admin_all on public.shipments
  for all using (public.is_admin()) with check (public.is_admin());

-- Abandoned quotes
alter table public.abandoned_quotes enable row level security;
drop policy if exists abandoned_admin_all on public.abandoned_quotes;
create policy abandoned_admin_all on public.abandoned_quotes
  for all using (public.is_admin()) with check (public.is_admin());

-- Custom forms
alter table public.custom_forms enable row level security;
drop policy if exists custom_forms_select on public.custom_forms;
create policy custom_forms_select on public.custom_forms
  for select using (
    public.is_admin() or (audience = 'customer' and is_active)
  );
drop policy if exists custom_forms_admin_all on public.custom_forms;
create policy custom_forms_admin_all on public.custom_forms
  for all using (public.is_admin()) with check (public.is_admin());

-- Custom form responses
alter table public.custom_form_responses enable row level security;
drop policy if exists cfr_access on public.custom_form_responses;
create policy cfr_access on public.custom_form_responses
  for select using (
    public.is_admin() or respondent_id = auth.uid()
  );
drop policy if exists cfr_insert on public.custom_form_responses;
create policy cfr_insert on public.custom_form_responses
  for insert with check (respondent_id = auth.uid());
drop policy if exists cfr_admin_all on public.custom_form_responses;
create policy cfr_admin_all on public.custom_form_responses
  for all using (public.is_admin()) with check (public.is_admin());
