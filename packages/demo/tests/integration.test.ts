/// <reference types="bun-types" />

import { describe, expect, it } from "bun:test";
import getPort from "get-port";

async function astro(command: "dev" | "preview", env?: Record<string, string>) {
  const port = await getPort();
  const server = Bun.spawn(`bun astro ${command} --port ${port}`.split(" "), {
    env,
    stdio: ["ignore", "ignore", "ignore"],
  });

  let error = null;
  for (let i = 0; i < 50; i++) {
    await Bun.sleep(100);
    try {
      const res = await fetch(`http://localhost:${port}`);
      if (res.ok) {
        error = null;
        break;
      }
    } catch (err) {
      error = err;
      continue;
    }
  }

  if (error) throw error;

  return {
    [Symbol.dispose]() {
      server.kill("SIGQUIT");
    },
    fetch(pathname: string) {
      return fetch(new URL(pathname, `http://localhost:${port}`));
    },
  };
}

async function getMeta(response: Response) {
  expect(response.status).toEqual(200);

  const meta: Record<string, string> = {};

  const rewriter = new HTMLRewriter().on("meta[property]", {
    element(el) {
      const property = el.getAttribute("property");
      const content = el.getAttribute("content");
      if (property && content) {
        meta[property] = content;
      }
    },
  });

  await rewriter.transform(response).arrayBuffer();

  return meta;
}

const snapshotImage = (
  await Bun.file("tests/__snapshots__/image.png").bytes()
).join(" ");

describe("in dev", () => {
  it("works", async () => {
    using server = await astro("dev");
    const meta = await getMeta(await server.fetch("/"));

    const url = meta["og:image"];
    expect(url).toStartWith("http://localhost");

    const image = await fetch(url);
    const blob = await image.blob();
    expect(blob.type).toEqual("image/png");
    expect((await blob.bytes()).join(" ")).toEqual(snapshotImage);
  });
});

describe.each(["static", "server"])("output: %s", (output) => {
  describe.each(["none", "node" /*, "cloudflare"*/])(
    "adapter: %s",
    (adapter) => {
      if (output === "server" && adapter === "none") {
        // can't serve with no adapter
        return;
      }

      describe("in build", () => {
        it("works", async () => {
          const env = {
            ...process.env,
            OG_TEST_OUTPUT: output,
            OG_TEST_ADAPTER: adapter,
          };
          await Bun.$`bun astro build`.env(env).quiet();
          using server = await astro("preview", env);

          const meta = await getMeta(await server.fetch("/"));

          const url = meta["og:image"];
          expect(url).toStartWith(
            output === "server"
              ? "http://localhost"
              : "https://mysite.example/",
          );
          const { pathname, search } = new URL(url);

          const image = await server.fetch(pathname + search);
          const blob = await image.blob();
          expect(blob.type).toEqual("image/png");
          expect((await blob.bytes()).join(" ")).toEqual(snapshotImage);
        });
      });
    },
  );
});
