import { Router } from "express";
import bcrypt from "bcrypt";
import { db, getNextSequence } from "../db.js";

const router = Router();

// POST /api/auth/signup 
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password, city, country, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const exists = await db.collection("users").findOne({ email });
    if (exists) {
      return res.status(409).json({ error: "Email already in use" });
    }
    const hash = await bcrypt.hash(password, 10);
    const user_id = await getNextSequence("userid");
    await db.collection("users").insertOne({
      user_id,
      role: role || "traveler",
      name,
      email,
      password_hash: hash,
      city: city || null,
      country: country || null,
      phone: null,
      about_me: null,
      languages: null,
      gender: null,
      profile_picture: null,
      created_at: new Date()
    });
    // Start session
    req.session.user = { user_id: user_id, role: role || "traveler", name, email };
    const message = role === "owner" ? "Owner created" : "Traveler created";
    res.status(201).json({ message: message, user: req.session.user });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed: " + (err.message || "Internal server error") });
  }
});

// POST /api/auth/login 
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await db.collection("users").findOne({ email, role });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    req.session.user = { user_id: user.user_id, role: user.role, name: user.name, email: user.email };
    res.json({ message: "Logged in", user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out" });
  });
});

// GET /api/auth/me
router.get("/me", (req, res) => {
  if (!req.session || !req.session.user) return res.status(200).json({ user: null });
  res.json({ user: req.session.user });
});

export default router;
