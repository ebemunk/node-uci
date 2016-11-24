import get from 'lodash/get'

import {REGEX} from '../const'
import {parseBestmove, parseInfo} from './'

export default function goReducer(result ,line) {
	const cmdType = get(REGEX.cmdType.exec(line), 1)
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
