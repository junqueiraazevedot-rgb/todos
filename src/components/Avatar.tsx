import type { Membro } from '../lib/types'

export default function Avatar({ membro, grande = false }: { membro: Pick<Membro, 'nome' | 'tipo' | 'foto_url'>; grande?: boolean }) {
  const tam = grande ? 'h-20 w-20 text-2xl' : 'h-12 w-12 text-lg'
  if (membro.foto_url) {
    return <img src={membro.foto_url} alt="" className={`${tam} shrink-0 rounded-full object-cover`} />
  }
  const cor = membro.tipo === 'pet' ? 'bg-amber-100 text-amber-800' : 'bg-marca-100 text-marca-800'
  return (
    <span className={`${tam} ${cor} flex shrink-0 items-center justify-center rounded-full font-semibold`} aria-hidden="true">
      {membro.nome.slice(0, 1).toUpperCase()}
    </span>
  )
}
