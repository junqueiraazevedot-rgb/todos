import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { useFamilia } from '../lib/familia'
import { supabase } from '../lib/supabase'
import { idade, type Membro, type TipoMembro } from '../lib/types'

export default function Familia() {
  const { familia, podeEditar } = useFamilia()
  const [membros, setMembros] = useState<Membro[] | null>(null)
  const [filtro, setFiltro] = useState<TipoMembro | 'todos'>('todos')

  useEffect(() => {
    if (!familia) return
    supabase
      .from('membros')
      .select('*')
      .eq('familia_id', familia.id)
      .eq('ativo', true)
      .order('tipo')
      .order('created_at')
      .then(({ data }) => setMembros((data as Membro[]) ?? []))
  }, [familia])

  const lista = (membros ?? []).filter((m) => filtro === 'todos' || m.tipo === filtro)

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{familia?.nome}</h1>
        {podeEditar && (
          <Link to="/familia/novo" className="botao text-sm">
            Novo membro
          </Link>
        )}
      </div>

      <div className="mb-4 inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-sm" role="group">
        {(['todos', 'humano', 'pet'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`rounded-md px-3 py-1 ${filtro === f ? 'bg-marca-700 text-white' : 'text-slate-600'}`}
          >
            {f === 'todos' ? 'Todos' : f === 'humano' ? 'Humanos' : 'Pets'}
          </button>
        ))}
      </div>

      {membros === null ? (
        <p className="text-slate-500">Carregando…</p>
      ) : lista.length === 0 ? (
        <p className="text-slate-500">Nenhum membro cadastrado.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {lista.map((m) => (
            <li key={m.id}>
              <Link to={`/familia/${m.id}`} className="cartao flex items-center gap-3 hover:border-marca-600">
                <Avatar membro={m} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{m.nome}</p>
                  <p className="truncate text-sm text-slate-500">
                    {[m.tipo === 'pet' ? m.especie : null, idade(m.nascimento), m.tipo_sanguineo]
                      .filter(Boolean)
                      .join(' · ') || (m.tipo === 'pet' ? 'Pet' : 'Humano')}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
