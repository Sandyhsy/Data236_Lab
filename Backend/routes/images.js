import { Router } from "express";
import { db, getNextSequence } from "../db.js";
import { requireOwner } from "../middleware/requireOwner.js";

const router = Router();

// GET /api/properties/:id/images
router.get("/:id/images", requireOwner, async (req, res) => {
  const { id } = req.params;
  const rows = await db.collection("property_images").find(
    { property_id: parseInt(id) },
    { projection: { image_id: 1, property_id: 1, url: 1, created_at: 1 } }
  ).sort({ image_id: 1 }).toArray();
  res.json(rows);
});

// PUT /api/properties/:id/images
router.put("/:id/images", requireOwner, async (req, res) => {
  const { id } = req.params;
  const urls = Array.isArray(req.body?.urls) ? req.body.urls : [];
  try {

    const current = await db.collection("property_images").find(
      { property_id: parseInt(id) },
      { projection: { url: 1 } }
    ).toArray();
    const currentSet = new Set(current.map(r => r.url));
    const nextSet = new Set(urls);

    // Delete 
    if (current.length > 0) {
      const toDelete = [...currentSet].filter(u => !nextSet.has(u));
      if (toDelete.length > 0) {
        await db.collection("property_images").deleteMany({
          property_id: parseInt(id),
          url: { $in: toDelete }
        });
      }
    }

    // Insert 
    const toInsert = [...nextSet].filter(u => !currentSet.has(u));
    if (toInsert.length > 0) {
      const existingUrls = await db.collection("property_images").find(
        { property_id: parseInt(id), url: { $in: toInsert } },
        { projection: { url: 1 } }
      ).toArray();
      const existingSet = new Set(existingUrls.map(r => r.url));
      const reallyNew = toInsert.filter(u => !existingSet.has(u));
      
      if (reallyNew.length > 0) {
        const imageDocs = [];
        for (const url of reallyNew) {
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
    }

    const rows = await db.collection("property_images").find(
      { property_id: parseInt(id) },
      { projection: { image_id: 1, property_id: 1, url: 1, created_at: 1 } }
    ).sort({ image_id: 1 }).toArray();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update images" });
  }
});

export default router;
