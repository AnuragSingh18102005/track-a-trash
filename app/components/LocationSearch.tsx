"use client"

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

interface LocationSearchProps {
  onLocationSelect: (location: any) => void
  placeholder?: string
  className?: string
}

export default function LocationSearch({ 
  onLocationSelect, 
  placeholder = "Search for any location...",
  className = ""
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const suppressNextSearchRef = useRef(false)

  // Search locations using Nominatim (fallback)
  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=in`
      )
      const data = await response.json()
      setSearchResults(data)
      setShowResults(true)
    } catch (error) {
      console.error('Error searching locations:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (suppressNextSearchRef.current) {
        // Skip one debounced search right after selection
        suppressNextSearchRef.current = false
        return
      }
      if (searchQuery.trim()) {
        searchLocations(searchQuery)
      } else {
        setSearchResults([])
        setShowResults(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleLocationSelect = (location: any) => {
    onLocationSelect(location)
    setSearchQuery(location.display_name)
    setShowResults(false)
    // Prevent the immediate debounced search from reopening the dropdown
    suppressNextSearchRef.current = true
  }

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            const val = e.target.value
            setSearchQuery(val)
            if (!val.trim()) {
              // Clear results and inform parent to clear selection
              setSearchResults([])
              setShowResults(false)
              suppressNextSearchRef.current = true
              try { onLocationSelect(null as any) } catch {}
            }
          }}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-10 bg-slate-700/50 border border-gray-600 rounded-lg focus:border-teal-500 focus:outline-none transition-colors"
        />
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <Loader2 size={16} className="text-gray-400 animate-spin" />
          ) : (
            <Search size={16} className="text-gray-400" />
          )}
        </div>
      </div>
      
      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-20 w-full mt-2 bg-slate-800/95 backdrop-blur-lg border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {searchResults.map((result, index) => (
            <motion.button
              key={index}
              onClick={() => handleLocationSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors border-b border-gray-700/50 last:border-b-0"
              whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.5)' }}
            >
              <div className="text-white font-medium text-sm">{result.display_name.split(',')[0]}</div>
              <div className="text-gray-400 text-xs mt-1">{result.display_name}</div>
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  )
} 