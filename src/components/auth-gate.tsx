import { redirect } from "next/navigation";

import { safeNext } from "@/lib/auth-shared";
import { getSession } from "@/lib/session";

import { AuthForm } from "./auth-form";

type Props = {
  mode: "sign-in" | "sign-up";
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Reads the session and `?next=`, so render it inside <Suspense>. Signed-in visitors skip the form.
export async function AuthGate({ mode, searchParams }: Props) {
  const next = safeNext((await searchParams).next);
  if (await getSession()) redirect(next);
  return <AuthForm mode={mode} next={next} />;
}
