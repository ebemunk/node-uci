import {spawn} from 'child_process'
import path from 'path'
import {EOL} from 'os'

import _ from 'lodash'
import Promise from 'bluebird'
import debug from 'debug'

import EngineChain from './EngineChain'

const log = debug('uci:Engine')
const engineLog = debug('uci:Engine:log')

//dem regexes
const REGEX = {
	cmdType: /^(id|option|uciok$)/,
	id: /^id (name|author) (.+)$/,
	option: /^option name (.+) type (\w+)(?: default ([A-Za-z0-9._\\\:<>/]+))?(?: min (-?\w+))?(?: max (-?\w+))?(?: var (.+))*$/,
	bestmove: /^bestmove (\w+)(?: ponder (\w+))?$/,
	info: {
		depth: /\bdepth (\d+)/,
		seldepth: /\bseldepth (\d+)/,
		time: /\btime (\d+)/,
		nodes: /\bnodes (\d+)/,
		currmove: /\bcurrmove (\w+)/,
		currmovenumber: /\bcurrmovenumber (\d+)/,
		hashfull: /\bhashfull (\d+)/,
		nps: /\bnps (\d+)/,
		tbhits: /\btbhits (\d+)/,
		cpuload: /\bcpuload (\d+)/,
		score: /\bscore (cp|mate|lowerbound|upperbound) (-?\d+)/,
		multipv: /\bmultipv (\d+)/,
		pv: /\bpv (.+)/,
		string: /\bstring (.+)/,
		refutation: /\brefutation (.+)/,
		currline: /\bcurrline (.+)/
	}
}

const INFO_NUMBER_TYPES = [
	'depth',
	'seldepth',
	'time',
	'nodes',
	'currmovenumber',
	'hashfull',
	'nps',
	'tbhits',
	'cpuload',
	'multipv',
]

//get a Buffer and split the newlines
function getLines(buffer) {
	const lines = buffer
	.split(/\r?\n/g)
	.filter(line => !!line.length)
	return lines
}

//parse an "id" command
function parseId(line) {
	const parsed = REGEX.id.exec(line)
	return {
		key: parsed[1],
		value: parsed[2]
	}
}

//parse an "option" command
function parseOption(line) {
	const parsed = REGEX.option.exec(line)
	const option = {
		type: parsed[2]
	}

	switch( parsed[2] ) {
	case 'check':
		option.default = parsed[3] === 'true'
		break
	case 'spin':
		option.default = parseInt(parsed[3])
		option.min = parseInt(parsed[4])
		option.max = parseInt(parsed[5])
		break
	case 'combo':
		log(parsed)
		option.default = parsed[3]
		option.options = parsed[6].split(/ ?var ?/g)
		break //combo breaker?
	case 'string':
		option.default = parsed[3]
		break
	case 'button':
		//no other info
		break
	}

	return {
		key: parsed[1],
		value: option
	}
}

//construct go command from options
function goCommand(options) {
	let cmd = 'go'
	const commands = [
		'searchmoves', //[moves]
		'ponder', //bool
		'wtime', //msec
		'btime', //msec
		'winc', //msec
		'binc', //msec
		'movestogo', //>0
		'depth', //>0
		'nodes', //>0
		'mate', //>0
		'movetime', //msec
		'infinite' //bool
	]

	commands.forEach((command) => {
		if( ! options.hasOwnProperty(command) ) return
		switch( command ) {
		//array
		case 'searchmoves':
			if( options[command].length ) {
				cmd += ' searchmoves ' + options[command].join(' ')
			}
			break
		//bool
		case 'ponder':
		case 'infinite':
			if( options[command] ) {
				cmd += ` ${command}`
			}
			break
		//rest are >= 0
		default:
			if( options[command] >= 0 ) {
				cmd += ` ${command} ${options[command]}`
			}
		}
	})

	return `${cmd}${EOL}`
}

//parse an "info" command
function parseInfo(line) {
	log('parseInfo')
	log('line', line)
	const info = {}
	_.forEach(REGEX.info, (val, key) => {
		const parsed = val.exec(line)
		if( ! parsed ) return
		switch( key ) {
		case 'score':
			info[key] = {
				unit: parsed[1],
				value: parseFloat(parsed[2])
			}
			break
		default:
			if( INFO_NUMBER_TYPES.includes(key) ) {
				info[key] = parseFloat(parsed[1])
			} else {
				info[key] = parsed[1]
			}
		}
	})
	log('info', info, EOL)
	if( _.isEmpty(info) ) {
		console.warn('parseInfo() received line it couldnt parse: ', line)
		return
	}
	return info
}

//parse "bestmove" command
function parseBestmove(line) {
	const bestmove = REGEX.bestmove.exec(line)
	if( ! bestmove || ! bestmove[1] ) return
	const parsed = {
		bestmove: bestmove[1]
	}
	if( bestmove[2] ) {
		parsed.ponder = bestmove[2]
	}
	return parsed
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

	goInfinite(options) {
		const cmd = goCommand(options)
		log(cmd)
	}
}
