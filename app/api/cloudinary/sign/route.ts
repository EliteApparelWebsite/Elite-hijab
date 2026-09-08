import { v2 as cloudinary } from 'cloudinary'

export async function POST(request: Request) {
  let body: any
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid or missing JSON body' }, { status: 400 })
  }
  const { paramsToSign } = body || {}
  if (!paramsToSign) {
    return Response.json({ error: 'Missing paramsToSign' }, { status: 400 })
  }

  // Configure cloudinary with the credentials from the environment
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })

  // Generate the signature
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  )

  return Response.json({ signature })
}
