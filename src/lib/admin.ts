import { notFound, redirect } from "next/navigation";

import { getSession } from "@/lib/session";

// Call at the top of every admin page's data component and every admin Server Action.
// Layout checks alone aren't enough: layouts don't re-run on client-side navigation.
// Non-admins get a 404 so the admin area's existence isn't revealed.
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/admin");
  if (session.user.role !== "admin") notFound();
  return session;
}
