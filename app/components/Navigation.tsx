'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Home, FileText, Search, BarChart3, Settings, LogOut } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'

interface NavigationProps {
  currentPage: string
  onNavigate: (page: string) => void
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'admin'

  const baseItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'report', label: 'Report', icon: FileText },
    { id: 'track', label: 'Track', icon: Search },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ]

  const adminItems = [
    { id: 'admin', label: 'Dashboard', icon: Settings },
  ]

  const navItems = isAdmin ? [...baseItems, ...adminItems] : baseItems

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-teal-500/20"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent"
          >
            Smart Waste Tracker
          </motion.div>

          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <motion.button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all ${
                    currentPage === item.id
                      ? 'bg-teal-500/20 text-teal-400 shadow-lg shadow-teal-500/20'
                      : 'text-gray-300 hover:text-teal-400 hover:bg-teal-500/10'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon size={18} />
                  <span className="hidden md:block">{item.label}</span>
                </motion.button>
              )
            })}
            {!session && (
              <Link href="/login" legacyBehavior>
                <motion.a
                  className="ml-2 px-4 py-2 rounded-lg flex items-center space-x-2 transition-all text-gray-300 hover:text-teal-400 hover:bg-teal-500/10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Login
                </motion.a>
              </Link>
            )}
            {session && (
              <motion.button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="ml-2 px-3 py-2 rounded-lg flex items-center space-x-1 text-gray-300 hover:text-red-300 hover:bg-red-500/10 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <LogOut size={16} />
                <span className="hidden md:block">Sign out</span>
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  )
}
