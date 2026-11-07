
/*
 * Validates registration and login request data.
 * Prevents invalid or incomplete authentication data from reaching services.
 */

import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  role: z.enum(["TENANT", "LANDLORD"]),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
});
