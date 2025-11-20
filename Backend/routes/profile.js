import { Router } from "express";
// import { pool } from "../db.js";
import { db } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.get("/profile", requireAuth, async (req, res) => {
  const { user_id } = req.session.user;
  const rows = await db.collection("users").findOne(
    { user_id },
    { projection: { password_hash: 0 } }
  );
  if (!rows) return res.status(404).json({ error: "traveler not found" });
  res.json(rows);
});

router.put("/profile", requireAuth, async (req, res) => {
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
    { user_id },
    { $set: updateFields }
  );
  const rows = await db.collection("users").findOne(
    { user_id },
    { projection: { password_hash: 0 } }
  );
  res.json(rows);
});

export default router;
