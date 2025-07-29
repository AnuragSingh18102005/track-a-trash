"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Navigation from "./components/Navigation"
import HomePage from "./components/HomePage"
import ReportPage from "./components/ReportPage"
import TrackPage from "./components/TrackPage"
import AdminDashboard from "./components/AdminDashboard"
import AnalyticsPage from "./components/AnalyticsPage"

import FloatingParticles from "./components/FloatingParticles"

export default function App() {
  const [currentPage, setCurrentPage] = useState("home")

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
        return <AdminDashboard />
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
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />

      <AnimatePresence mode="wait">
        <motion.main
          key={currentPage}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
          className="relative z-10"
        >
          {renderPage()}
        </motion.main>
      </AnimatePresence>


    </div>
  )
}
