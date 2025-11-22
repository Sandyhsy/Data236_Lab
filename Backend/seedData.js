import { db } from "./db.js";

const users = [
  {
    user_id: 1,
    role: "owner",
    name: "Shao-Yu Huang",
    email: "shao-yu.huang@sjsu.edu",
    password_hash: "$2b$10$Xw5YsWv30C6X.kxtHd1GguWu57Wj37XAAb2nej689JiUdR.4Ep6du",
    phone: "6693336161",
    about_me: "Hello",
    city: "CA",
    country: "United States",
    languages: "English",
    gender: "Female",
    profile_picture: "https://lab1-host-images.s3.us-east-2.amazonaws.com/profiles%2F1%2Fbd1ff6a0-cb5f-427f-a530-51e97a523409.png",
    created_at: new Date("2025-10-15T15:59:37Z")
  },
  {
    user_id: 2,
    role: "owner",
    name: "Alice",
    email: "alice@example.com",
    password_hash: "$2b$10$GA.7SU6Zupb362i3b8RWUetwRMsP67fqa8wirCu3qc9r32A80olG.",
    created_at: new Date("2025-10-15T22:08:32Z")
  },
  {
    user_id: 3,
    role: "traveler",
    name: "Taylor Swift",
    email: "taylor.swift@sjsu.edu",
    password_hash: "$2b$10$hMlF9U2wzGZidaTbm2d/.etOMIyUnqrBzTVfqH7cmd7tUOJ09OXSi",
    profile_picture: "https://lab1-host-images.s3.us-east-2.amazonaws.com/profiles%2F3%2Fd8d0fc3f-f81b-41b1-9eeb-9878f146ef61.png",
    created_at: new Date("2025-10-23T21:31:17Z")
  },
  {
    user_id: 4,
    role: "traveler",
    name: "Simon Shim",
    email: "simon.shim@sjsu.edu",
    password_hash: "$2b$10$bqe.4Ch8VYas.3JCxCueiO7mICW8HgcTUXoLDbOxS3cUDrJFvZ6lm",
    created_at: new Date("2025-10-23T22:55:06Z")
  }
];

const properties = [
  {
    property_id: 1,
    owner_id: 1,
    name: "Mission Family House",
    type: "House",
    description: "Cozy and quiet neighborhood, walking distance to Safeway and a lovely park.",
    location: "San Jose, USA",
    amenities: "WiFi, Heating, Kitchen, Parking, Backyard, Dishwasher",
    price_per_night: 320,
    bedrooms: 3,
    bathrooms: 2,
    availability_start: new Date("2025-10-20"),
    availability_end: new Date("2025-12-20"),
    created_at: new Date("2025-10-15T20:23:25Z")
  },
  {
    property_id: 2,
    owner_id: 2,
    name: "Montmartre Artist Studio",
    type: "Studio",
    description: "Small but comfy and with nice view",
    location: "Paris, France",
    amenities: "WiFi, Heating, Coffee Maker, Microwave",
    price_per_night: 75,
    bedrooms: null,
    bathrooms: 1,
    availability_start: new Date("2025-10-20"),
    availability_end: new Date("2025-12-20"),
    created_at: new Date("2025-10-15T23:01:23Z")
  }
];

const propertyImages = [
  {
    image_id: 1,
    property_id: 1,
    url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F8%2Fafb67ce7-c653-45ff-a6f2-20d634a646f8.png",
    created_at: new Date("2025-10-15T20:32:58Z")
  },
  {
    image_id: 2,
    property_id: 1,
    url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F8%2Fec2e0413-3564-418e-bb18-b1cabb0a1a05.png",
    created_at: new Date("2025-10-15T20:32:58Z")
  },
  {
    image_id: 3,
    property_id: 1,
    url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F8%2F57eaa561-7f9c-4558-8f78-8f621065c769.png",
    created_at: new Date("2025-10-15T20:32:58Z")
  },
  {
    image_id: 14,
    property_id: 2,
    url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F10%2Fd3bf5296-5926-4ccb-af4c-b9dbe33357d5.png",
    created_at: new Date("2025-10-15T23:01:23Z")
  },
  {
    image_id: 15,
    property_id: 2,
    url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F10%2F86423da8-74ff-4e90-9b53-e5785a3d91d6.png",
    created_at: new Date("2025-10-15T23:01:23Z")
  },
  {
    image_id: 16,
    property_id: 2,
    url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F10%2Fdf242bef-6e86-41c8-89a7-15e34b0f9488.png",
    created_at: new Date("2025-10-15T23:01:23Z")
  }
];

const bookings = [
  {
    booking_id: 1,
    traveler_id: 3,
    property_id: 2,
    start_date: new Date("2025-11-13"),
    end_date: new Date("2025-11-14"),
    guests: null,
    status: "PENDING",
    created_at: new Date("2025-11-14T06:07:24Z")
  },
  {
    booking_id: 2,
    traveler_id: 3,
    property_id: 1,
    start_date: new Date("2025-11-13"),
    end_date: new Date("2025-11-14"),
    guests: null,
    status: "ACCEPTED",
    created_at: new Date("2025-11-14T06:10:32Z")
  },
  {
    booking_id: 3,
    traveler_id: 3,
    property_id: 1,
    start_date: new Date("2025-11-15"),
    end_date: new Date("2025-11-16"),
    guests: null,
    status: "CANCELLED",
    created_at: new Date("2025-11-14T07:08:45Z")
  },
  {
    booking_id: 4,
    traveler_id: 3,
    property_id: 1,
    start_date: new Date("2025-11-29"),
    end_date: new Date("2025-11-30"),
    guests: null,
    status: "ACCEPTED",
    created_at: new Date("2025-11-14T07:37:14Z")
  }
];

const favorites = [
  {
    favorite_id: 1,
    traveler_id: 3,
    property_id: 1,
    created_at: new Date("2025-10-24T00:00:00Z")
  }
];

async function upsertAll(collectionName, docs, key) {
  const collection = db.collection(collectionName);
  for (const doc of docs) {
    await collection.updateOne(
      { [key]: doc[key] },
      { $set: doc },
      { upsert: true }
    );
  }
}

async function syncCounter(name, seedMax, collectionName, field) {
  const maxExisting = await db
    .collection(collectionName)
    .find()
    .sort({ [field]: -1 })
    .limit(1)
    .next();

  const currentMax = maxExisting ? maxExisting[field] : 0;
  const target = Math.max(seedMax, currentMax);

  await db.collection("counters").updateOne(
    { _id: name },
    { $set: { seq: target } },
    { upsert: true }
  );
}

export async function seedDatabase() {
  await upsertAll("users", users, "user_id");
  await upsertAll("properties", properties, "property_id");
  await upsertAll("property_images", propertyImages, "image_id");
  await upsertAll("bookings", bookings, "booking_id");
  await upsertAll("favorites", favorites, "favorite_id");

  await syncCounter("userid", Math.max(...users.map((u) => u.user_id)), "users", "user_id");
  await syncCounter("propertyid", Math.max(...properties.map((p) => p.property_id)), "properties", "property_id");
  await syncCounter("imageid", Math.max(...propertyImages.map((img) => img.image_id)), "property_images", "image_id");
  await syncCounter("bookingid", Math.max(...bookings.map((b) => b.booking_id)), "bookings", "booking_id");
  await syncCounter("favoriteid", Math.max(...favorites.map((f) => f.favorite_id)), "favorites", "favorite_id");
}
