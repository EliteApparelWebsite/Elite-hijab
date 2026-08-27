'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // No real Supabase Auth session exists for this custom-cookie user
  // (auth.uid() is always null for the anon-key client), so writes to
  // "customers"/"addresses" below must go through the service-role
  // client to get past RLS. `user.id` above is already verified.
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  const fullName = formData.get('full_name')?.toString()
  const phone = formData.get('phone')?.toString()

  if (!fullName) {
    return { success: false, error: 'Full Name is required' }
  }

  const { error } = await admin
    .from('customers')
    .update({ 
      full_name: fullName,
      phone: phone || null,
    })
    .eq('id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/account')
  revalidatePath('/account/addresses')
  
  return { success: true }
}

export async function updateCustomerFullProfile(data: {
  fullName: string
  phone: string
  alternatePhone?: string
  street: string
  city: string
  state: string
  zipCode: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // No real Supabase Auth session exists for this custom-cookie user
  // (auth.uid() is always null for the anon-key client), so writes to
  // "customers"/"addresses" below must go through the service-role
  // client to get past RLS. `user.id` above is already verified.
  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  // 1. Update customers table
  const { error: profileError } = await admin
    .from('customers')
    .update({
      full_name: data.fullName,
      phone: data.phone || null
    })
    .eq('id', user.id)

  if (profileError) {
    return { success: false, error: 'Failed to update profile: ' + profileError.message }
  }

  // 2. Create or update addresses table
  const { data: existingAddress } = await admin
    .from('addresses')
    .select('id')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingAddress) {
    const { error: addressError } = await admin
      .from('addresses')
      .update({
        full_name: data.fullName,
        phone: data.phone,
        alternate_phone: data.alternatePhone || null,
        address_line_1: data.street,
        city: data.city,
        state: data.state,
        postal_code: data.zipCode
      })
      .eq('id', existingAddress.id)

    if (addressError) {
      return { success: false, error: 'Failed to update address: ' + addressError.message }
    }
  } else {
    const { error: addressError } = await admin
      .from('addresses')
      .insert({
        user_id: user.id,
        full_name: data.fullName,
        phone: data.phone,
        alternate_phone: data.alternatePhone || null,
        address_line_1: data.street,
        city: data.city,
        state: data.state,
        postal_code: data.zipCode,
        country: 'India',
        is_default: true
      })

    if (addressError) {
      return { success: false, error: 'Failed to save address: ' + addressError.message }
    }
  }

  revalidatePath('/profile')
  return { success: true }
}
