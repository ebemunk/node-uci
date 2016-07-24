import Promise from 'bluebird'
import debug from 'debug'

const log = debug('uci:EngineChain')

const CHAINABLE = [
	'init',
	'isready',
	'ucinewgame',
	'quit',
	'position',
	'goInfinite',
	'go'
]

export default class EngineChain {
	constructor(engine) {
		log('chain init')
		this._engine = engine
		this._queue = []

		CHAINABLE.forEach(fn => {
			this[fn] = this.chain(fn)
		})
	}

	chain(fn) {
		return () => {
			let p = ::this._engine[fn]
			this._queue.push(p)
			return this
		}
	}

	commit() {
		return Promise.mapSeries(this._queue, fn => fn())
		.then(() => this._engine)
	}
}
