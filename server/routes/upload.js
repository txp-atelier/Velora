const express = require("express");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { auth } = require("../middleware/auth");
const Product = require("../models/Product");
const Review = require("../models/Review");

const router = express.Router();
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return cb(new Error("UNSUPPORTED_TYPE"));
    }
    cb(null, true);
  },
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isCloudinaryConfigured = () =>
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

// Cloudinary secure_url looks like:
//   https://res.cloudinary.com/<cloud>/image/upload/v169.../velora/<id>.jpg
// public_id (what destroy() needs) is the folder + id, no version, no extension.
const extractPublicId = (url) => {
  const match = typeof url === "string" && url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+(?:\?.*)?$/);
  return match ? match[1] : null;
};

router.post("/", auth, (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Image must be under 5 MB.", fields: { file: "Image must be under 5 MB." } });
    }
    if (err?.message === "UNSUPPORTED_TYPE") {
      return res.status(400).json({
        error: "Only JPG, PNG, or WEBP images are allowed.",
        fields: { file: "Only JPG, PNG, or WEBP images are allowed." },
      });
    }
    if (err) return res.status(400).json({ error: "Upload failed. Please try a different image." });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file provided.", fields: { file: "Please choose an image." } });
    if (!isCloudinaryConfigured()) {
      return res.status(503).json({
        error: "Image upload is not configured. Add Cloudinary credentials to .env",
      });
    }
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "velora" },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(req.file.buffer);
    });
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch {
    res.status(500).json({ error: "Upload failed. Please try a different image." });
  }
});

// Deletes an uploaded image from Cloudinary — only if nothing currently
// references it, so a removed-but-unsaved image can be cleaned up
// immediately, but a live product/review photo can never be deleted out
// from under it (whether by mistake or by another user passing its URL).
router.delete("/", auth, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "Image URL is required." });

    const [usedByProduct, usedByReview] = await Promise.all([
      Product.exists({ images: url }),
      Review.exists({ images: url }),
    ]);
    if (usedByProduct || usedByReview) {
      return res.status(409).json({ error: "This image is still in use and can't be deleted." });
    }

    if (isCloudinaryConfigured()) {
      const publicId = extractPublicId(url);
      if (publicId) await cloudinary.uploader.destroy(publicId);
    }
    res.json({ message: "Image deleted." });
  } catch {
    res.status(500).json({ error: "Could not delete image." });
  }
});

module.exports = router;
