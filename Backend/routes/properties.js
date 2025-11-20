import { Router } from "express";
import { db, getNextSequence } from "../db.js";
import { requireOwner } from "../middleware/requireOwner.js";

const router = Router();

// POST /api/properties - create a property
router.post("/", requireOwner, async (req, res) => {
  const { user_id } = req.session.user;
  const {
    name, type, description, location, amenities,
    price_per_night, bedrooms, bathrooms,
    availability_start, availability_end
  } = req.body;

  if (!name) return res.status(400).json({ error: "Name is required" });
  const property_id = await getNextSequence("propertyid");
  await db.collection("properties").insertOne({
    property_id,
    owner_id: user_id,
    name: name || "",
    type: type || null,
    description: description || null,
    location: location || null,
    amenities: amenities || null,
    price_per_night: price_per_night || null,
    bedrooms: bedrooms || null,
    bathrooms: bathrooms || null,
    availability_start: availability_start ? new Date(availability_start) : null,
    availability_end: availability_end ? new Date(availability_end) : null,
    created_at: new Date()
  });
  const rows = await db.collection("properties").findOne({ property_id });
  res.status(201).json(rows);
});

// GET /api/properties/mine - list my properties (include first image only)
router.get("/mine", requireOwner, async (req, res) => {
  const { user_id } = req.session.user;
  const rows = await db.collection("properties").aggregate([
    { $match: { owner_id: user_id } },
    { $lookup: {
        from: "property_images",
        localField: "property_id",
        foreignField: "property_id",
        as: "images"
      }
    },
    { $addFields: {
        first_image: { $arrayElemAt: [{ $sortArray: { input: "$images", sortBy: { image_id: 1 } } }, 0] }
      }
    },
    { $addFields: {
        first_image_url: "$first_image.url"
      }
    },
    { $sort: { created_at: -1 } },
    { $project: { images: 0 } }
  ]).toArray();

  res.json(rows);
});

// PUT /api/properties/:id - update if owned
router.put("/:id", requireOwner, async (req, res) => {
  const { user_id } = req.session.user;
  const { id } = req.params;
  const {
    name, type, description, location, amenities,
    price_per_night, bedrooms, bathrooms,
    availability_start, availability_end
  } = req.body;

  const owned = await db.collection("properties").findOne({ property_id: parseInt(id), owner_id: user_id });
  if (!owned) return res.status(404).json({ error: "Property not found" });
  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (type !== undefined) updateFields.type = type;
  if (description !== undefined) updateFields.description = description;
  if (location !== undefined) updateFields.location = location;
  if (amenities !== undefined) updateFields.amenities = amenities;
  if (price_per_night !== undefined) updateFields.price_per_night = price_per_night;
  if (bedrooms !== undefined) updateFields.bedrooms = bedrooms;
  if (bathrooms !== undefined) updateFields.bathrooms = bathrooms;
  if (availability_start !== undefined) updateFields.availability_start = availability_start ? new Date(availability_start) : null;
  if (availability_end !== undefined) updateFields.availability_end = availability_end ? new Date(availability_end) : null;
  
  await db.collection("properties").updateOne(
    { property_id: parseInt(id) },
    { $set: updateFields }
  );

  const rows = await db.collection("properties").findOne({ property_id: parseInt(id) });
  res.json(rows);
});

// DELETE /api/properties/:id - delete if owned
router.delete("/:id", requireOwner, async (req, res) => {
  const { user_id } = req.session.user;
  const { id } = req.params;
  const owned = await db.collection("properties").findOne({ property_id: parseInt(id), owner_id: user_id });
  if (!owned) return res.status(404).json({ error: "Property not found" });

  await db.collection("properties").deleteOne({ property_id: parseInt(id) });
  res.json({ message: "Property deleted" });
});

// GET /api/properties/:id/images - list images for my property
router.get("/:id/images", requireOwner, async (req, res) => {
  const { user_id } = req.session.user;
  const { id } = req.params;

  // Verify ownership
  const owns = await db.collection("properties").findOne({ property_id: parseInt(id), owner_id: user_id });
  if (!owns) return res.status(404).json({ error: "Property not found" });
  const rows = await db.collection("property_images").find(
    { property_id: parseInt(id) },
    { projection: { image_id: 1, url: 1, created_at: 1 } }
  ).sort({ image_id: 1 }).toArray();
  res.json(rows);
});


// GET /api/properties/:id - include first image and all photos
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const property = await db.collection("properties").findOne({ property_id: parseInt(id) });
    if (!property) return res.status(404).json({ error: "Property not found" });

    const images = await db.collection("property_images").find(
      { property_id: parseInt(id) },
      { projection: { url: 1 } }
    ).sort({ image_id: 1 }).toArray();
    
    const photos = images.map(img => img.url);
    const first_image_url = photos.length > 0 ? photos[0] : null;

    // normalize photos_csv to an array
    const row = { ...property, first_image_url, photos };

    res.json(row);
  } catch (err) {
    console.error("[GET /api/properties/:id] error:", err);
    res.status(500).json({ error: "Failed to load property" });
  }
});


// PUT /api/properties/:id/images - replace images for my property
router.put("/:id/images", requireOwner, async (req, res) => {
  const { user_id } = req.session.user;
  const { id } = req.params;
  const { urls } = req.body;

  if (!Array.isArray(urls)) {
    return res.status(400).json({ error: "urls must be an array of strings" });
  }

  // Verify ownership
  const owns = await db.collection("properties").findOne({ property_id: parseInt(id), owner_id: user_id });
  if (!owns) return res.status(404).json({ error: "Property not found" });

  try {
    await db.collection("property_images").deleteMany({ property_id: parseInt(id) });

    if (urls.length > 0) {
      const imageDocs = [];
      for (const url of urls) {
        const image_id = await getNextSequence("imageid");
        imageDocs.push({
          image_id,
          property_id: parseInt(id),
          url,
          created_at: new Date()
        });
      }
      await db.collection("property_images").insertMany(imageDocs);
    }
    const rows = await db.collection("property_images").find(
      { property_id: parseInt(id) },
      { projection: { image_id: 1, url: 1, created_at: 1 } }
    ).sort({ image_id: 1 }).toArray();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update images" });
  }
});

export default router;
