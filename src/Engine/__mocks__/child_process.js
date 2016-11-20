import EventEmitter from 'events'
import stream from 'stream'
import {EOL} from 'os'

export const cpMock = new EventEmitter()

const stdoutMock = new stream.Readable()
stdoutMock._read = x => x

Object.assign(cpMock, {
	stdout: stdoutMock,
	uciok: () => cpMock.stdout.emit('data', `uciok${EOL}`),
	readyok: () => cpMock.stdout.emit('data', `readyok${EOL}`),
	stdin: {
		write: jest.fn()
	}
})

export function spawn() {
	cpMock.stdout.removeAllListeners()

	Object.assign(cpMock, {
		stdin: {
			write: jest.fn()
		}
	})

	return cpMock
}
