"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, MapPin, Calendar, User, Phone, Camera, ExternalLink, Globe } from "lucide-react"
import { useState, useEffect } from "react"

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  report: any
  onStatusChange: (reportId: string, newStatus: string) => void
}

export default function ReportModal({ isOpen, onClose, report, onStatusChange }: ReportModalProps) {
  const [address, setAddress] = useState<string>("")
  const [isLoadingAddress, setIsLoadingAddress] = useState(false)

  // Reverse geocoding function
  const reverseGeocode = async (lat: number, lng: number) => {
    setIsLoadingAddress(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      )
      const data = await response.json()
      
      if (data.display_name) {
        const addressParts = data.display_name.split(', ')
        const streetAddress = addressParts.slice(0, 2).join(', ')
        const cityState = addressParts.slice(-3, -1).join(', ')
        setAddress(`${streetAddress}, ${cityState}`)
      } else {
        setAddress("Address not found")
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error)
      setAddress("Error fetching address")
    } finally {
      setIsLoadingAddress(false)
    }
  }

  // Fetch address when modal opens and report has GPS data
  useEffect(() => {
    if (isOpen && report?.gps?.latitude && report?.gps?.longitude) {
      reverseGeocode(report.gps.latitude, report.gps.longitude)
    }
  }, [isOpen, report])

  // Early return after all hooks
  if (!report) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/40"
      case "In Progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40"
      case "Resolved":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/40"
    }
  }

  const handleStatusChange = (newStatus: string) => {
    onStatusChange(report.id, newStatus)
  }

  const openInMaps = () => {
    if (report.gps && report.gps.latitude && report.gps.longitude) {
      // Use GPS coordinates for more accurate mapping
      const url = `https://maps.google.com/?q=${report.gps.latitude},${report.gps.longitude}`
      window.open(url, "_blank")
    } else if (report.location) {
      // Fallback to location string
      const encodedLocation = encodeURIComponent(report.location)
      window.open(`https://maps.google.com/?q=${encodedLocation}`, "_blank")
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-800/90 backdrop-blur-lg rounded-2xl border border-teal-500/20 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
              {/* Header */}
              <div className="sticky top-0 bg-slate-800/95 backdrop-blur-lg border-b border-teal-500/20 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-teal-400">Report Details</h2>
                    <p className="text-gray-400 font-mono">ID: {report._id}</p>
                  </div>
                  <motion.button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={24} className="text-gray-400" />
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Photo */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="relative"
                >
                  <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Camera size={20} className="text-teal-400" />
                    Photo Evidence
                  </h3>
                  <div className="relative group">
                    <img
                      src={report.photoUrl || "/placeholder.jpg"}
                      alt="Report evidence"
                      className="w-full h-64 object-cover rounded-lg border border-gray-600/50"
                      onError={(e) => {
                        // Fallback to placeholder if image fails to load
                        e.currentTarget.src = "/placeholder.jpg"
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      whileHover={{ opacity: 1 }}
                    />
                  </div>
                </motion.div>

                {/* Report Info Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                        <User size={16} />
                        Reporter
                      </h4>
                      <p className="text-white">{report.reporter || "John Doe"}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                        <Phone size={16} />
                        Contact
                      </h4>
                      <p className="text-white">{report.contact || "+1 (555) 123-4567"}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                        <Calendar size={16} />
                        Submitted
                      </h4>
                      <p className="text-white">
                        {report.createdAt ? new Date(report.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'Date not available'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-1">Issue Type</h4>
                      <span className="inline-block px-3 py-1 bg-teal-500/20 text-teal-400 rounded-full text-sm border border-teal-500/40">
                        {report.title || 'Unknown Issue'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-1 flex items-center gap-2">
                        <MapPin size={16} />
                        Location
                      </h4>
                      <div className="space-y-2">
                        {report.gps && report.gps.latitude && report.gps.longitude ? (
                          <>
                            <div className="flex items-center gap-2">
                              <p className="text-white flex-1">
                                {isLoadingAddress ? (
                                  <span className="text-gray-400">Fetching address...</span>
                                ) : address ? (
                                  address
                                ) : (
                                  "Address not available"
                                )}
                              </p>
                              <motion.button
                                onClick={openInMaps}
                                className="p-2 bg-teal-500/20 hover:bg-teal-500/30 rounded-lg border border-teal-500/40 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Open in Google Maps"
                              >
                                <ExternalLink size={16} className="text-teal-400" />
                              </motion.button>
                            </div>
                            <p className="text-xs text-gray-500">
                              Coordinates: {Number(report.gps.latitude).toFixed(6)}, {Number(report.gps.longitude).toFixed(6)}
                            </p>
                          </>
                        ) : (
                          <p className="text-white">{report.location || "Location not specified"}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-400 mb-1">Current Status</h4>
                      <select
                        value={report.status || "Submitted"}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${getStatusColor(report.status || "Submitted")} bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-teal-500/50`}
                      >
                        <option value="Submitted">Submitted</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                  </div>
                </motion.div>

                {/* Description */}
                {report.description && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Description</h4>
                    <div className="bg-slate-700/30 rounded-lg p-4 border border-gray-600/50">
                      <p className="text-gray-300">{report.description || "No additional description provided."}</p>
                    </div>
                  </motion.div>
                )}

                {/* Google Maps Embed */}
                {report.gps && report.gps.latitude && report.gps.longitude && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                      <Globe size={16} />
                      Location Map
                    </h4>
                    <div className="bg-slate-700/30 rounded-lg border border-gray-600/50 overflow-hidden">
                      <iframe
                        src={`https://maps.google.com/maps?q=${report.gps.latitude},${report.gps.longitude}&hl=en&z=15&output=embed`}
                        width="100%"
                        height="300"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Report Location"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Priority Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex items-center justify-between pt-4 border-t border-gray-700/50"
                >
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Priority Level</h4>
                    <span className="inline-block px-3 py-1 rounded-full text-sm border"
                      style={{
                        borderColor: 'rgba(251, 191, 36, 0.4)'
                      }}
                      className={`
                        ${(
                          (report.priority || '').toLowerCase() === 'high' ? 'bg-red-500/20 text-red-400 border-red-500/40' :
                          (report.priority || '').toLowerCase() === 'low' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' :
                          'bg-orange-500/20 text-orange-400 border-orange-500/40'
                        )}
                      `}
                    >
                      {report.priority || '—'}
                    </span>
                  </div>
                  <div className="text-right">
                    <h4 className="text-sm font-medium text-gray-400 mb-1">Estimated Resolution</h4>
                    <p className="text-white text-sm">{report.estimatedResolution || report.eta || '—'}</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
