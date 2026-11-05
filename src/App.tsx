import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Carregando from './components/Carregando'
import { useAuth } from './lib/auth'
import { useFamilia } from './lib/familia'
import Adicionar from './pages/Adicionar'
import Agenda from './pages/Agenda'
import CriarFamilia from './pages/CriarFamilia'
import Familia from './pages/Familia'
import Inicio from './pages/Inicio'
import Login from './pages/Login'
import Mais from './pages/Mais'
import MembroEditar from './pages/MembroEditar'
import MembroPerfil from './pages/MembroPerfil'

export default function App() {
  const { session, carregando } = useAuth()
  const { familia, carregando: carregandoFamilia } = useFamilia()

  if (carregando) return <Carregando />
  if (!session) return <Login />
  if (carregandoFamilia) return <Carregando />
  if (!familia) return <CriarFamilia />

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="familia" element={<Familia />} />
        <Route path="familia/novo" element={<MembroEditar />} />
        <Route path="familia/:id" element={<MembroPerfil />} />
        <Route path="familia/:id/editar" element={<MembroEditar />} />
        <Route path="adicionar" element={<Adicionar />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="mais" element={<Mais />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
