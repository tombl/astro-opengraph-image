import type { APIContext } from "astro";
import { parse } from "devalue";
import { convert } from "./convert";
import type { Options } from "./integration";

// @ts-expect-error
import options_ from "og-image:config";

const options = parse(options_) as Options;

export async function GET(context: APIContext) {
  const png = await convert(context.url, options);
  if (!png) return new Response(null, { status: 400 });
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
    },
  });
}
