import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('waste_tracker')
    const collection = db.collection('reports')

    // Get total number of reports
    const totalReports = await collection.countDocuments()

    // Get count of reports with status "In Progress"
    const inProgress = await collection.countDocuments({ status: "In Progress" })

    // Get count of reports with status "Resolved"
    const resolved = await collection.countDocuments({ status: "Resolved" })

    // Calculate success rate (resolved / total * 100) rounded to whole number
    const successRate = totalReports > 0 ? Math.round((resolved / totalReports) * 100) : 0

    return NextResponse.json({
      totalReports,
      inProgress,
      resolved,
      successRate
    })

  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 