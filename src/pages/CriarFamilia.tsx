import { useState, type FormEvent } from 'react'
import { useAuth } from '../lib/auth'
import { useFamilia } from '../lib/familia'
import { supabase } from '../lib/supabase'
import { MEMBROS_INICIAIS } from '../lib/types'

export default function CriarFamilia() {
  const { session, sair } = useAuth()
  const { recarregar } = useFamilia()
  const [nome, setNome] = useState('Família')
  const [selecionados, setSelecionados] = useState<boolean[]>(MEMBROS_INICIAIS.map(() => true))
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  async function criar(e: FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro(null)
    const { data: familiaId, error } = await supabase.rpc('criar_familia', { p_nome: nome.trim() })
    if (error) {
      setErro(error.message)
      setSalvando(false)
      return
    }
    const membros = MEMBROS_INICIAIS.filter((_, i) => selecionados[i]).map((m) => ({ ...m, familia_id: familiaId }))
    if (membros.length) {
      const { error: e2 } = await supabase.from('membros').insert(membros)
      if (e2) setErro(e2.message)
    }
    await recarregar()
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-1 text-2xl font-semibold">Bem-vindo</h1>
      <p className="mb-6 text-slate-500">
        {session?.user.email} ainda não faz parte de nenhuma família. Crie a sua, ou peça a um administrador para
        adicionar este e-mail.
      </p>
      <form onSubmit={criar} className="cartao space-y-5">
        <div>
          <label htmlFor="nome" className="rotulo">Nome da família</label>
          <input id="nome" required className="campo" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>
        <fieldset>
          <legend className="rotulo">Cadastrar já estes membros (dá para editar depois)</legend>
          <ul className="space-y-1">
            {MEMBROS_INICIAIS.map((m, i) => (
              <li key={m.nome}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selecionados[i]}
                    onChange={(e) => setSelecionados((s) => s.map((v, j) => (j === i ? e.target.checked : v)))}
                  />
                  <span>{m.nome}</span>
                  <span className="text-sm text-slate-500">{m.tipo === 'pet' ? m.especie : 'Humano'}</span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <button className="botao w-full" disabled={salvando}>
          {salvando ? 'Criando…' : 'Criar família'}
        </button>
      </form>
      <button className="mt-6 w-full text-sm text-slate-500 underline" onClick={sair}>
        Sair
      </button>
    </div>
  )
}
