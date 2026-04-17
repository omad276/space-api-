// ============================================
// Pagination Utilities
// ============================================

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Get pagination parameters from query options
 * @param options - Query options with page and limit
 * @param defaultLimit - Default limit if not specified (default: 20)
 * @param maxLimit - Maximum allowed limit (default: 100)
 */
export function getPaginationParams(
  options: { page?: number; limit?: number },
  defaultLimit = 20,
  maxLimit = 100
): PaginationParams {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(maxLimit, Math.max(1, options.limit || defaultLimit));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Build pagination result object
 * @param data - Array of items
 * @param total - Total count of items
 * @param page - Current page number
 * @param limit - Items per page
 */
export function buildPaginationResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginationResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
