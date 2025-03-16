import { defineConfig } from "astro/config";

import ogImage from "astro-opengraph-image";
import { readFile } from "node:fs/promises";

export default defineConfig({
  integrations: [
    ogImage({
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
