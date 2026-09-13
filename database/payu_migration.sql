-- PayU integration: adds columns to track the PayU transaction against each
-- order in this store, replacing the never-configured Razorpay columns
-- referenced elsewhere in the codebase (which never actually existed in
-- this table).
--
-- Run this once in the Supabase SQL editor (or fold it into
-- database/schema.sql for fresh installs — it's already been added there).

ALTER TABLE orders ADD COLUMN IF NOT EXISTS payu_txnid TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payu_payment_id TEXT;
