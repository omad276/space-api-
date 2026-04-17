import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { Map } from '../models/Map.js';
import { Measurement } from '../models/Measurement.js';
import { CostEstimate } from '../models/CostEstimate.js';
import { AppError } from '../utils/AppError.js';
import {
  PublicProject,
  IProjectDocument,
  ProjectStage,
  RiskLevel,
  PartnershipType,
} from '../types/index.js';

// ============================================
// Input Types
// ============================================

interface CreateProjectInput {
  name: string;
  industry: string;
  stage?: ProjectStage;
  description: string;
  whatIsBuilt?: string;
  whatIsMissing?: string;
  partnershipType: PartnershipType;
  riskLevel?: RiskLevel;
}

interface UpdateProjectInput {
  name?: string;
  industry?: string;
  stage?: ProjectStage;
  description?: string;
  whatIsBuilt?: string;
  whatIsMissing?: string;
  partnershipType?: PartnershipType;
  riskLevel?: RiskLevel;
}

interface ProjectQueryInput {
  page?: number;
  limit?: number;
  industry?: string;
  stage?: ProjectStage;
  minScore?: number;
}

// ============================================
// Response Types
// ============================================

interface PaginatedProjects {
  projects: PublicProject[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Project Service
// ============================================

/**
 * Create a new project
 */
export async function createProject(
  ownerId: string,
  data: CreateProjectInput
): Promise<PublicProject> {
  // Verify owner exists
  const owner = await User.findById(ownerId);
  if (!owner) {
    throw AppError.notFound('User not found');
  }

  // Create project
  const project = await Project.create({
    ...data,
    owner: ownerId,
  });

  // Populate owner for score calculation that includes verification status
  await project.populate('owner');

  // Recalculate score with populated owner
  project.readinessScore = project.calculateReadinessScore();
  project.isPublic = project.readinessScore >= 60;
  await project.save();

  return project.toPublicJSON();
}

/**
 * Get project by ID
 */
export async function getProjectById(
  projectId: string,
  requestingUserId?: string
): Promise<PublicProject> {
  const project = await Project.findById(projectId).populate(
    'owner',
    'id fullName email isVerified'
  );

  if (!project) {
    throw AppError.notFound('Project not found');
  }

  // Check visibility
  const isOwner = requestingUserId === project.owner._id.toString();
  if (!project.isPublic && !isOwner) {
    throw AppError.forbidden('This project is not publicly visible');
  }

  return project.toPublicJSON();
}

/**
 * Get all projects by owner
 */
export async function getProjectsByOwner(ownerId: string): Promise<PublicProject[]> {
  const projects = await Project.findByOwner(ownerId);
  return projects.map((p: IProjectDocument) => p.toPublicJSON());
}

/**
 * Get public projects with filters and pagination
 */
export async function getPublicProjects(query: ProjectQueryInput): Promise<PaginatedProjects> {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const { industry, stage, minScore } = query;
  const skip = (page - 1) * limit;

  // Build query filter
  const filter: Record<string, unknown> = {
    isPublic: true,
    readinessScore: { $gte: minScore || 60 },
  };

  if (industry) {
    filter.industry = { $regex: industry, $options: 'i' };
  }

  if (stage) {
    filter.stage = stage;
  }

  // Execute queries in parallel
  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('owner', 'id fullName email isVerified')
      .sort({ readinessScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Project.countDocuments(filter),
  ]);

  return {
    projects: projects.map((p) => p.toPublicJSON()),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  ownerId: string,
  data: UpdateProjectInput
): Promise<PublicProject> {
  const project = await Project.findById(projectId);

  if (!project) {
    throw AppError.notFound('Project not found');
  }

  // Check ownership
  if (project.owner.toString() !== ownerId) {
    throw AppError.forbidden('You can only update your own projects');
  }

  // Update fields
  Object.assign(project, data);

  // Populate owner for score recalculation
  await project.populate('owner');

  // Save (pre-save hook will recalculate score)
  await project.save();

  return project.toPublicJSON();
}

/**
 * Delete a project
 */
export async function deleteProject(
  projectId: string,
  ownerId: string,
  isAdmin: boolean = false
): Promise<void> {
  const project = await Project.findById(projectId);

  if (!project) {
    throw AppError.notFound('Project not found');
  }

  // Check ownership or admin
  if (project.owner.toString() !== ownerId && !isAdmin) {
    throw AppError.forbidden('You can only delete your own projects');
  }

  // Cascade delete: measurements, cost estimates, and maps
  const maps = await Map.find({ project: projectId });

  if (maps.length > 0) {
    const mapIds = maps.map((m) => m._id);

    // Delete all measurements for these maps
    const deletedMeasurements = await Measurement.deleteMany({ map: { $in: mapIds } });
    if (deletedMeasurements.deletedCount > 0) {
      console.log(
        `Cascade deleted ${deletedMeasurements.deletedCount} measurements for project ${projectId}`
      );
    }

    // Delete all maps
    const deletedMaps = await Map.deleteMany({ project: projectId });
    console.log(`Cascade deleted ${deletedMaps.deletedCount} maps for project ${projectId}`);
  }

  // Delete all cost estimates for this project
  const deletedEstimates = await CostEstimate.deleteMany({ project: projectId });
  if (deletedEstimates.deletedCount > 0) {
    console.log(
      `Cascade deleted ${deletedEstimates.deletedCount} cost estimates for project ${projectId}`
    );
  }

  await project.deleteOne();
}

/**
 * Get project statistics for owner
 */
export async function getOwnerStats(ownerId: string): Promise<{
  totalProjects: number;
  publicProjects: number;
  averageScore: number;
  projectsByStage: Record<string, number>;
}> {
  const projects = await Project.find({ owner: ownerId });

  const stats = {
    totalProjects: projects.length,
    publicProjects: projects.filter((p) => p.isPublic).length,
    averageScore:
      projects.length > 0
        ? Math.round(projects.reduce((sum, p) => sum + p.readinessScore, 0) / projects.length)
        : 0,
    projectsByStage: {
      idea: 0,
      mvp: 0,
      beta: 0,
      live: 0,
    },
  };

  for (const project of projects) {
    stats.projectsByStage[project.stage]++;
  }

  return stats;
}

/**
 * Recalculate readiness score for a project
 * Useful when owner verification status changes
 */
export async function recalculateScore(projectId: string): Promise<PublicProject> {
  const project = await Project.findById(projectId).populate('owner');

  if (!project) {
    throw AppError.notFound('Project not found');
  }

  project.readinessScore = project.calculateReadinessScore();
  project.isPublic = project.readinessScore >= 60;
  await project.save();

  return project.toPublicJSON();
}
