const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=\"([^\"]+)\"/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=\"([^\"]+)\"/);
if (urlMatch && keyMatch) {
  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(urlMatch[1], keyMatch[1]);
  async function run() {
    const { data } = await supabase.from('trips').select('id, title, status, itinerary_days(id, itinerary_events(id))');
    console.log(JSON.stringify(data, null, 2));
  }
  run();
}
