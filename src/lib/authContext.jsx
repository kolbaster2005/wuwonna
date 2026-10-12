import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function signIn(email, password) {
    if (!isSupabaseConfigured) throw new Error('errors.supabaseNotConfigured')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password) {
    if (!isSupabaseConfigured) throw new Error('errors.supabaseNotConfigured')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  async function signOut() {
    if (!isSupabaseConfigured) return
    await supabase.auth.signOut()
  }

  // Роль и подписка — только из app_metadata: его меняет лишь сервер/админ
  // через SQL. user_metadata пользователь может переписать сам одним вызовом
  // supabase.auth.updateUser(), поэтому для прав доступа он не годится.
  // Те же поля проверяют RLS-политики в supabase/admin-policies.sql.
  const isAdmin = user?.app_metadata?.role === 'admin'
  // Подписка PRO. Платёжки пока нет — выдаётся вручную через Supabase (см.
  // README). Админ видит всё, в том числе PRO-пробники.
  const hasPro = isAdmin || user?.app_metadata?.plan === 'pro'

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, isAdmin, hasPro }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
