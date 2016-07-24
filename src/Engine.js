import {spawn} from 'child_process'
import path from 'path'
import {EOL} from 'os'
import {EventEmitter} from 'events'

import _ from 'lodash'
import Promise from 'bluebird'
import debug from 'debug'

import {REGEX, INFO_NUMBER_TYPES} from './const'
import EngineChain from './EngineChain'
import {
	getLines,
	parseId,
	parseOption,
	goCommand,
	parseInfo,
} from './parseUtil'

const log = debug('uci:Engine')
const engineLog = debug('uci:Engine:log')

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

	init() {
		return new Promise((resolve, reject) => {
			this.proc = spawn(this.filePath)
			this.proc.stdout.setEncoding('utf8')
			this.proc
			.on('close', reject)
			.on('error', reject)

			this.proc.stdout.on('data', lines => {
				engineLog('from engine:', lines, EOL)
			})

			//the parser fn that will interpret engine output
			const parser = (buffer) => {
				const lines = getLines(buffer)
				lines.forEach(line => {
					const cmdType = _.get(REGEX.cmdType.exec(line), 1)
					if( ! cmdType ) {
						//couldn't parse, ignore
						log('init() ignoring:', line, EOL)
						return
					}

					switch( cmdType ) {
					case 'id':
						try {
							const id = parseId(line)
							this.id[id.key] = id.value
							log('id:', id, EOL)
						} catch (err) {
							log('id: ignoring: parse error', EOL)
						}
						break
					case 'option':
						try {
							const option = parseOption(line)
							this.options.set(option.key, option.value)
							log('option:', option, EOL)
						} catch (err) {
							log('option: ignoring: parse error', EOL)
						}
						break
					case 'uciok':
						log('uciok')
						//init done, cleanup listener and resolve
						this.proc.stdout.removeListener('data', parser)
						resolve(this)
						break
					}
				})
			}

			this.proc.stdout
			.on('data', parser)

			this.write(`uci${EOL}`)
		})
	}

	quit() {
		return new Promise((resolve, reject) => {
			if( ! this.proc )
				return reject(new Error('cannot call "quit()": engine process not running'))
			this.proc.on('close', (code, sig) => {
				this.proc.removeAllListeners()
				delete this.proc
				resolve(code, sig)
			})
			this.write(`quit${EOL}`)
		})
	}

	isready() {
		return new Promise((resolve, reject) => {
			if( ! this.proc )
				return reject(new Error('cannot call "isready()": engine process not running'))
			const listener = (buffer) => {
				const lines = getLines(buffer)
				lines.forEach(line => {
					if( line === 'readyok') {
						resolve(this)
					} else {
						reject(new Error(`unexpected line: expecting "readyok", got: "${line}"`))
					}
				})
			}
			this.proc.stdout.once('data', listener)
			this.write(`isready${EOL}`)
		})
	}

	sendCmd(cmd) {
		if( ! this.proc )
			return Promise.reject(new Error(`cannot call "${cmd}()": engine process not running`))

		log('sendCmd', cmd)
		this.write(`${cmd}${EOL}`)
		return this.isready()
	}

	setoption(name, value) {
		let cmd = `name ${name}`
		if( value ) cmd += ` value ${value}`
		return this.sendCmd(`setoption ${cmd}`)
		.then(p => {
			this.options.set(name, value)
			return p
		})
	}

	ucinewgame() {
		return this.sendCmd('ucinewgame')
	}

	ponderhit() {
		return this.sendCmd('ponderhit')
	}

	position(fen, moves) {
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

	go(options) {
		return new Promise((resolve, reject) => {
			if( ! this.proc )
				return reject(new Error('cannot call "go()": engine process not running'))
			if( options.infinite )
				return reject(new Error('go() does not support infinite search, use goInfinite()'))
			const infoArray = []
			const listener = buffer => {
				const lines = getLines(buffer)
				lines.forEach(line => {
					const bestmove = REGEX.bestmove.exec(line)
					if( bestmove && bestmove[1] ) {
						const result = {
							bestmove: bestmove[1],
							info: infoArray
						}
						if( bestmove[2] ) {
							result.ponder = bestmove[2]
						}
						//cleanup
						this.proc.stdout.removeListener('data', listener)
						return resolve(result)
					}
					const info = parseInfo(line)
					if( ! _.isEmpty(info) ) infoArray.push(info)
				})
			}
			const command = goCommand(options)
			this.proc.stdout.on('data', listener)
			this.write(command)
		})
	}

	goInfinite(options = {}) {
		if( ! this.proc )
			return reject(new Error('cannot call "goInfinite()": engine process not running'))
		if( options.depth )
			return reject(new Error('goInfinite() does not support depth search, use go()'))
		//set up emitter
		this.emitter = new EventEmitter()
		this.emitter.on('stop', () => {
			//cleanup
			this.proc.stdout.removeListener('data', listener)
		})
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
		this.write(command)
		return this.emitter
	}

	stop() {
		return new Promise((resolve, reject) => {
			const listener = buffer => {
				const lines = getLines(buffer)
				lines.forEach(line => {
					const bestmove = parseBestmove(line)
					if( bestmove ) {
						this.proc.stdout.removeListener('data', listener)
						return resolve(bestmove)
					}
				})
			}

			this.proc.stdout.on('data', listener)
			this.write(`stop${EOL}`)
			this.emitter.emit('stop')
		})
	}
}
