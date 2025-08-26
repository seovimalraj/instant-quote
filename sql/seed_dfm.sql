-- DFM demo data seed
-- Materials and certifications
insert into public.materials (process_code, name, category, density_kg_m3, cost_per_kg) values
  ('cnc_milling','Aluminum 6061','metal',2700,6),
  ('cnc_milling','Stainless Steel 304','alloy',8000,8),
  ('injection_molding','ABS','resin',1040,2.5),
  ('casting','Aluminum A356','alloy',2680,5)
on conflict (process_code,name) do update set category=excluded.category,
  density_kg_m3=excluded.density_kg_m3, cost_per_kg=excluded.cost_per_kg;

insert into public.tolerances (process_code, name, tol_min_mm, tol_max_mm, cost_multiplier) values
  ('cnc_milling','ISO 2768-m',-0.1,0.1,1),
  ('cnc_milling','ISO 2768-f',-0.05,0.05,1.2)
on conflict (process_code,name) do update set
  tol_min_mm=excluded.tol_min_mm, tol_max_mm=excluded.tol_max_mm, cost_multiplier=excluded.cost_multiplier;

insert into public.certifications (code, name) values
  ('iso9001','ISO 9001'),
  ('as9100','AS9100'),
  ('itar','ITAR')
on conflict (code) do update set name=excluded.name;

-- Machines and capacity
insert into public.machines (name, process_code, process_kind, axis_count, rate_per_min, setup_fee, is_active) values
  ('3-Axis Mill','cnc_milling','cnc_milling',3,1.2,50,true),
  ('5-Axis Mill','cnc_milling','cnc_milling',5,1.6,75,true),
  ('200T Press','injection_molding','injection_molding',0,0.03,100,true),
  ('Casting Line','casting','casting',0,0.05,200,true)
on conflict (name) do update set process_code=excluded.process_code;

insert into public.machine_capacity_days (machine_id, day, minutes_available)
select m.id, (now()::date + s.a) as day, 480
from public.machines m
cross join generate_series(0,29) as s(a)
on conflict do nothing;

-- Parts uploaded with previews
insert into public.parts (id, owner_id, customer_id, file_url, file_name, file_ext, size_bytes, process_code, preview_url)
values
  ('00000000-0000-0000-0000-000000000021', null, null, 'https://storage.example.com/parts/cube.stl','cube.stl','stl',1024,'cnc_milling','https://storage.example.com/previews/cube.png'),
  ('00000000-0000-0000-0000-000000000022', null, null, 'https://storage.example.com/parts/bracket.obj','bracket.obj','obj',2048,'cnc_milling','https://storage.example.com/previews/bracket.png'),
  ('00000000-0000-0000-0000-000000000023', null, null, 'https://storage.example.com/parts/housing.step','housing.step','step',4096,'casting','https://storage.example.com/previews/housing.png')
on conflict (id) do update set file_url=excluded.file_url, preview_url=excluded.preview_url;

update public.parts
set dfm = jsonb_build_object(
  'report_url','https://storage.example.com/dfm/cube-report.pdf',
  'overlays', jsonb_build_array(jsonb_build_object('rule','thin_wall','faces', jsonb_build_array(1,2,3))),
  'qap_url','https://storage.example.com/dfm/cube-qap.pdf'
)
where id='00000000-0000-0000-0000-000000000021';
