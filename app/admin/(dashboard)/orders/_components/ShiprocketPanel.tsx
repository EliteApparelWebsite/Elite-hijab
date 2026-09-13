'use client'

import { useState, useTransition } from 'react'
import { createShiprocketShipment } from '@/actions/admin/orders'
import { SHIPROCKET_NEW_ORDERS_URL } from '@/lib/shiprocket-constants'
import { Truck, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react'

export function ShiprocketPanel({
  orderId,
  initialShiprocketOrderId,
  initialAwbCode,
  initialCourierName,
  initialShiprocketStatus,
}: {
  orderId: string
  initialShiprocketOrderId: string | null
  initialAwbCode: string | null
  initialCourierName: string | null
  initialShiprocketStatus: string | null
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [weightKg, setWeightKg] = useState('')
  const [shiprocketOrderId, setShiprocketOrderId] = useState(initialShiprocketOrderId)
  const [awbCode] = useState(initialAwbCode)
  const [courierName] = useState(initialCourierName)
  const status = initialShiprocketStatus

  const handleCreateShipment = () => {
    setError(null)
    startTransition(async () => {
      const parsedWeight = weightKg.trim() ? parseFloat(weightKg) : undefined
      if (weightKg.trim() && (!parsedWeight || parsedWeight <= 0)) {
        setError('Enter a valid weight in kg (e.g. 0.3), or leave it blank to auto-estimate.')
        return
      }

      const result = await createShiprocketShipment(orderId, parsedWeight)

      if (!result?.success) {
        setError(result?.error || 'Failed to create Shiprocket shipment.')
        return
      }

      if (result.shiprocketOrderId) setShiprocketOrderId(result.shiprocketOrderId)
    })
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200/60 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <Truck className="w-5 h-5 text-stone-400" />
          Shipping (Shiprocket)
        </h3>
        {isPending && <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {!shiprocketOrderId ? (
        <>
          <p className="text-sm text-stone-500">
            Pushes this order to Shiprocket. You&apos;ll then assign a courier and confirm pickup yourself from the Shiprocket dashboard.
          </p>
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-2">
              Order Weight (kg) — optional
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Leave blank to auto-estimate"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              disabled={isPending}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm font-medium text-stone-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all disabled:opacity-50"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              The actual packed parcel weight gives more accurate courier rates than the auto-estimate.
            </p>
          </div>
          <button
            onClick={handleCreateShipment}
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 bg-stone-900 text-white text-sm font-semibold rounded-xl px-4 py-2.5 hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
            Ship via Shiprocket
          </button>
        </>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium">Order sent to Shiprocket</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Shiprocket Order ID</span>
            <span className="font-mono text-stone-900">{shiprocketOrderId}</span>
          </div>

          {awbCode ? (
            <>
              <div className="flex justify-between text-stone-600">
                <span>AWB Code</span>
                <span className="font-mono text-stone-900">{awbCode}</span>
              </div>
              {courierName && (
                <div className="flex justify-between text-stone-600">
                  <span>Courier</span>
                  <span className="font-medium text-stone-900">{courierName}</span>
                </div>
              )}
              {status && (
                <div className="flex justify-between items-center text-stone-600">
                  <span>Shiprocket Status</span>
                  <span className="font-semibold text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-0.5 text-xs capitalize">
                    {status}
                  </span>
                </div>
              )}
              <a
                href={`https://shiprocket.co/tracking/${awbCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full text-sm font-semibold rounded-xl px-4 py-2.5 border border-orange-200 text-stone-900 hover:bg-orange-50 transition-colors"
              >
                Track Shipment <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          ) : (
            <>
              <p className="text-xs text-stone-500 italic">
                {status ? `Shiprocket status: ${status}. ` : ''}No courier assigned yet — go to Shiprocket and click &quot;Ship Now&quot; on this order. The AWB and courier will appear here automatically once you do (via webhook).
              </p>
              <a
                href={SHIPROCKET_NEW_ORDERS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full text-sm font-semibold rounded-xl px-4 py-2.5 bg-stone-900 text-white hover:bg-stone-800 transition-colors"
              >
                Open Shiprocket — Ship Now <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </>
          )}
        </div>
      )}
    </div>
  )
}
