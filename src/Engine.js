import {spawn} from 'child_process'
import path from 'path'
import {EOL} from 'os'
import {EventEmitter} from 'events'

import Promise from 'bluebird'
import debug from 'debug'

import EngineChain from './EngineChain'
import {
	goCommand,
	initReducer,
	goReducer,
  parseInfo,
  parseBestmove,
} from './parseUtil'
import {REGEX} from './const'

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

	async getBufferUntil(condition) {
		const lines = []
		let listener
		const p = new Promise((resolve, reject) => {
			//listener gets new lines until condition is true
			listener = buffer => {
				buffer
				.split(/\r?\n/g)
				.filter(line => !!line.length)
				.forEach(line => {
					lines.push(line)
					if( condition(line) ) return resolve()
				})
			}
			this.proc.stdout.on('data', listener)
			//reject if something goes wrong during buffering
			this.proc.once('error', reject)
			this.proc.once('close', reject)
		})
		await p
		//cleanup
		this.proc.stdout.removeListener('data', listener)
		return lines
	}

	write(command) {
		this.proc.stdin.write(`${command}${EOL}`)
		engineLog('to engine:', command, EOL)
	}

	chain() {
		return new EngineChain(this)
	}

	async init() {
		if( this.proc )
			throw new Error('cannot call "init()": already initialized')
		//set up spawn
		this.proc = spawn(this.filePath)
		this.proc.stdout.setEncoding('utf8')
		//log buffer from engine
		this.proc.stdout.on('data', fromEngineLog)
		//send command to engine
		this.write('uci')
		//parse lines
		const lines = await this.getBufferUntil(line => line === 'uciok')
		const {id, options} = lines.reduce(initReducer, {
			id: {},
			options: {}
		})
		//set id and options
		if( id ) this.id = id
		if( options ) {
			//put options to Map
			Object.keys(options).forEach(key => {
				this.options.set(key, options[key])
			})
		}
		return this
	}

	async quit() {
		if( ! this.proc )
			throw new Error('cannot call "quit()": engine process not running')
		//send quit cmd and resolve when closed
		await new Promise(resolve => {
			this.proc.on('close', resolve)
			this.write('quit')
		})
		//cleanup
		this.proc.stdout.removeListener('data', fromEngineLog)
		this.proc.removeAllListeners()
		delete this.proc
		return this
	}

	async isready() {
		if( ! this.proc )
			throw new Error('cannot call "isready()": engine process not running')
		//send isready and wait for the response
		this.write('isready')
		await this.getBufferUntil(line => line === 'readyok')
		return this
	}

	async sendCmd(cmd) {
		if( ! this.proc )
			throw new Error(`cannot call "${cmd}()": engine process not running`)
		//send cmd to engine
		log('sendCmd', cmd)
		this.write(`${cmd}`)
		//return after ready - avoids pitfalls for commands
		//that dont return a response
		return this.isready()
	}

	async setoption(name, value) {
		//construct command
		let cmd = `name ${name}`
		if( value ) cmd += ` value ${value}`
		//send and wait for response
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
		//can be startpos or fen string
		let cmd
		if( fen === 'startpos' ) {
			cmd = 'startpos'
		} else {
			cmd = `fen ${fen}`
		}
		//add moves if provided
		if( moves && moves.length ) {
			const movesStr = moves.join(' ')
			cmd += ` moves ${movesStr}`
		}
		//send to engine
		return this.sendCmd(`position ${cmd}`)
	}

	async go(options) {
		if( ! this.proc )
			throw new Error('cannot call "go()": engine process not running')
		if( options.infinite )
			throw new Error('go() does not support infinite search, use goInfinite()')
		//construct command and send
		const command = goCommand(options)
		this.write(command)
		//parse lines
		const lines = await this.getBufferUntil(line => REGEX.bestmove.test(line))
		const result = lines.reduce(goReducer, {
			bestmove: null,
			info: []
		})
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
			buffer
			.split(/\r?\n/g)
			.filter(line => !!line.length)
			.forEach(line => {
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
    //send the stop message & end goInfinite() listener
		this.write('stop')
		this.emitter.emit('stop')
		//same idea as go(), only we expect just bestmove line here
		const lines = await this.getBufferUntil(line => REGEX.bestmove.test(line))
		const result = lines.reduce(goReducer, {
			bestmove: null,
			info: []
		})
		return result
	}
}
