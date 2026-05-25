# AGENTS.md

## Cursor Cloud specific instructions

### Overview

This is a Node.js/TypeScript CLI application — a self-improving AI social media pipeline that generates, posts, measures, and optimizes viral Mongolian-language content for Instagram. There is no frontend or web server; it runs as a cron daemon or one-shot CLI.

### Key commands

All standard commands are in `package.json` scripts:

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start cron daemon (schedules generate at 08:00 ULAT, measure at 22:00 ULAT) |
| `npm run pipeline:once` | Run one generate-and-post cycle |
| `npm run measure:once` | Run one measure-and-optimize cycle |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run typecheck` | Type-check without emitting (lint equivalent) |

### Environment variables

All required secrets (`OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, etc.) are injected via Cloud Agent secrets. The app uses `dotenv` to load a `.env` file, but environment variables take precedence.

Set `DRY_RUN=true` to skip actual Instagram publishing via Meta Graph API. This is the recommended mode for development and testing. When `DRY_RUN` is active, the pipeline still generates content, creates images, and stores data in Supabase — it just skips the final Meta API call.

### Gotchas

- There is no ESLint config; `npm run typecheck` (`tsc --noEmit`) is the only lint-equivalent check.
- The `pipeline:once` command calls OpenAI for both text (GPT-4o) and image generation (DALL-E), which can take 1-2 minutes to complete.
- A harmless `[DEP0040] punycode` deprecation warning appears on startup — this is from a transitive dependency and can be ignored.
- The `.env` file is gitignored; create it from `.env.example` if missing (`cp .env.example .env`), then set `DRY_RUN=true`.
