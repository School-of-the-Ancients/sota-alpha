# School of the Ancients — Socratic Chat Prototype

Conversational micro-lessons with historical figures. The static site runs in any modern browser and can call the companion serverless API to generate Socratic responses backed by citations.

## Features
- Interactive chat UI with persona selector and character cards
- Suggested prompts per historical figure for one-click follow-up questions
- Vercel-backed API endpoint for streaming AI dialogue and references
- Graceful fallbacks when the API cannot be reached

## Project structure
- `index.html` — single-page UI shell and styling
- `engine.js` — front-end logic, chat transport, and persona metadata
- `img/` — portrait assets for the featured figures
- `api/` — serverless functions (Vercel) powering the adaptive dialogue
- `vercel.json` — Vercel routing configuration for the deployed project

## Local development
1. Ensure `engine.js` points at the correct API base (`API_BASE`). For purely local static testing you can leave it as-is; responses will fail gracefully if the API is unreachable.
2. Serve the site from the repo root, e.g. `python3 -m http.server 8080` and open http://localhost:8080.
3. (Optional) Develop the API with `cd api && npm install && npx vercel dev` to run the endpoints locally.

## Deployment

### Static site
- Host the repository on any static provider (GitHub Pages, Netlify, Vercel, etc.).
- Serve `index.html`, `engine.js`, and the `img/` directory from the root of the project.
- Update `API_BASE` in `engine.js` to the deployed API URL.

### API (Vercel)
1. `cd api && npm install`
2. `npx vercel` to link or create a project.
3. Set environment variables on Vercel:
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` (defaults well to `gpt-4o-mini`)
4. `npx vercel deploy` or push to a connected repo to trigger a build.
5. Copy the deployment URL and set it in `engine.js` as the API base.

## Safety and reliability notes
- API key stays server-side; the browser only calls the deployed function.
- Zod-based schema validation prevents malformed responses from surfacing in the UI.
- Lightweight per-IP rate limiting guards against basic misuse.

## License
MIT
