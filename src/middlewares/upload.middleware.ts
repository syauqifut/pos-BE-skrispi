import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

// Ensure the pictures directory exists
const picturesDir = path.join(process.cwd(), 'public', 'pictures');
if (!fs.existsSync(picturesDir)) {
  fs.mkdirSync(picturesDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const productDir = path.join(picturesDir, 'products');
    
    // Create product-specific directory if it doesn't exist
    if (!fs.existsSync(productDir)) {
      fs.mkdirSync(productDir, { recursive: true });
    }
    
    cb(null, productDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalname;
    const extension = path.extname(originalName);
    const filename = `picture_${timestamp}${extension}`;
    
    cb(null, filename);
  }
});

// File filter to only allow images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
  }
};

// Configure multer
export const uploadProductImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only allow 1 file per request
  }
});

// Error handling middleware for multer
export const handleUploadError = (error: any, req: Request, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Only 1 file is allowed.'
      });
    }
  }
  
  if (error.message === 'Only image files are allowed (JPEG, PNG, GIF, WebP)') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
}; 