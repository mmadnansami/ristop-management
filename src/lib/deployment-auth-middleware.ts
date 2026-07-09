import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const PUBLIC_BACKEND_URL = "https://bnnfwffyvpvjaprlaibn.supabase.co";
const PUBLIC_BACKEND_KEY = "sb_publishable_2A3ALYEuxj4OaDgneJX79Q_v41Gbs36";

export const requireDeploymentAuth = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const backendUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || PUBLIC_BACKEND_URL;
  const backendKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || PUBLIC_BACKEND_KEY;
  const request = getRequest();
  const authHeader = request?.headers?.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: please sign in again");
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) throw new Error("Unauthorized: please sign in again");

  const supabase = createClient<Database>(backendUrl, backendKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) throw new Error("Unauthorized: please sign in again");

  return next({
    context: {
      supabase,
      userId: data.claims.sub,
      claims: data.claims,
    },
  });
});