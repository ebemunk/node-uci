import {EOL} from 'os'

import Engine from '../'
import {syncify, engineInit} from '../../__test__/util'

jest.mock('child_process')
import {cpMock} from 'child_process'

describe('sendCmd', () => {
	it('should reject if process not running', async () => {
		const fn = await syncify(async () => {
			const p = new Engine('').sendCmd('test')
			await p
		})

		expect(fn).toThrow()
	})

	it('should send cmd to proc stdout', async () => {
		const p = await engineInit(cpMock)
		p.sendCmd('test 123')
		expect(cpMock.stdin.write).toHaveBeenCalledWith(`test 123${EOL}`)
	})

	it('should resolve this.isready', async () => {
		const p = await engineInit(cpMock)
		p.isready = jest.fn()
		p.sendCmd('test 123')
		expect(p.isready).toHaveBeenCalledTimes(1)
	})
})

//to group some for before/afterEach
describe('setoption, ucinewgame, ponderhit, position', () => {
	let engine

	beforeEach(async () => {
		engine = await engineInit(cpMock)
		engine.sendCmd = jest.fn()
	})

	describe('setoption', () => {
		it('should call this.sendCmd("setoption name <id>")', () => {
			engine.setoption('optName')
			expect(engine.sendCmd).toHaveBeenCalledWith('setoption name optName')
		})

		it('should call this.sendCmd("setoption name <id> value <x>")', () => {
			engine.setoption('optName', '39')
			expect(engine.sendCmd).toHaveBeenCalledWith('setoption name optName value 39')
		})

		it('should update this.options with new option on success', async () => {
			let p = engine.setoption('opt', -24)
			cpMock.readyok()
			await p
			expect(engine.options.get('opt')).toBe(-24)
		})
	})

	describe('ucinewgame', () => {
		it('should call this.sendCmd', () => {
			engine.ucinewgame()
			expect(engine.sendCmd).toHaveBeenCalledWith('ucinewgame')
		})
	})

	describe('ponderhit', () => {
		it('should call this.sendCmd', () => {
			engine.ponderhit()
			expect(engine.sendCmd).toHaveBeenCalledWith('ponderhit')
		})
	})

	describe('position', () => {
		it('should call this.sendCmd("position startpos")', () => {
			engine.position('startpos')
			expect(engine.sendCmd).toHaveBeenCalledWith('position startpos')
		})

		it('should call this.sendCmd("position startpos moves <move1> ... <moven>")', () => {
			engine.position('startpos', [
				'e2e4', 'd7d5', 'e4d5'
			])
			expect(engine.sendCmd).toHaveBeenCalledWith('position startpos moves e2e4 d7d5 e4d5')
		})

		it('should call this.sendCmd("position fen")', () => {
			engine.position('r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3')
			expect(engine.sendCmd).toHaveBeenCalledWith('position fen r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3')
		})
	})
})
