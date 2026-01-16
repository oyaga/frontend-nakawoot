'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Users, MessageSquare, Clock, Inbox, ArrowUpRight, ArrowDownRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import api from '@/lib/api'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import ConversationChart from '@/components/ConversationChart'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AnimatedCounter } from '@/components/animated-counter'
import {

  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { UserNav } from '@/components/user-nav'
import { useAuthStore } from '@/store/useAuthStore'
import { RefreshCw } from 'lucide-react'

type ResponseTimeSource = 'all' | 'user' | 'evolution'

interface DashboardStats {
  total_inboxes: number
  total_conversations: number
  average_response_time: string
  conversation_trend: string
  inbox_trend: string
  response_time_trend: string
  recent_activity: RecentActivityItem[]
}

interface RecentActivityItem {
  id: number
  name: string
  email: string
  status: string
  type: string
  time: string
  avatar_url?: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [responseTimeSource, setResponseTimeSource] = useState<ResponseTimeSource>('all')
  const { user } = useAuthStore()

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }, [])

  const fetchDashboardStats = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true)
      const response = await api.get<DashboardStats>(`/dashboard/stats?source=${responseTimeSource}`)
      setStats(response.data)
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error('Erro ao carregar estatísticas', {
        description: err.response?.data?.error || 'Tente novamente mais tarde'
      })
    } finally {
      if (!isBackground) setLoading(false)
    }
  }, [responseTimeSource])

  // Carregar stats inicial
  useEffect(() => {
    fetchDashboardStats()
  }, [fetchDashboardStats])

  // Auto-atualizar dashboard via eventos do realtime
  useEffect(() => {
    const handleDashboardUpdate = () => {
      if (!loading) fetchDashboardStats(true)
    }

    window.addEventListener('dashboard-update', handleDashboardUpdate)
    return () => {
      window.removeEventListener('dashboard-update', handleDashboardUpdate)
    }
  }, [fetchDashboardStats, loading])

  const getTrendIcon = (trend: string) => {
    return trend.startsWith('+') || trend.startsWith('-') ? (
      trend.startsWith('+') ? (
        <ArrowUpRight className="h-3 w-3" />
      ) : (
        <ArrowDownRight className="h-3 w-3" />
      )
    ) : null
  }

  const getTrendColor = (trend: string) => {
    if (trend.startsWith('+')) return 'text-primary'
    if (trend.startsWith('-')) return 'text-red-400'
    return 'text-green-200/50'
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-8 bg-background">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-9 w-48 bg-secondary" />
            <Skeleton className="h-4 w-64 mt-2 bg-secondary" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-card border-border">
              <CardHeader>
                <Skeleton className="h-4 w-24 bg-secondary" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 bg-secondary" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <p className="text-green-200/60">Erro ao carregar dados</p>
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Total Inboxes',
      value: stats!.total_inboxes,
      icon: Inbox,
      description: 'Canais ativos',
      trend: stats!.inbox_trend,
    },
    {
      title: 'Conversas',
      value: stats!.total_conversations,
      icon: MessageSquare,
      description: 'Total geral',
      trend: stats!.conversation_trend,
    },
    // Tempo Médio card handled separately
  ]

  return (
    <div className="flex-1 space-y-6 p-8 bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span className="bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              {getGreeting()}, {(user?.user_metadata?.name || user?.email)?.split(' ')[0]}
            </span>
            <span className="text-2xl">👋</span>
          </h2>
          <p className="text-muted-foreground mt-1 text-lg">
            Aqui está o resumo da sua operação hoje.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end mr-2">
             <span className="text-sm font-medium leading-none">{user?.user_metadata?.name || user?.email}</span>
             <span className="text-xs text-muted-foreground capitalize">{user?.user_metadata?.role === 'administrator' ? 'Administrador' : 'Agente'}</span>
          </div>
          <Button
            onClick={() => fetchDashboardStats()}
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 border-border text-foreground hover:bg-secondary hover:text-primary transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <UserNav />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 group shadow-sm hover:shadow-md">
            <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary/80 transition-colors">
                {stat.title}
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold text-foreground tracking-tight">
                <AnimatedCounter value={stat.value} />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded-md bg-background/50 border border-border/50 flex items-center gap-1 ${getTrendColor(stat.trend)}`}>
                  {getTrendIcon(stat.trend)}
                  {stat.trend}
                </span>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Tempo Médio Card Customizado */}
        <Card className="relative overflow-hidden bg-card border-border hover:border-primary/50 transition-all duration-300 group shadow-sm hover:shadow-md">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-primary/80 transition-colors">
              Tempo Médio
            </CardTitle>
            <div className="flex items-center gap-2">
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs border border-border text-muted-foreground hover:text-foreground">
                      {responseTimeSource === 'all' && 'Todos'}
                      {responseTimeSource === 'user' && 'Nakawoot'}
                      {responseTimeSource === 'evolution' && 'Evol.'}
                      <ChevronDown className="ml-1 h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-secondary border-border">
                    <DropdownMenuItem
                      onClick={() => setResponseTimeSource('all')}
                      className="text-foreground"
                    >
                      Todos
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setResponseTimeSource('user')}
                      className="text-foreground"
                    >
                      Nakawoot
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setResponseTimeSource('evolution')}
                      className="text-foreground"
                    >
                      Evolution
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
                <AnimatedCounter value={stats!.average_response_time} />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs font-medium flex items-center gap-1 ${getTrendColor(stats!.response_time_trend)}`}>
                {getTrendIcon(stats!.response_time_trend)}
                {stats!.response_time_trend}
              </span>
              <span className="text-xs text-muted-foreground">Tempo de resposta</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Chart Area */}
        <Card className="col-span-4 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Visão Geral</CardTitle>
            <CardDescription className="text-muted-foreground">
              Conversas nos últimos 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2 min-h-[400px]">
            <ConversationChart />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3 bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Atividade Recente</CardTitle>
            <CardDescription className="text-muted-foreground">
              Últimas atualizações do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recent_activity.length === 0 ? (
              <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground/40">
                <Users className="h-8 w-8 mb-2 text-muted-foreground/50" />
                <p className="text-sm">Nenhuma atividade recente</p>
              </div>
            ) : (
              <div className="space-y-6">
                {stats.recent_activity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={activity.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {activity.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {activity.name}
                      </p>
                      {activity.email && (
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.email}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {activity.status}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border hover:border-green-500/50 transition-colors cursor-pointer group">
          <Link href="/dashboard/conversations">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Ver Conversas</h3>
                  <p className="text-sm text-muted-foreground">Gerencie suas conversas ativas</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="bg-card border-border hover:border-green-500/50 transition-colors cursor-pointer group">
          <Link href="/dashboard/contacts">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Gerenciar Contatos</h3>
                  <p className="text-sm text-muted-foreground">Adicione e edite seus contatos</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="bg-card border-border hover:border-green-500/50 transition-colors cursor-pointer group">
          <Link href="/dashboard/inboxes">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Inbox className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Configurar Inboxes</h3>
                  <p className="text-sm text-muted-foreground">Configure canais de atendimento</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  )
}
