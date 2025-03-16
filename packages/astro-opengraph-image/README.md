# astro-opengraph-image

> (hopefully) the easiest way to generate [OpenGraph](https://ogp.me/) images from your Astro site

define your OpenGraph image in directly html, inline in your Astro components.

complete with a helpful toolbar app to display your image in development.

## getting started

```sh
# first, run this command to install the integration:
npx astro add astro-opengraph-image

# next, you will want one or more fonts to use in your images,
# I like the fonts available at https://www.npmjs.com/org/fontsource, e.g.:
npm install @fontsource/inter
```

```javascript
// then, update your astro.config.{mjs|ts} file to configure the integration:
import { defineConfig } from "astro/config";
import ogImage from "astro-opengraph-image";
import { readFile } from "node:fs/promises";

export default defineConfig({
  integrations: [
    ogImage({
      // what size do you want your images to be?
      // 1200x630 is a good default across platforms,
      // and 3x scale is a convenient choice.
      width: 1200,
      height: 630,
      scale: 3,

      // the fonts you picked before. you will have to include the particular
      // weights and variants you want to use.
      fonts: [
        {
          name: "Inter",
          data: await readFile(
            "node_modules/@fontsource/inter/files/inter-latin-400-normal.woff",
          ),
          style: "normal",
          weight: 400,
        },
        {
          name: "Inter",
          data: await readFile(
            "node_modules/@fontsource/inter/files/inter-latin-700-normal.woff",
          ),
          style: "normal",
          weight: 700,
        },
      ],
    }),
  ],
});
```

```astro
---
// lastly, inside your <head>, render the OgImage component to
// specify what you want in your image:

import { OgImage } from "astro-opengraph-image/components";
---

<!doctype html>
<html>
  <head>
    ...
    <OgImage>
      <h1>the page</h1>
      <p>this is the page</p>
      <style is:inline>
        h1 {
          color: red;
        }
      </style>
    </OgImage>
    ...
  </head>
  <body>...</body>
</html>
```

> [!NOTE]
>
> your image is only influenced by code inside the `<OgImage>` tag.
>
> this means all relevant styles must live inside the tag.
>
> additionally, your styles must always have the `is:inline` attribute to convince Astro
> not to modify or hoist your styles.

> [!NOTE]
>
> astro-opengraph-image is based on the Satori html layout engine, and thus inherits
> [the subset of CSS it supports.](https://github.com/vercel/satori/blob/main/README.md#css)
