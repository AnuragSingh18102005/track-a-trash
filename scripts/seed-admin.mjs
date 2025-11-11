import 'dotenv/config'
import { MongoClient } from 'mongodb'
import bcrypt from 'bcrypt'

const uri = process.env.MONGODB_URI

if (!uri) {
  console.error('Missing MONGODB_URI environment variable.')
  process.exit(1)
}

const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!'
const adminName = process.env.ADMIN_NAME || 'Admin'
const databaseName = process.env.MONGODB_DB || 'waste_tracker'

async function seedAdmin() {
  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db(databaseName)
    const users = db.collection('users')

    const hashedPassword = await bcrypt.hash(adminPassword, 12)

    await users.updateOne(
      { email: adminEmail.toLowerCase() },
      {
        $set: {
          email: adminEmail.toLowerCase(),
          name: adminName,
          role: 'admin',
          password: hashedPassword,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
          emailVerified: null,
        },
      },
      { upsert: true }
    )

    console.log(`Admin user ensured for ${adminEmail}.`)
  } catch (error) {
    console.error('Failed to seed admin user:', error)
    process.exitCode = 1
  } finally {
    await client.close()
  }
}

seedAdmin()

