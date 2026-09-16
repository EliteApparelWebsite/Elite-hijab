'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { calculateShippingCharge } from '@/lib/shipping'
import { isPayuEnabled, getPayuActionUrl, generatePayuHash } from '@/lib/payu'

const isValidUUID = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

export async function createOrder(addressId: string, paymentMethod: string, cartItemsFromFrontend: any[]) {
  const supabase = await createClient()

  // 1. Get user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // This custom-cookie auth flow never establishes a real Supabase Auth
  // session (auth.uid() is always null for the anon-key client here), so
  // every RLS-protected table below (addresses/orders/order_items/
  // cart_items/product_variants) must be accessed via the service-role
  // client. We've already verified `user` above via the custom cookie.
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  // 2. Validate Address
  const { data: address } = await admin
    .from('addresses')
    .select('id, full_name, phone')
    .eq('id', addressId)
    .eq('user_id', user.id)
    .single()

  if (!address) return { success: false, error: 'Invalid shipping address' }

  if (!cartItemsFromFrontend || cartItemsFromFrontend.length === 0) {
    return { success: false, error: 'Your cart is empty in the database.' }
  }

  // 4. Calculate totals securely (Using frontend data for mock compatibility)
  let subtotal = 0
  const orderItems = []

  for (const item of cartItemsFromFrontend) {
    const price = Number(item.price)
    const quantity = Number(item.quantity)
    const lineTotal = price * quantity

    subtotal += lineTotal

    orderItems.push({
      product_id: item.id,
      variant_id: item.variant_id || item.id,
      product_name: item.name,
      variant_name: item.variant_name || 'Default',
      color_name: item.color_name || null,
      size: item.variant_name || null,
      design: item.design || null,
      image_url: item.image_url || null,
      price_at_purchase: price,
      quantity: quantity,
      line_total: lineTotal
    })
  }

  // Fetch shipping settings from DB
  const { data: settingsData } = await supabase
    .from('settings')
    .select('shipping')
    .single()

  const shippingSettings = settingsData?.shipping || {
    flat_rate: 99,
    free_threshold: 1999,
    cod_charge: 50,
    online_discount: 0,
    tiers: [],
    cod_enabled: true,
    online_payment_enabled: true
  }

  // Reject a method the admin has switched off, even if a stale/tampered
  // client still submits it — the checkout UI already hides disabled
  // methods, this is the server-side backstop.
  if (paymentMethod === 'PAYU' && shippingSettings.online_payment_enabled === false) {
    return { success: false, error: 'Online payment is currently unavailable. Please choose Cash on Delivery.' }
  }
  if (paymentMethod !== 'PAYU' && shippingSettings.cod_enabled === false) {
    return { success: false, error: 'Cash on Delivery is currently unavailable. Please pay online.' }
  }

  const totalQuantity = orderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
  const shipping_cost = calculateShippingCharge(subtotal, totalQuantity, shippingSettings)

  const onlineDiscountPercent = Number(shippingSettings.online_discount ?? 0)

  const cod_cost = paymentMethod === 'PAYU' ? 0 : Number(shippingSettings.cod_charge ?? 0)
  const online_discount_amount = paymentMethod === 'PAYU'
    ? Math.round((subtotal * onlineDiscountPercent) / 100)
    : 0
  const total_amount = subtotal + shipping_cost + cod_cost - online_discount_amount

  // Generate order number
  const order_number = `AM-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

  const actualPaymentMethod = paymentMethod === 'PAYU' ? 'Online Payment (PayU)' : 'Cash on Delivery (COD)'

  // 5. Insert Order
  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert([{
      id: globalThis.crypto.randomUUID(),
      order_number,
      user_id: user.id,
      address_id: addressId,
      subtotal,
      shipping_cost,
      total_amount,
      payment_status: 'pending',
      order_status: 'pending',
      payment_method: actualPaymentMethod
    }])
    .select('id, order_number')
    .single()

  if (orderError || !order) {
    return { success: false, error: orderError?.message || 'Failed to create order' }
  }

  // 6. Insert Order Items (only insert columns that exist in order_items table)
  const itemsToInsert = orderItems.map(item => ({
    order_id: order.id,
    product_id: isValidUUID(item.product_id) ? item.product_id : null,
    variant_id: isValidUUID(item.variant_id) ? item.variant_id : null,
    product_name: item.product_name,
    variant_name: item.variant_name || null,
    color_name: item.color_name || null,
    price_at_purchase: item.price_at_purchase,
    quantity: item.quantity,
    line_total: item.line_total
  }))

  const { error: itemsError } = await admin
    .from('order_items')
    .insert(itemsToInsert)

  if (itemsError) {
    console.error('Failed to insert order items:', itemsError)
    return { success: false, error: 'Failed to create order items: ' + (itemsError.message || '') }
  }

  // 7. Handle Payment Method Specific Logic
  if (paymentMethod === 'PAYU') {
    if (!isPayuEnabled()) {
      return { success: false, error: 'Online payment is not configured on the server.' }
    }

    try {
      const key = process.env.PAYU_MERCHANT_KEY!
      const salt = process.env.PAYU_MERCHANT_SALT!
      const txnid = order.order_number.replace(/-/g, '')
      const amount = total_amount.toFixed(2)
      const productinfo = 'Elite Hijab Order'
      const firstname = (address.full_name || 'Customer').trim()
      const email = user.email || 'guest@elitehijabs.com'
      const phone = address.phone || ''

      const requestHeaders = await headers()
      const host = requestHeaders.get('host')
      const protocol = host?.includes('localhost') ? 'http' : 'https'
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`
      const callbackUrl = `${siteUrl}/api/payu/callback`

      const hash = generatePayuHash({ key, txnid, amount, productinfo, firstname, email }, salt)

      await admin.from('orders').update({ payu_txnid: txnid }).eq('id', order.id)

      return {
        success: true,
        isPayu: true,
        payuActionUrl: getPayuActionUrl(),
        payuFields: {
          key,
          txnid,
          amount,
          productinfo,
          firstname,
          email,
          phone,
          surl: callbackUrl,
          furl: callbackUrl,
          hash,
        },
        orderId: order.id,
        orderNumber: order.order_number,
      }
    } catch (err: any) {
      console.error('PayU Error:', err)
      return { success: false, error: 'Failed to initialize payment gateway.' }
    }
  }

  // If COD, clear cart, decrement stock, and finish
  await admin
    .from('cart_items')
    .delete()
    .eq('user_id', user.id)

  for (const item of orderItems) {
    // Wrap in try-catch because mock IDs (e.g. 'p1') will fail UUID cast in Postgres
    try {
      const { data: variant } = await admin.from('product_variants').select('stock_quantity').eq('id', item.variant_id).single()
      if (variant) {
        await admin.from('product_variants').update({
          stock_quantity: Math.max(0, variant.stock_quantity - item.quantity)
        }).eq('id', item.variant_id)
      }
    } catch (e) {
      console.warn('Skipping stock decrement for mock variant:', item.variant_id)
    }
  }

  revalidatePath('/cart')
  revalidatePath('/checkout')
  revalidatePath('/profile')

  return { success: true, isPayu: false, order_number: order.order_number, orderId: order.id }
}

export async function processCheckout(
  profile: { fullName: string, email: string, phone: string, alternatePhone?: string, street: string, city: string, state: string, zipCode: string },
  items: any[],
  paymentMethod: 'PAYU' | 'COD' | string
) {
  const supabase = await createClient()
  let { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'You must be logged in to checkout.' }

  // Same reasoning as createOrder(): no real Supabase Auth session exists
  // for this custom-cookie user, so addresses/cart_items must go through
  // the service-role client to get past RLS.
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  // Ensure customer profile exists in the customers table to satisfy foreign keys
  const { data: customerExists } = await admin
    .from('customers')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (!customerExists) {
    const emailToUse = user.email || profile.email
    if (emailToUse) {
      const { data: conflictingCustomer } = await admin
        .from('customers')
        .select('id')
        .eq('email', emailToUse)
        .maybeSingle()

      if (conflictingCustomer && conflictingCustomer.id !== user.id) {
        // Attempt to update the existing record's id, or delete if constrained
        const { error: updateError } = await admin
          .from('customers')
          .update({ id: user.id })
          .eq('id', conflictingCustomer.id)
        
        if (updateError) {
          console.warn('Failed to update existing customer ID, deleting conflicting record:', updateError.message)
          await admin
            .from('customers')
            .delete()
            .eq('id', conflictingCustomer.id)
        }
      }
    }

    const { error: customerError } = await admin
      .from('customers')
      .insert({
        id: user.id,
        email: emailToUse,
        full_name: profile.fullName || 'Customer',
        phone: profile.phone || null
      })
    if (customerError) {
      console.error('Failed to create customer row during checkout:', customerError)
    }
  }

  // 1. Create or get address
  let addressId = ''
  const { data: existingAddress } = await admin
    .from('addresses')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existingAddress) {
    // Update existing address
    await admin.from('addresses').update({
      full_name: profile.fullName,
      phone: profile.phone,
      alternate_phone: profile.alternatePhone || null,
      address_line_1: profile.street,
      city: profile.city,
      state: profile.state,
      postal_code: profile.zipCode,
      country: 'India'
    }).eq('id', existingAddress.id)
    addressId = existingAddress.id
  } else {
    const { data: newAddress, error: addressError } = await admin.from('addresses').insert({
      id: crypto.randomUUID(),
      user_id: user.id,
      full_name: profile.fullName,
      phone: profile.phone,
      alternate_phone: profile.alternatePhone || null,
      address_line_1: profile.street,
      city: profile.city,
      state: profile.state,
      postal_code: profile.zipCode,
      country: 'India',
      is_default: true
    }).select('id').single()

    if (addressError || !newAddress) {
      console.error('ADDRESS ERROR:', addressError)
      return { success: false, error: addressError?.message || 'Failed to save address.' }
    }
    addressId = newAddress.id
  }

  // 2. Sync cart items to DB
  // Clear existing cart
  await admin.from('cart_items').delete().eq('user_id', user.id)
  
  // Insert new cart items
  const cartInserts = items.map(item => ({
    user_id: user.id,
    variant_id: isValidUUID(item.variant_id) ? item.variant_id : (isValidUUID(item.id) ? item.id : null),
    color_name: item.color_name || null,
    quantity: item.quantity
  }))
  
  const { error: cartError } = await admin.from('cart_items').insert(cartInserts)
  if (cartError) {
    console.error('CART SYNC ERROR:', cartError)
    return { success: false, error: cartError.message || 'Failed to sync cart.' }
  }

  // 3. Call createOrder (pass items from memory to avoid join errors)
  return await createOrder(addressId, paymentMethod, items)
}

