import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const { pathname } = useLocation()

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
        pathname === to
          ? 'bg-red-600 text-white'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Brand — clicking goes back to landing page */}
          <Link to="/" className="flex items-center gap-2.5">
            <span className="text-2xl" role="img" aria-label="heart">&#10084;&#65039;</span>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-tight">
                HeartGuard AI
              </p>
              <p className="text-xs text-slate-400 leading-tight">
                DNN Classification System
              </p>
            </div>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-2">
            {navLink('/app',           'Predict')}
            {navLink('/app/dashboard', 'Dashboard')}
            {navLink('/app/history',   'History')}
          </nav>
        </div>
      </div>
    </header>
  )
}
