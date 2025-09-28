// /api/lesson/next
import { PERSONAS, resolvePersonaId } from "../personas.js";
import { NodeSchema } from "../validation.js";

function normalizeNode(n, persona) {
  // ensure minimal shape, then upgrade to terminal if no choices
  const out = { id: n.id || "node", speaker: "character" };
  if (Array.isArray(n.choices) && n.choices.length) {
    // map to at most 3, assign A/B/C ids if missing
    const ABC = ["A","B","C"];
    out.line = n.line || "Choose an option.";
    out.choices = n.choices.slice(0,3).map((c,i)=>({
      id: c.id || ABC[i],
      text: c.text || String(c)
    }));
  } else {
    out.takeaway = n.takeaway || (n.line ? n.line : "Here’s the key idea.");
    out.sources  = (n.sources && n.sources.length) ? n.sources.slice(0,3)
                : (persona.canon || []).slice(0,2);
    out.quiz     = (Array.isArray(n.quiz) && n.quiz.length === 2) ? n.quiz : [
      { q: "Was there a clear takeaway?", opts: ["Yes","No","Not sure"], correct: 0 },
      { q: `Which figure spoke?`,        opts: [persona.name, "Unknown", "Another"], correct: 0 }
    ];
  }
  return out;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Origin, Accept");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "Use POST" });

  try {
    const { personaId, goal, level="intro", sources=[], state, userChoiceId, userChoiceText } = req.body || {};
    const resolvedId = resolvePersonaId(personaId || "socrates");
    if (!resolvedId) return res.status(400).json({ error: "Unknown persona" });
    const persona = PERSONAS[resolvedId];
    if (!persona) return res.status(400).json({ error: "Unknown persona" });

    const step = (state?.history?.length || 0);
    const system = persona.systemPrompt;

    const userPayload = {
      spec: "LessonNode",
      goal, level,
      sources: sources.length ? sources : persona.canon,
      state: state || { personaId: resolvedId, history: [] },
      userChoiceId: userChoiceId || null,
      userChoiceText: userChoiceText || null,
      step
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-chat-latest",
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user",   content: `Persona: ${persona.name} — ${persona.role}` },
          { role: "user",   content: JSON.stringify(userPayload) }
        ]
      })
    });

    const raw = await r.text();
    if (!r.ok) {
      console.error("OpenAI error", r.status, raw);
      return res.status(502).json({ error: raw.slice(0, 1000) });
    }

    let data; try { data = JSON.parse(raw); }
    catch { return res.status(502).json({ error: "Non-JSON from model" }); }

    const content = data?.choices?.[0]?.message?.content || "{}";
    let node;
    try {
      const candidate = JSON.parse(content);
      node = NodeSchema.parse(normalizeNode(candidate, persona));
    } catch (e) {
      // Final guard — never break the UI
      node = {
        id: "ending",
        speaker: "character",
        takeaway: "Learning happens by reasoning step by step—come back for the next branch.",
        sources: (persona.canon || []).slice(0,2),
        quiz: [
          { q: "Was there a clear takeaway?", opts: ["Yes","No","Not sure"], correct: 0 },
          { q: "Do you want another branch?", opts: ["Yes","No","Maybe"], correct: 0 }
        ]
      };
    }

    const nextState = state && typeof state === "object" ? state : { personaId: resolvedId, history: [] };
    nextState.history.push({ nodeId: node.id, choiceId: userChoiceId || null });
    return res.status(200).json({ node, state: nextState, personaId: resolvedId });
  } catch (e) {
    return res.status(500).json({ error: e?.message || "Unknown error" });
  }
}
