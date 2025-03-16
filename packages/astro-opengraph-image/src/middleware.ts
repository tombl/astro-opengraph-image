import { defineMiddleware } from 'astro:middleware'
import { parse } from 'devalue'
import type { Options } from './integration'

// @ts-expect-error
import options_ from 'og-image:config'
import { convert } from './convert'

const options = parse(options_) as Options

export const onRequest = defineMiddleware(async (context, next) => {
	if (context.url.pathname !== '/_og') return next()
	const png = await convert(context.url, options)
	return new Response(png, {
		headers: {
			'Content-Type': 'image/png',
		},
	})
})
