import {spawn} from 'child_process'
import path from 'path'
import {EOL} from 'os'

import _ from 'lodash'
import Promise from 'bluebird'
import debug from 'debug'

const log = debug('uci:Engine')
// const log = console.log

//dem regexes
const REGEX = {
	cmdType: /^(id|option|uciok$)/,
	id: /^id (name|author) (.+)$/,
	option: /^option name (.+) type (\w+)(?: default ([A-Za-z0-9._\\\:<>/]+))?(?: min (-?\w+))?(?: max (-?\w+))?(?: var (.+))*$/,
	info: {
		depth: /\bdepth (\d+)/,
		seldepth: /\bseldepth (\d+)/,
		time: /\btime (\d+)/
	}
}

//get a Buffer and split the newlines
function getLines(buffer) {
	let lines = buffer
	.toString()
	.split(/\r?\n/g)
	.filter(line => !!line.length)
	return lines
}

//parse an "id" command
function parseId(line) {
	let parsed = REGEX.id.exec(line)
	return {
		key: parsed[1],
		value: parsed[2]
	}
}

//parse an "option" command
function parseOption(line) {
	let parsed = REGEX.option.exec(line)
	let option = {
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
	let commands = [
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
		if( ! options.hasOwnProperty(command) ) return;
		switch( command ) {
			//array
			case 'searchmoves':
				if( options[command].length ) {
					cmd += ' searchmoves ' + options[command].join(' ')
				}
				break;
			//bool
			case 'ponder':
			case 'infinite':
				if( options[command] ) {
					cmd += ` ${command}`
				}
				break;
			//rest are >= 0
			default:
				if( options[command] >= 0 ) {
					cmd += ` ${command} ${options[command]}`
				}
		}
	})

	return `${cmd}${EOL}`
}

function parseInfo(line) {
	log('parseInfo')
	log('line', line)
	let info = {}
	_.forEach(REGEX.info, (val, key) => {
		let parsed = val.exec(line)
		if( ! parsed ) return
		info[key] = parsed[1]
	})
	log('info', info, EOL)
}

//create an engine listener - convenience
function engineListenerCreator(fn) {
	return (buffer) => {
		let lines = getLines(buffer)
		lines.forEach(fn)
	}
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

	chain() {
		return new EngineChain(this)
	}

	init() {
		return new Promise((resolve, reject) => {
			this.proc = spawn(this.filePath)
			this.proc
			.on('close', reject)
			.on('error', reject)

			//the parser fn that will interpret engine output
			let parser = (line) => {
			// function parser(line) {
				log('init: line', line)
				let cmdType = _.get(REGEX.cmdType.exec(line), 1)
				if( ! cmdType ) {
					//couldn't parse, ignore
					log('init: ignoring', EOL)
					return
				}

				switch( cmdType ) {
					case 'id':
						try {
							let id = parseId(line)
							this.id[id.key] = id.value
							log('id:', id, EOL)
						} catch (err) {
							log('id: ignoring: parse error', EOL)
						}
						break
					case 'option':
						try {
							let option = parseOption(line)
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
						// this.proc.stdout.removeAllListeners()
						//resolve `this` in case handler doesn't have a ref to engine
						resolve(this)
						break
				}
			}

			this.proc.stdout
			.on('data', engineListenerCreator(parser))

			this.proc.stdin.write(`uci${EOL}`)
		})
	}

	quit() {
		return new Promise((resolve, reject) => {
			if( ! this.proc ) reject(new Error('cannot call "quit()": engine process not running'))
			this.proc.on('close', (code, sig) => {
				this.proc.removeAllListeners()
				delete this.proc
				resolve(code, sig)
			})
			this.proc.stdin.write(`quit${EOL}`)
		})
	}

	isready() {
		return new Promise((resolve, reject) => {
			if( ! this.proc ) reject(new Error('cannot call "isready()": engine process not running'))
			let listener = (line) => {
				if( line === 'readyok') {
					resolve(this)
				} else {
					reject(new Error(`unexpected line: expecting "readyok", got: "${line}"`))
				}
			}
			this.proc.stdout.once('data', engineListenerCreator(listener))
			this.proc.stdin.write(`isready${EOL}`)
		})
	}

	sendCmd(cmd) {
		if( ! this.proc )
			return Promise.reject(new Error(`cannot call "${cmd}()": engine process not running`))

		this.proc.stdin.write(`${cmd}${EOL}`)
		return this.isready()
	}

	setoption(name, value) {
		let cmd = `name ${name}`
		if( value ) cmd += ` value ${value}`
		return this.sendCmd(`setoption ${cmd}`)
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
			let movesStr = moves.join(' ')
			cmd += ` moves ${movesStr}`
		}

		return this.sendCmd(`position ${cmd}`)
	}

	go(options) {
		return new Promise((resolve, reject) => {
			if( ! this.proc ) reject(new Error('cannot call "go()": engine process not running'))
			let listener = (line) => {
				let info = parseInfo(line)
			}
			let command = goCommand(options)
			this.proc.stdout.on('data', engineListenerCreator(listener))
			this.proc.stdin.write(command)
		})
	}
}
