import { headers } from "next/headers";
import { cache } from "react";

import { auth } from "@/lib/auth";

// Reads request headers, so call it from a component wrapped in <Suspense>. Memoized per request.
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));
