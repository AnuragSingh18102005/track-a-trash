"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { BarChart3, PieChart, TrendingUp, Trophy, MapPin } from "lucide-react"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface AnalyticsData {
  metrics: {
    totalReports: number
    resolutionRate: number
    avgResponseTime: number
    activeAreas: number
  }
  reportsByType: Array<{
    type: string
    count: number
    color: string
  }>
  reportsByArea: Array<{
    area: string
    count: number
    percentage: number
  }>
  timelineData: Array<{
    date: string
    count: number
  }>
  topAreas: {
    cleanest: Array<{
      name: string
      score: number
      trend: string
    }>
    mostReported: Array<{
      name: string
      reports: number
      trend: string
    }>
  }
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/reports/analytics')
        if (!response.ok) {
          throw new Error('Failed to fetch analytics data')
        }
        const data = await response.json()
        setAnalyticsData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const [animatedCounts, setAnimatedCounts] = useState<number[]>([])

  useEffect(() => {
    if (analyticsData?.reportsByType) {
      const timer = setTimeout(() => {
        setAnimatedCounts(analyticsData.reportsByType.map((item) => item.count))
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [analyticsData])

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-400 mx-auto mb-4"></div>
            <p className="text-gray-300">Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-red-400">Error loading analytics: {error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-300">No analytics data available</p>
          </div>
        </div>
      </div>
    )
  }

  const maxCount = analyticsData.reportsByType.length > 0 
    ? Math.max(...analyticsData.reportsByType.map((item) => item.count))
    : 0

  // Prepare data for status pie chart
  const statusData = analyticsData.statusDistribution || [
    { name: 'Submitted', value: 0, color: '#fbbf24' },
    { name: 'In Progress', value: 0, color: '#3b82f6' },
    { name: 'Resolved', value: 0, color: '#10b981' }
  ]

  // Filter out zero values to prevent chart issues
  const filteredStatusData = statusData.filter(item => item.value > 0)

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-gray-300">Insights and trends for better waste management</p>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8"
        >
          {[
            { label: "Total Reports", value: analyticsData.metrics.totalReports.toLocaleString(), icon: BarChart3, color: "text-teal-400" },
            { label: "Resolution Rate", value: `${analyticsData.metrics.resolutionRate}%`, icon: TrendingUp, color: "text-emerald-400" },
            { label: "Avg Response Time", value: `${analyticsData.metrics.avgResponseTime} days`, icon: PieChart, color: "text-blue-400" },
            { label: "Active Areas", value: analyticsData.metrics.activeAreas.toString(), icon: MapPin, color: "text-purple-400" },
          ].map((metric, index) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-slate-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700/50"
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={metric.color} size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{metric.value}</h3>
                <p className="text-gray-400 text-sm">{metric.label}</p>
              </motion.div>
            )
          })}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Reports by Type Chart */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-teal-500/20"
          >
            <h2 className="text-2xl font-bold mb-6 text-teal-400 flex items-center">
              <BarChart3 className="mr-2" size={24} />
              Reports by Type
            </h2>
            <div className="space-y-4">
              {analyticsData.reportsByType.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center space-x-4"
                >
                  <div className="w-24 text-sm text-gray-300">{item.type}</div>
                  <div className="flex-1 bg-gray-700/50 rounded-full h-6 relative overflow-hidden">
                    <motion.div
                      className={`h-full ${item.color} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: maxCount > 0 ? `${(animatedCounts[index] || 0) / maxCount * 100}%` : '0%' }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.8 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold">
                      {animatedCounts[index] || 0}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Status Distribution Pie Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-teal-500/20"
          >
            <h2 className="text-2xl font-bold mb-6 text-teal-400 flex items-center">
              <PieChart className="mr-2" size={24} />
              Status Distribution
            </h2>
            <div className="h-64">
              {filteredStatusData.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-lg mb-2">No Status Data</div>
                    <div className="text-gray-500 text-sm">Submit reports to see status distribution</div>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={filteredStatusData.length > 0 ? filteredStatusData : [{ name: 'No Data', value: 1, color: '#6b7280' }]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent, value }) => {
                      // Only show labels for segments with significant values (>5%)
                      if (percent > 0.05 && name !== 'No Data') {
                        return `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      return null
                    }}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(filteredStatusData.length > 0 ? filteredStatusData : [{ name: 'No Data', value: 1, color: '#6b7280' }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Reports by Area */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-teal-500/20"
          >
            <h2 className="text-2xl font-bold mb-6 text-teal-400 flex items-center">
              <PieChart className="mr-2" size={24} />
              Reports by Area
            </h2>
            <div className="space-y-4">
              {analyticsData.reportsByArea.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold text-white">{item.area}</h3>
                    <p className="text-gray-400 text-sm">{item.count} reports</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-teal-400">{item.percentage}%</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Interactive Map Placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-teal-500/20 mb-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-teal-400 flex items-center">
            <MapPin className="mr-2" size={24} />
            City Report Map
          </h2>
          <div className="bg-slate-700/50 rounded-lg h-96 flex items-center justify-center relative overflow-hidden">
            <div className="text-center">
              <MapPin className="mx-auto mb-4 text-teal-400" size={48} />
              <p className="text-gray-300 text-lg">Interactive Map</p>
              <p className="text-gray-400">Showing all report locations with animated pins</p>
            </div>
            {/* Animated pins simulation */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-4 bg-teal-400 rounded-full"
                style={{
                  left: `${20 + Math.random() * 60}%`,
                  top: `${20 + Math.random() * 60}%`,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.3,
                }}
              />
            ))}
          </div>
        </motion.div>

        {/* Leaderboards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Top Cleanest Areas */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-emerald-500/20"
          >
            <h2 className="text-2xl font-bold mb-6 text-emerald-400 flex items-center">
              <Trophy className="mr-2" size={24} />
              Cleanest Areas
            </h2>
            <div className="space-y-4">
              {analyticsData.topAreas.cleanest.map((area, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex items-center space-x-4 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20"
                >
                  <div className="text-2xl">{index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{area.name}</h3>
                    <p className="text-emerald-400 text-sm">Score: {area.score}/100</p>
                  </div>
                  <div className="text-emerald-400 font-semibold">{area.trend}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Most Reported Areas */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-red-500/20"
          >
            <h2 className="text-2xl font-bold mb-6 text-red-400 flex items-center">
              <TrendingUp className="mr-2" size={24} />
              Most Reported Areas
            </h2>
            <div className="space-y-4">
              {analyticsData.topAreas.mostReported.map((area, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="flex items-center space-x-4 p-4 bg-red-500/10 rounded-lg border border-red-500/20"
                >
                  <div className="text-2xl">{index === 0 ? "⚠️" : index === 1 ? "📍" : "🔴"}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{area.name}</h3>
                    <p className="text-red-400 text-sm">{area.reports} reports</p>
                  </div>
                  <div className={`font-semibold ${area.trend.startsWith("-") ? "text-emerald-400" : "text-red-400"}`}>
                    {area.trend}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
