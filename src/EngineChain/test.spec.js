import {Engine, EngineChain} from '../'

describe('EngineChain', () => {
	let chain

	beforeEach(() => {
		chain = new EngineChain(new Engine(''))
	})

	afterEach(() => {
		chain = null
	})

	describe('constructor', () => {
		it('should require a valid Engine', () => {
			const fn = () => {
				new EngineChain()
			}
			expect(fn).toThrow()
		})

		it('should create functions for chainable Engine functions', () => {
			expect(typeof chain.init).toBe('function')
			expect(typeof chain.setoption).toBe('function')
			expect(typeof chain.isready).toBe('function')
			expect(typeof chain.ucinewgame).toBe('function')
			expect(typeof chain.quit).toBe('function')
			expect(typeof chain.position).toBe('function')
			expect(typeof chain.go).toBe('function')
		})
	})

	describe('chain', () => {
		it('should return a function', () => {
			expect(typeof chain.chain('derp')).toBe('function')
		})

		it('chained function should return the chain if funcName !== go', () => {
			const c = chain.init()
			expect(c).toBe(chain)
		})

		it('chained function should call exec() if funcName === go', () => {
			chain.exec = jest.fn()
			chain.go()
			expect(chain.exec).toHaveBeenCalledTimes(1)
		})
	})

	// does not work because of promise timing issues..
	// describe('exec', () => {
	// 	it('should drain the queue', async () => {
	// 		const p = chain.init().exec()
	// 		expect(chain._queue.length).toBe(1)
	// 		cpMock.uciok()
	// 		await p
	// 		expect(chain._queue.length).toBe(0)
	// 	})
	// })
})
