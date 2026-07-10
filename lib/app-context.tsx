'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { AppState, Festa, Page } from './types'
import {
  fetchFestas,
  createFesta,
  updateFestaRow,
  deleteFestaRow,
} from './festas-service'

interface AppContextType extends AppState {
  loading: boolean
  error: string | null
  login: (usuario: string, senha: string) => boolean
  logout: () => void
  navigate: (page: Page) => void
  addFesta: (festa: Omit<Festa, 'id' | 'criadoEm'>) => Promise<void>
  updateFesta: (id: string, festa: Omit<Festa, 'id' | 'criadoEm'>) => Promise<void>
  setConcluida: (id: string, concluida: boolean) => Promise<void>
  deleteFesta: (id: string) => Promise<void>
  refreshFestas: () => Promise<void>
  setEditingFesta: (festa: Festa | null) => void
  setViewingFesta: (festa: Festa | null) => void
}

const AppContext = createContext<AppContextType | null>(null)

const AUTH_KEY = 'agenda-agathon-auth'

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [festas, setFestas] = useState<Festa[]>([])
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentPage, setCurrentPage] = useState<Page>('login')
  const [editingFesta, setEditingFesta] = useState<Festa | null>(null)
  const [viewingFesta, setViewingFesta] = useState<Festa | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshFestas = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchFestas()
      setFestas(data)
    } catch (err) {
      console.error('[v0] Erro ao carregar festas:', err)
      setError('Não foi possível carregar as festas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const storedAuth = localStorage.getItem(AUTH_KEY)
    if (storedAuth === 'true') {
      setIsLoggedIn(true)
      setCurrentPage('dashboard')
    }
    setHydrated(true)
    refreshFestas()
  }, [refreshFestas])

  const login = (usuario: string, senha: string): boolean => {
    if (usuario === 'edna' && senha === 'buffetagathon') {
      setIsLoggedIn(true)
      setCurrentPage('dashboard')
      localStorage.setItem(AUTH_KEY, 'true')
      return true
    }
    return false
  }

  const logout = () => {
    setIsLoggedIn(false)
    setCurrentPage('login')
    localStorage.removeItem(AUTH_KEY)
  }

  const navigate = (page: Page) => {
    setCurrentPage(page)
  }

  const addFesta = async (festaData: Omit<Festa, 'id' | 'criadoEm'>) => {
    const nova = await createFesta(festaData)
    setFestas(prev => [...prev, nova])
  }

  const updateFesta = async (id: string, festaData: Omit<Festa, 'id' | 'criadoEm'>) => {
    const atualizada = await updateFestaRow(id, festaData)
    setFestas(prev => prev.map(f => (f.id === id ? atualizada : f)))
  }

  const setConcluida = async (id: string, concluida: boolean) => {
    const festa = festas.find(f => f.id === id)
    if (!festa) return
    const { id: _id, criadoEm: _criadoEm, ...rest } = festa
    const atualizada = await updateFestaRow(id, { ...rest, concluida })
    setFestas(prev => prev.map(f => (f.id === id ? atualizada : f)))
    setViewingFesta(prev => (prev && prev.id === id ? atualizada : prev))
  }

  const deleteFesta = async (id: string) => {
    await deleteFestaRow(id)
    setFestas(prev => prev.filter(f => f.id !== id))
  }

  if (!hydrated) return null

  return (
    <AppContext.Provider
      value={{
        festas,
        isLoggedIn,
        currentPage,
        editingFesta,
        viewingFesta,
        loading,
        error,
        login,
        logout,
        navigate,
        addFesta,
        updateFesta,
        setConcluida,
        deleteFesta,
        refreshFestas,
        setEditingFesta,
        setViewingFesta,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
