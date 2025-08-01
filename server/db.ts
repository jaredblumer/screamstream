import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure WebSocket constructor for serverless environment
if (typeof neonConfig.webSocketConstructor === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}

// Configure fetch-based queries for better stability
neonConfig.poolQueryViaFetch = true;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Create connection pool with conservative settings
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 1, // Single connection for serverless
  idleTimeoutMillis: 0, // Disable idle timeout
  connectionTimeoutMillis: 0, // Disable connection timeout
});

// Initialize database with error handling
export const db = drizzle({ client: pool, schema });

// Test database connection
pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

// Optional: Log successful connection
pool.on('connect', () => {
  console.log('Database connection established');
});