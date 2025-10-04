import type { CssVariable } from "astro:assets";

export interface Options {
  background: string;
  width: number;
  height: number;
  scale: number;
}

export interface FontReference {
  name: string;
  cssVariable: CssVariable;
}

export interface RuntimeConfig {
  options: Options;
  fonts: FontReference[];
}
