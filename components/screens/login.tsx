'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useApp } from '@/lib/app-context'

export function LoginScreen() {
  const { login } = useApp()
  const [usuario, setUsuario] = useState('')
  const [senha, setSenha] = useState('')
  const [showSenha, setShowSenha] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    setTimeout(() => {
      const ok = login(usuario, senha)
      if (!ok) setErro('Usuario ou senha invalidos.')
      setLoading(false)
    }, 500)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1154 50%, #1a0a2e 100%)' }}
    >
      {/* Blobs decorativos coloridos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-10 left-10 h-48 w-48 rounded-full opacity-20" style={{ backgroundColor: 'var(--agathon-pink)', filter: 'blur(70px)' }} />
        <div className="absolute top-24 right-16 h-36 w-36 rounded-full opacity-15" style={{ backgroundColor: 'var(--agathon-blue)', filter: 'blur(55px)' }} />
        <div className="absolute bottom-20 left-24 h-40 w-40 rounded-full opacity-15" style={{ backgroundColor: 'var(--agathon-orange)', filter: 'blur(60px)' }} />
        <div className="absolute bottom-16 right-12 h-32 w-32 rounded-full opacity-20" style={{ backgroundColor: 'var(--agathon-purple)', filter: 'blur(50px)' }} />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="rounded-3xl bg-white shadow-2xl overflow-hidden">
          {/* Topo roxo-escuro com logo */}
          <div
            className="flex flex-col items-center justify-center px-8 pt-10 pb-7"
            style={{ background: 'linear-gradient(160deg, #1a0a2e 0%, #2d1154 100%)' }}
          >
            <div
              className="flex h-24 w-24 items-center justify-center rounded-2xl mb-4 shadow-lg"
              style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
            >
              <Image
                src="/logo.png"
                alt="Buffet Agathon"
                width={80}
                height={80}
                priority
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Buffet Agathon</h1>
            <p className="text-sm mt-1 font-medium" style={{ color: 'var(--agathon-gold)' }}>
              Sistema de Agenda de Festas
            </p>

            {/* Faixa de cores da logo */}
            <div className="flex gap-1.5 mt-5">
              {[
                'var(--agathon-pink)',
                'var(--agathon-blue)',
                'var(--agathon-orange)',
                'var(--agathon-green)',
                'var(--agathon-purple)',
                'var(--agathon-gold)',
              ].map((c, i) => (
                <div key={i} className="h-1.5 w-7 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            <div>
              <label htmlFor="usuario" className="block text-sm font-semibold text-foreground mb-1.5">
                Usuario
              </label>
              <input
                id="usuario"
                type="text"
                autoComplete="username"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                placeholder="Digite seu usuario"
                required
                className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition"
                style={{ outlineColor: 'var(--agathon-pink)' }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--agathon-pink)')}
                onBlur={e => (e.currentTarget.style.borderColor = '')}
              />
            </div>

            <div>
              <label htmlFor="senha" className="block text-sm font-semibold text-foreground mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  id="senha"
                  type={showSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="Digite sua senha"
                  required
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition"
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--agathon-pink)')}
                  onBlur={e => (e.currentTarget.style.borderColor = '')}
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {erro && (
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white"
                style={{ backgroundColor: 'var(--agathon-pink)' }}
                role="alert"
              >
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, var(--agathon-pink) 0%, var(--agathon-purple) 100%)',
              }}
            >
              {loading ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <LogIn size={18} />
              )}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          &copy; {new Date().getFullYear()} Buffet Agathon &mdash; Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
