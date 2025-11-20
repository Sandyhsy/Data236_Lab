import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017";
const MONGO_DB = process.env.MONGO_DB || "lab2";

// Optimize MongoDB connection with connection pooling and performance settings
export const client = new MongoClient(MONGO_URL, {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 2, // Maintain at least 2 socket connections
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  serverSelectionTimeoutMS: 5000, // How long to try selecting a server
  socketTimeoutMS: 45000, // How long a send or receive on a socket can take before timeout
  connectTimeoutMS: 10000, // How long to wait for initial connection
  retryWrites: true, // Enable retryable writes
  retryReads: true, // Enable retryable reads
});

await client.connect();
export const db = client.db(MONGO_DB);

/**
 * Get an auto-incrementing sequence number like MySQL AUTO_INCREMENT.
 * This uses a "counters" collection: { _id: <name>, seq: <number> }.
 * Example: const nextUserId = await getNextSequence("userid");
 */
export async function getNextSequence(name) {
  // Use findOneAndUpdate with upsert for atomic operation
  // Note: Cannot use $inc and $setOnInsert on the same field (seq)
  // Solution: Only set _id in $setOnInsert, let $inc handle seq (it will initialize to 1 if missing)
  const res = await db.collection("counters").findOneAndUpdate(
    { _id: name },
    { 
      $inc: { seq: 1 },
      $setOnInsert: { _id: name } // Only set _id if inserting new document, don't set seq here
    },
    { 
      upsert: true, 
      returnDocument: "after" 
    }
  );
  
  // Return the sequence number
  if (res && res.value && res.value.seq !== undefined) {
    return res.value.seq;
  }
  
  // Fallback: if findOneAndUpdate didn't work (shouldn't happen with upsert)
  const counter = await db.collection("counters").findOne({ _id: name });
  if (counter && counter.seq !== undefined) {
    await db.collection("counters").updateOne(
      { _id: name },
      { $inc: { seq: 1 } }
    );
    return counter.seq + 1;
  }
  
  // Last resort: return 1
  await db.collection("counters").insertOne({ _id: name, seq: 1 });
  return 1;
}
