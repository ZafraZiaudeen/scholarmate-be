import { z } from "zod";

// DTO => Data Transfer Object
export const CreateLaundryCategoryDTO = z.object({
  name: z.string(),
  description: z.string(),
  processingTime: z.string(),
  available: z.boolean().optional(), 
});