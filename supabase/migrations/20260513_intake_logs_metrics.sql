-- Support adherence tracking for patient-prescription intake logs.
-- Apply this migration in Supabase before enabling the patient log flow.

alter table public.intake_logs
  add column if not exists patient_id uuid,
  add column if not exists observations text;

alter table public.intake_logs
  drop constraint if exists intake_logs_patient_id_fkey;

alter table public.intake_logs
  add constraint intake_logs_patient_id_fkey
  foreign key (patient_id) references public.profiles(id) on delete cascade;

create index if not exists intake_logs_patient_id_idx
  on public.intake_logs (patient_id);

create index if not exists intake_logs_prescription_id_idx
  on public.intake_logs (prescription_id);

create index if not exists intake_logs_patient_prescription_idx
  on public.intake_logs (patient_id, prescription_id, scheduled_time);
