import { z } from "zod";

export const NodeSchema = z.object({
  id: z.string().default("node"),
  speaker: z.enum(["narrator","student","character"]).default("character"),
  line: z.string().max(320).optional(),
  choices: z.array(z.object({
    id: z.union([z.literal("A"), z.literal("B"), z.literal("C")]).optional(),
    text: z.string().max(80)
  })).max(3).optional(),
  nextId: z.string().optional(),
  takeaway: z.string().max(220).optional(),
  sources: z.array(z.string().max(120)).max(4).optional(),
  quiz: z.array(z.object({
    q: z.string().max(140),
    opts: z.array(z.string().max(60)).length(3),
    correct: z.number().min(0).max(2)
  })).length(2).optional()
}).refine(n => {
  const looksTerminal = !n.choices && !!n.takeaway;
  if (looksTerminal) return !!(n.sources && n.quiz);
  return true;
}, { message: "Terminal nodes need takeaway + sources + quiz" });
