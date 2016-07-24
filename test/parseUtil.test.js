import {EOL} from 'os'

import _ from 'lodash'
import sinon from 'sinon'

import expect from './Chai'
import {
	getLines,
	parseId,
	parseOption,
	goCommand,
	parseInfo,
} from '../src/parseUtil'

describe('parseUtil', () => {
	describe('getLines', () => {
		it('should throw if no param given', () => {
			expect(() => getLines()).to.throw
		})

		it('should always return an array', () => {
			const r = getLines('')
			expect(r).to.be.an.array
		})

		it('should split by newline', () => {
			const r = getLines('1\n2\n3')
			expect(r.length).to.equal(3)
		})

		it('should not contain empty lines', () => {
			const r = getLines('1\n\n\n2\n\n3\n')
			expect(r.length).to.equal(3)
		})
	})

	describe('parseId', () => {
		it('should throw if invalid cmd', () => {
			expect(() => parseId('id lololo kekeke')).to.throw
		})

		it('should parse "name"', () => {
			const r = parseId('id name Stockfish 7 64')
			expect(r).to.be.deep.equal({
				key: 'name',
				value: 'Stockfish 7 64'
			})
		})

		it('should parse "author"', () => {
			const r = parseId('id author T. Romstad, M. Costalba, J. Kiiski, G. Linscott')
			expect(r).to.be.deep.equal({
				key: 'author',
				value: 'T. Romstad, M. Costalba, J. Kiiski, G. Linscott'
			})
		})
	})

	describe('parseOption', () => {
		it('should throw if invalid cmd', () => {
			expect(() => parseOption('option fafa lolol')).to.throw
		})

		it('should parse "check"', () => {
			const r = parseOption('option name Nullmove type check default true')
			expect(r).to.have.properties({
				key: 'Nullmove',
				value: {
					type: 'check',
					default: true
				}
			})
		})

		it('should parse "spin"', () => {
			const r = parseOption('option name Selectivity type spin default 2 min 0 max 4')
			expect(r).to.have.properties({
				key: 'Selectivity',
				value: {
					type: 'spin',
					default: 2,
					min: 0,
					max: 4
				}
			})
		})

		it('should parse "combo"', () => {
			const r = parseOption('option name Style type combo default Normal var Solid var Normal var Risky')
			expect(r).to.have.properties({
				key: 'Style',
				value: {
					type: 'combo',
					default: 'Normal',
					options: ['Solid', 'Normal', 'Risky']
				}
			})
		})

		it('should parse "string"', () => {
			const r = parseOption('option name NalimovPath type string default c:\\')
			expect(r).to.have.properties({
				key: 'NalimovPath',
				value: {
					type: 'string',
					default: 'c:\\'
				}
			})
		})

		it('should parse "button"', () => {
			const r = parseOption('option name Clear Hash type button')
			expect(r).to.have.properties({
				key: 'Clear Hash',
				value: {
					type: 'button'
				}
			})
		})
	})

	describe('goCommand', () => {
		it('should ignore invalid options', () => {
			const cmd = goCommand({
				derpy: 'yep',
				ponder: false,
				lolol: -2.84,
				searchmoves: {obj: 'yes'},
				infinite: false
			})
			expect(cmd).to.equal(`go${EOL}`)
		})

		it('should not validate options', () => {
			//infinite & depth are incompatible, we don't care
			const cmd = goCommand({infinite: true, depth: 3})
			expect(cmd).to.equal(`go depth 3 infinite${EOL}`)
		})

		it('should append searchmoves correctly', () => {
			const cmd = goCommand({
				searchmoves: ['e2e4', 'd7d5', 'e4d5', 'd8d5']
			})
			expect(cmd).to.equal(`go searchmoves e2e4 d7d5 e4d5 d8d5${EOL}`)
		})

		it('should include ponder and inifinite flag', () => {
			const cmd = goCommand({ponder: 27, infinite: true})
			expect(cmd).to.equal(`go ponder infinite${EOL}`)
		})

		it('should include ponder and infinite only if true', () => {
			const cmd = goCommand({ponder: false, infinite: NaN})
			expect(cmd).to.equal(`go${EOL}`)
		})

		it('should include all the rest of the options if they are > 0', () => {
			const cmd = goCommand({
				wtime: 1,
				btime: -1,
				winc: 2,
				binc: -2,
				movestogo: 3,
				depth: -3,
				nodes: 4,
				mate: -4,
				movetime: 5
			})
			expect(cmd).to.contain('wtime 1')
			expect(cmd).to.not.contain('btime')
			expect(cmd).to.contain('winc 2')
			expect(cmd).to.not.contain('binc')
			expect(cmd).to.contain('movestogo 3')
			expect(cmd).to.not.contain('depth')
			expect(cmd).to.contain('nodes 4')
			expect(cmd).to.not.contain('mate')
			expect(cmd).to.contain('movetime 5')
		})
	})

	describe('parseInfo', () => {
		it('should parse correctly', () => {
			const infoLine = 'info depth 8 seldepth 8 multipv 1 score cp -4 nodes 6582 nps 411375 tbhits 0 time 16 pv g1f3 d7d5 d2d4 g8f6 f3e5 b8c6 e2e3 e7e6'
			let parsed = parseInfo(infoLine)
			expect(parsed).to.deep.equal({
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
	})
})
