import { z } from "zod";

// Every external input is validated against one of these before it touches the DB.
export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const createBookmarkSchema = z.object({
  videoId: z.string().min(1),
  timeSec: z.number().nonnegative().finite(),
  label: z.string().trim().max(80).optional().nullable(),
});

export const updateBookmarkSchema = z.object({
  label: z.string().trim().max(80).nullable(),
});

export const progressSchema = z.object({
  videoId: z.string().min(1),
  positionSec: z.number().nonnegative().finite(),
  durationSec: z.number().nonnegative().finite(),
  completed: z.boolean().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/** Flatten a ZodError into { field: message } for form display. */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path[0]?.toString() ?? "form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
