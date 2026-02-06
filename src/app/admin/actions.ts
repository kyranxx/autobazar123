'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface AdminStats {
  totalUsers: number
  totalAds: number
  activeAds: number
  pendingModeration: number
  dealerAccounts: number
  todayRegistrations: number
  todayAds: number
  soldToday: number
}

export interface RevenueStats {
  today: number
  thisWeek: number
  thisMonth: number
  totalCredits: number
  stripeRevenue: number
}

export interface PendingAd {
  id: string
  brand: string
  model: string
  seller: string
  sellerId: string
  photos: number
  price: number
  created_at: string
  flags: string[]
}

export interface AdminUser {
  id: string
  email: string
  full_name: string | null
  credit_balance: number
  created_at: string
  is_dealer: boolean
  ad_count: number
  is_banned: boolean
  role: 'user' | 'dealer' | 'admin'
}

export interface SystemLog {
  id: string
  level: string
  category: string
  message: string
  request_id: string | null
  user_id: string | null
  metadata: Record<string, unknown> | null
  error_stack: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  admin_id: string
  admin_email: string | null
  action: string
  target_type: string
  target_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

export interface FeatureFlag {
  id: string
  key: string
  enabled: boolean
  description: string | null
  created_at: string
  updated_at: string
}

export interface SiteSetting {
  key: string
  value: string
  updated_at: string
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const [
    { count: totalUsers },
    { count: totalAds },
    { count: activeAds },
    { count: pendingCount },
    { count: dealerCount },
    { count: todayRegs },
    { count: todayAdsCount },
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('ads').select('id', { count: 'exact', head: true }),
    supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('ads').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_dealer', true),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
    supabase.from('ads').select('id', { count: 'exact', head: true }).gte('created_at', todayISO),
  ])

  return {
    totalUsers: totalUsers || 0,
    totalAds: totalAds || 0,
    activeAds: activeAds || 0,
    pendingModeration: pendingCount || 0,
    dealerAccounts: dealerCount || 0,
    todayRegistrations: todayRegs || 0,
    todayAds: todayAdsCount || 0,
    soldToday: 0,
  }
}

export async function getRevenueStats(): Promise<RevenueStats> {
  const supabase = await createClient()
  
  const { data: credits } = await supabase
    .from('profiles')
    .select('credit_balance')
  
  const totalCredits = credits?.reduce((sum, p) => sum + (p.credit_balance || 0), 0) || 0

  return {
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    totalCredits,
    stripeRevenue: 0,
  }
}

export async function getPendingAds(): Promise<PendingAd[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('ads')
    .select(`
      id,
      price,
      photos_json,
      created_at,
      brands:brand_id (name),
      models:model_id (name),
      profiles:seller_id (id, email)
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(50)

  if (!data) return []

  return data.map((ad: Record<string, unknown>) => {
    const brands = ad.brands as { name?: string } | null
    const models = ad.models as { name?: string } | null
    const profiles = ad.profiles as { id?: string; email?: string } | null
    const photos = ad.photos_json as string[] | null

    return {
      id: ad.id as string,
      brand: brands?.name || 'Neznáma',
      model: models?.name || 'Model',
      seller: profiles?.email || 'N/A',
      sellerId: profiles?.id || '',
      photos: photos?.length || 0,
      price: (ad.price as number) || 0,
      created_at: ad.created_at as string,
      flags: [],
    }
  })
}

export async function approveAd(adId: string, adminId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ads')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('id', adId)

  if (error) throw new Error(error.message)

  await supabase.from('admin_audit_logs').insert({
    admin_id: adminId,
    action: 'approve_ad',
    target_type: 'ad',
    target_id: adId,
    created_at: new Date().toISOString(),
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function rejectAd(adId: string, adminId: string, reason?: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ads')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', adId)

  if (error) throw new Error(error.message)

  await supabase.from('admin_audit_logs').insert({
    admin_id: adminId,
    action: 'reject_ad',
    target_type: 'ad',
    target_id: adId,
    details: { reason },
    created_at: new Date().toISOString(),
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function getAdminUsers(search?: string, limit = 100): Promise<AdminUser[]> {
  const supabase = await createClient()

  let query = supabase
    .from('profiles')
    .select('id, email, full_name, credit_balance, created_at, is_dealer')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (search) {
    query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`)
  }

  const { data: profiles } = await query

  if (!profiles) return []

  const { data: admins } = await supabase.from('site_admins').select('user_id')
  const adminIds = new Set(admins?.map(a => a.user_id) || [])

  const usersWithStats = await Promise.all(
    profiles.map(async (profile) => {
      const { count } = await supabase
        .from('ads')
        .select('id', { count: 'exact', head: true })
        .eq('seller_id', profile.id)

      return {
        ...profile,
        ad_count: count || 0,
        is_banned: false,
        role: adminIds.has(profile.id) ? 'admin' : profile.is_dealer ? 'dealer' : 'user',
      } as AdminUser
    })
  )

  return usersWithStats
}

export async function banUser(userId: string, adminId: string, reason?: string) {
  const supabase = await createClient()

  await supabase.from('admin_audit_logs').insert({
    admin_id: adminId,
    action: 'ban_user',
    target_type: 'user',
    target_id: userId,
    details: { reason },
    created_at: new Date().toISOString(),
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function updateUserCredits(userId: string, adminId: string, newCredits: number, previousCredits: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('profiles')
    .update({ credit_balance: newCredits })
    .eq('id', userId)

  if (error) throw new Error(error.message)

  await supabase.from('admin_audit_logs').insert({
    admin_id: adminId,
    action: 'update_user_credits',
    target_type: 'user',
    target_id: userId,
    details: { previousCredits, newCredits },
    created_at: new Date().toISOString(),
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function getSystemLogs(level?: string, category?: string, limit = 100): Promise<SystemLog[]> {
  const supabase = await createClient()

  let query = supabase
    .from('system_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (level) query = query.eq('level', level)
  if (category) query = query.eq('category', category)

  const { data } = await query
  return (data as SystemLog[]) || []
}

export async function getAuditLogs(limit = 100): Promise<AuditLog[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('admin_audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  return (data as AuditLog[]) || []
}

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('feature_flags')
    .select('*')
    .order('key', { ascending: true })

  return (data as FeatureFlag[]) || []
}

export async function toggleFeatureFlag(flagId: string, enabled: boolean, adminId: string) {
  const supabase = await createClient()

  const { data: flag } = await supabase
    .from('feature_flags')
    .select('key')
    .eq('id', flagId)
    .single()

  const { error } = await supabase
    .from('feature_flags')
    .update({ enabled, updated_at: new Date().toISOString() })
    .eq('id', flagId)

  if (error) throw new Error(error.message)

  await supabase.from('admin_audit_logs').insert({
    admin_id: adminId,
    action: 'update_site_settings',
    target_type: 'setting',
    target_id: flag?.key || flagId,
    details: { enabled },
    created_at: new Date().toISOString(),
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function createFeatureFlag(key: string, description: string, adminId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('feature_flags').insert({
    key,
    description,
    enabled: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (error) throw new Error(error.message)

  await supabase.from('admin_audit_logs').insert({
    admin_id: adminId,
    action: 'update_site_settings',
    target_type: 'setting',
    target_id: key,
    details: { action: 'created' },
    created_at: new Date().toISOString(),
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function getSiteSettings(): Promise<SiteSetting[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('site_settings')
    .select('key, value, updated_at')
    .order('key', { ascending: true })

  return (data as SiteSetting[]) || []
}

export async function updateSiteSetting(key: string, value: string, adminId: string) {
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .single()

  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() })

  if (error) throw new Error(error.message)

  await supabase.from('admin_audit_logs').insert({
    admin_id: adminId,
    action: 'update_site_settings',
    target_type: 'setting',
    target_id: key,
    details: { previousValue: existing?.value, newValue: value },
    created_at: new Date().toISOString(),
  })

  revalidatePath('/admin')
  return { success: true }
}

export async function getRecentActivity() {
  const supabase = await createClient()
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

  const [{ data: recentAds }, { data: recentUsers }] = await Promise.all([
    supabase
      .from('ads')
      .select('id, created_at, status, profiles:seller_id (email)')
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('profiles')
      .select('id, email, created_at')
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return {
    recentAds: recentAds || [],
    recentUsers: recentUsers || [],
  }
}
