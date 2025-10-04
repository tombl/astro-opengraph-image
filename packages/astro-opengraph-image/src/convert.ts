import { renderAsync } from "@resvg/resvg-js";
import { decodeHTML } from "entities";
import lz from "lz-string";
import satori, { type Font } from "satori";
import { html } from "satori-html";
import type { Options } from "./types";

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

export async function convert(url: URL, options: Options, fonts: Font[]) {
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
    fonts,
  });

  const image = await renderAsync(svg, {
    fitTo: { mode: "zoom", value: options.scale },
    font: { loadSystemFonts: false },
    background: options.background,
  });

  return image.asPng();
}
