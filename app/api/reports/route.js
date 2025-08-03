import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST(request) {
  try {
    const { title, description, gps, locationDetails, photoUrl, reporter, contact } = await request.json()
    
    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('waste_tracker')
    const collection = db.collection('reports')

    // Parse GPS coordinates if provided as string
    let parsedGps = null
    if (gps) {
      if (typeof gps === 'string') {
        // Handle case where GPS is passed as "lat, lng" string
        const coords = gps.split(',').map(coord => parseFloat(coord.trim()))
        if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
          parsedGps = {
            latitude: coords[0],
            longitude: coords[1]
          }
        }
      } else if (typeof gps === 'object' && gps.latitude && gps.longitude) {
        // Handle case where GPS is passed as object
        parsedGps = {
          latitude: parseFloat(gps.latitude),
          longitude: parseFloat(gps.longitude)
        }
      }
    }

    const report = {
      title,
      description,
      gps: parsedGps,
      locationDetails: locationDetails || null,
      photoUrl: photoUrl || null,
      reporter: reporter || 'Anonymous',
      contact: contact || 'Not provided',
      status: 'Submitted',
      createdAt: new Date()
    }

    const result = await collection.insertOne(report)

    return NextResponse.json({
      success: true,
      id: result.insertedId
    })

  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('waste_tracker')
    const collection = db.collection('reports')

    const reports = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json(reports)

  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
} 