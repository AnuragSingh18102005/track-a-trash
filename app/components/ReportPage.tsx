"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import { MapPin, Camera, CheckCircle, Search, Loader2, Globe } from "lucide-react"
import LocationSearch from "./LocationSearch"

interface ReportPageProps {
  onNavigate?: (page: string) => void
}

// Confetti component
const Confetti = () => {
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
    color: ["text-teal-400", "text-emerald-400", "text-yellow-400", "text-pink-400", "text-blue-400"][
      Math.floor(Math.random() * 5)
    ],
  }))

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          className={`absolute w-2 h-2 ${piece.color}`}
          style={{ left: `${piece.x}%`, top: "-10px" }}
          initial={{ y: -10, rotate: 0, opacity: 1 }}
          animate={{
            y: window.innerHeight + 10,
            rotate: 360,
            opacity: 0,
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: "easeOut",
          }}
        >
          ✨
        </motion.div>
      ))}
    </div>
  )
}

export default function ReportPage({ onNavigate }: ReportPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    location: "",
    issueType: "",
    description: "",
    photo: null as File | null,
  })
  const [showSuccess, setShowSuccess] = useState(false)
  const [reportId, setReportId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  
  // Location search states
  const [selectedLocation, setSelectedLocation] = useState<any>(null)

  const issueTypes = ["Overflowing Bin", "Illegal Dumping", "Recycling Request", "Broken Equipment", "Other"]



  const handleLocationSelect = (location: any) => {
    setSelectedLocation(location)
    setFormData(prev => ({
      ...prev,
      location: location.display_name
    }))
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Handle photo upload first if photo is selected
      let photoUrl = null
      if (formData.photo) {
        const uploadFormData = new FormData()
        uploadFormData.append('file', formData.photo)

        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })

        if (!uploadResponse.ok) {
          const uploadError = await uploadResponse.json()
          throw new Error(uploadError.error || 'Failed to upload photo')
        }

        const uploadResult = await uploadResponse.json()
        photoUrl = uploadResult.photoUrl
      }

      // Get GPS coordinates and location details from selected location or use current location
      let gpsData = null
      let locationDetails = null
      
      if (selectedLocation && selectedLocation.lat && selectedLocation.lon) {
        // Use coordinates from selected location
        gpsData = {
          latitude: parseFloat(selectedLocation.lat),
          longitude: parseFloat(selectedLocation.lon)
        }
        
        // Extract location details from the selected location
        const addressParts = selectedLocation.display_name.split(', ')
        locationDetails = {
          subLocality: addressParts[0] || 'Unknown',
          locality: addressParts[1] || addressParts[0] || 'Unknown',
          formatted_address: selectedLocation.display_name,
          area: addressParts[0] || 'Unknown' // Use subLocality as area for chart
        }
      } else if (formData.location) {
        // Fallback: Check if location is already in GPS format
        if (formData.location.includes(',')) {
          const coords = formData.location.split(',').map(coord => parseFloat(coord.trim()))
          if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            gpsData = {
              latitude: coords[0],
              longitude: coords[1]
            }
            
            // Try to reverse geocode to get location details
            try {
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}&zoom=18&addressdetails=1`
              )
              const data = await response.json()
              
              if (data.display_name) {
                const addressParts = data.display_name.split(', ')
                locationDetails = {
                  subLocality: addressParts[0] || 'Unknown',
                  locality: addressParts[1] || addressParts[0] || 'Unknown',
                  formatted_address: data.display_name,
                  area: addressParts[0] || 'Unknown'
                }
              }
            } catch (error) {
              console.error('Error reverse geocoding coordinates:', error)
            }
          }
        }
      }

      // Prepare form data for API
      const reportData = {
        title: formData.issueType,
        description: formData.description,
        gps: gpsData,
        locationDetails: locationDetails,
        photoUrl: photoUrl,
        reporter: formData.name,
        contact: formData.contact
      }

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit report')
      }

      const result = await response.json()
      
      if (result.success) {
        setReportId(result.id)
        setShowSuccess(true)
        setShowConfetti(true)
        
        // Stop confetti after 5 seconds
        setTimeout(() => setShowConfetti(false), 5000)
      } else {
        throw new Error('Failed to submit report')
      }
    } catch (error) {
      console.error('Error submitting report:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit report. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getLocation = async () => {
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          })
        })

        const { latitude, longitude } = position.coords
        
        // Reverse geocode the GPS coordinates to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          )
          const data = await response.json()
          
          if (data.display_name) {
            setSelectedLocation({
              display_name: data.display_name,
              lat: latitude.toString(),
              lon: longitude.toString()
            })
            setFormData(prev => ({
              ...prev,
              location: data.display_name
            }))
          } else {
            // Fallback to coordinates if reverse geocoding fails
            setFormData(prev => ({
              ...prev,
              location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
            }))
          }
        } catch (geocodeError) {
          console.error('Error reverse geocoding:', geocodeError)
          // Fallback to coordinates
          setFormData(prev => ({
            ...prev,
            location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }))
        }
      } catch (error) {
        console.error('Error getting location:', error)
        alert('Unable to get your location. Please enter it manually.')
      }
    } else {
      alert('Geolocation is not supported by this browser. Please enter your location manually.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      contact: "",
      location: "",
      issueType: "",
      description: "",
      photo: null,
    })
    setSelectedLocation(null)
    setShowSuccess(false)
    setShowConfetti(false)
  }

  const handleTrackReport = () => {
    if (onNavigate) {
      // Navigate to track page with the report ID
      onNavigate("track")
      // Store the report ID in sessionStorage for the track page to access
      sessionStorage.setItem('trackReportId', reportId)
    } else {
      // Fallback to URL navigation if onNavigate is not available
      window.location.href = `/track?reportId=${reportId}`
    }
  }

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
            Report Waste Issue
          </h1>
          <p className="text-gray-300">Help us keep your community clean</p>
        </motion.div>

        <AnimatePresence>{showConfetti && <Confetti />}</AnimatePresence>

        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div
              key="success"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="min-h-screen flex items-center justify-center"
            >
              <motion.div
                className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-emerald-500/20 text-center max-w-md mx-4 relative overflow-hidden"
                initial={{ y: 50 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* Animated background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10"
                  animate={{
                    background: [
                      "linear-gradient(45deg, rgba(16, 185, 129, 0.1), rgba(20, 184, 166, 0.1))",
                      "linear-gradient(225deg, rgba(20, 184, 166, 0.1), rgba(16, 185, 129, 0.1))",
                      "linear-gradient(45deg, rgba(16, 185, 129, 0.1), rgba(20, 184, 166, 0.1))",
                    ],
                  }}
                  transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                />

                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="text-emerald-400 mb-4 relative z-10"
                >
                  <CheckCircle size={64} className="mx-auto" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="relative z-10"
                >
                  <h2 className="text-2xl font-bold mb-4 text-emerald-400">Report Submitted!</h2>
                  <p className="text-gray-300 mb-6">
                    Your report has been successfully submitted and is now being processed.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  className="bg-slate-700/50 rounded-lg p-4 mb-6 relative z-10 border border-teal-500/30"
                >
                  <p className="text-sm text-gray-400 mb-1">Your Report ID:</p>
                  <motion.p
                    className="text-xl font-mono font-bold text-teal-400"
                    animate={{
                      textShadow: [
                        "0 0 10px rgba(20, 184, 166, 0.5)",
                        "0 0 20px rgba(20, 184, 166, 0.8)",
                        "0 0 10px rgba(20, 184, 166, 0.5)",
                      ],
                    }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    {reportId}
                  </motion.p>
                  <p className="text-xs text-gray-500 mt-2">Save this ID to track your report</p>
                </motion.div>

                <div className="flex flex-col sm:flex-row gap-3 relative z-10">
                  <motion.button
                    onClick={resetForm}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 px-6 py-3 rounded-lg font-semibold"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    Submit Another
                  </motion.button>
                  <motion.button
                    onClick={handleTrackReport}
                    className="flex-1 bg-slate-700/50 border border-teal-500/30 px-6 py-3 rounded-lg font-semibold hover:bg-teal-500/10 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    Track Report
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-800/50 backdrop-blur-lg rounded-2xl p-8 border border-teal-500/20 relative overflow-hidden"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-emerald-500/5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              />

              <div className="relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg focus:border-teal-500 focus:outline-none transition-colors"
                      placeholder="Enter your name"
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="block text-sm font-medium text-gray-300 mb-2">Contact Info *</label>
                    <input
                      type="text"
                      required
                      value={formData.contact}
                      onChange={(e) => setFormData((prev) => ({ ...prev, contact: e.target.value }))}
                      className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg focus:border-teal-500 focus:outline-none transition-colors"
                      placeholder="Phone or email"
                    />
                  </motion.div>
                </div>

                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-2">Location *</label>
                  <div className="relative location-search-container">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <LocationSearch
                          onLocationSelect={handleLocationSelect}
                          placeholder="Search for any location (e.g., Sharda University, Sector 51, MG Road)"
                          className="w-full"
                        />
                      </div>
                      <motion.button
                        type="button"
                        onClick={getLocation}
                        className="px-4 py-3 bg-teal-500/20 border border-teal-500/40 rounded-lg hover:bg-teal-500/30 transition-colors flex items-center justify-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <MapPin size={20} />
                      </motion.button>
                    </div>
                    
                    
                  </div>
                  
                  {/* Selected Location Display */}
                  {selectedLocation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-emerald-400" />
                        <div>
                          <div className="text-emerald-400 text-sm font-medium">Selected Location</div>
                          <div className="text-gray-300 text-xs">{selectedLocation.display_name}</div>
                          <div className="text-gray-500 text-xs">
                            Coordinates: {parseFloat(selectedLocation.lat).toFixed(6)}, {parseFloat(selectedLocation.lon).toFixed(6)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-2">Issue Type *</label>
                  <select
                    required
                    value={formData.issueType}
                    onChange={(e) => setFormData((prev) => ({ ...prev, issueType: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg focus:border-teal-500 focus:outline-none transition-colors"
                  >
                    <option value="">Select issue type</option>
                    {issueTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </motion.div>

                <motion.div
                  className="mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg focus:border-teal-500 focus:outline-none transition-colors h-24 resize-none"
                    placeholder="Additional details about the issue"
                  />
                </motion.div>

                <motion.div
                  className="mb-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <label className="block text-sm font-medium text-gray-300 mb-2">Photo Evidence</label>
                  <motion.div
                    className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-teal-500/50 transition-colors"
                    whileHover={{ scale: 1.02 }}
                  >
                    <Camera className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-gray-400 mb-2">Click to upload or drag and drop</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData((prev) => ({ ...prev, photo: e.target.files?.[0] || null }))}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label
                      htmlFor="photo-upload"
                      className="inline-block px-4 py-2 bg-teal-500/20 border border-teal-500/40 rounded-lg cursor-pointer hover:bg-teal-500/30 transition-colors"
                    >
                      Choose File
                    </label>
                    {formData.photo && <p className="mt-2 text-sm text-teal-400">{formData.photo.name}</p>}
                  </motion.div>
                </motion.div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-500 via-teal-500 to-emerald-500 hover:from-blue-600 hover:via-teal-600 hover:to-emerald-600 px-8 py-4 rounded-lg font-semibold shadow-lg shadow-teal-500/25 transition-all duration-300 disabled:opacity-50 relative overflow-hidden transform hover:scale-105 hover:shadow-xl hover:shadow-teal-500/40"
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  {isSubmitting && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                      animate={{ x: ["0%", "100%"] }}
                      transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    />
                  )}
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <motion.div
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      />
                      Submitting...
                    </div>
                  ) : (
                    "Submit Report"
                  )}
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
