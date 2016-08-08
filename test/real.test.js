//testing with real engines
import {Engine} from '../src'

/* eslint-disable */
const enginePath = '/home/derpatron/Downloads/stockfish-7-linux/Linux/stockfish'
// const enginePath = '/Users/bugrafirat/Downloads/stockfish-7-mac/Mac/stockfish-7-64'

describe.skip('real', () => {
	describe('promise/async', () => {
		it('promise/async usage', async () => {
			const engine = new Engine(enginePath)
			const rez = await engine.init()
			await engine.setoption('MultiPV', '4')
			await engine.isready()
			console.log('engine ready', engine.id, engine.options)
			const go = await engine.go({depth: 15})
			console.log('go', go);
			await engine.quit()
		})

		it('goinfinite usage', async () => {
			const engine = new Engine(enginePath)
			await engine.init()
			await engine.isready()
	    await engine.setoption('MultiPV', '3')
			const ee = engine.goInfinite()
			ee.on('data', a => {
				console.log(a);
			})
			setTimeout(async () => {
				const bm = await engine.stop()
	      console.log('bestmove', bm);
				await engine.quit()
			}, 5000)
		})
	})

	describe('chain', () => {

	})
})
