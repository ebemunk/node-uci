import forEach from 'lodash/forEach'
import isEmpty from 'lodash/isEmpty'

import {REGEX, INFO_NUMBER_TYPES} from '../const'

export default function parseInfo(line) {
	const info = {}
	forEach(REGEX.info, (val, key) => {
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
	if( isEmpty(info) ) {
		return
	}
	return info
}
