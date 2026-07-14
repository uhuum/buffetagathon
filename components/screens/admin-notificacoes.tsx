'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Bell,
  Smartphone,
  Trash2,
  Send,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Monitor,
  Tablet,
} from 'lucide-react'
import { DeviceToken, fetchDeviceTokensAdmin, removeDeviceToken } from '@/lib/device-tokens-service'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function DeviceIcon({ deviceName }: { deviceName: string | null }) {
  const name = (deviceName ?? '').toLowerCase()
  if (name.includes('android') || name.includes('ios')) return <Smartphone size={16} />
  if (name.includes('tablet') || name.includes('ipad')) return <Tablet size={16} />
  return <Monitor size={16} />
}

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR })
  } catch {
    return 'data inválida'
  }
}

// Considera token válido se acessado nas últimas 4 semanas
function isTokenValid(token: DeviceToken) {
  if (!token.is_active) return false
  const lastSeen = new Date(token.last_seen)
  const diff = Date.now() - lastSeen.getTime()
  return diff < 1000 * 60 * 60 * 24 * 28 // 28 dias
}

export function AdminNotificacoesScreen() {
  const [tokens, setTokens] = useState<DeviceToken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Formulário de envio manual
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sendTarget, setSendTarget] = useState<string | null>(null) // null = todos
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchDeviceTokensAdmin()
      setTokens(data)
    } catch (err) {
      setError('Erro ao carregar dispositivos.')
      console.error('[AdminNotificacoes] Erro:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleRemove = async (id: string) => {
    if (!confirm('Remover este token?')) return
    try {
      await removeDeviceToken(id)
      setTokens((prev) => prev.filter((t) => t.id !== id))
    } catch {
      alert('Erro ao remover token.')
    }
  }

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setSendResult('Preencha o título e a mensagem.')
      return
    }
    setSending(true)
    setSendResult(null)
    try {
      if (sendTarget) {
        // Enviar para um token específico
        const res = await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: sendTarget, title, body: message }),
        })
        const json = await res.json()
        setSendResult(json.success ? 'Notificação enviada com sucesso!' : `Erro: ${json.message}`)
      } else {
        // Enviar para todos
        const res = await fetch('/api/notifications/send-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body: message }),
        })
        const json = await res.json()
        setSendResult(
          json.success
            ? `Enviado para ${json.sent} dispositivo${json.sent !== 1 ? 's' : ''}${json.failed > 0 ? ` (${json.failed} falha${json.failed !== 1 ? 's' : ''})` : ''}.`
            : `Erro: ${json.message}`,
        )
      }
      setTitle('')
      setMessage('')
      setSendTarget(null)
      load()
    } catch (err) {
      setSendResult('Erro ao enviar. Tente novamente.')
      console.error('[AdminNotificacoes] Erro ao enviar:', err)
    } finally {
      setSending(false)
    }
  }

  const totalAtivos = tokens.filter((t) => t.is_active).length
  const totalValidos = tokens.filter(isTokenValid).length

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-8">
      {/* Cabeçalho */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-border bg-primary/5">
          <Bell className="text-primary" size={20} />
          <h2 className="font-semibold text-foreground">Administração de Notificações</h2>
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{tokens.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{totalAtivos}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Ativos</p>
          </div>
          <div className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{totalValidos}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Válidos</p>
          </div>
        </div>
      </div>

      {/* Enviar notificação */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-border bg-primary/5">
          <Send className="text-primary" size={18} />
          <h3 className="font-semibold text-foreground text-sm">Enviar Notificação</h3>
        </div>
        <div className="p-4 space-y-3">
          {sendTarget && (
            <div className="flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2">
              <span className="text-xs text-primary font-medium">
                Destinatário: {tokens.find((t) => t.token === sendTarget)?.device_name ?? 'Dispositivo'} —{' '}
                {tokens.find((t) => t.token === sendTarget)?.browser ?? ''}
              </span>
              <button
                className="text-xs text-muted-foreground underline"
                onClick={() => setSendTarget(null)}
              >
                Enviar para todos
              </button>
            </div>
          )}

          <input
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Título da notificação"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            placeholder="Mensagem da notificação"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          {sendResult && (
            <p
              className={`text-sm rounded-lg px-3 py-2 ${
                sendResult.includes('Erro') || sendResult.includes('Preencha')
                  ? 'bg-destructive/10 text-destructive'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {sendResult}
            </p>
          )}

          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60 transition-opacity"
          >
            {sending ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {sending
              ? 'Enviando...'
              : sendTarget
                ? 'Enviar para este dispositivo'
                : 'Enviar para todos'}
          </button>
        </div>
      </div>

      {/* Lista de dispositivos */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border bg-primary/5">
          <div className="flex items-center gap-3">
            <Smartphone className="text-primary" size={18} />
            <h3 className="font-semibold text-foreground text-sm">Dispositivos Registrados</h3>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>

        {error && (
          <div className="p-4 text-sm text-destructive bg-destructive/5 text-center">{error}</div>
        )}

        {loading && !error && (
          <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>
        )}

        {!loading && !error && tokens.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum dispositivo registrado ainda.
          </div>
        )}

        {!loading && tokens.length > 0 && (
          <ul className="divide-y divide-border">
            {tokens.map((token) => {
              const valid = isTokenValid(token)
              return (
                <li
                  key={token.id}
                  className="flex items-start gap-3 p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="mt-0.5 text-muted-foreground">
                    <DeviceIcon deviceName={token.device_name} />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">
                        {token.device_name ?? 'Dispositivo desconhecido'}
                      </span>
                      {token.browser && (
                        <span className="text-xs bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                          {token.browser}
                        </span>
                      )}
                      <span
                        className={`flex items-center gap-1 text-xs ${
                          valid ? 'text-green-600' : 'text-destructive'
                        }`}
                      >
                        {valid ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {valid ? 'Válido' : 'Inválido'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock size={11} />
                      Último acesso: {timeAgo(token.last_seen)}
                    </div>

                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      {token.token.slice(0, 40)}...
                    </p>
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => setSendTarget(token.token)}
                      title="Enviar notificação de teste"
                      className="flex items-center gap-1 text-xs text-primary hover:bg-primary/10 rounded-lg px-2 py-1 transition-colors"
                    >
                      <Bell size={13} />
                      Testar
                    </button>
                    <button
                      onClick={() => handleRemove(token.id)}
                      title="Remover token"
                      className="flex items-center gap-1 text-xs text-destructive hover:bg-destructive/10 rounded-lg px-2 py-1 transition-colors"
                    >
                      <Trash2 size={13} />
                      Remover
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
