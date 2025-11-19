// seed_airbnb.js
const dbName = "airbnb_db";
const dbx = db.getSiblingDB(dbName);

// 建議索引（與 MySQL schema 對齊）
dbx.favorites.createIndex({ traveler_id: 1, property_id: 1 }, { unique: true });
dbx.property_images.createIndex({ property_id: 1 });
dbx.properties.createIndex({ owner_id: 1 });
dbx.bookings.createIndex({ traveler_id: 1 });
dbx.bookings.createIndex({ property_id: 1 });

// ---- users ----
dbx.users.deleteMany({});
dbx.users.insertMany([
  {
    _id: 1,
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
    _id: 2,
    role: "owner",
    name: "Alice",
    email: "alice@example.com",
    password_hash: "$2b$10$GA.7SU6Zupb362i3b8RWUetwRMsP67fqa8wirCu3qc9r32A80olG.",
    created_at: new Date("2025-10-15T22:08:32Z")
  },
  {
    _id: 3,
    role: "traveler",
    name: "Taylor Swift",
    email: "taylor.swift@sjsu.edu",
    password_hash: "$2b$10$hMlF9U2wzGZidaTbm2d/.etOMIyUnqrBzTVfqH7cmd7tUOJ09OXSi",
    profile_picture: "https://lab1-host-images.s3.us-east-2.amazonaws.com/profiles%2F3%2Fd8d0fc3f-f81b-41b1-9eeb-9878f146ef61.png",
    created_at: new Date("2025-10-23T21:31:17Z")
  },
  {
    _id: 4,
    role: "traveler",
    name: "Simon Shim",
    email: "simon.shim@sjsu.edu",
    password_hash: "$2b$10$bqe.4Ch8VYas.3JCxCueiO7mICW8HgcTUXoLDbOxS3cUDrJFvZ6lm",
    created_at: new Date("2025-10-23T22:55:06Z")
  }
]);

// ---- properties ----
dbx.properties.deleteMany({});
dbx.properties.insertMany([
  {
    _id: 1,
    owner_id: 1,
    name: "Mission Family House",
    type: "House",
    description:
      "Cozy and quiet neighborhood, walking distance to Safeway and a lovely park.",
    location: "San Jose, USA",
    amenities: "WiFi, Heating, Kitchen, Parking, Backyard, Dishwasher",
    price_per_night: 320.00,
    bedrooms: 3,
    bathrooms: 2,
    availability_start: new Date("2025-10-20"),
    availability_end: new Date("2025-12-20"),
    created_at: new Date("2025-10-15T20:23:25Z")
  },
  {
    _id: 2,
    owner_id: 2,
    name: "Montmartre Artist Studio",
    type: "Studio",
    description: "Small but comfy and with nice view",
    location: "Paris, France",
    amenities: "WiFi, Heating, Coffee Maker, Microwave",
    price_per_night: 75.00,
    bedrooms: null,
    bathrooms: 1,
    availability_start: new Date("2025-10-20"),
    availability_end: new Date("2025-12-20"),
    created_at: new Date("2025-10-15T22:34:21Z")
  }
]);

// ---- property_images ----
dbx.property_images.deleteMany({});
dbx.property_images.insertMany([
  {
    _id: 1,
    property_id: 1,
    url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F8%2Fafb67ce7-c653-45ff-a6f2-20d634a646f8.png",
    created_at: new Date("2025-10-15T20:32:58Z")
  },
  {
    _id: 2,
    property_id: 1,
    url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F8%2Fec2e0413-3564-418e-bb18-b1cabb0a1a05.png",
    created_at: new Date("2025-10-15T20:32:58Z")
  },
  {
    _id: 3,
    property_id: 1,
    url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F8%2F57eaa561-7f9c-4558-8f78-8f621065c769.png",
    created_at: new Date("2025-10-15T20:32:58Z")
  },
  {
    _id: 14,
    property_id: 2,
    url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F10%2Fd3bf5296-5926-4ccb-af4c-b9dbe33357d5.png",
    created_at: new Date("2025-10-15T23:01:23Z")
  },
  {
    _id: 15,
    property_id: 2,
    url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F10%2F86423da8-74ff-4e90-9b53-e5785a3d91d6.png",
    created_at: new Date("2025-10-15T23:01:23Z")
  },
  {
    _id: 16,
    property_id: 2,
    url: "https://lab1-host-images.s3.us-east-2.amazonaws.com/properties%2F10%2Fdf242bef-6e86-41c8-89a7-15e34b0f9488.png",
    created_at: new Date("2025-10-15T23:01:23Z")
  }
]);

// ---- favorites / bookings（目前 SQL dump 沒資料，就建空集合即可） ----
dbx.favorites.deleteMany({});
dbx.bookings.deleteMany({});

// ---- counters（若你的程式用自增序號）----
dbx.counters.deleteMany({});
dbx.counters.insertMany([
  { _id: "users", seq: 5 },             // 下一個 user_id
  { _id: "properties", seq: 3 },        // 下一個 property_id
  { _id: "property_images", seq: 17 },  // 下一個 image_id
  { _id: "bookings", seq: 1 },          // 下一個 booking_id
  { _id: "favorites", seq: 1 }          // 下一個 favorite_id
]);

print(`✅ Seeded ${dbName} successfully.`);