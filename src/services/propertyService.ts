import Property from '../models/Property.js';
import { AppError } from '../utils/AppError.js';
import * as cloudinaryService from './cloudinaryService.js';

// ============================================
// Types (BSpace Sudan)
// ============================================

interface CreatePropertyDTO {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  listingType: 'rent' | 'sale';
  category: 'residential' | 'commercial' | 'land';
  propertyType: string;
  price: number;
  currency?: string;
  rentPeriod?: string;
  monthsInAdvance?: number;
  negotiable?: boolean;
  location: {
    state: string;
    stateAr: string;
    city: string;
    cityAr: string;
    neighborhood?: string;
    neighborhoodAr?: string;
    address?: string;
    addressAr?: string;
    coordinates?: { type?: string; coordinates?: [number, number] };
  };
  area: number;
  images?: string[];
  bedrooms?: number;
  bathrooms?: number;
  floors?: number;
  furnished?: boolean;
  waterSource?: string;
  electricity?: string;
  deedRegistered?: boolean;
  landClass?: string;
  fenced?: boolean;
  streetFrontage?: number;
  powerCapacity?: number;
  features?: string[];
  featuresAr?: string[];
  whatsappNumber?: string;
  phoneNumber?: string;
  showEmail?: boolean;
}

interface PropertyQueryDTO {
  page?: number;
  limit?: number;
  q?: string;
  sort?: string;
  listingType?: 'rent' | 'sale';
  propertyType?: string | string[];
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  state?: string;
  city?: string;
  featured?: boolean;
  approved?: boolean;
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

export async function createProperty(data: CreatePropertyDTO, ownerId: string): Promise<unknown> {
  const property = await Property.create({
    ...data,
    owner: ownerId,
    isApproved: false,
  });
  return property;
}

export async function getPropertyById(propertyId: string): Promise<unknown> {
  const property = await Property.findById(propertyId)
    .populate('owner', 'fullName email phone whatsappNumber avatar');

  if (!property) {
    throw AppError.notFound('Property not found');
  }

  property.viewCount = (property.viewCount || 0) + 1;
  await property.save();

  return property;
}

export async function searchProperties(query: PropertyQueryDTO): Promise<PaginatedProperties> {
  const {
    page = 1,
    limit = 12,
    q,
    sort = 'newest',
    listingType,
    propertyType,
    category,
    minPrice,
    maxPrice,
    minArea,
    maxArea,
    bedrooms,
    bathrooms,
    state,
    city,
    featured,
    approved,
  } = query;

  const skip = (page - 1) * limit;
  const filter: Record<string, unknown> = { isActive: true };

  // Only show approved by default (unless admin requesting)
  if (approved !== undefined) {
    filter.isApproved = approved;
  } else {
    filter.isApproved = true;
  }

  // Text search
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { titleAr: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } },
      { descriptionAr: { $regex: q, $options: 'i' } },
      { 'location.neighborhood': { $regex: q, $options: 'i' } },
      { 'location.city': { $regex: q, $options: 'i' } },
    ];
  }

  // Listing type filter
  if (listingType) {
    filter.listingType = listingType;
  }

  // Property type filter
  if (propertyType) {
    filter.propertyType = Array.isArray(propertyType) ? { $in: propertyType } : propertyType;
  }

  // Category filter
  if (category) {
    filter.category = category;
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

  // State filter
  if (state) {
    filter['location.state'] = { $regex: state, $options: 'i' };
  }

  // City filter
  if (city) {
    filter['location.city'] = { $regex: city, $options: 'i' };
  }

  // Featured filter
  if (featured !== undefined) {
    filter.isFeatured = featured;
  }

  // Sort
  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    area_asc: { area: 1 },
    area_desc: { area: -1 },
  };
  const sortObj = sortMap[sort] || { createdAt: -1 };

  const [properties, total] = await Promise.all([
    Property.find(filter)
      .populate('owner', 'fullName avatar')
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

export async function updateProperty(
  propertyId: string,
  data: Partial<CreatePropertyDTO> & { isActive?: boolean; isApproved?: boolean; isFeatured?: boolean },
  userId?: string
): Promise<unknown> {
  const property = await Property.findById(propertyId);

  if (!property) {
    throw AppError.notFound('Property not found');
  }

  if (userId && property.owner.toString() !== userId) {
    throw AppError.forbidden('You can only update your own properties');
  }

  Object.assign(property, data);
  await property.save();

  return property;
}

export async function deleteProperty(propertyId: string, userId?: string): Promise<void> {
  const property = await Property.findById(propertyId);

  if (!property) {
    throw AppError.notFound('Property not found');
  }

  if (userId && property.owner.toString() !== userId) {
    throw AppError.forbidden('You can only delete your own properties');
  }

  // Delete images from Cloudinary
  const images = property.images || [];
  for (const imageUrl of images) {
    if (imageUrl.includes('cloudinary.com')) {
      const publicId = cloudinaryService.getPublicIdFromUrl(imageUrl);
      if (publicId) {
        cloudinaryService.deleteImage(publicId).catch(() => {});
      }
    }
  }

  await property.deleteOne();
}

export async function getPropertyStats(): Promise<PropertyStats> {
  const properties = await Property.find({ isActive: true, isApproved: true });

  const stats: PropertyStats = {
    totalProperties: properties.length,
    forSale: properties.filter((p) => p.listingType === 'sale').length,
    forRent: properties.filter((p) => p.listingType === 'rent').length,
    featured: properties.filter((p) => p.isFeatured).length,
    byType: {},
    byCategory: {},
    byCity: {},
  };

  for (const property of properties) {
    const propType = property.propertyType as string;
    const propCat = property.category as string;
    stats.byType[propType] = (stats.byType[propType] || 0) + 1;
    stats.byCategory[propCat] = (stats.byCategory[propCat] || 0) + 1;
    if (property.location?.city) {
      stats.byCity[property.location.city] = (stats.byCity[property.location.city] || 0) + 1;
    }
  }

  return stats;
}

export async function getFeaturedProperties(limit = 6): Promise<unknown[]> {
  return Property.find({ isActive: true, isApproved: true, isFeatured: true })
    .populate('owner', 'fullName avatar')
    .sort({ createdAt: -1 })
    .limit(limit);
}

export async function getPropertiesByOwner(ownerId: string): Promise<unknown[]> {
  return Property.find({ owner: ownerId }).sort({ createdAt: -1 });
}

export async function getAllProperties(): Promise<unknown[]> {
  return Property.find({ isActive: true, isApproved: true })
    .populate('owner', 'fullName avatar')
    .sort({ createdAt: -1 });
}

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

  if (!isAdmin && property.owner.toString() !== userId) {
    throw AppError.forbidden('You can only add images to your own properties');
  }

  const currentImages = property.images || [];
  const newImages = [...currentImages, ...imagePaths];

  if (newImages.length > 20) {
    throw AppError.badRequest('Maximum 20 images allowed per property');
  }

  property.images = newImages;
  await property.save();

  return property;
}

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

  if (!isAdmin && property.owner.toString() !== userId) {
    throw AppError.forbidden('You can only remove images from your own properties');
  }

  const images = property.images || [];

  if (imageIndex < 0 || imageIndex >= images.length) {
    throw AppError.badRequest('Invalid image index');
  }

  const imageUrl = images[imageIndex];
  images.splice(imageIndex, 1);
  property.images = images;
  await property.save();

  if (imageUrl && imageUrl.includes('cloudinary.com')) {
    const publicId = cloudinaryService.getPublicIdFromUrl(imageUrl);
    if (publicId) {
      cloudinaryService.deleteImage(publicId).catch(() => {});
    }
  }

  return property;
}

// Admin functions
export async function getPendingProperties(): Promise<unknown[]> {
  return Property.find({ isActive: true, isApproved: false })
    .populate('owner', 'fullName email phone')
    .sort({ createdAt: -1 });
}

export async function approveProperty(propertyId: string): Promise<unknown> {
  const property = await Property.findByIdAndUpdate(
    propertyId,
    { isApproved: true },
    { new: true }
  );

  if (!property) {
    throw AppError.notFound('Property not found');
  }

  return property;
}

export async function rejectProperty(propertyId: string): Promise<void> {
  const property = await Property.findById(propertyId);

  if (!property) {
    throw AppError.notFound('Property not found');
  }

  // Delete images from Cloudinary
  const images = property.images || [];
  for (const imageUrl of images) {
    if (imageUrl.includes('cloudinary.com')) {
      const publicId = cloudinaryService.getPublicIdFromUrl(imageUrl);
      if (publicId) {
        cloudinaryService.deleteImage(publicId).catch(() => {});
      }
    }
  }

  await property.deleteOne();
}
