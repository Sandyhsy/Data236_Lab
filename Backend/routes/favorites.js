import { Router } from "express";
import { db, getNextSequence } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { user_id } = req.session.user;
  const rows = await db.collection("favorites").aggregate([
    { $match: { traveler_id: user_id } },
    { $lookup: {
        from: "properties",
        localField: "property_id",
        foreignField: "property_id",
        as: "property"
      }
    },
    { $unwind: "$property" },
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
        property_id: "$property.property_id",
        name: "$property.name",
        location: "$property.location",
        price_per_night: "$property.price_per_night",
        bedrooms: "$property.bedrooms",
        bathrooms: "$property.bathrooms",
        amenities: "$property.amenities",
        description: "$property.description",
        first_image_url: "$first_image.url"
      }
    },
    { $sort: { created_at: -1 } },
    { $project: {
        property_id: 1, name: 1, location: 1, price_per_night: 1, bedrooms: 1,
        bathrooms: 1, amenities: 1, description: 1, first_image_url: 1
      }
    }
  ]).toArray();
  res.json(rows);
});

router.post("/", requireAuth, async (req, res) => {
  const uid = req.session.user.user_id;
  const pid = parseInt(req.body.property_id, 10);

  if (!uid || Number.isNaN(pid)) {
    return res.status(400).json({ error: "user_id and property_id are required" });
  }

  const exists = await db.collection("favorites").findOne({
    traveler_id: uid,
    property_id: pid
  });

   if (exists) {
    await db.collection("favorites").deleteOne({
      traveler_id: uid,
      property_id: pid
    });
    return res.status(201).json({message: "Favorite removed"})
   }
   else
   {
    const favorite_id = await getNextSequence("favoriteid");
    await db.collection("favorites").insertOne({
      favorite_id,
      traveler_id: uid,
      property_id: pid,
      created_at: new Date()
    });
    return res.status(201).json({message: "Favorite added"})
   }
  
  res.status(500).json({error: "Internal server error"});
});

export default router;
