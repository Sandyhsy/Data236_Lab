import { Router } from "express";
import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";
import { v4 as uuid } from "uuid";
import { requireOwner } from "../middleware/requireOwner.js";
import { requireAuth } from "../middleware/requireAuth.js";

// Low-level presigner (prevents checksum params in URL)
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { Sha256 } from "@aws-crypto/sha256-js";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { formatUrl } from "@aws-sdk/util-format-url";
import { HttpRequest } from "@smithy/protocol-http";

// Multer for proxy uploads
import multer from "multer";

dotenv.config();

const router = Router();

// S3 client for server-side copy/delete/put
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  maxAttempts: 3,
  useAccelerateEndpoint: process.env.S3_ACCELERATE === "1",
  forcePathStyle: false,
});

// Presigner without flexible-checksum middleware
const presigner = new S3RequestPresigner({
  region: process.env.AWS_REGION,
  credentials: defaultProvider(),
  sha256: Sha256,
});

// Acceptable preview extensions
const PREVIEW_EXTS = ["jpg", "jpeg", "png", "webp", "gif"];

function extOf(nameOrKey) {
  const n = String(nameOrKey || "").toLowerCase();
  if (!n.includes(".")) return "";
  return n.split(".").pop();
}
function pickWebPreviewExt(nameOrKey) {
  const ext = extOf(nameOrKey);
  return PREVIEW_EXTS.includes(ext) ? ext : "jpg";
}
function normalizeContentType(ct) {
  const t = String(ct || "").toLowerCase();
  return t.startsWith("image/") ? t : "image/jpeg";
}

// Build a presigned PUT URL without checksum params
async function presignPut({ bucket, region, key, contentType, expiresIn = 300 }) {
  const host = `${bucket}.s3.${region}.amazonaws.com`;
  const req = new HttpRequest({
    protocol: "https:",
    hostname: host,
    method: "PUT",
    path: `/${encodeURIComponent(key).replace(/%2F/g, "/")}`,
    headers: {
      host,
      // Content-Type must be part of the signature and also sent by the browser
      "content-type": contentType,
    },
  });
  const signed = await presigner.presign(req, { expiresIn });
  return formatUrl(signed);
}

// ---------- DIRECT PRESIGN: EDIT (properties/<id>/...) ----------
router.post("/s3-presign", requireOwner, async (req, res) => {
  try {
    const { property_id, filename, contentType } = req.body;
    if (!property_id || !filename || !contentType) {
      return res.status(400).json({ error: "Missing fields" });
    }
    const key = `properties/${Number(property_id)}/${uuid()}.${pickWebPreviewExt(filename)}`;
    const ct = normalizeContentType(contentType);

    const uploadUrl = await presignPut({
      bucket: process.env.S3_BUCKET,
      region: process.env.AWS_REGION,
      key,
      contentType: ct,
      expiresIn: 300,
    });
    const publicUrl = `${process.env.S3_PUBLIC_BASE}/${encodeURIComponent(key)}`;
    res.json({ uploadUrl, key, publicUrl, contentType: ct });
  } catch (err) {
    console.error("[S3 presign error]:", err);
    res.status(500).json({ error: "Failed to generate upload URL: " + (err.message || "Unknown error") });
  }
});

// ---------- DIRECT PRESIGN: CREATE (staging/<user_id>/...) ----------
router.post("/s3-presign-temp", requireOwner, async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      return res.status(400).json({ error: "Missing fields" });
    }
    const userId = req.session.user.user_id;
    const key = `staging/${Number(userId)}/${uuid()}.${pickWebPreviewExt(filename)}`;
    const ct = normalizeContentType(contentType);

    const uploadUrl = await presignPut({
      bucket: process.env.S3_BUCKET,
      region: process.env.AWS_REGION,
      key,
      contentType: ct,
      expiresIn: 300,
    });
    const publicUrl = `${process.env.S3_PUBLIC_BASE}/${encodeURIComponent(key)}`;
    res.json({ uploadUrl, key, publicUrl, contentType: ct });
  } catch (err) {
    console.error("[S3 presign temp error]:", err);
    res.status(500).json({ error: "Failed to generate upload URL: " + (err.message || "Unknown error") });
  }
});

// ---------- FINALIZE: move staging → properties ----------
router.post("/finalize", requireOwner, async (req, res) => {
  try {
    const { property_id, tempUrls } = req.body;
    if (!property_id || !Array.isArray(tempUrls)) {
      return res.status(400).json({ error: "Missing fields" });
    }
    const bucket = process.env.S3_BUCKET;
    const base = process.env.S3_PUBLIC_BASE.replace(/\/+$/, "");
    const userId = req.session.user.user_id;

    const finalUrls = [];
    for (const u of tempUrls) {
      const srcKey = decodeURIComponent(u.replace(base, "").replace(/^\/+/, ""));
      if (!srcKey.startsWith(`staging/${userId}/`)) continue;

      const destKey = `properties/${Number(property_id)}/${uuid()}.${pickWebPreviewExt(srcKey)}`;
      await s3.send(
        new CopyObjectCommand({
          Bucket: bucket,
          Key: destKey,
          CopySource: `${bucket}/${encodeURIComponent(srcKey)}`,
          CacheControl: "public, max-age=31536000, immutable",
          MetadataDirective: "COPY",
        })
      );
      await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: srcKey }));
      finalUrls.push(`${base}/${encodeURIComponent(destKey)}`);
    }
    res.json({ finalUrls });
  } catch (err) {
    console.error("[Finalize error]", err);
    res.status(500).json({ error: "Finalize failed" });
  }
});

// ---------- BEST-EFFORT DELETE (by public URL) ----------
router.post("/s3-delete", requireOwner, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Missing url" });
    const base = process.env.S3_PUBLIC_BASE.replace(/\/+$/, "");
    const key = decodeURIComponent(url.replace(base, "").replace(/^\/+/, ""));
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }));
    res.json({ deleted: true, key });
  } catch (err) {
    console.error("[S3 delete error]:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ---------- DIRECT PRESIGN: PROFILE PICTURE (profiles/<user_id>/...) ----------
router.post("/s3-presign-profile", requireAuth, async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      return res.status(400).json({ error: "Missing fields" });
    }
    if (!req.session?.user?.user_id) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    const userId = req.session.user.user_id;
    const key = `profiles/${Number(userId)}/${uuid()}.${pickWebPreviewExt(filename)}`;
    const ct = normalizeContentType(contentType);

    const uploadUrl = await presignPut({
      bucket: process.env.S3_BUCKET,
      region: process.env.AWS_REGION,
      key,
      contentType: ct,
      expiresIn: 300,
    });
    const publicUrl = `${process.env.S3_PUBLIC_BASE}/${encodeURIComponent(key)}`;
    res.json({ uploadUrl, key, publicUrl, contentType: ct });
  } catch (err) {
    console.error("[S3 presign profile error]:", err);
    res.status(500).json({ error: "Failed to generate upload URL: " + (err.message || "Unknown error") });
  }
});

// ---------- PROXY UPLOAD FALLBACK (multipart) ----------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB cap
});

// POST /api/uploads/proxy-property  -> final properties/<id>/...
router.post("/proxy-property", requireOwner, upload.single("file"), async (req, res) => {
  try {
    const { property_id, filename } = req.body;
    if (!property_id || !req.file) return res.status(400).json({ error: "Missing fields" });

    const key = `properties/${Number(property_id)}/${uuid()}.${pickWebPreviewExt(filename || req.file.originalname)}`;
    const ct = normalizeContentType(req.file.mimetype);

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: ct,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    const publicUrl = `${process.env.S3_PUBLIC_BASE}/${encodeURIComponent(key)}`;
    res.json({ publicUrl, key, contentType: ct });
  } catch (err) {
    console.error("[Proxy property upload error]", err);
    res.status(500).json({ error: "Proxy upload failed: " + (err.message || "Unknown error") });
  }
});

// POST /api/uploads/proxy-staging -> staging/<user_id>/...
router.post("/proxy-staging", requireOwner, upload.single("file"), async (req, res) => {
  try {
    const userId = req.session.user.user_id;
    if (!userId || !req.file) return res.status(400).json({ error: "Missing fields" });

    const key = `staging/${Number(userId)}/${uuid()}.${pickWebPreviewExt(req.file.originalname)}`;
    const ct = normalizeContentType(req.file.mimetype);

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: ct,
        CacheControl: "public, max-age=86400",
      })
    );
    const publicUrl = `${process.env.S3_PUBLIC_BASE}/${encodeURIComponent(key)}`;
    res.json({ publicUrl, key, contentType: ct });
  } catch (err) {
    console.error("[Proxy staging upload error]", err);
    res.status(500).json({ error: "Proxy upload failed: " + (err.message || "Unknown error") });
  }
});

// POST /api/uploads/proxy-profile -> profiles/<user_id>/...
router.post("/proxy-profile", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.session?.user?.user_id || !req.file) {
      return res.status(400).json({ error: "Missing fields" });
    }
    const userId = req.session.user.user_id;
    const key = `profiles/${Number(userId)}/${uuid()}.${pickWebPreviewExt(req.file.originalname)}`;
    const ct = normalizeContentType(req.file.mimetype);

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: req.file.buffer,
        ContentType: ct,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    const publicUrl = `${process.env.S3_PUBLIC_BASE}/${encodeURIComponent(key)}`;
    res.json({ publicUrl, key, contentType: ct });
  } catch (err) {
    console.error("[Proxy profile upload error]", err);
    res.status(500).json({ error: "Proxy upload failed: " + (err.message || "Unknown error") });
  }
});

export default router;
