import {parseId} from '../'

describe('parseId', () => {
	it('should not throw if invalid cmd', () => {
		expect(() => parseId('id lololo kekeke')).not.toThrow()
	})

	it('should parse "name"', () => {
		const r = parseId('id name Stockfish 7 64')
		expect(r).toEqual({
			name: 'Stockfish 7 64'
		})
	})

	it('should parse "author"', () => {
		const r = parseId('id author T. Romstad, M. Costalba, J. Kiiski, G. Linscott')
		expect(r).toEqual({
			author: 'T. Romstad, M. Costalba, J. Kiiski, G. Linscott'
		})
	})
})
