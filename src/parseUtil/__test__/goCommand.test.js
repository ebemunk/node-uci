import {goCommand} from '../'

describe('goCommand', () => {
	it('should ignore invalid options', () => {
		const cmd = goCommand({
			derpy: 'yep',
			ponder: false,
			lolol: -2.84,
			searchmoves: {obj: 'yes'},
			infinite: false
		})
		expect(cmd).toEqual('go')
	})

	it('should not validate options', () => {
		//infinite & depth are incompatible, we don't care
		const cmd = goCommand({infinite: true, depth: 3})
		expect(cmd).toEqual('go depth 3 infinite')
	})

	it('should append searchmoves correctly', () => {
		const cmd = goCommand({
			searchmoves: ['e2e4', 'd7d5', 'e4d5', 'd8d5']
		})
		expect(cmd).toEqual('go searchmoves e2e4 d7d5 e4d5 d8d5')
	})

	it('should include ponder and inifinite flag', () => {
		const cmd = goCommand({ponder: 27, infinite: true})
		expect(cmd).toEqual('go ponder infinite')
	})

	it('should include ponder and infinite only if true', () => {
		const cmd = goCommand({ponder: false, infinite: NaN})
		expect(cmd).toEqual('go')
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
		expect(cmd).toContain('wtime 1')
		expect(cmd).not.toContain('btime')
		expect(cmd).toContain('winc 2')
		expect(cmd).not.toContain('binc')
		expect(cmd).toContain('movestogo 3')
		expect(cmd).not.toContain('depth')
		expect(cmd).toContain('nodes 4')
		expect(cmd).not.toContain('mate')
		expect(cmd).toContain('movetime 5')
	})
})
