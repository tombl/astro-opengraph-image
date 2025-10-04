import { defineConfig, fontProviders } from "astro/config";
import node from "@astrojs/node";
import cloudflare from "@astrojs/cloudflare";

import opengraphImage from "astro-opengraph-image";

export default defineConfig({
  site: "https://mysite.example",

  experimental: {
    fonts: [
      {
        name: "Inter",
        cssVariable: "--font-inter",
        provider: fontProviders.fontsource(),
        weights: ["400", "700"],
        styles: ["normal"],
      },
    ],
  },

  output: process.env.OG_TEST_OUTPUT ?? "static",
  adapter: {
    none: () => undefined,
    node: () => node({ mode: "standalone" }),
    cloudflare: () => cloudflare({}),
  }[process.env.OG_TEST_ADAPTER ?? "none"](),

  integrations: [
    opengraphImage({
      background: "#111",
      width: 1200,
      height: 630,
      scale: 3,
    }),
  ],
});
