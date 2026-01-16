'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import api from '@/lib/api'
import {
  MessageCircle,
  Instagram,
  Globe,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Trash2,
  Settings,
  Mail,
  Send,
  Copy
} from 'lucide-react'

interface Integration {
  id: number
  provider: string
  status: string
  config: Record<string, unknown>
  created_at: string
}

const PROVIDERS = [
  {
    id: 'web',
    name: 'Website',
    description: 'Widget de chat para seu site.',
    icon: Globe,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Cloud',
    description: 'Conecte via WhatsApp Business API.',
    icon: MessageCircle,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/20',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Conecte seu bot do Telegram.',
    icon: Send,
    color: 'text-sky-500',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  {
    id: 'email',
    name: 'Email',
    description: 'Receba emails como conversas.',
    icon: Mail,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  {
    id: 'instagram',
    name: 'Instagram Direct',
    description: 'Em breve - Requer OAuth Meta.',
    icon: Instagram,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    comingSoon: true,
  },
  {
    id: 'evolution',
    name: 'Evolution API',
    description: 'Conecte instâncias Evolution.',
    icon: LinkIcon,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
  },
]

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(false) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false)
  const [selectedProviderToManage, setSelectedProviderToManage] = useState<string | null>(null)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      setLoading(true)
      const response = await api.get('/integrations')
      setIntegrations(response.data || [])
    } catch (error) {
      console.error('Error fetching integrations:', error)
      toast.error('Erro ao carregar integrações')
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProvider) return

    try {
      setIsSubmitting(true)
      await api.post('/integrations', {
        provider: selectedProvider,
        config: formData 
      })
      toast.success('Integração conectada com sucesso!')
      setIsDialogOpen(false)
      setFormData({})
      fetchIntegrations()
    } catch (error) {
      console.error('Error connecting integration:', error)
      toast.error('Erro ao conectar integração')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover esta integração?')) return

    try {
      await api.delete(`/integrations/${id}`)
      toast.success('Integração removida com sucesso!')
      fetchIntegrations()
    } catch (error) {
      console.error('Error deleting integration:', error)
      toast.error('Erro ao remover integração')
    }
  }

  const getActiveIntegration = (providerId: string) => {
    // Evolution API sends channel.type = "api", so we need to check both
    if (providerId === 'evolution') {
      return integrations.find(i => i.provider === 'evolution' || i.provider === 'api')
    }
    return integrations.find(i => i.provider === providerId)
  }

  // Nova função para pegar TODAS as integrações de um provider
  const getAllIntegrations = (providerId: string): Integration[] => {
    if (providerId === 'evolution') {
      return integrations.filter(i => i.provider === 'evolution' || i.provider === 'api')
    }
    return integrations.filter(i => i.provider === providerId)
  }

  const getWebhookUrl = (providerId: string) => {
    if (typeof window === 'undefined') return ''
    const base = window.location.origin
    return `${base}/api/v1/webhooks/${providerId}/{inbox_id}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado!')
  }

  const renderFormFields = (providerId: string) => {
    switch(providerId) {
      case 'web':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="website_url">URL do Site</Label>
              <Input 
                id="website_url" 
                placeholder="https://seusite.com"
                className="bg-secondary border-border text-foreground" 
                value={formData.website_url || ''}
                onChange={e => setFormData({...formData, website_url: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="widget_color">Cor do Widget</Label>
              <Input 
                id="widget_color" 
                type="color"
                className="bg-secondary border-border text-foreground h-10" 
                value={formData.widget_color || '#22c55e'}
                onChange={e => setFormData({...formData, widget_color: e.target.value})}
              />
            </div>
          </>
        )
      case 'whatsapp':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="phone_number">Número do WhatsApp</Label>
              <Input 
                id="phone_number" 
                placeholder="+5511999999999"
                className="bg-secondary border-border text-foreground" 
                value={formData.phone_number || ''}
                onChange={e => setFormData({...formData, phone_number: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone_number_id">Phone Number ID</Label>
              <Input 
                id="phone_number_id" 
                className="bg-secondary border-border text-foreground" 
                value={formData.phone_number_id || ''}
                onChange={e => setFormData({...formData, phone_number_id: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="access_token">Access Token</Label>
              <Input 
                id="access_token" 
                type="password"
                className="bg-secondary border-border text-foreground" 
                value={formData.access_token || ''}
                onChange={e => setFormData({...formData, access_token: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business_account_id">WABA ID</Label>
              <Input 
                id="business_account_id" 
                className="bg-secondary border-border text-foreground" 
                value={formData.business_account_id || ''}
                onChange={e => setFormData({...formData, business_account_id: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2 pt-4 border-t border-border">
              <Label>Webhook URL (Configure no Meta)</Label>
              <div className="flex gap-2">
                <Input 
                  readOnly
                  className="bg-muted border-border text-muted-foreground font-mono text-xs" 
                  value={getWebhookUrl('whatsapp')}
                />
                <Button type="button" variant="outline" size="icon" onClick={() => copyToClipboard(getWebhookUrl('whatsapp'))}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )
      case 'telegram':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="bot_token">Bot Token</Label>
              <Input 
                id="bot_token" 
                placeholder="123456789:ABCdefGHI..."
                className="bg-secondary border-border text-foreground" 
                value={formData.bot_token || ''}
                onChange={e => setFormData({...formData, bot_token: e.target.value})}
                required
              />
              <p className="text-xs text-muted-foreground">Obtenha do @BotFather no Telegram</p>
            </div>
          </>
        )
      case 'email':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="email_address">Endereço de Email</Label>
              <Input 
                id="email_address" 
                type="email"
                placeholder="suporte@empresa.com"
                className="bg-secondary border-border text-foreground" 
                value={formData.email_address || ''}
                onChange={e => setFormData({...formData, email_address: e.target.value})}
                required
              />
              <p className="text-xs text-muted-foreground">Emails enviados para este endereço serão recebidos como conversas</p>
            </div>
          </>
        )
      case 'evolution':
        return (
          <>
             <div className="space-y-2">
              <Label htmlFor="instance_name">Nome da Instância</Label>
              <Input 
                id="instance_name" 
                className="bg-secondary border-border text-foreground" 
                value={formData.instance_name || ''}
                onChange={e => setFormData({...formData, instance_name: e.target.value})}
                required
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="api_key">API Key (Token)</Label>
              <Input 
                id="api_key" 
                type="password"
                className="bg-secondary border-border text-foreground" 
                value={formData.api_key || ''}
                onChange={e => setFormData({...formData, api_key: e.target.value})}
                required
              />
            </div>
          </>
        )
      case 'instagram':
        return (
          <div className="text-center py-8">
            <Instagram className="h-12 w-12 mx-auto text-pink-500 mb-4" />
            <p className="text-muted-foreground">Integração Instagram requer OAuth com Meta.</p>
            <p className="text-sm text-muted-foreground mt-2">Em breve disponível.</p>
          </div>
        )
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor="api_key">Token / API Key</Label>
            <Input 
              id="api_key" 
              type="password"
              className="bg-secondary border-border text-foreground" 
              value={formData.api_key || ''}
              onChange={e => setFormData({...formData, api_key: e.target.value})}
              required
            />
          </div>
        )
    }
  }

  return (
    <div className="flex-1 space-y-8 p-8 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Integrações</h1>
          <p className="text-muted-foreground text-lg">Conecte seus canais de comunicação favoritos.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {PROVIDERS.map((provider) => {
          const activeIntegration = getActiveIntegration(provider.id)
          const allProviderIntegrations = getAllIntegrations(provider.id)
          const isConnected = !!activeIntegration && (activeIntegration.status === 'connected' || activeIntegration.status === 'active')
          const hasMultipleInstances = allProviderIntegrations.length > 1
          const Icon = provider.icon

          return (
            <Card key={provider.id} className="bg-card border-border hover:border-primary/50 hover:bg-secondary/50 transition-all duration-300 backdrop-blur-sm group shadow-sm hover:shadow-md">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${provider.bg} ${provider.border} border shadow-lg`}>
                    <Icon className={`h-8 w-8 ${provider.color}`} />
                  </div>
                  {activeIntegration && (
                    isConnected ? (
                      <div className="flex gap-2">
                        <Badge className="bg-primary/10 text-foreground0 border-green-500/20 hover:bg-primary/20">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Conectado
                        </Badge>
                        {hasMultipleInstances && (
                          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
                            {allProviderIntegrations.length}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20">
                        <AlertCircle className="w-3 h-3 mr-1" /> Aguardando Conexão
                      </Badge>
                    )
                  )}
                </div>
                <div className="mt-4">
                  <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {provider.name}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    {provider.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {isConnected ? (
                   <div className="flex items-center justify-between pt-4 border-t border-border/50">
                      <div className="text-sm text-muted-foreground">
                        {hasMultipleInstances ? `${allProviderIntegrations.length} instâncias` : `ID: ${activeIntegration.id}`}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setSelectedProviderToManage(provider.id)
                          setIsManageDialogOpen(true)
                        }}
                      >
                        <Settings className="w-4 h-4 mr-2" /> Gerenciar
                      </Button>
                   </div>
                ) : (
                  <Dialog open={isDialogOpen && selectedProvider === provider.id} onOpenChange={(open) => {
                    setIsDialogOpen(open)
                    if (!open) setSelectedProvider(null)
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border-0"
                        onClick={() => {
                          setSelectedProvider(provider.id)
                          setFormData({})
                        }}
                      >
                        Conectar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border text-foreground">
                      <DialogHeader>
                        <DialogTitle>Conectar {provider.name}</DialogTitle>
                        <DialogDescription>
                          Preencha as informações abaixo para estabelecer a conexão.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleConnect} className="space-y-4 mt-4">
                        {renderFormFields(provider.id)}
                        <div className="flex justify-end gap-3 pt-4">
                          <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                          <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                            {isSubmitting ? 'Conectando...' : 'Salvar Conexão'}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal de Gerenciamento de Instâncias */}
      <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Instâncias</DialogTitle>
            <DialogDescription>
              Gerencie suas instâncias conectadas. Você pode remover instâncias individualmente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4 max-h-96 overflow-y-auto">
            {selectedProviderToManage && getAllIntegrations(selectedProviderToManage).map((integration) => {
              const isActive = integration.status === 'connected' || integration.status === 'active'
              const instanceName = String(integration.config?.instance_name || integration.config?.instanceName || `Instância ${integration.id}`)

              return (
                <div key={integration.id} className="flex items-center justify-between p-4 bg-secondary border border-border rounded-lg hover:border-primary/50 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-primary' : 'bg-yellow-500'}`} />
                    <div className="flex-1">
                      <div className="font-medium text-foreground">{instanceName}</div>
                      <div className="text-xs text-muted-foreground">ID: {integration.id}</div>
                    </div>
                    <Badge className={isActive ? 'bg-primary/10 text-foreground0 border-green-500/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'}>
                      {isActive ? 'Conectado' : 'Aguardando'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-4"
                    onClick={() => {
                      if (confirm(`Tem certeza que deseja remover a instância "${instanceName}"?`)) {
                        handleDelete(integration.id)
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )
            })}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setIsManageDialogOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}