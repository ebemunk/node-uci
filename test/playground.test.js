import _ from 'lodash'
import Promise from 'bluebird'

import {Engine, Evaluator} from '../src'

const enginePath = '/home/derpatron/Downloads/stockfish-7-linux/Linux/stockfish'
// const enginePath = '/Users/bugrafirat/Downloads/stockfish-7-mac/Mac/stockfish-7-64'

const moves = ['e2e4', 'e7e5', 'b1c3', 'b8c6', 'd2d3', 'd7d6']

/* eslint-disable */
describe('playground', () => {
	it.only('evaluator', async () => {
		const engine = new Engine(enginePath)
		const wat = await Evaluator.evaluate(engine, moves, {reverse:false})
		console.log(wat);
	})

	it('chain analysis', async () => {
		const engine = new Engine(enginePath)
		const chain = engine.chain()
		await chain
		.init()
		.ucinewgame()
		.exec()
		const evals = await Promise.mapSeries(moves, (move, i) => {
			return chain
			.position('startpos', moves.slice(0, i+1))
			// .position('startpos', moves.slice(0, moves.length - i))
			.go({depth: 13})
		})
		.map((e, i) => {
			const lastInfo = _.last(e.info)
			return {
				pv: lastInfo.pv,
				score: lastInfo.score,
				bestmove: e.bestmove,
			}
		})
		// console.log(wat);
		// console.log(wat[0]);
		// console.log(evals);
		const final = _.zipWith(moves, evals, (m, e) => ({
			...e,
			move: m,
		}))
		console.log(final);
		engine.quit()
	})
})
