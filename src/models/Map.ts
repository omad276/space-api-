import mongoose, { Schema, Model } from 'mongoose';
import { IMapDocument, PublicMap, MapFileType, MapStatus, ScaleUnit } from '../types/index.js';

// ============================================
// Map Schema Definition
// ============================================

const mapSchema = new Schema<IMapDocument>(
  {
    project: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Map name is required'],
      trim: true,
      maxlength: [200, 'Name is too long'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description is too long'],
    },
    fileType: {
      type: String,
      enum: ['cad', 'pdf', 'image'] as MapFileType[],
      required: true,
    },
    originalFileName: {
      type: String,
      required: true,
    },
    storagePath: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'error'] as MapStatus[],
      default: 'uploading',
    },
    processingError: {
      type: String,
    },
    metadata: {
      width: Number,
      height: Number,
      pages: Number,
      layers: [String],
    },
    scale: {
      pixelDistance: { type: Number },
      realDistance: { type: Number },
      unit: { type: String, enum: ['m', 'cm', 'mm', 'ft', 'in'] as ScaleUnit[] },
      ratio: { type: Number },
    },
    isCalibrated: {
      type: Boolean,
      default: false,
    },
    version: {
      type: Number,
      default: 1,
    },
    uploadedBy: {
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
        delete ret.storagePath; // Don't expose storage path
        return ret;
      },
    },
  }
);

// ============================================
// Pre-save Hook: Validate Scale Calibration
// ============================================

mapSchema.pre('save', function (next) {
  // If setting isCalibrated to true, validate scale data
  if (this.isCalibrated) {
    if (!this.scale) {
      return next(new Error('Scale data is required for calibrated maps'));
    }

    const { pixelDistance, realDistance, unit } = this.scale;

    // Validate required scale fields
    if (!pixelDistance || pixelDistance <= 0) {
      return next(new Error('Pixel distance must be a positive number'));
    }
    if (!realDistance || realDistance <= 0) {
      return next(new Error('Real distance must be a positive number'));
    }
    if (!unit) {
      return next(new Error('Scale unit is required'));
    }

    // Auto-calculate ratio if not provided or invalid
    const calculatedRatio = realDistance / pixelDistance;
    if (!this.scale.ratio || this.scale.ratio <= 0 || isNaN(this.scale.ratio)) {
      this.scale.ratio = calculatedRatio;
    }

    // Final validation that ratio is positive
    if (this.scale.ratio <= 0 || isNaN(this.scale.ratio)) {
      return next(new Error('Scale ratio must be a positive number'));
    }
  }

  next();
});

// ============================================
// Indexes
// ============================================

mapSchema.index({ project: 1, createdAt: -1 });
mapSchema.index({ status: 1 });
mapSchema.index({ fileType: 1 });

// ============================================
// Virtual: Download URL
// ============================================

mapSchema.virtual('downloadUrl').get(function () {
  return `/api/maps/${this._id}/download`;
});

// ============================================
// Instance Methods
// ============================================

/**
 * Convert map document to public JSON
 */
mapSchema.methods.toPublicJSON = function (): PublicMap {
  const uploadedById =
    this.uploadedBy instanceof mongoose.Types.ObjectId
      ? this.uploadedBy.toString()
      : typeof this.uploadedBy === 'object' && this.uploadedBy._id
        ? this.uploadedBy._id.toString()
        : String(this.uploadedBy);

  return {
    id: this._id.toString(),
    project: this.project.toString(),
    name: this.name,
    description: this.description,
    fileType: this.fileType,
    originalFileName: this.originalFileName,
    fileSize: this.fileSize,
    mimeType: this.mimeType,
    status: this.status,
    processingError: this.processingError,
    metadata: this.metadata,
    scale: this.scale,
    isCalibrated: this.isCalibrated,
    version: this.version,
    uploadedBy: uploadedById,
    downloadUrl: `/api/maps/${this._id}/download`,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// ============================================
// Static Methods
// ============================================

interface MapModel extends Model<IMapDocument> {
  findByProject(projectId: string): Promise<IMapDocument[]>;
  findLatestVersion(projectId: string, name: string): Promise<IMapDocument | null>;
}

/**
 * Find all maps for a project
 */
mapSchema.statics.findByProject = function (projectId: string) {
  return this.find({ project: projectId })
    .populate('uploadedBy', 'id fullName email')
    .sort({ createdAt: -1 });
};

/**
 * Find the latest version of a map by name
 */
mapSchema.statics.findLatestVersion = function (projectId: string, name: string) {
  return this.findOne({ project: projectId, name })
    .sort({ version: -1 })
    .populate('uploadedBy', 'id fullName email');
};

// ============================================
// Export Model
// ============================================

export const Map = mongoose.model<IMapDocument, MapModel>('Map', mapSchema);
export default Map;
