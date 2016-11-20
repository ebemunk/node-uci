import {Engine, EngineChain} from '../../'

describe('chain', () => {
	it('should return an instance of EngineChain', () => {
		const chain = new Engine('').chain()
		expect(chain).toBeInstanceOf(EngineChain)
	})
})
