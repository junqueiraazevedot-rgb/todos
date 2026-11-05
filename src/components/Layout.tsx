import { NavLink, Outlet } from 'react-router-dom'

const abas = [
  { to: '/', rotulo: 'Início', icone: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z' },
  { to: '/familia', rotulo: 'Família', icone: 'M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0zM4 21a8 8 0 0 1 16 0' },
  { to: '/adicionar', rotulo: 'Adicionar', icone: 'M12 5v14M5 12h14', destaque: true },
  { to: '/agenda', rotulo: 'Agenda', icone: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4' },
  { to: '/mais', rotulo: 'Mais', icone: 'M5 12h.01M12 12h.01M19 12h.01' },
]

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-col">
      <main className="flex-1 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
        <Outlet />
      </main>
      <nav
        className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="mx-auto grid max-w-2xl grid-cols-5">
          {abas.map((a) => (
            <li key={a.to}>
              <NavLink
                to={a.to}
                end={a.to === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 py-2 text-xs ${isActive ? 'text-marca-700' : 'text-slate-500'}`
                }
              >
                <span
                  className={
                    a.destaque
                      ? 'flex h-9 w-9 items-center justify-center rounded-full bg-marca-700 text-white'
                      : 'flex h-9 w-9 items-center justify-center'
                  }
                >
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={a.destaque ? 2.5 : 1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={a.icone} />
                  </svg>
                </span>
                {a.rotulo}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
