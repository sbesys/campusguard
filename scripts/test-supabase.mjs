import { readFileSync } from 'node:fs';

const envText = readFileSync('.env', 'utf8');

const env = Object.fromEntries(
  envText.split(/\r?\n/)
    .filter(line => line.trim() && !line.trim().startsWith('#'))
    .map(line => {
      const index = line.indexOf('=');
      return [
        line.slice(0, index).trim(),
        line.slice(index + 1).trim().replace(/^["']|["']$/g, '')
      ];
    })
);

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

try {
  console.log('Connecting to Supabase...');

  const response = await fetch(
    `${url}/rest/v1/resources?select=id,name,status,load_percent&order=id`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    }
  );

  const result = await response.json();

  if (!response.ok) {
    console.error('Connection/API error:', result);
    process.exit(1);
  }

  console.log('SUCCESS: Supabase connection established!');
  console.log('Resources retrieved:', result.length);
  console.table(result);

} catch (error) {
  console.error('Connection failed:', error.message);
  process.exit(1);
}