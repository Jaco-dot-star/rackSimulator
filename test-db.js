const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT value, timestamp FROM reading WHERE rack_id = '7969edcd-f0bd-43e0-abf9-4656df580e22' ORDER BY timestamp DESC LIMIT 2").then(res => {
    console.log(res.rows);
    pool.end();
}).catch(console.error);
