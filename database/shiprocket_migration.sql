-- Shiprocket integration: adds columns to track the Shiprocket order/
-- shipment and courier assignment against each order in this store.
-- The shipping address itself is NOT duplicated here — Shiprocket orders
-- are built from the existing `addresses` row via orders.address_id.
--
-- Run this once in the Supabase SQL editor (or fold it into
-- database/schema.sql for fresh installs — it's already been added there).

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_shipment_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS awb_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_status TEXT;
