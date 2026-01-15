// Database Types - matches PostgreSQL schema from init.sql

export type BucketType = 'macro' | 'regular';
export type TweetStatus = 'pending' | 'processing' | 'evaluated' | 'rejected' | 'archived';
export type SummaryStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'posted';
export type GeneratedTweetStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'posted';
export type Sentiment = 'positive' | 'negative' | 'neutral';

export interface Bucket {
  id: string;
  name: string;
  type: BucketType;
  description?: string;
  persona: string;
  collection_interval_minutes: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Account {
  id: string;
  twitter_handle: string;
  twitter_id?: string;
  display_name?: string;
  description?: string;
  followers_count?: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AccountBucket {
  id: string;
  account_id: string;
  bucket_id: string;
  priority: number;
  last_fetched_at?: Date;
  next_fetch_at?: Date;
  created_at: Date;
}

export interface Tweet {
  id: string;
  tweet_id: string;
  account_id: string;
  content: string;
  posted_at: Date;
  likes_count: number;
  retweets_count: number;
  replies_count: number;
  status: TweetStatus;
  raw_data?: Record<string, any>;
  fetched_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface TweetEvaluation {
  id: string;
  tweet_id: string;
  bucket_id: string;
  is_relevant: boolean;
  relevance_score?: number;
  reasoning: string;
  extracted_topics?: string[];
  sentiment?: Sentiment;
  llm_model?: string;
  llm_response?: Record<string, any>;
  evaluated_at: Date;
  created_at: Date;
}

export interface Summary {
  id: string;
  bucket_id: string;
  title?: string;
  content: string;
  key_points?: string[];
  source_tweet_ids?: string[];
  status: SummaryStatus;
  llm_model?: string;
  synthesized_at?: Date;
  approved_at?: Date;
  approved_by?: string;
  rejected_at?: Date;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface GeneratedTweet {
  id: string;
  summary_id?: string;
  bucket_id: string;
  tone_id?: string;
  content: string;
  status: GeneratedTweetStatus;
  character_count?: number;
  hashtags?: string[];
  mentions?: string[];
  llm_model?: string;
  generated_at: Date;
  approved_at?: Date;
  approved_by?: string;
  rejected_at?: Date;
  rejection_reason?: string;
  created_at: Date;
  updated_at: Date;
}

export interface PostedTweet {
  id: string;
  generated_tweet_id: string;
  tweet_id?: string;
  posted_at: Date;
  likes_count: number;
  retweets_count: number;
  replies_count: number;
  impressions: number;
  engagement_rate?: number;
  last_metrics_update?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Tone {
  id: string;
  name: string;
  description?: string;
  prompt_instructions: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  context?: string;
  related_terms?: string[];
  source_tweet_ids?: string[];
  frequency: number;
  last_updated_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface PromptTemplate {
  id: string;
  name: string;
  type: 'evaluator' | 'synthesizer' | 'content_creator' | 'formatter' | 'glossary';
  template: string;
  variables?: Record<string, string>;
  is_active: boolean;
  version: number;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ============================================================================
// Extended Types with Relations
// ============================================================================

export interface BucketWithAccounts extends Bucket {
  accounts?: Account[];
  account_count?: number;
}

export interface TweetWithAccount extends Tweet {
  account?: Account;
}

export interface TweetWithEvaluations extends Tweet {
  evaluations?: TweetEvaluation[];
}

export interface SummaryWithTweets extends Summary {
  tweets?: Tweet[];
  bucket?: Bucket;
}

export interface GeneratedTweetWithDetails extends GeneratedTweet {
  summary?: Summary;
  bucket?: Bucket;
  tone?: Tone;
  posted?: PostedTweet;
}

// ============================================================================
// Form/Input Types
// ============================================================================

export interface CreateBucketInput {
  name: string;
  type?: BucketType;
  description?: string;
  persona: string;
  collection_interval_minutes?: number;
}

export interface UpdateBucketInput {
  name?: string;
  description?: string;
  persona?: string;
  collection_interval_minutes?: number;
  is_active?: boolean;
}

export interface CreateAccountInput {
  twitter_handle: string;
  display_name?: string;
  description?: string;
}

export interface AddAccountToBucketInput {
  account_id: string;
  bucket_id: string;
  priority?: number;
}

export interface CreateToneInput {
  name: string;
  description?: string;
  prompt_instructions: string;
}

export interface UpdateToneInput {
  description?: string;
  prompt_instructions?: string;
  is_active?: boolean;
}

export interface ApprovalInput {
  approved: boolean;
  rejection_reason?: string;
}

// ============================================================================
// Worker/Background Job Types
// ============================================================================

export interface CollectionJob {
  account_id: string;
  bucket_id: string;
  last_tweet_id?: string;
}

export interface EvaluationJob {
  tweet_id: string;
  bucket_id: string;
}

export interface SynthesisJob {
  bucket_id: string;
  tweet_ids: string[];
}

export interface ContentGenerationJob {
  summary_id: string;
  tone_ids: string[];
}

// ============================================================================
// Embedding/RAG Types
// ============================================================================

export interface EmbeddingVector {
  id: string;
  vector: number[];
  payload: Record<string, any>;
}

export interface SearchResult {
  id: string;
  score: number;
  payload: Record<string, any>;
}

export interface RAGContext {
  query: string;
  results: SearchResult[];
  context_text: string;
}
