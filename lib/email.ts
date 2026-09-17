// Shared Brevo email sending + templates, used by both the OTP/reset-password
// flows (actions/auth.ts) and order-confirmation emails (checkout + PayU
// fulfillment) so the API-call boilerplate and branding only live in one
// place.

export async function sendBrevoEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<{ error?: string }> {
  const brevoApiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'husnezaman@gmail.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'Elite Hijab'

  if (!brevoApiKey) {
    console.log(`[DEV MODE EMAIL] To: ${to}, Subject: ${subject}\n${html}`)
    return {}
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Brevo API Error:', errText)
      return { error: 'Failed to send email. Please try again.' }
    }

    return {}
  } catch (e: any) {
    console.error('Email Send Error:', e)
    return { error: 'Failed to send email: ' + e.message }
  }
}

export type OrderConfirmationItem = {
  name: string
  quantity: number
  lineTotal: number
}

export function orderConfirmationEmailHtml({
  orderNumber,
  customerName,
  items,
  subtotal,
  shippingCost,
  discount,
  totalAmount,
  paymentMethod,
}: {
  orderNumber: string
  customerName: string
  items: OrderConfirmationItem[]
  subtotal: number
  shippingCost: number
  discount?: number
  totalAmount: number
  paymentMethod: string
}): string {
  const itemsHtml = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #E6DAC4; text-align: left; color: #211D19; font-size: 13px;">${item.name} &times;${item.quantity}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #E6DAC4; text-align: right; color: #211D19; font-size: 13px; font-weight: 600;">&#8377;${Number(item.lineTotal).toLocaleString('en-IN')}</td>
        </tr>
      `
    )
    .join('')

  const summaryRow = (label: string, value: string) => `
    <tr>
      <td style="padding: 4px 0; text-align: left; color: #211D19; opacity: 0.7; font-size: 12px;">${label}</td>
      <td style="padding: 4px 0; text-align: right; color: #211D19; font-size: 12px;">${value}</td>
    </tr>
  `

  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; border: 1px solid #E6DAC4; border-radius: 24px; background-color: #FBF7F0; text-align: center; box-shadow: 0 4px 20px rgba(33,29,25,0.025);">
      <div style="margin-bottom: 24px;">
        <h1 style="color: #1E3B2E; font-size: 26px; font-weight: bold; letter-spacing: 2px; margin: 0; font-family: Georgia, serif;">Elite Hijab &amp; Accessories</h1>
      </div>
      <hr style="border: 0; border-top: 1px solid #E6DAC4; margin: 24px 0;" />
      <h2 style="color: #211D19; font-size: 20px; font-weight: bold; margin-bottom: 8px;">Order Confirmed!</h2>
      <p style="color: #211D19; opacity: 0.8; font-size: 14px; line-height: 1.6; margin-top: 0; max-width: 380px; margin-left: auto; margin-right: auto;">
        Hi ${customerName}, thank you for shopping with us! Your order has been placed successfully and is being prepared for dispatch.
      </p>

      <div style="display: inline-block; font-size: 13px; font-weight: 600; letter-spacing: 1px; color: #B9893F; padding: 10px 20px; border: 1.5px solid #B9893F; border-radius: 999px; background-color: #F3EADC; margin: 20px 0;">
        Order Ref: ${orderNumber}
      </div>

      <table style="width: 100%; max-width: 380px; margin: 0 auto; border-collapse: collapse; text-align: left;">
        ${itemsHtml}
      </table>

      <table style="width: 100%; max-width: 380px; margin: 12px auto 0; border-collapse: collapse; text-align: left;">
        ${summaryRow('Subtotal', `&#8377;${Number(subtotal).toLocaleString('en-IN')}`)}
        ${summaryRow('Shipping', shippingCost > 0 ? `&#8377;${Number(shippingCost).toLocaleString('en-IN')}` : 'Free')}
        ${discount ? summaryRow('Discount', `-&#8377;${Number(discount).toLocaleString('en-IN')}`) : ''}
        ${summaryRow('Payment Method', paymentMethod)}
        <tr>
          <td style="padding: 10px 0 0; text-align: left; color: #211D19; font-size: 15px; font-weight: 700; border-top: 1px solid #E6DAC4;">Total</td>
          <td style="padding: 10px 0 0; text-align: right; color: #1E3B2E; font-size: 15px; font-weight: 700; border-top: 1px solid #E6DAC4;">&#8377;${Number(totalAmount).toLocaleString('en-IN')}</td>
        </tr>
      </table>

      <p style="color: #211D19; opacity: 0.6; font-size: 12px; line-height: 1.5; margin: 24px 0 0;">
        We'll notify you again once your order ships. You can also track it anytime from your account.
      </p>
      <hr style="border: 0; border-top: 1px solid #E6DAC4; margin: 24px 0;" />
      <p style="color: #B9893F; opacity: 0.7; font-size: 11px; margin: 0;">
        &copy; ${new Date().getFullYear()} Elite Hijab &amp; Accessories. All rights reserved.
      </p>
    </div>
  `
}
