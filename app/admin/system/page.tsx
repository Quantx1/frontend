// ============================================================================
// QUANT X - ADMIN SYSTEM HEALTH PAGE
// System monitoring and health dashboard
// ============================================================================

'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Activity,
  Database,
  Server,
  Wifi,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  Target,
  TrendingUp,
  Globe,
} from '@/lib/icons'
import { SystemHealth } from '@/types/admin'
import { api, handleApiError } from '@/lib/api'

import ManualOperationsPanel from './_components/ManualOperationsPanel'
import GlobalKillSwitchPanel from './_components/GlobalKillSwitchPanel'
import SchedulerJobsPanel from './_components/SchedulerJobsPanel'
import AuditLogPanel from './_components/AuditLogPanel'
import LlmCostPanel from './_components/LlmCostPanel'

export default function AdminSystemPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true)

      const data = await api.admin.getSystemHealth().catch(() => null)
      if (data) {
        setHealth(data as unknown as SystemHealth)
      }
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Failed to fetch health:', err)
      setLastRefresh(new Date())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh, fetchHealth])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'running':
        return <CheckCircle className="w-5 h-5 text-up" />
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-warning" />
      case 'error':
      case 'stopped':
        return <XCircle className="w-5 h-5 text-down" />
      default:
        return <AlertCircle className="w-5 h-5 text-d-text-muted" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'running':
        return 'text-up bg-up/10 border-up/20'
      case 'degraded':
        return 'text-warning bg-warning/10 border-warning/20'
      case 'error':
      case 'stopped':
        return 'text-down bg-down/10 border-down/20'
      default:
        return 'text-d-text-muted bg-white/[0.04] border-d-border'
    }
  }

  if (loading && !health) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="loader-rings"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">System Health</h1>
            <p className="text-d-text-muted mt-1 flex items-center gap-2">
              Real-time system monitoring and status
              <span className="inline-flex items-center gap-1.5 text-up text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-up animate-pulse" />
                Live
              </span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-d-text-muted">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-d-border bg-white/[0.04] text-warning focus:ring-warning"
              />
              Auto-refresh (30s)
            </label>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-d-text-muted ${loading ? 'animate-spin' : ''}`} />
              <span className="text-d-text-muted">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Last Refresh */}
      {lastRefresh && (
        <p className="text-xs text-d-text-muted">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </p>
      )}

      {/* Overall Status */}
      <div>
        <div
          className={`rounded-2xl border p-6 ${getStatusColor(health?.status || 'error')}`}
        >
          <div className="flex items-center gap-4">
            {getStatusIcon(health?.status || 'error')}
            <div>
              <h2 className="text-xl font-bold">System Status: {health?.status?.toUpperCase()}</h2>
              <p className="text-sm opacity-80">
                Last checked: {health?.timestamp ? new Date(health.timestamp).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Service Status Grid */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Database */}
          <div className="glass-card hover:border-primary transition-colors p-6">
            <div className="flex items-center justify-between mb-4">
              <Database className="w-8 h-8 text-primary" />
              {getStatusIcon(health?.database || 'error')}
            </div>
            <h3 className="text-lg font-semibold text-white">Database</h3>
            <p className="text-sm text-d-text-muted mt-1 capitalize">
              {health?.database || 'Unknown'}
            </p>
          </div>

          {/* Redis */}
          <div className="glass-card hover:border-primary transition-colors p-6">
            <div className="flex items-center justify-between mb-4">
              <Server className="w-8 h-8 text-down" />
              {getStatusIcon(health?.redis || 'disabled')}
            </div>
            <h3 className="text-lg font-semibold text-white">Redis</h3>
            <p className="text-sm text-d-text-muted mt-1 capitalize">
              {health?.redis || 'Unknown'}
            </p>
          </div>

          {/* Scheduler */}
          <div className="glass-card hover:border-primary transition-colors p-6">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 text-purple-500" />
              {getStatusIcon(health?.scheduler_status || 'stopped')}
            </div>
            <h3 className="text-lg font-semibold text-white">Scheduler</h3>
            <p className="text-sm text-d-text-muted mt-1 capitalize">
              {health?.scheduler_status || 'Unknown'}
            </p>
            {health?.last_signal_run && (
              <p className="text-xs text-d-text-muted mt-2">
                Last run: {new Date(health.last_signal_run).toLocaleTimeString()}
              </p>
            )}
          </div>

          {/* WebSocket */}
          <div className="glass-card hover:border-primary transition-colors p-6">
            <div className="flex items-center justify-between mb-4">
              <Wifi className="w-8 h-8 text-up" />
              <span className="text-2xl font-bold text-up">
                {health?.active_websocket_connections || 0}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white">WebSocket</h3>
            <p className="text-sm text-d-text-muted mt-1">Active connections</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div>
        <div className="glass-card hover:border-primary transition-colors p-6">
          <h2 className="text-lg font-semibold text-white mb-6">System Metrics</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <p className="text-2xl font-bold text-white">
                {health?.metrics.total_users.toLocaleString() || 0}
              </p>
              <p className="text-sm text-d-text-muted">Total Users</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-up/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-up" />
              </div>
              <p className="text-2xl font-bold text-white">
                {health?.metrics.active_subscribers.toLocaleString() || 0}
              </p>
              <p className="text-sm text-d-text-muted">Active Subscribers</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Target className="w-6 h-6 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-white">
                {health?.metrics.today_signals || 0}
              </p>
              <p className="text-sm text-d-text-muted">Today&apos;s Signals</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-warning/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Activity className="w-6 h-6 text-warning" />
              </div>
              <p className="text-2xl font-bold text-white">
                {health?.metrics.today_trades || 0}
              </p>
              <p className="text-sm text-d-text-muted">Today&apos;s Trades</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-down/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Globe className="w-6 h-6 text-down" />
              </div>
              <p className="text-2xl font-bold text-white">
                {health?.metrics.active_positions || 0}
              </p>
              <p className="text-sm text-d-text-muted">Active Positions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Info */}
      <div>
        <div className="glass-card hover:border-primary transition-colors p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Environment</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/[0.02] rounded-lg">
              <p className="text-sm text-d-text-muted">API URL</p>
              <code className="text-white text-sm">
                {process.env.NEXT_PUBLIC_API_URL || 'Not configured'}
              </code>
            </div>
            <div className="p-4 bg-white/[0.02] rounded-lg">
              <p className="text-sm text-d-text-muted">Environment</p>
              <code className="text-white text-sm">
                {process.env.NODE_ENV || 'development'}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="glass-card hover:border-primary transition-colors p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => window.open('/api/docs', '_blank')}
              className="px-4 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg text-primary text-sm font-medium transition-colors"
            >
              API Documentation
            </button>
            <button
              onClick={() => window.open('/api/health', '_blank')}
              className="px-4 py-2 bg-up/10 hover:bg-up/20 border border-up/20 rounded-lg text-up text-sm font-medium transition-colors"
            >
              Health Endpoint
            </button>
            <button
              onClick={fetchHealth}
              className="px-4 py-2 bg-white/[0.04] hover:bg-white/[0.06] rounded-lg text-d-text-muted text-sm font-medium transition-colors"
            >
              Force Refresh
            </button>
          </div>
        </div>

        {/* PR 47 — N9 Command Center expansions */}
        <div className="mt-6 space-y-6">
          <GlobalKillSwitchPanel />
          <ManualOperationsPanel />
          <LlmCostPanel />
          <SchedulerJobsPanel />
          <AuditLogPanel />
        </div>
      </div>
    </div>
  )
}
