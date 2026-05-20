async function test() {
  const url = "http://localhost:3000/api/doctor/prescriptions/presc-maria-001";
  console.log("Fetching", url);
  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dosage_info: { dose: "200", unit: "mg" },
        frequency_hours: 8,
        is_active: true,
        reason: "Test reason"
      })
    });
    
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response:", text);
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}
test();
