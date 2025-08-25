import { z } from "zod";

  export const CreateBookDTO = z.object({
    title: z.string(),
    pageNumber: z.string(),
    content: z.string(),
    chapter: z.string().optional(),
  });