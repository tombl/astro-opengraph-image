import type { AstroIntegration } from "astro";
import { stringify } from "devalue";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { Font } from "satori";
import { ELEMENT_NODE, transform, walk } from "ultrahtml";
import { convert } from "./convert";

export interface Options {
  background?: string;
  width: number;
  height: number;
  scale: number;
  fonts: Font[];
}

export default function ogImage(options: Options): AstroIntegration {
  return {
    name: "og-image",
    hooks: {
      "astro:config:setup"({
        injectRoute,
        addDevToolbarApp,
        updateConfig,
        command,
        config,
      }) {
        // if we're in dev, or have an ssr adapter, we are allowed to emit
        // the _og route. in the case of a truly static build, injectRoute will fail
        // but is not necessary given we'll traverse the output anyway.
        if (command !== "dev" && !config.adapter) return;

        injectRoute({
          pattern: "/_og",
          entrypoint: new URL("./route.ts", import.meta.url),
          prerender: false,
        });
        addDevToolbarApp({
          id: "og-image",
          name: "OpenGraph Image",
          icon: "image",
          entrypoint: new URL("./app.ts", import.meta.url),
        });
        updateConfig({
          vite: {
            plugins: [
              {
                name: "og-image:config",
                resolveId(id) {
                  if (id === "og-image:config") {
                    return "\0og-image:config";
                  }
                },
                load(id) {
                  if (id === "\0og-image:config") {
                    return `export default ${
                      JSON.stringify(stringify(options))
                    }`;
                  }
                },
              },
            ],
          },
        });
      },
      async "astro:build:done"({ assets, dir }) {
        const ogDir = new URL("_og/", dir);

        await Promise.all(
          [...assets]
            .flatMap(([, files]) => files)
            .map(async (url) => {
              const file = fileURLToPath(url);
              const content = await readFile(file, "utf8");

              const transformed = await transform(content, [
                async (doc) => {
                  await walk(doc, async (node) => {
                    if (
                      node.type === ELEMENT_NODE &&
                      node.name.toLowerCase() === "meta" &&
                      node.attributes.property === "og:image"
                    ) {
                      const url = new URL(
                        node.attributes.content.replaceAll("&#38;", "&"),
                      );
                      if (url.pathname !== "/_og") return;

                      const png = await convert(url, options);
                      if (!png) return;

                      const hash = createHash("sha256")
                        .update(png)
                        .digest("base64url")
                        .slice(0, 12);

                      await mkdir(ogDir, { recursive: true });
                      await writeFile(new URL(`${hash}.png`, ogDir), png);

                      node.attributes.content = new URL(
                        `/_og/${hash}.png`,
                        url,
                      ).href;
                    }
                  });
                  return doc;
                },
              ]);

              await writeFile(file, transformed);
            }),
        );
      },
    },
  };
}
