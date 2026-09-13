import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Shiprocket sends shipment status updates (in transit, out for delivery,
// delivered, RTO, etc.) to this endpoint once you register it under
// Shiprocket -> Settings -> API -> Configure Webhooks, along with a
// "Secret Key" — set that exact same string as SHIPROCKET_WEBHOOK_SECRET
// below. Shiprocket sends that secret back on every webhook call in the
// header its "Auth Token Type" dropdown selects — we accept either
// "x-api-key" or "Authorization" so either dropdown choice works.
//
// Named "courier" rather than "shiprocket" because Shiprocket's own webhook
// URL field rejects any URL containing "shiprocket"/"kartrocket"/"sr"/"kr"
// with an "Address is not allowed" error.
//
// GET/OPTIONS + the empty-body and no-identifier branches below exist
// because Shiprocket's dashboard "Test Webhook" button first probes the URL
// (a GET, or a CORS preflight, or a POST with no body / a payload with no
// order_id) before it will let you save the connection — without handling
// those, the dashboard reports "unable to send request to mentioned api"
// even though a real webhook call would have worked fine.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

export async function GET() {
  return NextResponse.json({ status: 'active' }, { headers: corsHeaders })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders })
}

function mapShiprocketStatusToOrderStatus(currentStatus: string | undefined): string | null {
  if (!currentStatus) return null
  const s = currentStatus.toLowerCase()

  if (s.includes('delivered')) return 'delivered'
  if (s.includes('cancel')) return 'cancelled'
  if (s.includes('rto')) return 'cancelled'
  if (s.includes('out for delivery') || s.includes('in transit') || s.includes('shipped') || s.includes('picked up')) {
    return 'shipped'
  }
  // Pickup generated/scheduled, label generated, etc. — order stays wherever
  // it is (usually 'processing') until it actually moves.
  return null
}

export async function POST(req: Request) {
  try {
    // Shiprocket's "Test Webhook" button sends a POST with an empty body —
    // req.json() throws on that, which used to surface as a raw 500 instead
    // of the friendly "endpoint is active" ping the dashboard expects.
    const rawBody = await req.text()
    if (!rawBody || rawBody.trim() === '') {
      return NextResponse.json({ success: true, message: 'Webhook endpoint is active.' }, { headers: corsHeaders })
    }

    let payload: any
    try {
      payload = JSON.parse(rawBody)
    } catch {
      // Always 200, like the PayU webhook below — Shiprocket's dashboard
      // treats any non-2xx response from its connectivity check as
      // "unable to send request to mentioned api" and refuses to save the
      // URL, even though a real webhook call would have worked fine.
      return NextResponse.json({ success: false, error: 'Invalid JSON payload' }, { headers: corsHeaders })
    }

    // The `order_id` Shiprocket echoes back is the same order_id we sent
    // when creating the shipment — our own internal orders.id (see
    // createShiprocketShipment in actions/admin/orders.ts).
    const internalOrderId: string | undefined = payload.order_id || payload.channel_order_id
    const awbCode: string | undefined = payload.awb ? String(payload.awb) : undefined
    const courierName: string | undefined = payload.courier_name ? String(payload.courier_name) : undefined
    const currentStatus: string | undefined = payload.current_status || payload.shipment_status

    // The dashboard's own test payload carries none of these identifiers —
    // let it through without a secret check, same as an empty body above,
    // so the "Test Webhook" button succeeds.
    const isTestPing = !internalOrderId && !awbCode && !currentStatus
    if (isTestPing) {
      return NextResponse.json({ success: true, message: 'Test ping received.' }, { headers: corsHeaders })
    }

    const webhookSecret = process.env.SHIPROCKET_WEBHOOK_SECRET
    const authHeader = req.headers.get('authorization') || ''
    const receivedKey = req.headers.get('x-api-key') || authHeader.replace(/^Bearer\s+/i, '')

    if (webhookSecret) {
      if (!receivedKey || receivedKey !== webhookSecret) {
        console.error('[Shiprocket Webhook Error]: Missing/invalid webhook secret header.')
        // Always 200 (see the JSON-parse branch above for why) — the
        // request is still rejected, just not with a non-2xx status.
        return NextResponse.json({ success: false, error: 'Invalid webhook secret' }, { headers: corsHeaders })
      }
    } else {
      console.warn('[Shiprocket Webhook]: SHIPROCKET_WEBHOOK_SECRET is not configured — accepting request unverified.')
    }

    console.log('[Shiprocket Webhook]: Received update', { internalOrderId, awbCode, courierName, currentStatus })

    if (!internalOrderId) {
      // Nothing we can match to an order — acknowledge so Shiprocket
      // doesn't keep retrying, but log it for visibility.
      console.warn('[Shiprocket Webhook]: Payload had no order_id, ignoring.', payload)
      return NextResponse.json({ success: true, ignored: true }, { headers: corsHeaders })
    }

    const supabaseAdmin = createAdminClient()

    const updateData: any = {
      shiprocket_status: currentStatus || null,
    }
    if (awbCode) updateData.awb_code = awbCode
    if (courierName) updateData.courier_name = courierName

    const mappedStatus = mapShiprocketStatusToOrderStatus(currentStatus)
    if (mappedStatus) {
      updateData.order_status = mappedStatus
      if (mappedStatus === 'shipped') updateData.shipped_at = new Date().toISOString()
      if (mappedStatus === 'delivered') updateData.delivered_at = new Date().toISOString()
      if (mappedStatus === 'cancelled') updateData.cancelled_at = new Date().toISOString()
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', internalOrderId)

    if (error) {
      console.error('[Shiprocket Webhook Error]: DB update failed:', error.message)
      return NextResponse.json({ success: false, error: error.message }, { headers: corsHeaders })
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error: any) {
    console.error('[Shiprocket Webhook Critical Error]:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Internal Server Error' }, { headers: corsHeaders })
  }
}
