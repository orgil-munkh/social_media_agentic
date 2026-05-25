# Mongolian Viral Growth Engine

Self-improving AI social media system that generates, posts, measures, and optimizes viral Mongolian-language content for Instagram.

## Pipeline

```
GENERATE → VISUALIZE → POST → MEASURE → LEARN → OPTIMIZE → REPEAT
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Required variables:
- `OPENAI_API_KEY` — text generation + `gpt-image-2` image generation
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — persistence + public image hosting
- `META_ACCESS_TOKEN` — Meta Graph API long-lived token
- `META_IG_USER_ID` — Instagram Business/Creator account ID

Set `DRY_RUN=true` to test the pipeline without publishing to Instagram.

### 3. Run Supabase migration

Apply the schema in [`supabase/migrations/001_initial_schema.sql`](supabase/migrations/001_initial_schema.sql) to your Supabase project. This creates all tables, enables RLS, and sets up the `post-images` public storage bucket.

### 4. Meta Developer App

1. Create a Meta Developer App
2. Add permissions: `instagram_basic`, `instagram_content_publish`
3. Link Instagram Professional account to a Facebook Page
4. Generate a long-lived access token
5. Copy IG User ID into `.env`

## Usage

### Run once (manual)

```bash
npm run pipeline:once   # Generate content, create image, publish to Instagram
npm run measure:once    # Collect engagement, score, evolve patterns
```

### Run as cron daemon

```bash
npm run dev
```

Schedules (Asia/Ulaanbaatar):
- **08:00** — Generate + post
- **22:00** — Measure + optimize

### Production build

```bash
npm run build
npm start
```

## Architecture

```
src/
├── agents/          dailyContentAgent, visualDirectorAgent
├── services/        llm, imageGenerator, brandRenderer, metaPublisher, scorer
├── analytics/       engagementCollector, viralityAnalyzer, patternExtractor
├── optimizer/       contentEvolutionEngine, visualEvolutionEngine
├── memory/          mongolianTrendMemory
├── pipeline/        dailyPipeline, abTestRunner
└── index.ts         cron entry + CLI
```

## Image output

Posts are generated as **4:5 portrait** images (1024×1280) optimized for the Instagram feed. Text overlays wrap automatically so long Mongolian hooks are not clipped.

## Scoring

Viral scores are computed from **Instagram engagement metrics only**; legacy Facebook/Threads rows are excluded from analysis.

```
viral_score = shares × 4 + comments × 3 + saves × 2 + likes × 1
```

| Score | Classification |
|-------|---------------|
| 80–100 | viral |
| 50–79 | good |
| <50 | weak |

## Language Enforcement

All user-facing content (hooks, captions, text overlays) is validated for native Mongolian Cyrillic. English or mixed-language output triggers automatic regeneration.

## Reliability

- All external API calls retry once on failure
- Publish failures logged to `pipeline_runs` table in Supabase
