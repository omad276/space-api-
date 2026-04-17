import mongoose from 'mongoose';

const spaceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    titleAr: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    descriptionAr: {
      type: String,
      required: true,
    },
    // Space type - supports all kinds of spaces
    spaceType: {
      type: String,
      enum: [
        'land', // أرض
        'warehouse', // مستودع
        'storage', // تخزين
        'shipping_container', // حاوية شحن
        'aviation_hangar', // حظيرة طيران
        'train_cargo', // شحن قطار
        'office', // مكتب
        'retail', // محل تجاري
        'industrial', // منشأة صناعية
        'apartment', // شقة
        'villa', // فيلا
        'building', // مبنى
        'parking', // موقف سيارات
        'cold_storage', // تخزين بارد
        'other', // أخرى
      ],
      required: true,
    },
    category: {
      type: String,
      enum: ['residential', 'commercial', 'industrial', 'logistics', 'mixed'],
      required: true,
    },
    status: {
      type: String,
      enum: ['for_sale', 'for_rent', 'sold', 'rented', 'available'],
      default: 'for_sale',
    },
    price: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    // Rental options
    rentalPeriod: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'one_time'],
      default: 'monthly',
    },
    // Space dimensions
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, default: 'meters' },
    },
    area: {
      type: Number,
      required: true,
    },
    areaUnit: {
      type: String,
      enum: ['sqm', 'sqft', 'acres', 'hectares'],
      default: 'sqm',
    },
    // Capacity for containers/storage
    capacity: {
      weight: Number,
      weightUnit: { type: String, default: 'kg' },
      volume: Number,
      volumeUnit: { type: String, default: 'cbm' },
    },
    // For residential/office spaces
    bedrooms: Number,
    bathrooms: Number,
    floors: Number,
    // Location
    location: {
      address: { type: String, required: true },
      addressAr: { type: String, required: true },
      city: { type: String, required: true },
      cityAr: { type: String, required: true },
      country: { type: String, default: '' },
      countryAr: { type: String, default: '' },
      coordinates: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      },
    },
    images: {
      type: [String],
      default: [],
    },
    // Features and amenities
    features: {
      type: [String],
      default: [],
    },
    featuresAr: {
      type: [String],
      default: [],
    },
    // Special features for specific space types
    specialFeatures: {
      // For warehouses/storage
      hasLoadingDock: Boolean,
      hasCraneAccess: Boolean,
      hasRefrigeration: Boolean,
      hasSecuritySystem: Boolean,
      has24HourAccess: Boolean,
      // For containers
      containerSize: String, // '20ft', '40ft', '40ft_hc'
      containerCondition: String,
      // For aviation
      hangarSize: String,
      runwayAccess: Boolean,
      // For land
      isZoned: Boolean,
      zoningType: String,
      utilities: [String],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    availableFrom: {
      type: Date,
      default: Date.now,
    },
    availableUntil: Date,
  },
  { timestamps: true }
);

// Index for geo queries
spaceSchema.index({ 'location.coordinates': '2dsphere' });

// Index for search
spaceSchema.index({
  title: 'text',
  titleAr: 'text',
  description: 'text',
  descriptionAr: 'text',
});

// Indexes for common query patterns
spaceSchema.index({ 'location.city': 1 });
spaceSchema.index({ 'location.country': 1 });
spaceSchema.index({ price: 1 });
spaceSchema.index({ status: 1 });
spaceSchema.index({ spaceType: 1 });
spaceSchema.index({ category: 1 });
spaceSchema.index({ isActive: 1, isApproved: 1, createdAt: -1 });
spaceSchema.index({ owner: 1, createdAt: -1 });

export default mongoose.model('Space', spaceSchema);
