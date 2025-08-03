"use client"

import { useEffect, useRef, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'

interface GooglePlacesAutocompleteProps {
  onPlaceSelect: (place: any) => void
  placeholder?: string
  className?: string
}

declare global {
  interface Window {
    google: typeof google
  }
}

export default function GooglePlacesAutocomplete({ 
  onPlaceSelect, 
  placeholder = "Search for a location...",
  className = ""
}: GooglePlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Wait for Google Maps API to load
    const initAutocomplete = () => {
      if (window.google && window.google.maps && inputRef.current) {
        try {
          autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
            types: ['establishment', 'geocode'],
            componentRestrictions: { country: 'in' },
            fields: ['place_id', 'geometry', 'formatted_address', 'name', 'address_components']
          })

          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current?.getPlace()
            if (place && place.geometry && place.geometry.location) {
              setIsLoading(true)
              
              // Get detailed place information
              const service = new window.google.maps.places.PlacesService(
                document.createElement('div')
              )
              
              service.getDetails(
                {
                  placeId: place.place_id,
                  fields: ['place_id', 'geometry', 'formatted_address', 'name', 'address_components']
                },
                (result, status) => {
                  setIsLoading(false)
                  if (status === window.google.maps.places.PlacesServiceStatus.OK && result) {
                    onPlaceSelect(result)
                  }
                }
              )
            }
          })
        } catch (error) {
          console.error('Error initializing Google Places Autocomplete:', error)
        }
      }
    }

    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      initAutocomplete()
    } else {
      // Wait for Google Maps API to load
      const checkGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkGoogleMaps)
          initAutocomplete()
        }
      }, 100)

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkGoogleMaps)
        console.error('Google Maps API failed to load')
      }, 10000)
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [onPlaceSelect])

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        className="w-full px-4 py-3 pl-10 bg-slate-700/50 border border-gray-600 rounded-lg focus:border-teal-500 focus:outline-none transition-colors"
      />
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
        {isLoading ? (
          <Loader2 size={16} className="text-gray-400 animate-spin" />
        ) : (
          <Search size={16} className="text-gray-400" />
        )}
      </div>
    </div>
  )
} 