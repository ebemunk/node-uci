import {EOL} from 'os'

import Engine from '../'
import {syncify, engineInit} from '../../__test__/util'

jest.mock('child_process')
import {cpMock} from 'child_process'

describe('quit', () => {
	it('should reject if process not running', async () => {
		const fn = await syncify(async () => {
			const p = new Engine('').quit()
			await p
		})

		expect(fn).toThrow()
	})

	it('should send "quit" command to proc stdout', async () => {
		const p = await engineInit(cpMock)
		p.quit()
		expect(cpMock.stdin.write).toHaveBeenCalledWith(`quit${EOL}`)
	})

	it('should clean up after process exits', async () => {
		let p = await engineInit(cpMock)
		p = p.quit()
		cpMock.emit('close')
		await p

		expect(p.proc).toBeUndefined()
		expect(cpMock.stdout.listenerCount('data')).toBe(0)
	})
})
