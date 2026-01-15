-- MarketPulse Database Schema
-- Version: 1.0.0
-- Description: PostgreSQL schema for AI-based investment information automation platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE bucket_type AS ENUM ('macro', 'regular');
CREATE TYPE tweet_status AS ENUM ('pending', 'processing', 'evaluated', 'rejected', 'archived');
CREATE TYPE summary_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'posted');
CREATE TYPE generated_tweet_status AS ENUM ('draft', 'pending_approval', 'approved', 'rejected', 'posted');

-- ============================================================================
-- BUCKETS TABLE
-- ============================================================================
CREATE TABLE buckets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    type bucket_type NOT NULL DEFAULT 'regular',
    description TEXT,
    persona TEXT NOT NULL, -- Analysis persona for this bucket
    collection_interval_minutes INTEGER NOT NULL DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_macro_bucket CHECK (
        (type = 'macro' AND name = 'macro') OR type = 'regular'
    )
);

-- ============================================================================
-- ACCOUNTS TABLE
-- ============================================================================
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    twitter_handle VARCHAR(255) NOT NULL UNIQUE,
    twitter_id VARCHAR(255) UNIQUE,
    display_name VARCHAR(255),
    description TEXT,
    followers_count INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ACCOUNT_BUCKETS (Many-to-Many Junction Table)
-- ============================================================================
CREATE TABLE account_buckets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    bucket_id UUID NOT NULL REFERENCES buckets(id) ON DELETE CASCADE,
    priority INTEGER DEFAULT 0, -- Used for "shortest interval wins" strategy
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    next_fetch_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, bucket_id)
);

-- ============================================================================
-- TWEETS TABLE
-- ============================================================================
CREATE TABLE tweets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tweet_id VARCHAR(255) NOT NULL UNIQUE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    likes_count INTEGER DEFAULT 0,
    retweets_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    status tweet_status DEFAULT 'pending',
    raw_data JSONB, -- Original tweet data from Apify
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TWEET_EVALUATIONS TABLE
-- ============================================================================
CREATE TABLE tweet_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
    bucket_id UUID NOT NULL REFERENCES buckets(id) ON DELETE CASCADE,
    is_relevant BOOLEAN NOT NULL,
    relevance_score DECIMAL(3,2), -- 0.00 to 1.00
    reasoning TEXT NOT NULL,
    extracted_topics TEXT[], -- Array of topics
    sentiment VARCHAR(50), -- positive, negative, neutral
    llm_model VARCHAR(255),
    llm_response JSONB, -- Full LLM response for debugging
    evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tweet_id, bucket_id)
);

-- ============================================================================
-- SUMMARIES TABLE
-- ============================================================================
CREATE TABLE summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bucket_id UUID NOT NULL REFERENCES buckets(id) ON DELETE CASCADE,
    title VARCHAR(500),
    content TEXT NOT NULL,
    key_points TEXT[], -- Array of key points
    source_tweet_ids UUID[], -- Array of tweet IDs used in this summary
    status summary_status DEFAULT 'draft',
    llm_model VARCHAR(255),
    synthesized_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by VARCHAR(255),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- GENERATED_TWEETS TABLE
-- ============================================================================
CREATE TABLE generated_tweets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    summary_id UUID REFERENCES summaries(id) ON DELETE SET NULL,
    bucket_id UUID NOT NULL REFERENCES buckets(id) ON DELETE CASCADE,
    tone_id UUID REFERENCES tones(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    status generated_tweet_status DEFAULT 'draft',
    character_count INTEGER,
    hashtags TEXT[],
    mentions TEXT[],
    llm_model VARCHAR(255),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by VARCHAR(255),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- POSTED_TWEETS TABLE
-- ============================================================================
CREATE TABLE posted_tweets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    generated_tweet_id UUID NOT NULL REFERENCES generated_tweets(id) ON DELETE CASCADE,
    tweet_id VARCHAR(255) UNIQUE, -- Twitter's tweet ID after posting
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    likes_count INTEGER DEFAULT 0,
    retweets_count INTEGER DEFAULT 0,
    replies_count INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2), -- Percentage
    last_metrics_update TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TONES TABLE (Global A/B Testing)
-- ============================================================================
CREATE TABLE tones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    prompt_instructions TEXT NOT NULL, -- Instructions for LLM on how to write in this tone
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- GLOSSARY TABLE
-- ============================================================================
CREATE TABLE glossary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    term VARCHAR(255) NOT NULL UNIQUE,
    definition TEXT NOT NULL,
    context TEXT, -- Additional context
    related_terms TEXT[], -- Array of related term slugs
    source_tweet_ids UUID[], -- Tweets where this term appeared
    frequency INTEGER DEFAULT 1, -- How often this term appears
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PROMPT_TEMPLATES TABLE
-- ============================================================================
CREATE TABLE prompt_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(100) NOT NULL, -- evaluator, synthesizer, content_creator, formatter, glossary
    template TEXT NOT NULL,
    variables JSONB, -- Available template variables
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Buckets
CREATE INDEX idx_buckets_type ON buckets(type);
CREATE INDEX idx_buckets_is_active ON buckets(is_active);

-- Accounts
CREATE INDEX idx_accounts_twitter_handle ON accounts(twitter_handle);
CREATE INDEX idx_accounts_is_active ON accounts(is_active);

-- Account Buckets
CREATE INDEX idx_account_buckets_account_id ON account_buckets(account_id);
CREATE INDEX idx_account_buckets_bucket_id ON account_buckets(bucket_id);
CREATE INDEX idx_account_buckets_next_fetch ON account_buckets(next_fetch_at);

-- Tweets
CREATE INDEX idx_tweets_account_id ON tweets(account_id);
CREATE INDEX idx_tweets_status ON tweets(status);
CREATE INDEX idx_tweets_posted_at ON tweets(posted_at DESC);
CREATE INDEX idx_tweets_tweet_id ON tweets(tweet_id);

-- Tweet Evaluations
CREATE INDEX idx_tweet_eval_tweet_id ON tweet_evaluations(tweet_id);
CREATE INDEX idx_tweet_eval_bucket_id ON tweet_evaluations(bucket_id);
CREATE INDEX idx_tweet_eval_is_relevant ON tweet_evaluations(is_relevant);
CREATE INDEX idx_tweet_eval_score ON tweet_evaluations(relevance_score DESC);

-- Summaries
CREATE INDEX idx_summaries_bucket_id ON summaries(bucket_id);
CREATE INDEX idx_summaries_status ON summaries(status);
CREATE INDEX idx_summaries_synthesized_at ON summaries(synthesized_at DESC);

-- Generated Tweets
CREATE INDEX idx_gen_tweets_summary_id ON generated_tweets(summary_id);
CREATE INDEX idx_gen_tweets_bucket_id ON generated_tweets(bucket_id);
CREATE INDEX idx_gen_tweets_tone_id ON generated_tweets(tone_id);
CREATE INDEX idx_gen_tweets_status ON generated_tweets(status);

-- Posted Tweets
CREATE INDEX idx_posted_tweets_gen_id ON posted_tweets(generated_tweet_id);
CREATE INDEX idx_posted_tweets_posted_at ON posted_tweets(posted_at DESC);
CREATE INDEX idx_posted_tweets_engagement ON posted_tweets(engagement_rate DESC);

-- Tones
CREATE INDEX idx_tones_is_active ON tones(is_active);

-- Glossary
CREATE INDEX idx_glossary_term ON glossary(term);
CREATE INDEX idx_glossary_frequency ON glossary(frequency DESC);

-- Prompt Templates
CREATE INDEX idx_prompt_templates_type ON prompt_templates(type);
CREATE INDEX idx_prompt_templates_is_active ON prompt_templates(is_active);

-- ============================================================================
-- TRIGGERS FOR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_buckets_updated_at BEFORE UPDATE ON buckets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tweets_updated_at BEFORE UPDATE ON tweets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_summaries_updated_at BEFORE UPDATE ON summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generated_tweets_updated_at BEFORE UPDATE ON generated_tweets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posted_tweets_updated_at BEFORE UPDATE ON posted_tweets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tones_updated_at BEFORE UPDATE ON tones
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_glossary_updated_at BEFORE UPDATE ON glossary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at BEFORE UPDATE ON prompt_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default macro bucket
INSERT INTO buckets (name, type, description, persona, collection_interval_minutes)
VALUES (
    'macro',
    'macro',
    'System-wide economic and market context',
    'You are a macro-economic analyst. Extract broad economic trends, market sentiment, and systemic factors that affect all investment topics.',
    60
);

-- Insert default tones for A/B testing
INSERT INTO tones (name, description, prompt_instructions) VALUES
(
    'professional',
    'Professional and analytical tone',
    'Write in a professional, analytical tone. Use clear language with data-driven insights. Avoid casual expressions and emojis.'
),
(
    'casual',
    'Casual and approachable tone',
    'Write in a casual, approachable tone. Use conversational language that''s easy to understand. You may use occasional emojis to emphasize points.'
),
(
    'urgent',
    'Urgent and action-oriented tone',
    'Write with urgency and focus on actionable insights. Highlight time-sensitive information and critical developments. Use strong, direct language.'
);

-- Insert default prompt templates
INSERT INTO prompt_templates (name, type, template, variables, is_active) VALUES
(
    'evaluator_default',
    'evaluator',
    'Evaluate the following tweet for relevance to {bucket_name}.\n\nBucket Description: {bucket_description}\nBucket Persona: {bucket_persona}\n\nTweet Content:\n{tweet_content}\n\nProvide:\n1. Is this tweet relevant? (true/false)\n2. Relevance score (0.00 to 1.00)\n3. Reasoning\n4. Extracted topics (array)\n5. Sentiment (positive/negative/neutral)',
    '{"bucket_name": "string", "bucket_description": "string", "bucket_persona": "string", "tweet_content": "string"}',
    true
);

COMMENT ON DATABASE marketpulse IS 'MarketPulse - AI-based investment information automation platform';
