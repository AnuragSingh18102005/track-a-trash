import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('waste_tracker')
    const collection = db.collection('reports')

    // Get all reports
    const reports = await collection.find({}).toArray()

    // Calculate basic metrics
    const totalReports = reports.length
    const submitted = reports.filter(r => r.status === 'Submitted').length
    const inProgress = reports.filter(r => r.status === 'In Progress').length
    const resolved = reports.filter(r => r.status === 'Resolved').length
    const resolutionRate = totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0

    // Calculate average response time (simplified - using days since creation for resolved reports)
    const resolvedReports = reports.filter(r => r.status === 'Resolved')
    const avgResponseTime = resolvedReports.length > 0 
      ? Math.round(resolvedReports.reduce((sum, report) => {
          const daysSince = Math.floor((new Date() - new Date(report.createdAt)) / (1000 * 60 * 60 * 24))
          return sum + daysSince
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

    // Group reports by area (simplified - using GPS coordinates to determine area)
    const reportsByArea = {}
    reports.forEach(report => {
      let area = 'Downtown' // Default area
      
      if (report.gps) {
        // Simple area determination based on coordinates
        // This is a simplified approach - in a real app you'd have proper area mapping
        const lat = report.gps.latitude
        const lng = report.gps.longitude
        
        if (lat > 40.7) area = 'Residential'
        else if (lat > 40.6) area = 'Commercial'
        else if (lat > 40.5) area = 'Industrial'
        else area = 'Downtown'
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
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo)
      date.setDate(date.getDate() + i)
      const dayStart = new Date(date.setHours(0, 0, 0, 0))
      const dayEnd = new Date(date.setHours(23, 59, 59, 999))
      
      const dayReports = reports.filter(report => {
        const reportDate = new Date(report.createdAt)
        return reportDate >= dayStart && reportDate <= dayEnd
      }).length
      
      timelineData.push({
        date: date.toISOString().split('T')[0],
        count: dayReports
      })
    }

    // Calculate top areas (simplified scoring)
    const areaScores = {}
    reports.forEach(report => {
      let area = 'Downtown'
      if (report.gps) {
        const lat = report.gps.latitude
        if (lat > 40.7) area = 'Residential'
        else if (lat > 40.6) area = 'Commercial'
        else if (lat > 40.5) area = 'Industrial'
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
      reportsByArea: reportsByAreaArray,
      timelineData,
      topAreas: {
        cleanest: cleanestAreas,
        mostReported: mostReportedAreas
      }
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 