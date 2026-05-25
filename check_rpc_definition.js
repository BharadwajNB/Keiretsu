const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://opsiaxzrdyebecmeydzs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc2lheHpyZHllYmVjbWV5ZHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5OTUxMTgsImV4cCI6MjA5MzU3MTExOH0.r9lo9dxx8dQW7UD2fQWddtcQ4-QCCKWT-CzvFCDUqNw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('get_nearby_users', {
    user_lat: 16.4641,
    user_lng: 80.5065,
    radius_km: 20000
  });

  if (error) {
    console.error('RPC Error:', error.message);
  } else {
    console.log('RPC Columns returned:');
    if (data && data.length > 0) {
      console.log(Object.keys(data[0]));
      console.log('First row:', data[0]);
    } else {
      console.log('RPC returned 0 rows, let\'s fetch schema metadata.');
      // Query pg_proc
      const { data: procData, error: procError } = await supabase
        .from('profiles') // Just using a table query, wait we can't query pg_proc directly via REST unless we have a custom RPC or schema cache.
        .select('*')
        .limit(1);
      console.log('No rows returned, but let\'s look at profile definition.');
    }
  }
}

run();
