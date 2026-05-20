const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = 'C:\\Users\\Public\\mornl\\med-alert\\.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    envVars[key] = value.trim();
  }
});

const url = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const key = envVars['SUPABASE_SERVICE_ROLE_KEY'];
const supabase = createClient(url, key);

async function check() {
  // Test if updated_at exists by fetching it
  const { error: updatedError } = await supabase.from('prescriptions').select('updated_at').limit(1);
  console.log("prescriptions.updated_at error:", updatedError);

  // Test if prescription_changes exists
  const { error: changesError } = await supabase.from('prescription_changes').select('id').limit(1);
  console.log("prescription_changes error:", changesError);
}
check();
