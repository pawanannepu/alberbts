import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { after } from "next/server";

import { db } from "@/db";

import { MIN_PASSWORD_LENGTH } from "./auth-shared";
import { hasVerifiedSender, sendEmail } from "./email";
import { resetPasswordMessage, verifyEmailMessage } from "./email-templates";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    // Sign-in requires a verified email once a real sender is configured (EMAIL_FROM). With only
    // Resend's sandbox sender, mail can't reach ordinary customers, so verification stays optional.
    requireEmailVerification: hasVerifiedSender(),
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      // Not awaited: response time must not reveal whether the email has an account.
      void sendEmail({ to: user.email, ...resetPasswordMessage({ name: user.name, url }) }).catch((error) =>
        console.error("Password reset email failed", error),
      );
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({ to: user.email, ...verifyEmailMessage({ name: user.name, url }) });
    },
  },
  advanced: {
    // Lets Better Auth finish work (timing-attack padding, email sends) after responding.
    backgroundTasks: {
      handler: (promise) => {
        try {
          after(promise);
        } catch {
          promise.catch(() => {}); // not in a request scope; it's already running
        }
      },
    },
  },
  // Keep last so server actions can set cookies.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
