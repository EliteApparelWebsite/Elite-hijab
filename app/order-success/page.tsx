import Link from 'next/link'
import { CheckCircle2, Package } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getOrderSuccessSummary } from '@/actions/orders'

export const metadata = {
  title: 'Order Placed | Elite Hijab',
}

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>
}) {
  const { order: orderNumber } = await searchParams
  const result = orderNumber ? await getOrderSuccessSummary(orderNumber) : null
  const order = result?.success ? result.order : null

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream flex flex-col justify-center py-20 px-5">
        <div className="max-w-md w-full mx-auto bg-white rounded-3xl p-8 border border-cream-line shadow-card text-center space-y-6 mt-16">
          <div className="w-16 h-16 bg-gold/15 text-gold rounded-full flex items-center justify-center mx-auto border border-gold/30">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-ink">Order Placed Successfully!</h1>
            <p className="text-sm text-ink/60 mt-1">Thank you for shopping with Elite Hijab.</p>
          </div>

          {order && (
            <div className="p-4 bg-cream/40 rounded-2xl border border-cream-line/50 text-left space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-ink/50 uppercase font-semibold">Order Number</span>
                <span className="font-bold text-ink">{order.order_number}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink/50 uppercase font-semibold">Grand Total</span>
                <span className="font-bold text-[#0D0D0D]">₹{Number(order.total_amount).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink/50 uppercase font-semibold">Payment Method</span>
                <span className="font-bold text-ink">{order.payment_method}</span>
              </div>
            </div>
          )}

          <Link
            href="/profile"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 bg-[#0A0A0A] text-white border border-gold/40 font-body font-semibold rounded-full shadow-md hover:bg-[#D4AF37] hover:text-black hover:border-transparent transition-all duration-300"
          >
            <Package className="w-5 h-5" />
            My Orders
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
