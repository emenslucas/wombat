import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> {
  if (!_sql) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Make sure the Neon integration is connected and the env var is available.",
      );
    }
    _sql = neon(url);
  }
  return _sql;
}

// Export sql as the function directly
export const sql = getDb();
