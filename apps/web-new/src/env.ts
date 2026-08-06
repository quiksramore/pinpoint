import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_PROJECT_NAME: z.string().min(1),
    VITE_WEBSITE_URL: z.string().min(1),
    VITE_AUTH_BASE_PATH: z.string().min(1),
    VITE_HOSTNAME: z.string().min(1),
    VITE_NODE_ENV: z.enum(["development", "production"]),
    VITE_CONVEX_URL: z.string().min(1),
    VITE_CONVEX_SITE_URL: z.string().min(1),
  },

  runtimeEnv: import.meta.env,

  emptyStringAsUndefined: true,
});
