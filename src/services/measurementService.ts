import { Measurement } from '../models/Measurement.js';
import { CostEstimate } from '../models/CostEstimate.js';
import { Map } from '../models/Map.js';
import { Project } from '../models/Project.js';
import { AppError } from '../utils/AppError.js';
import {
  PublicMeasurement,
  PublicCostEstimate,
  IMeasurementDocument,
  ICostEstimateDocument,
  MeasurementType,
  MeasurementUnit,
  Point2D,
  Point3D,
  CostItem,
  CostItemInput,
  CostCategory,
  MapScale,
  ScaleUnit,
} from '../types/index.js';
import {
  getPaginationParams,
  buildPaginationResult,
  PaginationResult,
} from '../utils/pagination.js';

// ============================================
// Calculation Utilities
// ============================================

/**
 * Calculate distance between two points
 */
function calculateDistance(p1: Point2D, p2: Point2D): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate polygon area using Shoelace formula
 */
function calculatePolygonArea(points: Point2D[]): number {
  if (points.length < 3) return 0;

  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  return Math.abs(area) / 2;
}

/**
 * Calculate perimeter of a polygon
 */
function calculatePerimeter(points: Point2D[]): number {
  if (points.length < 2) return 0;

  let perimeter = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    perimeter += calculateDistance(points[i], points[j]);
  }

  return perimeter;
}

/**
 * Calculate angle between three points (in degrees)
 */
function calculateAngle(p1: Point2D, vertex: Point2D, p2: Point2D): number {
  const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y };
  const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const cross = v1.x * v2.y - v1.y * v2.x;

  const angle = Math.atan2(Math.abs(cross), dot);
  return (angle * 180) / Math.PI;
}

/**
 * Calculate volume (simplified for rectangular prisms)
 * Exported for future use
 */
export function calculateVolume(points: Point3D[], height?: number): number {
  const baseArea = calculatePolygonArea(points);
  const h = height || points[0]?.z || 0;
  return baseArea * h;
}

/**
 * Convert scale unit to appropriate measurement unit based on type
 */
function scaleUnitToMeasurementUnit(scaleUnit: ScaleUnit, type: MeasurementType): MeasurementUnit {
  switch (type) {
    case 'area':
      return scaleUnit === 'ft' || scaleUnit === 'in' ? 'sqft' : 'sqm';
    case 'volume':
      return scaleUnit === 'ft' || scaleUnit === 'in' ? 'cbft' : 'cbm';
    case 'angle':
      return 'deg';
    default:
      return scaleUnit as MeasurementUnit;
  }
}

/**
 * Convert value from one linear unit to meters for consistent storage
 */
function convertToMeters(value: number, fromUnit: ScaleUnit): number {
  const toMeterFactors: Record<ScaleUnit, number> = {
    m: 1,
    cm: 0.01,
    mm: 0.001,
    ft: 0.3048,
    in: 0.0254,
  };
  return value * toMeterFactors[fromUnit];
}

/**
 * Apply scale calibration to pixel measurement
 */
function applyScale(
  pixelValue: number,
  scale: MapScale | undefined,
  type: MeasurementType
): number {
  if (!scale || !scale.ratio) {
    // Default: 100px = 1m (legacy fallback)
    const defaultRatio = 0.01;
    switch (type) {
      case 'area':
        return pixelValue * defaultRatio * defaultRatio;
      case 'volume':
        return pixelValue * defaultRatio * defaultRatio * defaultRatio;
      default:
        return pixelValue * defaultRatio;
    }
  }

  // Convert ratio to meters for consistent storage
  const ratioInMeters = convertToMeters(scale.ratio, scale.unit);

  switch (type) {
    case 'area':
      return pixelValue * ratioInMeters * ratioInMeters;
    case 'volume':
      return pixelValue * ratioInMeters * ratioInMeters * ratioInMeters;
    default:
      return pixelValue * ratioInMeters;
  }
}

/**
 * Get appropriate unit for measurement type
 */
function getDefaultUnit(type: MeasurementType, scale?: MapScale): MeasurementUnit {
  if (scale?.unit) {
    return scaleUnitToMeasurementUnit(scale.unit, type);
  }

  switch (type) {
    case 'area':
      return 'sqm';
    case 'volume':
      return 'cbm';
    case 'angle':
      return 'deg';
    default:
      return 'm';
  }
}

/**
 * Format value with unit for display
 */
function formatDisplayValue(value: number, unit: MeasurementUnit): string {
  const precision = unit === 'deg' ? 1 : 2;
  const formattedValue = value.toFixed(precision);

  const unitLabels: Record<MeasurementUnit, string> = {
    m: 'm',
    cm: 'cm',
    mm: 'mm',
    ft: 'ft',
    in: 'in',
    sqm: 'm²',
    sqft: 'ft²',
    cbm: 'm³',
    cbft: 'ft³',
    deg: '°',
  };

  return `${formattedValue} ${unitLabels[unit]}`;
}

// ============================================
// Measurement Service
// ============================================

interface CreateMeasurementInput {
  mapId: string;
  userId: string;
  name: string;
  type: MeasurementType;
  points: Point2D[] | Point3D[];
  unit?: MeasurementUnit;
  color?: string;
  notes?: string;
}

interface UpdateMeasurementInput {
  name?: string;
  color?: string;
  notes?: string;
}

/**
 * Create a new measurement
 */
export async function createMeasurement(input: CreateMeasurementInput): Promise<PublicMeasurement> {
  const { mapId, userId, name, type, points, unit, color, notes } = input;

  // Verify map exists
  const map = await Map.findById(mapId);
  if (!map) {
    throw AppError.notFound('Map not found');
  }

  // Verify map is calibrated before allowing measurements
  if (!map.isCalibrated) {
    throw AppError.badRequest('Map must be calibrated before creating measurements');
  }

  // Verify project ownership
  const project = await Project.findById(map.project);
  if (!project || project.owner.toString() !== userId) {
    throw AppError.forbidden('You can only add measurements to your own projects');
  }

  // Calculate pixel value based on type
  let pixelValue: number;
  switch (type) {
    case 'distance':
      pixelValue =
        points.length === 2
          ? calculateDistance(points[0], points[1])
          : calculatePerimeter(points as Point2D[]);
      break;
    case 'area':
      pixelValue = calculatePolygonArea(points as Point2D[]);
      break;
    case 'perimeter':
      pixelValue = calculatePerimeter(points as Point2D[]);
      break;
    case 'volume': {
      // Height comes from first point's z coordinate (already in real-world units from frontend)
      const height = (points as Point3D[])[0]?.z || 0;
      // Calculate pixel area first
      const pixelArea = calculatePolygonArea(points as Point2D[]);
      // Apply scale to get real-world area, then multiply by height
      const scaledArea = applyScale(pixelArea, map.scale, 'area');
      pixelValue = scaledArea * height; // Both now in real-world units
      break;
    }
    case 'angle':
      if (points.length !== 3) {
        throw AppError.badRequest('Angle measurement requires exactly 3 points');
      }
      pixelValue = calculateAngle(points[0], points[1], points[2]);
      break;
    default:
      throw AppError.badRequest(`Unknown measurement type: ${type}`);
  }

  // Apply scale calibration (angle doesn't need scaling, volume is pre-calculated with scale)
  const value =
    type === 'angle' || type === 'volume' ? pixelValue : applyScale(pixelValue, map.scale, type);

  const measurementUnit = unit || getDefaultUnit(type, map.scale);
  const displayValue = formatDisplayValue(value, measurementUnit);

  const measurement = await Measurement.create({
    map: mapId,
    project: map.project,
    name,
    type,
    points,
    value,
    unit: measurementUnit,
    displayValue,
    color,
    notes,
    createdBy: userId,
  });

  await measurement.populate('createdBy', 'id fullName email');

  return measurement.toPublicJSON();
}

/**
 * Get all measurements for a map with pagination
 */
export async function getMapMeasurements(
  mapId: string,
  userId?: string,
  options?: { page?: number; limit?: number }
): Promise<PaginationResult<PublicMeasurement>> {
  const map = await Map.findById(mapId);
  if (!map) {
    throw AppError.notFound('Map not found');
  }

  // Check access
  const project = await Project.findById(map.project);
  if (!project) {
    throw AppError.notFound('Project not found');
  }

  const isOwner = userId === project.owner.toString();
  if (!project.isPublic && !isOwner) {
    throw AppError.forbidden('You do not have access to this map');
  }

  const { page, limit, skip } = getPaginationParams(options || {});

  const [measurements, total] = await Promise.all([
    Measurement.find({ map: mapId })
      .populate('createdBy', 'id fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Measurement.countDocuments({ map: mapId }),
  ]);

  const data = measurements.map((m: IMeasurementDocument) => m.toPublicJSON());
  return buildPaginationResult(data, total, page, limit);
}

/**
 * Get all measurements for a project with pagination
 */
export async function getProjectMeasurements(
  projectId: string,
  userId?: string,
  options?: { page?: number; limit?: number }
): Promise<PaginationResult<PublicMeasurement>> {
  const project = await Project.findById(projectId);
  if (!project) {
    throw AppError.notFound('Project not found');
  }

  const isOwner = userId === project.owner.toString();
  if (!project.isPublic && !isOwner) {
    throw AppError.forbidden('You do not have access to this project');
  }

  const { page, limit, skip } = getPaginationParams(options || {});

  const [measurements, total] = await Promise.all([
    Measurement.find({ project: projectId })
      .populate('createdBy', 'id fullName email')
      .populate('map', 'id name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Measurement.countDocuments({ project: projectId }),
  ]);

  const data = measurements.map((m: IMeasurementDocument) => m.toPublicJSON());
  return buildPaginationResult(data, total, page, limit);
}

/**
 * Get measurement by ID
 */
export async function getMeasurementById(
  measurementId: string,
  userId?: string
): Promise<PublicMeasurement> {
  const measurement = await Measurement.findById(measurementId).populate(
    'createdBy',
    'id fullName email'
  );

  if (!measurement) {
    throw AppError.notFound('Measurement not found');
  }

  // Check access
  const project = await Project.findById(measurement.project);
  if (!project) {
    throw AppError.notFound('Project not found');
  }

  const isOwner = userId === project.owner.toString();
  if (!project.isPublic && !isOwner) {
    throw AppError.forbidden('You do not have access to this measurement');
  }

  return measurement.toPublicJSON();
}

/**
 * Update measurement
 */
export async function updateMeasurement(
  measurementId: string,
  userId: string,
  data: UpdateMeasurementInput
): Promise<PublicMeasurement> {
  const measurement = await Measurement.findById(measurementId);

  if (!measurement) {
    throw AppError.notFound('Measurement not found');
  }

  // Check ownership
  const project = await Project.findById(measurement.project);
  if (!project || project.owner.toString() !== userId) {
    throw AppError.forbidden('You can only update measurements in your own projects');
  }

  if (data.name) measurement.name = data.name;
  if (data.color) measurement.color = data.color;
  if (data.notes !== undefined) measurement.notes = data.notes;

  await measurement.save();
  await measurement.populate('createdBy', 'id fullName email');

  return measurement.toPublicJSON();
}

/**
 * Delete measurement
 */
export async function deleteMeasurement(
  measurementId: string,
  userId: string,
  isAdmin: boolean = false
): Promise<void> {
  const measurement = await Measurement.findById(measurementId);

  if (!measurement) {
    throw AppError.notFound('Measurement not found');
  }

  const project = await Project.findById(measurement.project);
  if (!project) {
    throw AppError.notFound('Project not found');
  }

  if (project.owner.toString() !== userId && !isAdmin) {
    throw AppError.forbidden('You can only delete measurements from your own projects');
  }

  await measurement.deleteOne();
}

/**
 * Get measurement totals by type for a project
 */
export async function getMeasurementTotals(
  projectId: string,
  userId?: string
): Promise<{
  totals: Record<MeasurementType, number>;
  count: Record<MeasurementType, number>;
}> {
  // Verify project access
  const project = await Project.findById(projectId);
  if (!project) {
    throw AppError.notFound('Project not found');
  }

  const isOwner = userId === project.owner.toString();
  if (!project.isPublic && !isOwner) {
    throw AppError.forbidden('You do not have access to this project');
  }

  const measurements = await Measurement.find({ project: projectId });

  const result = {
    totals: {
      area: 0,
      distance: 0,
      volume: 0,
      perimeter: 0,
      angle: 0,
    } as Record<MeasurementType, number>,
    count: {
      area: 0,
      distance: 0,
      volume: 0,
      perimeter: 0,
      angle: 0,
    } as Record<MeasurementType, number>,
  };

  for (const m of measurements) {
    result.totals[m.type] += m.value;
    result.count[m.type]++;
  }

  return result;
}

// ============================================
// Cost Estimate Service
// ============================================

interface CreateCostEstimateInput {
  projectId: string;
  userId: string;
  name: string;
  description?: string;
  mapId?: string;
  measurementIds?: string[];
  items: CostItemInput[];
  taxRate?: number;
  currency?: string;
  notes?: string;
}

interface UpdateCostEstimateInput {
  name?: string;
  description?: string;
  items?: CostItemInput[];
  taxRate?: number;
  notes?: string;
}

/**
 * Create a cost estimate
 */
export async function createCostEstimate(
  input: CreateCostEstimateInput
): Promise<PublicCostEstimate> {
  const {
    projectId,
    userId,
    name,
    description,
    mapId,
    measurementIds,
    items,
    taxRate,
    currency,
    notes,
  } = input;

  // Verify project ownership
  const project = await Project.findById(projectId);
  if (!project || project.owner.toString() !== userId) {
    throw AppError.forbidden('You can only create estimates for your own projects');
  }

  // Verify map if provided
  if (mapId) {
    const map = await Map.findById(mapId);
    if (!map || map.project.toString() !== projectId) {
      throw AppError.badRequest('Invalid map for this project');
    }
  }

  const estimate = await CostEstimate.create({
    project: projectId,
    map: mapId,
    name,
    description,
    measurements: measurementIds || [],
    items: items.map((item) => ({
      ...item,
      totalCost: item.unitCost * item.quantity,
    })),
    taxRate: taxRate || 0,
    currency: currency || 'USD',
    notes,
    createdBy: userId,
  });

  await estimate.populate('createdBy', 'id fullName email');

  return estimate.toPublicJSON();
}

/**
 * Get all cost estimates for a project with pagination
 */
export async function getProjectEstimates(
  projectId: string,
  userId?: string,
  options?: { page?: number; limit?: number }
): Promise<PaginationResult<PublicCostEstimate>> {
  const project = await Project.findById(projectId);
  if (!project) {
    throw AppError.notFound('Project not found');
  }

  const isOwner = userId === project.owner.toString();
  if (!project.isPublic && !isOwner) {
    throw AppError.forbidden('You do not have access to this project');
  }

  const { page, limit, skip } = getPaginationParams(options || {});

  const [estimates, total] = await Promise.all([
    CostEstimate.find({ project: projectId })
      .populate('createdBy', 'id fullName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    CostEstimate.countDocuments({ project: projectId }),
  ]);

  const data = estimates.map((e: ICostEstimateDocument) => e.toPublicJSON());
  return buildPaginationResult(data, total, page, limit);
}

/**
 * Get cost estimate by ID
 */
export async function getCostEstimateById(
  estimateId: string,
  userId?: string
): Promise<PublicCostEstimate> {
  const estimate = await CostEstimate.findById(estimateId)
    .populate('createdBy', 'id fullName email')
    .populate('map', 'id name')
    .populate('measurements');

  if (!estimate) {
    throw AppError.notFound('Cost estimate not found');
  }

  const project = await Project.findById(estimate.project);
  if (!project) {
    throw AppError.notFound('Project not found');
  }

  const isOwner = userId === project.owner.toString();
  if (!project.isPublic && !isOwner) {
    throw AppError.forbidden('You do not have access to this estimate');
  }

  return estimate.toPublicJSON();
}

/**
 * Update cost estimate
 */
export async function updateCostEstimate(
  estimateId: string,
  userId: string,
  data: UpdateCostEstimateInput
): Promise<PublicCostEstimate> {
  const estimate = await CostEstimate.findById(estimateId);

  if (!estimate) {
    throw AppError.notFound('Cost estimate not found');
  }

  const project = await Project.findById(estimate.project);
  if (!project || project.owner.toString() !== userId) {
    throw AppError.forbidden('You can only update estimates in your own projects');
  }

  if (data.name) estimate.name = data.name;
  if (data.description !== undefined) estimate.description = data.description;
  if (data.items) {
    estimate.items = data.items.map((item) => ({
      ...item,
      totalCost: item.unitCost * item.quantity,
    }));
  }
  if (data.taxRate !== undefined) estimate.taxRate = data.taxRate;
  if (data.notes !== undefined) estimate.notes = data.notes;

  await estimate.save(); // recalculate is called in pre-save
  await estimate.populate('createdBy', 'id fullName email');

  return estimate.toPublicJSON();
}

/**
 * Delete cost estimate
 */
export async function deleteCostEstimate(
  estimateId: string,
  userId: string,
  isAdmin: boolean = false
): Promise<void> {
  const estimate = await CostEstimate.findById(estimateId);

  if (!estimate) {
    throw AppError.notFound('Cost estimate not found');
  }

  const project = await Project.findById(estimate.project);
  if (!project) {
    throw AppError.notFound('Project not found');
  }

  if (project.owner.toString() !== userId && !isAdmin) {
    throw AppError.forbidden('You can only delete estimates from your own projects');
  }

  await estimate.deleteOne();
}

/**
 * Get project cost summary
 */
export async function getProjectCostSummary(projectId: string): Promise<{
  totalEstimates: number;
  grandTotal: number;
  byCategory: Record<CostCategory, number>;
  currency: string;
}> {
  const project = await Project.findById(projectId);
  if (!project) {
    throw AppError.notFound('Project not found');
  }

  const totals = await CostEstimate.getProjectTotals(projectId);

  return {
    ...totals,
    currency: 'USD', // Default currency
  };
}

/**
 * Calculate cost from measurements
 */
export async function calculateCostFromMeasurements(
  measurementIds: string[],
  unitCosts: { type: MeasurementType; costPerUnit: number; unit: string }[],
  userId?: string
): Promise<CostItem[]> {
  const measurements = await Measurement.find({ _id: { $in: measurementIds } });

  // Verify user has access to all measurements
  if (userId) {
    const projectIds = [...new Set(measurements.map((m) => m.project.toString()))];
    const projects = await Project.find({ _id: { $in: projectIds } });

    for (const project of projects) {
      const isOwner = userId === project.owner.toString();
      if (!project.isPublic && !isOwner) {
        throw AppError.forbidden('You do not have access to one or more measurements');
      }
    }
  }

  const items: CostItem[] = [];

  for (const measurement of measurements) {
    const costConfig = unitCosts.find((c) => c.type === measurement.type);
    if (costConfig) {
      items.push({
        name: `${measurement.name} (${measurement.type})`,
        category: 'material',
        unitCost: costConfig.costPerUnit,
        unit: costConfig.unit,
        quantity: measurement.value,
        totalCost: costConfig.costPerUnit * measurement.value,
      });
    }
  }

  return items;
}
