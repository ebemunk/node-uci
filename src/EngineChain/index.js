import Promise from 'bluebird'
import debug from 'debug'
import last from 'lodash/last'

import Engine from '../Engine'

const log = debug('uci:EngineChain')

const CHAINABLE = [
	'init',
	'setoption',
	'isready',
	'ucinewgame',
	'quit',
	'position',
	'go',
]

/**
 * EngineChain sets up an api to enable chaining when dealing with {@link Engine}s.
 * ##### chainable methods
 * - init
 * - setoption
 * - isready
 * - ucinewgame
 * - quit
 * - position
 * - go
 *
 * `go` is a special case that ends the chain by calling {@link #EngineChain#exec},
 * and returns the search result.
 * @param {Engine} engine - an {@link Engine} instance
 * @example
 * const engine = new Engine(enginePath)
 * const chain = new EngineChain(engine)
 * // OR: const chain = engine.chain()
 * .init()
 * .setoption('MultiPV', 3)
 * .position('r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3')
 * .go({depth: 15})
 * .then(result => {
 *   console.log('result', result)
 * })
 */
export default class EngineChain {
	/**
	 * Creates a new EngineChain
	 * @param {Engine} engine - an instance of {@link Engine}
	 * @return {EngineChain} - a new instance
	 */
	constructor(engine) {
		if( ! engine || ! (engine instanceof Engine) )
			throw new Error('EngineChain requires a valid Engine.')
		//init
		log('chain init')
		this._engine = engine
		this._queue = []
		//construct chain functions
		CHAINABLE.forEach(funcName => {
			this[funcName] = this.chain(funcName)
		})
	}

	/**
	 * Create a new function that puts its invocation to an internal queue.
	 * This should not be called unless you're feeling very adventurous.
	 * @param {string} funcName - the function to execute on an Engine instance
	 * @return {function} - a function that will populate the queue
	 * @private
	 */
	//returns a function which puts the Engine call and args in the queue
	chain(funcName) {
		const self = this
		return function () {
			this._queue.push([::self._engine[funcName], [...arguments]])
			if( funcName === 'go' ) {
				return this.exec()
			} else {
				return this
			}
		}
	}

	/**
	 * Execute each chained item serially. This ends the chain, and returns the
	 * last return value from the {@link Engine}.
	 * @return {any} - last return value from the queued {@link Engine} method
	 */
	async exec() {
		const results = await Promise.mapSeries(this._queue, ([fn, params]) => {
			return fn(...params)
		})
		this._queue = []
		return last(results)
	}
}
