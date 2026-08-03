// ---------------------------------------------------------------------------
// TalentOS Auth Functions — TanStack Start server functions
// ---------------------------------------------------------------------------

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { signIn, signUp, signOut, verifySession } from "./auth.server";

const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const SignUpSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(2, "Name must be at least 2 characters"),
});

export const loginFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => LoginSchema.parse(data))
  .handler(async ({ data }) => {
    return signIn(data.email, data.password);
  });

export const signUpFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => SignUpSchema.parse(data))
  .handler(async ({ data }) => {
    return signUp(data.email, data.password, data.fullName);
  });

export const signOutFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ accessToken: z.string() }).parse(data))
  .handler(async ({ data }) => {
    await signOut(data.accessToken);
    return { ok: true };
  });

export const verifySessionFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ accessToken: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const profile = await verifySession(data.accessToken);
    return { profile };
  });
