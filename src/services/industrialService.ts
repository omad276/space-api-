import { Industrial } from '../models/Industrial.js';
import Property from '../models/Property.js';
import { AppError } from '../utils/AppError.js';
import {
  PublicIndustrial,
  IIndustrialDocument,
  CreateIndustrialDTO,
  UpdateIndustrialDTO,
  FactoryType,
  ZoningType,
} from '../types/index.js';

// ============================================
// Industrial Service
// ============================================

/**
 * Create industrial data for a property
 */
export async function createIndustrial(
  userId: string,
  data: CreateIndustrialDTO
): Promise<PublicIndustrial> {
  const { propertyId, ...industrialData } = data;

  // Verify property exists
  const property = await Property.findById(propertyId);
  if (!property) {
    throw AppError.notFound('Property not found');
  }

  // Check if property is industrial category
  if (property.category !== 'industrial') {
    throw AppError.badRequest('Industrial data can only be added to industrial properties');
  }

  // Check if industrial data already exists for this property
  const existing = await Industrial.findOne({ property: propertyId });
  if (existing) {
    throw AppError.badRequest(
      'Industrial data already exists for this property. Use update instead.'
    );
  }

  // Create industrial record
  const industrial = await Industrial.create({
    property: propertyId,
    ...industrialData,
    createdBy: userId,
  });

  await industrial.populate('createdBy', 'id fullName email');

  return industrial.toPublicJSON();
}

/**
 * Get industrial data by property ID
 */
export async function getIndustrialByProperty(propertyId: string): Promise<PublicIndustrial> {
  const industrial = await Industrial.findByProperty(propertyId);

  if (!industrial) {
    throw AppError.notFound('Industrial data not found for this property');
  }

  return industrial.toPublicJSON();
}

/**
 * Get industrial data by ID
 */
export async function getIndustrialById(industrialId: string): Promise<PublicIndustrial> {
  const industrial = await Industrial.findById(industrialId)
    .populate('property')
    .populate('createdBy', 'id fullName email');

  if (!industrial) {
    throw AppError.notFound('Industrial data not found');
  }

  return industrial.toPublicJSON();
}

/**
 * Update industrial data
 */
export async function updateIndustrial(
  industrialId: string,
  userId: string,
  data: UpdateIndustrialDTO
): Promise<PublicIndustrial> {
  const industrial = await Industrial.findById(industrialId);

  if (!industrial) {
    throw AppError.notFound('Industrial data not found');
  }

  // Check ownership
  if (industrial.createdBy.toString() !== userId) {
    throw AppError.forbidden('You can only update your own industrial data');
  }

  // Update fields
  if (data.factoryType) industrial.factoryType = data.factoryType;
  if (data.powerCapacity) {
    industrial.powerCapacity = {
      value: data.powerCapacity.value,
      unit: data.powerCapacity.unit || industrial.powerCapacity.unit,
    };
  }
  if (data.waterAccess) {
    industrial.waterAccess = {
      available: data.waterAccess.available,
      dailyCapacity: data.waterAccess.dailyCapacity ?? industrial.waterAccess.dailyCapacity,
      unit: data.waterAccess.unit || industrial.waterAccess.unit,
    };
  }
  if (data.ceilingHeight) {
    industrial.ceilingHeight = {
      value: data.ceilingHeight.value,
      unit: data.ceilingHeight.unit || industrial.ceilingHeight?.unit || 'm',
    };
  }
  if (data.loadingDocks) {
    industrial.loadingDocks = {
      count: data.loadingDocks.count,
      type: data.loadingDocks.type || industrial.loadingDocks.type,
    };
  }
  if (data.zoningType) industrial.zoningType = data.zoningType;
  if (data.productionLines) {
    industrial.productionLines = {
      count: data.productionLines.count,
      description: data.productionLines.description ?? industrial.productionLines.description,
    };
  }
  if (data.warehouseCapacity) {
    industrial.warehouseCapacity = {
      value: data.warehouseCapacity.value,
      unit: data.warehouseCapacity.unit || industrial.warehouseCapacity?.unit || 'sqm',
    };
  }
  if (data.utilities) industrial.utilities = { ...industrial.utilities, ...data.utilities };
  if (data.certifications !== undefined) industrial.certifications = data.certifications;
  if (data.environmentalCompliance !== undefined)
    industrial.environmentalCompliance = data.environmentalCompliance;

  await industrial.save();
  await industrial.populate('createdBy', 'id fullName email');

  return industrial.toPublicJSON();
}

/**
 * Delete industrial data
 */
export async function deleteIndustrial(
  industrialId: string,
  userId: string,
  isAdmin: boolean = false
): Promise<void> {
  const industrial = await Industrial.findById(industrialId);

  if (!industrial) {
    throw AppError.notFound('Industrial data not found');
  }

  if (industrial.createdBy.toString() !== userId && !isAdmin) {
    throw AppError.forbidden('You can only delete your own industrial data');
  }

  await industrial.deleteOne();
}

/**
 * List all industrial properties with filters
 */
export async function listIndustrial(options: {
  page?: number;
  limit?: number;
  factoryType?: FactoryType;
  zoningType?: ZoningType;
  minPowerCapacity?: number;
  maxPowerCapacity?: number;
  hasWaterAccess?: boolean;
  minCeilingHeight?: number;
  hasLoadingDocks?: boolean;
  environmentalCompliance?: boolean;
}): Promise<{
  data: PublicIndustrial[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const skip = (page - 1) * limit;

  // Build query
  const query: Record<string, unknown> = {};

  if (options.factoryType) {
    query.factoryType = options.factoryType;
  }

  if (options.zoningType) {
    query.zoningType = options.zoningType;
  }

  if (options.minPowerCapacity !== undefined || options.maxPowerCapacity !== undefined) {
    query['powerCapacity.value'] = {};
    if (options.minPowerCapacity !== undefined) {
      (query['powerCapacity.value'] as Record<string, number>).$gte = options.minPowerCapacity;
    }
    if (options.maxPowerCapacity !== undefined) {
      (query['powerCapacity.value'] as Record<string, number>).$lte = options.maxPowerCapacity;
    }
  }

  if (options.hasWaterAccess !== undefined) {
    query['waterAccess.available'] = options.hasWaterAccess;
  }

  if (options.minCeilingHeight !== undefined) {
    query['ceilingHeight.value'] = { $gte: options.minCeilingHeight };
  }

  if (options.hasLoadingDocks !== undefined) {
    if (options.hasLoadingDocks) {
      query['loadingDocks.count'] = { $gt: 0 };
    } else {
      query['loadingDocks.count'] = 0;
    }
  }

  if (options.environmentalCompliance !== undefined) {
    query.environmentalCompliance = options.environmentalCompliance;
  }

  const [industrials, total] = await Promise.all([
    Industrial.find(query)
      .populate('property')
      .populate('createdBy', 'id fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Industrial.countDocuments(query),
  ]);

  const totalPages = Math.ceil(total / limit);
  return {
    data: industrials.map((ind: IIndustrialDocument) => ind.toPublicJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Get industrial statistics
 */
export async function getIndustrialStats(): Promise<{
  total: number;
  byFactoryType: Record<FactoryType, number>;
  byZoningType: Record<ZoningType, number>;
  totalPowerCapacity: number;
  totalWarehouseCapacity: number;
  environmentallyCompliant: number;
}> {
  const [total, factoryTypeAgg, zoningTypeAgg, powerAgg, warehouseAgg, compliantCount] =
    await Promise.all([
      Industrial.countDocuments(),
      Industrial.aggregate([{ $group: { _id: '$factoryType', count: { $sum: 1 } } }]),
      Industrial.aggregate([{ $group: { _id: '$zoningType', count: { $sum: 1 } } }]),
      Industrial.aggregate([{ $group: { _id: null, total: { $sum: '$powerCapacity.value' } } }]),
      Industrial.aggregate([
        { $group: { _id: null, total: { $sum: '$warehouseCapacity.value' } } },
      ]),
      Industrial.countDocuments({ environmentalCompliance: true }),
    ]);

  const byFactoryType = {} as Record<FactoryType, number>;
  for (const item of factoryTypeAgg) {
    byFactoryType[item._id as FactoryType] = item.count;
  }

  const byZoningType = {} as Record<ZoningType, number>;
  for (const item of zoningTypeAgg) {
    byZoningType[item._id as ZoningType] = item.count;
  }

  return {
    total,
    byFactoryType,
    byZoningType,
    totalPowerCapacity: powerAgg[0]?.total || 0,
    totalWarehouseCapacity: warehouseAgg[0]?.total || 0,
    environmentallyCompliant: compliantCount,
  };
}
