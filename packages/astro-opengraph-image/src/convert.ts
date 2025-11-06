import { initWasm, Resvg } from "@resvg/resvg-wasm";
import { decodeHTML } from "entities";
import lz from "lz-string";
import satori from "satori";
import { html } from "satori-html";
import type { Options } from "./integration";

interface VNode {
  type: string;
  props: {
    style?: Record<string, any>;
    children?: string | VNode | VNode[];
    [prop: string]: any;
  };
}

function decodeEntities(node: VNode) {
  if (typeof node.props.children === "string") {
    node.props.children = decodeHTML(node.props.children);
  } else if (Array.isArray(node.props.children)) {
    node.props.children.forEach(decodeEntities);
  } else if (node.props.children) {
    decodeEntities(node.props.children);
  }
}

let initialized: Promise<void> | null = null;

export async function convert(url: URL, options: Options) {
  const data = url.searchParams.get("html");
  if (data === null) {
    console.warn("Missing html search param");
    return null;
  }

  const markup = lz.decompressFromEncodedURIComponent(data);

  const root: VNode = html(markup);

  decodeEntities(root);

  const svg = await satori(root, {
    width: options.width / options.scale,
    height: options.height / options.scale,
    fonts: options.fonts,
  });

  await (initialized ??= initWasm(
    import.meta.resolve("@resvg/resvg-wasm/index_bg.wasm"),
  ));

  const resvg = new Resvg(svg, {
    fitTo: { mode: "zoom", value: options.scale },
    font: { loadSystemFonts: false },
    background: options.background,
  });
  const image = resvg.render();

  try {
    return image.asPng();
  } finally {
    image.free();
    resvg.free();
  }
}
