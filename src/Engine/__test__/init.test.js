import {EOL} from 'os'

import Engine from '../'
import {syncify} from '../../__test__/util'

jest.mock('child_process')
import {cpMock} from 'child_process'

describe('init', () => {
	fit('should reject if "error" is sent', async () => {
		const fn = await syncify(async () => {
			const p = new Engine('').init()
			cpMock.emit('error', new Error('test'))
			await p
		})

		expect(fn).toThrowError('test')
	})

	it('should reject if "close" is sent', async () => {
		const fn = await syncify(async () => {
			const p = new Engine('').init()
			cpMock.emit('close', new Error('test'))
			await p
		})

		expect(fn).toThrowError('test')
	})

	it('should reject if already initialized', async () => {
		const fn = await syncify(async () => {
			let p = new Engine('').init()
			cpMock.uciok()
			p = await p
			await p.init()
		})

		expect(fn).toThrow()
	})

	it('should send "uci" command to proc.stdin', async () => {
		const p = new Engine('').init()
		cpMock.uciok()
		await p

		expect(cpMock.stdin.write).toHaveBeenCalledWith(`uci${EOL}`)
	})

	it('should resolve when "uciok" is sent', async () => {
		let p = new Engine('').init()
		cpMock.uciok()
		p = await p

		expect(p).toBeInstanceOf(Engine)
	})

	it('should parse "id" and "options" correctly', async () => {
		const data = [
			//ignore
			'bad command: ignore',
			//id
			'id name Stockfish 7 64',
			'id author T. Romstad, M. Costalba, J. Kiiski, G. Linscott',
			//ignore
			'',
			'id lolol',
			'option namlolo',
			'uciokzeo',
			'option name lolz type spin default two min O maks 3',
			//options
			'option name Nullmove type check default true',
			'option name Selectivity type spin default 2 min 0 max 4',
			'option name Style type combo default Normal var Solid var Normal var Risky',
			'option name NalimovPath type string default c:\\',
			'option name Clear Hash type button',
			//resolve
			'uciok'
		]
		const e = new Engine('')
		const p = e.init()
		cpMock.stdout.emit('data', data.join(EOL))
		cpMock.uciok()
		await p

		expect(Object.keys(e.id)).toContain('name', 'author')
		expect(e.options).toBeInstanceOf(Map)
		expect(e.options.size).toBe(5)
	})

	it('should remove listener after resolving', async () => {
		const p = new Engine('').init()
		expect(cpMock.stdout.listenerCount('data')).toBe(2)
		cpMock.uciok()
		await p
		expect(cpMock.stdout.listenerCount('data')).toBe(1)
	})
})
