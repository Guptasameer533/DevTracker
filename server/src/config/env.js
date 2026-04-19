const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('4000').transform(Number),
  DATABASE_URL: z.string().url(),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  // Must be exactly 32 bytes when base64-decoded (256 bits for AES-256-GCM)
  ENCRYPTION_KEY: z.string().min(44).max(44),
  FRONTEND_URL: z.string().url(),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map(i => `  ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error(`\nEnvironment validation failed:\n${issues}\n`); // eslint-disable-line no-console
    process.exit(1);
  }
  return result.data;
}

const env = validateEnv();

module.exports = env;
