import { createAdminClient } from "@/lib/supabase/admin";

async function seedTestData() {
  const adminClient = createAdminClient();

  if (!adminClient) {
    throw new Error("Admin client not configured");
  }

  try {
    // Get a doctor user
    const { data: doctors, error: doctorsError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "medico")
      .limit(1);

    if (doctorsError) throw doctorsError;
    if (!doctors || doctors.length === 0) {
      console.error("No doctors found in the system");
      return;
    }

    const doctorId = doctors[0].id;

    // Get all patients
    const { data: patients, error: patientsError } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "paciente");

    if (patientsError) throw patientsError;
    if (!patients || patients.length === 0) {
      console.error("No patients found in the system");
      return;
    }

    // Create relations between doctor and patients
    const relationData = patients.map((patient) => ({
      superior_id: doctorId,
      patient_id: patient.id,
      relation_type: "doctor_patient",
    }));

    const { error: relationsError } = await adminClient
      .from("user_relations")
      .upsert(relationData, {
        onConflict: "superior_id,patient_id",
      });

    if (relationsError) throw relationsError;

    console.log(`✓ Created ${relationData.length} doctor-patient relations`);

    // Create intake logs for each patient
    let totalLogs = 0;
    const now = new Date();

    for (const patient of patients) {
      // Generate 30 intake logs spanning the last 7 days
      const intakeLogs = [];

      for (let i = 0; i < 30; i++) {
        const daysAgo = Math.floor(Math.random() * 7);
        const hoursOffset = Math.floor(Math.random() * 24);
        const scheduledTime = new Date(
          now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - hoursOffset * 60 * 60 * 1000
        );

        // 70% on time, 15% late, 15% missed
        const rand = Math.random();
        let status = "cumplido";
        let actualTime = null;

        if (rand < 0.7) {
          status = "cumplido";
          actualTime = scheduledTime.toISOString();
        } else if (rand < 0.85) {
          status = "atrasado";
          actualTime = new Date(scheduledTime.getTime() + 60 * 60 * 1000).toISOString();
        } else {
          status = "omitido";
          actualTime = null;
        }

        intakeLogs.push({
          patient_id: patient.id,
          prescription_id: `prescription-${i}`,
          scheduled_time: scheduledTime.toISOString(),
          actual_time: actualTime,
          status,
          omission_reason: status === "omitido" ? (Math.random() > 0.5 ? "Olvido" : null) : null,
          observations: null,
        });
      }

      const { error: logsError } = await adminClient
        .from("intake_logs")
        .insert(intakeLogs);

      if (logsError) throw logsError;
      totalLogs += intakeLogs.length;
    }

    console.log(`✓ Created ${totalLogs} intake logs`);
    console.log("✓ Test data seeded successfully!");
  } catch (error) {
    console.error("Error seeding test data:", error);
    throw error;
  }
}

seedTestData();
