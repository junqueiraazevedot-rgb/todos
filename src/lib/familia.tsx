import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './auth'
import { supabase } from './supabase'
import type { Familia, Papel } from './types'

interface FamiliaCtx {
  familia: Familia | null
  papel: Papel | null
  podeEditar: boolean
  carregando: boolean
  recarregar: () => Promise<void>
}

const Ctx = createContext<FamiliaCtx | null>(null)

export function FamiliaProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const [familia, setFamilia] = useState<Familia | null>(null)
  const [papel, setPapel] = useState<Papel | null>(null)
  const [carregando, setCarregando] = useState(true)

  const recarregar = useCallback(async () => {
    if (!session) {
      setFamilia(null)
      setPapel(null)
      setCarregando(false)
      return
    }
    setCarregando(true)
    const { data, error } = await supabase
      .from('usuarios_familia')
      .select('papel, familias(id, nome)')
      .eq('user_id', session.user.id)
      .order('created_at')
      .limit(1)
      .maybeSingle()
    if (error) console.error(error)
    const f = (data?.familias ?? null) as unknown as Familia | null
    setFamilia(f)
    setPapel((data?.papel as Papel) ?? null)
    setCarregando(false)
  }, [session])

  useEffect(() => {
    void recarregar()
  }, [recarregar])

  const podeEditar = papel === 'admin' || papel === 'editor'

  return (
    <Ctx.Provider value={{ familia, papel, podeEditar, carregando, recarregar }}>{children}</Ctx.Provider>
  )
}

export function useFamilia() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useFamilia fora do FamiliaProvider')
  return c
}
