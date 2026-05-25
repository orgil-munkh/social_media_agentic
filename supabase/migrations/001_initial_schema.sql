-- Mongolian viral growth engine schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE post_status AS ENUM ('draft', 'scheduled', 'published', 'failed');
CREATE TYPE platform_type AS ENUM ('instagram', 'facebook', 'threads');
CREATE TYPE publish_status AS ENUM ('pending', 'published', 'failed');
CREATE TYPE score_classification AS ENUM ('viral', 'good', 'weak');
CREATE TYPE pattern_type AS ENUM (
  'hook_structure',
  'emotional_tone',
  'sentence_rhythm',
  'cultural_expression',
  'visual_style'
);
CREATE TYPE memory_category AS ENUM (
  'hook',
  'tone',
  'visual',
  'theme',
  'posting_time'
);
CREATE TYPE ab_variant_type AS ENUM ('hook', 'visual');
CREATE TYPE pipeline_run_type AS ENUM ('generate_post', 'measure_optimize');
CREATE TYPE pipeline_run_status AS ENUM ('running', 'completed', 'partial', 'failed');

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme TEXT NOT NULL,
  hook TEXT NOT NULL,
  captions JSONB NOT NULL DEFAULT '{}',
  visual_prompt JSONB NOT NULL DEFAULT '{}',
  image_path TEXT,
  image_url TEXT,
  ab_variant TEXT NOT NULL DEFAULT 'primary',
  scheduled_hour INTEGER,
  status post_status NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE platform_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  external_id TEXT,
  status publish_status NOT NULL DEFAULT 'pending',
  error TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (post_id, platform)
);

CREATE TABLE engagement_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  shares INTEGER NOT NULL DEFAULT 0,
  saves INTEGER NOT NULL DEFAULT 0,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE viral_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  score NUMERIC(10, 2) NOT NULL,
  classification score_classification NOT NULL,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mongolian_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_type pattern_type NOT NULL,
  pattern TEXT NOT NULL,
  performance_weight NUMERIC(10, 4) NOT NULL DEFAULT 1.0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE trend_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category memory_category NOT NULL,
  content TEXT NOT NULL,
  score NUMERIC(10, 2) NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE posting_time_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour <= 23),
  platform platform_type NOT NULL,
  avg_engagement NUMERIC(10, 4) NOT NULL DEFAULT 0,
  sample_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hour, platform)
);

CREATE TABLE ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  variant_type ab_variant_type NOT NULL,
  variant_key TEXT NOT NULL,
  variant_data JSONB NOT NULL DEFAULT '{}',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_winner BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type pipeline_run_type NOT NULL,
  status pipeline_run_status NOT NULL DEFAULT 'running',
  errors JSONB NOT NULL DEFAULT '[]',
  metadata JSONB NOT NULL DEFAULT '{}',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX idx_platform_posts_post_id ON platform_posts(post_id);
CREATE INDEX idx_engagement_metrics_post_id ON engagement_metrics(post_id);
CREATE INDEX idx_viral_scores_post_id ON viral_scores(post_id);
CREATE INDEX idx_mongolian_patterns_type_weight ON mongolian_patterns(pattern_type, performance_weight DESC);
CREATE INDEX idx_trend_memory_category_score ON trend_memory(category, score DESC);
CREATE INDEX idx_ab_tests_post_id ON ab_tests(post_id);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE viral_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE mongolian_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE trend_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE posting_time_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;

-- Storage bucket for Meta-compatible public image URLs
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-images', 'post-images', true)
ON CONFLICT (id) DO NOTHING;

-- Seed cold-start Mongolian hooks
INSERT INTO trend_memory (category, content, score, metadata) VALUES
  ('hook', 'Чи залхуу биш. Чи зүгээр л анхаарал алдсан.', 75, '{"seed": true}'),
  ('hook', 'Хэн ч чамайг зогсоогоогүй. Чи өөрөө зогссон.', 75, '{"seed": true}'),
  ('hook', 'Амжилт бол аз биш. Дахин давтагддаг дадал.', 70, '{"seed": true}'),
  ('tone', 'Шууд, эелдэг бус, өөртөө шүүмжлэлтэй', 70, '{"seed": true}'),
  ('theme', 'Сахилга, хяналт, өөртөө итгэх итгэл', 65, '{"seed": true}');

INSERT INTO posting_time_stats (hour, platform, avg_engagement, sample_count) VALUES
  (8, 'instagram', 0, 0),
  (13, 'instagram', 0, 0),
  (19, 'instagram', 0, 0),
  (8, 'facebook', 0, 0),
  (13, 'facebook', 0, 0),
  (19, 'facebook', 0, 0),
  (8, 'threads', 0, 0),
  (13, 'threads', 0, 0),
  (19, 'threads', 0, 0);
