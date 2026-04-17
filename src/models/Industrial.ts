import mongoose, { Schema, Model } from 'mongoose';
import { IIndustrialDocument, PublicIndustrial, FactoryType, ZoningType } from '../types/index.js';

// ============================================
// Industrial Schema Definition
// ============================================

const industrialSchema = new Schema<IIndustrialDocument>(
  {
    property: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property reference is required'],
      unique: true,
      index: true,
    },
    factoryType: {
      type: String,
      enum: [
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
      ] as FactoryType[],
      required: [true, 'Factory type is required'],
    },
    powerCapacity: {
      value: {
        type: Number,
        required: [true, 'Power capacity value is required'],
        min: [0, 'Power capacity cannot be negative'],
      },
      unit: {
        type: String,
        enum: ['kW', 'MW', 'kVA', 'MVA'],
        default: 'kW',
      },
    },
    waterAccess: {
      available: {
        type: Boolean,
        default: false,
      },
      dailyCapacity: {
        type: Number,
        min: 0,
      },
      unit: {
        type: String,
        enum: ['liters', 'gallons', 'cubic_meters'],
        default: 'cubic_meters',
      },
    },
    ceilingHeight: {
      value: {
        type: Number,
        min: [0, 'Ceiling height cannot be negative'],
      },
      unit: {
        type: String,
        enum: ['m', 'ft'],
        default: 'm',
      },
    },
    loadingDocks: {
      count: {
        type: Number,
        min: 0,
        default: 0,
      },
      type: {
        type: String,
        enum: ['ground_level', 'dock_height', 'both'],
        default: 'ground_level',
      },
    },
    zoningType: {
      type: String,
      enum: [
        'light_industrial',
        'heavy_industrial',
        'mixed_use',
        'free_zone',
        'special_economic',
      ] as ZoningType[],
      required: [true, 'Zoning type is required'],
    },
    productionLines: {
      count: {
        type: Number,
        min: 0,
        default: 0,
      },
      description: String,
    },
    warehouseCapacity: {
      value: {
        type: Number,
        min: 0,
      },
      unit: {
        type: String,
        enum: ['sqm', 'sqft', 'pallets', 'tons'],
        default: 'sqm',
      },
    },
    utilities: {
      electricity: { type: Boolean, default: false },
      gas: { type: Boolean, default: false },
      water: { type: Boolean, default: false },
      sewage: { type: Boolean, default: false },
      internet: { type: Boolean, default: false },
      hvac: { type: Boolean, default: false },
    },
    certifications: [
      {
        type: String,
        trim: true,
      },
    ],
    environmentalCompliance: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as mongoose.Types.ObjectId).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ============================================
// Indexes
// ============================================

industrialSchema.index({ factoryType: 1 });
industrialSchema.index({ zoningType: 1 });
industrialSchema.index({ 'powerCapacity.value': 1 });
industrialSchema.index({ createdAt: -1 });

// ============================================
// Instance Methods
// ============================================

/**
 * Convert industrial document to public JSON
 */
industrialSchema.methods.toPublicJSON = function (): PublicIndustrial {
  const propertyId =
    this.property instanceof mongoose.Types.ObjectId
      ? this.property.toString()
      : typeof this.property === 'object' && this.property._id
        ? this.property._id.toString()
        : String(this.property);

  const createdById =
    this.createdBy instanceof mongoose.Types.ObjectId
      ? this.createdBy.toString()
      : typeof this.createdBy === 'object' && this.createdBy._id
        ? this.createdBy._id.toString()
        : String(this.createdBy);

  return {
    id: this._id.toString(),
    property: propertyId,
    factoryType: this.factoryType,
    powerCapacity: this.powerCapacity,
    waterAccess: this.waterAccess,
    ceilingHeight: this.ceilingHeight,
    loadingDocks: this.loadingDocks,
    zoningType: this.zoningType,
    productionLines: this.productionLines,
    warehouseCapacity: this.warehouseCapacity,
    utilities: this.utilities,
    certifications: this.certifications,
    environmentalCompliance: this.environmentalCompliance,
    createdBy: createdById,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// ============================================
// Static Methods
// ============================================

interface IndustrialModel extends Model<IIndustrialDocument> {
  findByProperty(propertyId: string): Promise<IIndustrialDocument | null>;
  findByFactoryType(factoryType: FactoryType): Promise<IIndustrialDocument[]>;
  findByZoningType(zoningType: ZoningType): Promise<IIndustrialDocument[]>;
}

/**
 * Find industrial data by property ID
 */
industrialSchema.statics.findByProperty = function (propertyId: string) {
  return this.findOne({ property: propertyId })
    .populate('property')
    .populate('createdBy', 'id fullName email');
};

/**
 * Find all industrial properties by factory type
 */
industrialSchema.statics.findByFactoryType = function (factoryType: FactoryType) {
  return this.find({ factoryType })
    .populate('property')
    .populate('createdBy', 'id fullName email')
    .sort({ createdAt: -1 });
};

/**
 * Find all industrial properties by zoning type
 */
industrialSchema.statics.findByZoningType = function (zoningType: ZoningType) {
  return this.find({ zoningType })
    .populate('property')
    .populate('createdBy', 'id fullName email')
    .sort({ createdAt: -1 });
};

// ============================================
// Export Model
// ============================================

export const Industrial = mongoose.model<IIndustrialDocument, IndustrialModel>(
  'Industrial',
  industrialSchema
);
export default Industrial;
