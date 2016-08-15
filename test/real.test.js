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
		it('chain usage', (done) => {
			const engine = new Engine(enginePath)
			engine.chain()
			.init()
			.setoption('MultiPV', 3)
			.position('r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3')
			.go({depth: 15})
			.commit()
			.then((a,b,c) => {
				console.log('BITENZZz');
				console.log(a);
				console.log(b);
				console.log(c);
				done()
			})
			.catch(err => {
				console.log(err.stack);
			})
		})
	})

	describe('new', () => {
		let engine
		it('t', async () => {
			engine = new Engine(enginePath)
			await engine.propashambles()
			// let q = await engine.go({depth: 20})
			// console.log('qqq',q);
		})

		after(async () => {
			await engine.quit()
		})
	})
})
