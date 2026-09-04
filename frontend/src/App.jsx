import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import DashboardPage from './pages/DashboardPage'
import HistoryPage from './pages/HistoryPage'

export default function App() {
  const { pathname } = useLocation()

  
  const isLanding = pathname === '/'

  return (
    <>
      {/* Landing page — standalone, full screen, own nav */}
      {isLanding && (
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      )}

      {/* App shell — Header + main content + Footer */}
      {!isLanding && (
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/app"           element={<HomePage />} />
              <Route path="/app/dashboard" element={<DashboardPage />} />
              <Route path="/app/history"   element={<HistoryPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      )}
    </>
  )
}
