import Engine from '../'

describe('Engine.constructor', () => {
	it('should throw if path is empty', () => {
		expect(() => new Engine()).toThrow()
	})
})
