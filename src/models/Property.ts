import mongoose from 'mongoose';

// ============================================
// BSpace Sudan - Property Types & Categories
// ============================================

export const LISTING_TYPES = ['rent', 'sale'] as const;

export const CATEGORIES = ['residential', 'commercial', 'land'] as const;

export const PROPERTY_TYPES = {
  residential: ['house', 'apartment', 'villa', 'room_studio'],
  commercial: ['office', 'shop_retail', 'warehouse', 'storage'],
  land: ['residential_plot', 'agricultural_land', 'commercial_plot'],
} as const;

export const ALL_PROPERTY_TYPES = [
  ...PROPERTY_TYPES.residential,
  ...PROPERTY_TYPES.commercial,
  ...PROPERTY_TYPES.land,
];

export const RENT_PERIODS = ['daily', 'weekly', 'monthly', 'yearly'] as const;
export const CURRENCIES = ['SDG', 'USD'] as const;
export const WATER_SOURCES = ['network', 'tank', 'borehole', 'none'] as const;
export const ELECTRICITY_SOURCES = ['grid', 'generator', 'solar', 'none'] as const;
export const LAND_CLASSES = ['first', 'second', 'third'] as const;

// ============================================
// Property Schema
// ============================================

const propertySchema = new mongoose.Schema(
  {
    // Basic info
    title: { type: String, required: true },
    titleAr: { type: String, required: true },
    description: { type: String, required: true },
    descriptionAr: { type: String, required: true },

    // Listing type: rent or sale
    listingType: {
      type: String,
      enum: LISTING_TYPES,
      required: true,
    },

    // Category and type
    category: {
      type: String,
      enum: CATEGORIES,
      required: true,
    },
    propertyType: {
      type: String,
      enum: ALL_PROPERTY_TYPES,
      required: true,
    },

    // Pricing
    price: { type: Number, required: true },
    currency: {
      type: String,
      enum: CURRENCIES,
      default: 'SDG',
    },

    // Rent-specific
    rentPeriod: {
      type: String,
      enum: RENT_PERIODS,
      default: 'monthly',
    },
    monthsInAdvance: { type: Number, default: 1, min: 1, max: 24 },

    // Sale-specific
    negotiable: { type: Boolean, default: true },

    // Location (Sudan structure)
    location: {
      state: { type: String, required: true },
      stateAr: { type: String, required: true },
      city: { type: String, required: true },
      cityAr: { type: String, required: true },
      neighborhood: { type: String, default: '' },
      neighborhoodAr: { type: String, default: '' },
      address: { type: String, default: '' },
      addressAr: { type: String, default: '' },
      coordinates: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] },
      },
    },

    // Common fields
    area: { type: Number, required: true },
    images: { type: [String], default: [] },

    // Residential fields
    bedrooms: { type: Number },
    bathrooms: { type: Number },
    floors: { type: Number },
    furnished: { type: Boolean },
    waterSource: { type: String, enum: WATER_SOURCES },
    electricity: { type: String, enum: ELECTRICITY_SOURCES },
    deedRegistered: { type: Boolean },

    // Land fields
    landClass: { type: String, enum: LAND_CLASSES },
    fenced: { type: Boolean },

    // Commercial fields
    streetFrontage: { type: Number },
    powerCapacity: { type: Number },

    // Features
    features: { type: [String], default: [] },
    featuresAr: { type: [String], default: [] },

    // Owner & contact
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    whatsappNumber: { type: String },
    phoneNumber: { type: String },
    showEmail: { type: Boolean, default: false },

    // Status
    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ============================================
// Indexes
// ============================================

propertySchema.index({ 'location.coordinates': '2dsphere' });
propertySchema.index({
  title: 'text',
  titleAr: 'text',
  description: 'text',
  descriptionAr: 'text',
});
propertySchema.index({ listingType: 1 });
propertySchema.index({ category: 1 });
propertySchema.index({ propertyType: 1 });
propertySchema.index({ 'location.state': 1 });
propertySchema.index({ 'location.city': 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ isActive: 1, isApproved: 1, createdAt: -1 });
propertySchema.index({ owner: 1, createdAt: -1 });

// ============================================
// Helper: get category from property type
// ============================================

export function getCategoryFromType(propertyType: string): string {
  if (PROPERTY_TYPES.residential.includes(propertyType as any)) return 'residential';
  if (PROPERTY_TYPES.commercial.includes(propertyType as any)) return 'commercial';
  if (PROPERTY_TYPES.land.includes(propertyType as any)) return 'land';
  return 'residential';
}

export default mongoose.model('Property', propertySchema);
