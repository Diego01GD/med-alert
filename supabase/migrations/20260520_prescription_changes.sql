-- ============================================================================
-- MIGRACIÓN: Tabla de historial de modificaciones médicas (prescription_changes)
-- ============================================================================
-- Ejecuta este SQL en tu consola de Supabase (SQL Editor)

CREATE TABLE IF NOT EXISTS public.prescription_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  change_type TEXT NOT NULL,
  previous_state JSONB NOT NULL,
  new_state JSONB NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.prescription_changes ENABLE ROW LEVEL SECURITY;

-- Crear políticas (Policies) para permitir acceso a los perfiles autenticados
-- En MedAlert actual, el proxy.ts y los RLS generalmente permiten ver si el usuario es el doctor
CREATE POLICY "Enable read access for all authenticated users" ON public.prescription_changes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.prescription_changes FOR INSERT TO authenticated WITH CHECK (true);

-- Índices de búsqueda rápida
CREATE INDEX IF NOT EXISTS prescription_changes_patient_id_idx ON public.prescription_changes(patient_id);
CREATE INDEX IF NOT EXISTS prescription_changes_doctor_id_idx ON public.prescription_changes(doctor_id);
CREATE INDEX IF NOT EXISTS prescription_changes_prescription_id_idx ON public.prescription_changes(prescription_id);
