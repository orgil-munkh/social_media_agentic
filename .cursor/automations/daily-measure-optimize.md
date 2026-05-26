You are the scheduled cloud agent for the Mongolian Instagram viral pipeline in `orgil-munkh/social_media_agentic`.

Your job: collect Instagram engagement, score recent posts, and run the optimization loop.

## Constraints

- Work only in this repository at the repo root.
- Instagram only — no Facebook or Threads.
- Do not commit, push, or edit plan files.
- Do not log or print secret values.
- Do not change source code unless a run fails due to a clear bug and a fix is required to complete the job.

## Environment

Create `.env` at the repo root from Cursor Cloud secrets:

```
OPENAI_API_KEY=
OPENAI_IMAGE_MODEL=gpt-image-2
OPENAI_TEXT_MODEL=gpt-4o
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
META_ACCESS_TOKEN=
META_IG_USER_ID=
META_GRAPH_VERSION=v22.0
BRAND_NAME=discipline.mn
DEFAULT_POST_HOUR=6
TZ=Asia/Ulaanbaatar
DRY_RUN=false
```

## Steps

1. Confirm the workspace root contains `package.json`, `src/index.ts`, and `.env.example`.

2. Write `.env` from secrets. Use defaults above when a secret is optional.

3. If `node_modules` is missing, run:
   ```bash
   npm install
   ```

4. Run the measure pipeline:
   ```bash
   npm run measure:once
   ```

5. Verify with Supabase MCP or SQL:
   - latest `pipeline_runs`: `run_type = measure_optimize`, `status = completed`
   - recent `engagement_metrics` where `platform = instagram`
   - recent `viral_scores` if posts were scored

6. Report a short summary:
   - number of posts analyzed
   - top viral score
   - classification breakdown: viral / good / weak
   - any errors from `pipeline_runs.errors`

## Failure handling

- Meta insights API error: report the Graph API error clearly; retry at most once.
- Use Instagram metrics only (`platform = instagram`).

## Expected output format

```
Status: completed | failed
Posts analyzed: ...
Top viral score: ...
Breakdown: viral=..., good=..., weak=...
Errors: none | ...
```
