import mongoose, { Schema, Model } from 'mongoose';
import {
  IProjectDocument,
  PublicProject,
  ProjectStage,
  RiskLevel,
  PartnershipType,
} from '../types/index.js';

// ============================================
// Project Schema Definition
// ============================================

const projectSchema = new Schema<IProjectDocument>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [3, 'Name must be at least 3 characters'],
      maxlength: [100, 'Name is too long'],
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      trim: true,
    },
    stage: {
      type: String,
      enum: ['idea', 'mvp', 'beta', 'live'] as ProjectStage[],
      default: 'idea',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description is too long'],
    },
    whatIsBuilt: {
      type: String,
      trim: true,
      maxlength: [1000, 'What is built description is too long'],
    },
    whatIsMissing: {
      type: String,
      trim: true,
      maxlength: [1000, 'What is missing description is too long'],
    },
    partnershipType: {
      type: String,
      enum: ['technical', 'investment', 'cofounder', 'marketing', 'other'] as PartnershipType[],
      required: [true, 'Partnership type is required'],
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'] as RiskLevel[],
      default: 'medium',
    },
    readinessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
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

projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ isPublic: 1, readinessScore: -1 });
projectSchema.index({ industry: 1 });
projectSchema.index({ stage: 1 });
projectSchema.index({ partnershipType: 1 });

// ============================================
// Pre-save Middleware
// ============================================

projectSchema.pre('save', function (next) {
  // Calculate readiness score before saving
  this.readinessScore = this.calculateReadinessScore();

  // Update isPublic based on readiness score
  this.isPublic = this.readinessScore >= 60;

  next();
});

// ============================================
// Instance Methods
// ============================================

/**
 * Calculate project readiness score based on defined rules
 *
 * Scoring Rules:
 * - Built features defined (whatIsBuilt): +25
 * - Stage beyond idea: +25
 * - Clear partnership request: +20
 * - Missing parts defined (whatIsMissing): +15
 * - Verified owner: +15 (requires populated owner)
 */
projectSchema.methods.calculateReadinessScore = function (): number {
  let score = 0;

  // +25: Built features defined
  if (this.whatIsBuilt && this.whatIsBuilt.trim().length >= 10) {
    score += 25;
  }

  // +25: Stage beyond idea
  if (this.stage !== 'idea') {
    score += 25;
  }

  // +20: Clear partnership request
  if (this.partnershipType && this.partnershipType !== 'other') {
    score += 20;
  }

  // +15: Missing parts clearly defined
  if (this.whatIsMissing && this.whatIsMissing.trim().length >= 10) {
    score += 15;
  }

  // +15: Owner verification (check if owner is populated and verified)
  // Note: This requires the owner to be populated
  if (
    this.populated('owner') &&
    this.owner &&
    typeof this.owner === 'object' &&
    'isVerified' in this.owner &&
    this.owner.isVerified
  ) {
    score += 15;
  }

  return Math.min(score, 100);
};

/**
 * Convert project document to public JSON
 */
projectSchema.methods.toPublicJSON = function (): PublicProject {
  const ownerId =
    this.owner instanceof mongoose.Types.ObjectId
      ? this.owner.toString()
      : typeof this.owner === 'object' && this.owner._id
        ? this.owner._id.toString()
        : String(this.owner);

  return {
    id: this._id.toString(),
    name: this.name,
    industry: this.industry,
    stage: this.stage,
    description: this.description,
    whatIsBuilt: this.whatIsBuilt,
    whatIsMissing: this.whatIsMissing,
    partnershipType: this.partnershipType,
    riskLevel: this.riskLevel,
    readinessScore: this.readinessScore,
    owner: ownerId,
    isPublic: this.isPublic,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// ============================================
// Static Methods
// ============================================

interface ProjectModel extends Model<IProjectDocument> {
  findByOwner(ownerId: string): Promise<IProjectDocument[]>;
  findPublicProjects(options?: {
    minScore?: number;
    industry?: string;
    stage?: string;
  }): Promise<IProjectDocument[]>;
}

/**
 * Find all projects by owner
 */
projectSchema.statics.findByOwner = function (ownerId: string) {
  return this.find({ owner: ownerId }).sort({ createdAt: -1 });
};

/**
 * Find public projects with optional filters
 */
projectSchema.statics.findPublicProjects = function (
  options: { minScore?: number; industry?: string; stage?: string } = {}
) {
  const query: Record<string, unknown> = {
    isPublic: true,
    readinessScore: { $gte: options.minScore || 60 },
  };

  if (options.industry) {
    query.industry = options.industry;
  }

  if (options.stage) {
    query.stage = options.stage;
  }

  return this.find(query).sort({ readinessScore: -1, createdAt: -1 });
};

// ============================================
// Export Model
// ============================================

export const Project = mongoose.model<IProjectDocument, ProjectModel>('Project', projectSchema);
export default Project;
