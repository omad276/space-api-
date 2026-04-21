import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: [
        'apartment',
        'villa',
        'office',
        'land',
        'building',
        'warehouse',
        'factory',
        'industrial_land',
        'storage',
        'shipping_container',
        'aviation_hangar',
        'train_cargo',
        'retail',
      ],
      required: true,
    },
    category: {
      type: String,
      enum: ['residential', 'commercial', 'industrial'],
      required: true,
    },
    status: {
      type: String,
      enum: ['for_sale', 'for_rent', 'off_plan', 'investment', 'sold', 'rented'],
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
    area: {
      type: Number,
      required: true,
    },
    bedrooms: Number,
    bathrooms: Number,
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
    features: {
      type: [String],
      default: [],
    },
    featuresAr: {
      type: [String],
      default: [],
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
    isFeatured: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for geo queries
propertySchema.index({ 'location.coordinates': '2dsphere' });

// Index for search
propertySchema.index({
  title: 'text',
  titleAr: 'text',
  description: 'text',
  descriptionAr: 'text',
});

// Indexes for common query patterns
propertySchema.index({ 'location.city': 1 });
propertySchema.index({ price: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ type: 1 });
propertySchema.index({ category: 1 });
propertySchema.index({ isActive: 1, createdAt: -1 });
propertySchema.index({ owner: 1, createdAt: -1 });

export default mongoose.model('Property', propertySchema);
