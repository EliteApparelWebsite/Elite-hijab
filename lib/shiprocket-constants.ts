// Plain constants only — no server-only logic (fetch calls, tokens, etc.)
// so this file is safe to import from client components. Keeping it
// separate from lib/shiprocket.ts avoids bundling that server-only code
// into the browser just to read a URL string.

// The "New Orders" tab in Shiprocket's own dashboard, where an admin goes
// to click "Ship Now" and pick a courier after an order has been pushed
// over via createShiprocketShipment() in actions/admin/orders.ts.
export const SHIPROCKET_NEW_ORDERS_URL = 'https://app.shiprocket.in/seller/orders/new'
