// src/lib/mongodb.ts
import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DATABASE || 'tax_management';

if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

// MongoDB connection options (แก้ไข SSL/TLS issues)
const options = {
  retryWrites: true,
  w: 'majority' as const,
  maxPoolSize: 10, // เพิ่ม connection pool
  serverSelectionTimeoutMS: 10000, // เพิ่ม timeout
  socketTimeoutMS: 30000, // เพิ่ม socket timeout
  connectTimeoutMS: 15000, // เพิ่ม connect timeout
  family: 4, // Use IPv4, skip trying IPv6
  // ลบ ssl: true เพื่อให้ MongoDB driver จัดการเอง
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDatabase(): Promise<Db> {
  try {
    const client = await clientPromise;
    return client.db(dbName);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    // Fallback: ลองเชื่อมต่อใหม่
    try {
      console.log('Attempting to reconnect to MongoDB...');
      if (!uri) {
        throw new Error('MongoDB URI is not defined');
      }
      const newClient = new MongoClient(uri, options);
      await newClient.connect();
      return newClient.db(dbName);
    } catch (fallbackError) {
      console.error('MongoDB fallback connection failed:', fallbackError);
      throw new Error('MongoDB connection failed. Please check your connection string and network access.');
    }
  }
}

// Connection health check
export async function checkConnection(): Promise<boolean> {
  try {
    const db = await getDatabase();
    await db.admin().ping();
    return true;
  } catch (error) {
    console.error('MongoDB health check failed:', error);
    return false;
  }
}

export default clientPromise;
