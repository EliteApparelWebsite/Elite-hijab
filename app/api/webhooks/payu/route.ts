import { processPayuResult } from '@/lib/payuFulfillment'

// PayU's dashboard "Webhooks" feature (Developers > Webhooks) posts payment
// success/failed/refund events here as a reliability backstop to the
// browser-based surl/furl redirect in app/api/payu/callback — it fires even
// if the customer's browser never makes it back to our site. The dashboard's
// "Create Webhook" form has no secret/token field, so authenticity relies
// entirely on the same reverse-hash check PayU uses for surl/furl (see
// lib/payuFulfillment.ts) — a payload without a valid hash is never trusted.
//
// PayU's exact field layout for this webhook (flat vs. nested under
// "payload"/"data") wasn't visible without a live account, so this parses
// defensively and logs the raw body once so the real shape can be confirmed
// from server logs after the first live event and adjusted if needed.

function extractFields(parsed: any): Record<string, any> | null {
  if (!parsed || typeof parsed !== 'object') return null
  if (parsed.txnid || parsed.hash) return parsed
  if (parsed.payload && typeof parsed.payload === 'object') return parsed.payload
  if (parsed.data && typeof parsed.data === 'object') return parsed.data
  return parsed
}

export async function POST(req: Request) {
  const rawBody = await req.text()
  let fields: Record<string, any> | null = null

  try {
    fields = extractFields(JSON.parse(rawBody))
  } catch {
    try {
      fields = Object.fromEntries(new URLSearchParams(rawBody).entries())
    } catch {
      fields = null
    }
  }

  if (!fields || !fields.txnid) {
    console.error('[PayU Webhook Error]: Could not find txnid/hash in payload. Raw body:', rawBody.slice(0, 1000))
    return Response.json({ success: false, error: 'Unrecognized payload shape.' }, { status: 200 })
  }

  try {
    const result = await processPayuResult(fields)
    if (!result.ok) {
      console.error('[PayU Webhook Error]:', result.reason, result.txnid || '')
      return Response.json({ success: false, error: result.reason }, { status: 200 })
    }
    return Response.json({ success: true, orderNumber: result.orderNumber })
  } catch (error: any) {
    console.error('[PayU Webhook Critical Error]:', error)
    return Response.json({ success: false, error: 'Internal error.' }, { status: 500 })
  }
}
