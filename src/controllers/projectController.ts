import { Response } from 'express';
import { projectService } from '../services/index.js';
import {
  validate,
  createProjectSchema,
  updateProjectSchema,
  projectQuerySchema,
} from '../utils/validation.js';
import { AuthRequest, ApiResponse } from '../types/index.js';

// ============================================
// Project Controller
// ============================================

/**
 * POST /api/projects
 * Create a new project
 */
export async function createProject(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const data = validate(createProjectSchema, req.body);
  const project = await projectService.createProject(req.user!.userId, data);

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    messageAr: 'تم إنشاء المشروع بنجاح',
    data: project,
  });
}

/**
 * GET /api/projects
 * Get public projects with filters and pagination
 */
export async function getProjects(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const query = validate(projectQuerySchema, req.query);
  const result = await projectService.getPublicProjects(query);

  res.json({
    success: true,
    message: 'Projects retrieved',
    messageAr: 'تم استرجاع المشاريع',
    data: result.projects,
    pagination: result.pagination,
  } as ApiResponse & { pagination: unknown });
}

/**
 * GET /api/projects/my
 * Get current user's projects
 */
export async function getMyProjects(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const projects = await projectService.getProjectsByOwner(req.user!.userId);

  res.json({
    success: true,
    message: 'Your projects retrieved',
    messageAr: 'تم استرجاع مشاريعك',
    data: projects,
  });
}

/**
 * GET /api/projects/my/stats
 * Get current user's project statistics
 */
export async function getMyStats(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const stats = await projectService.getOwnerStats(req.user!.userId);

  res.json({
    success: true,
    message: 'Statistics retrieved',
    messageAr: 'تم استرجاع الإحصائيات',
    data: stats,
  });
}

/**
 * GET /api/projects/:id
 * Get a project by ID
 */
export async function getProject(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const project = await projectService.getProjectById(req.params.id, req.user?.userId);

  res.json({
    success: true,
    message: 'Project retrieved',
    messageAr: 'تم استرجاع المشروع',
    data: project,
  });
}

/**
 * PATCH /api/projects/:id
 * Update a project
 */
export async function updateProject(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const data = validate(updateProjectSchema, req.body);
  const project = await projectService.updateProject(req.params.id, req.user!.userId, data);

  res.json({
    success: true,
    message: 'Project updated successfully',
    messageAr: 'تم تحديث المشروع بنجاح',
    data: project,
  });
}

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
export async function deleteProject(req: AuthRequest, res: Response<ApiResponse>): Promise<void> {
  const isAdmin = req.user!.role === 'admin';
  await projectService.deleteProject(req.params.id, req.user!.userId, isAdmin);

  res.json({
    success: true,
    message: 'Project deleted successfully',
    messageAr: 'تم حذف المشروع بنجاح',
  });
}

/**
 * POST /api/projects/:id/recalculate
 * Recalculate project readiness score (admin only)
 */
export async function recalculateScore(
  req: AuthRequest,
  res: Response<ApiResponse>
): Promise<void> {
  const project = await projectService.recalculateScore(req.params.id);

  res.json({
    success: true,
    message: 'Score recalculated',
    messageAr: 'تم إعادة حساب النتيجة',
    data: project,
  });
}
