import type { APIContext } from "astro";
import { parse } from "devalue";
import { convert } from "./convert";
import { loadFontsForRequest } from "./fonts";
import type { Font } from "satori";
import type { RuntimeConfig } from "./types";

// @ts-expect-error
import options_ from "og-image:config";

const config = parse(options_) as RuntimeConfig;

const fontCache = new Map<string, Promise<Font[]>>();

export async function GET(context: APIContext) {
  const origin = context.url.origin;
  let fontsPromise = fontCache.get(origin);
  if (!fontsPromise) {
    fontsPromise = loadFontsForRequest(config.fonts, origin);
    fontCache.set(origin, fontsPromise);
  }

  const fonts = await fontsPromise;

  const png = await convert(context.url, config.options, fonts);
  if (!png) return new Response(null, { status: 400 });
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
    },
  });
}
