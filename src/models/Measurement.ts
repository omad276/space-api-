import mongoose, { Schema, Model } from 'mongoose';
import {
  IMeasurementDocument,
  PublicMeasurement,
  MeasurementType,
  MeasurementUnit,
} from '../types/index.js';

// ============================================
// Measurement Schema Definition
// ============================================

const pointSchema = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number },
  },
  { _id: false }
);

const measurementSchema = new Schema<IMeasurementDocument>(
  {
    map: {
      type: Schema.Types.ObjectId,
      ref: 'Map',
      required: [true, 'Map is required'],
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Measurement name is required'],
      trim: true,
      maxlength: [100, 'Name is too long'],
    },
    type: {
      type: String,
      enum: ['area', 'distance', 'volume', 'perimeter', 'angle'] as MeasurementType[],
      required: true,
    },
    points: {
      type: [pointSchema],
      required: true,
      validate: {
        validator: function (points: unknown[]) {
          return points.length >= 2;
        },
        message: 'At least 2 points are required for a measurement',
      },
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      enum: ['m', 'cm', 'mm', 'ft', 'in', 'sqm', 'sqft', 'cbm', 'cbft', 'deg'] as MeasurementUnit[],
      required: true,
    },
    displayValue: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: '#FF5722',
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes too long'],
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

measurementSchema.index({ map: 1, createdAt: -1 });
measurementSchema.index({ project: 1, type: 1 });
measurementSchema.index({ createdBy: 1 });

// ============================================
// Instance Methods
// ============================================

measurementSchema.methods.toPublicJSON = function (): PublicMeasurement {
  const createdById =
    this.createdBy instanceof mongoose.Types.ObjectId
      ? this.createdBy.toString()
      : typeof this.createdBy === 'object' && this.createdBy._id
        ? this.createdBy._id.toString()
        : String(this.createdBy);

  return {
    id: this._id.toString(),
    map: this.map.toString(),
    project: this.project.toString(),
    name: this.name,
    type: this.type,
    points: this.points,
    value: this.value,
    unit: this.unit,
    displayValue: this.displayValue,
    color: this.color,
    notes: this.notes,
    createdBy: createdById,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// ============================================
// Static Methods
// ============================================

interface MeasurementModel extends Model<IMeasurementDocument> {
  findByMap(mapId: string): Promise<IMeasurementDocument[]>;
  findByProject(projectId: string): Promise<IMeasurementDocument[]>;
  getTotalsByType(projectId: string): Promise<Record<MeasurementType, number>>;
}

measurementSchema.statics.findByMap = function (mapId: string) {
  return this.find({ map: mapId })
    .populate('createdBy', 'id fullName email')
    .sort({ createdAt: -1 });
};

measurementSchema.statics.findByProject = function (projectId: string) {
  return this.find({ project: projectId })
    .populate('createdBy', 'id fullName email')
    .populate('map', 'id name')
    .sort({ createdAt: -1 });
};

measurementSchema.statics.getTotalsByType = async function (
  projectId: string
): Promise<Record<MeasurementType, number>> {
  const results = await this.aggregate([
    { $match: { project: new mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$value' },
      },
    },
  ]);

  const totals: Record<MeasurementType, number> = {
    area: 0,
    distance: 0,
    volume: 0,
    perimeter: 0,
    angle: 0,
  };

  for (const result of results) {
    totals[result._id as MeasurementType] = result.total;
  }

  return totals;
};

// ============================================
// Export Model
// ============================================

export const Measurement = mongoose.model<IMeasurementDocument, MeasurementModel>(
  'Measurement',
  measurementSchema
);
export default Measurement;
