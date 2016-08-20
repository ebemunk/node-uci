import {EOL} from 'os'

import _ from 'lodash'
import debug from 'debug'

import {REGEX, INFO_NUMBER_TYPES} from './const'

const log = debug('uci:parseUtil')

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
		log('parseInfo cannot parse:', info, EOL)
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

export function goReducer(result ,line) {
	const cmdType = _.get(REGEX.cmdType.exec(line), 1)
	switch( cmdType ) {
		case 'bestmove': {
			const best = parseBestmove(line)
			if( best.bestmove ) result.bestmove = best.bestmove
			if( best.ponder ) result.ponder = best.ponder
			break
		}
		case 'info': {
			const info = parseInfo(line)
			if( info ) result.info.push(info)
			break
		}
	}
	return result
}

//parse an "id" command
export function parseId(line) {
	const parsed = REGEX.id.exec(line)
	if( ! parsed || ! parsed[1] || ! parsed[2] ) return null
	return {
		[parsed[1]]: parsed[2]
	}
}

//parse an "option" command
export function parseOption(line) {
	const parsed = REGEX.option.exec(line)
	if( ! parsed ) return null

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
		[parsed[1]]: option
	}
}

export function initReducer(result, line) {
	const cmdType = _.get(REGEX.cmdType.exec(line), 1)
	switch( cmdType ) {
		case 'id':
			result.id = {
				...result.id,
				...parseId(line),
			}
			break
		case 'option':
			result.options = {
				...result.options,
				...parseOption(line)
			}
			break
	}
	return result
}
