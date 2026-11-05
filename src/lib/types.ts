export type Papel = 'admin' | 'editor' | 'leitor'
export type TipoMembro = 'humano' | 'pet'
export type Sexo = 'feminino' | 'masculino' | 'outro'

export interface Familia {
  id: string
  nome: string
}

export interface Membro {
  id: string
  familia_id: string
  tipo: TipoMembro
  nome: string
  nascimento: string | null
  nascimento_estimado: boolean
  sexo: Sexo | null
  foto_url: string | null
  tipo_sanguineo: string | null
  especie: string | null
  raca: string | null
  cor: string | null
  microchip: string | null
  castrado: boolean | null
  castrado_em: string | null
  peso_atual_kg: number | null
  ativo: boolean
  observacao: string | null
}

export interface FichaSaude {
  id: string
  membro_id: string
  alergias: string[]
  condicoes_cronicas: string[]
  medicamentos_continuos: string[]
  cirurgias: string | null
  historico_familiar: string | null
  cpf: string | null
  cartao_sus: string | null
  convenio: string | null
  carteirinha: string | null
  medicos_referencia: string | null
  contatos_emergencia: string | null
  veterinario_referencia: string | null
  plano_saude_pet: string | null
}

export const TIPOS_SANGUINEOS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

/** Os 7 membros previstos no PLANO.md, oferecidos ao criar a família. */
export const MEMBROS_INICIAIS: Array<Pick<Membro, 'nome' | 'tipo'> & Partial<Membro>> = [
  { nome: 'Carlos', tipo: 'humano', observacao: 'Titular, administrador' },
  { nome: 'Eduarda', tipo: 'humano', sexo: 'feminino', observacao: 'Administradora' },
  { nome: 'Bella', tipo: 'humano', sexo: 'feminino', observacao: 'Bebê: curva de crescimento e calendário vacinal infantil' },
  { nome: 'Adir', tipo: 'humano' },
  { nome: 'Mayta', tipo: 'humano' },
  { nome: 'Chanel', tipo: 'pet', especie: 'Cão', raca: 'Vira-lata' },
  { nome: 'Bartô', tipo: 'pet', especie: 'Gato', observacao: 'Gato dos sogros' },
]

export function idade(nascimento: string | null): string | null {
  if (!nascimento) return null
  const n = new Date(nascimento + 'T00:00:00')
  const hoje = new Date()
  let meses = (hoje.getFullYear() - n.getFullYear()) * 12 + (hoje.getMonth() - n.getMonth())
  if (hoje.getDate() < n.getDate()) meses--
  if (meses < 0) return null
  if (meses < 24) return `${meses} ${meses === 1 ? 'mês' : 'meses'}`
  const anos = Math.floor(meses / 12)
  return `${anos} anos`
}
