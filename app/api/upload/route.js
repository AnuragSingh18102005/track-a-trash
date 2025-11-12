import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { v2 as cloudinary } from 'cloudinary';

// configure cloudinary from env vars
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadBufferToCloudinary(fileBuffer, filename) {
  const tmpPath = path.join(os.tmpdir(), filename);
  // write to /tmp (writable in serverless)
  await fs.writeFile(tmpPath, fileBuffer);

  try {
    const result = await cloudinary.uploader.upload(tmpPath, {
      folder: 'reports',
      use_filename: true,
      unique_filename: true,
    });
    return result;
  } finally {
    // best-effort cleanup
    try {
      await fs.unlink(tmpPath);
    } catch (e) {
      console.warn('Failed to delete tmp file', tmpPath, e);
    }
  }
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const filename = `report_${timestamp}.${fileExtension}`;

    // get buffer from the uploaded file blob
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary using temp file
    const uploadResult = await uploadBufferToCloudinary(buffer, filename);

    // return the secure URL from Cloudinary
    const photoUrl = uploadResult.secure_url || uploadResult.url || null;

    return NextResponse.json({
      success: true,
      photoUrl,
      providerResponse: { public_id: uploadResult.public_id },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// unsupported methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
export async function PATCH() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
