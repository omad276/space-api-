import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { Request } from 'express';
import { AppError } from '../utils/AppError.js';

// ============================================
// Allowed File Types
// ============================================

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  cad: [
    'application/acad',
    'application/x-acad',
    'application/autocad_dwg',
    'image/x-dwg',
    'application/dwg',
    'application/x-dwg',
    'application/x-autocad',
    'image/vnd.dwg',
    'drawing/dwg',
    'application/dxf',
    'image/vnd.dxf',
    'image/x-dxf',
  ],
  pdf: ['application/pdf'],
  image: ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/webp'],
};

const ALLOWED_EXTENSIONS = [
  '.dwg',
  '.dxf',
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.tiff',
  '.tif',
  '.webp',
];

// Max file size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

// ============================================
// Storage Configuration
// ============================================

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, 'uploads/maps');
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

// ============================================
// File Filter
// ============================================

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Check extension
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new AppError(`File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`, 400)
    );
  }

  // Check mime type (with fallback for CAD files)
  const allAllowedMimes = [
    ...ALLOWED_MIME_TYPES.cad,
    ...ALLOWED_MIME_TYPES.pdf,
    ...ALLOWED_MIME_TYPES.image,
    'application/octet-stream', // Fallback for unknown types
  ];

  if (!allAllowedMimes.includes(file.mimetype)) {
    return cb(new AppError(`Invalid file type: ${file.mimetype}`, 400));
  }

  cb(null, true);
};

// ============================================
// Multer Upload Instance
// ============================================

export const uploadMap = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1, // Single file upload
  },
});

// ============================================
// Property Image Upload Configuration
// ============================================

const PROPERTY_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const PROPERTY_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const PROPERTY_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const PROPERTY_MAX_FILES = 20;

const propertyImageStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb) => {
    cb(null, 'uploads/properties');
  },
  filename: (_req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${uniqueSuffix}${ext}`);
  },
});

const propertyImageFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  // Check extension
  if (!PROPERTY_IMAGE_EXTENSIONS.includes(ext)) {
    return cb(
      new AppError(
        `Invalid image type. Allowed types: ${PROPERTY_IMAGE_EXTENSIONS.join(', ')}`,
        400
      )
    );
  }

  // Check mime type
  if (!PROPERTY_IMAGE_MIME_TYPES.includes(file.mimetype)) {
    return cb(new AppError(`Invalid image MIME type: ${file.mimetype}`, 400));
  }

  cb(null, true);
};

export const uploadPropertyImages = multer({
  storage: propertyImageStorage,
  fileFilter: propertyImageFilter,
  limits: {
    fileSize: PROPERTY_MAX_FILE_SIZE,
    files: PROPERTY_MAX_FILES,
  },
});

// ============================================
// Helper Functions
// ============================================

/**
 * Determine file type category from extension
 */
export function getFileTypeFromExtension(filename: string): 'cad' | 'pdf' | 'image' {
  const ext = path.extname(filename).toLowerCase();

  if (['.dwg', '.dxf'].includes(ext)) {
    return 'cad';
  }

  if (ext === '.pdf') {
    return 'pdf';
  }

  return 'image';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default uploadMap;
