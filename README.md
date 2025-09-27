# SotA — Micro Lessons (Headset-Optional)

One-minute Socratic micro-lessons with **choices → adaptive response → takeaway → sources → 2 quick checks**.
Runs in any browser (no headset). Optionally calls an AI endpoint to emulate historical figures.

## Live structure
- `web/` → static site (deploy via GitHub Pages)
- `api/` → serverless AI endpoint (deploy via Vercel)

## Quick start

### 1) Web (GitHub Pages)
1. Edit `web/engine.js` and set `AI_ENDPOINT` to your Vercel URL when ready.
2. Commit & push.
3. In GitHub: **Settings → Pages → Build and deployment**  
   Source: **Deploy from a branch**  
   Branch: **main** / Folder: **/web**  
4. Visit `https://<org>.github.io/sota-micro-lessons/web/`.

### 2) API (Vercel)
1. `cd api && npm i`
2. `npm run vercel:init` (optional) or just `npx vercel` to set up a project.
3. Add env vars on Vercel:
   - `OPENAI_API_KEY` = your key
   - `OPENAI_MODEL` = `gpt-4o-mini` (or your pick)
4. `npx vercel deploy` (or push and let Vercel Git integration deploy)
5. Copy the deployed URL, set it as `AI_ENDPOINT` in `web/engine.js`.

### Local dev
- Web: `cd web && python3 -m http.server 8080` → http://localhost:8080
- API: `cd api && npx vercel dev` → http://localhost:3000/api/lesson/next

## Safety / reliability
- No API key in the browser (serverless only).
- Schema validation on the server (Zod). On failure, the web UI falls back to static lessons.
- Per-IP basic rate limiting baked into the endpoint (very light, tweak as needed).

## License
MIT
