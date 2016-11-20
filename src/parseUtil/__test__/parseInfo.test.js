import {parseInfo} from '../'

describe('parseInfo', () => {
	it('should parse correctly', () => {
		const infoLine = 'info depth 8 seldepth 8 multipv 1 score cp -4 nodes 6582 nps 411375 tbhits 0 time 16 pv g1f3 d7d5 d2d4 g8f6 f3e5 b8c6 e2e3 e7e6'
		let parsed = parseInfo(infoLine)
		expect(parsed).toEqual({
			depth: 8,
			seldepth: 8,
			multipv: 1,
			score: {
				unit: 'cp',
				value: -4
			},
			nodes: 6582,
			nps: 411375,
			tbhits: 0,
			time: 16,
			pv: 'g1f3 d7d5 d2d4 g8f6 f3e5 b8c6 e2e3 e7e6'
		})
	})

	it('should return nothing if no parsable info found', () => {
		let parsed = parseInfo('info lol kekek haha')
		expect(parsed).toBeUndefined()
	})
})
