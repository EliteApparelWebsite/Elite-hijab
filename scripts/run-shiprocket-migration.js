// One-off runner for database/shiprocket_migration.sql — lets you apply the
// Shiprocket migration without opening the Supabase SQL Editor.
//
// Usage:
//   set DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres
//   node scripts/run-shiprocket-migration.js
//
// Get the connection string from: Supabase dashboard -> your project ->
// Project Settings -> Database -> "Connection string" (URI tab). Use the
// "Session" / direct connection (port 5432), not the transaction pooler,
// since it needs SSL and runs plain (non-prepared) DDL statements fine.
//
// You can also just pass it inline instead of setting an env var:
//   node scripts/run-shiprocket-migration.js "postgresql://...."

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

async function main() {
  const connectionString = process.argv[2] || process.env.DATABASE_URL
  if (!connectionString) {
    console.error('Missing connection string. Pass it as an argument or set DATABASE_URL.')
    console.error('Example: node scripts/run-shiprocket-migration.js "postgresql://postgres:PASSWORD@db.xxxx.supabase.co:5432/postgres"')
    process.exit(1)
  }

  const sqlPath = path.join(__dirname, '..', 'database', 'shiprocket_migration.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  })

  console.log('Connecting to database...')
  await client.connect()

  try {
    console.log('Running database/shiprocket_migration.sql ...')
    await client.query(sql)
    console.log('Done. Added shiprocket_order_id, shiprocket_shipment_id, awb_code, courier_name, shiprocket_status to orders.')
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
