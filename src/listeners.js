import {EOL} from 'os'

import _ from 'lodash'
import debug from 'debug'

import {REGEX, INFO_NUMBER_TYPES} from './const'
import {
	getLines,
	parseInfo,
	parseBestmove,
	parseId,
	parseOption,
} from './parseUtil'

const log = debug('uci:listeners')

//create a listener to parse lines from engine
export function createListener(fn, resolve, reject) {
	return (buffer) => {
		const lines = getLines(buffer)
		const result = {}
		const partialFn = _.partial(fn, resolve, reject, result)
		lines.forEach(partialFn)
	}
}

export function isreadyListener(resolve, reject, result, line) {
	if( line === 'readyok' ) {
		resolve(true)
	} else {
		reject(new Error(`unexpected line: expecting "readyok", got: "${line}"`))
	}
}

export function goListener(resolve, reject, result, line) {
	//init result
	if( _.isEmpty(result) ) {
		result.info = []
	}
	const bestmove = parseBestmove(line)
	if( bestmove ) return resolve({
		...result,
		...bestmove
	})
	const info = parseInfo(line)
	if( ! _.isEmpty(info) ) result.info.push(info)
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
