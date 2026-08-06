import { defineApp } from "convex/server";
import { v } from "convex/values";
import betterAuth from "./betterAuth/convex.config";

const app = defineApp({
  env: {
    WEBSITE_URL: v.string(),
    BETTER_AUTH_SECRET: v.string(),
    AUTH_BASE_PATH: v.string(),

    ENV: v.union(v.literal("development"), v.literal("production")),

    GOOGLE_CLIENT_ID: v.string(),
    GOOGLE_CLIENT_SECRET: v.string(),

    CLOUDFLARE_R2_ACCOUNT_ID: v.string(),
    CLOUDFLARE_R2_BUCKET_NAME: v.string(),
    CLOUDFLARE_R2_ACCESS_KEY_ID: v.string(),
    CLOUDFLARE_R2_SECRET_ACCESS_KEY: v.string(),
    CLOUDFLARE_R2_TOKEN_VALUE: v.string(),
  },
});
app.use(betterAuth);
export default app;

// TODO: streamline arg names as 'calendar' vs 'calendarInstance' vs 'calendarInstanceDoc' etc
