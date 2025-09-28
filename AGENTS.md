# Repository Guidelines

## Project Structure & Module Organization
The browser surface lives in `index.html` and `engine.js` at repo root, with persona portraits under `img/` for direct static hosting. Serverless code sits in `api/`: `chat.js` handles open chat, `lesson/next.js` produces branching lessons, `personas.js` stores canon metadata, and `validation.js` applies Zod guards, all routed via `vercel.json`.

## Build, Test, and Development Commands
- `python3 -m http.server 8080` from the root serves the static UI at http://localhost:8080 for quick smoke tests.
- `cd api && npm install` bootstraps the single runtime dependency before touching serverless endpoints.
- `cd api && npm run dev` proxies Vercel locally (update `engine.js` `API_BASE` to `http://localhost:3000`); `npm run deploy` hands the functions to Vercel once secrets are set.

## Coding Style & Naming Conventions
- Use two-space indentation, trailing semicolons, and ES modules; follow the file’s existing quote style (UI prefers single quotes, API prefers double).
- Keep persona ids lowercase and match their asset filenames; exported constants stay SCREAMING_SNAKE_CASE (`PERSONAS`, `NodeSchema`).
- Store multi-line model prompts in template literals so formatting cues survive the request body.

## Testing Guidelines
There is no automated suite yet, so document manual checks in your PR. With `npm run dev` running, hit `curl http://localhost:3000/api/chat -H 'Content-Type: application/json' -d '{"personaId":"socrates","user":"What is virtue?"}'` and confirm a `reply` plus appended `history`. For branching lessons, POST to `/api/lesson/next` and verify the payload passes `NodeSchema` (takeaway, sources, and quiz present) before shipping.

## Commit & Pull Request Guidelines
Existing commits favor short, imperative subjects (e.g., "Fix missing persona replies") under 72 characters; expand reasoning in the body when needed. Keep UI, persona data, and API changes in separate commits so reviewers can isolate concerns. PR descriptions should cover what changed, how you tested it, any `API_BASE` adjustments, and screenshots or clips when the interface shifts; link issues or Vercel previews when available.

## Security & Configuration Tips
Never commit `OPENAI_API_KEY` or other secrets—store them in Vercel or a local `.env` ignored by git. Keep `OPENAI_MODEL` configurable rather than hardcoding model ids in the code. When switching environments, update `engine.js` `API_BASE` and re-run a quick chat to confirm CORS headers still align.
