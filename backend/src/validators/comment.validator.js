
/*
 * Validates comment and reply request bodies.
 * Ensures comment content is present and within the allowed length.
 */

import { z } from "zod";

export const commentSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});
