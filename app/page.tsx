"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSession } from "next-auth/react"
import Navigation from "./components/Navigation"
import HomePage from "./components/HomePage"
import ReportPage from "./components/ReportPage"
import TrackPage from "./components/TrackPage"
import AdminDashboard from "./components/AdminDashboard"
import AnalyticsPage from "./components/AnalyticsPage"

import FloatingParticles from "./components/FloatingParticles"

export default function App() {
  const { data: session } = useSession()
  const isAdmin = useMemo(() => session?.user?.role === 'admin', [session])

  // Start with a deterministic value for SSR to avoid hydration mismatches
  const [currentPage, setCurrentPage] = useState("home")
  const [isHydrated, setIsHydrated] = useState(false)

  // On mount, derive the page from hash/query/localStorage (client-only)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlPage = params.get('page')
    const hash = window.location.hash.replace('#', '')
    const stored = window.localStorage.getItem('currentPage')
    if (urlPage) setCurrentPage(urlPage)
    else if (hash) setCurrentPage(hash)
    else if (stored) setCurrentPage(stored)
    else if (params.get('reportId')) setCurrentPage('track')
    setIsHydrated(true)

    // Listen to hash changes (e.g., back/forward/navigation)
    const onHashChange = () => {
      const newHash = window.location.hash.replace('#', '') || 'home'
      setCurrentPage(newHash)
      window.localStorage.setItem('currentPage', newHash)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Whenever currentPage changes, reflect it in hash and localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    // Write to URL query ?page= for robust refresh persistence
    const url = new URL(window.location.href)
    url.searchParams.set('page', currentPage)
    window.history.replaceState({}, '', url.toString())
    window.localStorage.setItem('currentPage', currentPage)
  }, [currentPage])

  const pageVariants = {
    initial: {
      opacity: 0,
      x: -100,
      scale: 0.95,
    },
    in: {
      opacity: 1,
      x: 0,
      scale: 1,
    },
    out: {
      opacity: 0,
      x: 100,
      scale: 0.95,
    },
  }

  const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.5,
  }

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage onNavigate={setCurrentPage} />
      case "report":
        return <ReportPage onNavigate={setCurrentPage} />
      case "track":
        return <TrackPage />
      case "admin":
        return isAdmin ? <AdminDashboard /> : <HomePage onNavigate={setCurrentPage} />
      case "analytics":
        return <AnalyticsPage />
      default:
        return <HomePage onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-950 text-white relative overflow-hidden">
      {/* Enhanced gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-teal-900/20 via-transparent to-emerald-900/20 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/10 via-transparent to-transparent pointer-events-none" />

      <FloatingParticles />
      <Navigation currentPage={currentPage} onNavigate={(page) => {
        setCurrentPage(page)
        if (typeof window !== 'undefined') {
          window.location.hash = page
          window.localStorage.setItem('currentPage', page)
        }
      }} />

      <AnimatePresence mode="wait">
        <motion.main
          key={isHydrated ? currentPage : 'skeleton'}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="relative z-10"
        >
          {isHydrated ? renderPage() : null}
        </motion.main>
      </AnimatePresence>


    </div>
  )
}
