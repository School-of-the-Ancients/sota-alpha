// Vercel serverless function: /api/lesson/next
import { PERSONAS } from "../personas.js";
import { NodeSchema } from "../validation.js";

// Very light in-memory rate limit (per IP)
const BUCKET = new Map(); // ip -> { count, ts }
const WINDOW_MS = 60_000; // 1 minute
const LIMIT = 30;         // 30 requests/min per IP (tune for demos)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  try {
    // Rate limit
    const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
    const now = Date.now();
    const bucket = BUCKET.get(ip) || { count: 0, ts: now };
    if (now - bucket.ts > WINDOW_MS) { bucket.count = 0; bucket.ts = now; }
    bucket.count++; BUCKET.set(ip, bucket);
    if (bucket.count > LIMIT) return res.status(429).json({ error: "Rate limit. Try again shortly." });

    const { personaId, goal, level = "intro", sources = [], state, userChoiceId, userChoiceText } = req.body || {};
    const persona = PERSONAS[personaId];
    if (!persona) return res.status(400).json({ error: "Unknown persona" });

    const system = [
      persona.systemPrompt,
      "Output strict JSON only. Keys: id, speaker, line?, choices?, nextId?, takeaway?, sources?, quiz?.",
      "For intermediate steps, include {id, speaker:'character', line, choices:[{id:'A'|'B'|'C',text}]}",
      "For endings, omit choices and include takeaway + 2 quiz items + 2–3 sources."
    ].join("\n");

    const userPayload = {
      spec: "LessonNode",
      goal,
      level,
      sources: sources.length ? sources : persona.canon,
      state: state || { personaId, history: [] },
      userChoiceId: userChoiceId || null,
      userChoiceText: userChoiceText || null
    };

    // Call OpenAI (Chat Completions JSON mode or Responses API with JSON)
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Persona: ${persona.name} — ${persona.role}` },
          { role: "user", content: JSON.stringify(userPayload) }
        ]
      })
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(500).json({ error: err.slice(0, 400) });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content;

    let node;
    try {
      node = JSON.parse(content);
      node = NodeSchema.parse(node); // validate shape
    } catch (e) {
      // Fallback: graceful terminal
      node = {
        id: "ending",
        speaker: "character",
        line: "We’ll end here for now.",
        takeaway: "Learning happens by reasoning step by step—come back for the next branch.",
        sources: (persona.canon || []).slice(0,2),
        quiz: [
          { q: "Was there a clear takeaway?", opts: ["Yes", "No", "Not sure"], correct: 0 },
          { q: "Do you want another branch?", opts: ["Yes", "No", "Maybe"], correct: 0 }
        ]
      };
    }

    const nextState = (state && typeof state === "object") ? state : { personaId, history: [] };
    nextState.history.push({ nodeId: node.id, choiceId: userChoiceId || null });

    return res.status(200).json({ node, state: nextState });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}
