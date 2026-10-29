import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config();

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema",
  casing: "snake_case",
  out: "./drizzle",
  dbCredentials: {
    // Migrations run best over a direct (unpooled) connection.
    url: (process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)!,
  },
});
