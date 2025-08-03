import { NextResponse } from 'next/server'
import clientPromise from '../../../lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db()
    
    // Test the connection by listing collections
    const collections = await db.listCollections().toArray()
    
    return NextResponse.json({
      success: true,
      message: 'MongoDB connection successful',
      collections: collections.map(col => col.name),
      uri: process.env.MONGODB_URI ? 
        process.env.MONGODB_URI.substring(0, 20) + '...' : 
        'MONGODB_URI not found'
    })
  } catch (error) {
    console.error('MongoDB connection error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      uri: process.env.MONGODB_URI ? 
        process.env.MONGODB_URI.substring(0, 20) + '...' : 
        'MONGODB_URI not found'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    const client = await clientPromise
    const db = client.db('waste_tracker')
    const collection = db.collection('reports')

    // Sample reports for testing analytics
    const sampleReports = [
      {
        title: "Overflowing bin on Main Street",
        description: "The garbage bin is completely full and trash is spilling out",
        status: "Submitted",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        gps: { latitude: 40.7128, longitude: -74.0060 }
      },
      {
        title: "Illegal dumping in park",
        description: "Someone dumped construction debris in the park",
        status: "In Progress",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        gps: { latitude: 40.7589, longitude: -73.9851 }
      },
      {
        title: "Recycling bin request",
        description: "Need a new recycling bin for apartment building",
        status: "Resolved",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        gps: { latitude: 40.7505, longitude: -73.9934 }
      },
      {
        title: "Broken equipment at waste facility",
        description: "The compactor is not working properly",
        status: "Resolved",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        gps: { latitude: 40.7648, longitude: -73.9808 }
      },
      {
        title: "Overflowing bin in residential area",
        description: "Multiple bins are overflowing in the neighborhood",
        status: "Submitted",
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        gps: { latitude: 40.7829, longitude: -73.9654 }
      },
      {
        title: "Illegal dumping near river",
        description: "Large amount of waste dumped near the river",
        status: "In Progress",
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        gps: { latitude: 40.7614, longitude: -73.9776 }
      },
      {
        title: "Recycling program expansion request",
        description: "Request to expand recycling program to more areas",
        status: "Resolved",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        gps: { latitude: 40.7505, longitude: -73.9934 }
      },
      {
        title: "Broken trash compactor",
        description: "The industrial trash compactor needs repair",
        status: "Submitted",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        gps: { latitude: 40.7648, longitude: -73.9808 }
      }
    ]

    // Clear existing reports and insert sample data
    await collection.deleteMany({})
    const result = await collection.insertMany(sampleReports)

    return NextResponse.json({
      success: true,
      message: 'Sample data added successfully',
      insertedCount: result.insertedCount
    })

  } catch (error) {
    console.error('Error adding sample data:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      message: 'Failed to add sample data'
    }, { status: 500 })
  }
} 