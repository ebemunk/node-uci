import {parseBestmove} from '../'

describe('parseBestmove', () => {
	it('should parse bestmove correctly', () => {
		const bestmove = parseBestmove('bestmove e4e5')
		expect(bestmove).toEqual({
			bestmove: 'e4e5'
		})
		expect(bestmove).not.toContain('ponder')
	})

	it('should include ponder if present', () => {
		const bestmove = parseBestmove('bestmove b1c3 ponder b8c6')
		expect(bestmove).toEqual({
			bestmove: 'b1c3',
			ponder: 'b8c6'
		})
	})

	it('should return undefined if not parseable', () => {
		const bestmove = parseBestmove('lolol ehehah')
		expect(bestmove).toBeUndefined()
	})

	it('should accept (none) as a bestmove', () => {
		const bestmove = parseBestmove('bestmove (none)')
		expect(bestmove).toBeTruthy()
	})
})
