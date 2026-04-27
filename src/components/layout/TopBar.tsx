import { Link, useLocation } from 'react-router-dom'
import clsx from 'clsx'

const NAV_ITEMS = [
  { to: '/', label: 'Destinos', icon: '🗺️' },
  { to: '/viajes', label: 'Viajes', icon: '✈️' },
  { to: '/perfil', label: 'Perfil', icon: '👤' },
]

export function TopBar() {
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-display text-xl font-bold text-egeo">
          🍌 Banana & Fran
        </Link>

        {/* Nav desktop */}
        <nav className="hidden sm:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                pathname === item.to
                  ? 'bg-egeo/10 text-egeo'
                  : 'text-gray-600 hover:text-egeo hover:bg-egeo/5'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Nav mobile — barra inferior */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={clsx(
              'flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors',
              pathname === item.to ? 'text-egeo' : 'text-gray-400'
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
