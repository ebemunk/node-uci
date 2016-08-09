import Promise from 'bluebird'
import debug from 'debug'
import {last} from 'lodash'

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

export default class EngineChain {
	constructor(engine) {
		log('chain init')
		this._engine = engine
		this._queue = []

		CHAINABLE.forEach(fn => {
			this[fn] = this.chain(fn)
		})
	}

	//returns a function which puts the Engine call and args in the queue
	chain(fn) {
		const self = this
		return function () {
			this._queue.push([::self._engine[fn], ...arguments])
			return this
		}
	}

	async commit() {
		const results = await Promise.mapSeries(this._queue, ([fn, params]) => {
			return fn(params)
		})

		return last(results)
	}
}
