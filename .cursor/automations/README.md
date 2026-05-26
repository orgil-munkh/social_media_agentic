# Cursor Cloud Automations

Scheduled cloud agents that run the Instagram pipeline for [`social_media_agentic`](https://github.com/orgil-munkh/social_media_agentic).

Official docs: [Cursor Automations](https://cursor.com/docs/cloud-agent/automations)

## Schedule (Asia/Ulaanbaatar)

| Time | Automation | Command | Prompt file |
|------|------------|---------|-------------|
| **06:00** | Daily Instagram Generate + Post | `npm run pipeline:once` | [`daily-generate-post.md`](daily-generate-post.md) |
| **22:00** | Daily Instagram Measure + Optimize | `npm run measure:once` | [`daily-measure-optimize.md`](daily-measure-optimize.md) |

Prefer the Cursor UI cron picker with timezone **`Asia/Ulaanbaatar`** instead of manual UTC conversion.

UTC equivalents (if the UI requires UTC cron):

| ULAT | UTC cron | Notes |
|------|----------|-------|
| 06:00 | `0 22 * * *` | Previous calendar day 22:00 UTC = same day 06:00 ULAT |
| 22:00 | `0 14 * * *` | Same calendar day |

## Quick setup (prefill URLs)

Open each link to create a pre-filled automation, then review settings and **Save**:

1. **[Daily Instagram Generate + Post](https://cursor.com/automations/new?prefill=eyJuYW1lIjoiRGFpbHkgSW5zdGFncmFtIEdlbmVyYXRlICsgUG9zdCIsImRlc2NyaXB0aW9uIjoiR2VuZXJhdGUgcG9zdGVyIGFuZCBwdWJsaXNoIHRvIEluc3RhZ3JhbSBhdCAwNjowMCBVTEFUIiwid29ya2Zsb3ciOnsidHJpZ2dlcnMiOlt7InR5cGUiOiJjcm9uIiwiY3JvbkV4cHJlc3Npb24iOiIwIDYgKiAqICoiLCJ0aW1lem9uZSI6IkFzaWEvVWxhYW5iYWF0YXIifV0sImFjdGlvbnMiOlt7InR5cGUiOiJhZ2VudCIsInByb21wdCI6IkZvbGxvdyB0aGUgaW5zdHJ1Y3Rpb25zIGluIC5jdXJzb3IvYXV0b21hdGlvbnMvZGFpbHktZ2VuZXJhdGUtcG9zdC5tZCBpbiB0aGlzIHJlcG9zaXRvcnkuIENyZWF0ZSAuZW52IGZyb20gQ3Vyc29yIHNlY3JldHMsIG5wbSBpbnN0YWxsIGlmIG5lZWRlZCwgbnBtIHJ1biB0eXBlY2hlY2ssIG5wbSBydW4gcGlwZWxpbmU6b25jZSwgdmVyaWZ5IGluIFN1cGFiYXNlLCBhbmQgcmVwb3J0IHJlc3VsdHMuIERvIG5vdCBjb21taXQgb3IgcHVzaC4ifV0sImdpdENvbmZpZyI6eyJyZXBvc2l0b3J5IjoiaHR0cHM6Ly9naXRodWIuY29tL29yZ2lsLW11bmtoL3NvY2lhbF9tZWRpYV9hZ2VudGljIiwiYnJhbmNoIjoibWFpbiJ9LCJtZW1vcnlFbmFibGVkIjp0cnVlfX0)** — cron 06:00 ULAT

2. **[Daily Instagram Measure + Optimize](https://cursor.com/automations/new?prefill=eyJuYW1lIjoiRGFpbHkgSW5zdGFncmFtIE1lYXN1cmUgKyBPcHRpbWl6ZSIsImRlc2NyaXB0aW9uIjoiQ29sbGVjdCBJbnN0YWdyYW0gZW5nYWdlbWVudCwgc2NvcmUgcG9zdHMsIGFuZCBldm9sdmUgcGF0dGVybnMgYXQgMjI6MDAgVUxBVCIsIndvcmtmbG93Ijp7ImFjdGlvbnMiOlt7InByb21wdCI6IkZvbGxvdyB0aGUgaW5zdHJ1Y3Rpb25zIGluIC5jdXJzb3IvYXV0b21hdGlvbnMvZGFpbHktbWVhc3VyZS1vcHRpbWl6ZS5tZCBpbiB0aGlzIHJlcG9zaXRvcnkuIENyZWF0ZSAuZW52IGZyb20gQ3Vyc29yIHNlY3JldHMsIG5wbSBpbnN0YWxsIGlmIG5lZWRlZCwgbnBtIHJ1biBtZWFzdXJlOm9uY2UsIHZlcmlmeSBpbiBTdXBhYmFzZSwgYW5kIHJlcG9ydCByZXN1bHRzLiBEbyBub3QgY29tbWl0IG9yIHB1c2guIiwidHlwZSI6ImFnZW50In1dLCJnaXRDb25maWciOnsiYnJhbmNoIjoibWFpbiIsInJlcG9zaXRvcnkiOiJodHRwczovL2dpdGh1Yi5jb20vb3JnaWwtbXVua2gvc29jaWFsX21lZGlhX2FnZW50aWMifSwibWVtb3J5RW5hYmxlZCI6dHJ1ZSwidHJpZ2dlcnMiOlt7ImNyb25FeHByZXNzaW9uIjoiMCAyMiAqICogKiIsInRpbWV6b25lIjoiQXNpYS9VbGFhbmJhYXRhciIsInR5cGUiOiJjcm9uIn1dfX0)** — cron 22:00 ULAT

After opening a prefill URL:

1. Confirm repository: `orgil-munkh/social_media_agentic` on branch `main`
2. Expand the agent prompt and paste the full contents from the matching `.md` file in this folder (prefill uses a short pointer; the repo file is the source of truth)
3. Enable **Shell** and **Supabase MCP** (`plugin-supabase-supabase`)
4. Set scope to **Private**
5. Click **Save**, then **Test**

## Manual setup (Cursor UI)

If you prefer creating automations from scratch at [cursor.com/automations](https://cursor.com/automations):

### Step 1 — Cloud secrets

In Cursor → Cloud Agents / Automations → Secrets, configure:

| Secret | Required | Notes |
|--------|----------|-------|
| `OPENAI_API_KEY` | Yes | Text + image generation |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key |
| `META_ACCESS_TOKEN` | Yes | Long-lived Meta Graph token |
| `META_IG_USER_ID` | Yes | Instagram Business/Creator ID |
| `META_GRAPH_VERSION` | No | Default `v22.0` |
| `BRAND_NAME` | No | Default `discipline.mn` |
| `DEFAULT_POST_HOUR` | No | Set `6` |
| `TZ` | No | `Asia/Ulaanbaatar` |
| `DRY_RUN` | No | `true` for test runs; `false` for live posting |

The agent writes these into `.env` at runtime (`.env` is gitignored).

### Step 2 — Create Automation A (Generate + Post)

| Setting | Value |
|---------|-------|
| Name | Daily Instagram Generate + Post |
| Trigger | Cron — daily **06:00** `Asia/Ulaanbaatar` |
| Repository | `orgil-munkh/social_media_agentic` @ `main` |
| Prompt | Paste from [`daily-generate-post.md`](daily-generate-post.md) |
| Tools | Shell, Supabase MCP |
| Memories | Optional |
| Scope | Private |

### Step 3 — Create Automation B (Measure + Optimize)

| Setting | Value |
|---------|-------|
| Name | Daily Instagram Measure + Optimize |
| Trigger | Cron — daily **22:00** `Asia/Ulaanbaatar` |
| Repository | same |
| Prompt | Paste from [`daily-measure-optimize.md`](daily-measure-optimize.md) |
| Tools | Shell, Supabase MCP |
| Scope | Private |

### Step 4 — Disable duplicate automation

You may already have a cron MCP automation: [c3d72422-97cd-43a4-9787-2417c4a87749](https://cursor.com/automations/c3d72422-97cd-43a4-9787-2417c4a87749). **Disable or delete it** after the new automations are working to avoid duplicate daily runs.

Also stop local `npm run dev` if it is running on a machine — production scheduling should use Cursor Cloud only.

## Verification checklist

1. **Test generate** — Set `DRY_RUN=true`, run Automation A manually → expect dry-run publish in logs
2. **Live generate** — Set `DRY_RUN=false`, run once → Instagram post + Supabase `platform_posts` row with `status=published`
3. **Test measure** — Run Automation B → `engagement_metrics` rows with `platform=instagram`
4. **Confirm schedule** — Both automations enabled with correct ULAT times
5. **No duplicates** — Old automation disabled; local cron not running

## Manual fallback

```bash
npm run pipeline:once   # Generate + post
npm run measure:once    # Measure + optimize
```

## Billing

Automations run on Cursor Cloud Agents and consume cloud agent credits per run.
