import { z } from "zod";

export const CreateMCQDTO = z.object({
  year: z.string(),
  questionNumber: z.string(),
  question: z.string(),
  options: z.array(z.string()),
  correctAnswer: z.string(),
  chapter: z.string().optional(),
});