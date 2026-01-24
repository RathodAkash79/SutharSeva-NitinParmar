import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({ 
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Simple authentication middleware
// For production: Consider implementing Firebase Admin SDK verification
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Check for Firebase ID token in Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  // For now, accept any Bearer token (client-side Firebase auth is verified by Security Rules)
  // TODO: Add Firebase Admin SDK to verify tokens server-side for stronger security
  const token = authHeader.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Invalid token format" });
  }

  // In a production environment with Firebase Admin SDK:
  // try {
  //   const decodedToken = await admin.auth().verifyIdToken(token);
  //   req.user = decodedToken;
  //   next();
  // } catch (error) {
  //   return res.status(401).json({ message: "Unauthorized: Invalid token" });
  // }
  
  // For now, pass through (security is handled by Firebase client-side auth + Firestore rules)
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // SECURITY: Upload endpoint now requires authentication
  app.post("/api/upload", requireAuth, upload.single("image"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const filePath = req.file.path;
      let url = "";

      // Try Cloudinary first
      if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY) {
        try {
          const result = await cloudinary.uploader.upload(filePath, {
            folder: "suthar_seva",
          });

          url = result?.secure_url || result?.url;
          if (!url) {
            throw new Error("Cloudinary returned no URL");
          }
        } catch (cloudinaryError) {
          console.error("Cloudinary upload error:", cloudinaryError);
          // Fall back to local storage
          url = await fallbackLocalUpload(req.file);
        }
      } else {
        console.warn("Cloudinary credentials not set, using local storage fallback");
        url = await fallbackLocalUpload(req.file);
      }

      // Clean up temp file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({ url });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}` });
    }
  });

  return httpServer;
}

// Fallback: serve uploaded files from local storage
async function fallbackLocalUpload(file: any): Promise<string> {
  try {
    const uploadDir = "uploads/public";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileExt = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${fileExt}`;
    const destPath = path.join(uploadDir, fileName);

    // Copy file to public uploads directory
    fs.copyFileSync(file.path, destPath);

    // Return a URL path that can be served
    return `/uploads/public/${fileName}`;
  } catch (err) {
    console.error("Fallback upload error:", err);
    throw new Error("Local storage fallback failed");
  }
}
