import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiError,
  handleApiError,
  parseRequestBody,
  validateRequiredFields,
  getQueryParams,
  getPaginationParams,
} from '@/lib/api/response';
import { requireAuth } from '@/lib/auth';
import { query, buildWhereClause, buildPagination } from '@/lib/db/postgres';
import type { Bucket, CreateBucketInput, PaginatedResponse } from '@/types/database';

/**
 * GET /api/admin/buckets
 * Get all buckets with pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authResult = requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    // Get query parameters
    const searchParams = getQueryParams(request.url);
    const { page, pageSize } = getPaginationParams(searchParams);
    const isActive = searchParams.get('is_active');
    const type = searchParams.get('type');

    // Build WHERE clause
    const filters: Record<string, any> = {};
    if (isActive !== null) {
      filters.is_active = isActive === 'true';
    }
    if (type) {
      filters.type = type;
    }

    const { clause, values } = buildWhereClause(filters);
    const { limit, offset } = buildPagination(page, pageSize);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM buckets ${clause}`;
    const countResult = await query<{ total: string }>(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get buckets with pagination
    const bucketsQuery = `
      SELECT
        id, name, type, description, persona,
        collection_interval_minutes, is_active,
        created_at, updated_at
      FROM buckets
      ${clause}
      ORDER BY created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const bucketsResult = await query<Bucket>(
      bucketsQuery,
      [...values, limit, offset]
    );

    const response: PaginatedResponse<Bucket> = {
      data: bucketsResult.rows,
      total,
      page,
      page_size: pageSize,
      total_pages: Math.ceil(total / pageSize),
    };

    return apiSuccess(response);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/buckets
 * Create a new bucket
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    // Parse request body
    const body = await parseRequestBody<CreateBucketInput>(request);

    if (!body) {
      return apiError('Invalid request body', 400);
    }

    // Validate required fields
    const missingField = validateRequiredFields(body, ['name', 'persona']);
    if (missingField) {
      return apiError(missingField, 400);
    }

    const {
      name,
      type = 'regular',
      description,
      persona,
      collection_interval_minutes = 60,
    } = body;

    // Validate bucket type
    if (type !== 'macro' && type !== 'regular') {
      return apiError('Invalid bucket type. Must be "macro" or "regular"', 400);
    }

    // Check if macro bucket already exists (only one allowed)
    if (type === 'macro') {
      const macroCheck = await query(
        'SELECT id FROM buckets WHERE type = $1',
        ['macro']
      );

      if (macroCheck.rows.length > 0) {
        return apiError('Macro bucket already exists. Only one macro bucket is allowed.', 400);
      }
    }

    // Check if name already exists
    const nameCheck = await query(
      'SELECT id FROM buckets WHERE name = $1',
      [name]
    );

    if (nameCheck.rows.length > 0) {
      return apiError('Bucket with this name already exists', 400);
    }

    // Insert new bucket
    const insertQuery = `
      INSERT INTO buckets (name, type, description, persona, collection_interval_minutes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id, name, type, description, persona,
        collection_interval_minutes, is_active,
        created_at, updated_at
    `;

    const result = await query<Bucket>(insertQuery, [
      name,
      type,
      description || null,
      persona,
      collection_interval_minutes,
    ]);

    return apiSuccess(result.rows[0], 'Bucket created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
