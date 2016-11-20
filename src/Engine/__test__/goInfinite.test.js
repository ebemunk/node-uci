import {EOL} from 'os'
import {EventEmitter} from 'events'

import Engine from '../'
import {syncify, engineInit} from '../../__test__/util'

jest.mock('child_process')
import {cpMock} from 'child_process'

describe('goInfinite', () => {
	it('should return an EventEmitter', async () => {
		const engine = await engineInit(cpMock)
		const emitter = engine.goInfinite()
		expect(emitter).toBeInstanceOf(EventEmitter)
		expect(engine.emitter).toBe(emitter)
	})

	it('should throw if process not running', async () => {
		const fn = await syncify(async () => {
			await new Engine('').goInfinite()
		})

		expect(fn).toThrow()
	})

	it('should ignore unparseable info lines', async () => {
		const engine = await engineInit(cpMock)
		const emitter = engine.goInfinite()
		emitter.emit = jest.fn()
		cpMock.stdout.emit('data', 'info derpyherp 76 lolcakes 28')
		expect(emitter.emit).not.toHaveBeenCalled()
	})

	it('should emit for every info line received', async () => {
		const engine = await engineInit(cpMock)
		const emitter = engine.goInfinite()
		emitter.emit = jest.fn()
		cpMock.stdout.emit('data', `info score cp 34${EOL}info currmove 3`)
		expect(emitter.emit).toHaveBeenCalledTimes(2)
	})

	it('should ignore unparseable bestmove lines', async () => {
		const engine = await engineInit(cpMock)
		const emitter = engine.goInfinite()
		emitter.emit = jest.fn()
		cpMock.stdout.emit('data', 'bestmove ')
		expect(emitter.emit).not.toHaveBeenCalled()
	})

	it('should emit for bestmove line', async () => {
		const engine = await engineInit(cpMock)
		const emitter = engine.goInfinite()
		emitter.emit = jest.fn()
		cpMock.stdout.emit('data', 'bestmove e5e4')
		expect(emitter.emit).toHaveBeenCalledTimes(1)
	})

	it('should remove listener on stdout on stop', async () => {
		const engine = await engineInit(cpMock)
		const emitter = engine.goInfinite()
		emitter.emit('stop')
		// 1 because of engineLog listener
		expect(engine.proc.stdout.listenerCount('data')).toBe(1)
	})
})
