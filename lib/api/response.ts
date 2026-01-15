import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/types/database';

/**
 * Return a successful JSON response
 */
export function apiSuccess<T = any>(
  data: T,
  message?: string,
  status = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

/**
 * Return an error JSON response
 */
export function apiError(
  error: string,
  status = 400
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * Handle API errors and return appropriate response
 */
export function handleApiError(error: unknown): NextResponse<ApiResponse> {
  console.error('API Error:', error);

  if (error instanceof Error) {
    // Known error with message
    return apiError(error.message, 500);
  }

  // Unknown error
  return apiError('An unexpected error occurred', 500);
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, any>,
  requiredFields: string[]
): string | null {
  for (const field of requiredFields) {
    if (!body[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

/**
 * Parse JSON from request safely
 */
export async function parseRequestBody<T = any>(
  request: Request
): Promise<T | null> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * Get query parameters from URL
 */
export function getQueryParams(url: string): URLSearchParams {
  return new URL(url).searchParams;
}

/**
 * Extract pagination params from query string
 */
export function getPaginationParams(searchParams: URLSearchParams): {
  page: number;
  pageSize: number;
} {
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('page_size') || '20', 10);

  return {
    page: Math.max(1, page),
    pageSize: Math.min(Math.max(1, pageSize), 100), // Clamp between 1 and 100
  };
}

/**
 * Check if request method is allowed
 */
export function checkMethod(
  request: Request,
  allowedMethods: string[]
): NextResponse<ApiResponse> | null {
  if (!allowedMethods.includes(request.method)) {
    return apiError(
      `Method ${request.method} not allowed. Allowed: ${allowedMethods.join(', ')}`,
      405
    );
  }
  return null;
}
