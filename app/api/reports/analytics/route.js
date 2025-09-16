import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('waste_tracker')
    const collection = db.collection('reports')

    // Get all reports
    const reports = await collection.find({}).toArray()

    // Indian locality names for area mapping
    const indianLocalities = [
      'Sector 45', 'Green Park', 'Indiranagar', 'MG Road', 'Koramangala',
      'Whitefield', 'Electronic City', 'HSR Layout', 'JP Nagar', 'Banashankari',
      'Rajajinagar', 'Malleshwaram', 'Basavanagudi', 'Jayanagar', 'Vijayanagar',
      'Hebbal', 'Yeshwanthpur', 'Peenya', 'Yelahanka', 'Marathahalli'
    ]

    // Calculate basic metrics
    const totalReports = reports.length
    const submitted = reports.filter(r => r.status === 'Submitted').length
    const inProgress = reports.filter(r => r.status === 'In Progress').length
    const resolved = reports.filter(r => r.status === 'Resolved').length
    const resolutionRate = totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0

    // Status distribution for pie chart
    const statusDistribution = [
      { name: 'Submitted', value: submitted, color: '#fbbf24' },
      { name: 'In Progress', value: inProgress, color: '#3b82f6' },
      { name: 'Resolved', value: resolved, color: '#10b981' }
    ]

    // Calculate average resolution time (in days) for resolved reports
    const resolvedReports = reports.filter(r => r.status === 'Resolved')
    const avgResponseTime = resolvedReports.length > 0 
      ? Math.round(resolvedReports.reduce((sum, report) => {
          const createdAt = new Date(report.createdAt)
          const resolvedAt = report.resolvedAt ? new Date(report.resolvedAt) : new Date(report.updatedAt || report.createdAt)
          const isValid = createdAt instanceof Date && !isNaN(createdAt) && resolvedAt instanceof Date && !isNaN(resolvedAt)
          const days = isValid ? Math.max(0, Math.floor((resolvedAt - createdAt) / (1000 * 60 * 60 * 24))) : 0
          return sum + days
        }, 0) / resolvedReports.length)
      : 0

    // Group reports by type (extract from title/description)
    const reportsByType = {}
    reports.forEach(report => {
      const title = report.title.toLowerCase()
      let type = 'Other'
      
      if (title.includes('overflow') || title.includes('bin') || title.includes('full')) {
        type = 'Overflowing Bin'
      } else if (title.includes('illegal') || title.includes('dump') || title.includes('litter')) {
        type = 'Illegal Dumping'
      } else if (title.includes('recycle') || title.includes('recycling')) {
        type = 'Recycling Request'
      } else if (title.includes('broken') || title.includes('equipment') || title.includes('damage')) {
        type = 'Broken Equipment'
      }
      
      reportsByType[type] = (reportsByType[type] || 0) + 1
    })

    // Convert to array format for charts
    const reportsByTypeArray = Object.entries(reportsByType).map(([type, count], index) => {
      const colors = ['bg-yellow-500', 'bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500']
      return {
        type,
        count,
        color: colors[index] || colors[colors.length - 1]
      }
    })

    // Group reports by area (using real location data)
    const reportsByArea = {}
    
    reports.forEach(report => {
      let area = 'Unknown Area'
      
      // Use locationDetails if available (from reverse geocoding)
      if (report.locationDetails && report.locationDetails.area) {
        area = report.locationDetails.area
      } else if (report.locationDetails && report.locationDetails.subLocality) {
        area = report.locationDetails.subLocality
      } else if (report.locationDetails && report.locationDetails.locality) {
        area = report.locationDetails.locality
      } else if (report.gps) {
        // Fallback: Use coordinates to determine area (simplified mapping)
        const lat = report.gps.latitude
        const lng = report.gps.longitude
        
        // Use modulo to distribute areas based on coordinates
        const index = Math.abs(Math.floor(lat * 1000) + Math.floor(lng * 1000)) % indianLocalities.length
        area = indianLocalities[index]
      }
      
      reportsByArea[area] = (reportsByArea[area] || 0) + 1
    })

    // Convert to array format with percentages
    const totalAreaReports = Object.values(reportsByArea).reduce((sum, count) => sum + count, 0)
    const reportsByAreaArray = Object.entries(reportsByArea).map(([area, count]) => ({
      area,
      count,
      percentage: totalAreaReports > 0 ? Math.round((count / totalAreaReports) * 100) : 0
    }))

    // Generate timeline data (reports by day for the last 30 days)
    const timelineData = []
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29) // Include today, so 30 days total
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo)
      date.setDate(date.getDate() + i)
      
      // Set to start and end of day in local timezone
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
      
      const dayReports = reports.filter(report => {
        const reportDate = new Date(report.createdAt)
        if (!(reportDate instanceof Date) || isNaN(reportDate)) return false
        return reportDate >= dayStart && reportDate <= dayEnd
      }).length
      
      timelineData.push({
        date: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        count: dayReports
      })
    }

    // Waste Category Breakdown - Use the title field which contains the issue type
    const wasteCategories = {
      'Overflowing Bin': 0,
      'Illegal Dumping': 0,
      'Recycling Request': 0,
      'Broken Equipment': 0,
      'Other': 0
    }

    // Fixed color assignments for categories
    const categoryColors = {
      'Overflowing Bin': '#ef4444',    // Red
      'Illegal Dumping': '#f97316',    // Orange
      'Recycling Request': '#10b981',  // Green
      'Broken Equipment': '#3b82f6',   // Blue
      'Other': '#6b7280'               // Gray
    }

    reports.forEach(report => {
      const issueType = report.title || 'Other'
      if (wasteCategories.hasOwnProperty(issueType)) {
        wasteCategories[issueType]++
      } else {
        wasteCategories['Other']++
      }
    })

    const wasteCategoryData = Object.entries(wasteCategories)
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => ({
        name: category,
        value: count,
        color: categoryColors[category] || categoryColors['Other']
      }))

    // Resolution Metrics - Use actual createdAt and resolvedAt fields
    const resolvedReportsForMetrics = reports.filter(r => r.status === 'Resolved')
    
    // Helper function to calculate resolution time in days
    const calculateResolutionTime = (report) => {
      const createdAt = new Date(report.createdAt)
      const resolvedAt = report.resolvedAt ? new Date(report.resolvedAt) : new Date(report.updatedAt || report.createdAt)
      if ((!(createdAt instanceof Date) || isNaN(createdAt)) || (!(resolvedAt instanceof Date) || isNaN(resolvedAt))) {
        return 0
      }
      const daysToResolve = Math.floor((resolvedAt - createdAt) / (1000 * 60 * 60 * 24))
      return Math.max(0, daysToResolve)
    }

    const onTimeResolved = resolvedReportsForMetrics.filter(report => {
      const daysToResolve = calculateResolutionTime(report)
      return daysToResolve <= 7 // Consider resolved within 7 days as "on time"
    }).length

    // Calculate resolution time trend (compare current week vs previous week)
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

    const currentWeekResolved = resolvedReportsForMetrics.filter(report => {
      const resolvedDate = report.resolvedAt ? new Date(report.resolvedAt) : new Date(report.updatedAt || report.createdAt)
      return resolvedDate >= oneWeekAgo
    })
    
    const previousWeekResolved = resolvedReportsForMetrics.filter(report => {
      const resolvedDate = report.resolvedAt ? new Date(report.resolvedAt) : new Date(report.updatedAt || report.createdAt)
      return resolvedDate >= twoWeeksAgo && resolvedDate < oneWeekAgo
    })

    const currentWeekAvg = currentWeekResolved.length > 0 
      ? Math.round(currentWeekResolved.reduce((sum, report) => {
          return sum + calculateResolutionTime(report)
        }, 0) / currentWeekResolved.length)
      : 0

    const previousWeekAvg = previousWeekResolved.length > 0 
      ? Math.round(previousWeekResolved.reduce((sum, report) => {
          return sum + calculateResolutionTime(report)
        }, 0) / previousWeekResolved.length)
      : 0

    const resolutionTrend = {
      current: currentWeekAvg,
      previous: previousWeekAvg,
      change: previousWeekAvg > 0 ? currentWeekAvg - previousWeekAvg : 0,
      direction: previousWeekAvg > 0 ? (currentWeekAvg < previousWeekAvg ? 'faster' : 'slower') : 'stable'
    }

    // Generate resolution time data for the last 7 days (including today)
    const resolutionTimeData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      // Set to start and end of day in local timezone
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
      
      const dayResolved = resolvedReportsForMetrics.filter(report => {
        const resolvedDate = report.resolvedAt ? new Date(report.resolvedAt) : new Date(report.updatedAt || report.createdAt)
        if (!(resolvedDate instanceof Date) || isNaN(resolvedDate)) return false
        return resolvedDate >= dayStart && resolvedDate <= dayEnd
      })

      const dayAvgTime = dayResolved.length > 0 
        ? Math.round(dayResolved.reduce((sum, report) => {
            return sum + calculateResolutionTime(report)
          }, 0) / dayResolved.length)
        : 0

      resolutionTimeData.push({
        date: date.toISOString().split('T')[0],
        displayDate: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        avgTime: dayAvgTime
      })
    }

    const resolutionMetrics = {
      averageResolutionTime: resolvedReportsForMetrics.length > 0 
        ? Math.round(resolvedReportsForMetrics.reduce((sum, report) => {
            return sum + calculateResolutionTime(report)
          }, 0) / resolvedReportsForMetrics.length)
        : 0,
      onTimePercentage: resolvedReportsForMetrics.length > 0 ? Math.round((onTimeResolved / resolvedReportsForMetrics.length) * 100) : 0,
      delayedPercentage: resolvedReportsForMetrics.length > 0 ? Math.round(((resolvedReportsForMetrics.length - onTimeResolved) / resolvedReportsForMetrics.length) * 100) : 0,
      trend: resolutionTrend,
      weeklyData: resolutionTimeData
    }

    // Top Reporters Leaderboard
    const reporterStats = {}
    reports.forEach(report => {
      const reporterName = report.reporter || 'Anonymous'
      if (!reporterStats[reporterName]) {
        reporterStats[reporterName] = {
          name: reporterName,
          reports: 0,
          resolved: 0
        }
      }
      reporterStats[reporterName].reports++
      if (report.status === 'Resolved') {
        reporterStats[reporterName].resolved++
      }
    })

    const topReporters = Object.entries(reporterStats)
      .map(([name, stats]) => ({
        id: name,
        name: stats.name,
        reports: stats.reports,
        resolved: stats.resolved,
        points: stats.reports + stats.resolved, // Points = reports submitted + resolved
        resolutionRate: stats.reports > 0 ? Math.round((stats.resolved / stats.reports) * 100) : 0
      }))
      .sort((a, b) => b.points - a.points) // Sort by points instead of just reports
      .slice(0, 5)

    // Calculate top areas (using real location data)
    const areaScores = {}
    
    reports.forEach(report => {
      let area = 'Unknown Area'
      
      // Use locationDetails if available (from reverse geocoding)
      if (report.locationDetails && report.locationDetails.area) {
        area = report.locationDetails.area
      } else if (report.locationDetails && report.locationDetails.subLocality) {
        area = report.locationDetails.subLocality
      } else if (report.locationDetails && report.locationDetails.locality) {
        area = report.locationDetails.locality
      } else if (report.gps) {
        // Fallback: Use coordinates to determine area (simplified mapping)
        const lat = report.gps.latitude
        const lng = report.gps.longitude
        
        // Use modulo to distribute areas based on coordinates
        const index = Math.abs(Math.floor(lat * 1000) + Math.floor(lng * 1000)) % indianLocalities.length
        area = indianLocalities[index]
      }
      
      if (!areaScores[area]) {
        areaScores[area] = { reports: 0, resolved: 0 }
      }
      areaScores[area].reports++
      if (report.status === 'Resolved') {
        areaScores[area].resolved++
      }
    })

    // Calculate cleanest areas (higher resolution rate = cleaner)
    const cleanestAreas = Object.entries(areaScores)
      .map(([name, data]) => ({
        name,
        score: data.reports > 0 ? Math.round((data.resolved / data.reports) * 100) : 100,
        trend: '+2%' // Placeholder trend
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    // Most reported areas
    const mostReportedAreas = Object.entries(areaScores)
      .map(([name, data]) => ({
        name,
        reports: data.reports,
        trend: '-2%' // Placeholder trend
      }))
      .sort((a, b) => b.reports - a.reports)
      .slice(0, 3)

    return NextResponse.json({
      metrics: {
        totalReports,
        resolutionRate,
        avgResponseTime,
        activeAreas: Object.keys(areaScores).length
      },
      reportsByType: reportsByTypeArray,
      statusDistribution,
      timelineData,
      wasteCategoryData,
      resolutionMetrics,
      topReporters
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 