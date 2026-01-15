import { NextRequest } from 'next/server';
import {
  apiSuccess,
  apiError,
  handleApiError,
  parseRequestBody,
  validateRequiredFields,
} from '@/lib/api/response';
import { generateToken, isValidEmail } from '@/lib/auth';

/**
 * POST /api/auth/login
 * Authenticate admin user and return JWT token
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await parseRequestBody<{ email: string; password: string }>(
      request
    );

    if (!body) {
      return apiError('Invalid request body', 400);
    }

    // Validate required fields
    const missingField = validateRequiredFields(body, ['email', 'password']);
    if (missingField) {
      return apiError(missingField, 400);
    }

    const { email, password } = body;

    // Validate email format
    if (!isValidEmail(email)) {
      return apiError('Invalid email format', 400);
    }

    // Check against environment variables (simple admin check)
    // In production, you would check against database
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return apiError('Admin credentials not configured', 500);
    }

    // Simple credential check
    // TODO: In production, use hashed passwords from database
    if (email !== adminEmail || password !== adminPassword) {
      return apiError('Invalid email or password', 401);
    }

    // Generate JWT token
    const token = generateToken({ email });

    return apiSuccess(
      {
        token,
        user: {
          email,
        },
      },
      'Login successful'
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// Handle unsupported methods
export async function GET() {
  return apiError('Method not allowed', 405);
}

export async function PUT() {
  return apiError('Method not allowed', 405);
}

export async function DELETE() {
  return apiError('Method not allowed', 405);
}
