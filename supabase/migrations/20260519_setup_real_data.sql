-- ============================================================================
-- MIGRACIÓN: Configurar dashboard de adherencia con datos reales
-- ============================================================================
-- Ejecuta este SQL en tu consola de Supabase (SQL Editor)
-- Pasos: 1. Abre https://supabase.com → Tu proyecto → SQL Editor
--        2. Copia TODO este contenido
--        3. Pega y haz clic en "Run"

-- 1. APLICAR MIGRACIÓN PRINCIPAL (agregar patient_id a intake_logs)
-- ============================================================================
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

create index if not exists intake_logs_prescription_idx
  on public.intake_logs (prescription_id);

create index if not exists intake_logs_patient_prescription_idx
  on public.intake_logs (patient_id, prescription_id, scheduled_time);

-- 2. CREAR PERFILES DE PACIENTES (si no existen)
-- ============================================================================
-- Paciente 1: María López
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
SELECT 
  'patient-maria-001'::uuid,
  'María López Gómez',
  'paciente',
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'patient-maria-001'::uuid);

-- Paciente 2: Juan Pérez  
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
SELECT
  'patient-juan-001'::uuid,
  'Juan Pérez Ramírez',
  'paciente',
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'patient-juan-001'::uuid);

-- Paciente 3: Ana Torres
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
SELECT
  'patient-ana-001'::uuid,
  'Ana Torres Martínez',
  'paciente',
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'patient-ana-001'::uuid);

-- Paciente 4: Luis Hernández
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
SELECT
  'patient-luis-001'::uuid,
  'Luis Hernández Díaz',
  'paciente',
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'patient-luis-001'::uuid);

-- Paciente 5: Carlos Ruíz
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
SELECT
  'patient-carlos-001'::uuid,
  'Carlos Ruíz Sánchez',
  'paciente',
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'patient-carlos-001'::uuid);

-- 3. CREAR PERFIL DEL MÉDICO (si no existe)
-- ============================================================================
INSERT INTO public.profiles (id, full_name, role, created_at, updated_at)
SELECT
  'doctor-diego-001'::uuid,
  'Dr. Diego Martínez',
  'medico',
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = 'doctor-diego-001'::uuid);

-- 4. CREAR RELACIONES MÉDICO-PACIENTE
-- ============================================================================
INSERT INTO public.user_relations (id, superior_id, patient_id, relation_type, created_at, updated_at)
SELECT 'rel-diego-maria'::uuid, 'doctor-diego-001'::uuid, 'patient-maria-001'::uuid, 'medico-paciente', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.user_relations WHERE superior_id = 'doctor-diego-001'::uuid AND patient_id = 'patient-maria-001'::uuid);

INSERT INTO public.user_relations (id, superior_id, patient_id, relation_type, created_at, updated_at)
SELECT 'rel-diego-juan'::uuid, 'doctor-diego-001'::uuid, 'patient-juan-001'::uuid, 'medico-paciente', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.user_relations WHERE superior_id = 'doctor-diego-001'::uuid AND patient_id = 'patient-juan-001'::uuid);

INSERT INTO public.user_relations (id, superior_id, patient_id, relation_type, created_at, updated_at)
SELECT 'rel-diego-ana'::uuid, 'doctor-diego-001'::uuid, 'patient-ana-001'::uuid, 'medico-paciente', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.user_relations WHERE superior_id = 'doctor-diego-001'::uuid AND patient_id = 'patient-ana-001'::uuid);

INSERT INTO public.user_relations (id, superior_id, patient_id, relation_type, created_at, updated_at)
SELECT 'rel-diego-luis'::uuid, 'doctor-diego-001'::uuid, 'patient-luis-001'::uuid, 'medico-paciente', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.user_relations WHERE superior_id = 'doctor-diego-001'::uuid AND patient_id = 'patient-luis-001'::uuid);

INSERT INTO public.user_relations (id, superior_id, patient_id, relation_type, created_at, updated_at)
SELECT 'rel-diego-carlos'::uuid, 'doctor-diego-001'::uuid, 'patient-carlos-001'::uuid, 'medico-paciente', now(), now()
WHERE NOT EXISTS (SELECT 1 FROM public.user_relations WHERE superior_id = 'doctor-diego-001'::uuid AND patient_id = 'patient-carlos-001'::uuid);

-- 5. CREAR PRESCRIPCIONES
-- ============================================================================
INSERT INTO public.prescriptions (id, patient_id, medication_name, dosage, frequency, instructions, created_at, updated_at, status)
SELECT 'presc-maria-001'::uuid, 'patient-maria-001'::uuid, 'Metformina', '500mg', 'Cada 8 horas', 'Tomar con comida', now(), now(), 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.prescriptions WHERE id = 'presc-maria-001'::uuid);

INSERT INTO public.prescriptions (id, patient_id, medication_name, dosage, frequency, instructions, created_at, updated_at, status)
SELECT 'presc-juan-001'::uuid, 'patient-juan-001'::uuid, 'Lisinopril', '10mg', 'Una vez al día', 'Por la mañana', now(), now(), 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.prescriptions WHERE id = 'presc-juan-001'::uuid);

INSERT INTO public.prescriptions (id, patient_id, medication_name, dosage, frequency, instructions, created_at, updated_at, status)
SELECT 'presc-ana-001'::uuid, 'patient-ana-001'::uuid, 'Atorvastatina', '20mg', 'Una vez al día', 'Por la noche', now(), now(), 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.prescriptions WHERE id = 'presc-ana-001'::uuid);

INSERT INTO public.prescriptions (id, patient_id, medication_name, dosage, frequency, instructions, created_at, updated_at, status)
SELECT 'presc-luis-001'::uuid, 'patient-luis-001'::uuid, 'Amlodipina', '5mg', 'Una vez al día', 'Por la mañana', now(), now(), 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.prescriptions WHERE id = 'presc-luis-001'::uuid);

INSERT INTO public.prescriptions (id, patient_id, medication_name, dosage, frequency, instructions, created_at, updated_at, status)
SELECT 'presc-carlos-001'::uuid, 'patient-carlos-001'::uuid, 'Omeprazol', '20mg', 'Una vez al día', 'En ayunas', now(), now(), 'active'
WHERE NOT EXISTS (SELECT 1 FROM public.prescriptions WHERE id = 'presc-carlos-001'::uuid);

-- 6. LIMPIAR INTAKE LOGS ANTERIORES (opcional - descomenta si quieres limpiar)
-- ============================================================================
-- DELETE FROM public.intake_logs WHERE patient_id IN ('patient-maria-001'::uuid, 'patient-juan-001'::uuid, 'patient-ana-001'::uuid, 'patient-luis-001'::uuid, 'patient-carlos-001'::uuid);

-- 7. CREAR INTAKE LOGS (últimos 7 días con patrones realistas de adherencia)
-- ============================================================================
-- María López: Alta adherencia (85%)
INSERT INTO public.intake_logs (id, prescription_id, patient_id, scheduled_time, actual_time, status, omission_reason, observations, created_at)
SELECT gen_random_uuid(), 'presc-maria-001'::uuid, 'patient-maria-001'::uuid,
       now() - (interval '1 day' * (random() * 7)::int) + (interval '1 hour' * 8),
       now() - (interval '1 day' * (random() * 7)::int) + (interval '1 hour' * 8) + (interval '5 minutes' * (random() * 30)::int),
       CASE WHEN random() < 0.85 THEN 'cumplido' WHEN random() < 0.95 THEN 'atrasado' ELSE 'omitido' END,
       CASE WHEN random() > 0.95 THEN 'Olvido' ELSE NULL END,
       'Paciente cumple bien con medicación',
       now()
FROM generate_series(1, 15);

-- Juan Pérez: Baja adherencia (45%)
INSERT INTO public.intake_logs (id, prescription_id, patient_id, scheduled_time, actual_time, status, omission_reason, observations, created_at)
SELECT gen_random_uuid(), 'presc-juan-001'::uuid, 'patient-juan-001'::uuid,
       now() - (interval '1 day' * (random() * 7)::int) + (interval '1 hour' * 10),
       CASE WHEN random() < 0.45 THEN now() - (interval '1 day' * (random() * 7)::int) + (interval '1 hour' * 10) + (interval '10 minutes' * (random() * 30)::int) ELSE NULL END,
       CASE WHEN random() < 0.45 THEN 'cumplido' WHEN random() < 0.55 THEN 'omitido' ELSE 'atrasado' END,
       CASE WHEN random() > 0.70 THEN 'Viaje' WHEN random() > 0.40 THEN 'Olvido' ELSE NULL END,
       'Paciente con adherencia irregular',
       now()
FROM generate_series(1, 15);

-- Ana Torres: Alta adherencia (80%)
INSERT INTO public.intake_logs (id, prescription_id, patient_id, scheduled_time, actual_time, status, omission_reason, observations, created_at)
SELECT gen_random_uuid(), 'presc-ana-001'::uuid, 'patient-ana-001'::uuid,
       now() - (interval '1 day' * (random() * 7)::int) + (interval '1 hour' * 21),
       now() - (interval '1 day' * (random() * 7)::int) + (interval '1 hour' * 21) + (interval '3 minutes' * (random() * 20)::int),
       CASE WHEN random() < 0.80 THEN 'cumplido' WHEN random() < 0.90 THEN 'atrasado' ELSE 'omitido' END,
       CASE WHEN random() > 0.95 THEN 'Enfermedad' ELSE NULL END,
       'Paciente muy responsable con medicación',
       now()
FROM generate_series(1, 15);

-- Luis Hernández: Baja adherencia (50%)
INSERT INTO public.intake_logs (id, prescription_id, patient_id, scheduled_time, actual_time, status, omission_reason, observations, created_at)
SELECT gen_random_uuid(), 'presc-luis-001'::uuid, 'patient-luis-001'::uuid,
       now() - (interval '1 day' * (random() * 7)::int) + (interval '1 hour' * 8),
       CASE WHEN random() < 0.50 THEN now() - (interval '1 day' * (random() * 7)::int) + (interval '1 hour' * 8) + (interval '15 minutes' * (random() * 40)::int) ELSE NULL END,
       CASE WHEN random() < 0.50 THEN 'cumplido' WHEN random() < 0.60 THEN 'atrasado' ELSE 'omitido' END,
       CASE WHEN random() > 0.60 THEN 'Olvido' WHEN random() > 0.35 THEN 'Medicamento caro' ELSE NULL END,
       'Necesita seguimiento más cercano',
       now()
FROM generate_series(1, 15);

-- Carlos Ruíz: Muy baja adherencia (20%)
INSERT INTO public.intake_logs (id, prescription_id, patient_id, scheduled_time, actual_time, status, omission_reason, observations, created_at)
SELECT gen_random_uuid(), 'presc-carlos-001'::uuid, 'patient-carlos-001'::uuid,
       now() - (interval '1 day' * (random() * 7)::int) + (interval '1 hour' * 7),
       CASE WHEN random() < 0.20 THEN now() - (interval '1 day' * (random() * 7)::int) + (interval '1 hour' * 7) + (interval '20 minutes' * (random() * 50)::int) ELSE NULL END,
       CASE WHEN random() < 0.20 THEN 'cumplido' WHEN random() < 0.25 THEN 'atrasado' ELSE 'omitido' END,
       CASE WHEN random() > 0.50 THEN 'Olvido' WHEN random() > 0.25 THEN 'No siente síntomas' ELSE 'Falta de dinero' END,
       'Paciente requiere intervención urgente',
       now()
FROM generate_series(1, 15);

-- 8. VERIFICACIÓN
-- ============================================================================
SELECT 'Pacientes creados:' as resultado, COUNT(*) FROM public.profiles WHERE role = 'paciente';
SELECT 'Prescripciones creadas:' as resultado, COUNT(*) FROM public.prescriptions;
SELECT 'Intake logs creados:' as resultado, COUNT(*) FROM public.intake_logs WHERE patient_id IS NOT NULL;
SELECT 'Relaciones médico-paciente:' as resultado, COUNT(*) FROM public.user_relations WHERE superior_id = 'doctor-diego-001'::uuid;
