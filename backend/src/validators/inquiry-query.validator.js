
/*
 * Validates notification list query parameters.
 * Supports pagination and filtering notifications by read status.
 */

import { z } from "zod";

export const inquiryQuerySchema = z.object({
  page: z.preprocess(
    (value) => value === undefined ? 1 : Number(value),
    z.number().int().min(1)
  ),

  limit: z.preprocess(
    (value) => value === undefined ? 10 : Number(value),
    z.number().int().min(1).max(50)
  ),

  unreadOnly: z.preprocess(
    (value) => value === undefined ? false : value === "true",
    z.boolean()
  ),
});
