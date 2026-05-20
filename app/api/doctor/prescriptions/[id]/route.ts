import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/supabase/profiles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getCurrentUserProfile();
    if (!profile || profile.role !== "medico") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { dosage_info, frequency_hours, is_active, reason } = body;

    if (!reason || reason.trim() === "") {
      return NextResponse.json({ error: "El motivo es requerido" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json({ error: "Error de configuración del servidor" }, { status: 500 });
    }

    // Obtener prescripción actual
    const { data: currentPrescription, error: fetchError } = await adminClient
      .from("prescriptions")
      .select("*")
      .eq("id", id)
      .eq("doctor_id", profile.id)
      .single();

    if (fetchError || !currentPrescription) {
      return NextResponse.json({ error: "Prescripción no encontrada" }, { status: 404 });
    }

    // Actualizar prescripción
    const { data: updatedPrescription, error: updateError } = await adminClient
      .from("prescriptions")
      .update({
        dosage_info: dosage_info ?? currentPrescription.dosage_info,
        frequency_hours: frequency_hours ?? currentPrescription.frequency_hours,
        is_active: is_active ?? currentPrescription.is_active,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: "Error al actualizar prescripción" }, { status: 500 });
    }

    // Registrar en el historial de modificaciones
    const changeLog = {
      prescription_id: id,
      patient_id: currentPrescription.patient_id,
      doctor_id: profile.id,
      medication_name: currentPrescription.medication_name,
      change_type: "update",
      previous_state: {
        is_active: currentPrescription.is_active,
        dosage_info: currentPrescription.dosage_info,
        frequency_hours: currentPrescription.frequency_hours,
      },
      new_state: {
        is_active: updatedPrescription.is_active,
        dosage_info: updatedPrescription.dosage_info,
        frequency_hours: updatedPrescription.frequency_hours,
      },
      reason: reason.trim(),
    };

    // Attempt to insert the change log. If the table doesn't exist yet, it will fail, 
    // but the prescription was updated. We will log the error.
    const { error: logError } = await adminClient
      .from("prescription_changes")
      .insert(changeLog);

    if (logError) {
      console.error("No se pudo registrar en prescription_changes. ¿Corriste la migración?", logError);
      // We don't fail the request since the prescription update succeeded, but ideally we should.
      // Since it's a hard requirement, we'll return an error if it fails.
      return NextResponse.json({ 
        error: "Prescripción actualizada, pero faltan tablas de historial en BD. Ejecuta la migración SQL." 
      }, { status: 500 });
    }

    return NextResponse.json({ success: true, prescription: updatedPrescription });
  } catch (error) {
    console.error("PATCH Prescription Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
