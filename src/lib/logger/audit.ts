import { createClient } from '@/lib/supabase/server'
import { logger } from './index'

export type AdminAction =
  | 'approve_ad'
  | 'reject_ad'
  | 'delete_ad'
  | 'ban_user'
  | 'unban_user'
  | 'update_user_credits'
  | 'update_site_settings'
  | 'feature_ad'
  | 'unfeature_ad'
  | 'edit_ad'
  | 'delete_user'
  | 'grant_admin'
  | 'revoke_admin'
  | 'other'

export interface AuditLogEntry {
  adminId: string
  adminEmail?: string
  action: AdminAction
  targetType: 'ad' | 'user' | 'setting' | 'system'
  targetId?: string
  details?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

interface StoredAuditLog {
  admin_id: string
  admin_email: string | null
  action: AdminAction
  target_type: string
  target_id: string | null
  details: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  const timestamp = new Date().toISOString()

  try {
    const supabase = await createClient()

    const storedLog: StoredAuditLog = {
      admin_id: entry.adminId,
      admin_email: entry.adminEmail || null,
      action: entry.action,
      target_type: entry.targetType,
      target_id: entry.targetId || null,
      details: entry.details || null,
      ip_address: entry.ipAddress || null,
      user_agent: entry.userAgent || null,
      created_at: timestamp,
    }

    const { error } = await supabase.from('admin_audit_logs').insert(storedLog)

    if (error) {
      logger.error('admin', 'Failed to write audit log to database', {
        error,
        metadata: { entry },
      })
    }
  } catch (err) {
    logger.error('admin', 'Error writing audit log', {
      error: err,
      metadata: { entry },
    })
  }
}

export const auditLogger = {
  log(entry: AuditLogEntry): void {
    logger.info('admin', `Admin action: ${entry.action}`, {
      userId: entry.adminId,
      metadata: {
        targetType: entry.targetType,
        targetId: entry.targetId,
        details: entry.details,
      },
    })

    writeAuditLog(entry).catch(() => {})
  },

  approveAd(adminId: string, adId: string, options?: Partial<AuditLogEntry>): void {
    auditLogger.log({
      adminId,
      action: 'approve_ad',
      targetType: 'ad',
      targetId: adId,
      ...options,
    })
  },

  rejectAd(adminId: string, adId: string, reason?: string, options?: Partial<AuditLogEntry>): void {
    auditLogger.log({
      adminId,
      action: 'reject_ad',
      targetType: 'ad',
      targetId: adId,
      details: { reason },
      ...options,
    })
  },

  deleteAd(adminId: string, adId: string, options?: Partial<AuditLogEntry>): void {
    auditLogger.log({
      adminId,
      action: 'delete_ad',
      targetType: 'ad',
      targetId: adId,
      ...options,
    })
  },

  banUser(adminId: string, userId: string, reason?: string, options?: Partial<AuditLogEntry>): void {
    auditLogger.log({
      adminId,
      action: 'ban_user',
      targetType: 'user',
      targetId: userId,
      details: { reason },
      ...options,
    })
  },

  unbanUser(adminId: string, userId: string, options?: Partial<AuditLogEntry>): void {
    auditLogger.log({
      adminId,
      action: 'unban_user',
      targetType: 'user',
      targetId: userId,
      ...options,
    })
  },

  updateUserCredits(
    adminId: string,
    userId: string,
    previousCredits: number,
    newCredits: number,
    options?: Partial<AuditLogEntry>
  ): void {
    auditLogger.log({
      adminId,
      action: 'update_user_credits',
      targetType: 'user',
      targetId: userId,
      details: { previousCredits, newCredits },
      ...options,
    })
  },

  updateSiteSettings(
    adminId: string,
    settingKey: string,
    previousValue: unknown,
    newValue: unknown,
    options?: Partial<AuditLogEntry>
  ): void {
    auditLogger.log({
      adminId,
      action: 'update_site_settings',
      targetType: 'setting',
      targetId: settingKey,
      details: { previousValue, newValue },
      ...options,
    })
  },

  featureAd(adminId: string, adId: string, options?: Partial<AuditLogEntry>): void {
    auditLogger.log({
      adminId,
      action: 'feature_ad',
      targetType: 'ad',
      targetId: adId,
      ...options,
    })
  },

  unfeatureAd(adminId: string, adId: string, options?: Partial<AuditLogEntry>): void {
    auditLogger.log({
      adminId,
      action: 'unfeature_ad',
      targetType: 'ad',
      targetId: adId,
      ...options,
    })
  },

  deleteUser(adminId: string, userId: string, options?: Partial<AuditLogEntry>): void {
    auditLogger.log({
      adminId,
      action: 'delete_user',
      targetType: 'user',
      targetId: userId,
      ...options,
    })
  },

  grantAdmin(adminId: string, userId: string, options?: Partial<AuditLogEntry>): void {
    auditLogger.log({
      adminId,
      action: 'grant_admin',
      targetType: 'user',
      targetId: userId,
      ...options,
    })
  },

  revokeAdmin(adminId: string, userId: string, options?: Partial<AuditLogEntry>): void {
    auditLogger.log({
      adminId,
      action: 'revoke_admin',
      targetType: 'user',
      targetId: userId,
      ...options,
    })
  },
}

export default auditLogger
