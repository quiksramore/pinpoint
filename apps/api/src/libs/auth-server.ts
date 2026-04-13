import { electron } from "@better-auth/electron";
import { expo } from "@better-auth/expo";
import { APIError, betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { databaseConnection } from "../database/database";
import { env } from "../env";

const database = databaseConnection.getClient().db(env.DATABASE_NAME); // must specify database name here, or better-auth will auto-create 'test'
const allowedEmails = ["serbakonyt@gmail.com", "shreyas.ayyengar@gmail.com", "quiksramore@gmail.com"];

const basePath = env.ENV === "development" ? "/api/auth" : "/auth";

export const authServer = betterAuth({
  database: mongodbAdapter(database),
  plugins: [electron(), expo()],
  baseURL: env.API_URL,
  basePath,
  trustedOrigins: [env.WEBSITE_URL, "pinpoint://", ...(env.ENV === "development" ? ["exp://"] : [])], // TODO
  socialProviders: {
    google: {
      prompt: "select_account consent",
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      accessType: "offline",
      mapProfileToUser: (profile) => {
        const email = profile.email;
        if (!allowedEmails.includes(email)) {
          // TODO emails must be whitelisted
          const headers = new Headers();
          headers.set("location", `${env.WEBSITE_URL}/auth/error?message=invalid_email`);
          throw new APIError("FOUND", undefined, headers);
          // status must be FOUND so that the redirect goes to WEBSITE_URL and not API_URL
        }

        return profile;
      },
    },
  },
  // THIS IS USELESS UNLESS BETTERAUTH CAN FIX THEIR ROUTING. IF WORKS, MOVE DOMAIN LOGIC TO mapProfileToUser
  // onAPIError: {
  //   errorURL: "http://localhost:3000/error",
  //   throw: true,
  // },
});
