import {EOL} from 'os'

import Engine from '../'
import {syncify, engineInit} from '../../__test__/util'

jest.mock('child_process')
import {cpMock} from 'child_process'

describe('stop', () => {
	it('should reject if emitter is not available', async () => {
		const fn = await syncify(async () => {
			await new Engine('').stop()
		})

		expect(fn).toThrow()
	})

	it('should return the bestmove', async () => {
		const engine = await engineInit(cpMock)
		engine.goInfinite()
		const p = engine.stop()
		cpMock.stdout.emit('data', `info score cp 3${EOL}bestmove d7d6`)
		const result = await p
		expect(result).toEqual({
			bestmove: 'd7d6',
			info: [{
				score: {
					unit: 'cp',
					value: 3
				}
			}]
		})
	})
})
