'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies, headers } from 'next/headers'
import crypto from 'crypto'

export type AuthResult = {
  error?: string
  success?: boolean
  message?: string
}

async function sendBrevoEmail({ to, subject, html }: { to: string; subject: string; html: string }): Promise<{ error?: string }> {
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

function resetPasswordEmailHtml(link: string): string {
  return `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; border: 1px solid #E6DAC4; border-radius: 24px; background-color: #FBF7F0; text-align: center; box-shadow: 0 4px 20px rgba(33,29,25,0.025);">
      <div style="margin-bottom: 24px;">
        <h1 style="color: #1E3B2E; font-size: 26px; font-weight: bold; letter-spacing: 2px; margin: 0; font-family: Georgia, serif;">Elite Hijab &amp; Accessories</h1>
      </div>
      <hr style="border: 0; border-top: 1px solid #E6DAC4; margin: 24px 0;" />
      <h2 style="color: #211D19; font-size: 20px; font-weight: bold; margin-bottom: 8px;">Reset your password</h2>
      <p style="color: #211D19; opacity: 0.8; font-size: 14px; line-height: 1.6; margin-top: 0; max-width: 380px; margin-left: auto; margin-right: auto;">
        We received a request to reset your Elite Hijab account password. Click the button below to choose a new one.
      </p>
      <div style="margin: 32px 0;">
        <a href="${link}" style="display: inline-block; font-size: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: #1E3B2E; padding: 14px 32px; border-radius: 999px; background-color: #B9893F; text-decoration: none;">
          Reset Password
        </a>
      </div>
      <p style="color: #211D19; opacity: 0.6; font-size: 12px; line-height: 1.5; margin: 24px 0;">
        This link is valid for <strong style="color: #211D19;">30 minutes</strong>.<br />
        If you did not request this, please ignore this email — your password will not change.
      </p>
      <hr style="border: 0; border-top: 1px solid #E6DAC4; margin: 24px 0;" />
      <p style="color: #B9893F; opacity: 0.7; font-size: 11px; margin: 0;">
        &copy; ${new Date().getFullYear()} Elite Hijab. All rights reserved.
      </p>
    </div>
  `
}

export async function login(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data?.user) {
    return { error: 'Invalid email or password' }
  }

  // Fetch the customer profile and establish the same custom-cookie session
  // every other part of the app (admin layout, checkout, profile pages)
  // reads via createClient()'s auth wrapper — a raw Supabase Auth session
  // alone is not enough for the rest of the app to recognize this user.
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('customers')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle()

  const cookieStore = await cookies()
  cookieStore.set('hijabistaa-user-session', JSON.stringify({
    id: data.user.id,
    email: data.user.email,
    full_name: profile?.full_name || data.user.user_metadata?.full_name || 'Customer',
    role: 'customer'
  }), {
    path: '/',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  })

  const redirectTo = formData.get('redirect_to') as string
  revalidatePath('/', 'layout')
  redirect(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/')
}

export async function register(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const supabase = await createClient()

  const fullName = formData.get('full_name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const phone = formData.get('phone') as string // optional

  if (!fullName || !email || !password) {
    return { error: 'Full name, email, and password are required' }
  }

  // 1. Create the user using the Admin API to forcefully confirm the email 
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminAuth = createAdminClient().auth.admin

  const { data: newUser, error: createError } = await adminAuth.createUser({
    email,
    password,
    email_confirm: true, // Forces immediate verification!
    user_metadata: {
      full_name: fullName,
      phone: phone || '',
      role: 'customer',
    },
  })

  if (createError) {
    if (createError.message.includes('already been registered')) {
      return { error: 'An account with this email already exists' }
    }
    return { error: createError.message }
  }

  // Fallback customer insert in case trigger doesn't exist
  try {
    if (newUser?.user) {
      await supabase.from('customers').insert({
        id: newUser.user.id,
        email,
        full_name: fullName,
        phone: phone || null,
      })
    }
  } catch (e) {
    // Suppress if trigger handled it
  }

  // 2. Sign in with standard client to establish browser sessions
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return { error: 'Account created but failed to log in automatically.' }
  }

  const redirectTo = formData.get('redirect_to') as string
  revalidatePath('/', 'layout')
  redirect(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/')
}

export async function sendEmailOtp(
  email: string,
  mode: 'LOGIN' | 'REGISTER',
  fullName?: string
): Promise<AuthResult> {
  const supabase = await createClient()

  if (!email) {
    return { error: 'Email is required' }
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  if (mode === 'LOGIN') {
    const { data: profile } = await adminClient
      .from('customers')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (!profile) {
      return { error: 'User does not exist, first create an account' }
    }
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  // Clean old OTPs for this email & clean all expired OTPs globally
  await adminClient.from('email_otps').delete().eq('email', email)
  await adminClient.from('email_otps').delete().lt('expires_at', new Date().toISOString())

  // Insert OTP record
  const { error: dbError } = await adminClient
    .from('email_otps')
    .insert({
      email,
      otp,
      full_name: fullName || null,
      expires_at: expiresAt
    })

  if (dbError) {
    console.error('OTP Save DB Error:', dbError)
    return { error: 'Failed to generate verification code. Please try again.' }
  }

  const brevoApiKey = process.env.BREVO_API_KEY
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'husnezaman@gmail.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'Elite Hijab'

  if (!brevoApiKey) {
    console.log(`[DEV MODE OTP] Email: ${email}, OTP: ${otp}`)
    return { error: `Email API Key is missing. If testing locally, your OTP is printed in the server terminal: ${otp}` }
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
        to: [{ email }],
        subject: 'Your Verification Code - Elite Hijab',
        htmlContent: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; border: 1px solid #E6DAC4; border-radius: 24px; background-color: #FBF7F0; text-align: center; box-shadow: 0 4px 20px rgba(33,29,25,0.025);">
            <!-- Logo Header -->
            <div style="margin-bottom: 24px;">
              <h1 style="color: #1E3B2E; font-size: 26px; font-weight: bold; letter-spacing: 2px; margin: 0; font-family: Georgia, serif;">Elite Hijab &amp; Accessories</h1>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #E6DAC4; margin: 24px 0;" />
            
            <!-- Message Heading -->
            <h2 style="color: #211D19; font-size: 20px; font-weight: bold; margin-bottom: 8px;">Verification Code</h2>
            <p style="color: #211D19; opacity: 0.8; font-size: 14px; line-height: 1.6; margin-top: 0; max-width: 380px; margin-left: auto; margin-right: auto;">
              Please enter the 6-digit OTP code below to secure your login session.
            </p>
            
            <!-- OTP Block -->
            <div style="margin: 32px 0;">
              <div style="display: inline-block; font-size: 34px; font-weight: bold; letter-spacing: 8px; color: #1E3B2E; padding: 16px 32px; border: 1.5px solid #B9893F; border-radius: 16px; background-color: #F3EADC; text-shadow: 0 1px 0 #fff; box-shadow: inset 0 1px 3px rgba(0,0,0,0.02);">
                ${otp}
              </div>
            </div>
            
            <!-- Expiry notice -->
            <p style="color: #211D19; opacity: 0.6; font-size: 12px; line-height: 1.5; margin: 24px 0;">
              This verification code is valid for <strong style="color: #211D19;">10 minutes</strong>.<br />
              If you did not request this verification, please ignore this email.
            </p>
            
            <hr style="border: 0; border-top: 1px solid #E6DAC4; margin: 24px 0;" />
            
            <!-- Footer -->
            <p style="color: #B9893F; opacity: 0.7; font-size: 11px; margin: 0;">
              &copy; ${new Date().getFullYear()} Elite Hijab. All rights reserved.
            </p>
          </div>
        `
      })
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Brevo API Error:', errText)
      return { error: 'Failed to send verification email.' }
    }

    return { success: true }
  } catch (e: any) {
    console.error('Email Send Error:', e)
    return { error: 'Failed to send verification email: ' + e.message }
  }
}

export async function verifyEmailOtp(
  email: string,
  otp: string,
  redirectTo?: string,
  fullName?: string,
  phone?: string,
  password?: string
): Promise<AuthResult> {
  const supabase = await createClient()

  if (!email || !otp) {
    return { error: 'Email and OTP code are required' }
  }

  // Password is optional here (the guest-checkout OTP flow never sets one),
  // but when the registration form does supply one, it must meet the same
  // minimum Supabase enforces — checked before we touch the OTP record so a
  // weak password fails fast without burning the code.
  if (password && password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const { data: records } = await adminClient
    .from('email_otps')
    .select('*')
    .eq('email', email)
    .order('created_at', { ascending: false })

  const record = records?.[0]
  if (!record) {
    return { error: 'No OTP requested for this email' }
  }

  if (record.otp !== otp) {
    return { error: 'Invalid OTP code' }
  }

  if (new Date(record.expires_at) < new Date()) {
    await adminClient.from('email_otps').delete().eq('email', email)
    return { error: 'OTP has expired. Please request a new one.' }
  }

  // OTP verified, delete it
  await adminClient.from('email_otps').delete().eq('email', email)

  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
  if (isMock) {
    const cookieStore = await cookies()
    cookieStore.set('mock-admin-logged-in', 'true', { path: '/' })
    
    await supabase.from('customers').insert({
      id: 'mock-user-' + Math.random().toString(36).substring(2, 9),
      email,
      full_name: fullName || record.full_name || 'Customer',
      phone: phone || null
    })

    revalidatePath('/', 'layout')
    redirect(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/')
  }

  // Real Supabase Auth Flow
  const adminAuth = adminClient.auth.admin

  // Check customers table first. Use the service-role client here (and for
  // every customers read/write below): this OTP flow never creates a real
  // Supabase Auth session (we only set our own "hijabistaa-user-session"
  // cookie at the end), so the anon-key client always has auth.uid() = null
  // and gets blocked by the "customers" RLS SELECT policy.
  let userExists = false
  const { data: existingProfile } = await adminClient
    .from('customers')
    .select('id')
    .eq('email', email)
    .single()

  if (existingProfile) {
    userExists = true
  }

  if (!userExists) {
    try {
      const { data: userList } = await adminAuth.listUsers()
      const userData = (userList?.users as any[])?.find(u => u.email?.toLowerCase() === email.toLowerCase())
      if (userData) {
        userExists = true
      }
    } catch (e) {
      // user does not exist
    }
  }

  if (!userExists) {
    const nameToUse = fullName || record.full_name || 'Customer'
    const { data: newUser, error: createError } = await adminAuth.createUser({
      email,
      // Only set when the registration form supplied one (guest checkout's
      // OTP verify never does) — without a password the account can still
      // only be reached via a fresh OTP, never email+password login.
      ...(password ? { password } : {}),
      email_confirm: true,
      user_metadata: {
        full_name: nameToUse,
        role: 'customer'
      }
    })

    if (createError) {
      if (createError.message.includes('already been registered') || createError.message.includes('already exists')) {
        // User actually exists, safe to proceed
      } else {
        return { error: 'Failed to create user account: ' + createError.message }
      }
    } else {
      try {
        if (newUser?.user) {
          if (email) {
            const { data: conflictingCustomer } = await adminClient
              .from('customers')
              .select('id')
              .eq('email', email)
              .maybeSingle()

            if (conflictingCustomer && conflictingCustomer.id !== newUser.user.id) {
              const { error: updateError } = await adminClient
                .from('customers')
                .update({ id: newUser.user.id })
                .eq('id', conflictingCustomer.id)
              
              if (updateError) {
                console.warn('Failed to update customer ID for conflict, deleting:', updateError.message)
                await adminClient
                  .from('customers')
                  .delete()
                  .eq('id', conflictingCustomer.id)
              }
            }
          }

          await adminClient.from('customers').insert({
            id: newUser.user.id,
            email,
            full_name: nameToUse,
            phone: phone || null
          })
        }
      } catch (e) {
        // Silently catch in case database trigger handles it
      }
    }
  }

  // Custom Cookie Auth Session
  const { data: profile } = await adminClient
    .from('customers')
    .select('*')
    .eq('email', email)
    .single()

  let finalProfile = profile
  if (!finalProfile) {
    try {
      const { data: userList } = await adminAuth.listUsers()
      const userData = (userList?.users as any[])?.find(u => u.email?.toLowerCase() === email.toLowerCase())
      if (userData) {
        const nameToUse = fullName || record.full_name || 'Customer'
        const { data: insertedProfile } = await adminClient.from('customers').insert({
          id: userData.id,
          email,
          full_name: nameToUse,
          phone: phone || null
        }).select('*').single()
        finalProfile = insertedProfile
      }
    } catch (e) {
      console.error('Error fetching user fallback:', e)
    }
  }

  if (!finalProfile) {
    return { error: 'Failed to establish user profile session.' }
  }

  const cookieStore = await cookies()
  cookieStore.set('hijabistaa-user-session', JSON.stringify({
    id: finalProfile.id,
    email: finalProfile.email,
    full_name: finalProfile.full_name,
    role: 'customer'
  }), {
    path: '/',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  })

  revalidatePath('/', 'layout')
  if (redirectTo === 'NO_REDIRECT') {
    return { success: true }
  }
  redirect(redirectTo && redirectTo.startsWith('/') ? redirectTo : '/')
}

// ─── Forgot Password (email-link) ───────────────────────────
// Two-step flow, separate from the OTP login/register system above: a
// short-lived random token (not a 6-digit code) is emailed as a clickable
// link, since a password reset happens away from any in-progress form the
// user is filling — they may open it minutes later, on another device.

export async function requestPasswordReset(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const email = formData.get('email') as string
  if (!email) {
    return { error: 'Email is required' }
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const { data: profile } = await adminClient
    .from('customers')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (!profile) {
    return { error: 'No account found with this email.' }
  }

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  await adminClient.from('password_reset_tokens').delete().eq('email', email)
  const { error: dbError } = await adminClient
    .from('password_reset_tokens')
    .insert({ token, email, expires_at: expiresAt })

  if (dbError) {
    console.error('Password reset token save error:', dbError)
    return { error: 'Failed to start password reset. Please try again.' }
  }

  // Same fallback as the PayU checkout flow (actions/checkout.ts): derive
  // the domain from the actual incoming request instead of trusting
  // NEXT_PUBLIC_SITE_URL to be set in every environment — without this,
  // an unset env var on production silently linked the reset email back to
  // localhost.
  const requestHeaders = await headers()
  const host = requestHeaders.get('host')
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`
  const resetLink = `${siteUrl}/reset-password?token=${token}`

  const emailResult = await sendBrevoEmail({
    to: email,
    subject: 'Reset your Elite Hijab password',
    html: resetPasswordEmailHtml(resetLink),
  })
  if (emailResult.error) {
    return { error: emailResult.error }
  }

  return { success: true, message: 'A reset link has been sent to your email.' }
}

export async function resetPassword(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const token = formData.get('token') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string

  if (!token) {
    return { error: 'Missing or invalid reset link.' }
  }
  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const adminClient = createAdminClient()

  const { data: record } = await adminClient
    .from('password_reset_tokens')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!record) {
    return { error: 'This reset link is invalid or has already been used.' }
  }
  if (new Date(record.expires_at) < new Date()) {
    await adminClient.from('password_reset_tokens').delete().eq('token', token)
    return { error: 'This reset link has expired. Please request a new one.' }
  }

  const { data: profile } = await adminClient
    .from('customers')
    .select('id')
    .eq('email', record.email)
    .maybeSingle()

  if (!profile) {
    return { error: 'Account not found.' }
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(profile.id, { password })
  if (updateError) {
    return { error: updateError.message }
  }

  await adminClient.from('password_reset_tokens').delete().eq('token', token)

  return { success: true }
}

export async function adminLogin(
  _prevState: AuthResult,
  formData: FormData
): Promise<AuthResult> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'husnezaman@gmail.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123'

  const isMock = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
  if (isMock) {
    if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
      const cookieStore = await cookies()
      cookieStore.set('hijabistaa-user-session', JSON.stringify({
        id: 'mock-admin-id',
        email: adminEmail,
        full_name: 'Admin',
        role: 'admin'
      }), {
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      })
      cookieStore.set('mock-admin-logged-in', 'true', { path: '/' })
      revalidatePath('/admin', 'layout')
      redirect('/admin')
    } else {
      return { error: 'Invalid credentials' }
    }
  }

  let signInRes = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  let data = signInRes.data
  let error = signInRes.error

  if (error && email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
    try {
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const adminClient = createAdminClient()
      
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'admin', full_name: 'Admin' }
      })

      if (!createError && newUser?.user) {
        const retry = await supabase.auth.signInWithPassword({ email, password })
        data = retry.data
        error = retry.error
      }
    } catch (e) {
      console.error('Failed to auto-seed admin user:', e)
    }
  }

  if (error || !data?.user) {
    if (email.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
      const cookieStore = await cookies()
      cookieStore.set('hijabistaa-user-session', JSON.stringify({
        id: 'mock-admin-id',
        email: adminEmail,
        full_name: 'Admin',
        role: 'admin'
      }), {
        path: '/',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      })
      cookieStore.set('mock-admin-logged-in', 'true', { path: '/' })
      revalidatePath('/admin', 'layout')
      redirect('/admin')
    }
    return { error: error?.message || 'Invalid credentials' }
  }

  // Verify this user is actually an admin
  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle()

  if (email.toLowerCase() === adminEmail.toLowerCase()) {
    if (!profile) {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: email.toLowerCase(),
          full_name: 'Admin',
          role: 'admin'
        })
        .select('*')
        .single()
      
      if (!insertError) {
        profile = newProfile
      }
    } else if (profile.role !== 'admin') {
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', data.user.id)
        .select('*')
        .single()
      
      if (!updateError) {
        profile = updatedProfile
      }
    }
  }

  const hasAdminMeta = data?.user?.user_metadata?.role === 'admin'
  if (!hasAdminMeta && (!profile || profile.role !== 'admin')) {
    await supabase.auth.signOut()
    return { error: 'You do not have admin access' }
  }

  const cookieStore = await cookies()
  cookieStore.set('hijabistaa-user-session', JSON.stringify({
    id: data.user.id,
    email: data.user.email,
    full_name: profile?.full_name || 'Admin',
    role: 'admin'
  }), {
    path: '/',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 24 * 60 * 60 // 30 days
  })

  revalidatePath('/admin', 'layout')
  redirect('/admin')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

