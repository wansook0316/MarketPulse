import { QdrantClient } from '@qdrant/js-client-rest';
import type { SearchResult, RAGContext } from '@/types/database';

// Singleton Qdrant client
let client: QdrantClient | null = null;

// Collection names
export const COLLECTIONS = {
  TWEETS: 'tweets',
  SUMMARIES: 'summaries',
  GLOSSARY: 'glossary',
} as const;

/**
 * Get Qdrant client instance
 */
export function getQdrantClient(): QdrantClient {
  if (!client) {
    const url = process.env.QDRANT_URL || 'http://localhost:6333';
    client = new QdrantClient({ url });
  }

  return client;
}

/**
 * Initialize Qdrant collections
 * Creates collections if they don't exist
 */
export async function initializeCollections(): Promise<void> {
  const client = getQdrantClient();
  const vectorSize = parseInt(process.env.EMBEDDING_DIMENSION || '1024', 10);

  const collections = [
    {
      name: COLLECTIONS.TWEETS,
      vectorSize,
      distance: 'Cosine' as const,
    },
    {
      name: COLLECTIONS.SUMMARIES,
      vectorSize,
      distance: 'Cosine' as const,
    },
    {
      name: COLLECTIONS.GLOSSARY,
      vectorSize,
      distance: 'Cosine' as const,
    },
  ];

  for (const collection of collections) {
    try {
      // Check if collection exists
      const exists = await client.getCollection(collection.name).catch(() => null);

      if (!exists) {
        await client.createCollection(collection.name, {
          vectors: {
            size: collection.vectorSize,
            distance: collection.distance,
          },
        });
        console.log(`Created Qdrant collection: ${collection.name}`);
      }
    } catch (error) {
      console.error(`Error initializing collection ${collection.name}:`, error);
      throw error;
    }
  }
}

/**
 * Upsert a vector into a collection
 */
export async function upsertVector(
  collectionName: string,
  id: string,
  vector: number[],
  payload: Record<string, any>
): Promise<void> {
  const client = getQdrantClient();

  try {
    await client.upsert(collectionName, {
      wait: true,
      points: [
        {
          id,
          vector,
          payload,
        },
      ],
    });
  } catch (error) {
    console.error(`Error upserting vector to ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Batch upsert vectors into a collection
 */
export async function batchUpsertVectors(
  collectionName: string,
  points: Array<{
    id: string;
    vector: number[];
    payload: Record<string, any>;
  }>
): Promise<void> {
  const client = getQdrantClient();

  try {
    await client.upsert(collectionName, {
      wait: true,
      points,
    });
  } catch (error) {
    console.error(`Error batch upserting vectors to ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Search for similar vectors
 */
export async function searchVectors(
  collectionName: string,
  queryVector: number[],
  limit = 5,
  scoreThreshold?: number
): Promise<SearchResult[]> {
  const client = getQdrantClient();

  try {
    const results = await client.search(collectionName, {
      vector: queryVector,
      limit,
      score_threshold: scoreThreshold,
      with_payload: true,
    });

    return results.map((result) => ({
      id: String(result.id),
      score: result.score,
      payload: result.payload || {},
    }));
  } catch (error) {
    console.error(`Error searching vectors in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Search with filter
 */
export async function searchVectorsWithFilter(
  collectionName: string,
  queryVector: number[],
  filter: Record<string, any>,
  limit = 5,
  scoreThreshold?: number
): Promise<SearchResult[]> {
  const client = getQdrantClient();

  try {
    const results = await client.search(collectionName, {
      vector: queryVector,
      limit,
      score_threshold: scoreThreshold,
      filter: {
        must: Object.entries(filter).map(([key, value]) => ({
          key,
          match: { value },
        })),
      },
      with_payload: true,
    });

    return results.map((result) => ({
      id: String(result.id),
      score: result.score,
      payload: result.payload || {},
    }));
  } catch (error) {
    console.error(`Error searching vectors with filter in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete a vector from a collection
 */
export async function deleteVector(
  collectionName: string,
  id: string
): Promise<void> {
  const client = getQdrantClient();

  try {
    await client.delete(collectionName, {
      wait: true,
      points: [id],
    });
  } catch (error) {
    console.error(`Error deleting vector from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete multiple vectors from a collection
 */
export async function batchDeleteVectors(
  collectionName: string,
  ids: string[]
): Promise<void> {
  const client = getQdrantClient();

  try {
    await client.delete(collectionName, {
      wait: true,
      points: ids,
    });
  } catch (error) {
    console.error(`Error batch deleting vectors from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get collection info
 */
export async function getCollectionInfo(collectionName: string): Promise<any> {
  const client = getQdrantClient();

  try {
    return await client.getCollection(collectionName);
  } catch (error) {
    console.error(`Error getting collection info for ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Build RAG context from search results
 */
export function buildRAGContext(
  query: string,
  results: SearchResult[],
  maxLength = 2000
): RAGContext {
  const contextParts: string[] = [];
  let currentLength = 0;

  for (const result of results) {
    const content = result.payload.content || '';
    const snippet = content.substring(0, 500); // Limit each snippet

    if (currentLength + snippet.length > maxLength) {
      break;
    }

    contextParts.push(snippet);
    currentLength += snippet.length;
  }

  return {
    query,
    results,
    context_text: contextParts.join('\n\n---\n\n'),
  };
}
