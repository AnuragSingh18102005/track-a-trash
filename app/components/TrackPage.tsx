"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { Search, Clock, CheckCircle, FileText, MapPin, Calendar, RefreshCw, Eye } from "lucide-react"
import { useSearchParams } from "next/navigation"

export default function TrackPage() {
  const searchParams = useSearchParams()
  const [reports, setReports] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchMode, setSearchMode] = useState<"all" | "single">("all")
  const [singleReport, setSingleReport] = useState<any>(null)
  const [searchId, setSearchId] = useState("")
  const [isSearching, setIsSearching] = useState(false)

  // Fetch all reports on component mount
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

  // Search for a single report by ID
  const searchReport = async (reportId: string) => {
    if (!reportId.trim()) return

    setIsSearching(true)
    setError(null)
    setSingleReport(null)

    try {
      const response = await fetch(`/api/reports/${reportId}`)
      
      if (response.status === 404) {
        setError('Report not found. Please check the ID and try again.')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch report')
      }

      const data = await response.json()
      setSingleReport(data)
    } catch (error) {
      console.error('Error searching report:', error)
      setError('Failed to search report. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  // Check for reportId query parameter and auto-fetch
  useEffect(() => {
    const reportId = searchParams.get('reportId')
    const sessionReportId = sessionStorage.getItem('trackReportId')
    
    if (reportId) {
      setSearchMode("single")
      setSearchId(reportId)
      searchReport(reportId)
      // Clear the session storage since we're using URL parameter
      sessionStorage.removeItem('trackReportId')
    } else if (sessionReportId) {
      setSearchMode("single")
      setSearchId(sessionReportId)
      searchReport(sessionReportId)
      // Clear the session storage after using it
      sessionStorage.removeItem('trackReportId')
    } else {
      // Only fetch all reports if no specific report is requested
      fetchReports()
    }
  }, [searchParams])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted":
        return "text-yellow-400"
      case "In Progress":
        return "text-blue-400"
      case "Resolved":
        return "text-emerald-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Submitted":
        return FileText
      case "In Progress":
        return Clock
      case "Resolved":
        return CheckCircle
      default:
        return FileText
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const filteredReports = reports.filter(report => 
    report.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.status?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchId.trim()) {
      searchReport(searchId.trim())
    }
  }

  const resetSearch = () => {
    setSearchMode("all")
    setSingleReport(null)
    setSearchId("")
    setError(null)
    // Clear the URL parameter
    const url = new URL(window.location.href)
    url.searchParams.delete('reportId')
    window.history.replaceState({}, '', url.toString())
  }

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Track Reports
          </h1>
          <p className="text-gray-300">View all submitted waste reports and their status</p>
        </motion.div>

        {/* Auto-fetched Report Display */}
        {singleReport && searchParams.get('reportId') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-emerald-500/20 mb-8 relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-emerald-400 flex items-center gap-2">
                  <CheckCircle size={20} />
                  Your Submitted Report
                </h3>
                <button
                  onClick={resetSearch}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  View All Reports
                </button>
              </div>
              <ReportCard report={singleReport} />
            </div>
          </motion.div>
        )}

        {/* Search Mode Toggle */}
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
            transition={{ duration: 0.3 }}
          />
          <div className="flex gap-4 relative z-10">
            <button
              onClick={() => setSearchMode("all")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                searchMode === "all" 
                  ? "bg-teal-500/20 text-teal-400 border border-teal-500/40" 
                  : "text-gray-400 hover:text-teal-400"
              }`}
            >
              All Reports
            </button>
            <button
              onClick={() => setSearchMode("single")}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                searchMode === "single" 
                  ? "bg-teal-500/20 text-teal-400 border border-teal-500/40" 
                  : "text-gray-400 hover:text-teal-400"
              }`}
            >
              Search by ID
            </button>
          </div>
        </motion.div>

        {searchMode === "single" ? (
          // Single Report Search
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-teal-500/20 mb-8 relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-emerald-500/5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            />
            <div className="relative z-10">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Eye size={20} className="text-teal-400" />
                Search by Report ID
              </h3>
              
              <form onSubmit={handleSearchSubmit} className="flex gap-4">
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="Enter report ID..."
                  className="flex-1 px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg focus:border-teal-500 focus:outline-none transition-colors"
                />
                <motion.button
                  type="submit"
                  disabled={isSearching || !searchId.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
                  whileHover={{ scale: isSearching ? 1 : 1.05 }}
                  whileTap={{ scale: isSearching ? 1 : 0.95 }}
                >
                  {isSearching ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    />
                  ) : (
                    <Search size={20} />
                  )}
                  {isSearching ? "Searching..." : "Search"}
                </motion.button>
                <button
                  type="button"
                  onClick={resetSearch}
                  className="px-6 py-3 bg-slate-700/50 border border-gray-600 rounded-lg font-semibold hover:bg-slate-600/50 transition-colors"
                >
                  Reset
                </button>
              </form>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-500/20 border border-red-500/40 rounded-lg"
                >
                  <p className="text-red-400">{error}</p>
                </motion.div>
              )}

              {singleReport && !searchParams.get('reportId') && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <ReportCard report={singleReport} />
                </motion.div>
              )}
            </div>
          </motion.div>
        ) : (
          // All Reports Search
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-teal-500/20 mb-8 relative overflow-hidden"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-emerald-500/5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            />
            <div className="flex gap-4 relative z-10">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search reports by title, description, or status..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg focus:border-teal-500 focus:outline-none transition-colors"
                />
              </div>
              <motion.button
                onClick={fetchReports}
                disabled={isLoading}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2"
                whileHover={{ scale: isLoading ? 1 : 1.05 }}
                whileTap={{ scale: isLoading ? 1 : 0.95 }}
              >
                {isLoading ? (
                  <motion.div
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                  />
                ) : (
                  <RefreshCw size={20} />
                )}
                {isLoading ? "Loading..." : "Refresh"}
              </motion.button>
            </div>
          </motion.div>
        )}

        {searchMode === "all" && (
          <>
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-teal-500/20 text-center"
              >
                <motion.div
                  className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full mx-auto mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                />
                <p className="text-gray-300">Loading reports...</p>
              </motion.div>
            ) : error ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-red-500/20 text-center"
              >
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={fetchReports}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg font-semibold"
                >
                  Try Again
                </button>
              </motion.div>
            ) : filteredReports.length > 0 ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="text-center mb-6">
                  <p className="text-gray-400">
                    Showing {filteredReports.length} of {reports.length} reports
                  </p>
                </div>
                
                {filteredReports.map((report, index) => {
                  const Icon = getStatusIcon(report.status)
                  return (
                    <motion.div
                      key={report._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-teal-500/20 relative overflow-hidden"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      />
                      
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-full border-2 ${
                              report.status === "Submitted" ? "border-yellow-500/40 bg-yellow-500/10" :
                              report.status === "In Progress" ? "border-blue-500/40 bg-blue-500/10" :
                              "border-emerald-500/40 bg-emerald-500/10"
                            }`}>
                              <Icon size={24} className={getStatusColor(report.status)} />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">{report.title}</h3>
                              <p className={`font-semibold ${getStatusColor(report.status)}`}>
                                {report.status}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-400 text-sm">Report ID</p>
                            <p className="text-white font-mono text-sm">{report._id}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Description</p>
                            <p className="text-white">{report.description}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm mb-1">Location</p>
                            <p className="text-white flex items-center gap-2">
                              <MapPin size={16} className="text-teal-400" />
                              {report.gps && report.gps.latitude && report.gps.longitude ? 
                                `Lat: ${Number(report.gps.latitude).toFixed(6)}, Lng: ${Number(report.gps.longitude).toFixed(6)}` : 
                                "Location not specified"
                              }
                            </p>
                          </div>
                        </div>

                        {/* Photo Evidence */}
                        {report.photoUrl && (
                          <div className="mb-4">
                            <p className="text-gray-400 text-sm mb-2">Photo Evidence</p>
                            <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-gray-600/50">
                              <img
                                src={report.photoUrl}
                                alt="Report evidence"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = "/placeholder.jpg"
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} className="text-teal-400" />
                            <span>Submitted: {formatDate(report.createdAt)} at {formatTime(report.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-teal-500/20 text-center"
              >
                <p className="text-gray-400 mb-4">
                  {searchTerm ? "No reports match your search criteria." : "No reports found."}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-lg font-semibold"
                  >
                    Clear Search
                  </button>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Report Card Component for single report display
const ReportCard = ({ report }: { report: any }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted":
        return "text-yellow-400"
      case "In Progress":
        return "text-blue-400"
      case "Resolved":
        return "text-emerald-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Submitted":
        return FileText
      case "In Progress":
        return Clock
      case "Resolved":
        return CheckCircle
      default:
        return FileText
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const Icon = getStatusIcon(report.status)

  return (
    <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-6 border border-teal-500/20 relative overflow-hidden">
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full border-2 ${
              report.status === "Submitted" ? "border-yellow-500/40 bg-yellow-500/10" :
              report.status === "In Progress" ? "border-blue-500/40 bg-blue-500/10" :
              "border-emerald-500/40 bg-emerald-500/10"
            }`}>
              <Icon size={24} className={getStatusColor(report.status)} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{report.title}</h3>
              <p className={`font-semibold ${getStatusColor(report.status)}`}>
                {report.status}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-sm">Report ID</p>
            <p className="text-white font-mono text-sm">{report._id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          <div>
            <p className="text-gray-400 text-sm mb-1">Description</p>
            <p className="text-white">{report.description}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Location</p>
            <p className="text-white flex items-center gap-2">
              <MapPin size={16} className="text-teal-400" />
              {report.gps && report.gps.latitude && report.gps.longitude ? 
                `Lat: ${Number(report.gps.latitude).toFixed(6)}, Lng: ${Number(report.gps.longitude).toFixed(6)}` : 
                "Location not specified"
              }
            </p>
          </div>
        </div>

        {/* Photo Evidence */}
        {report.photoUrl && (
          <div className="mb-4">
            <p className="text-gray-400 text-sm mb-2">Photo Evidence</p>
            <div className="relative w-32 h-24 rounded-lg overflow-hidden border border-gray-600/50">
              <img
                src={report.photoUrl}
                alt="Report evidence"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.jpg"
                }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-teal-400" />
            <span>Submitted: {formatDate(report.createdAt)} at {formatTime(report.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
