import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiError,
  handleApiError,
  parseRequestBody,
} from '@/lib/api/response';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db/postgres';
import { normalizeTwitterHandle, isValidTwitterHandle } from '@/lib/utils';
import type { Account } from '@/types/database';

interface UpdateAccountInput {
  twitter_handle?: string;
  display_name?: string;
  description?: string;
  is_active?: boolean;
}

/**
 * GET /api/admin/accounts/[id]
 * Get a single account by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authResult = requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { id } = params;

    // Get account
    const result = await query<Account>(
      `SELECT
        id, twitter_handle, twitter_id, display_name,
        description, followers_count, is_active,
        created_at, updated_at
      FROM accounts
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return apiError('Account not found', 404);
    }

    return apiSuccess(result.rows[0]);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/admin/accounts/[id]
 * Update an account
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authResult = requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { id } = params;

    // Parse request body
    const body = await parseRequestBody<UpdateAccountInput>(request);

    if (!body) {
      return apiError('Invalid request body', 400);
    }

    // Check if account exists
    const existingAccount = await query<Account>(
      'SELECT * FROM accounts WHERE id = $1',
      [id]
    );

    if (existingAccount.rows.length === 0) {
      return apiError('Account not found', 404);
    }

    const account = existingAccount.rows[0];

    // Validate and normalize Twitter handle if being updated
    if (body.twitter_handle) {
      const normalizedHandle = normalizeTwitterHandle(body.twitter_handle);

      if (!isValidTwitterHandle(normalizedHandle)) {
        return apiError('Invalid Twitter handle format', 400);
      }

      // Check if new handle already exists
      if (normalizedHandle !== account.twitter_handle) {
        const handleCheck = await query(
          'SELECT id FROM accounts WHERE twitter_handle = $1 AND id != $2',
          [normalizedHandle, id]
        );

        if (handleCheck.rows.length > 0) {
          return apiError('Account with this Twitter handle already exists', 400);
        }
      }

      body.twitter_handle = normalizedHandle;
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.twitter_handle !== undefined) {
      updates.push(`twitter_handle = $${paramIndex++}`);
      values.push(body.twitter_handle);
    }

    if (body.display_name !== undefined) {
      updates.push(`display_name = $${paramIndex++}`);
      values.push(body.display_name);
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(body.description);
    }

    if (body.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(body.is_active);
    }

    if (updates.length === 0) {
      return apiError('No fields to update', 400);
    }

    // Add ID to values
    values.push(id);

    const updateQuery = `
      UPDATE accounts
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING
        id, twitter_handle, twitter_id, display_name,
        description, followers_count, is_active,
        created_at, updated_at
    `;

    const result = await query<Account>(updateQuery, values);

    return apiSuccess(result.rows[0], 'Account updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/accounts/[id]
 * Delete an account
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authResult = requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { id } = params;

    // Check if account exists
    const existingAccount = await query<Account>(
      'SELECT id FROM accounts WHERE id = $1',
      [id]
    );

    if (existingAccount.rows.length === 0) {
      return apiError('Account not found', 404);
    }

    // Delete account (CASCADE will handle related records)
    await query('DELETE FROM accounts WHERE id = $1', [id]);

    return apiSuccess(null, 'Account deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
