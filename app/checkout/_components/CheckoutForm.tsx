"use client"

import React, { useState, useEffect, useTransition } from 'react'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { validateCoupon } from '@/actions/admin/coupons'
import { processCheckout } from '@/actions/checkout'
import { sendEmailOtp, verifyEmailOtp } from '@/actions/auth'
import { Truck, Tag, CreditCard, ShoppingBag, ShieldCheck, Lock, Eye, EyeOff, Plus, Minus, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { calculateShippingCharge, type ShippingSettings } from '@/lib/shipping'

export default function CheckoutForm({ shipping, isLoggedIn }: { shipping: ShippingSettings, isLoggedIn: boolean }) {
  const { cart, cartTotal, clearCart, updateQuantity, removeFromCart } = useCart()
  const { showToast } = useToast()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // Shipping Address Form State
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    alternatePhone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
  })

  // OTP States for Guest Checkout
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpPending, setOtpPending] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const [otpError, setOtpError] = useState('')

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (otpSent && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [otpSent, resendTimer])

  useEffect(() => {
    if (otpSent) {
      setResendTimer(60)
    }
  }, [otpSent])

  // Temporarily lower header z-index and freeze scrolling when OTP modal is open
  useEffect(() => {
    const header = document.querySelector('header')
    if (otpSent && !isLoggedIn) {
      if (header) {
        header.style.zIndex = '0'
      }
      document.body.style.overflow = 'hidden'
    } else {
      if (header) {
        header.style.zIndex = ''
      }
      document.body.style.overflow = ''
    }
    return () => {
      if (header) {
        header.style.zIndex = ''
      }
      document.body.style.overflow = ''
    }
  }, [otpSent, isLoggedIn])

  // Coupon State
  const [couponCode, setCouponCode] = useState('')
  const [activeCoupon, setActiveCoupon] = useState<any>(null)
  const [couponError, setCouponError] = useState('')
  const [couponSuccess, setCouponSuccess] = useState('')

  // Payment Method — default to whichever is enabled; prefer online when both are.
  const [paymentMethod, setPaymentMethod] = useState<'Online Payment (PayU)' | 'COD'>(
    shipping.online_payment_enabled === false && shipping.cod_enabled !== false
      ? 'COD'
      : 'Online Payment (PayU)'
  )

  // Prefill from localStorage on mount (Only if logged in)
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoggedIn) {
      const savedData = localStorage.getItem('hijabistaa-customer-profile')
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData)
          setProfile({
            fullName: parsed.fullName || '',
            email: parsed.email || '',
            phone: parsed.phone || '',
            alternatePhone: parsed.alternatePhone || '',
            street: parsed.street || '',
            city: parsed.city || '',
            state: parsed.state || '',
            zipCode: parsed.zipCode || '',
          })
        } catch (e) {
          console.error(e)
        }
      }
    }
  }, [isLoggedIn])

  // Load user profile and default address from database if logged in
  useEffect(() => {
    if (isLoggedIn) {
      const supabase = createClient()
      if (supabase) {
        supabase.auth.getUser().then(async ({ data }) => {
          if (data?.user) {
            const { data: profileData } = await supabase
              .from('customers')
              .select('*')
              .eq('id', data.user.id)
              .single()
              
            const { data: addressData } = await supabase
              .from('addresses')
              .select('*')
              .eq('user_id', data.user.id)
              .order('is_default', { ascending: false })
              .limit(1)
              .maybeSingle()

            setProfile({
              fullName: profileData?.full_name || '',
              email: data.user.email || '',
              phone: addressData?.phone || profileData?.phone || '',
              alternatePhone: addressData?.alternate_phone || '',
              street: addressData?.address_line_1 || '',
              city: addressData?.city || '',
              state: addressData?.state || '',
              zipCode: addressData?.postal_code || '',
            })
          }
        }).catch((err) => console.error('Failed to load profile in checkout:', err))
      }
    }
  }, [isLoggedIn])

  // Calculate checkout details
  const subtotal = cartTotal
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0)
  
  const shippingFee = calculateShippingCharge(subtotal, totalQuantity, shipping)
  
  const codFee = paymentMethod === 'COD' ? Number(shipping.cod_charge ?? 0) : 0
  
  let discount = 0
  if (activeCoupon) {
    if (activeCoupon.type === 'percentage') {
      discount = Math.round((subtotal * activeCoupon.value) / 100)
    } else {
      discount = activeCoupon.value
    }
  }

  const onlineDiscountPercent = shipping.online_discount ?? 0
  const onlineDiscountAmount = paymentMethod === 'Online Payment (PayU)'
    ? Math.round((subtotal * onlineDiscountPercent) / 100)
    : 0

  const grandTotal = Math.max(0, subtotal + shippingFee + codFee - discount - onlineDiscountAmount)

  // Handle Coupon Apply
  const handleApplyCoupon = async () => {
    setCouponError('')
    setCouponSuccess('')

    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code.')
      return
    }

    const res = await validateCoupon(couponCode, subtotal)
    if (!res.success) {
      setCouponError(res.error || 'Invalid coupon code')
      setActiveCoupon(null)
    } else {
      setActiveCoupon(res.coupon)
      setCouponSuccess(`Coupon Applied! Discount: ${res.coupon.type === 'percentage' ? `${res.coupon.value}%` : `₹${res.coupon.value}`}`)
    }
  }

  const openPayu = (orderData: any) => {
    // PayU only accepts a classic top-level form POST (no JS SDK/modal), so
    // the browser navigates away to PayU's hosted payment page and back to
    // our surl/furl (app/api/payu/callback) once the payment finishes —
    // there's no client-side success/failure callback to hook into here.
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = orderData.payuActionUrl

    Object.entries(orderData.payuFields).forEach(([name, value]) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = name
      input.value = value as string
      form.appendChild(input)
    })

    document.body.appendChild(form)
    form.submit()
  }

  // Execute checkout and place order
  const executeOrderPlacement = async () => {
    const method = paymentMethod === 'Online Payment (PayU)' ? 'PAYU' : 'COD'

    // Save profile to localstorage on order place
    localStorage.setItem('hijabistaa-customer-profile', JSON.stringify(profile))

    const res = await processCheckout(profile, cart, method)

    if (!res.success) {
      showToast(res.error || 'Failed to place order.', 'error')
    } else {
      if ('isPayu' in res && res.isPayu) {
        openPayu(res as any)
      } else if ('order_number' in res && 'orderId' in res) {
        clearCart()
        router.push(`/order-success?order=${encodeURIComponent(res.order_number as string)}`)
      }
    }
  }

  // Handle Checkout Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (cart.length === 0) {
      showToast('Your cart is empty', 'error')
      return
    }

    if (!profile.fullName || !profile.email || !profile.phone || !profile.street || !profile.city || !profile.state || !profile.zipCode) {
      showToast('Please fill out all shipping details.', 'error')
      return
    }

    if (!isLoggedIn) {
      if (!otpSent) {
        setOtpPending(true)
        startTransition(async () => {
          const res = await sendEmailOtp(profile.email, 'REGISTER', profile.fullName)
          setOtpPending(false)
          if (res?.error) {
            showToast(res.error, 'error')
          } else {
            setOtpSent(true)
            showToast('Verification code sent to ' + profile.email, 'success')
          }
        })
        return
      } else {
        if (!otpCode || otpCode.length !== 6) {
          showToast('Please enter a valid 6-digit verification code.', 'error')
          return
        }
        setOtpPending(true)
        startTransition(async () => {
          const res = await verifyEmailOtp(profile.email, otpCode, 'NO_REDIRECT', profile.fullName, profile.phone)
          if (res?.error) {
            setOtpPending(false)
            setOtpError(res.error)
            showToast(res.error, 'error')
          } else if (res?.success) {
            try {
              window.dispatchEvent(new Event('hijabistaa-login-status-change'))
              await executeOrderPlacement()
              setOtpSent(false)
            } catch (e: any) {
              showToast(e.message || 'Error processing checkout', 'error')
            } finally {
              setOtpPending(false)
            }
          } else {
            setOtpPending(false)
          }
        })
        return
      }
    }

    startTransition(async () => {
      await executeOrderPlacement()
    })
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Column: Shipping Address & Payment Form */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-cream-line shadow-card space-y-6">
          <h2 className="text-lg font-bold text-ink uppercase tracking-wider flex items-center gap-2">
            <Truck className="w-5 h-5 text-gold" /> Shipping Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                maxLength={50}
                value={profile.fullName}
                onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                placeholder="e.g. Sumaiya Khan"
                className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-cream/20 text-ink focus:outline-none focus:ring-2 focus:ring-gold/25 focus:border-gold transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                disabled={isLoggedIn}
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                placeholder="e.g. sumaiya@example.com"
                className={`w-full px-4 py-2.5 rounded-xl border border-cream-line text-sm transition-all focus:outline-none ${
                  isLoggedIn 
                    ? 'bg-cream/10 text-ink/50 cursor-not-allowed' 
                    : 'bg-cream/20 text-ink focus:ring-2 focus:ring-gold/25 focus:border-gold'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                required
                maxLength={10}
                pattern="\d{10}"
                title="Please enter exactly 10 digits"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value.replace(/\D/g, '') })}
                placeholder="e.g. 9876543210"
                className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-cream/20 text-ink focus:outline-none focus:ring-2 focus:ring-gold/25 focus:border-gold transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1.5">
                Alternate Phone Number <span className="text-ink/30 normal-case font-medium">(Optional)</span>
              </label>
              <input
                type="text"
                maxLength={10}
                pattern="\d{10}"
                title="Please enter exactly 10 digits"
                value={profile.alternatePhone}
                onChange={(e) => setProfile({ ...profile, alternatePhone: e.target.value.replace(/\D/g, '') })}
                placeholder="e.g. 9876543210"
                className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-cream/20 text-ink focus:outline-none focus:ring-2 focus:ring-gold/25 focus:border-gold transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1.5">
                Street Address
              </label>
              <input
                type="text"
                required
                maxLength={150}
                value={profile.street}
                onChange={(e) => setProfile({ ...profile, street: e.target.value })}
                placeholder="e.g. Apartment number, street name"
                className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-cream/20 text-ink focus:outline-none focus:ring-2 focus:ring-gold/25 focus:border-gold transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1.5">
                  City
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="e.g. Mumbai"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-cream/20 text-ink focus:outline-none focus:ring-2 focus:ring-gold/25 focus:border-gold transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1.5">
                  State
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  placeholder="e.g. Maharashtra"
                  className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-cream/20 text-ink focus:outline-none focus:ring-2 focus:ring-gold/25 focus:border-gold transition-all text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink/60 uppercase tracking-wider mb-1.5">
                ZIP / PIN Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                pattern="\d{6}"
                title="Please enter a valid 6-digit PIN code"
                value={profile.zipCode}
                onChange={(e) => setProfile({ ...profile, zipCode: e.target.value.replace(/\D/g, '') })}
                placeholder="e.g. 110001"
                className="w-full px-4 py-2.5 rounded-xl border border-cream-line bg-cream/20 text-ink focus:outline-none focus:ring-2 focus:ring-gold/25 focus:border-gold transition-all text-sm"
              />
            </div>
          </div>
        </div>



        <div className="bg-white rounded-3xl p-6 md:p-8 border border-cream-line shadow-card space-y-6">
          <h2 className="text-lg font-bold text-ink uppercase tracking-wider flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gold" /> Payment Option
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shipping.online_payment_enabled !== false && (
              <label
                className={`flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'Online Payment (PayU)' ? 'border-gold bg-gold/5' : 'border-cream-line'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'Online Payment (PayU)'}
                  onChange={() => setPaymentMethod('Online Payment (PayU)')}
                  className="sr-only"
                />
                <span className="font-bold text-ink text-sm">
                  Online Payment {shipping.online_discount ? `(${shipping.online_discount}% Off)` : ''}
                </span>
                <span className="text-xs text-ink/50 mt-1">Pay securely via UPI, Cards, or Netbanking.</span>
              </label>
            )}
            {shipping.cod_enabled !== false && (
              <label
                className={`flex flex-col p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentMethod === 'COD' ? 'border-gold bg-gold/5' : 'border-cream-line'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')}
                  className="sr-only"
                />
                <span className="font-bold text-ink text-sm">
                  Cash on Delivery {shipping.cod_charge ? `(+₹${shipping.cod_charge})` : ''}
                </span>
                <span className="text-xs text-ink/50 mt-1">Pay in cash when your order is delivered.</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Order Summary & Coupon Codes (sticky so the order + Place Order button stay in view) */}
      <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-28 lg:self-start">
        {/* Order Summary */}
        <div className="bg-white rounded-3xl p-6 border border-cream-line shadow-card space-y-6">
          <h2 className="text-lg font-bold text-ink uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-gold" /> Order Summary
          </h2>

          <div className="divide-y divide-cream-line max-h-80 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <p className="text-sm text-ink/50 py-4">Your cart is empty.</p>
            ) : (
              cart.map((item) => (
                <div key={item.cartItemId} className="flex gap-4 py-4 items-start">
                  <Link
                    href={`/shop/${item.id}`}
                    className="relative w-20 h-24 rounded-xl overflow-hidden shrink-0 border border-cream-line/50 hover:opacity-90 transition-opacity"
                  >
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/shop/${item.id}`} className="hover:text-gold transition-colors">
                        <h4 className="font-semibold text-ink text-sm leading-snug line-clamp-2">{item.name}</h4>
                      </Link>
                      <span className="font-semibold text-[#0D0D0D] shrink-0 text-lg">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs text-ink/60 font-medium">
                      {item.category_name && <span>{item.category_name}</span>}
                      {item.category_name && (item.color_name || item.variant_name || item.design) && (
                        <span className="text-ink/30">•</span>
                      )}
                      
                      {item.color_name && <span>Color: <span className="text-ink/80">{item.color_name}</span></span>}
                      {item.color_name && (item.variant_name || item.design) && <span className="text-ink/30">•</span>}
                      
                      {item.variant_name && <span>Size: <span className="text-ink/80">{item.variant_name}</span></span>}
                      {item.variant_name && item.design && <span className="text-ink/30">•</span>}
                      
                      {item.design && <span>Design: <span className="text-ink/80">{item.design}</span></span>}
                    </div>
                    <p className="text-[11px] font-semibold text-ink/40">
                      ₹{item.price.toLocaleString('en-IN')} each
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center border border-cream-line rounded-full p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="p-1 text-ink/60 hover:text-gold rounded-full hover:bg-cream transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-sm font-semibold text-ink">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className="p-1 text-ink/60 hover:text-gold rounded-full hover:bg-cream transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.cartItemId)}
                        className="text-ink/30 hover:text-red-500 transition-colors"
                        aria-label="Remove item"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing calculations */}
          <div className="border-t border-cream-line pt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-ink/60">Subtotal</span>
              <span className="font-bold text-ink">₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-ink/60">Shipping</span>
              <span className="font-bold text-ink">
                {shippingFee === 0 ? <span className="text-gold font-bold uppercase">Free</span> : `₹${shippingFee}`}
              </span>
            </div>

            {onlineDiscountAmount > 0 && (
              <div className="flex justify-between text-xs text-gold font-semibold">
                <span>Online Payment Discount ({onlineDiscountPercent}%)</span>
                <span>-₹{onlineDiscountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-xs text-gold">
                <span>Discount ({activeCoupon?.code})</span>
                <span className="font-bold">-₹{discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-cream-line pt-3">
              <span className="font-bold text-ink">Grand Total</span>
              <span className="font-display font-bold text-lg text-[#0D0D0D]">₹{grandTotal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={pending || otpPending}
            className="w-full py-4 px-6 bg-[#0A0A0A] text-white border border-gold/40 font-body font-bold rounded-full shadow-md hover:bg-[#D4AF37] hover:text-black hover:border-transparent transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {pending || otpPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                {isLoggedIn 
                  ? `Place Order • ₹${grandTotal.toLocaleString('en-IN')}` 
                  : (otpSent ? 'Confirm OTP & Place Order' : 'Verify Email & Place Order')}
              </>
            )}
          </button>
        </div>

        {/* Coupons Form */}
        <div className="bg-white rounded-3xl p-6 border border-cream-line shadow-card space-y-4">
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-gold" /> Have a Coupon?
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleApplyCoupon()
                }
              }}
              placeholder="e.g. EID50, WELCOME100"
              className="flex-1 px-3.5 py-2 rounded-xl border border-cream-line bg-cream/20 text-ink focus:outline-none focus:ring-2 focus:ring-gold/25 focus:border-gold transition-all text-xs uppercase"
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#D4AF37] hover:text-black text-white text-xs font-bold rounded-xl transition-all border border-gold/30"
            >
              Apply
            </button>
          </div>

          {couponError && <p className="text-xs text-red-500">{couponError}</p>}
          {couponSuccess && <p className="text-xs text-gold font-semibold">{couponSuccess}</p>}

          <div className="text-[11px] text-ink/40 border-t border-cream-line/50 pt-2 space-y-1">
            <p><strong>EID50</strong> — 50% discount on orders above ₹999</p>
            <p><strong>WELCOME100</strong> — Flat ₹100 discount on orders above ₹499</p>
          </div>
        </div>
      </div>

    </form>

      {/* OTP Verification Modal */}
      {!isLoggedIn && otpSent && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-ink/85 backdrop-blur-3xl animate-fade-in">
          <div className="bg-cream-deep max-w-md w-full rounded-3xl p-6 sm:p-8 border border-gold/30 shadow-soft text-center space-y-6 relative overflow-y-auto max-h-[90vh] sm:max-h-none">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setOtpSent(false)}
              className="absolute right-4 top-4 p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 border border-red-100/50 transition-all duration-300 shadow-sm"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto border border-gold/20 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading text-2xl font-bold text-ink">Confirm Verification Code</h3>
              <p className="text-sm text-ink/75 mt-2 font-body px-1">
                We sent a 6-digit OTP code to <strong className="text-ink font-semibold">{profile.email}</strong>. Please enter it below to verify your account and complete your order.
              </p>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, ''))
                    setOtpError('')
                  }}
                  placeholder="123456"
                  className="w-full px-4 py-3.5 rounded-xl border border-gold/30 bg-cream text-center tracking-[0.5em] font-heading font-bold text-2xl text-ink focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/10 transition-all shadow-inner"
                />
              </div>

              {otpError && (
                <div className="p-2.5 bg-red-50 text-red-600 rounded-xl text-xs border border-red-100/50 font-medium animate-pulse">
                  {otpError}
                </div>
              )}

              <div className="text-sm text-center font-body">
                {resendTimer > 0 ? (
                  <span className="text-ink/50 bg-cream/30 py-1 px-3 rounded-full border border-cream-line/30">
                    Resend code in <strong className="text-gold font-bold">{resendTimer}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      setOtpPending(true)
                      const res = await sendEmailOtp(profile.email, 'REGISTER', profile.fullName)
                      setOtpPending(false)
                      if (res?.error) {
                        showToast(res.error, 'error')
                      } else {
                        setResendTimer(60)
                        showToast('Verification code resent successfully.', 'success')
                      }
                    }}
                    className="text-gold hover:text-gold-dark hover:underline font-semibold transition-colors duration-200"
                  >
                    Resend Verification Code
                  </button>
                )}
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="flex-1 py-2.5 px-3.5 sm:py-3 sm:px-4 bg-cream border border-cream-line text-ink rounded-xl font-semibold hover:bg-cream-deep transition-all duration-300 text-xs sm:text-sm shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={otpPending || otpCode.length !== 6}
                  onClick={() => {
                    setOtpPending(true)
                    startTransition(async () => {
                      const res = await verifyEmailOtp(profile.email, otpCode, 'NO_REDIRECT', profile.fullName, profile.phone)
                      if (res?.error) {
                        setOtpPending(false)
                        setOtpError(res.error)
                        showToast(res.error, 'error')
                      } else if (res?.success) {
                        try {
                          window.dispatchEvent(new Event('hijabistaa-login-status-change'))
                          await executeOrderPlacement()
                          setOtpSent(false)
                        } catch (e: any) {
                          showToast(e.message || 'Error processing checkout', 'error')
                        } finally {
                          setOtpPending(false)
                        }
                      } else {
                        setOtpPending(false)
                      }
                    })
                  }}
                  className="flex-1 py-2.5 px-3.5 sm:py-3 sm:px-4 bg-ink hover:bg-gold text-cream hover:text-ink rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {otpPending ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : 'Verify & Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
