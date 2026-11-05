import { Link } from 'react-router-dom'
import { useFamilia } from '../lib/familia'

const acoes = [
  { rotulo: 'Fotografar documento', fase: 'Fase 1–2' },
  { rotulo: 'Nova consulta', fase: 'Fase 1' },
  { rotulo: 'Registrar sintoma', fase: 'Fase 4' },
  { rotulo: 'Registrar medida', fase: 'Fase 4' },
  { rotulo: 'Registrar dose', fase: 'Fase 2' },
]

export default function Adicionar() {
  const { podeEditar } = useFamilia()
  return (
    <section>
      <h1 className="mb-4 text-2xl font-semibold">Adicionar</h1>
      <ul className="space-y-2">
        {podeEditar && (
          <li>
            <Link to="/familia/novo" className="cartao flex items-center justify-between hover:border-marca-600">
              <span className="font-medium">Novo membro</span>
              <span aria-hidden="true">→</span>
            </Link>
          </li>
        )}
        {acoes.map((a) => (
          <li key={a.rotulo} className="cartao flex items-center justify-between opacity-60">
            <span className="font-medium">{a.rotulo}</span>
            <span className="text-xs text-slate-500">{a.fase}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
