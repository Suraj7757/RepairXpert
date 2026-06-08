const fs = require('fs');
const key = fs.readFileSync('.env', 'utf8').match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*?)"/)[1];
fetch('https://xmgahsbdiydmcwawinkn.supabase.co/rest/v1/inventory?select=*&is_marketplace_listed=eq.true&quantity=gt.0&order=created_at.desc', {
  headers: {
    'apikey': key,
    'Authorization': 'Bearer ' + key
  }
}).then(r => r.json().then(j => console.log(r.status, j)));
