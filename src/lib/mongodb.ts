// src/lib/mongodb.ts
import { MongoClient, Db } from 'mongodb';

// MongoDB connection configuration
const getMongoConfig = () => {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DATABASE || 'tax_management';
  
  if (!uri) {
    console.warn('MongoDB URI not found in environment variables');
    return null;
  }
  
  return { uri, dbName };
};

// MongoDB connection options (เหมาะกับ Netlify Functions)
const options = {
  retryWrites: true,
  w: 'majority' as const,
  maxPoolSize: 10, // connection pool สำหรับ production
  minPoolSize: 2, // เพิ่ม minPoolSize สำหรับ serverless
  serverSelectionTimeoutMS: 10000, // ลด timeout สำหรับ serverless
  socketTimeoutMS: 30000, // ลด socket timeout
  connectTimeoutMS: 10000, // ลด connect timeout
  family: 4, // Use IPv4, skip trying IPv6
  // SSL options สำหรับ production
  ssl: true,
  // เพิ่ม authSource
  authSource: 'admin',
  // เพิ่ม retry options
  retryReads: true,
  // เพิ่ม options สำหรับ serverless
  maxIdleTimeMS: 30000, // ปิด connection หลัง idle
  heartbeatFrequencyMS: 10000, // ลด heartbeat frequency
};

let client: MongoClient;
let clientPromise: Promise<MongoClient> | null = null;

// Initialize MongoDB connection only when needed
const initializeConnection = () => {
  const config = getMongoConfig();
  if (!config) {
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(config.uri, options);
      globalWithMongo._mongoClientPromise = client.connect();
    }
    return globalWithMongo._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(config.uri, options);
    return client.connect();
  }
};

export async function getDatabase(): Promise<Db> {
  try {
    // Initialize connection if not already done
    if (!clientPromise) {
      clientPromise = initializeConnection();
    }
    
    if (!clientPromise) {
      throw new Error('MongoDB URI not configured. Please set MONGODB_URI environment variable.');
    }
    
    const client = await clientPromise;
    const config = getMongoConfig();
    if (!config) {
      throw new Error('MongoDB configuration not available');
    }
    
    return client.db(config.dbName);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    // Fallback: ลองเชื่อมต่อใหม่
    try {
      console.log('Attempting to reconnect to MongoDB...');
      const config = getMongoConfig();
      if (!config) {
        throw new Error('MongoDB URI is not defined');
      }
      const newClient = new MongoClient(config.uri, options);
      await newClient.connect();
      return newClient.db(config.dbName);
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
