import mongoose, { Schema, Model } from 'mongoose';
import {
  ICostEstimateDocument,
  PublicCostEstimate,
  CostCategory,
  CostItem,
} from '../types/index.js';

// ============================================
// Cost Item Schema
// ============================================

const costItemSchema = new Schema<CostItem>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['material', 'labor', 'equipment', 'overhead', 'other'] as CostCategory[],
      required: true,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

// ============================================
// Cost Estimate Schema Definition
// ============================================

const costEstimateSchema = new Schema<ICostEstimateDocument>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
      index: true,
    },
    map: {
      type: Schema.Types.ObjectId,
      ref: 'Map',
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Estimate name is required'],
      trim: true,
      maxlength: [200, 'Name is too long'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description is too long'],
    },
    measurements: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Measurement',
      },
    ],
    items: {
      type: [costItemSchema],
      default: [],
    },
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true,
      uppercase: true,
    },
    notes: {
      type: String,
      maxlength: [2000, 'Notes too long'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

costEstimateSchema.index({ project: 1, createdAt: -1 });
costEstimateSchema.index({ createdBy: 1 });

// ============================================
// Pre-save Middleware
// ============================================

costEstimateSchema.pre('save', function (next) {
  this.recalculate();
  next();
});

// ============================================
// Instance Methods
// ============================================

/**
 * Recalculate totals based on items
 */
costEstimateSchema.methods.recalculate = function (): void {
  // Calculate item totals and subtotal
  this.subtotal = this.items.reduce((sum: number, item: CostItem) => {
    item.totalCost = item.unitCost * item.quantity;
    return sum + item.totalCost;
  }, 0);

  // Calculate tax
  this.taxAmount = this.subtotal * (this.taxRate / 100);

  // Calculate total
  this.total = this.subtotal + this.taxAmount;
};

/**
 * Convert to public JSON
 */
costEstimateSchema.methods.toPublicJSON = function (): PublicCostEstimate {
  const createdById =
    this.createdBy instanceof mongoose.Types.ObjectId
      ? this.createdBy.toString()
      : typeof this.createdBy === 'object' && this.createdBy._id
        ? this.createdBy._id.toString()
        : String(this.createdBy);

  return {
    id: this._id.toString(),
    project: this.project.toString(),
    map: this.map?.toString(),
    name: this.name,
    description: this.description,
    measurements: this.measurements.map((m: mongoose.Types.ObjectId) => m.toString()),
    items: this.items,
    subtotal: this.subtotal,
    taxRate: this.taxRate,
    taxAmount: this.taxAmount,
    total: this.total,
    currency: this.currency,
    notes: this.notes,
    createdBy: createdById,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// ============================================
// Static Methods
// ============================================

interface CostEstimateModel extends Model<ICostEstimateDocument> {
  findByProject(projectId: string): Promise<ICostEstimateDocument[]>;
  getProjectTotals(projectId: string): Promise<{
    totalEstimates: number;
    grandTotal: number;
    byCategory: Record<CostCategory, number>;
  }>;
}

costEstimateSchema.statics.findByProject = function (projectId: string) {
  return this.find({ project: projectId })
    .populate('createdBy', 'id fullName email')
    .populate('map', 'id name')
    .sort({ createdAt: -1 });
};

costEstimateSchema.statics.getProjectTotals = async function (projectId: string) {
  const estimates = await this.find({ project: projectId });

  const result = {
    totalEstimates: estimates.length,
    grandTotal: 0,
    byCategory: {
      material: 0,
      labor: 0,
      equipment: 0,
      overhead: 0,
      other: 0,
    } as Record<CostCategory, number>,
  };

  for (const estimate of estimates) {
    result.grandTotal += estimate.total;
    for (const item of estimate.items) {
      const category = item.category as CostCategory;
      result.byCategory[category] += item.totalCost;
    }
  }

  return result;
};

// ============================================
// Export Model
// ============================================

export const CostEstimate = mongoose.model<ICostEstimateDocument, CostEstimateModel>(
  'CostEstimate',
  costEstimateSchema
);
export default CostEstimate;
