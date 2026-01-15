import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiError,
  handleApiError,
  parseRequestBody,
} from '@/lib/api/response';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db/postgres';
import type { Bucket, UpdateBucketInput } from '@/types/database';

/**
 * GET /api/admin/buckets/[id]
 * Get a single bucket by ID
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

    // Get bucket
    const result = await query<Bucket>(
      `SELECT
        id, name, type, description, persona,
        collection_interval_minutes, is_active,
        created_at, updated_at
      FROM buckets
      WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return apiError('Bucket not found', 404);
    }

    return apiSuccess(result.rows[0]);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/admin/buckets/[id]
 * Update a bucket
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
    const body = await parseRequestBody<UpdateBucketInput>(request);

    if (!body) {
      return apiError('Invalid request body', 400);
    }

    // Check if bucket exists
    const existingBucket = await query<Bucket>(
      'SELECT * FROM buckets WHERE id = $1',
      [id]
    );

    if (existingBucket.rows.length === 0) {
      return apiError('Bucket not found', 404);
    }

    const bucket = existingBucket.rows[0];

    // Prevent updating macro bucket name
    if (bucket.type === 'macro' && body.name && body.name !== 'macro') {
      return apiError('Cannot change name of macro bucket', 400);
    }

    // Check if new name already exists (if name is being changed)
    if (body.name && body.name !== bucket.name) {
      const nameCheck = await query(
        'SELECT id FROM buckets WHERE name = $1 AND id != $2',
        [body.name, id]
      );

      if (nameCheck.rows.length > 0) {
        return apiError('Bucket with this name already exists', 400);
      }
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(body.name);
    }

    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(body.description);
    }

    if (body.persona !== undefined) {
      updates.push(`persona = $${paramIndex++}`);
      values.push(body.persona);
    }

    if (body.collection_interval_minutes !== undefined) {
      updates.push(`collection_interval_minutes = $${paramIndex++}`);
      values.push(body.collection_interval_minutes);
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
      UPDATE buckets
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING
        id, name, type, description, persona,
        collection_interval_minutes, is_active,
        created_at, updated_at
    `;

    const result = await query<Bucket>(updateQuery, values);

    return apiSuccess(result.rows[0], 'Bucket updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/admin/buckets/[id]
 * Delete a bucket
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

    // Check if bucket exists
    const existingBucket = await query<Bucket>(
      'SELECT type FROM buckets WHERE id = $1',
      [id]
    );

    if (existingBucket.rows.length === 0) {
      return apiError('Bucket not found', 404);
    }

    // Prevent deleting macro bucket
    if (existingBucket.rows[0].type === 'macro') {
      return apiError('Cannot delete macro bucket', 400);
    }

    // Delete bucket (CASCADE will handle related records)
    await query('DELETE FROM buckets WHERE id = $1', [id]);

    return apiSuccess(null, 'Bucket deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
