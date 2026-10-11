import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.url({ protocol: /^https?$/ }).transform((url) => url.replace(/\/+$/, '')),
});

export type Env = z.infer<typeof envSchema>;

/** Parses the build-time environment. Throws on an invalid value, so the app refuses to start. */
export function parseEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}

export const env: Env = parseEnv(import.meta.env);
