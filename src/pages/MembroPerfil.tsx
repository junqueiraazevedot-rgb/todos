import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../components/Avatar'
import { useFamilia } from '../lib/familia'
import { supabase } from '../lib/supabase'
import { idade, type FichaSaude, type Membro } from '../lib/types'

type MembroComFicha = Membro & { fichas_saude: FichaSaude | null }

const SEXO: Record<string, string> = { feminino: 'Feminino', masculino: 'Masculino', outro: 'Outro' }

function dataBR(d: string | null) {
  return d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : null
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string | null | undefined }) {
  if (!valor) return null
  return (
    <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm text-slate-500">{rotulo}</dt>
      <dd className="whitespace-pre-line sm:col-span-2">{valor}</dd>
    </div>
  )
}

const lista = (v: string[] | undefined) => (v && v.length ? v.join(', ') : null)

export default function MembroPerfil() {
  const { id } = useParams()
  const { podeEditar } = useFamilia()
  const [m, setM] = useState<MembroComFicha | null | undefined>(undefined)

  useEffect(() => {
    supabase
      .from('membros')
      .select('*, fichas_saude(*)')
      .eq('id', id!)
      .maybeSingle()
      .then(({ data }) => setM(data as MembroComFicha | null))
  }, [id])

  if (m === undefined) return <p className="text-slate-500">Carregando…</p>
  if (m === null) return <p>Membro não encontrado.</p>

  const f = m.fichas_saude
  const pet = m.tipo === 'pet'

  return (
    <section>
      <Link to="/familia" className="text-sm text-marca-700">← Família</Link>
      <div className="my-4 flex items-center gap-4">
        <Avatar membro={m} grande />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-semibold">{m.nome}</h1>
          <p className="text-slate-500">
            {[pet ? m.especie : 'Humano', idade(m.nascimento)].filter(Boolean).join(' · ')}
          </p>
        </div>
        {podeEditar && (
          <Link to={`/familia/${m.id}/editar`} className="botao-sec text-sm">Editar</Link>
        )}
      </div>

      <h2 className="mb-2 font-semibold">Resumo</h2>
      <dl className="cartao divide-y divide-slate-100">
        <Linha rotulo="Nascimento" valor={dataBR(m.nascimento) && `${dataBR(m.nascimento)}${m.nascimento_estimado ? ' (estimada)' : ''}`} />
        <Linha rotulo="Sexo" valor={m.sexo ? SEXO[m.sexo] : null} />
        {!pet && <Linha rotulo="Tipo sanguíneo" valor={m.tipo_sanguineo} />}
        {pet && (
          <>
            <Linha rotulo="Raça" valor={m.raca} />
            <Linha rotulo="Cor" valor={m.cor} />
            <Linha rotulo="Microchip" valor={m.microchip} />
            <Linha
              rotulo="Castrado"
              valor={m.castrado == null ? null : m.castrado ? `Sim${m.castrado_em ? ` (${dataBR(m.castrado_em)})` : ''}` : 'Não'}
            />
            <Linha rotulo="Peso atual" valor={m.peso_atual_kg != null ? `${m.peso_atual_kg} kg` : null} />
          </>
        )}
        <Linha rotulo="Alergias" valor={lista(f?.alergias)} />
        <Linha rotulo="Condições crônicas" valor={lista(f?.condicoes_cronicas)} />
        <Linha rotulo="Uso contínuo" valor={lista(f?.medicamentos_continuos)} />
        <Linha rotulo="Cirurgias anteriores" valor={f?.cirurgias} />
        {!pet && (
          <>
            <Linha rotulo="Histórico familiar" valor={f?.historico_familiar} />
            <Linha rotulo="Convênio" valor={[f?.convenio, f?.carteirinha].filter(Boolean).join(' · ') || null} />
            <Linha rotulo="Cartão SUS" valor={f?.cartao_sus} />
            <Linha rotulo="CPF" valor={f?.cpf} />
            <Linha rotulo="Médicos de referência" valor={f?.medicos_referencia} />
            <Linha rotulo="Contatos de emergência" valor={f?.contatos_emergencia} />
          </>
        )}
        {pet && (
          <>
            <Linha rotulo="Veterinário" valor={f?.veterinario_referencia} />
            <Linha rotulo="Plano de saúde pet" valor={f?.plano_saude_pet} />
          </>
        )}
        <Linha rotulo="Observação" valor={m.observacao} />
      </dl>

      <p className="mt-6 text-sm text-slate-500">
        Linha do tempo, consultas, medicamentos, exames e vacinas chegam nas próximas fases.
      </p>
    </section>
  )
}
