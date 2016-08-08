import EventEmitter from 'events'
import stream from 'stream'
import {EOL} from 'os'

import sinon from 'sinon'

import {Engine} from '../src'

export function childProcessMock() {
	const stdoutMock = new stream.Readable()
	stdoutMock._read = x => x

	let cpMock = new EventEmitter()
	Object.assign(cpMock, {
		stdout: stdoutMock,
		stderr: new EventEmitter(),
		stdin: {
			write: sinon.spy()
		},
		uciok: () => cpMock.stdout.emit('data', `uciok${EOL}`),
		readyok: () => cpMock.stdout.emit('data', `readyok${EOL}`),
		destroy: () => Engine.__RewireAPI__.__ResetDependency__('spawn')
	})

	Engine.__RewireAPI__.__Rewire__('spawn', () => cpMock)

	return cpMock
}
