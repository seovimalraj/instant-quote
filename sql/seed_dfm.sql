-- Demo DFM seed data
insert into public.certifications (name) values ('ISO9001') on conflict do nothing;
insert into public.certifications (name) values ('AS9100') on conflict do nothing;

-- Preload a sample part and capacity
insert into public.parts (id, file_name, file_ext, process_code)
values ('00000000-0000-0000-0000-000000000099', 'demo.stl', 'stl', 'cnc_milling')
on conflict do nothing;

insert into public.machine_capacity_days (machine_id, day, minutes_available)
select id, current_date, 480 from public.machines limit 1
on conflict do nothing;
