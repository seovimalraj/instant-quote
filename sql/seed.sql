-- Demo data seed
-- Catalogs
insert into public.processes (code, name) values
  ('cnc_milling','CNC Milling'),
  ('cnc_turning','CNC Turning'),
  ('injection_molding','Injection Molding'),
  ('casting','Casting')
on conflict (code) do update set name=excluded.name;

insert into public.materials (process_code, name, category, density_kg_m3, cost_per_kg) values
  ('cnc_milling','Aluminum 6061','metal',2700,6),
  ('cnc_turning','Stainless Steel 304','alloy',8000,8),
  ('injection_molding','Nylon 12','resin',1010,3),
  ('casting','Zamak 3','alloy',6800,5)
on conflict (process_code,name) do update set category=excluded.category,
  density_kg_m3=excluded.density_kg_m3, cost_per_kg=excluded.cost_per_kg;

insert into public.finishes (process_code, name, type, cost_per_m2, setup_fee) values
  ('cnc_milling','Anodized','coating',10,30),
  ('cnc_turning','Polished','polish',8,20),
  ('casting','As Cast','raw',0,0)
on conflict (process_code,name) do update set type=excluded.type,
  cost_per_m2=excluded.cost_per_m2, setup_fee=excluded.setup_fee;

insert into public.tolerances (process_code, name, tol_min_mm, tol_max_mm, cost_multiplier) values
  ('cnc_milling','Standard',-0.1,0.1,1),
  ('cnc_milling','High',-0.05,0.05,1.2),
  ('cnc_turning','Standard',-0.1,0.1,1)
on conflict (process_code,name) do update set
  tol_min_mm=excluded.tol_min_mm, tol_max_mm=excluded.tol_max_mm, cost_multiplier=excluded.cost_multiplier;

insert into public.rate_cards (region, currency, three_axis_rate_per_min, five_axis_rate_per_min, turning_rate_per_min, machine_setup_fee, tax_rate, shipping_flat)
values ('us-east','USD',1.2,1.6,1.0,50,0.07,15)
on conflict (region) do update set currency=excluded.currency,
 three_axis_rate_per_min=excluded.three_axis_rate_per_min,
 five_axis_rate_per_min=excluded.five_axis_rate_per_min,
 turning_rate_per_min=excluded.turning_rate_per_min,
 machine_setup_fee=excluded.machine_setup_fee,
 tax_rate=excluded.tax_rate,
 shipping_flat=excluded.shipping_flat;

-- Users and customer
with admin_user as (
  insert into auth.users (email, encrypted_password, email_confirmed_at)
  values ('admin@example.com', crypt('password', gen_salt('bf')), now())
  on conflict (email) do update set email=excluded.email
  returning id
), customer_user as (
  insert into auth.users (email, encrypted_password, email_confirmed_at)
  values ('buyer@example.com', crypt('password', gen_salt('bf')), now())
  on conflict (email) do update set email=excluded.email
  returning id
), admin_profile as (
  insert into public.profiles (id,email,full_name,role)
  select id,'admin@example.com','Demo Admin','admin' from admin_user
  on conflict (id) do update set email=excluded.email, full_name=excluded.full_name, role=excluded.role
  returning id
), buyer_profile as (
  insert into public.profiles (id,email,full_name,role)
  select id,'buyer@example.com','Acme Buyer','customer' from customer_user
  on conflict (id) do update set email=excluded.email, full_name=excluded.full_name, role=excluded.role
  returning id
)
insert into public.customers (id, owner_id, name, website)
select '00000000-0000-0000-0000-000000000010', buyer_profile.id, 'Acme Corp', 'https://acme.example'
from buyer_profile
on conflict (id) do update set owner_id=excluded.owner_id, name=excluded.name, website=excluded.website;

-- Machines
insert into public.machines (name, process_code, process_kind, axis_count, rate_per_min, setup_fee, is_active)
values
  ('HAAS VF-2SS','cnc_milling','cnc_milling',3,1.2,50,true),
  ('Hermle C42','cnc_milling','cnc_milling',5,1.6,75,true),
  ('Mazak Quick Turn','cnc_turning','cnc_turning',2,1.0,40,true),
  ('Arburg 200T','injection_molding','injection_molding',0,0.03,100,true),
  ('Buhler Casting Line','casting','casting',0,0.05,200,true)
on conflict (name) do update set process_code=excluded.process_code;

-- Machine links
insert into public.machine_materials (machine_id, material_id)
select m.id, mat.id from public.machines m, public.materials mat
where m.name in ('HAAS VF-2SS','Hermle C42') and mat.name in ('Aluminum 6061','Stainless Steel 304')
on conflict do nothing;

insert into public.machine_alloys (machine_id, material_id)
select m.id, mat.id from public.machines m, public.materials mat
where m.name='Buhler Casting Line' and mat.name='Zamak 3'
on conflict do nothing;

insert into public.machine_resins (machine_id, material_id)
select m.id, mat.id from public.machines m, public.materials mat
where m.name='Arburg 200T' and mat.name='Nylon 12'
on conflict do nothing;

insert into public.machine_finishes (machine_id, finish_id)
select m.id, f.id from public.machines m, public.finishes f
where (m.name in ('HAAS VF-2SS','Hermle C42') and f.name='Anodized')
   or (m.name='Mazak Quick Turn' and f.name='Polished')
   or (m.name='Buhler Casting Line' and f.name='As Cast')
on conflict do nothing;

-- Capacity for next 30 days
insert into public.machine_capacity_days (machine_id, day, minutes_available)
select m.id, (now()::date + s.a) as day, 480
from public.machines m
cross join generate_series(0,29) as s(a)
on conflict do nothing;

-- Part
insert into public.parts (id, owner_id, customer_id, file_url, file_name, file_ext, size_bytes, process_code)
values ('00000000-0000-0000-0000-000000000020',
        (select id from public.profiles where email='buyer@example.com'),
        '00000000-0000-0000-0000-000000000010',
        'https://example.com/fixture1.stl','fixture1.stl','stl',123456,'cnc_milling')
on conflict (id) do update set file_url=excluded.file_url;

-- Quotes
insert into public.quotes (id, customer_id, created_by, status, region, subtotal, tax, total)
values
 ('00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000010',(select id from public.profiles where email='buyer@example.com'),'draft','us-east',100,7,107),
 ('00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000010',(select id from public.profiles where email='buyer@example.com'),'sent','us-east',100,7,107),
 ('00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000010',(select id from public.profiles where email='buyer@example.com'),'accepted','us-east',100,7,107)
on conflict (id) do update set status=excluded.status;

-- Quote items
insert into public.quote_items (id, quote_id, part_id, process_code, material_id, finish_id, tolerance_id, quantity, unit_price, line_total, machine_id)
values
 ('00000000-0000-0000-0000-000000000040','00000000-0000-0000-0000-000000000030','00000000-0000-0000-0000-000000000020','cnc_milling',
   (select id from public.materials where name='Aluminum 6061'),
   (select id from public.finishes where name='Anodized'),
   (select id from public.tolerances where name='Standard' and process_code='cnc_milling'),
   1,100,100,(select id from public.machines where name='Hermle C42')),
 ('00000000-0000-0000-0000-000000000041','00000000-0000-0000-0000-000000000031','00000000-0000-0000-0000-000000000020','cnc_turning',
   (select id from public.materials where name='Stainless Steel 304'),
   (select id from public.finishes where name='Polished'),
   (select id from public.tolerances where name='Standard' and process_code='cnc_turning'),
   1,120,120,(select id from public.machines where name='Mazak Quick Turn')),
 ('00000000-0000-0000-0000-000000000042','00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000020','cnc_milling',
   (select id from public.materials where name='Aluminum 6061'),
   (select id from public.finishes where name='Anodized'),
   (select id from public.tolerances where name='High' and process_code='cnc_milling'),
   1,150,150,(select id from public.machines where name='HAAS VF-2SS'))
on conflict (id) do update set quote_id=excluded.quote_id;

-- Messages
insert into public.messages (id, quote_id, sender_id, sender_role, content)
values
 ('00000000-0000-0000-0000-000000000060','00000000-0000-0000-0000-000000000032',(select id from public.profiles where email='buyer@example.com'),'customer','Can you expedite this order?'),
 ('00000000-0000-0000-0000-000000000061','00000000-0000-0000-0000-000000000032',(select id from public.profiles where email='admin@example.com'),'staff','Yes, we can ship in two days.')
on conflict (id) do update set content=excluded.content;

-- Order
insert into public.orders (id, quote_id, customer_id, status, total)
values ('00000000-0000-0000-0000-000000000050','00000000-0000-0000-0000-000000000032','00000000-0000-0000-0000-000000000010','created',107)
on conflict (id) do update set status=excluded.status;

insert into public.order_items (order_id, quote_item_id, part_id, process_code, quantity, unit_price, line_total)
values ('00000000-0000-0000-0000-000000000050','00000000-0000-0000-0000-000000000042','00000000-0000-0000-0000-000000000020','cnc_milling',1,150,150)
on conflict do nothing;
