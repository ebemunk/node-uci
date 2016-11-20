import {Engine} from '../'

export async function syncify(fn) {
	try {
		const result = await fn()
		return () => result
	} catch (e) {
		return () => {throw e}
	}
}

export function engineInit(cpMock) {
	const p = new Engine('').init()
	cpMock.uciok()
	return p
}
