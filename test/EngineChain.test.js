import sinon from 'sinon'
import Promise from 'bluebird'

Promise.setScheduler(fn => process.nextTick(fn))

import expect from './Chai'
import {Engine, EngineChain} from '../src'
import {childProcessMock} from './util'

describe('Engine', () => {
	let cpMock
	let chain

	beforeEach(() => {
		cpMock = childProcessMock()
		chain = new EngineChain(new Engine(''))
	})

	afterEach(() => {
		cpMock.destroy()
		chain = null
	})

	describe('constructor', () => {
		it('should require a valid Engine', () => {
			const fn = () => {
				new EngineChain()
			}
			expect(fn).to.throw()
		})

		it('should create functions for chainable Engine functions', () => {
			expect(chain.init).to.be.a('function')
			expect(chain.setoption).to.be.a('function')
			expect(chain.isready).to.be.a('function')
			expect(chain.ucinewgame).to.be.a('function')
			expect(chain.quit).to.be.a('function')
			expect(chain.position).to.be.a('function')
			expect(chain.go).to.be.a('function')
		})
	})

	describe('chain', () => {
		it('should return a function', () => {
			expect(chain.chain('derp')).to.be.a('function')
		})

		it('chained function should return the chain if funcName !== go', () => {
			const c = chain.init()
			expect(c).to.equal(chain)
		})

		it('chained function should call exec() if funcName === go', () => {
			const spy = sinon.spy(chain, 'exec')
			chain.go()
			expect(spy).to.have.been.called
		})
	})

	describe('exec', () => {
		it('should drain the queue', async () => {
			const p = chain.init().exec()
			expect(chain._queue).to.have.length(1)
			cpMock.uciok()
			await p
			expect(chain._queue).to.have.length(0)
		})
	})
})
