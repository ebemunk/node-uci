import {EOL} from 'os'

import _ from 'lodash'
import debug from 'debug'

import {REGEX, INFO_NUMBER_TYPES} from './const'

const log = debug('uci:parseUtil')

//get a Buffer and split the newlines
export function getLines(buffer) {
	const lines = buffer
	.split(/\r?\n/g)
	.filter(line => !!line.length)
	return lines
}

//construct go command from options
export function goCommand(options) {
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
export function parseInfo(line) {
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
export function parseBestmove(line) {
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

export function createListener(fn, resolve, reject) { return (buffer) => {
		const lines = getLines(buffer)
		const result = {}
		const partialFn = _.partial(fn, resolve, reject, result)
		lines.forEach(partialFn)
	}
}

//parse an "id" command
export function parseId(line) {
	const parsed = REGEX.id.exec(line)
	return {
		key: parsed[1],
		value: parsed[2]
	}
}

//parse an "option" command
export function parseOption(line) {
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

export function initListener(resolve, reject, result, line) {
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
				_.set(result, `id.${id.key}`, id.value)
				log('id:', id, EOL)
			} catch (err) {
				log('id: ignoring: parse error', EOL)
			}
			break
		case 'option':
			try {
				const option = parseOption(line)
				_.set(result, `options.${option.key}`, option.value)
				log('option:', option, EOL)
			} catch (err) {
				log('option: ignoring: parse error', EOL)
			}
			break
		case 'uciok':
			log('uciok')
			resolve(result)
			break
	}
}
