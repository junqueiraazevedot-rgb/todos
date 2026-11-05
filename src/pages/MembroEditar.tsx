import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFamilia } from '../lib/familia'
import { supabase } from '../lib/supabase'
import { TIPOS_SANGUINEOS, type FichaSaude, type Membro, type TipoMembro } from '../lib/types'

type Form = Record<string, string | boolean>

const CAMPOS_MEMBRO = [
  'tipo', 'nome', 'nascimento', 'nascimento_estimado', 'sexo', 'foto_url', 'tipo_sanguineo', 'especie', 'raca',
  'cor', 'microchip', 'castrado', 'castrado_em', 'peso_atual_kg', 'observacao',
] as const
const CAMPOS_FICHA_TEXTO = [
  'cirurgias', 'historico_familiar', 'cpf', 'cartao_sus', 'convenio', 'carteirinha', 'medicos_referencia',
  'contatos_emergencia', 'veterinario_referencia', 'plano_saude_pet',
] as const
const CAMPOS_FICHA_LISTA = ['alergias', 'condicoes_cronicas', 'medicamentos_continuos'] as const

const vazio = (v: string | boolean | undefined) => (typeof v === 'string' && v.trim() === '' ? null : v)

function Campo({ id, rotulo, children }: { id: string; rotulo: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="rotulo">{rotulo}</label>
      {children}
    </div>
  )
}

export default function MembroEditar() {
  const { id } = useParams()
  const novo = !id
  const navigate = useNavigate()
  const { familia, papel } = useFamilia()
  const [form, setForm] = useState<Form | null>(novo ? { tipo: 'humano', nome: '', castrado: '' } : null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (novo) return
    supabase
      .from('membros')
      .select('*, fichas_saude(*)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) return setErro(error?.message ?? 'Não encontrado')
        const { fichas_saude: f, ...m } = data as Membro & { fichas_saude: FichaSaude | null }
        const out: Form = {}
        for (const k of CAMPOS_MEMBRO) {
          const v = m[k]
          out[k] = typeof v === 'boolean' ? (k === 'castrado' ? String(v) : v) : v == null ? '' : String(v)
        }
        if (m.castrado == null) out.castrado = ''
        for (const k of CAMPOS_FICHA_TEXTO) out[k] = f?.[k] ?? ''
        for (const k of CAMPOS_FICHA_LISTA) out[k] = (f?.[k] ?? []).join('\n')
        setForm(out)
      })
  }, [id, novo])

  if (!form) return <p className="text-slate-500">{erro ?? 'Carregando…'}</p>

  const set = (k: string) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value })
  const txt = (k: string) => (form[k] as string) ?? ''
  const pet = (form.tipo as TipoMembro) === 'pet'

  async function salvar(e: FormEvent) {
    e.preventDefault()
    if (!familia || !form) return
    setSalvando(true)
    setErro(null)

    const membro: Record<string, unknown> = {}
    for (const k of CAMPOS_MEMBRO) membro[k] = vazio(form[k])
    membro.nascimento_estimado = form.nascimento_estimado === true
    membro.castrado = form.castrado === '' ? null : form.castrado === 'true'
    membro.peso_atual_kg = membro.peso_atual_kg == null ? null : Number(String(membro.peso_atual_kg).replace(',', '.'))

    const ficha: Record<string, unknown> = {}
    for (const k of CAMPOS_FICHA_TEXTO) ficha[k] = vazio(form[k])
    for (const k of CAMPOS_FICHA_LISTA)
      ficha[k] = String(form[k] ?? '')
        .split(/[\n,;]/)
        .map((s) => s.trim())
        .filter(Boolean)

    let membroId = id
    if (novo) {
      const { data, error } = await supabase
        .from('membros')
        .insert({ ...membro, familia_id: familia.id })
        .select('id')
        .single()
      if (error) return falhar(error.message)
      membroId = data.id
    } else {
      const { error } = await supabase.from('membros').update(membro).eq('id', id)
      if (error) return falhar(error.message)
    }
    // A ficha é criada por trigger no insert; aqui só atualizamos.
    const { error: e2 } = await supabase.from('fichas_saude').update(ficha).eq('membro_id', membroId)
    if (e2) return falhar(e2.message)
    navigate(`/familia/${membroId}`, { replace: true })
  }

  function falhar(msg: string) {
    setErro(msg)
    setSalvando(false)
  }

  async function arquivar() {
    if (!confirm('Arquivar este membro? Ele some da lista, mas os dados ficam guardados.')) return
    const { error } = await supabase.from('membros').update({ ativo: false }).eq('id', id)
    if (error) return setErro(error.message)
    navigate('/familia', { replace: true })
  }

  return (
    <section>
      <Link to={novo ? '/familia' : `/familia/${id}`} className="text-sm text-marca-700">← Voltar</Link>
      <h1 className="my-4 text-2xl font-semibold">{novo ? 'Novo membro' : `Editar ${form.nome}`}</h1>

      <form onSubmit={salvar} className="space-y-6">
        <fieldset className="cartao space-y-4">
          <legend className="px-1 font-semibold">Identificação</legend>
          <div className="inline-flex rounded-lg border border-slate-300 p-0.5 text-sm" role="radiogroup">
            {(['humano', 'pet'] as const).map((t) => (
              <button
                type="button"
                key={t}
                role="radio"
                aria-checked={form.tipo === t}
                onClick={() => setForm({ ...form, tipo: t })}
                className={`rounded-md px-4 py-1 ${form.tipo === t ? 'bg-marca-700 text-white' : 'text-slate-600'}`}
              >
                {t === 'humano' ? 'Humano' : 'Pet'}
              </button>
            ))}
          </div>
          <Campo id="nome" rotulo="Nome">
            <input id="nome" required className="campo" value={txt('nome')} onChange={set('nome')} />
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo id="nascimento" rotulo="Nascimento">
              <input id="nascimento" type="date" className="campo" value={txt('nascimento')} onChange={set('nascimento')} />
            </Campo>
            <Campo id="sexo" rotulo="Sexo">
              <select id="sexo" className="campo" value={txt('sexo')} onChange={set('sexo')}>
                <option value="">—</option>
                <option value="feminino">{pet ? 'Fêmea' : 'Feminino'}</option>
                <option value="masculino">{pet ? 'Macho' : 'Masculino'}</option>
                {!pet && <option value="outro">Outro</option>}
              </select>
            </Campo>
          </div>
          {pet && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.nascimento_estimado === true || form.nascimento_estimado === 'true'}
                onChange={(e) => setForm({ ...form, nascimento_estimado: e.target.checked })}
              />
              Data de nascimento estimada
            </label>
          )}
          <Campo id="foto_url" rotulo="Foto (URL)">
            <input id="foto_url" type="url" className="campo" value={txt('foto_url')} onChange={set('foto_url')} placeholder="https://…" />
          </Campo>
        </fieldset>

        {pet ? (
          <fieldset className="cartao space-y-4">
            <legend className="px-1 font-semibold">Dados do pet</legend>
            <div className="grid grid-cols-2 gap-3">
              <Campo id="especie" rotulo="Espécie">
                <input id="especie" list="especies" className="campo" value={txt('especie')} onChange={set('especie')} />
                <datalist id="especies"><option value="Cão" /><option value="Gato" /></datalist>
              </Campo>
              <Campo id="raca" rotulo="Raça">
                <input id="raca" className="campo" value={txt('raca')} onChange={set('raca')} />
              </Campo>
              <Campo id="cor" rotulo="Cor">
                <input id="cor" className="campo" value={txt('cor')} onChange={set('cor')} />
              </Campo>
              <Campo id="peso" rotulo="Peso atual (kg)">
                <input id="peso" inputMode="decimal" className="campo" value={txt('peso_atual_kg')} onChange={set('peso_atual_kg')} />
              </Campo>
              <Campo id="microchip" rotulo="Microchip">
                <input id="microchip" className="campo" value={txt('microchip')} onChange={set('microchip')} />
              </Campo>
              <Campo id="castrado" rotulo="Castrado">
                <select id="castrado" className="campo" value={String(form.castrado ?? '')} onChange={set('castrado')}>
                  <option value="">—</option>
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </select>
              </Campo>
            </div>
            {form.castrado === 'true' && (
              <Campo id="castrado_em" rotulo="Data da castração">
                <input id="castrado_em" type="date" className="campo" value={txt('castrado_em')} onChange={set('castrado_em')} />
              </Campo>
            )}
            <Campo id="vet" rotulo="Veterinário de referência">
              <input id="vet" className="campo" value={txt('veterinario_referencia')} onChange={set('veterinario_referencia')} />
            </Campo>
            <Campo id="plano_pet" rotulo="Plano de saúde pet">
              <input id="plano_pet" className="campo" value={txt('plano_saude_pet')} onChange={set('plano_saude_pet')} />
            </Campo>
          </fieldset>
        ) : (
          <fieldset className="cartao space-y-4">
            <legend className="px-1 font-semibold">Documentos e convênio</legend>
            <div className="grid grid-cols-2 gap-3">
              <Campo id="tipo_sanguineo" rotulo="Tipo sanguíneo">
                <select id="tipo_sanguineo" className="campo" value={txt('tipo_sanguineo')} onChange={set('tipo_sanguineo')}>
                  <option value="">—</option>
                  {TIPOS_SANGUINEOS.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Campo>
              <Campo id="cpf" rotulo="CPF (opcional)">
                <input id="cpf" inputMode="numeric" className="campo" value={txt('cpf')} onChange={set('cpf')} />
              </Campo>
              <Campo id="cartao_sus" rotulo="Cartão SUS">
                <input id="cartao_sus" inputMode="numeric" className="campo" value={txt('cartao_sus')} onChange={set('cartao_sus')} />
              </Campo>
              <Campo id="convenio" rotulo="Convênio">
                <input id="convenio" className="campo" value={txt('convenio')} onChange={set('convenio')} />
              </Campo>
            </div>
            <Campo id="carteirinha" rotulo="Número da carteirinha">
              <input id="carteirinha" className="campo" value={txt('carteirinha')} onChange={set('carteirinha')} />
            </Campo>
            <Campo id="medicos" rotulo="Médicos de referência">
              <textarea id="medicos" rows={2} className="campo" value={txt('medicos_referencia')} onChange={set('medicos_referencia')} />
            </Campo>
            <Campo id="emergencia" rotulo="Contatos de emergência">
              <textarea id="emergencia" rows={2} className="campo" value={txt('contatos_emergencia')} onChange={set('contatos_emergencia')} />
            </Campo>
          </fieldset>
        )}

        <fieldset className="cartao space-y-4">
          <legend className="px-1 font-semibold">Saúde</legend>
          <p className="text-sm text-slate-500">Nas listas, um item por linha.</p>
          <Campo id="alergias" rotulo="Alergias">
            <textarea id="alergias" rows={2} className="campo" value={txt('alergias')} onChange={set('alergias')} />
          </Campo>
          <Campo id="condicoes" rotulo="Condições crônicas">
            <textarea id="condicoes" rows={2} className="campo" value={txt('condicoes_cronicas')} onChange={set('condicoes_cronicas')} />
          </Campo>
          <Campo id="continuos" rotulo="Medicamentos de uso contínuo">
            <textarea id="continuos" rows={2} className="campo" value={txt('medicamentos_continuos')} onChange={set('medicamentos_continuos')} />
          </Campo>
          <Campo id="cirurgias" rotulo="Cirurgias anteriores">
            <textarea id="cirurgias" rows={2} className="campo" value={txt('cirurgias')} onChange={set('cirurgias')} />
          </Campo>
          {!pet && (
            <Campo id="historico" rotulo="Histórico familiar">
              <textarea id="historico" rows={2} className="campo" value={txt('historico_familiar')} onChange={set('historico_familiar')} />
            </Campo>
          )}
          <Campo id="obs" rotulo="Observação">
            <textarea id="obs" rows={2} className="campo" value={txt('observacao')} onChange={set('observacao')} />
          </Campo>
        </fieldset>

        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <div className="flex gap-3">
          <button className="botao flex-1" disabled={salvando}>{salvando ? 'Salvando…' : 'Salvar'}</button>
          {!novo && papel === 'admin' && (
            <button type="button" className="botao-sec text-red-700" onClick={arquivar}>Arquivar</button>
          )}
        </div>
      </form>
    </section>
  )
}
