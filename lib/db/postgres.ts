import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

// Singleton connection pool
let pool: Pool | null = null;

/**
 * Get PostgreSQL connection pool
 * Creates a new pool if one doesn't exist (singleton pattern)
 */
export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
    });

    // Error handler for the pool
    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
      process.exit(-1);
    });
  }

  return pool;
}

/**
 * Execute a query with the pool
 * @param text SQL query string
 * @param params Query parameters
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getPool();
  const start = Date.now();

  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    // Log slow queries (>1000ms)
    if (duration > 1000) {
      console.warn('Slow query detected:', {
        text,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    return result;
  } catch (error) {
    console.error('Database query error:', {
      text,
      params,
      error: error instanceof Error ? error.message : error,
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return await pool.connect();
}

/**
 * Execute a transaction
 * @param callback Transaction callback that receives a PoolClient
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the connection pool
 * Call this when shutting down the application
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * Helper function to build WHERE clause from filters
 */
export function buildWhereClause(
  filters: Record<string, any>,
  startIndex = 1
): { clause: string; values: any[] } {
  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = startIndex;

  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // Handle array values with IN clause
        conditions.push(`${key} = ANY($${paramIndex})`);
        values.push(value);
      } else if (typeof value === 'object' && 'operator' in value) {
        // Handle custom operators (e.g., { operator: '>=', value: 10 })
        conditions.push(`${key} ${value.operator} $${paramIndex}`);
        values.push(value.value);
      } else {
        // Standard equality
        conditions.push(`${key} = $${paramIndex}`);
        values.push(value);
      }
      paramIndex++;
    }
  }

  const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, values };
}

/**
 * Helper function to build pagination
 */
export function buildPagination(page = 1, pageSize = 20): { limit: number; offset: number } {
  const limit = Math.min(Math.max(1, pageSize), 100); // Clamp between 1 and 100
  const offset = (Math.max(1, page) - 1) * limit;
  return { limit, offset };
}

/**
 * Helper function to build ORDER BY clause
 */
export function buildOrderBy(
  orderBy?: string,
  order: 'ASC' | 'DESC' = 'DESC'
): string {
  if (!orderBy) return '';

  // Sanitize orderBy to prevent SQL injection
  const allowedColumns = /^[a-z_]+$/i;
  if (!allowedColumns.test(orderBy)) {
    throw new Error('Invalid orderBy column name');
  }

  return `ORDER BY ${orderBy} ${order}`;
}
