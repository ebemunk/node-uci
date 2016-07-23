import EventEmitter from 'events'
import {EOL} from 'os'

import sinon from 'sinon'

import Engine from '../src'

export function childProcessMock() {
	let cpMock = new EventEmitter()
	Object.assign(cpMock, {
		stdout: new EventEmitter(),
		stderr: new EventEmitter(),
		stdin: {
			write: sinon.spy()
		},
		uciok: () => cpMock.stdout.emit('data', `uciok${EOL}`),
		destroy: () => Engine.__ResetDependency__('spawn')
	})

	Engine.__Rewire__('spawn', () => cpMock)

	return cpMock
}
