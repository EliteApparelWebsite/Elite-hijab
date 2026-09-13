import { verifyPayuResponseHash } from '@/lib/payu'

async function decrementStock(admin: any, items: { variant_id: string | null; quantity: number }[]) {
  for (const item of items) {
    if (!item.variant_id) continue
    const { data: variant } = await admin
      .from('product_variants')
      .select('stock_quantity')
      .eq('id', item.variant_id)
      .maybeSingle()
    if (variant) {
      await admin
        .from('product_variants')
        .update({ stock_quantity: Math.max(0, variant.stock_quantity - item.quantity) })
        .eq('id', item.variant_id)
    }
  }
}

// Verifies a PayU payment result and applies it to the matching order.
// Shared by the browser-facing surl/furl redirect (app/api/payu/callback)
// and the async PayU dashboard webhook (app/api/webhooks/payu) — same hash
// verification, same idempotent update, so a payment is never applied twice
// or trusted without a valid hash, regardless of which path calls it.
export async function processPayuResult(fields: Record<string, any>) {
  const { txnid, status, mihpayid } = fields
  const salt = process.env.PAYU_MERCHANT_SALT

  if (!salt || !txnid) {
    return { ok: false, reason: 'missing_config_or_txnid' }
  }
  if (!verifyPayuResponseHash(fields, salt)) {
    return { ok: false, reason: 'invalid_hash', txnid }
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  const { data: order, error: fetchError } = await admin
    .from('orders')
    .select('id, order_number, payment_status, total_amount, order_items(variant_id, quantity)')
    .eq('payu_txnid', txnid)
    .maybeSingle()

  if (fetchError || !order) {
    return { ok: false, reason: 'order_not_found', txnid }
  }

  // Defense in depth: the hash already cryptographically binds `amount` to
  // this exact txnid (PayU signs it with the shared salt, so a tampered
  // amount would fail verifyPayuResponseHash above) — this second check just
  // guards against a bug in that verification ever being exploitable on its
  // own, by refusing to mark an order paid if the amount PayU confirms
  // doesn't match what we actually charged for.
  const amountMatches = Math.abs(Number(fields.amount) - Number(order.total_amount)) < 1
  if (status === 'success' && !amountMatches) {
    console.error('[PayU] Amount mismatch for txnid', txnid, '— got', fields.amount, 'expected', order.total_amount)
    return { ok: false, reason: 'amount_mismatch', txnid }
  }

  if (status === 'success' && order.payment_status !== 'paid') {
    const { error: updateErr } = await admin
      .from('orders')
      .update({
        payment_status: 'paid',
        order_status: 'processing',
        payu_payment_id: mihpayid,
        paid_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    if (updateErr) {
      console.error('[PayU] DB update failed for successful payment:', updateErr.message)
    } else {
      await decrementStock(admin, order.order_items || [])
    }
  } else if (status !== 'success' && order.payment_status === 'pending') {
    // Only downgrade a still-pending order — never overwrite an order that
    // some other call (the browser redirect or an earlier webhook) already
    // marked paid, in case a stray/out-of-order "failed" event arrives late.
    await admin.from('orders').update({ payment_status: 'failed' }).eq('id', order.id)
  }

  return { ok: true, orderNumber: order.order_number }
}
