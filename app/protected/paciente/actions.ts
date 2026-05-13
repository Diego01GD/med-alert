"use server";

// Cambia la importación a la carpeta lib
import { createClient } from "@/lib/supabase/server";

/**
 * Trae los tratamientos activos del paciente logueado directamente desde Supabase
 */
export async function obtenerPrescriptionsDelPaciente(patientId: string) {
  const supabase = await createClient();

  // Consultamos usando las columnas reales de tu tabla 'prescriptions'
  const { data, error } = await supabase
    .from("prescriptions")
    .select("id, medication_name, dosage_info, frequency_hours, start_time")
    .eq("patient_id", patientId)
    .eq("is_active", true);

  if (error) {
    console.error("Error al obtener prescriptions de Supabase:", error);
    return [];
  }

  // Mapeamos los datos de la base de datos al formato dinámico de tu interfaz
  return data.map((p) => {
    let dosisTexto = "1 tableta";
    if (p.dosage_info && typeof p.dosage_info === "object") {
      dosisTexto = (p.dosage_info as any).dosis || "1 tableta";
    }

    const fechaInicio = new Date(p.start_time);
    const horaFormateada = fechaInicio.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return {
      id: p.id,
      medicamento: p.medication_name,
      dosis: dosisTexto,
      frecuencia: `Cada ${p.frequency_hours} hrs`,
      horaProgramada: horaFormateada,
      estado: "pendiente" 
    };
  });
}