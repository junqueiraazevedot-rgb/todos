import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useFamilia } from '../lib/familia'

export default function Inicio() {
  const { session } = useAuth()
  const { familia } = useFamilia()
  const hoje = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <section>
      <p className="text-sm capitalize text-slate-500">{hoje}</p>
      <h1 className="mb-4 text-2xl font-semibold">Olá{session?.user.email ? `, ${session.user.email.split('@')[0]}` : ''}</h1>

      <div className="cartao mb-4">
        <h2 className="mb-1 font-semibold">Pendências</h2>
        <p className="text-sm text-slate-500">
          Nenhuma pendência ainda. Consultas a encerrar, retornos, exames e revisões da IA aparecem aqui a partir da Fase 1.
        </p>
      </div>

      <div className="cartao mb-4">
        <h2 className="mb-1 font-semibold">Doses de hoje</h2>
        <p className="text-sm text-slate-500">Os lembretes de medicamentos chegam na Fase 2.</p>
      </div>

      <Link to="/familia" className="cartao block hover:border-marca-600">
        <h2 className="font-semibold">{familia?.nome}</h2>
        <p className="text-sm text-slate-500">Ver membros e fichas de saúde →</p>
      </Link>
    </section>
  )
}
