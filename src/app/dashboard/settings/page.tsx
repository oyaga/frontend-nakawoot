'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { User, Key, Copy, Check, RefreshCw, Users, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

interface UserProfile {
  id: number
  name: string
  email: string
  role: string | number
}

interface APIKeyInfo {
  account_id: number
  user: {
    id: number
    email: string
    name: string
  }
  id: number
  email: string
  name: string
}

interface Subagent {
  id: number
  name: string
  email: string
  created_at: string
}

interface ServerInfo {
  server_url: string
  webhook_url: string
  api_url: string
  version: string
  name: string
  integration_guide: {
    evolution_webhook: string
    docs: string
  }
  evolution_webhook: string
  docs: string
}

export default function SettingsPage() {
  const [apiKeyInfo, setApiKeyInfo] = useState<APIKeyInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedField, setCopiedField] = useState<string>('')
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null)
  const [persistedLongLivedToken, setPersistedLongLivedToken] = useState<string | null>(null)

  // Profile edit states
  const [profileName, setProfileName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Email change states
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // Subagent management states
  const [subagents, setSubagents] = useState<Subagent[]>([])
  const [loadingSubagents, setLoadingSubagents] = useState(false)
  const [creatingSubagent, setCreatingSubagent] = useState(false)
  const [newSubagentName, setNewSubagentName] = useState('')
  const [newSubagentEmail, setNewSubagentEmail] = useState('')
  const [newSubagentPass, setNewSubagentPass] = useState('')

  // User role state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null)
  const isAdmin = currentUser?.role === 'administrator' || currentUser?.role === 1

  const fetchSubagents = useCallback(async () => {
    if (!isAdmin) return
    
    setLoadingSubagents(true)
    try {
      const response = await api.get('/subagents')
      setSubagents(response.data)
    } catch (error) {
      console.error('Error fetching subagents:', error)
    } finally {
      setLoadingSubagents(false)
    }
  }, [isAdmin])

  useEffect(() => {
    fetchCurrentUser()
    // Carregar token persistido do localStorage
    const savedToken = localStorage.getItem('nakawoot-long-lived-token')
    if (savedToken) {
      setPersistedLongLivedToken(savedToken)
    }
  }, [])

  useEffect(() => {
    if (currentUser && isAdmin) {
      fetchAPIKeys()
      fetchServerInfo()
      fetchSubagents()
    }
  }, [currentUser, isAdmin, fetchSubagents])

  // Set profile name when apiKeyInfo loads (or currentUser)
  useEffect(() => {
    if (currentUser?.name) {
      setProfileName(currentUser.name)
    } else if (apiKeyInfo?.user.name) {
      setProfileName(apiKeyInfo.user.name)
    }
  }, [apiKeyInfo, currentUser])

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/profile/me')
      setCurrentUser(response.data)
    } catch (error) {
      console.error('Error fetching current user:', error)
    } finally {
      setLoading(false)
    }
  }



  const handleCreateSubagent = async () => {
    if (!newSubagentName.trim() || !newSubagentEmail.trim() || !newSubagentPass.trim()) {
      toast.error('Preencha todos os campos')
      return 
    }
    if (newSubagentPass.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres')
      return
    }

    setCreatingSubagent(true)
    try {
      await api.post('/subagents', {
        name: newSubagentName,
        email: newSubagentEmail,
        password: newSubagentPass
      })
      toast.success('Subagente criado com sucesso!')
      setNewSubagentName('')
      setNewSubagentEmail('')
      setNewSubagentPass('')
      fetchSubagents()
    } catch (error: unknown) {
      console.error('Error creating subagent:', error)
      const errorMsg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao criar subagente'
      toast.error(errorMsg)
    } finally {
      setCreatingSubagent(false)
    }
  }

  const handleDeleteSubagent = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este subagente?')) return

    try {
      await api.delete(`/subagents/${id}`)
      toast.success('Subagente removido')
      fetchSubagents()
    } catch (error) {
      console.error('Error deleting subagent:', error)
      toast.error('Erro ao remover subagente')
    }
  }

  // Profile handlers
  const handleUpdateProfile = async () => {
    if (!profileName.trim()) {
      toast.error('Nome não pode estar vazio')
      return
    }
    setSavingProfile(true)
    try {
      await api.put('/profile/me', { name: profileName, display_name: profileName })
      toast.success('Nome atualizado com sucesso!')
      fetchAPIKeys() // Refresh data
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Erro ao atualizar nome')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleUpdateEmail = async () => {
    if (!newEmail.trim() || !emailPassword) {
      toast.error('Preencha todos os campos')
      return
    }
    setSavingEmail(true)
    try {
      await api.put('/profile/email', { email: newEmail, current_password: emailPassword })
      toast.success('Email atualizado com sucesso!')
      setNewEmail('')
      setEmailPassword('')
      fetchAPIKeys() // Refresh data
    } catch (error: unknown) {
      console.error('Error updating email:', error)
      const errorMsg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao atualizar email'
      toast.error(errorMsg)
    } finally {
      setSavingEmail(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não conferem')
      return
    }
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }
    setSavingPassword(true)
    try {
      await api.put('/profile/password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword
      })
      toast.success('Senha alterada com sucesso!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error: unknown) {
      console.error('Error changing password:', error)
      const errorMsg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Erro ao alterar senha'
      toast.error(errorMsg)
    } finally {
      setSavingPassword(false)
    }
  }

  const fetchServerInfo = async () => {
    try {
      const response = await api.get('/server/info')
      setServerInfo(response.data)
    } catch (error) {
      console.error('Error fetching server info:', error)
    }
  }

  const fetchAPIKeys = async () => {
    try {
      const response = await api.get('/api-keys')
      setApiKeyInfo(response.data)
    } catch (error) {
      console.error('Error fetching API keys:', error)
      toast.error('Erro ao carregar informações da API')
    } finally {
      setLoading(false)
    }
  }



  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success('Copiado para área de transferência!')
    setTimeout(() => setCopiedField(''), 2000)
  }

  const generateLongLivedToken = async () => {
    // Se já existe um token persistido, apenas mostrar toast
    if (persistedLongLivedToken) {
      toast.info('Token JWT já existe. Copie-o abaixo.')
      return
    }

    try {
      const response = await api.post('/api-tokens/long-lived')
      const newToken = response.data.token
      // Persistir no localStorage
      localStorage.setItem('nakawoot-long-lived-token', newToken)
      setPersistedLongLivedToken(newToken)
      toast.success('Token JWT gerado e salvo com sucesso!')
    } catch (error) {
      console.error('Error generating long-lived token:', error)
      toast.error('Erro ao gerar token JWT')
    }
  }



  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="text-center py-12">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-8 p-8 bg-background min-h-screen">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Configurações</h1>
        <p className="text-muted-foreground text-lg">Gerencie suas preferências e integrações.</p>
      </div>

      <Tabs defaultValue={isAdmin ? "api" : "profile"} className="space-y-6">
        <TabsList className="bg-muted p-1 border border-border">
          <TabsTrigger value="profile" className="data-[state=active]:bg-secondary">
            <User className="h-4 w-4 mr-2" />
            Perfil
          </TabsTrigger>
          {isAdmin && (
            <>
              <TabsTrigger value="subagents" className="data-[state=active]:bg-secondary">
                <Users className="h-4 w-4 mr-2" />
                Subagentes
              </TabsTrigger>
              <TabsTrigger value="api" className="data-[state=active]:bg-secondary">
                <Key className="h-4 w-4 mr-2" />
                API Keys
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          {/* Card: Alterar Nome */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Alterar Nome</CardTitle>
              <CardDescription className="text-muted-foreground">
                Atualize seu nome de exibição
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="profile-name" className="text-muted-foreground">Nome</Label>
                <Input
                  id="profile-name"
                  placeholder="Seu nome"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                  autoComplete="name"
                />
              </div>
              <Button 
                onClick={handleUpdateProfile}
                disabled={savingProfile}
                className="bg-primary hover:bg-primary/90 text-foreground"
              >
                {savingProfile ? 'Salvando...' : 'Salvar Nome'}
              </Button>
            </CardContent>
          </Card>

          {/* Card: Alterar Email */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Alterar Email</CardTitle>
              <CardDescription className="text-muted-foreground">
                Para alterar seu email, confirme com sua senha atual
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-email" className="text-muted-foreground">Email Atual</Label>
                <Input
                  id="current-email"
                  type="email"
                  disabled
                  value={currentUser?.email || apiKeyInfo?.user.email || ''}
                  className="bg-secondary border-border text-muted-foreground"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-email" className="text-muted-foreground">Novo Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="novo@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email-password" className="text-muted-foreground">Senha Atual (confirmação)</Label>
                <Input
                  id="email-password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                  autoComplete="current-password"
                />
              </div>
              <Button 
                onClick={handleUpdateEmail}
                disabled={savingEmail || !newEmail || !emailPassword}
                className="bg-primary hover:bg-primary/90 text-foreground"
              >
                {savingEmail ? 'Atualizando...' : 'Atualizar Email'}
              </Button>
            </CardContent>
          </Card>

          {/* Card: Alterar Senha */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Alterar Senha</CardTitle>
              <CardDescription className="text-muted-foreground">
                Troque sua senha por uma nova
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="current-password" className="text-muted-foreground">Senha Atual</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="Sua senha atual"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                  autoComplete="current-password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password" className="text-muted-foreground">Nova Senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                  autoComplete="new-password"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password" className="text-muted-foreground">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                  autoComplete="new-password"
                />
              </div>
              <Button 
                onClick={handleChangePassword}
                disabled={savingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="bg-primary hover:bg-primary/90 text-foreground"
              >
                {savingPassword ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
        <TabsContent value="subagents" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Adicionar Subagente</CardTitle>
              <CardDescription className="text-muted-foreground">
                Crie um novo usuário com acesso restrito para sua equipe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="sub-name" className="text-muted-foreground">Nome</Label>
                <Input
                  id="sub-name"
                  placeholder="Nome do subagente"
                  value={newSubagentName}
                  onChange={(e) => setNewSubagentName(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sub-email" className="text-muted-foreground">Email</Label>
                <Input
                  id="sub-email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={newSubagentEmail}
                  onChange={(e) => setNewSubagentEmail(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sub-pass" className="text-muted-foreground">Senha</Label>
                <Input
                  id="sub-pass"
                  type="password"
                  placeholder="Senha de acesso"
                  value={newSubagentPass}
                  onChange={(e) => setNewSubagentPass(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>
              <Button 
                onClick={handleCreateSubagent} 
                disabled={creatingSubagent}
                className="bg-primary hover:bg-primary/90 text-foreground w-full"
              >
                {creatingSubagent ? 'Criando...' : 'Criar Subagente'}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Seus Subagentes</CardTitle>
              <CardDescription className="text-muted-foreground">
                Gerencie os membros da sua equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSubagents ? (
                <div className="text-center py-4 text-muted-foreground">Carregando...</div>
              ) : subagents.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Nenhum subagente encontrado.
                </div>
              ) : (
                <div className="space-y-4">
                  {subagents.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{sub.name}</p>
                          <p className="text-sm text-muted-foreground">{sub.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSubagent(sub.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {isAdmin && (
        <TabsContent value="api" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Credenciais da API</CardTitle>
              <CardDescription className="text-muted-foreground">
                Use estas credenciais para integrar com a API do Mensager
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-muted-foreground">Account ID</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    readOnly
                    value={apiKeyInfo?.account_id || ''}
                    className="bg-secondary border-border text-foreground font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(String(apiKeyInfo?.account_id), 'api_account_id')}
                    className="bg-secondary border-border hover:bg-muted"
                  >
                    {copiedField === 'api_account_id' ? (
                      <Check className="h-4 w-4 text-foreground0" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use este ID para fazer chamadas à API em /api/v1/accounts/:account_id
                </p>
              </div>

              {/* Token JWT de Longa Duração - Seção Fixa */}
              <div className="pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Token JWT Principal</h3>
                    <p className="text-sm text-muted-foreground">Token de longa duração para integrações (validade: 1 ano)</p>
                  </div>
                </div>

                {persistedLongLivedToken ? (
                  <Card className="bg-green-950/20 border-green-500/30">
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-green-300 text-sm">Seu Token JWT (salvo)</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm('Deseja gerar um novo token? O token atual será substituído.')) {
                                localStorage.removeItem('nakawoot-long-lived-token')
                                setPersistedLongLivedToken(null)
                                generateLongLivedToken()
                              }
                            }}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Gerar Novo
                          </Button>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Input
                            readOnly
                            value={persistedLongLivedToken}
                            className="bg-card border-green-500/30 text-foreground font-mono text-xs"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleCopy(persistedLongLivedToken, 'persisted_token')}
                            className="bg-primary border-green-500 hover:bg-primary/90"
                          >
                            {copiedField === 'persisted_token' ? (
                              <Check className="h-4 w-4 text-foreground" />
                            ) : (
                              <Copy className="h-4 w-4 text-foreground" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-green-300/60">
                          Este token está salvo localmente. Use-o para conectar o Evolution-GO Manager.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-secondary border-border">
                    <CardContent className="pt-4 text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        Nenhum token JWT principal gerado ainda.
                      </p>
                      <Button onClick={generateLongLivedToken} className="bg-primary hover:bg-primary/90">
                        <Key className="h-4 w-4 mr-2" />
                        Gerar Token JWT
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </Card>

          {serverInfo && (
            <Card className="bg-linear-to-br from-green-950/20 to-emerald-950/20 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-primary-foreground flex items-center gap-2">
                  <Key className="w-5 h-5 text-foreground0" />
                  Informações do Servidor
                </CardTitle>
                <CardDescription className="text-green-300/70">
                  URLs e endpoints para configurar suas integrações externas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-green-200/70 uppercase tracking-wider">URL Base do Servidor</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 px-3 py-2 bg-background border border-green-500/20 rounded text-sm font-mono text-green-300">
                        {serverInfo.server_url}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-primary hover:bg-primary/90 border-green-500 text-foreground"
                        onClick={() => handleCopy(serverInfo.server_url, 'server_url')}
                      >
                        {copiedField === 'server_url' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-green-200/70 uppercase tracking-wider">API Endpoint</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="flex-1 px-3 py-2 bg-background border border-green-500/20 rounded text-sm font-mono text-green-300">
                        {serverInfo.api_url}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-primary hover:bg-primary/90 border-green-500 text-foreground"
                        onClick={() => handleCopy(serverInfo.api_url, 'api_url')}
                      >
                        {copiedField === 'api_url' ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-green-500/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-200/60">Versão: {serverInfo.version}</span>
                    <Badge variant="outline" className="border-green-500/30 text-primary">
                      {serverInfo.name}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Como usar a API</CardTitle>
              <CardDescription className="text-muted-foreground">
                Exemplos de integração
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Criar Inbox via API</Label>
                <pre className="bg-background border border-border rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-primary">{`curl -X POST ${serverInfo?.api_url || (typeof window !== 'undefined' ? window.location.origin + '/api/v1' : 'http://localhost:4120/api/v1')}/inboxes \\
  -H "Authorization: Bearer SEU_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "WhatsApp Evolution",
    "channel_type": "whatsapp",
    "channel_id": 1
  }'`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
