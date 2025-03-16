import { renderAsync } from '@resvg/resvg-js'
import lz from 'lz-string'
import satori from 'satori'
import { html } from 'satori-html'
import type { Options } from './integration'

export async function convert(url: URL, options: Options) {
	const data = url.searchParams.get('html')
	if (data === null) throw new Error('Missing html search param')

	const markup = lz.decompressFromEncodedURIComponent(data)

	const svg = await satori(html(markup), {
		width: options.width / options.scale,
		height: options.height / options.scale,
		fonts: options.fonts,
	})

	const image = await renderAsync(svg, {
		fitTo: { mode: 'zoom', value: options.scale },
		font: { loadSystemFonts: false },
	})

	return image.asPng()
}
