import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function PATCH(request, { params }) {
  try {
    const { id } = params
    const { status } = await request.json()

    // Validate status
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      )
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid report ID format' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('waste_tracker')
    const collection = db.collection('reports')

    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status } }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Report status updated successfully'
    })

  } catch (error) {
    console.error('Error updating report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid report ID format' },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('waste_tracker')
    const collection = db.collection('reports')

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET(request, { params }) {
  try {
    const { id } = params

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid report ID format" },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db('waste_tracker')
    const collection = db.collection('reports')

    const report = await collection.findOne({ _id: new ObjectId(id) })

    if (!report) {
      return NextResponse.json(
        { success: false, error: "Report not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(report)

  } catch (error) {
    console.error('Error fetching report:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
} 