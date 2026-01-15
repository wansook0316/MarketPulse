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
import { normalizeTwitterHandle, isValidTwitterHandle } from '@/lib/utils';
import type {
  Account,
  CreateAccountInput,
  PaginatedResponse,
} from '@/types/database';

/**
 * GET /api/admin/accounts
 * Get all accounts with pagination
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
    const search = searchParams.get('search');

    // Build WHERE clause
    const filters: Record<string, any> = {};
    if (isActive !== null) {
      filters.is_active = isActive === 'true';
    }

    const { clause, values } = buildWhereClause(filters);
    let whereClause = clause;
    let queryValues = values;

    // Add search filter if provided
    if (search) {
      const searchCondition = whereClause
        ? ` AND (twitter_handle ILIKE $${values.length + 1} OR display_name ILIKE $${values.length + 1})`
        : ` WHERE (twitter_handle ILIKE $1 OR display_name ILIKE $1)`;

      whereClause += searchCondition;
      queryValues.push(`%${search}%`);
    }

    const { limit, offset } = buildPagination(page, pageSize);

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM accounts ${whereClause}`;
    const countResult = await query<{ total: string }>(countQuery, queryValues);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get accounts with pagination
    const accountsQuery = `
      SELECT
        id, twitter_handle, twitter_id, display_name,
        description, followers_count, is_active,
        created_at, updated_at
      FROM accounts
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${queryValues.length + 1} OFFSET $${queryValues.length + 2}
    `;

    const accountsResult = await query<Account>(accountsQuery, [
      ...queryValues,
      limit,
      offset,
    ]);

    const response: PaginatedResponse<Account> = {
      data: accountsResult.rows,
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
 * POST /api/admin/accounts
 * Create a new account
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authResult = requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    // Parse request body
    const body = await parseRequestBody<CreateAccountInput>(request);

    if (!body) {
      return apiError('Invalid request body', 400);
    }

    // Validate required fields
    const missingField = validateRequiredFields(body, ['twitter_handle']);
    if (missingField) {
      return apiError(missingField, 400);
    }

    const { twitter_handle, display_name, description } = body;

    // Normalize and validate Twitter handle
    const normalizedHandle = normalizeTwitterHandle(twitter_handle);

    if (!isValidTwitterHandle(normalizedHandle)) {
      return apiError('Invalid Twitter handle format', 400);
    }

    // Check if account already exists
    const existingAccount = await query(
      'SELECT id FROM accounts WHERE twitter_handle = $1',
      [normalizedHandle]
    );

    if (existingAccount.rows.length > 0) {
      return apiError('Account with this Twitter handle already exists', 400);
    }

    // Insert new account
    const insertQuery = `
      INSERT INTO accounts (twitter_handle, display_name, description)
      VALUES ($1, $2, $3)
      RETURNING
        id, twitter_handle, twitter_id, display_name,
        description, followers_count, is_active,
        created_at, updated_at
    `;

    const result = await query<Account>(insertQuery, [
      normalizedHandle,
      display_name || null,
      description || null,
    ]);

    return apiSuccess(result.rows[0], 'Account created successfully', 201);
  } catch (error) {
    return handleApiError(error);
  }
}
