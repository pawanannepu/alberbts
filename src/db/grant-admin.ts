import { config } from "dotenv";
import { eq } from "drizzle-orm";

config({ path: ".env.local" });
config();

// Usage: npm run db:admin -- someone@example.com [user]
// Gives (or with "user", removes) the admin role. Admins are managed here on purpose, not in the UI.
async function main() {
  const [email, role = "admin"] = process.argv.slice(2);
  if (!email || !["admin", "user"].includes(role)) {
    throw new Error("Usage: npm run db:admin -- <email> [admin|user]");
  }

  const { db } = await import("./index");
  const { user } = await import("./schema");
  const rows = await db
    .update(user)
    .set({ role })
    .where(eq(user.email, email.toLowerCase()))
    .returning({ email: user.email, role: user.role });

  if (rows.length === 0) throw new Error(`No user with email ${email}. They need to sign up first.`);
  console.log(`${rows[0].email} is now "${rows[0].role}"`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
