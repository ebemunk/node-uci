import {REGEX} from '../const'

export default function parseBestmove(line) {
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
