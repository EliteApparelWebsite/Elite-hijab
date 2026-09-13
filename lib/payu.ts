import crypto from 'crypto'

export function isPayuEnabled(): boolean {
  return Boolean(process.env.PAYU_MERCHANT_KEY && process.env.PAYU_MERCHANT_SALT)
}

export function getPayuActionUrl(): string {
  return process.env.PAYU_MODE === 'live' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment'
}

type PayuHashFields = {
  key: string
  txnid: string
  amount: string
  productinfo: string
  firstname: string
  email: string
  udf1?: string
  udf2?: string
  udf3?: string
  udf4?: string
  udf5?: string
}

export function generatePayuHash(fields: PayuHashFields, salt: string): string {
  const { key, txnid, amount, productinfo, firstname, email, udf1 = '', udf2 = '', udf3 = '', udf4 = '', udf5 = '' } = fields
  const hashString = [key, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5, '', '', '', '', '', salt].join('|')
  return crypto.createHash('sha512').update(hashString).digest('hex')
}

export function verifyPayuResponseHash(fields: Record<string, any>, salt: string): boolean {
  const {
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    status,
    udf1 = '',
    udf2 = '',
    udf3 = '',
    udf4 = '',
    udf5 = '',
    hash,
  } = fields

  if (!hash) return false

  const hashString = [salt, status, '', '', '', '', '', udf5, udf4, udf3, udf2, udf1, email, firstname, productinfo, amount, txnid, key].join('|')
  const expectedHash = crypto.createHash('sha512').update(hashString).digest('hex')

  const expectedBuffer = Buffer.from(expectedHash.toLowerCase(), 'utf8')
  const givenBuffer = Buffer.from(String(hash).toLowerCase(), 'utf8')
  if (expectedBuffer.length !== givenBuffer.length) return false

  return crypto.timingSafeEqual(expectedBuffer, givenBuffer)
}
