import { Request } from 'express';
import { Document, Types } from 'mongoose';

// ============================================
// User Types & RBAC
// ============================================

export type UserRole = 'buyer' | 'owner' | 'agent' | 'admin';

export type Permission =
  | 'property:create'
  | 'property:read'
  | 'property:update:own'
  | 'property:update:any'
  | 'property:delete:own'
  | 'property:delete:any'
  | 'user:manage'
  | 'analytics:view'
  | 'admin:access';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  buyer: ['property:read'],
  owner: [
    'property:create',
    'property:read',
    'property:update:own',
    'property:delete:own',
    'analytics:view',
  ],
  agent: [
    'property:create',
    'property:read',
    'property:update:own',
    'property:delete:own',
    'analytics:view',
  ],
  admin: [
    'property:create',
    'property:read',
    'property:update:any',
    'property:delete:any',
    'user:manage',
    'analytics:view',
    'admin:access',
  ],
};

export interface IUser {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  countryCode?: string;
  role: UserRole;
  avatar?: string;
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  _id: Types.ObjectId;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toPublicJSON(): PublicUser;
}

export type PublicUser = Omit<IUser, 'password'> & { id: string };

// ============================================
// Auth Types
// ============================================

export interface JwtPayload {
  userId: string;
  id: string; // Alias for userId
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenPayload {
  userId: string;
  type: 'refresh';
}

// ============================================
// Request Types
// ============================================

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  messageAr?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  stack?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ============================================
// DTO Types
// ============================================

export interface RegisterDTO {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role?: UserRole;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UpdateProfileDTO {
  fullName?: string;
  phone?: string;
  avatar?: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

// ============================================
// Project Types
// ============================================

export type ProjectStage = 'idea' | 'mvp' | 'beta' | 'live';
export type RiskLevel = 'low' | 'medium' | 'high';
export type PartnershipType = 'technical' | 'investment' | 'cofounder' | 'marketing' | 'other';

export interface IProject {
  name: string;
  industry: string;
  stage: ProjectStage;
  description: string;
  whatIsBuilt: string;
  whatIsMissing: string;
  partnershipType: PartnershipType;
  riskLevel: RiskLevel;
  readinessScore: number;
  owner: Types.ObjectId;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProjectDocument extends IProject, Document {
  _id: Types.ObjectId;
  calculateReadinessScore(): number;
  toPublicJSON(): PublicProject;
}

export type PublicProject = Omit<IProject, 'owner'> & {
  id: string;
  owner: string | PublicUser;
};

// ============================================
// Project DTO Types
// ============================================

export interface CreateProjectDTO {
  name: string;
  industry: string;
  stage: ProjectStage;
  description: string;
  whatIsBuilt?: string;
  whatIsMissing?: string;
  partnershipType: PartnershipType;
  riskLevel?: RiskLevel;
}

export interface UpdateProjectDTO {
  name?: string;
  industry?: string;
  stage?: ProjectStage;
  description?: string;
  whatIsBuilt?: string;
  whatIsMissing?: string;
  partnershipType?: PartnershipType;
  riskLevel?: RiskLevel;
}

// ============================================
// Map Types (Architectural Drawings)
// ============================================

export type MapFileType = 'cad' | 'pdf' | 'image';
export type MapStatus = 'uploading' | 'processing' | 'ready' | 'error';
export type ScaleUnit = 'm' | 'cm' | 'mm' | 'ft' | 'in';

export interface MapScale {
  pixelDistance: number;
  realDistance: number;
  unit: ScaleUnit;
  ratio: number;
}

export interface IMap {
  project: Types.ObjectId;
  name: string;
  description?: string;
  fileType: MapFileType;
  originalFileName: string;
  storagePath: string;
  fileSize: number;
  mimeType: string;
  status: MapStatus;
  processingError?: string;
  metadata: {
    width?: number;
    height?: number;
    pages?: number;
    layers?: string[];
  };
  scale?: MapScale;
  isCalibrated: boolean;
  version: number;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMapDocument extends IMap, Document {
  _id: Types.ObjectId;
  toPublicJSON(): PublicMap;
}

export type PublicMap = Omit<IMap, 'project' | 'uploadedBy' | 'storagePath'> & {
  id: string;
  project: string;
  uploadedBy: string | PublicUser;
  downloadUrl: string;
  scale?: MapScale;
  isCalibrated: boolean;
};

// ============================================
// Measurement Types
// ============================================

export type MeasurementType = 'area' | 'distance' | 'volume' | 'perimeter' | 'angle';
export type MeasurementUnit =
  | 'm'
  | 'cm'
  | 'mm'
  | 'ft'
  | 'in'
  | 'sqm'
  | 'sqft'
  | 'cbm'
  | 'cbft'
  | 'deg';

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D extends Point2D {
  z: number;
}

export interface IMeasurement {
  map: Types.ObjectId;
  project: Types.ObjectId;
  name: string;
  type: MeasurementType;
  points: Point2D[] | Point3D[];
  value: number;
  unit: MeasurementUnit;
  displayValue: string;
  color?: string;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMeasurementDocument extends IMeasurement, Document {
  _id: Types.ObjectId;
  toPublicJSON(): PublicMeasurement;
}

export type PublicMeasurement = Omit<IMeasurement, 'map' | 'project' | 'createdBy'> & {
  id: string;
  map: string;
  project: string;
  createdBy: string | PublicUser;
};

// ============================================
// Cost Calculation Types
// ============================================

export type CostCategory = 'material' | 'labor' | 'equipment' | 'overhead' | 'other';

export interface CostItemInput {
  name: string;
  category: CostCategory;
  unitCost: number;
  unit: string;
  quantity: number;
}

export interface CostItem extends CostItemInput {
  totalCost: number;
}

export interface ICostEstimate {
  project: Types.ObjectId;
  map?: Types.ObjectId;
  name: string;
  description?: string;
  measurements: Types.ObjectId[];
  items: CostItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  currency: string;
  notes?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICostEstimateDocument extends ICostEstimate, Document {
  _id: Types.ObjectId;
  recalculate(): void;
  toPublicJSON(): PublicCostEstimate;
}

export type PublicCostEstimate = Omit<
  ICostEstimate,
  'project' | 'map' | 'measurements' | 'createdBy'
> & {
  id: string;
  project: string;
  map?: string;
  measurements: string[];
  createdBy: string | PublicUser;
};

// ============================================
// Property Types
// ============================================

export type PropertyType = 'sale' | 'rent' | 'investment' | 'partnership';

export type PropertyCategory = 'residential' | 'commercial' | 'industrial' | 'land';

export type PropertyStatus = 'available' | 'sold' | 'rented';

export type SizeUnit = 'sqm' | 'sqft';

export interface PropertyLocation {
  country?: string;
  city?: string;
  address?: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
}

export interface IProperty {
  title: string;
  description?: string;
  type: PropertyType;
  category: PropertyCategory;
  price: number;
  currency: string;
  location?: PropertyLocation;
  size?: number;
  sizeUnit: SizeUnit;
  status: PropertyStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPropertyDocument extends IProperty, Document {
  _id: Types.ObjectId;
}

export type PublicProperty = IProperty & {
  id: string;
};

// ============================================
// Property DTO Types
// ============================================

export interface CreatePropertyDTO {
  title: string;
  description?: string;
  type: PropertyType;
  category: PropertyCategory;
  price: number;
  currency?: string;
  location?: PropertyLocation;
  size?: number;
  sizeUnit?: SizeUnit;
}

export interface UpdatePropertyDTO {
  title?: string;
  description?: string;
  type?: PropertyType;
  category?: PropertyCategory;
  price?: number;
  currency?: string;
  location?: PropertyLocation;
  size?: number;
  sizeUnit?: SizeUnit;
  status?: PropertyStatus;
}

export interface PropertyQueryDTO {
  page?: number;
  limit?: number;
  q?: string;
  type?: PropertyType | PropertyType[];
  category?: PropertyCategory;
  status?: PropertyStatus;
  minPrice?: number;
  maxPrice?: number;
  minSize?: number;
  maxSize?: number;
  city?: string;
  sort?: 'newest' | 'oldest' | 'price_asc' | 'price_desc' | 'size_asc' | 'size_desc';
}

// ============================================
// Industrial Types
// ============================================

export type FactoryType =
  | 'manufacturing'
  | 'assembly'
  | 'processing'
  | 'warehouse'
  | 'distribution'
  | 'cold_storage'
  | 'food_processing'
  | 'pharmaceutical'
  | 'chemical'
  | 'textile'
  | 'automotive'
  | 'electronics'
  | 'other';

export type ZoningType =
  | 'light_industrial'
  | 'heavy_industrial'
  | 'mixed_use'
  | 'free_zone'
  | 'special_economic';

export type PowerUnit = 'kW' | 'MW' | 'kVA' | 'MVA';
export type WaterUnit = 'liters' | 'gallons' | 'cubic_meters';
export type HeightUnit = 'm' | 'ft';
export type LoadingDockType = 'ground_level' | 'dock_height' | 'both';
export type CapacityUnit = 'sqm' | 'sqft' | 'pallets' | 'tons';

export interface IIndustrial {
  property: Types.ObjectId;
  factoryType: FactoryType;
  powerCapacity: {
    value: number;
    unit: PowerUnit;
  };
  waterAccess: {
    available: boolean;
    dailyCapacity?: number;
    unit: WaterUnit;
  };
  ceilingHeight?: {
    value: number;
    unit: HeightUnit;
  };
  loadingDocks: {
    count: number;
    type: LoadingDockType;
  };
  zoningType: ZoningType;
  productionLines: {
    count: number;
    description?: string;
  };
  warehouseCapacity?: {
    value: number;
    unit: CapacityUnit;
  };
  utilities: {
    electricity: boolean;
    gas: boolean;
    water: boolean;
    sewage: boolean;
    internet: boolean;
    hvac: boolean;
  };
  certifications: string[];
  environmentalCompliance: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface IIndustrialDocument extends IIndustrial, Document {
  _id: Types.ObjectId;
  toPublicJSON(): PublicIndustrial;
}

export type PublicIndustrial = Omit<IIndustrial, 'property' | 'createdBy'> & {
  id: string;
  property: string;
  createdBy: string;
};

export interface CreateIndustrialDTO {
  propertyId: string;
  factoryType: FactoryType;
  powerCapacity: {
    value: number;
    unit?: PowerUnit;
  };
  waterAccess?: {
    available: boolean;
    dailyCapacity?: number;
    unit?: WaterUnit;
  };
  ceilingHeight?: {
    value: number;
    unit?: HeightUnit;
  };
  loadingDocks?: {
    count: number;
    type?: LoadingDockType;
  };
  zoningType: ZoningType;
  productionLines?: {
    count: number;
    description?: string;
  };
  warehouseCapacity?: {
    value: number;
    unit?: CapacityUnit;
  };
  utilities?: {
    electricity?: boolean;
    gas?: boolean;
    water?: boolean;
    sewage?: boolean;
    internet?: boolean;
    hvac?: boolean;
  };
  certifications?: string[];
  environmentalCompliance?: boolean;
}

export interface UpdateIndustrialDTO {
  factoryType?: FactoryType;
  powerCapacity?: {
    value: number;
    unit?: PowerUnit;
  };
  waterAccess?: {
    available: boolean;
    dailyCapacity?: number;
    unit?: WaterUnit;
  };
  ceilingHeight?: {
    value: number;
    unit?: HeightUnit;
  };
  loadingDocks?: {
    count: number;
    type?: LoadingDockType;
  };
  zoningType?: ZoningType;
  productionLines?: {
    count: number;
    description?: string;
  };
  warehouseCapacity?: {
    value: number;
    unit?: CapacityUnit;
  };
  utilities?: {
    electricity?: boolean;
    gas?: boolean;
    water?: boolean;
    sewage?: boolean;
    internet?: boolean;
    hvac?: boolean;
  };
  certifications?: string[];
  environmentalCompliance?: boolean;
}

export interface IndustrialQueryDTO {
  page?: number;
  limit?: number;
  factoryType?: FactoryType;
  zoningType?: ZoningType;
  minPowerCapacity?: number;
  maxPowerCapacity?: number;
  hasWaterAccess?: boolean;
  minCeilingHeight?: number;
  hasLoadingDocks?: boolean;
  environmentalCompliance?: boolean;
}

// ============================================
// User Management DTO Types (Admin)
// ============================================

export interface UserQueryDTO {
  page?: number;
  limit?: number;
  role?: UserRole;
  isActive?: boolean;
  isVerified?: boolean;
  q?: string;
}

export interface UpdateUserDTO {
  role?: UserRole;
  isActive?: boolean;
  isVerified?: boolean;
  fullName?: string;
  phone?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  byRole: Record<UserRole, number>;
}
