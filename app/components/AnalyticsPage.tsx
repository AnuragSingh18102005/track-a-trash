"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { BarChart3, PieChart, TrendingUp, Trophy, MapPin, Users, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

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
  timelineData: Array<{
    date: string
    displayDate: string
    count: number
  }>
  wasteCategoryData: Array<{
    name: string
    value: number
    color: string
  }>
  resolutionMetrics: {
    averageResolutionTime: number
    onTimePercentage: number
    delayedPercentage: number
  }
  topReporters: Array<{
    id: string
    name: string
    reports: number
    resolved: number
    points: number
    resolutionRate: number
  }>
  resolutionMetrics: {
    averageResolutionTime: number
    onTimePercentage: number
    delayedPercentage: number
    trend: {
      current: number
      previous: number
      change: number
      direction: string
    }
    weeklyData: Array<{
      date: string
      displayDate: string
      avgTime: number
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

  // Label renderer for Waste Categories donut chart – shows only percentage inside slices
  const renderCategoryLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (!percent || percent < 0.08) return null
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    return (
      <text
        x={x}
        y={y}
        fill="#ffffff"
        textAnchor="middle"
        dominantBaseline="central"
        stroke="#0b1220"
        strokeWidth={3}
        style={{ fontSize: 12, fontWeight: 700, paintOrder: 'stroke' as any }}
      >
        {`${Math.round(percent * 100)}%`}
      </text>
    )
  }

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

          {/* Waste Category Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-teal-500/20"
          >
            <h2 className="text-2xl font-bold mb-6 text-teal-400 flex items-center">
              <PieChart className="mr-2" size={24} />
              Waste Categories
            </h2>
            <div className="h-64">
              {analyticsData.wasteCategoryData.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-gray-400 text-lg mb-2">No Category Data</div>
                    <div className="text-gray-500 text-sm">Submit reports to see waste categories</div>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={analyticsData.wasteCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      labelLine={false}
                      label={renderCategoryLabel}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analyticsData.wasteCategoryData.map((entry, index) => (
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
        </div>

        {/* Reports Over Time Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-teal-500/20 mb-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-teal-400 flex items-center">
            <TrendingUp className="mr-2" size={24} />
            Reports Over Time
          </h2>
          <div className="h-96">
            {analyticsData.timelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-gray-400 text-lg mb-2">No Timeline Data</div>
                  <div className="text-gray-500 text-sm">Submit reports to see trends over time</div>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData.timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis 
                    dataKey="displayDate" 
                    stroke="#94a3b8"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                    // XAxis uses displayDate, so echo the label directly to avoid browser Date parsing quirks
                    labelFormatter={(label) => String(label)}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Resolution Metrics and Top Reporters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* Resolution Metrics */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-blue-500/20"
          >
            <h2 className="text-2xl font-bold mb-6 text-blue-400 flex items-center">
              <Clock className="mr-2" size={24} />
              Resolution Metrics
            </h2>
            <div className="space-y-6">
              {/* Average Resolution Time with Trend */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-center p-6 bg-blue-500/10 rounded-lg border border-blue-500/20"
              >
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {analyticsData.resolutionMetrics.averageResolutionTime} days
                </div>
                <p className="text-gray-300 text-sm mb-2">Average Resolution Time</p>
                {analyticsData.resolutionMetrics.trend.direction !== 'stable' && (
                  <div className={`text-xs flex items-center justify-center ${
                    analyticsData.resolutionMetrics.trend.direction === 'faster' 
                      ? 'text-emerald-400' 
                      : 'text-red-400'
                  }`}>
                    <span className="mr-1">
                      {analyticsData.resolutionMetrics.trend.direction === 'faster' ? '↓' : '↑'}
                    </span>
                    {analyticsData.resolutionMetrics.trend.direction} than last week
                  </div>
                )}
              </motion.div>

              {/* Resolution Time Sparkline */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="h-24"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analyticsData.resolutionMetrics.weeklyData}>
                    <XAxis 
                      dataKey="displayDate" 
                      stroke="#94a3b8"
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avgTime" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6', strokeWidth: 1, r: 3 }}
                      activeDot={{ r: 4, stroke: '#3b82f6', strokeWidth: 2 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                      // XAxis uses displayDate, so display the label unmodified
                      labelFormatter={(label) => String(label)}
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-center text-xs text-gray-400 mt-1">Last 7 days resolution times</p>
              </motion.div>

              {/* Resolution Rate Breakdown */}
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.0 }}
                  className="text-center p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20"
                >
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="text-emerald-400 mr-2" size={20} />
                    <div className="text-2xl font-bold text-emerald-400">
                      {analyticsData.resolutionMetrics.onTimePercentage}%
                    </div>
                  </div>
                  <p className="text-gray-300 text-xs">Resolved On Time</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 }}
                  className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20"
                >
                  <div className="flex items-center justify-center mb-2">
                    <AlertCircle className="text-red-400 mr-2" size={20} />
                    <div className="text-2xl font-bold text-red-400">
                      {analyticsData.resolutionMetrics.delayedPercentage}%
                    </div>
                  </div>
                  <p className="text-gray-300 text-xs">Resolved Late</p>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Top Reporters Leaderboard */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/20"
          >
            <h2 className="text-2xl font-bold mb-6 text-purple-400 flex items-center">
              <Users className="mr-2" size={24} />
              Top Reporters
            </h2>
            <div className="space-y-4">
              {analyticsData.topReporters.map((reporter, index) => (
                <motion.div
                  key={reporter.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="flex items-center space-x-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20"
                >
                  <div className="text-2xl">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "👤"}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white truncate">{reporter.name}</h3>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-purple-400">{reporter.reports} reports</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-emerald-400">{reporter.resolved} resolved</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-400">{reporter.points}</div>
                    <div className="text-xs text-gray-400">points</div>
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
