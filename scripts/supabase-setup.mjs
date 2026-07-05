import { readFileSync } from "fs";
import { join } from "path";

import pg from "pg";

const url =
  process.env.SUPABASE_DB_URL ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL;

if (!url) {
  console.error(
    "Falta SUPABASE_DB_URL. Obtén la URI en Supabase → Settings → Database → Connection string (URI)."
  );
  process.exit(1);
}

const sql = readFileSync(
  join(import.meta.dirname, "..", "supabase", "setup-all.sql"),
  "utf8"
);

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(sql);
await client.end();
console.log("Supabase: tablas y políticas listas.");
