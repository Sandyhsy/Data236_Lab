import { Router } from "express";
import { db } from "../db.js";
import { requireOwner } from "../middleware/requireOwner.js";

const router = Router();

// GET /api/owner/me - current owner profile (no password)
router.get("/me", requireOwner, async (req, res) => {
  const { user_id } = req.session.user;
  const rows = await db.collection("users").findOne(
    { user_id, role: "owner" },
    { projection: { password_hash: 0 } }
  );
  if (!rows) return res.status(404).json({ error: "Owner not found" });
  res.json(rows);
});

// PUT /api/owner/me - update owner profile
router.put("/me", requireOwner, async (req, res) => {
  const { user_id } = req.session.user;
  const { name, phone, about_me, city, country, languages, gender, profile_picture } = req.body;
  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (phone !== undefined) updateFields.phone = phone;
  if (about_me !== undefined) updateFields.about_me = about_me;
  if (city !== undefined) updateFields.city = city;
  if (country !== undefined) updateFields.country = country;
  if (languages !== undefined) updateFields.languages = languages;
  if (gender !== undefined) updateFields.gender = gender;
  if (profile_picture !== undefined) updateFields.profile_picture = profile_picture;
  
  await db.collection("users").updateOne(
    { user_id, role: "owner" },
    { $set: updateFields }
  );

  const rows = await db.collection("users").findOne(
    { user_id, role: "owner" },
    { projection: { password_hash: 0 } }
  );
  res.json(rows);
});

// GET /api/owner/dashboard - stats + recent requests + history
router.get("/dashboard", requireOwner, async (req, res) => {
  const { user_id } = req.session.user;

  // const [[{ total_props = 0 }]] = await pool.query(
  //   "SELECT COUNT(*) AS total_props FROM properties WHERE owner_id = ?", [user_id]
  // );
  const total_props = await db.collection("properties").countDocuments({ owner_id: user_id });
  
  // const [[{ incoming = 0 }]] = await pool.query(
  //   `SELECT COUNT(*) AS incoming
  //    FROM bookings b JOIN properties p ON b.property_id = p.property_id
  //    WHERE p.owner_id = ? AND b.status = 'PENDING'`,
  //   [user_id]
  // );
  const incoming = await db.collection("bookings").aggregate([
    { $lookup: {
        from: "properties",
        localField: "property_id",
        foreignField: "property_id",
        as: "property"
      }
    },
    { $unwind: "$property" },
    { $match: { "property.owner_id": user_id, status: "PENDING" } },
    { $count: "incoming" }
  ]).toArray();
  const incomingCount = incoming.length > 0 ? incoming[0].incoming : 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const recentRequests = await db.collection("bookings").aggregate([
    { $lookup: {
        from: "properties",
        localField: "property_id",
        foreignField: "property_id",
        as: "property"
      }
    },
    { $unwind: "$property" },
    { $match: { 
        "property.owner_id": user_id,
        start_date: { $gte: today }
      }
    },
    { $addFields: { property_name: "$property.name" } },
    { $sort: { created_at: -1 } },
    { $project: {
        booking_id: 1, traveler_id: 1, property_id: 1, start_date: 1, end_date: 1,
        guests: 1, status: 1, created_at: 1, property_name: 1
      }
    }
  ]).toArray();
  const previousBookings = await db.collection("bookings").aggregate([
    { $lookup: {
        from: "properties",
        localField: "property_id",
        foreignField: "property_id",
        as: "property"
      }
    },
    { $unwind: "$property" },
    { $match: { 
        "property.owner_id": user_id,
        $or: [
          { start_date: { $lt: today } },
          { status: { $in: ["ACCEPTED", "CANCELLED"] } }
        ]
      }
    },
    { $addFields: { property_name: "$property.name" } },
    { $sort: { created_at: -1 } },
    { $project: {
        booking_id: 1, traveler_id: 1, property_id: 1, start_date: 1, end_date: 1,
        guests: 1, status: 1, created_at: 1, property_name: 1
      }
    }
  ]).toArray();

  res.json({
    total_props: Number(total_props || 0),
    incoming: Number(incomingCount || 0),
    recentRequests: Array.isArray(recentRequests) ? recentRequests : [],
    previousBookings: Array.isArray(previousBookings) ? previousBookings : []
  });
});

export default router;
