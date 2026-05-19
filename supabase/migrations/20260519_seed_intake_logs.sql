-- Script para generar datos de prueba de intake_logs
-- Ejecutar en Supabase SQL Editor

-- Primero, obtener los IDs de médicos y pacientes reales
WITH doctor AS (
  SELECT id FROM profiles WHERE role = 'medico' LIMIT 1
),
patients AS (
  SELECT DISTINCT p.id, p.full_name
  FROM profiles p
  WHERE p.role = 'paciente'
  LIMIT 5
),
doctor_patients AS (
  SELECT d.id as doctor_id, p.id as patient_id, p.full_name
  FROM doctor d, patients p
)
-- Insertar relaciones entre médico y pacientes
INSERT INTO user_relations (superior_id, patient_id, relation_type)
SELECT doctor_id, patient_id, 'doctor_patient'
FROM doctor_patients
ON CONFLICT (superior_id, patient_id) DO NOTHING;

-- Generar 50 intake_logs por paciente para los últimos 7 días
WITH doctor AS (
  SELECT id FROM profiles WHERE role = 'medico' LIMIT 1
),
patients AS (
  SELECT id FROM profiles WHERE role = 'paciente' LIMIT 5
),
date_series AS (
  SELECT 
    p.id as patient_id,
    (now() - (n || ' days')::interval)::timestamp as scheduled_date
  FROM patients p
  CROSS JOIN generate_series(0, 6) as n
),
intake_data AS (
  SELECT 
    gen_random_uuid() as id,
    ds.patient_id,
    gen_random_uuid() as prescription_id,
    ds.scheduled_date + (RANDOM() * 24 || ' hours')::interval as scheduled_time,
    CASE 
      WHEN RANDOM() < 0.70 THEN ds.scheduled_date + (RANDOM() * 2 || ' hours')::interval
      WHEN RANDOM() < 0.85 THEN ds.scheduled_date + (1 + RANDOM() * 3 || ' hours')::interval
      ELSE NULL
    END as actual_time,
    CASE
      WHEN RANDOM() < 0.70 THEN 'cumplido'
      WHEN RANDOM() < 0.85 THEN 'atrasado'
      ELSE 'omitido'
    END as status,
    CASE
      WHEN RANDOM() > 0.7 THEN 'Olvido'
      WHEN RANDOM() > 0.8 THEN 'No tenía el medicamento'
      ELSE NULL
    END as omission_reason,
    NULL as observations,
    now() as created_at
  FROM date_series ds
)
INSERT INTO intake_logs (
  id, patient_id, prescription_id, scheduled_time, actual_time,
  status, omission_reason, observations, created_at
)
SELECT * FROM intake_data
ON CONFLICT DO NOTHING;
