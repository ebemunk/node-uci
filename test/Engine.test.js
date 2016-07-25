import {EOL} from 'os'

import Promise from 'bluebird'
import _ from 'lodash'
import sinon from 'sinon'

import expect from './Chai'
import Engine from '../src'
import {childProcessMock} from './util'

Promise.onPossiblyUnhandledRejection(_.noop)

describe('EngineAnalysis', () => {
	let cpMock

	function engineInit() {
		const p = new Engine('').init()
		cpMock.uciok()
		return p
	}

	beforeEach(() => {
		cpMock = childProcessMock()
	})

	afterEach(() => {
		cpMock.destroy()
	})

	describe('constructor', () => {
		it('should throw if path is empty', () => {
			expect(() => new Engine()).to.throw
		})
	})

	describe.only('init', () => {
		it('should return a promise', () => {
			const p = new Engine('').init()
			expect(p).to.be.an.instanceof(Promise)
		})

		it('should reject if "error" is sent', () => {
			const p = new Engine('').init()
			cpMock.emit('error', 'test')
			return expect(p).to.be.rejectedWith('test')
		})

		it('should reject if "close" is sent', () => {
			const p = new Engine('').init()
			cpMock.emit('close', 'test')
			return expect(p).to.be.rejectedWith('test')
		})

		it('should reject if already initialized', async () => {
			let p = new Engine('').init()
			cpMock.uciok()
			p = await p
			return expect(p.init()).to.be.rejected
		})

		it('should send "uci" command to proc stdout', () => {
			new Engine('').init()
			expect(cpMock.stdin.write).to.have.been.calledWithExactly(`uci${EOL}`)
		})

		it('should resolve when "uciok" is sent', () => {
			const p = new Engine('').init()
			cpMock.uciok()
			return expect(p).to.be.fulfilled
		})

		it('should resolve to itself (Engine)', async () => {
			const e = new Engine('')
			const p = e.init()
			cpMock.uciok()
			const ref = await p
			expect(ref).to.be.deep.equal(e)
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
			expect(e.id).to.have.keys('name', 'author')
			expect(Object.keys(e.options)).to.have.length(5)
		})

		it('should remove listener after resolving', async () => {
			const p = new Engine('').init()
			expect(cpMock.stdout.listenerCount('data')).to.equal(2)
			cpMock.uciok()
			await p
			expect(cpMock.stdout.listenerCount('data')).to.equal(1)
		})
	})

	describe('quit', () => {
		it('should return a promise', () => {
			const p = new Engine('').quit()
			expect(p).to.be.an.instanceof(Promise)
		})

		it('should reject if process not running', () => {
			const p = new Engine('').quit()
			return expect(p).to.be.rejected
		})

		it('should send "quit" command to proc stdout', async () => {
			const p = await engineInit()
			p.quit()
			expect(cpMock.stdin.write).to.have.been.calledWithExactly(`quit${EOL}`)
		})

		it('should clean up after process exits', async () => {
			let p = await engineInit()
			p = p.quit()
			cpMock.emit('close')
			await p
			console.log(p);
			expect(p.proc).to.be.undefined
			expect(cpMock.stdout.listenerCount('data')).to.equal(0)
		})

		it('should resolve (code, signal)', async () => {
			let p = await engineInit()
			p = p.quit()
			cpMock.emit('close', 0, 'sig')
			await p
			expect(p).to.eventually.deep.equal([0, 'sig'])
		})
	})

	describe('isready', () => {
		it('should return a promise', () => {
			const p = new Engine('').isready()
			expect(p).to.be.an.instanceof(Promise)
		})

		it('should reject if process not running', () => {
			const p = new Engine('').isready()
			return expect(p).to.be.rejected
		})

		it('should reject if unexpected line', async () => {
			let p = await engineInit()
			p = p.isready()
			cpMock.stdout.emit('data', 'lololool')
			expect(p).to.be.rejected
		})

		it('should send "isready" command to proc stdout', async () => {
			let p = await engineInit()
			p.isready()
			expect(cpMock.stdin.write).to.have.been.calledWithExactly(`isready${EOL}`)
		})

		it('should resolve itself (Engine) if "readyok"', async () => {
			let p = await engineInit()
			p = p.isready()
			cpMock.readyok()
			p = await p
			expect(p).to.be.an.instanceof(Engine)
		})
	})

	describe('sendCmd', () => {
		it('should return a promise', () => {
			const p = new Engine('').sendCmd('test')
			expect(p).to.be.an.instanceof(Promise)
		})

		it('should reject if process not running', () => {
			const p = new Engine('').sendCmd('test')
			return expect(p).to.be.rejected
		})

		it('should send cmd to proc stdout', async () => {
			const p = await engineInit()
			p.sendCmd('test 123')
			expect(cpMock.stdin.write).to.have.been.calledWithExactly(`test 123${EOL}`)
		})

		it('should resolve this.isready', async () => {
			const p = await engineInit()
			sinon.spy(p, 'isready')
			p.sendCmd('test 123')
			expect(p.isready).to.have.been.calledOnce
		})
	})

	//to group some for before/afterEach
	describe('', () => {
		let engine

		beforeEach(async () => {
			engine = await engineInit()
			sinon.spy(engine, 'sendCmd')
		})

		afterEach(() => {
			engine.sendCmd.restore()
		})

		describe('setoption', () => {
			it('should call this.sendCmd("setoption name <id>")', () => {
				engine.setoption('optName')
				expect(engine.sendCmd).to.have.been.calledWithExactly('setoption name optName')
			})

			it('should call this.sendCmd("setoption name <id> value <x>")', () => {
				engine.setoption('optName', '39')
				expect(engine.sendCmd).to.have.been.calledWithExactly('setoption name optName value 39')
			})

			it('should update this.options with new option on success', async () => {
				let p = engine.setoption('opt', -24)
				cpMock.readyok()
				p = await p
				expect(engine.options.get('opt')).to.equal(-24)
			})
		})

		describe('ucinewgame', () => {
			it('should call this.sendCmd', () => {
				engine.ucinewgame()
				expect(engine.sendCmd).to.have.been.calledWithExactly('ucinewgame')
			})
		})

		describe('ponderhit', () => {
			it('should call this.sendCmd', () => {
				engine.ponderhit()
				expect(engine.sendCmd).to.have.been.calledWithExactly('ponderhit')
			})
		})

		describe('position', () => {
			it('should call this.sendCmd("position startpos")', () => {
				engine.position('startpos')
				expect(engine.sendCmd).to.have.been.calledWithExactly('position startpos')
			})

			it('should call this.sendCmd("position startpos moves <move1> ... <moven>")', () => {
				engine.position('startpos', [
					'e2e4', 'd7d5', 'e4d5'
				])
				expect(engine.sendCmd).to.have.been.calledWithExactly('position startpos moves e2e4 d7d5 e4d5')
			})

			it('should call this.sendCmd("position fen")', () => {
				engine.position('r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3')
				expect(engine.sendCmd).to.have.been.calledWithExactly('position fen r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3')
			})
		})
	})

	describe('go', () => {
		it('should return a promise', async () => {
			const engine = await engineInit()
			const p = engine.go({depth: 20})
			expect(p).to.be.an.instanceof(Promise)
		})

		it('should reject if infinite flag is set', () => {
			const p = new Engine('').go({infinite: true})
			return expect(p).to.be.rejected
		})

		it('should reject if process not running', () => {
			const p = new Engine('').go({depth: 3})
			return expect(p).to.be.rejected
		})

		it('should ignore unparseable info lines', async () => {
			const engine = await engineInit()
			let p = engine.go({depth: 2})
			cpMock.stdout.emit('data', `info derpyherp 76 lolcakes 28${EOL}bestmove e2e4`)
			p = await p
			expect(p).to.contain.property('info')
			expect(p.info).to.have.length(0)
		})

		it('should resolve bestmove object after "bestmove"', async () => {
			const engine = await engineInit()
			let p = engine.go({depth: 5})
			cpMock.stdout.emit('data', `info currmove e2e4${EOL}info tbhits 7 score mate 3${EOL}bestmove e2e4${EOL}`)
			p = await p
			expect(p).to.deep.equal({
				bestmove: 'e2e4',
				info: [
					{
						currmove: 'e2e4'
					},
					{
						tbhits: 7,
						score: {
							unit: 'mate',
							value: 3
						}
					}
				]
			})
			expect(p).to.not.have.property('ponder')
		})

		it('should include ponder result if available', async () => {
			const engine = await engineInit()
			let p = engine.go({depth: 5})
			cpMock.stdout.emit('data', `bestmove e2e4 ponder e7e5${EOL}`)
			p = await p
			expect(p).to.deep.equal({
				bestmove: 'e2e4',
				ponder: 'e7e5',
				info: []
			})
		})

		it('should remove listener after resolving', async () => {
			const engine = await engineInit()
			let p = engine.go({depth: 3})
			cpMock.stdout.emit('data', `bestmove e2e4 ponder e7e5${EOL}`)
			await p
			expect(cpMock.stdout.listenerCount('on')).to.be.equal(0)
		})
	})
})

/* eslint-disable */
const enginePath = '/home/derpatron/Downloads/stockfish-7-linux/Linux/stockfish'
// const enginePath = '/Users/bugrafirat/Downloads/stockfish-7-mac/Mac/stockfish-7-64'
describe.skip('yea', () => {
	it('should load it bro', async () => {
		// const game = new Chess()
		// game.load_pgn(pgn)

		// const engine = new Engine(enginePath)
		// const rez = await engine.init()
		// await engine.setoption('MultiPV', '4')
		// await engine.isready()
		//
		// console.log('engine ready', engine.id, engine.options)
		//
		// const go = await engine.go({depth: 15})
		// console.log('go', go);
		//
		// await engine.quit()

		const engine = new Engine(enginePath)
		await engine.init()
		await engine.isready()
		const ee = engine.goInfinite()
		ee.on('data', a => {
			// console.log(a);
		})
		setTimeout(async () => {
			console.log('stoppng');
			await engine.stop()
			await engine.quit()
		}, 3000)

		//ideal
		// const engine = new Engine(enginePath)
		//
		// const sad = await engine
		// .chain()
		// .init()
		// .isready()
		// .ucinewgame()
		// .quit()
		// .commit()
		// console.log('REZZZ',sad.options);
	})
})
