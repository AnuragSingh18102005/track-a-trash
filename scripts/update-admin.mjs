import 'dotenv/config'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcryptjs'

const uri = process.env.MONGODB_URI

if (!uri) {
  console.error('Missing MONGODB_URI environment variable.')
  process.exit(1)
}

// Get admin credentials from environment variables
const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
const newPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!'
const newName = process.env.ADMIN_NAME || 'Admin'
const newEmail = process.env.ADMIN_NEW_EMAIL || adminEmail // Optional: change email
const databaseName = process.env.MONGODB_DB || 'waste_tracker'

async function updateAdmin() {
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db(databaseName)
    const users = db.collection('users')

    // Find the admin user by current email
    const existingAdmin = await users.findOne({ email: adminEmail.toLowerCase(), role: 'admin' })
    
    if (!existingAdmin) {
      console.error(`Admin user with email ${adminEmail} not found.`)
      console.log('Creating new admin user...')
      
      // Create new admin if not found
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      await users.insertOne({
        email: newEmail.toLowerCase(),
        name: newName,
        role: 'admin',
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: null,
      })
      console.log(`✅ Admin user created: ${newEmail}`)
      return
    }

    // Prepare update object
    const updateFields = {
      name: newName,
      updatedAt: new Date(),
    }

    // Update password if provided
    if (newPassword) {
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      updateFields.password = hashedPassword
    }

    // Update email if changed
    if (newEmail.toLowerCase() !== adminEmail.toLowerCase()) {
      updateFields.email = newEmail.toLowerCase()
      console.log(`📧 Email will be changed from ${adminEmail} to ${newEmail}`)
    }

    // Update the admin user
    const result = await users.updateOne(
      { email: adminEmail.toLowerCase(), role: 'admin' },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      console.error(`Admin user with email ${adminEmail} not found.`)
      process.exitCode = 1
      return
    }

    console.log(`✅ Admin user updated successfully!`)
    console.log(`   Email: ${newEmail.toLowerCase()}`)
    console.log(`   Name: ${newName}`)
    if (newPassword) {
      console.log(`   Password: Updated`)
    }
  } catch (error) {
    console.error('Failed to update admin user:', error)
    process.exitCode = 1
  } finally {
    await client.close()
  }
}

updateAdmin()

