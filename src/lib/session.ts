import { headers } from "next/headers";

import { auth } from "@/lib/auth";

// Reads request headers, so call it from a component wrapped in <Suspense>.
export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
