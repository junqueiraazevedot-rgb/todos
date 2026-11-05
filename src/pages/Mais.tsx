import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'
import { useFamilia } from '../lib/familia'
import { supabase } from '../lib/supabase'
import type { Papel } from '../lib/types'

interface UsuarioFamilia {
  id: string
  user_id: string
  email: string
  papel: Papel
}

const PAPEIS: Record<Papel, string> = { admin: 'Administrador', editor: 'Editor', leitor: 'Leitor' }

export default function Mais() {
  const { session, sair } = useAuth()
  const { familia, papel } = useFamilia()
  const [usuarios, setUsuarios] = useState<UsuarioFamilia[]>([])
  const [email, setEmail] = useState('')
  const [novoPapel, setNovoPapel] = useState<Papel>('leitor')
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const admin = papel === 'admin'

  const carregar = useCallback(async () => {
    if (!familia) return
    const { data } = await supabase.rpc('listar_usuarios_familia', { p_familia_id: familia.id })
    setUsuarios((data as UsuarioFamilia[]) ?? [])
  }, [familia])

  useEffect(() => {
    void carregar()
  }, [carregar])

  async function adicionar(e: FormEvent) {
    e.preventDefault()
    if (!familia) return
    setMsg(null)
    const { error } = await supabase.rpc('adicionar_usuario_familia', {
      p_familia_id: familia.id,
      p_email: email,
      p_papel: novoPapel,
    })
    if (error) return setMsg({ tipo: 'erro', texto: error.message })
    setMsg({ tipo: 'ok', texto: `${email} adicionado.` })
    setEmail('')
    void carregar()
  }

  async function mudarPapel(u: UsuarioFamilia, p: Papel) {
    const { error } = await supabase.from('usuarios_familia').update({ papel: p }).eq('id', u.id)
    if (error) setMsg({ tipo: 'erro', texto: error.message })
    void carregar()
  }

  async function remover(u: UsuarioFamilia) {
    if (!confirm(`Remover o acesso de ${u.email}?`)) return
    const { error } = await supabase.from('usuarios_familia').delete().eq('id', u.id)
    if (error) setMsg({ tipo: 'erro', texto: error.message })
    void carregar()
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Mais</h1>

      <div className="cartao">
        <h2 className="mb-3 font-semibold">Usuários da família</h2>
        <ul className="divide-y divide-slate-100">
          {usuarios.map((u) => (
            <li key={u.id} className="flex items-center gap-2 py-2">
              <span className="min-w-0 flex-1 truncate">
                {u.email}
                {u.user_id === session?.user.id && <span className="text-slate-500"> (você)</span>}
              </span>
              {admin && u.user_id !== session?.user.id ? (
                <>
                  <select
                    aria-label={`Papel de ${u.email}`}
                    className="rounded border border-slate-300 px-2 py-1 text-sm"
                    value={u.papel}
                    onChange={(e) => mudarPapel(u, e.target.value as Papel)}
                  >
                    {Object.entries(PAPEIS).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
                  </select>
                  <button className="text-sm text-red-700" onClick={() => remover(u)}>Remover</button>
                </>
              ) : (
                <span className="text-sm text-slate-500">{PAPEIS[u.papel]}</span>
              )}
            </li>
          ))}
        </ul>

        {admin && (
          <form onSubmit={adicionar} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-500">
              A pessoa precisa ter entrado no app pelo menos uma vez com este e-mail.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                required
                aria-label="E-mail"
                placeholder="e-mail"
                className="campo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <select
                aria-label="Papel"
                className="rounded-lg border border-slate-300 px-2"
                value={novoPapel}
                onChange={(e) => setNovoPapel(e.target.value as Papel)}
              >
                {Object.entries(PAPEIS).map(([v, r]) => <option key={v} value={v}>{r}</option>)}
              </select>
            </div>
            <button className="botao w-full">Dar acesso</button>
          </form>
        )}
        {msg && <p className={`mt-2 text-sm ${msg.tipo === 'erro' ? 'text-red-600' : 'text-marca-700'}`}>{msg.texto}</p>}
      </div>

      <div className="cartao">
        <h2 className="mb-2 font-semibold">Em breve</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Importar histórico (Fase 3)</li>
          <li>Catálogo de parâmetros (Fase 3)</li>
          <li>Profissionais e locais (Fase 1)</li>
          <li>Financeiro / IR (Fase 4)</li>
          <li>Conectar Google e notificações (Fases 1–2)</li>
        </ul>
      </div>

      <button className="botao-sec w-full" onClick={sair}>Sair ({session?.user.email})</button>
    </section>
  )
}
