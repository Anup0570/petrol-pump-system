const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://cbpdteymzglrwfgeepys.supabase.co', 'sb_secret_AskwdSR-o0RXll8hhEIVGQ_Xl3S5iuo');

async function test() {
  const { data, error } = await supabase.from('profiles').select('*');
  console.log(data, error);
}
test();
