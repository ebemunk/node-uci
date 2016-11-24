import get from 'lodash/get'

import {REGEX} from '../const'
import {parseId, parseOption} from './'

export default function initReducer(result, line) {
	const cmdType = get(REGEX.cmdType.exec(line), 1)
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
