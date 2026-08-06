import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({
      router: {
        routesDirectory: "app",
      },
    }),
    viteReact(),
  ],
  ssr: {
    noExternal: ["@convex-dev/better-auth", "@convex-dev/react-query", "convex"],
  },
});

export default config;
