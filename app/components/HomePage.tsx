"use client"

import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { useEffect, useState } from "react"
import { Trash2, CheckCircle, Clock, TrendingUp } from "lucide-react"

interface HomePageProps {
  onNavigate: (page: string) => void
}

interface Stats {
  totalReports: number
  inProgress: number
  resolved: number
  successRate: number
}

function AnimatedCounter({ from, to, duration = 2 }: { from: number; to: number; duration?: number }) {
  const count = useMotionValue(from)
  const rounded = useTransform(count, (latest) => Math.round(latest))
  const [displayValue, setDisplayValue] = useState(from)

  useEffect(() => {
    const controls = animate(count, to, {
      duration,
      ease: "easeOut",
      delay: 0.5,
    })

    const unsubscribe = rounded.on("change", (latest) => {
      setDisplayValue(latest)
    })

    return () => {
      controls.stop()
      unsubscribe()
    }
  }, [count, rounded, to, duration])

  return <span>{displayValue.toLocaleString()}</span>
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [stats, setStats] = useState<Stats>({
    totalReports: 0,
    inProgress: 0,
    resolved: 0,
    successRate: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/reports/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        } else {
          console.error('Failed to fetch stats')
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300)
    return () => clearTimeout(timer)
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8, ease: "easeOut" },
    },
  }

  const glowVariants = {
    initial: { boxShadow: "0 0 20px rgba(20, 184, 166, 0.3)" },
    hover: {
      boxShadow: "0 0 40px rgba(20, 184, 166, 0.6)",
      scale: 1.05,
      transition: { duration: 0.3 },
    },
  }

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Enhanced Hero Section */}
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="text-center mb-16">
          <motion.h1
            variants={itemVariants}
            className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-teal-400 via-emerald-400 to-green-400 bg-clip-text text-transparent"
            style={{
              filter: "drop-shadow(0 0 20px rgba(20, 184, 166, 0.3))",
            }}
          >
            Smart Waste Tracker
          </motion.h1>
          <motion.p variants={itemVariants} className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Revolutionizing waste management through smart technology and community engagement
          </motion.p>
          <motion.button
            variants={itemVariants}
            onClick={() => onNavigate("report")}
            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 px-8 py-4 rounded-full text-lg font-semibold shadow-lg shadow-teal-500/25 transition-all duration-300 relative overflow-hidden"
            whileHover={{
              scale: 1.05,
              boxShadow: "0 20px 40px rgba(20, 184, 166, 0.4)",
            }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
              initial={{ x: "-100%" }}
              whileHover={{ x: "100%" }}
              transition={{ duration: 0.6 }}
            />
            Report an Issue
          </motion.button>
        </motion.div>

        {/* Enhanced Stats Overview with Animated Counters */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16"
        >
          <motion.div
            variants={itemVariants}
            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-teal-500/20 hover:border-teal-500/40 transition-all duration-300 relative overflow-hidden"
            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)" }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <Trash2 className="text-teal-400" size={32} />
              <motion.span
                className="text-3xl font-bold text-teal-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1, type: "spring" }}
              >
                {isLoaded && !isLoading && <AnimatedCounter from={0} to={stats.totalReports} duration={2.5} />}
              </motion.span>
            </div>
            <h3 className="text-lg font-semibold text-gray-200 relative z-10">Total Reports</h3>
            <p className="text-gray-400 relative z-10">All-time submissions</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 relative overflow-hidden"
            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)" }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <Clock className="text-yellow-400" size={32} />
              <motion.span
                className="text-3xl font-bold text-yellow-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.2, type: "spring" }}
              >
                {isLoaded && !isLoading && <AnimatedCounter from={0} to={stats.inProgress} duration={2} />}
              </motion.span>
            </div>
            <h3 className="text-lg font-semibold text-gray-200 relative z-10">In Progress</h3>
            <p className="text-gray-400 relative z-10">Being resolved</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 relative overflow-hidden"
            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)" }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <CheckCircle className="text-emerald-400" size={32} />
              <motion.span
                className="text-3xl font-bold text-emerald-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.4, type: "spring" }}
              >
                {isLoaded && !isLoading && <AnimatedCounter from={0} to={stats.resolved} duration={3} />}
              </motion.span>
            </div>
            <h3 className="text-lg font-semibold text-gray-200 relative z-10">Resolved</h3>
            <p className="text-gray-400 relative z-10">Successfully completed</p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 relative overflow-hidden"
            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)" }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <TrendingUp className="text-purple-400" size={32} />
              <motion.span
                className="text-3xl font-bold text-purple-400"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 1.6, type: "spring" }}
              >
                {isLoaded && !isLoading && <AnimatedCounter from={0} to={stats.successRate} duration={2.2} />}%
              </motion.span>
            </div>
            <h3 className="text-lg font-semibold text-gray-200 relative z-10">Success Rate</h3>
            <p className="text-gray-400 relative z-10">Resolution efficiency</p>
          </motion.div>
        </motion.div>

        {/* Enhanced Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {[
            {
              title: "Real-time Tracking",
              description: "Monitor your reports from submission to resolution",
              icon: "📍",
              gradient: "from-teal-500/20 to-cyan-500/20",
            },
            {
              title: "Smart Analytics",
              description: "Data-driven insights for better waste management",
              icon: "📊",
              gradient: "from-emerald-500/20 to-green-500/20",
            },
            {
              title: "Community Driven",
              description: "Empowering citizens to create cleaner environments",
              icon: "🤝",
              gradient: "from-blue-500/20 to-purple-500/20",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className={`bg-slate-800/30 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50 hover:border-teal-500/30 transition-all duration-300 relative overflow-hidden`}
              whileHover={{ y: -5, scale: 1.02 }}
            >
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient}`}
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              />
              <div className="relative z-10">
                <motion.div
                  className="text-4xl mb-4"
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-2 text-gray-200">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
