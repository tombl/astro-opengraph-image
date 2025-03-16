import { defineToolbarApp } from 'astro/toolbar'

const SESSION_KEY_OPEN = 'astro-og-image:open'

export default defineToolbarApp({
	init(canvas, app) {
		app.onToggled(event => {
			if (event.state) {
				sessionStorage.setItem(SESSION_KEY_OPEN, 'true')
			} else {
				sessionStorage.removeItem(SESSION_KEY_OPEN)
			}

			if (event.state === false) return

			canvas.textContent = ''
			const win = canvas.appendChild(document.createElement('astro-dev-toolbar-window'))

			const meta = document.querySelector('meta[property="og:image"]')
			if (meta === null) {
				win.append('This page does not have an OpenGraph image')
				return
			}

			const img = document.createElement('img')
			img.style.backgroundColor = 'white'
			img.src = meta.getAttribute('content') ?? ''
			win.appendChild(img)
		})

		app.toggleNotification({
			state: document.querySelector('meta[property="og:image"]') !== null,
			level: 'info',
		})

		if (sessionStorage.getItem(SESSION_KEY_OPEN) !== null) {
			app.toggleState({ state: true })
		}
	},
})
