import { NextResponse } from 'next/server'
import { processPayuResult } from '@/lib/payuFulfillment'

export async function POST(req: Request) {
  const origin = new URL(req.url).origin
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin

  try {
    const formData = await req.formData()
    const fields = Object.fromEntries(formData.entries())

    const result = await processPayuResult(fields)
    if (!result.ok) {
      console.error('[PayU Callback Error]:', result.reason, result.txnid || '')
      return NextResponse.redirect(`${siteUrl}/profile`, { status: 303 })
    }

    return NextResponse.redirect(`${siteUrl}/order-success?order=${encodeURIComponent(result.orderNumber!)}`, { status: 303 })
  } catch (error) {
    console.error('[PayU Callback Critical Error]:', error)
    return NextResponse.redirect(`${siteUrl}/profile`, { status: 303 })
  }
}
