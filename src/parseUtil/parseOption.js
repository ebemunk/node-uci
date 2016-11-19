import {REGEX} from '../const'

export default function parseOption(line) {
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
