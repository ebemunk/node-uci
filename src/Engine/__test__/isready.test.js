import {EOL} from 'os'

import Engine from '../'
import {syncify, engineInit} from '../../__test__/util'

jest.mock('child_process')
import {cpMock} from 'child_process'

describe('isready', () => {
	it('should reject if process not running', async () => {
		const fn = await syncify(async () => {
			const p = new Engine('').isready()
			await p
		})

		expect(fn).toThrow()
	})

	it('should send "isready" command to proc stdout', async () => {
		let p = await engineInit(cpMock)
		p.isready()
		expect(cpMock.stdin.write).toHaveBeenCalledWith(`isready${EOL}`)
	})

	it('should resolve itself (Engine) if "readyok"', async () => {
		let p = await engineInit(cpMock)
		p = p.isready()
		cpMock.readyok()
		p = await p
		expect(p).toBeInstanceOf(Engine)
	})
})
