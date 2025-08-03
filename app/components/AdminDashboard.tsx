"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { MapPin, Calendar, Filter, ExternalLink, Eye, Trash2, Play, CheckCircle } from "lucide-react"
import ReportModal from "./ReportModal"

export default function AdminDashboard() {
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [reports, setReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch reports from API
  const fetchReports = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/reports')
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }

      const data = await response.json()
      setReports(data)
    } catch (error) {
      console.error('Error fetching reports:', error)
      setError('Failed to load reports. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Update report status
  const updateReportStatus = async (reportId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update report status')
      }

      // Refresh reports after update
      await fetchReports()
    } catch (error) {
      console.error('Error updating report status:', error)
      alert('Failed to update report status. Please try again.')
    }
  }

  // Delete report
  const deleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report?')) {
      return
    }

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete report')
      }

      // Refresh reports after deletion
      await fetchReports()
    } catch (error) {
      console.error('Error deleting report:', error)
      alert('Failed to delete report. Please try again.')
    }
  }

  // Fetch reports on component mount
  useEffect(() => {
    fetchReports()
  }, [])

  // Group reports by status
  const groupedReports = {
    submitted: reports.filter(report => report.status === "Submitted"),
    inProgress: reports.filter(report => report.status === "In Progress"),
    resolved: reports.filter(report => report.status === "Resolved"),
  }

  const [filters, setFilters] = useState({
    dateRange: "all",
    issueType: "all",
    area: "all",
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted":
        return "border-yellow-500/40 bg-yellow-500/10"
      case "inProgress":
        return "border-blue-500/40 bg-blue-500/10"
      case "resolved":
        return "border-emerald-500/40 bg-emerald-500/10"
      default:
        return "border-gray-500/40 bg-gray-500/10"
    }
  }

  const handleReportClick = (report: any) => {
    setSelectedReport(report)
    setIsModalOpen(true)
  }



  const ReportCard = ({ report, status }: { report: any; status: string }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-3 md:p-4 rounded-lg border ${getStatusColor(status)} backdrop-blur-lg relative overflow-hidden group cursor-pointer`}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => handleReportClick(report)}
    >
      {/* Hover overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      />

      <div className="flex items-start space-x-3 relative z-10">
        <div className="relative">
          <img
            src={report.photoUrl || "/placeholder.jpg"}
            alt="Report"
            className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover border border-gray-600/50"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.currentTarget.src = "/placeholder.jpg"
            }}
          />
          <motion.div
            className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            whileHover={{ opacity: 1 }}
          >
            <Eye size={20} className="text-white" />
          </motion.div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-white text-sm truncate">#{report._id?.toString().slice(-6)}</h3>
            <motion.button
              onClick={(e) => {
                e.stopPropagation()
                handleReportClick(report)
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-teal-500/20 rounded"
              whileHover={{ scale: 1.1 }}
              title="View Details"
            >
              <ExternalLink size={14} className="text-teal-400" />
            </motion.button>
          </div>
                      <p className="text-gray-300 text-xs md:text-sm font-medium truncate">{report.title}</p>
            <div className="flex items-center text-gray-400 text-xs mt-1">
              <MapPin size={10} className="mr-1" />
              <span className="truncate text-xs">
                {report.gps && report.gps.latitude && report.gps.longitude ? 
                  `${Number(report.gps.latitude).toFixed(4)}, ${Number(report.gps.longitude).toFixed(4)}` : 
                  "Location not specified"
                }
              </span>
            </div>
            <div className="flex items-center text-gray-400 text-xs mt-1">
              <Calendar size={10} className="mr-1" />
              <span className="text-xs">{new Date(report.createdAt).toLocaleDateString()}</span>
            </div>

          {/* Status dropdown and action buttons */}
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 mt-3">
            <select
              value={report.status}
              onChange={(e) => {
                e.stopPropagation()
                updateReportStatus(report._id, e.target.value)
              }}
              className="px-2 py-1 bg-slate-700/50 border border-gray-600 rounded text-xs focus:border-teal-500 focus:outline-none transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <option value="Submitted">Submitted</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
            <motion.button
              onClick={(e) => {
                e.stopPropagation()
                deleteReport(report._id)
              }}
              className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/40 rounded text-xs hover:bg-red-500/30 transition-colors flex items-center justify-center gap-1"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 size={10} />
              <span className="hidden sm:inline">Delete</span>
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-300">Manage and track all waste reports</p>
        </motion.div>

        {/* Enhanced Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-teal-500/20 mb-8 relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-emerald-500/5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          />
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 relative z-10">
            <Filter className="text-teal-400" size={20} />
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 w-full sm:w-auto">
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateRange: e.target.value }))}
                className="px-3 py-2 bg-slate-700/50 border border-gray-600 rounded-lg text-sm focus:border-teal-500 focus:outline-none transition-colors"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <select
                value={filters.issueType}
                onChange={(e) => setFilters((prev) => ({ ...prev, issueType: e.target.value }))}
                className="px-3 py-2 bg-slate-700/50 border border-gray-600 rounded-lg text-sm focus:border-teal-500 focus:outline-none transition-colors"
              >
                <option value="all">All Types</option>
                <option value="overflowing">Overflowing Bin</option>
                <option value="dumping">Illegal Dumping</option>
                <option value="recycling">Recycling Request</option>
                <option value="broken">Broken Equipment</option>
              </select>
              <select
                value={filters.area}
                onChange={(e) => setFilters((prev) => ({ ...prev, area: e.target.value }))}
                className="px-3 py-2 bg-slate-700/50 border border-gray-600 rounded-lg text-sm focus:border-teal-500 focus:outline-none transition-colors"
              >
                <option value="all">All Areas</option>
                <option value="sector45">Sector 45</option>
                <option value="greenpark">Green Park</option>
                <option value="indiranagar">Indiranagar</option>
                <option value="mgroad">MG Road</option>
                <option value="koramangala">Koramangala</option>
                <option value="whitefield">Whitefield</option>
                <option value="electroniccity">Electronic City</option>
                <option value="hsrlayout">HSR Layout</option>
                <option value="jpnagar">JP Nagar</option>
                <option value="banashankari">Banashankari</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 min-h-[600px]">
          {/* Submitted Column */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-yellow-500/20 relative overflow-hidden flex flex-col"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            />
            <div className="flex items-center justify-between mb-4 md:mb-6 relative z-10">
              <h2 className="text-lg md:text-xl font-bold text-yellow-400">Submitted</h2>
              <motion.span
                className="bg-yellow-500/20 text-yellow-400 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
              >
                {groupedReports.submitted.length}
              </motion.span>
            </div>
            <div className="space-y-3 md:space-y-4 relative z-10 flex-1 overflow-y-auto">
              {groupedReports.submitted.map((report: any, index: number) => (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <ReportCard report={report} status="submitted" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* In Progress Column */}
          <motion.div
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-blue-500/20 relative overflow-hidden flex flex-col"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            />
            <div className="flex items-center justify-between mb-4 md:mb-6 relative z-10">
              <h2 className="text-lg md:text-xl font-bold text-blue-400">In Progress</h2>
              <motion.span
                className="bg-blue-500/20 text-blue-400 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.7, type: "spring" }}
              >
                {groupedReports.inProgress.length}
              </motion.span>
            </div>
            <div className="space-y-3 md:space-y-4 relative z-10 flex-1 overflow-y-auto">
              {groupedReports.inProgress.map((report: any, index: number) => (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                >
                  <ReportCard report={report} status="inProgress" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Resolved Column */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/30 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-emerald-500/20 relative overflow-hidden flex flex-col"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            />
            <div className="flex items-center justify-between mb-4 md:mb-6 relative z-10">
              <h2 className="text-lg md:text-xl font-bold text-emerald-400">Resolved</h2>
              <motion.span
                className="bg-emerald-500/20 text-emerald-400 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
              >
                {groupedReports.resolved.length}
              </motion.span>
            </div>
            <div className="space-y-3 md:space-y-4 relative z-10 flex-1 overflow-y-auto">
              {groupedReports.resolved.map((report: any, index: number) => (
                <motion.div
                  key={report._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 + index * 0.1 }}
                >
                  <ReportCard report={report} status="resolved" />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Report Modal */}
        <ReportModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          report={selectedReport}
          onStatusChange={() => {}}
        />
      </div>
    </div>
  )
}
