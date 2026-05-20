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
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    envVars[key] = value.trim();
  }
});

const url = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const key = envVars['SUPABASE_SERVICE_ROLE_KEY'];

// Supabase JS client doesn't support executing raw DDL SQL.
// But we can use the postgres connection string if available.
console.log("Checking if DATABASE_URL is present:", !!envVars['DATABASE_URL']);
if (!envVars['DATABASE_URL']) {
  console.log("No DATABASE_URL found. We cannot run DDL automatically using node-postgres.");
  process.exit(1);
}
