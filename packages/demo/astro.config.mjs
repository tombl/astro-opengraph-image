import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import cloudflare from "@astrojs/cloudflare";

import opengraphImage from "astro-opengraph-image";
import { readFile } from "node:fs/promises";

export default defineConfig({
  site: "https://mysite.example",

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
      fonts: [
        {
          name: "Inter",
          data: await readFile(
            "node_modules/@fontsource/inter/files/inter-latin-700-normal.woff",
          ),
          style: "normal",
          weight: 700,
        },
        {
          name: "Inter",
          data: await readFile(
            "node_modules/@fontsource/inter/files/inter-latin-400-normal.woff",
          ),
          style: "normal",
          weight: 400,
        },
      ],
    }),
  ],
});
