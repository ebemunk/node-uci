import {parseOption} from '../'

describe('parseOption', () => {
	it('should not throw if invalid cmd', () => {
		expect(() => parseOption('option fafa lolol')).not.toThrow()
	})

	it('should parse "check"', () => {
		const r = parseOption('option name Nullmove type check default true')
		expect(r).toEqual({
			'Nullmove': {
				type: 'check',
				default: true
			}
		})
	})

	it('should parse "spin"', () => {
		const r = parseOption('option name Selectivity type spin default 2 min 0 max 4')
		expect(r).toEqual({
			'Selectivity': {
				type: 'spin',
				default: 2,
				min: 0,
				max: 4
			}
		})
	})

	it('should parse "combo"', () => {
		const r = parseOption('option name Style type combo default Normal var Solid var Normal var Risky')
		expect(r).toEqual({
			'Style': {
				type: 'combo',
				default: 'Normal',
				options: ['Solid', 'Normal', 'Risky']
			}
		})
	})

	it('should parse "string"', () => {
		const r = parseOption('option name NalimovPath type string default c:\\')
		expect(r).toEqual({
			'NalimovPath': {
				type: 'string',
				default: 'c:\\'
			}
		})
	})

	it('should parse "button"', () => {
		const r = parseOption('option name Clear Hash type button')
		expect(r).toEqual({
			'Clear Hash': {
				type: 'button'
			}
		})
	})
})
