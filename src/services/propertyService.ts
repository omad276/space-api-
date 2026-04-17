import fs from 'fs/promises';
import Property from '../models/Property.js';
import { AppError } from '../utils/AppError.js';

// ============================================
// Types
// ============================================

interface CreatePropertyDTO {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  type: string;
  category: string;
  status?: string;
  price: number;
  currency?: string;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  location: {
    address: string;
    addressAr: string;
    city: string;
    cityAr: string;
    country?: string;
    countryAr?: string;
    coordinates?: {
      type?: string;
      coordinates?: [number, number];
    };
  };
  images?: string[];
  features?: string[];
  featuresAr?: string[];
  isFeatured?: boolean;
}

interface UpdatePropertyDTO {
  title?: string;
  titleAr?: string;
  description?: string;
  descriptionAr?: string;
  type?: string;
  category?: string;
  status?: string;
  price?: number;
  currency?: string;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: {
    address?: string;
    addressAr?: string;
    city?: string;
    cityAr?: string;
    country?: string;
    countryAr?: string;
    coordinates?: {
      type?: string;
      coordinates?: [number, number];
    };
  };
  images?: string[];
  features?: string[];
  featuresAr?: string[];
  isActive?: boolean;
  isFeatured?: boolean;
}

interface PropertyQueryDTO {
  page?: number;
  limit?: number;
  q?: string;
  sort?: string;
  type?: string | string[];
  category?: string;
  status?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  featured?: boolean;
  lng?: number;
  lat?: number;
  radius?: number;
}

interface PaginatedProperties {
  properties: unknown[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PropertyStats {
  totalProperties: number;
  forSale: number;
  forRent: number;
  featured: number;
  byType: Record<string, number>;
  byCategory: Record<string, number>;
  byCity: Record<string, number>;
}

// ============================================
// Property Service
// ============================================

/**
 * Create a new property
 */
export async function createProperty(data: CreatePropertyDTO, ownerId: string): Promise<unknown> {
  const property = await Property.create({
    ...data,
    owner: ownerId,
  });
  return property;
}

/**
 * Get a property by ID
 */
export async function getPropertyById(propertyId: string): Promise<unknown> {
  const property = await Property.findById(propertyId)
    .populate('owner', 'fullName fullNameAr email phone avatar')
    .populate('agent', 'fullName fullNameAr email phone avatar');

  if (!property) {
    throw AppError.notFound('Property not found');
  }

  // Increment view count
  property.viewCount = (property.viewCount || 0) + 1;
  await property.save();

  return property;
}

/**
 * Search and filter properties with pagination
 */
export async function searchProperties(query: PropertyQueryDTO): Promise<PaginatedProperties> {
  const {
    page = 1,
    limit = 12,
    q,
    sort = 'newest',
    type,
    category,
    status,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    bedrooms,
    bathrooms,
    city,
    featured,
    lng,
    lat,
    radius,
  } = query;

  const skip = (page - 1) * limit;

  // Build filter object
  const filter: Record<string, unknown> = { isActive: true };

  // Text search
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { titleAr: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { descriptionAr: { $regex: q, $options: 'i' } },
      { 'location.address': { $regex: q, $options: 'i' } },
      { 'location.city': { $regex: q, $options: 'i' } },
    ];
  }

  // Type filter
  if (type) {
    filter.type = Array.isArray(type) ? { $in: type } : type;
  }

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Status filter
  if (status) {
    filter.status = Array.isArray(status) ? { $in: status } : status;
  }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) (filter.price as Record<string, number>).$gte = minPrice;
    if (maxPrice !== undefined) (filter.price as Record<string, number>).$lte = maxPrice;
  }

  // Area range
  if (minArea !== undefined || maxArea !== undefined) {
    filter.area = {};
    if (minArea !== undefined) (filter.area as Record<string, number>).$gte = minArea;
    if (maxArea !== undefined) (filter.area as Record<string, number>).$lte = maxArea;
  }

  // Bedrooms
  if (bedrooms !== undefined) {
    filter.bedrooms = { $gte: bedrooms };
  }

  // Bathrooms
  if (bathrooms !== undefined) {
    filter.bathrooms = { $gte: bathrooms };
  }

  // City filter
  if (city) {
    filter.$or = filter.$or || [];
    (filter.$or as unknown[]).push(
      { 'location.city': { $regex: city, $options: 'i' } },
      { 'location.cityAr': { $regex: city, $options: 'i' } }
    );
  }

  // Featured filter
  if (featured !== undefined) {
    filter.isFeatured = featured;
  }

  // Geo search (if coordinates provided)
  if (lng !== undefined && lat !== undefined && radius) {
    filter['location.coordinates'] = {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: radius * 1000, // Convert km to meters
      },
    };
  }

  // Build sort object
  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    area_asc: { area: 1 },
    area_desc: { area: -1 },
  };
  const sortObj = sortMap[sort] || { createdAt: -1 };

  // Execute queries in parallel
  const [properties, total] = await Promise.all([
    Property.find(filter)
      .populate('owner', 'fullName fullNameAr avatar')
      .sort(sortObj)
      .skip(skip)
      .limit(limit),
    Property.countDocuments(filter),
  ]);

  return {
    properties,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update a property
 */
export async function updateProperty(
  propertyId: string,
  data: UpdatePropertyDTO,
  userId?: string
): Promise<unknown> {
  const property = await Property.findById(propertyId);

  if (!property) {
    throw AppError.notFound('Property not found');
  }

  // Check ownership if userId provided
  if (userId && property.owner.toString() !== userId) {
    throw AppError.forbidden('You can only update your own properties');
  }

  Object.assign(property, data);
  await property.save();

  return property;
}

/**
 * Delete a property
 */
export async function deleteProperty(propertyId: string, userId?: string): Promise<void> {
  const property = await Property.findById(propertyId);

  if (!property) {
    throw AppError.notFound('Property not found');
  }

  // Check ownership if userId provided
  if (userId && property.owner.toString() !== userId) {
    throw AppError.forbidden('You can only delete your own properties');
  }

  await property.deleteOne();
}

/**
 * Get property statistics
 */
export async function getPropertyStats(): Promise<PropertyStats> {
  const properties = await Property.find({ isActive: true });

  const stats: PropertyStats = {
    totalProperties: properties.length,
    forSale: properties.filter((p) => p.status === 'for_sale').length,
    forRent: properties.filter((p) => p.status === 'for_rent').length,
    featured: properties.filter((p) => p.isFeatured).length,
    byType: {},
    byCategory: {},
    byCity: {},
  };

  for (const property of properties) {
    stats.byType[property.type] = (stats.byType[property.type] || 0) + 1;
    stats.byCategory[property.category] = (stats.byCategory[property.category] || 0) + 1;
    if (property.location?.city) {
      stats.byCity[property.location.city] = (stats.byCity[property.location.city] || 0) + 1;
    }
  }

  return stats;
}

/**
 * Get featured properties
 */
export async function getFeaturedProperties(limit = 6): Promise<unknown[]> {
  return Property.find({ isActive: true, isFeatured: true })
    .populate('owner', 'fullName fullNameAr avatar')
    .sort({ createdAt: -1 })
    .limit(limit);
}

/**
 * Get properties by owner
 */
export async function getPropertiesByOwner(ownerId: string): Promise<unknown[]> {
  return Property.find({ owner: ownerId }).sort({ createdAt: -1 });
}

/**
 * Get all properties (no pagination)
 */
export async function getAllProperties(): Promise<unknown[]> {
  return Property.find({ isActive: true })
    .populate('owner', 'fullName fullNameAr avatar')
    .sort({ createdAt: -1 });
}

/**
 * Add images to a property
 */
export async function addImages(
  propertyId: string,
  userId: string,
  imagePaths: string[],
  isAdmin = false
): Promise<unknown> {
  const property = await Property.findById(propertyId);

  if (!property) {
    throw AppError.notFound('Property not found');
  }

  // Check ownership unless admin
  if (!isAdmin && property.owner.toString() !== userId) {
    throw AppError.forbidden('You can only add images to your own properties');
  }

  // Add new images to existing array
  const currentImages = property.images || [];
  const newImages = [...currentImages, ...imagePaths];

  // Enforce max 20 images
  if (newImages.length > 20) {
    throw AppError.badRequest('Maximum 20 images allowed per property');
  }

  property.images = newImages;
  await property.save();

  return property;
}

/**
 * Remove an image from a property
 */
export async function removeImage(
  propertyId: string,
  userId: string,
  imageIndex: number,
  isAdmin = false
): Promise<unknown> {
  const property = await Property.findById(propertyId);

  if (!property) {
    throw AppError.notFound('Property not found');
  }

  // Check ownership unless admin
  if (!isAdmin && property.owner.toString() !== userId) {
    throw AppError.forbidden('You can only remove images from your own properties');
  }

  const images = property.images || [];

  if (imageIndex < 0 || imageIndex >= images.length) {
    throw AppError.badRequest('Invalid image index');
  }

  // Get image path before removing
  const imagePath = images[imageIndex];

  // Remove from array
  images.splice(imageIndex, 1);
  property.images = images;
  await property.save();

  // Try to delete file from disk (non-blocking)
  if (imagePath && imagePath.startsWith('/uploads/')) {
    const filePath = imagePath.replace(/^\//, '');
    fs.unlink(filePath).catch(() => {
      // Ignore errors if file doesn't exist
    });
  }

  return property;
}
