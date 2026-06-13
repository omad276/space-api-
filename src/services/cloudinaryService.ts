import cloudinary from '../config/cloudinary.js';
import { AppError } from '../utils/AppError.js';

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

/**
 * Upload a buffer to Cloudinary
 */
export async function uploadImage(
  buffer: Buffer,
  folder: string = 'bspace/properties'
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto:good' }, { fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) {
          reject(new AppError(`Image upload failed: ${error.message}`, 500));
        } else if (result) {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        }
      }
    );

    uploadStream.end(buffer);
  });
}

/**
 * Upload multiple images to Cloudinary
 */
export async function uploadImages(
  files: Express.Multer.File[],
  folder: string = 'bspace/properties'
): Promise<CloudinaryUploadResult[]> {
  const uploadPromises = files.map((file) => uploadImage(file.buffer, folder));
  return Promise.all(uploadPromises);
}

/**
 * Delete an image from Cloudinary by public ID
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error(
      'Failed to delete image from Cloudinary:',
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

/**
 * Delete multiple images from Cloudinary
 */
export async function deleteImages(publicIds: string[]): Promise<void> {
  if (publicIds.length === 0) return;

  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    console.error(
      'Failed to delete images from Cloudinary:',
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Extract public ID from Cloudinary URL
 */
export function getPublicIdFromUrl(url: string): string | null {
  try {
    // URL format: https://res.cloudinary.com/cloud_name/image/upload/v123/folder/filename.ext
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Generate a thumbnail URL from a Cloudinary URL
 */
export function getThumbnailUrl(url: string, width: number = 300): string {
  // Insert transformation before the version/folder path
  return url.replace('/upload/', `/upload/w_${width},c_fill,q_auto/`);
}
