import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiError,
  handleApiError,
  parseRequestBody,
  validateRequiredFields,
} from '@/lib/api/response';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db/postgres';
import type { AccountBucket } from '@/types/database';

interface AddAccountInput {
  account_id: string;
  priority?: number;
}

/**
 * GET /api/admin/buckets/[id]/accounts
 * Get all accounts in a bucket
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

    // Check if bucket exists
    const bucketCheck = await query('SELECT id FROM buckets WHERE id = $1', [id]);

    if (bucketCheck.rows.length === 0) {
      return apiError('Bucket not found', 404);
    }

    // Get accounts in this bucket
    const accountsQuery = `
      SELECT
        a.id, a.twitter_handle, a.twitter_id, a.display_name,
        a.description, a.followers_count, a.is_active,
        ab.priority, ab.last_fetched_at, ab.next_fetch_at,
        a.created_at, a.updated_at
      FROM accounts a
      INNER JOIN account_buckets ab ON a.id = ab.account_id
      WHERE ab.bucket_id = $1
      ORDER BY ab.priority DESC, a.created_at DESC
    `;

    const result = await query(accountsQuery, [id]);

    return apiSuccess(result.rows);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/admin/buckets/[id]/accounts
 * Add an account to a bucket
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const authResult = requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { id: bucketId } = params;

    // Parse request body
    const body = await parseRequestBody<AddAccountInput>(request);

    if (!body) {
      return apiError('Invalid request body', 400);
    }

    // Validate required fields
    const missingField = validateRequiredFields(body, ['account_id']);
    if (missingField) {
      return apiError(missingField, 400);
    }

    const { account_id, priority = 0 } = body;

    // Check if bucket exists
    const bucketCheck = await query('SELECT id FROM buckets WHERE id = $1', [
      bucketId,
    ]);

    if (bucketCheck.rows.length === 0) {
      return apiError('Bucket not found', 404);
    }

    // Check if account exists
    const accountCheck = await query('SELECT id FROM accounts WHERE id = $1', [
      account_id,
    ]);

    if (accountCheck.rows.length === 0) {
      return apiError('Account not found', 404);
    }

    // Check if account is already in this bucket
    const existingRelation = await query(
      'SELECT id FROM account_buckets WHERE account_id = $1 AND bucket_id = $2',
      [account_id, bucketId]
    );

    if (existingRelation.rows.length > 0) {
      return apiError('Account is already in this bucket', 400);
    }

    // Add account to bucket
    const insertQuery = `
      INSERT INTO account_buckets (account_id, bucket_id, priority)
      VALUES ($1, $2, $3)
      RETURNING
        id, account_id, bucket_id, priority,
        last_fetched_at, next_fetch_at, created_at
    `;

    const result = await query<AccountBucket>(insertQuery, [
      account_id,
      bucketId,
      priority,
    ]);

    return apiSuccess(
      result.rows[0],
      'Account added to bucket successfully',
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
