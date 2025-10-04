import { getFontData } from "astro:assets";
import type { FontData as AstroFontData } from "astro:assets";
import { readFile } from "node:fs/promises";
import type { Font } from "satori";
import type { FontReference } from "./types";

type FontLoadContext =
  | { kind: "request"; origin: string }
  | { kind: "build"; dir: URL };

const requestFontCache = new Map<string, Promise<Buffer>>();
const buildFontCache = new Map<string, Promise<Buffer>>();

export async function loadFontsForRequest(
  fonts: FontReference[],
  origin: string,
): Promise<Font[]> {
  return loadFonts(fonts, { kind: "request", origin });
}

export async function loadFontsForBuild(
  fonts: FontReference[],
  dir: URL,
): Promise<Font[]> {
  return loadFonts(fonts, { kind: "build", dir });
}

async function loadFonts(
  fontReferences: FontReference[],
  context: FontLoadContext,
): Promise<Font[]> {
  if (fontReferences.length === 0) return [];

  const uniqueReferences = dedupeByCssVariable(fontReferences);
  const loadedFonts: Font[] = [];

  for (const reference of uniqueReferences) {
    const variants = getFontData(reference.cssVariable);
    for (const variant of variants) {
      const source = pickSource(variant);
      if (!source) {
        throw new Error(
          `No font source found for ${reference.name} (${reference.cssVariable}).`,
        );
      }

      const data = await loadSource(source.url, context);
      const font = mapVariantToSatoriFont(reference, variant, data);
      loadedFonts.push(font);
    }
  }

  return loadedFonts;
}

function dedupeByCssVariable(fonts: FontReference[]) {
  const seen = new Set<string>();
  const result: FontReference[] = [];
  for (const font of fonts) {
    if (seen.has(font.cssVariable)) continue;
    seen.add(font.cssVariable);
    result.push(font);
  }
  return result;
}

function pickSource(variant: AstroFontData) {
  if (!variant.src.length) return undefined;
  const preferred = variant.src.find((entry) => entry.url.endsWith(".woff2"));
  return preferred ?? variant.src[0];
}

async function loadSource(url: string, context: FontLoadContext) {
  if (context.kind === "request") {
    const cacheKey = `request:${context.origin}:${url}`;
    let promise = requestFontCache.get(cacheKey);
    if (!promise) {
      promise = fetchFont(url, context.origin);
      requestFontCache.set(cacheKey, promise);
    }
    return promise;
  }

  const cacheKey = `build:${context.dir.href}:${url}`;
  let promise = buildFontCache.get(cacheKey);
  if (!promise) {
    promise = readFont(url, context.dir);
    buildFontCache.set(cacheKey, promise);
  }
  return promise;
}

async function fetchFont(path: string, origin: string) {
  const target = new URL(path, origin);
  const response = await fetch(target);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch font from ${target.toString()}: ${response.status} ${response.statusText}`,
    );
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function readFont(path: string, dir: URL) {
  if (isAbsoluteUrl(path)) {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch font from ${path}: ${response.status} ${response.statusText}`,
      );
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  const normalized = path.startsWith("/") ? path.slice(1) : path;
  const fileUrl = new URL(normalized, dir);
  return readFile(fileUrl);
}

function isAbsoluteUrl(path: string) {
  try {
    const url = new URL(path);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function mapVariantToSatoriFont(
  reference: FontReference,
  variant: AstroFontData,
  data: Buffer,
): Font {
  const font: Font = {
    name: reference.name,
    data,
  };

  const weight = normalizeWeight(variant.weight);
  if (weight) {
    font.weight = weight;
  }

  const style = normalizeStyle(variant.style);
  if (style) {
    font.style = style;
  }

  return font;
}

function normalizeWeight(weight?: string) {
  if (!weight) return undefined;
  if (weight === "bold") return 700;
  if (weight === "normal") return 400;
  if (weight.includes(" ")) return undefined;

  const parsed = Number(weight);
  if (!Number.isFinite(parsed)) return undefined;
  if (parsed < 100 || parsed > 900) return undefined;
  if (parsed % 100 !== 0) return undefined;
  return parsed as Font["weight"];
}

function normalizeStyle(style?: string) {
  if (!style) return undefined;
  const lower = style.toLowerCase();
  if (lower === "italic") return "italic";
  if (lower.startsWith("oblique")) return "italic";
  return undefined;
}
