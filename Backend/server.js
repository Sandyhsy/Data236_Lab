import express from "express";
import cors from "cors";
import session from "express-session";
import dotenv from "dotenv";
import { Kafka } from "kafkajs";

dotenv.config();

import authRoutes from "./routes/auth.js";
import ownerRoutes from "./routes/owner.js";
import propertyRoutes from "./routes/properties.js";
import bookingRoutes from "./routes/bookings.js";
import uploadRoutes from "./routes/uploads.js";
import propertyImageRoutes from "./routes/images.js";
import profileRoutes from "./routes/profile.js";
import searchRoutes from "./routes/search.js"
import favoriteRoutes from "./routes/favorites.js"
import aiRoutes from "./routes/ai.js";
import { seedDatabase } from "./seedData.js";



const app = express();
const kafka = new Kafka({
  clientId: "booking-service",
  brokers: (process.env.KAFKA_BROKERS || "kafka:9092").split(",")
});

console.log("Using brokers:", (process.env.KAFKA_BROKERS || "kafka:9092"));

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "group_bookings" });

const topicHandlers = new Map();
function subscribeKafka(topic, handler) {
  if (!topicHandlers.has(topic)) topicHandlers.set(topic, []);
  topicHandlers.get(topic).push(handler);
  consumer.subscribe({ topic, fromBeginning: false }).catch(console.error);
}





await producer.connect();
await consumer.connect();
import {updateBookingKafka} from "./routes/bookings.js";
updateBookingKafka(subscribeKafka);
await consumer.run({
  eachMessage: async ({ topic, message }) => {
    const handlers = topicHandlers.get(topic) || [];
    const message_parsed = JSON.parse(message.value.toString());
    if (!handlers.length) return;
    for (const handler of handlers) {
      try { await handler(message_parsed); } catch { console.error("handler error:"); }
    }
  }
});

try {
  await seedDatabase();
  console.log("Seed data ready");
} catch (err) {
  console.error("Failed to seed database:", err);
}

const allowAllCors = (process.env.ALLOW_ALL_CORS || "false").toLowerCase() === "true";
const allowedOrigins = (process.env.CLIENT_ORIGIN || process.env.CLIENT_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: allowAllCors
    ? true
    : (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error("Not allowed by CORS"));
      },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "dev_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false, // set true only if using HTTPS
    sameSite: "lax"    // good default for SPA + API on localhost
  }
}));


app.use("/api/auth", authRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/properties", propertyImageRoutes);
app.use("/api/search", searchRoutes);
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api",profileRoutes)
app.use("/api/search", searchRoutes)
app.use("/api/favorites", favoriteRoutes)
app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));

export { producer, subscribeKafka};
