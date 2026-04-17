import { z } from 'zod';
import { AppError } from './AppError.js';

// ============================================
// Validation Schemas
// ============================================

// User role enum
export const userRoleSchema = z.enum(['buyer', 'owner', 'agent', 'admin']);

// Email validation
const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email too short')
  .max(255, 'Email too long')
  .transform((v) => v.toLowerCase().trim());

// Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/\d/, 'Password must contain at least one number');

// Phone validation (optional, international format)
const phoneSchema = z
  .string()
  .transform((v) => v?.trim() || '')
  .refine((v) => v === '' || /^\+?[1-9]\d{7,14}$/.test(v), 'Invalid phone number format')
  .optional();

// Full name validation
const fullNameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name too long')
  .trim();

// ============================================
// Request Validation Schemas
// ============================================

// Country code validation (optional, e.g., +1, +44, +971)
const countryCodeSchema = z
  .string()
  .transform((v) => v?.trim() || '')
  .refine((v) => v === '' || /^\+?[1-9]\d{0,3}$/.test(v), 'Invalid country code')
  .optional();

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: fullNameSchema,
  phone: phoneSchema,
  countryCode: countryCodeSchema,
  role: userRoleSchema.default('buyer'),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const updateProfileSchema = z.object({
  fullName: fullNameSchema.optional(),
  phone: phoneSchema,
  avatar: z.string().url('Invalid avatar URL').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

// ============================================
// Validation Helper
// ============================================

/**
 * Validate data against a Zod schema
 * Throws AppError on validation failure
 */
export function validate<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    // Format Zod errors into a clean structure
    const errors: Record<string, string[]> = {};

    for (const error of result.error.errors) {
      const path = error.path.join('.') || 'value';
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path].push(error.message);
    }

    throw AppError.badRequest('Validation failed', errors);
  }

  return result.data;
}

// ============================================
// Type Exports
// ============================================

export type RegisterInput = z.output<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ============================================
// Project Validation Schemas
// ============================================

export const projectStageSchema = z.enum(['idea', 'mvp', 'beta', 'live']);
export const riskLevelSchema = z.enum(['low', 'medium', 'high']);
export const partnershipTypeSchema = z.enum([
  'technical',
  'investment',
  'cofounder',
  'marketing',
  'other',
]);

export const createProjectSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100, 'Name too long').trim(),
  industry: z.string().min(2, 'Industry is required').max(50, 'Industry too long').trim(),
  stage: projectStageSchema.default('idea'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description too long')
    .trim(),
  whatIsBuilt: z.string().max(1000, 'Too long').trim().optional(),
  whatIsMissing: z.string().max(1000, 'Too long').trim().optional(),
  partnershipType: partnershipTypeSchema,
  riskLevel: riskLevelSchema.default('medium'),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name too long')
    .trim()
    .optional(),
  industry: z
    .string()
    .min(2, 'Industry is required')
    .max(50, 'Industry too long')
    .trim()
    .optional(),
  stage: projectStageSchema.optional(),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description too long')
    .trim()
    .optional(),
  whatIsBuilt: z.string().max(1000, 'Too long').trim().optional(),
  whatIsMissing: z.string().max(1000, 'Too long').trim().optional(),
  partnershipType: partnershipTypeSchema.optional(),
  riskLevel: riskLevelSchema.optional(),
});

export const projectQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  industry: z.string().optional(),
  stage: projectStageSchema.optional(),
  minScore: z.coerce.number().min(0).max(100).optional(),
});

export type CreateProjectInput = z.output<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectQueryInput = z.output<typeof projectQuerySchema>;

// ============================================
// Property Validation Schemas
// ============================================

export const propertyTypeSchema = z.enum([
  'apartment',
  'villa',
  'office',
  'land',
  'building',
  'warehouse',
  'factory',
  'industrial_land',
]);

export const propertyCategorySchema = z.enum(['residential', 'commercial', 'industrial']);

export const propertyStatusSchema = z.enum([
  'for_sale',
  'for_rent',
  'off_plan',
  'investment',
  'sold',
  'rented',
]);

const locationSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  addressAr: z.string().optional().default(''),
  city: z.string().min(1, 'City is required'),
  cityAr: z.string().optional().default(''),
  country: z.string().min(1, 'Country is required'),
  countryAr: z.string().optional().default(''),
  coordinates: z
    .object({
      type: z.string().default('Point'),
      coordinates: z.tuple([z.number(), z.number()]).default([0, 0]),
    })
    .optional(),
});

export const createPropertySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim(),
  titleAr: z.string().min(1, 'Arabic title is required').max(200).trim(),
  description: z.string().min(1, 'Description is required').max(5000).trim(),
  descriptionAr: z.string().min(1, 'Arabic description is required').max(5000).trim(),
  type: propertyTypeSchema,
  category: propertyCategorySchema,
  status: propertyStatusSchema.default('for_sale'),
  price: z.number().positive('Price must be positive'),
  currency: z.string().default('USD'),
  area: z.number().positive('Area must be positive'),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  location: locationSchema,
  images: z.array(z.string().url()).default([]),
  features: z.array(z.string()).default([]),
  featuresAr: z.array(z.string()).default([]),
  isFeatured: z.boolean().default(false),
});

export const updatePropertySchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  titleAr: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(5000).trim().optional(),
  descriptionAr: z.string().max(5000).trim().optional(),
  type: propertyTypeSchema.optional(),
  category: propertyCategorySchema.optional(),
  status: propertyStatusSchema.optional(),
  price: z.number().positive().optional(),
  currency: z.string().optional(),
  area: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  location: locationSchema.partial().optional(),
  images: z.array(z.string().url()).optional(),
  features: z.array(z.string()).optional(),
  featuresAr: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

export const propertyQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  q: z.string().optional(),
  type: z.union([propertyTypeSchema, z.array(propertyTypeSchema)]).optional(),
  category: propertyCategorySchema.optional(),
  status: z.union([propertyStatusSchema, z.array(propertyStatusSchema)]).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  minArea: z.coerce.number().min(0).optional(),
  maxArea: z.coerce.number().min(0).optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().int().min(0).optional(),
  city: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  lng: z.coerce.number().optional(),
  lat: z.coerce.number().optional(),
  radius: z.coerce.number().min(0).optional(),
  sort: z
    .enum(['newest', 'oldest', 'price_asc', 'price_desc', 'area_asc', 'area_desc'])
    .default('newest'),
});

export type CreatePropertyInput = z.output<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type PropertyQueryInput = z.output<typeof propertyQuerySchema>;

// ============================================
// User Management Validation Schemas (Admin)
// ============================================

// Helper to properly parse boolean query params from URL strings
// Uses z.coerce pattern with custom transform for proper type inference
const booleanQueryParam = z
  .string()
  .optional()
  .transform((val): boolean | undefined => {
    if (val === undefined || val === '') return undefined;
    return val.toLowerCase() === 'true';
  });

export const userQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  role: userRoleSchema.optional(),
  isActive: booleanQueryParam,
  isVerified: booleanQueryParam,
  q: z.string().optional(), // search query
});

export const updateUserSchema = z.object({
  role: userRoleSchema.optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
  fullName: fullNameSchema.optional(),
  phone: phoneSchema,
});

export type UserQueryInput = z.output<typeof userQuerySchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ============================================
// Industrial Validation Schemas
// ============================================

export const factoryTypeSchema = z.enum([
  'manufacturing',
  'assembly',
  'processing',
  'warehouse',
  'distribution',
  'cold_storage',
  'food_processing',
  'pharmaceutical',
  'chemical',
  'textile',
  'automotive',
  'electronics',
  'other',
]);

export const zoningTypeSchema = z.enum([
  'light_industrial',
  'heavy_industrial',
  'mixed_use',
  'free_zone',
  'special_economic',
]);

export const powerUnitSchema = z.enum(['kW', 'MW', 'kVA', 'MVA']);
export const waterUnitSchema = z.enum(['liters', 'gallons', 'cubic_meters']);
export const heightUnitSchema = z.enum(['m', 'ft']);
export const loadingDockTypeSchema = z.enum(['ground_level', 'dock_height', 'both']);
export const capacityUnitSchema = z.enum(['sqm', 'sqft', 'pallets', 'tons']);

export const createIndustrialSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  factoryType: factoryTypeSchema,
  zoningType: zoningTypeSchema,
  powerCapacity: z.object({
    value: z.number().positive('Power capacity must be positive'),
    unit: powerUnitSchema.default('kW'),
  }),
  waterAccess: z
    .object({
      available: z.boolean(),
      dailyCapacity: z.number().positive().optional(),
      unit: waterUnitSchema.default('cubic_meters'),
    })
    .optional(),
  ceilingHeight: z
    .object({
      value: z.number().positive(),
      unit: heightUnitSchema.default('m'),
    })
    .optional(),
  loadingDocks: z
    .object({
      count: z.number().int().min(0),
      type: loadingDockTypeSchema.default('ground_level'),
    })
    .optional(),
  productionLines: z
    .object({
      count: z.number().int().min(0),
      description: z.string().max(500).optional(),
    })
    .optional(),
  warehouseCapacity: z
    .object({
      value: z.number().positive(),
      unit: capacityUnitSchema.default('sqm'),
    })
    .optional(),
  utilities: z
    .object({
      electricity: z.boolean().default(true),
      gas: z.boolean().default(false),
      water: z.boolean().default(true),
      sewage: z.boolean().default(true),
      internet: z.boolean().default(true),
      hvac: z.boolean().default(false),
    })
    .optional(),
  certifications: z.array(z.string().max(100)).max(20).optional(),
  environmentalCompliance: z.boolean().default(false),
});

export const updateIndustrialSchema = createIndustrialSchema.partial().omit({ propertyId: true });

export const industrialQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  factoryType: factoryTypeSchema.optional(),
  zoningType: zoningTypeSchema.optional(),
  minPowerCapacity: z.coerce.number().min(0).optional(),
  maxPowerCapacity: z.coerce.number().min(0).optional(),
  hasWaterAccess: booleanQueryParam,
  minCeilingHeight: z.coerce.number().min(0).optional(),
  hasLoadingDocks: booleanQueryParam,
  environmentalCompliance: booleanQueryParam,
});

export type CreateIndustrialInput = z.output<typeof createIndustrialSchema>;
export type UpdateIndustrialInput = z.infer<typeof updateIndustrialSchema>;
export type IndustrialQueryInput = z.output<typeof industrialQuerySchema>;

// ============================================
// Favorites Validation Schemas
// ============================================

export const addFavoriteSchema = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  collectionId: z.string().optional(),
  notes: z.string().max(1000, 'Notes too long').optional(),
});

export const updateFavoriteNotesSchema = z.object({
  notes: z.string().max(1000, 'Notes too long'),
});

export const moveToCollectionSchema = z.object({
  collectionId: z.string().nullable(),
});

export const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  nameAr: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  descriptionAr: z.string().max(500).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format')
    .optional(),
  icon: z.string().max(50).optional(),
});

export const updateCollectionSchema = createCollectionSchema.partial().extend({
  isShared: z.boolean().optional(),
});

export type AddFavoriteInput = z.infer<typeof addFavoriteSchema>;
export type UpdateFavoriteNotesInput = z.infer<typeof updateFavoriteNotesSchema>;
export type MoveToCollectionInput = z.infer<typeof moveToCollectionSchema>;
export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;

// ============================================
// Measurement Validation Schemas
// ============================================

export const measurementTypeSchema = z.enum(['area', 'distance', 'volume', 'perimeter', 'angle']);
export const measurementUnitSchema = z.enum([
  'm',
  'cm',
  'mm',
  'ft',
  'in',
  'sqm',
  'sqft',
  'cbm',
  'cbft',
  'deg',
]);

const point2DSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number().optional(),
});

export const createMeasurementSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  type: measurementTypeSchema,
  points: z.array(point2DSchema).min(2, 'At least 2 points required').max(1000),
  unit: measurementUnitSchema.optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  notes: z.string().max(500).optional(),
});

export const updateMeasurementSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  notes: z.string().max(500).optional(),
});

export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;
export type UpdateMeasurementInput = z.infer<typeof updateMeasurementSchema>;

// ============================================
// Cost Estimate Validation Schemas
// ============================================

export const costCategorySchema = z.enum(['material', 'labor', 'equipment', 'overhead', 'other']);

const costItemSchema = z.object({
  name: z.string().min(1, 'Item name required').max(200),
  category: costCategorySchema,
  unitCost: z.number().min(0, 'Unit cost must be non-negative'),
  unit: z.string().min(1).max(50),
  quantity: z.number().min(0, 'Quantity must be non-negative'),
});

export const createCostEstimateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  mapId: z.string().optional(),
  measurementIds: z.array(z.string()).optional(),
  items: z.array(costItemSchema).min(1, 'At least one item required'),
  taxRate: z.number().min(0).max(100).default(0),
  currency: z.string().length(3).default('USD'),
  notes: z.string().max(2000).optional(),
});

export const updateCostEstimateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  items: z.array(costItemSchema).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export const calculateFromMeasurementsSchema = z.object({
  measurementIds: z.array(z.string()).min(1, 'At least one measurement required'),
  unitCosts: z.array(
    z.object({
      type: measurementTypeSchema,
      costPerUnit: z.number().min(0),
      unit: z.string().min(1),
    })
  ),
});

export type CreateCostEstimateInput = z.infer<typeof createCostEstimateSchema>;
export type UpdateCostEstimateInput = z.infer<typeof updateCostEstimateSchema>;
export type CalculateFromMeasurementsInput = z.infer<typeof calculateFromMeasurementsSchema>;

// ============================================
// Map Validation Schemas
// ============================================

export const scaleUnitSchema = z.enum(['m', 'cm', 'mm', 'ft', 'in']);

export const uploadMapSchema = z.object({
  name: z.string().min(1, 'Map name is required').max(200),
  description: z.string().max(1000).optional(),
});

export const updateMapSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
});

export const calibrateMapSchema = z.object({
  pixelDistance: z.number().positive('Pixel distance must be positive'),
  realDistance: z.number().positive('Real distance must be positive'),
  unit: scaleUnitSchema,
});

export type UploadMapInput = z.infer<typeof uploadMapSchema>;
export type UpdateMapInput = z.infer<typeof updateMapSchema>;
export type CalibrateMapInput = z.infer<typeof calibrateMapSchema>;

// ============================================
// Pagination Query Schema (Reusable)
// ============================================

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQueryInput = z.output<typeof paginationQuerySchema>;

// ============================================
// Message Validation Schemas
// ============================================

export const sendMessageSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  content: z.string().min(1, 'Message content is required').max(5000, 'Message too long'),
  propertyId: z.string().optional(),
});

export const messageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MessageQueryInput = z.output<typeof messageQuerySchema>;
