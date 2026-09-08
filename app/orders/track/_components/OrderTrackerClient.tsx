'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  CreditCard,
  Printer,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
  PhoneCall,
  User,
  ShieldCheck,
  XCircle,
  HelpCircle
} from 'lucide-react'
import { trackOrderAction, getUserOrdersAction } from '@/actions/orders'
import { SITE } from '@/lib/data'

interface OrderTrackerClientProps {
  initialOrderNumber?: string
  initialContact?: string
}

export default function OrderTrackerClient({
  initialOrderNumber = '',
  initialContact = ''
}: OrderTrackerClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [activeTab, setActiveTab] = useState<'track' | 'history'>('track')
  
  // Tracking inputs
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber)
  const [contact, setContact] = useState(initialContact)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trackedOrder, setTrackedOrder] = useState<any | null>(null)

  // History states
  const [historyOrders, setHistoryOrders] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyFetched, setHistoryFetched] = useState(false)
  const [isGuest, setIsGuest] = useState(false)
  const [historySearchTerm, setHistorySearchTerm] = useState('')

  // Expand state for order items
  const [itemsExpanded, setItemsExpanded] = useState(true)

  // Auto-search if parameters supplied
  useEffect(() => {
    const paramNum = searchParams.get('orderNumber') || initialOrderNumber
    const paramContact = searchParams.get('contact') || initialContact
    if (paramNum) {
      setOrderNumber(paramNum)
      if (paramContact) setContact(paramContact)
      handleTrack(paramNum, paramContact)
    }
  }, [searchParams])

  // Fetch history when history tab opens
  useEffect(() => {
    if (activeTab === 'history' && !historyFetched) {
      fetchUserHistory()
    }
  }, [activeTab])

  const fetchUserHistory = async () => {
    setHistoryLoading(true)
    try {
      const res = await getUserOrdersAction()
      if (res.isGuest) {
        setIsGuest(true)
      } else if (res.success && res.orders) {
        setHistoryOrders(res.orders)
      }
    } catch (e) {
      console.error('Error fetching history orders:', e)
    } finally {
      setHistoryLoading(false)
      setHistoryFetched(true)
    }
  }

  const handleTrack = async (numToTrack?: string, contactToTrack?: string) => {
    const targetNum = numToTrack !== undefined ? numToTrack : orderNumber
    const targetContact = contactToTrack !== undefined ? contactToTrack : contact

    if (!targetNum.trim()) {
      setError('Please enter your Order Number.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await trackOrderAction(targetNum, targetContact)
      if (res.success && res.order) {
        setTrackedOrder(res.order)
        // update URL silently without reload
        const newUrl = `/orders/track?orderNumber=${encodeURIComponent(res.order.order_number)}`
        window.history.replaceState({}, '', newUrl)
      } else {
        setError(res.error || 'Unable to locate order with provided details.')
        setTrackedOrder(null)
      }
    } catch (e: any) {
      setError('An unexpected error occurred while tracking. Please try again.')
      setTrackedOrder(null)
    } finally {
      setLoading(false)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleTrack()
  }

  const handleSelectFromHistory = (order: any) => {
    setTrackedOrder(order)
    setOrderNumber(order.order_number)
    setActiveTab('track')
    window.scrollTo({ top: 150, behavior: 'smooth' })
  }

  // Stepper calculations
  const getStepStatus = (status: string) => {
    const normalized = (status || 'pending').toLowerCase()
    if (normalized === 'cancelled') return -1

    switch (normalized) {
      case 'pending':
        return 1
      case 'processing':
      case 'confirmed':
        return 2
      case 'shipped':
      case 'dispatched':
        return 3
      case 'out_for_delivery':
      case 'out for delivery':
        return 4
      case 'delivered':
      case 'completed':
        return 5
      default:
        return 1
    }
  }

  const currentStep = trackedOrder ? getStepStatus(trackedOrder.order_status) : 0

  const steps = [
    { title: 'Order Placed', desc: 'Order received & logged' },
    { title: 'Confirmed', desc: 'Verified & packing' },
    { title: 'Shipped', desc: 'In transit with courier' },
    { title: 'Out for Delivery', desc: 'Arriving today' },
    { title: 'Delivered', desc: 'Package delivered' }
  ]

  // Filter history items
  const filteredHistory = historyOrders.filter((o) => {
    if (!historySearchTerm.trim()) return true
    const term = historySearchTerm.toLowerCase()
    const numMatch = o.order_number.toLowerCase().includes(term)
    const itemMatch = o.order_items?.some((i: any) => i.product_name?.toLowerCase().includes(term))
    return numMatch || itemMatch
  })

  return (
    <div className="max-w-5xl mx-auto space-y-8 ">
      {/* Navigation Tabs */}
      <div className="flex justify-center border-b border-cream-line/80 pb-px">
        <div className="inline-flex bg-cream/70 p-1.5 rounded-full border border-cream-line shadow-inner gap-1 mb-5">
          <button
            onClick={() => setActiveTab('track')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeTab === 'track'
                ? 'bg-[#0A0A0A] text-white shadow-md scale-[1.02] border border-gold/40'
                : 'text-ink/70 hover:text-ink hover:bg-white/50'
            }`}
          >
            <Search className="w-4 h-4" />
            Track Current Order
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
              activeTab === 'history'
                ? 'bg-[#0A0A0A] text-white shadow-md scale-[1.02] border border-gold/40'
                : 'text-ink/70 hover:text-ink hover:bg-white/50'
            }`}
          >
            <Package className="w-4 h-4" />
            Order History
          </button>
        </div>
      </div>

      {/* TRACK TAB CONTENT */}
      {activeTab === 'track' && (
        <div className="space-y-8">
          {/* Tracking Search Card */}
          <div className="bg-white rounded-3xl p-6 md:p-10 shadow-card border border-cream-line/80 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            
            <div className="max-w-xl mx-auto text-center mb-6">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-ink mb-2">
                Track Your Shipment
              </h2>
              <p className="text-sm text-ink/70 leading-relaxed">
                Enter your Order Number and phone/email to view real-time tracking details, estimated delivery, and invoice summary.
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="max-w-2xl mx-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink/70 uppercase tracking-wider mb-2">
                    Order Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="e.g. AM-839102-123"
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-cream-line bg-cream/20 text-ink focus:outline-none focus:ring-2 focus:ring-gold/25 focus:border-gold transition-all font-mono text-sm uppercase"
                    />
                    <Package className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink/70 uppercase tracking-wider mb-2">
                    Email or Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. name@example.com or 9876543210"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-cream-line bg-cream/20 text-ink focus:outline-none focus:ring-2 focus:ring-gold/25 focus:border-gold transition-all text-sm"
                    />
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm flex items-start gap-3 animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#0A0A0A] hover:bg-[#D4AF37] text-white hover:text-black font-bold text-base rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 border border-gold/40"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Locating Order...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Track Order Status
                  </>
                )}
              </button>
            </form>
          </div>

          {/* TRACKED ORDER RESULT DETAILS */}
          {trackedOrder && (
            <div className="space-y-8 animate-fade-in-up">
              {/* Order Info & Status Header */}
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-cream-line/80">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-cream-line">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs uppercase tracking-wider font-bold text-ink/50">
                        Order Identifier
                      </span>
                      <span className="bg-gold/15 text-[#AA8034] font-mono font-bold px-3 py-1 rounded-full text-sm border border-gold/30">
                        #{trackedOrder.order_number}
                      </span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-ink mt-2">
                      Order Overview
                    </h3>
                    <p className="text-xs text-ink/60 mt-1">
                      Placed on {new Date(trackedOrder.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2.5 bg-cream/70 hover:bg-cream border border-cream-line text-ink text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm"
                    >
                      <Printer className="w-4 h-4 text-gold" />
                      Print Receipt
                    </button>
                    <a
                      href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(`Hi, I need assistance with my Order #${trackedOrder.order_number}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-sm"
                    >
                      <PhoneCall className="w-4 h-4" />
                      WhatsApp Support
                    </a>
                  </div>
                </div>

                {/* Status Stepper / Progress Bar */}
                {currentStep === -1 ? (
                  /* Cancelled status banner */
                  <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-4">
                    <XCircle className="w-10 h-10 text-red-500 shrink-0" />
                    <div>
                      <h4 className="font-bold text-red-800 text-base">This Order Has Been Cancelled</h4>
                      <p className="text-xs text-red-600 mt-1">
                        If you have questions regarding payment refund or cancellation reasons, please reach out to customer support.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Progress Stepper */
                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-ink/60">
                        Live Tracking Progress
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-gold-dark bg-gold/15 px-3 py-1 rounded-full border border-gold/30">
                        Status: {trackedOrder.order_status?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <div className="relative my-8">
                      {/* Line background */}
                      <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-cream-line -translate-y-1/2 rounded-full z-0" />
                      {/* Active line fill */}
                      <div
                        className="absolute top-1/2 left-0 h-1.5 bg-gradient-to-r from-black to-gold -translate-y-1/2 rounded-full z-0 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, ((currentStep - 1) / (steps.length - 1)) * 100))}%`
                        }}
                      />

                      {/* Step Nodes */}
                      <div className="relative z-10 flex justify-between">
                        {steps.map((step, idx) => {
                          const stepNum = idx + 1
                          const isDone = currentStep >= stepNum
                          const isCurrent = currentStep === stepNum

                          return (
                            <div key={step.title} className="flex flex-col items-center group">
                              <div
                                className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-xs md:text-sm transition-all duration-300 shadow-md ${
                                  isDone
                                    ? 'bg-[#0A0A0A] text-[#DFBA73] ring-4 ring-gold/30 scale-105'
                                    : 'bg-white border-2 border-cream-line text-ink/40'
                                } ${isCurrent ? 'animate-pulse ring-gold/40' : ''}`}
                              >
                                {isDone ? (
                                  <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                                ) : (
                                  <span>{stepNum}</span>
                                )}
                              </div>

                              <div className="text-center mt-3 max-w-[80px] md:max-w-[110px]">
                                <p
                                  className={`text-xs md:text-sm font-bold ${
                                    isDone ? 'text-ink' : 'text-ink/40'
                                  }`}
                                >
                                  {step.title}
                                </p>
                                <p className="text-[10px] text-ink/50 hidden md:block mt-0.5 leading-tight">
                                  {step.desc}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Details & Items Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Order Items */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-cream-line/80">
                    <div className="flex items-center justify-between pb-4 border-b border-cream-line">
                      <h3 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-gold" />
                        Items Ordered ({trackedOrder.order_items?.length || 0})
                      </h3>
                      <button
                        onClick={() => setItemsExpanded(!itemsExpanded)}
                        className="text-xs font-bold text-gold hover:text-black hover:underline flex items-center gap-1"
                      >
                        {itemsExpanded ? (
                          <>
                            Collapse <ChevronUp className="w-4 h-4" />
                          </>
                        ) : (
                          <>
                            Expand <ChevronDown className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    {itemsExpanded && (
                      <div className="divide-y divide-cream-line/60 mt-4">
                        {trackedOrder.order_items?.map((item: any) => (
                          <div
                            key={item.id}
                            className="py-4 flex items-center gap-4 hover:bg-cream/10 p-2 rounded-xl transition-colors"
                          >
                            <div className="relative w-14 h-18 rounded-lg overflow-hidden bg-cream shrink-0 border border-cream-line">
                              {item.image_url ? (
                                <Image
                                  src={item.image_url}
                                  alt={item.product_name}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-ink/20">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm text-ink truncate">
                                {item.product_name}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-ink/50 mt-0.5">
                                <span>Qty: {item.quantity}</span>
                                <span>•</span>
                                <span>₹{item.price_at_purchase} each</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-display font-bold text-ink text-sm">
                                ₹{item.price_at_purchase * item.quantity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Order Summary & Delivery Address */}
                <div className="space-y-6">
                  {/* Delivery Address Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-card border border-cream-line/80 space-y-4">
                    <h3 className="font-display text-base font-bold text-ink flex items-center gap-2 pb-3 border-b border-cream-line">
                      <MapPin className="w-4 h-4 text-gold" />
                      Delivery Information
                    </h3>
                    <div className="space-y-2 text-xs leading-relaxed text-ink/80">
                      <p className="font-bold text-ink text-sm">{trackedOrder.customer_name}</p>
                      <p>{trackedOrder.shipping_address}</p>
                      <p className="text-ink/60">{trackedOrder.customer_phone}</p>
                      <p className="text-ink/60">{trackedOrder.customer_email}</p>
                    </div>
                  </div>

                  {/* Pricing Summary Card */}
                  <div className="bg-white rounded-3xl p-6 shadow-card border border-cream-line/80 space-y-4">
                    <h3 className="font-display text-base font-bold text-ink flex items-center gap-2 pb-3 border-b border-cream-line">
                      <CreditCard className="w-4 h-4 text-gold" />
                      Invoice Summary
                    </h3>

                    <div className="space-y-2.5 text-xs text-ink/70">
                      <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-bold">₹{trackedOrder.subtotal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping Charges</span>
                        <span className="font-bold text-gold">
                          {trackedOrder.shipping_cost === 0 ? 'FREE' : `₹${trackedOrder.shipping_cost}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Payment Method</span>
                        <span className="font-bold text-ink/90">{trackedOrder.payment_method || 'Online'}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-cream-line">
                        <span>Payment Status</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                          trackedOrder.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {trackedOrder.payment_status || 'Pending'}
                        </span>
                      </div>

                      <div className="pt-3 border-t border-cream-line flex justify-between items-center text-sm font-bold text-ink">
                        <span>Total Paid</span>
                        <span className="text-base text-[#0D0D0D] font-display">₹{trackedOrder.total_amount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* HISTORY TAB CONTENT */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-card border border-cream-line/80 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-ink">
                  Your Order History
                </h2>
                <p className="text-xs text-ink/60 mt-1">
                  View and manage all your past purchase orders.
                </p>
              </div>

              {/* Search filter in history */}
              {!isGuest && historyOrders.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Search by order # or product..."
                    value={historySearchTerm}
                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-full border border-cream-line bg-cream/20 text-xs text-ink focus:outline-none focus:border-gold"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink/40" />
                </div>
              )}
            </div>

            {historyLoading ? (
              <div className="text-center py-16 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-gold mx-auto" />
                <p className="text-sm font-semibold text-ink/60">Fetching your orders...</p>
              </div>
            ) : isGuest ? (
              /* Guest State prompt */
              <div className="text-center py-12 px-4 max-w-md mx-auto bg-cream/30 rounded-2xl border border-cream-line space-y-4">
                <ShieldCheck className="w-12 h-12 text-gold mx-auto" />
                <h3 className="font-bold text-lg text-ink">Sign In to View Full Order History</h3>
                <p className="text-xs text-ink/70 leading-relaxed">
                  Log in with your registered account to instantly see your complete order history, past invoices, and tracking links.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link
                    href="/login"
                    className="px-6 py-2.5 bg-[#0A0A0A] hover:bg-[#D4AF37] text-white hover:text-black font-bold text-xs rounded-full shadow-md transition-all border border-gold/40"
                  >
                    Log In Now
                  </Link>
                  <button
                    onClick={() => setActiveTab('track')}
                    className="px-6 py-2.5 bg-white border border-cream-line text-ink font-bold text-xs rounded-full hover:bg-cream/50 transition-all"
                  >
                    Track Guest Order
                  </button>
                </div>
              </div>
            ) : filteredHistory.length > 0 ? (
              /* Orders List */
              <div className="space-y-4">
                {filteredHistory.map((ord) => (
                  <div
                    key={ord.id}
                    className="border border-cream-line hover:border-gold/50 rounded-2xl p-5 md:p-6 bg-white hover:bg-cream/10 transition-all duration-300 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-ink text-base">
                          Order #{ord.order_number}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                            ord.order_status === 'delivered'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : ord.order_status === 'cancelled'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {ord.order_status?.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <p className="text-xs text-ink/50">
                        Placed on {new Date(ord.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>

                      {/* Item Preview list */}
                      <div className="flex items-center gap-2 pt-2 flex-wrap">
                        {ord.order_items?.slice(0, 3).map((item: any) => (
                          <span
                            key={item.id}
                            className="text-xs bg-cream/70 border border-cream-line px-2.5 py-1 rounded-lg text-ink/80 truncate max-w-[200px]"
                          >
                            {item.quantity}x {item.product_name}
                          </span>
                        ))}
                        {ord.order_items?.length > 3 && (
                          <span className="text-xs text-ink/50 font-bold">
                            +{ord.order_items.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-cream-line/50 pt-3 md:pt-0 gap-3">
                      <div>
                        <div className="text-xs text-ink/50 text-right hidden md:block">Total Amount</div>
                        <div className="font-display font-bold text-[#0D0D0D] text-lg">
                          ₹{ord.total_amount}
                        </div>
                      </div>

                      <button
                        onClick={() => handleSelectFromHistory(ord)}
                        className="px-4 py-2 bg-[#0A0A0A] hover:bg-[#D4AF37] text-white hover:text-black text-xs font-bold rounded-xl transition-all border border-gold/40 flex items-center gap-1.5"
                      >
                        Track Details <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty orders state */
              <div className="text-center py-12 text-ink/60 space-y-4">
                <Package className="w-12 h-12 text-ink/30 mx-auto" />
                <p className="text-sm font-semibold">No orders found.</p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#0A0A0A] hover:bg-[#D4AF37] text-white hover:text-black font-bold text-xs rounded-full shadow-md transition-all border border-gold/40"
                >
                  Explore Collection & Shop <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
