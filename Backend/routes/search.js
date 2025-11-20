import { Router } from "express";
import { db } from "../db.js";

const router = Router();

// /api/search/properties
router.post("/properties", async (req, res) => {
  const { location, start, end, guests } = req.body || {};
  const loc = location ? location.trim() : '';
  const s = start === '' ? null : start;
  const e = end === '' ? null : end;
  const matchConditions = {};
  if (loc !== '') {
    matchConditions.location = { $regex: loc, $options: 'i' };
  }
  if (s !== null) {
    matchConditions.availability_start = { $lte: new Date(s) };
  }
  if (e !== null) {
    matchConditions.availability_end = { $gte: new Date(e) };
  }
  if (guests !== null && guests !== undefined) {
    matchConditions.bedrooms = { $gte: guests };
  }

  const rows = await db.collection("properties").aggregate([
    { $match: matchConditions },
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



// GET /api/properties - public list for search (includes first image only)
router.get("/", async (req, res) => {
  try {
    const rows = await db.collection("properties").aggregate([
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
  } catch (err) {
    console.error("[GET /api/properties] error:", err);
    res.status(500).json({ error: "Failed to load properties" });
  }
});

export default router;
