import {EOL} from 'os'

import Promise from 'bluebird'
import _ from 'lodash'
import sinon from 'sinon'

import expect from './Chai'
import Engine from '../src'
import {childProcessMock} from './util'

const enginePath = '/home/derpatron/Downloads/stockfish-7-linux/Linux/stockfish'

Promise.onPossiblyUnhandledRejection(_.noop)

describe('EngineAnalysis', () => {
	let cpMock

	function engineInit() {
		let p = new Engine('').init()
		cpMock.uciok()
		return p
	}

	beforeEach(() => {
		cpMock = childProcessMock()
	})

	afterEach(() => {
		cpMock.destroy()
	})

	describe('private', () => {
		describe('getLines', () => {
			let getLines = Engine.__get__('getLines')

			it('should throw if no param given', () => {
				expect(() => getLines()).to.throw
			})

			it('should always return an array', () => {
				let r = getLines('')
				expect(r).to.be.an.array
			})

			it('should split by newline', () => {
				let r = getLines('1\n2\n3')
				expect(r.length).to.equal(3)
			})

			it('should not contain empty lines', () => {
				let r = getLines('1\n\n\n2\n\n3\n')
				expect(r.length).to.equal(3)
			})
		})

		describe('parseId', () => {
			let parseId = Engine.__get__('parseId')

			it('should throw if invalid cmd', () => {
				expect(() => parseId('id lololo kekeke')).to.throw
			})

			it('should parse "name"', () => {
				let r = parseId('id name Stockfish 7 64')
				expect(r).to.be.deep.equal({
					key: 'name',
					value: 'Stockfish 7 64'
				})
			})

			it('should parse "author"', () => {
				let r = parseId('id author T. Romstad, M. Costalba, J. Kiiski, G. Linscott')
				expect(r).to.be.deep.equal({
					key: 'author',
					value: 'T. Romstad, M. Costalba, J. Kiiski, G. Linscott'
				})
			})
		})

		describe('parseOption', () => {
			let parseOption = Engine.__get__('parseOption')

			it('should throw if invalid cmd', () => {
				expect(() => parseOption('option fafa lolol')).to.throw
			})

			it('should parse "check"', () => {
				let r = parseOption('option name Nullmove type check default true')
				expect(r).to.have.properties({
					key: 'Nullmove',
					value: {
						type: 'check',
						default: true
					}
				})
			})

			it('should parse "spin"', () => {
				let r = parseOption('option name Selectivity type spin default 2 min 0 max 4')
				expect(r).to.have.properties({
					key: 'Selectivity',
					value: {
						type: 'spin',
						default: 2,
						min: 0,
						max: 4
					}
				})
			})

			it('should parse "combo"', () => {
				let r = parseOption('option name Style type combo default Normal var Solid var Normal var Risky')
				expect(r).to.have.properties({
					key: 'Style',
					value: {
						type: 'combo',
						default: 'Normal',
						options: ['Solid', 'Normal', 'Risky']
					}
				})
			})

			it('should parse "string"', () => {
				let r = parseOption('option name NalimovPath type string default c:\\')
				expect(r).to.have.properties({
					key: 'NalimovPath',
					value: {
						type: 'string',
						default: 'c:\\'
					}
				})
			})

			it('should parse "button"', () => {
				let r = parseOption('option name Clear Hash type button')
				expect(r).to.have.properties({
					key: 'Clear Hash',
					value: {
						type: 'button'
					}
				})
			})
		})

		describe('goCommand', () => {
			let goCommand = Engine.__get__('goCommand')

			it('should ...', () => {

			})
		})
	})

	describe('constructor', () => {
		it('should throw if path is empty', () => {
			expect(() => new Engine()).to.throw
		})
	})

	describe('init', () => {
		it('should return a promise', () => {
			let p = new Engine('').init()
			expect(p).to.be.an.instanceof(Promise)
		})

		it('should reject if "error" is sent', () => {
			let p = new Engine('').init()
			cpMock.emit('error', 'test')
			return expect(p).to.be.rejectedWith('test')
		})

		it('should reject if "close" is sent', () => {
			let p = new Engine('').init()
			cpMock.emit('close', 'test')
			return expect(p).to.be.rejectedWith('test')
		})

		it('should send "uci" command to proc stdout', () => {
			let p = new Engine('').init()
			expect(cpMock.stdin.write).to.have.been.calledWithExactly(`uci${EOL}`)
		})

		it('should resolve when "uciok" is sent', () => {
			let p = new Engine('').init()
			cpMock.uciok()
			return expect(p).to.be.fulfilled
		})

		it('should resolve to itself (Engine)', async () => {
				let e = new Engine('')
				let p = e.init()
				cpMock.uciok()
				let ref = await p
				expect(ref).to.be.deep.equal(e)
		})

		it('should parse "id" and "options" correctly', async () => {
			let data = [
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
			let e = new Engine('')
			let p = e.init()
			cpMock.stdout.emit('data', data.join(EOL))
			await p
			expect(e.id).to.have.keys('name', 'author')
			expect(e.options.size).to.equal(5)
		})

		it('should remove listener after resolving', async () => {
			let p = new Engine('').init()
			cpMock.uciok()
			await p
			expect(cpMock.stdout.listenerCount('on')).to.be.equal(0)
		})
	})

	describe('quit', () => {
		it('should return a promise', () => {
			let p = new Engine('').quit()
			expect(p).to.be.an.instanceof(Promise)
		})

		it('should reject if process not running', () => {
			let p = new Engine('').quit()
			return expect(p).to.be.rejected
		})

		it('should send "quit" command to proc stdout', async () => {
			let p = await engineInit()
			p.quit()
			expect(cpMock.stdin.write).to.have.been.calledWithExactly(`quit${EOL}`)
		})

		it('should clean up after process exits', async () => {
			let p = await engineInit()
			p.quit()
			cpMock.emit('close')
			p = await p
			expect(p.proc).to.be.undefined
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
			let p = new Engine('').isready()
			expect(p).to.be.an.instanceof(Promise)
		})

		it('should reject if process not running', () => {
			let p = new Engine('').isready()
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
			p = p.isready()
			expect(cpMock.stdin.write).to.have.been.calledWithExactly(`isready${EOL}`)
		})

		it('should resolve itself (Engine) if "readyok"', async () => {
			let p = await engineInit()
			p = p.isready()
			cpMock.stdout.emit('data', `readyok${EOL}`)
			p = await p
			expect(p).to.be.an.instanceof(Engine)
		})
	})

	describe('sendCmd', () => {
		it('should return a promise', () => {
			let p = new Engine('').sendCmd('test')
			expect(p).to.be.an.instanceof(Promise)
		})

		it('should reject if process not running', () => {
			let p = new Engine('').sendCmd('test')
			return expect(p).to.be.rejected
		})

		it('should send cmd to proc stdout', async () => {
			let p = await engineInit()
			p.sendCmd('test 123')
			expect(cpMock.stdin.write).to.have.been.calledWithExactly(`test 123${EOL}`)
		})

		it('should resolve this.isready', async () => {
			let p = await engineInit()
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
				expect(engine.sendCmd).to.have.been.calledWithExactly(`setoption name optName`)
			})

			it('should call this.sendCmd("setoption name <id> value <x>")', () => {
				engine.setoption('optName', '39')
				expect(engine.sendCmd).to.have.been.calledWithExactly(`setoption name optName value 39`)
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
				expect(engine.sendCmd).to.have.been.calledWithExactly(`position startpos`)
			})

			it('should call this.sendCmd("position startpos moves <move1> ... <moven>")', () => {
				engine.position('startpos', [
					'e2e4', 'd7d5', 'e4d5'
				])
				expect(engine.sendCmd).to.have.been.calledWithExactly('position startpos moves e2e4 d7d5 e4d5')
			})

			it('should call this.sendCmd("position fen")', () => {
				engine.position('r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3')
				expect(engine.sendCmd).to.have.been.calledWithExactly(`position fen r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3`)
			})
		})

		describe('go', (options) => {
			it('go test', () => {
				let opts = {
					depth: 3,
					wtime: 1231,
					btime: 12312
				}
				engine.go(opts)
			})
		})
	})

	// it.only('should load it bro', async () => {
	xit('should load it bro', async (done) => {
		// let game = new Chess()
		// game.load_pgn(pgn)

		let engine = new Engine(enginePath)

		let rez = await engine.init()
		await engine.isready()

		// console.log('enji7n', engine)
		// console.log('re', engine.id, engine.options)

		await engine.quit()

		console.log('rez', rez.options);


		//ideal
		// let engine = new Engine(enginePath)
		//
		let sad = await engine
		.chain()
		.init()
		.isready()
		.ucinewgame()
		.quit()
		.commit()
		console.log('REZZZ',sad.options);
	})
})
