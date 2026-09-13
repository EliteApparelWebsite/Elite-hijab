import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, Package, MapPin, CreditCard, CheckCircle2 } from 'lucide-react'
import { getOrderByIdAction } from '@/actions/orders'
import OrderTrackingCard from './_components/OrderTrackingCard'

export const metadata = {
  title: 'Order Details | Elite Hijab',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'text-ink/70 bg-ink/5 border-ink/15',
  processing: 'text-gold-dark bg-gold/15 border-gold/35',
  shipped: 'text-blue-600 bg-blue-500/15 border-blue-500/30',
  delivered: 'text-emerald-600 bg-emerald-500/15 border-emerald-500/30',
  cancelled: 'text-red-600 bg-red-500/15 border-red-500/30',
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const res = await getOrderByIdAction(id)

  if (!res.success || !res.order) notFound()

  const order = res.order
  const address = order.addresses
  const statusStyle = STATUS_STYLES[order.order_status] || STATUS_STYLES.pending

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream pt-28 pb-16 md:pt-36 md:pb-24">
        <div className="max-w-3xl mx-auto px-5">
          <Link
            href="/profile"
            className="group mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-ink/60 transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" /> Back to My Account
          </Link>

          <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-cream-line pb-6">
            <div className="min-w-0">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink break-words">
                Order <span className="text-gold-dark">{order.order_number}</span>
              </h1>
              <p className="mt-2 text-sm text-ink/60 font-medium">
                Placed on{' '}
                {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <span className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-widest ${statusStyle}`}>
              {order.order_status}
            </span>
          </div>

          <div className="space-y-6">
            {/* Items */}
            <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-card border border-cream-line/75">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A0A0A] text-gold shadow-md">
                  <Package className="h-5 w-5" />
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">Items</h2>
              </div>
              <ul className="divide-y divide-cream-line">
                {order.order_items.map((item: any) => (
                  <li key={item.id} className="flex items-center gap-3.5 py-4">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-cream-line bg-cream">
                      {item.image_url ? (
                        <Image src={item.image_url} alt="" fill sizes="64px" className="object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-ink/20">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-ink font-semibold leading-snug break-words text-sm sm:text-base">{item.product_name}</p>
                      <p className="flex flex-wrap items-center gap-1.5 text-ink/60 mt-1 text-xs sm:text-sm font-medium">
                        {item.color_name && <span>Color: {item.color_name}</span>}
                        {item.color_name && item.variant_name && <span className="text-ink/30">·</span>}
                        {item.variant_name && <span>Size: {item.variant_name}</span>}
                        <span className="text-ink/30">·</span>
                        <span>Qty {item.quantity}</span>
                      </p>
                    </div>
                    <span className="shrink-0 text-sm sm:text-base font-bold text-ink">
                      ₹{Number(item.line_total).toLocaleString('en-IN')}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 space-y-2 border-t border-cream-line pt-4 text-sm font-medium">
                <div className="flex justify-between text-ink/60">
                  <span>Subtotal</span>
                  <span className="text-ink font-bold">₹{Number(order.subtotal).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-ink/60">
                  <span>Shipping</span>
                  <span className="text-ink font-bold">₹{Number(order.shipping_cost).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-cream-line pt-3 text-base">
                  <span className="font-bold text-gold-dark">Total</span>
                  <span className="font-bold text-ink">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Shipment Tracking */}
            {(order.awb_code || order.shiprocket_order_id) && (
              <OrderTrackingCard
                orderId={order.id}
                initialOrderStatus={order.order_status}
                initialShiprocketStatus={order.shiprocket_status}
                initialAwbCode={order.awb_code}
                initialCourierName={order.courier_name}
              />
            )}

            {/* Shipping Address */}
            {address && (
              <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-card border border-cream-line/75">
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A0A0A] text-gold shadow-md">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">Shipping Address</h2>
                </div>
                <p className="text-sm sm:text-base text-ink font-bold">
                  {address.full_name} · {address.phone}
                </p>
                <p className="text-sm sm:text-base text-ink/70 mt-2 font-medium">
                  {address.address_line_1}
                  {address.address_line_2 ? `, ${address.address_line_2}` : ''}
                </p>
                <p className="text-sm sm:text-base text-ink/70 font-medium">
                  {address.city}, {address.state} {address.postal_code}
                </p>
              </div>
            )}

            {/* Payment */}
            <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-card border border-cream-line/75">
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A0A0A] text-gold shadow-md">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">Payment</h2>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
                <span className="text-ink/60 font-bold">Method:</span>
                <span className="text-ink font-bold">{order.payment_method}</span>
                <span className="text-ink/20 hidden sm:inline">|</span>
                <span className="text-ink/60 font-bold">Status:</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs sm:text-sm font-bold capitalize ${
                    order.payment_status === 'paid'
                      ? 'text-emerald-600 bg-emerald-500/15 border-emerald-500/30'
                      : order.payment_status === 'failed'
                      ? 'text-red-600 bg-red-500/15 border-red-500/30'
                      : 'text-ink/70 bg-ink/5 border-ink/15'
                  }`}
                >
                  {order.payment_status === 'paid' && <CheckCircle2 className="h-3.5 w-3.5" />}
                  {order.payment_status}
                </span>
              </div>
              {order.payu_payment_id && (
                <div className="mt-4 border-t border-cream-line pt-4">
                  <span className="block text-xs font-bold uppercase tracking-wider text-ink/50">PayU Payment ID</span>
                  <span className="font-mono text-sm text-ink/80 select-all font-semibold">{order.payu_payment_id}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
