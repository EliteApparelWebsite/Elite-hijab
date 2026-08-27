// Shared shipping-charge calculation used by both the checkout UI (client)
// and order creation (server), so the displayed fee and the charged fee
// can never drift apart.

export type ShippingTier = {
  // Inclusive lower bound on total item quantity in the cart.
  min_qty: number
  // Inclusive upper bound. null/undefined = no upper bound ("and above").
  max_qty: number | null
  // Shipping charge (₹) for carts whose total quantity falls in this range.
  charge: number
}

export type ShippingSettings = {
  flat_rate: number
  free_threshold: number
  cod_charge?: number
  online_discount?: number
  // Optional quantity-based tiers. When present and non-empty, these take
  // priority over flat_rate for carts that don't qualify for free shipping.
  tiers?: ShippingTier[]
}

/**
 * Resolve the shipping charge for a cart.
 *
 * Rules (in order):
 * 1. If free_threshold is set (> 0) and subtotal meets/exceeds it, shipping is free.
 * 2. Otherwise, if quantity tiers are configured, use the charge for the tier
 *    whose [min_qty, max_qty] range contains the cart's total item quantity.
 * 3. If no tier matches (e.g. gaps in configured ranges), fall back to flat_rate.
 * 4. If no tiers are configured at all, flat_rate is used directly (legacy behavior).
 */
export function calculateShippingCharge(
  subtotal: number,
  totalQuantity: number,
  shipping: ShippingSettings
): number {
  const freeThreshold = Number(shipping.free_threshold ?? 0)
  if (freeThreshold > 0 && subtotal >= freeThreshold) {
    return 0
  }

  const tiers = Array.isArray(shipping.tiers)
    ? shipping.tiers.filter(t => t && !isNaN(Number(t.min_qty)) && !isNaN(Number(t.charge)))
    : []

  if (tiers.length > 0) {
    const qty = Math.max(1, Math.floor(Number(totalQuantity) || 0))

    const matched = tiers.find(t => {
      const min = Number(t.min_qty)
      const max = t.max_qty === null || t.max_qty === undefined ? Infinity : Number(t.max_qty)
      return qty >= min && qty <= max
    })

    if (matched) {
      return Math.max(0, Number(matched.charge))
    }
    // Quantity fell outside every configured range (e.g. a gap, or below the
    // lowest tier's min_qty) -- fall back to the flat rate rather than
    // silently charging ₹0.
  }

  return Number(shipping.flat_rate ?? 99)
}

/** Sort tiers by min_qty ascending, for consistent display/storage. */
export function sortTiers(tiers: ShippingTier[]): ShippingTier[] {
  return [...tiers].sort((a, b) => Number(a.min_qty) - Number(b.min_qty))
}
