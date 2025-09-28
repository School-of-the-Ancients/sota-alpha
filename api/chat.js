// /api/chat
import { PERSONAS, resolvePersonaId } from "./personas.js";

export default async function handler(req, res){
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Headers","Content-Type, Origin, Accept");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const { personaId="socrates", history=[], user="" } = req.body || {};
  const resolvedId = resolvePersonaId(personaId || "socrates");
  if (!resolvedId) return res.status(400).json({ error: "Unknown persona" });
  const p = PERSONAS[resolvedId];
  if (!p) return res.status(400).json({ error: "Unknown persona" });

  const basePrompt = p.chatPrompt || `${p.name} (${p.role}). Stay in character.`;
  const system = `${basePrompt}

App expectations:
• Lead with curious, Socratic questioning before giving direct answers.
• Keep responses concise (≤5 sentences) and invite the user to continue reflecting.
• Cite canonical sources sparingly in short parentheses drawn from: ${(p.canon || []).join('; ')}.
• Remain within the persona’s historical voice; avoid anachronisms.`;
  const msgs = [{ role:"system", content: system }, ...history, { role:"user", content:user }];

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST",
    headers:{ "Authorization":`Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type":"application/json" },
    body: JSON.stringify({ model: process.env.OPENAI_MODEL || "gpt-5-chat-latest", temperature: 0.7, messages: msgs })
  });

  const data = await r.json();
  const reply = data?.choices?.[0]?.message?.content || "[no reply]";
  const newHist = [...history, { role:"user", content: user }, { role:"assistant", content: reply }];
  return res.status(200).json({ reply, history: newHist, personaId: resolvedId });
}
