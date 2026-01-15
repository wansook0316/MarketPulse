import { NextRequest } from 'next/server';
import { apiSuccess, apiError, handleApiError } from '@/lib/api/response';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db/postgres';

/**
 * DELETE /api/admin/buckets/[id]/accounts/[accountId]
 * Remove an account from a bucket
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; accountId: string } }
) {
  try {
    // Check authentication
    const authResult = requireAuth(request);
    if (authResult instanceof Response) {
      return authResult;
    }

    const { id: bucketId, accountId } = params;

    // Check if relation exists
    const existingRelation = await query(
      'SELECT id FROM account_buckets WHERE account_id = $1 AND bucket_id = $2',
      [accountId, bucketId]
    );

    if (existingRelation.rows.length === 0) {
      return apiError('Account is not in this bucket', 404);
    }

    // Remove account from bucket
    await query(
      'DELETE FROM account_buckets WHERE account_id = $1 AND bucket_id = $2',
      [accountId, bucketId]
    );

    return apiSuccess(null, 'Account removed from bucket successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
