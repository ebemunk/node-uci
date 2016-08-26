import Promise from 'bluebird'
import debug from 'debug'
import {last} from 'lodash'

import Engine from './Engine'

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

	async exec() {
		const results = await Promise.map(this._queue, ([fn, params]) => {
			return fn(...params)
		}, {concurrency: 1})
		this._queue = []
		return last(results)
	}
}
