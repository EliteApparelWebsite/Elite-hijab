'use client'

import { useEffect, useRef, useState } from 'react'
import { Truck, ExternalLink, RadioTower } from 'lucide-react'
import { getOrderStatusAction } from '@/actions/orders'
import { trackingUrlForAwb } from '@/lib/shiprocket-constants'

const POLL_INTERVAL_MS = 20000

export default function OrderTrackingCard({
  orderId,
  initialOrderStatus,
  initialShiprocketStatus,
  initialAwbCode,
  initialCourierName,
}: {
  orderId: string
  initialOrderStatus: string
  initialShiprocketStatus: string | null
  initialAwbCode: string | null
  initialCourierName: string | null
}) {
  const [orderStatus, setOrderStatus] = useState(initialOrderStatus)
  const [shiprocketStatus, setShiprocketStatus] = useState(initialShiprocketStatus)
  const [awbCode, setAwbCode] = useState(initialAwbCode)
  const [courierName, setCourierName] = useState(initialCourierName)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const isFinal = orderStatus === 'delivered' || orderStatus === 'cancelled'

  // Polls our own DB (kept fresh by the Shiprocket webhook as status updates
  // arrive) rather than calling Shiprocket's tracking API directly — this is
  // what lets the page reflect a courier/status change without the customer
  // reloading, without adding a second live Shiprocket API dependency here.
  useEffect(() => {
    if (isFinal) return

    const poll = async () => {
      const res = await getOrderStatusAction(orderId)
      if (res.success && res.order) {
        setOrderStatus(res.order.order_status)
        setShiprocketStatus(res.order.shiprocket_status)
        setAwbCode(res.order.awb_code)
        setCourierName(res.order.courier_name)
      }
    }

    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [orderId, isFinal])

  const trackingUrl = awbCode ? trackingUrlForAwb(awbCode) : null

  return (
    <div className="bg-white rounded-2xl p-5 sm:p-8 shadow-card border border-cream-line/75">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0A0A0A] text-gold shadow-md">
          <Truck className="h-5 w-5" />
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-bold text-ink">Shipment Tracking</h2>
        {!isFinal && (
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <RadioTower className="h-3.5 w-3.5 animate-pulse" /> Live
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm font-medium mb-4">
        <span className="text-ink/50">Courier:</span>
        <span className="text-ink font-bold">{courierName || 'Shiprocket'}</span>
        {awbCode && (
          <>
            <span className="text-ink/20">|</span>
            <span className="text-ink/50">AWB No:</span>
            <span className="text-ink font-mono select-all">{awbCode}</span>
          </>
        )}
      </div>

      {trackingUrl && (
        <a
          href={trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/5 px-4 py-2 text-xs sm:text-sm font-bold uppercase tracking-wide text-gold-dark transition-all duration-300 hover:border-gold hover:bg-gold/10"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Track on Shiprocket
        </a>
      )}

      {shiprocketStatus && (
        <p className="border-t border-cream-line pt-4 text-sm text-ink/70 font-medium">
          Last known status: <span className="text-ink font-bold capitalize">{shiprocketStatus}</span>
        </p>
      )}

      {!awbCode && (
        <p className="text-xs text-ink/50 italic">
          Your order has been handed off to our courier partner. Tracking details will appear here once a courier is assigned.
        </p>
      )}
    </div>
  )
}
