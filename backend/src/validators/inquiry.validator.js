
/*
 * Validates inquiry request data.
 * Ensures tenants submit a non-empty message within the allowed length.
 */

import { z } from "zod";

export const inquirySchema = z.object({
  message: z.string().trim().min(5).max(2000),
});
