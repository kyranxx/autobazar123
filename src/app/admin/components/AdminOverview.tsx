'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { getAdminStats, getRevenueStats, getRecentActivity, type AdminStats, type RevenueStats } from '../actions'

interface Activity {
  type: 'ad' | 'user' | 'payment' | 'sold'
  action: string
  user: string
  time: string
}

function StatCard({ 
  label, 
  value, 
  trend, 
  icon,
  variant = 'default' 
}: { 
  label: string
  value: number | string
  trend?: { value: number; positive: boolean }
  icon: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'accent'
}) {
  const variantStyles = {
    default: 'from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900',
    success: 'from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20',
    warning: 'from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20',
    accent: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20',
  }

  const iconStyles = {
    default: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    success: 'bg-emerald-200 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300',
    warning: 'bg-amber-200 text-amber-700 dark:bg-amber-800 dark:text-amber-300',
    accent: 'bg-orange-200 text-orange-700 dark:bg-orange-800 dark:text-orange-300',
  }

  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${variantStyles[variant]} p-5 border border-border-subtle`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary mb-1">{label}</p>
          <p className="text-3xl font-bold text-text-primary">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trend.positive ? 'text-success' : 'text-error'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d={trend.positive ? "M5 10l7-7m0 0l7 7m-7-7v18" : "M19 14l-7 7m0 0l-7-7m7 7V3"} 
                />
              </svg>
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${iconStyles[variant]}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function RevenueCard({ revenue, loading }: { revenue: RevenueStats; loading: boolean }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Príjmy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i}>
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="p-6 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="flex items-center gap-2 text-white mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold">Príjmy</h3>
        </div>
        <div className="grid grid-cols-3 gap-4 text-white">
          <div>
            <p className="text-white/70 text-sm">Dnes</p>
            <p className="text-2xl font-bold">{revenue.today} €</p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Tento týždeň</p>
            <p className="text-2xl font-bold">{revenue.thisWeek} €</p>
          </div>
          <div>
            <p className="text-white/70 text-sm">Tento mesiac</p>
            <p className="text-2xl font-bold">{revenue.thisMonth} €</p>
          </div>
        </div>
      </div>
      <div className="p-4 bg-background-secondary">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Celkové kredity v systéme</span>
          <Badge variant="accent">{revenue.totalCredits.toLocaleString()} kr</Badge>
        </div>
      </div>
    </Card>
  )
}

function ActivityFeed({ activities, loading }: { activities: Activity[]; loading: boolean }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'ad': return '📝'
      case 'user': return '👤'
      case 'payment': return '💰'
      case 'sold': return '✅'
      default: return '📌'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Posledná aktivita</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10" variant="circular" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Posledná aktivita</CardTitle>
        <Badge variant="default">Živé</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {activities.length === 0 ? (
            <p className="text-text-secondary text-sm py-4 text-center">Žiadna nedávna aktivita</p>
          ) : (
            activities.map((item, i) => (
              <div 
                key={i} 
                className="flex items-center gap-4 py-3 border-b border-border-subtle last:border-0 hover:bg-surface-hover rounded-lg px-2 -mx-2 transition-colors"
              >
                <span className="text-xl w-10 h-10 flex items-center justify-center bg-background-tertiary rounded-full">
                  {getIcon(item.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-text-primary truncate">{item.action}</p>
                  <p className="text-sm text-text-secondary truncate">{item.user}</p>
                </div>
                <span className="text-sm text-text-muted whitespace-nowrap">{item.time}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rýchle akcie</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-tertiary hover:bg-surface-hover transition-colors">
            <div className="p-3 rounded-full bg-accent/10 text-accent">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <span className="text-sm font-medium text-text-primary">Pridať admina</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-tertiary hover:bg-surface-hover transition-colors">
            <div className="p-3 rounded-full bg-success/10 text-success">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-text-primary">Schváliť všetky</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-tertiary hover:bg-surface-hover transition-colors">
            <div className="p-3 rounded-full bg-warning/10 text-warning">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <span className="text-sm font-medium text-text-primary">Obnoviť cache</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-background-tertiary hover:bg-surface-hover transition-colors">
            <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-text-primary">Export dát</span>
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

export function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [revenue, setRevenue] = useState<RevenueStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, revenueData, activityData] = await Promise.all([
          getAdminStats(),
          getRevenueStats(),
          getRecentActivity(),
        ])
        setStats(statsData)
        setRevenue(revenueData)
        
        const formattedActivities: Activity[] = [
          ...activityData.recentAds.map((ad) => {
            const profiles = ad.profiles as { email?: string } | { email?: string }[] | null
            const email = Array.isArray(profiles) ? profiles[0]?.email : profiles?.email
            return {
              type: 'ad' as const,
              action: 'Nový inzerát',
              user: email || 'N/A',
              time: formatTimeAgo(ad.created_at),
            }
          }),
          ...activityData.recentUsers.map((user) => ({
            type: 'user' as const,
            action: 'Nová registrácia',
            user: user.email,
            time: formatTimeAgo(user.created_at),
          })),
        ].sort((a, b) => a.time.localeCompare(b.time)).slice(0, 8)
        
        setActivities(formattedActivities)
      } catch (error) {
        console.error('Failed to fetch admin data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  function formatTimeAgo(dateString: string): string {
    const now = new Date()
    const date = new Date(dateString)
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diff < 60) return 'práve teraz'
    if (diff < 3600) return `${Math.floor(diff / 60)} min`
    if (diff < 86400) return `${Math.floor(diff / 3600)} hod`
    return `${Math.floor(diff / 86400)} dní`
  }

  const defaultStats: AdminStats = {
    totalUsers: 0,
    totalAds: 0,
    activeAds: 0,
    pendingModeration: 0,
    dealerAccounts: 0,
    todayRegistrations: 0,
    todayAds: 0,
    soldToday: 0,
  }

  const defaultRevenue: RevenueStats = {
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    totalCredits: 0,
    stripeRevenue: 0,
  }

  const displayStats = stats || defaultStats
  const displayRevenue = revenue || defaultRevenue

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="p-5 rounded-xl border border-border-subtle">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              label="Používatelia"
              value={displayStats.totalUsers}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>}
            />
            <StatCard
              label="Inzeráty"
              value={displayStats.totalAds}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
            />
            <StatCard
              label="Aktívne"
              value={displayStats.activeAds}
              variant="success"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              label="Čakajúce"
              value={displayStats.pendingModeration}
              variant="warning"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              label="Dealeri"
              value={displayStats.dealerAccounts}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
            />
            <StatCard
              label="Dnes registrovaní"
              value={displayStats.todayRegistrations}
              variant="accent"
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RevenueCard revenue={displayRevenue} loading={loading} />
        <QuickActions />
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        <ActivityFeed activities={activities} loading={loading} />
      </div>
    </div>
  )
}
