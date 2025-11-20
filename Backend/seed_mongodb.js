// Backend/seed_mongodb.js
import { MongoClient } from "mongodb";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017";
const MONGO_DB = process.env.MONGO_DB || "lab2";

const client = new MongoClient(MONGO_URL);

async function main() {
  await client.connect();
  const db = client.db(MONGO_DB);

  // Clean collections
  for (const name of ["users","properties","property_images","favorites","bookings","counters","sessions"]) {
    await db.collection(name).deleteMany({});
  }

  // counters init
  await db.collection("counters").insertMany([
    { _id: "userid", seq: 4 },      // highest user_id in dump is 4
    { _id: "propertyid", seq: 2 },  // highest property_id is 2
    { _id: "bookingid", seq: 5 },   // highest booking_id is 5
    { _id: "favoriteid", seq: 1 },  // highest favorite_id is 1
    { _id: "imageid", seq: 19 }     // highest image_id is 19
  ]);

  // USERS (from lab2.sql)
  const users = [
    {
      user_id: 1, role: "owner", name: "Shao-Yu Huang", email: "shao-yu.huang@sjsu.edu",
      password_hash: "$2b$10$Xw5YsWv30C6X.kxtHd1GguWu57Wj37XAAb2nej689JiUdR.4Ep6du",
      phone: "6693336161", about_me: "Hello", city: "CA", country: "United States",
      languages: "English", gender: "Female",
      profile_picture: "https://lab1-host-images.s3.us-east-2.amazonaws.com/profiles%2F1%2Fbd1ff6a0-cb5f-427f-a530-51e97a523409.png",
      created_at: new Date("2025-10-15T15:59:37Z")
    },
    {
      user_id: 2, role: "owner", name: "Alice", email: "alice@example.com",
      password_hash: "$2b$10$GA.7SU6Zupb362i3b8RWUetwRMsP67fqa8wirCu3qc9r32A80olG.",
      phone: null, about_me: null, city: null, country: null, languages: null, gender: null,
      profile_picture: null, created_at: new Date("2025-10-15T22:08:32Z")
    },
    {
      user_id: 3, role: "traveler", name: "Taylor Swift", email: "taylor.swift@sjsu.edu",
      password_hash: "$2b$10$hMlF9U2wzGZidaTbm2d/.etOMIyUnqrBzTVfqH7cmd7tUOJ09OXSi",
      phone: "6691234567", about_me: null, city: "CA", country: "United States",
      languages: null, gender: null,
      profile_picture: "https://lab1-host-images.s3.us-east-2.amazonaws.com/profiles%2F3%2Fd8d0fc3f-f81b-41b1-9eeb-9878f146ef61.png",
      created_at: new Date("2025-10-23T21:31:17Z")
    },
    {
      user_id: 4, role: "traveler", name: "Simon Shim", email: "simon.shim@sjsu.edu",
      password_hash: "$2b$10$bqe.4Ch8VYas.3JCxCueiO7mICW8HgcTUXoLDbOxS3cUDrJFvZ6lm",
      phone: null, about_me: null, city: null, country: null, languages: null, gender: null,
      profile_picture: null, created_at: new Date("2025-10-23T22:55:06Z")
    }
  ];

  // PROPERTIES
  const properties = [
    {
      property_id: 1, owner_id: 1, name: "Mission Family House", type: "House",
      description: "Cozy and quiet neighborhood, walking distance to Safeway and a lovely park.",
      location: "San Jose, USA",
      amenities: "WiFi, Heating, Kitchen, Parking, Backyard, Dishwasher",
      price_per_night: 320.00, bedrooms: 3, bathrooms: 3,
      availability_start: new Date("2025-10-27"),
      availability_end: new Date("2025-10-31"),
      created_at: new Date("2025-10-15T20:23:25Z")
    },
    {
      property_id: 2, owner_id: 2, name: "Montmartre Artist Studio", type: "Studio",
      description: "Small but comfy and with nice view",
      location: "Paris, France",
      amenities: "WiFi, Heating, Coffee Maker, Microwave",
      price_per_night: 75.00, bedrooms: 1, bathrooms: 1,
      availability_start: new Date("2025-10-20"),
      availability_end: new Date("2025-12-20"),
      created_at: new Date("2025-10-15T22:34:21Z")
    }
  ];

  // PROPERTY_IMAGES
  const property_images = [
    { image_id: 14, property_id: 2, url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F10%2Fd3bf5296-5926-4ccb-af4c-b9dbe33357d5.png", created_at: new Date("2025-10-15T23:01:23Z") },
    { image_id: 15, property_id: 2, url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F10%2F86423da8-74ff-4e90-9b53-e5785a3d91d6.png", created_at: new Date("2025-10-15T23:01:23Z") },
    { image_id: 16, property_id: 2, url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F10%2Fdf242bef-6e86-41c8-89a7-15e34b0f9488.png", created_at: new Date("2025-10-15T23:01:23Z") },
    { image_id: 17, property_id: 1, url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F8%2Fafb67ce7-c653-45ff-a6f2-20d634a646f8.png", created_at: new Date("2025-10-27T21:17:54Z") },
    { image_id: 18, property_id: 1, url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F8%2Fec2e0413-3564-418e-bb18-b1cabb0a1a05.png", created_at: new Date("2025-10-27T21:17:54Z") },
    { image_id: 19, property_id: 1, url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F8%2F57eaa561-7f9c-4558-8f78-8f621065c769.png", created_at: new Date("2025-10-27T21:17:54Z") }
  ];

  // FAVORITES
  const favorites = [
    { favorite_id: 1, traveler_id: 3, property_id: 1, created_at: new Date("2025-10-26T05:22:27Z") }
  ];

  // BOOKINGS
  const bookings = [
    { booking_id: 1, traveler_id: 3, property_id: 1, start_date: new Date("2025-10-25"), end_date: new Date("2025-10-26"), guests: null, status: "CANCELLED", created_at: new Date("2025-10-26T05:23:06Z") },
    { booking_id: 2, traveler_id: 3, property_id: 2, start_date: new Date("2025-10-29"), end_date: new Date("2025-10-31"), guests: null, status: "PENDING", created_at: new Date("2025-10-26T06:01:41Z") },
    { booking_id: 3, traveler_id: 3, property_id: 1, start_date: new Date("2025-11-11"), end_date: new Date("2025-11-14"), guests: null, status: "ACCEPTED", created_at: new Date("2025-10-26T07:00:33Z") },
    { booking_id: 4, traveler_id: 3, property_id: 2, start_date: new Date("2025-10-27"), end_date: new Date("2025-10-28"), guests: null, status: "PENDING", created_at: new Date("2025-10-27T22:07:41Z") },
    { booking_id: 5, traveler_id: 3, property_id: 1, start_date: new Date("2025-11-03"), end_date: new Date("2025-11-13"), guests: null, status: "PENDING", created_at: new Date("2025-11-07T00:46:10Z") }
  ];

  await db.collection("users").insertMany(users);
  await db.collection("properties").insertMany(properties);
  await db.collection("property_images").insertMany(property_images);
  await db.collection("favorites").insertMany(favorites);
  await db.collection("bookings").insertMany(bookings);

  console.log("Mongo seed completed.");
  await client.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});