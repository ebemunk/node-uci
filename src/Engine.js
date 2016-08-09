import {spawn} from 'child_process'
import path from 'path'
import {EOL} from 'os'
import {EventEmitter} from 'events'

import Promise from 'bluebird'
import debug from 'debug'

import EngineChain from './EngineChain'
import {
	getLines,
	goCommand,
	parseInfo,
	parseBestmove,
} from './parseUtil'
import {
	createListener,
	initListener,
	isreadyListener,
	goListener,
} from './listeners'

const log = debug('uci:Engine')
const engineLog = debug('uci:Engine:log')

function fromEngineLog(lines) {
	engineLog('from engine:', lines, EOL)
}

export default class Engine {
	constructor(filePath) {
		this.filePath = path.normalize(filePath)
		this.id = {
			name: null,
			author: null
		}
		this.options = new Map()
	}

	write(command) {
		this.proc.stdin.write(command)
		engineLog('to engine:', command, EOL)
	}

	chain() {
		return new EngineChain(this)
	}

	async init() {
		if( this.proc )
			throw new Error('cannot call "init()": already initialized')

		let listener
		const p = new Promise((resolve, reject) => {
			this.proc = spawn(this.filePath)
			this.proc.stdout.setEncoding('utf8')
			this.proc
			.on('close', reject)
			.on('error', reject)
			this.proc.stdout.on('data', fromEngineLog)

			listener = createListener(initListener, resolve, reject)
			this.proc.stdout.on('data', listener)

			this.write(`uci${EOL}`)
		})

		const {id, options} = await p
		if( id ) this.id = id
		if( options ) {
			Object.keys(options).forEach(key => {
				this.options.set(key, options[key])
			})
		}

		this.proc.stdout.removeListener('data', listener)

		return this
	}

	async quit() {
		if( ! this.proc )
			throw new Error('cannot call "quit()": engine process not running')

		const p = new Promise(resolve => {
			this.proc.on('close', resolve)
			this.write(`quit${EOL}`)
		})

		await p
		this.proc.stdout.removeListener('data', fromEngineLog)
		this.proc.removeAllListeners()
		delete this.proc

		return this
	}

	async isready() {
		if( ! this.proc )
			throw new Error('cannot call "isready()": engine process not running')

		let listener
		await new Promise((resolve, reject) => {
			listener = createListener(isreadyListener, resolve, reject)
			this.proc.stdout.once('data', listener)
			this.write(`isready${EOL}`)
			resolve()
		})

		return this
	}

	async sendCmd(cmd) {
		if( ! this.proc )
			throw new Error(`cannot call "${cmd}()": engine process not running`)

		log('sendCmd', cmd)
		this.write(`${cmd}${EOL}`)

		return this.isready()
	}

	async setoption(name, value) {
		let cmd = `name ${name}`
		if( value ) cmd += ` value ${value}`

		await this.sendCmd(`setoption ${cmd}`)
		this.options.set(name, value)

		return this
	}

	async ucinewgame() {
		return this.sendCmd('ucinewgame')
	}

	async ponderhit() {
		return this.sendCmd('ponderhit')
	}

	async position(fen, moves) {
		let cmd
		if( fen === 'startpos' ) {
			cmd = 'startpos'
		} else {
			cmd = `fen ${fen}`
		}

		if( moves && moves.length ) {
			const movesStr = moves.join(' ')
			cmd += ` moves ${movesStr}`
		}

		return this.sendCmd(`position ${cmd}`)
	}

	async go(options = {}) {
		if( ! this.proc )
			throw new Error('cannot call "go()": engine process not running')
		if( options.infinite )
			throw new Error('go() does not support infinite search, use goInfinite()')

		let listener
		const result = await new Promise((resolve, reject) => {
			listener = createListener(goListener, resolve, reject)
			this.proc.stdout.on('data', listener)

			const command = goCommand(options)
			this.write(command)
		})

		//cleanup
		this.proc.stdout.removeListener('data', listener)
		return result
	}

	goInfinite(options = {}) {
		if( ! this.proc )
			throw new Error('cannot call "goInfinite()": engine process not running')
		if( options.depth )
			throw new Error('goInfinite() does not support depth search, use go()')

		//set up emitter
		this.emitter = new EventEmitter()
		const listener = buffer => {
			const lines = getLines(buffer)
			lines.forEach(line => {
				const info = parseInfo(line)
				if( info )
					return this.emitter.emit('data', info)
				const bestmove = parseBestmove(line)
				if( bestmove )
					return this.emitter.emit('data', bestmove)
			})
		}
		options.infinite = true
		const command = goCommand(options)
		this.proc.stdout.on('data', listener)
		this.emitter.on('stop', () => {
			this.proc.stdout.removeListener('data', listener)
		})
		this.write(command)
		return this.emitter
	}

	async stop() {
		if( ! this.emitter )
			throw new Error('cannot call "stop()": goInfinite() is not in progress')

		let listener
		const result = await new Promise((resolve, reject) => {
			listener = createListener(goListener, resolve, reject)
			this.proc.stdout.on('data', listener)

			this.write(`stop${EOL}`)
			this.emitter.emit('stop')
		})

		//cleanup
		this.proc.stdout.removeListener('data', listener)
		return result
	}
}
