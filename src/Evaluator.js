import Promise from 'bluebird'
import _ from 'lodash'

export async function evaluate(engine, moves, {reverse=true, depth=12} = {}) {
	const chain = engine.chain()
	await chain
	.init()
	.ucinewgame()
	.exec()
	const evals = await Promise.mapSeries(moves, (move, i) => {
		const sliceIndex = reverse ? i+1 : moves.length-i
		return chain
		.position('startpos', moves.slice(0, sliceIndex))
		.go({depth})
	})
	.map(result => {
		const lastInfo = _.last(result.info)
		return {
			pv: lastInfo.pv,
			score: lastInfo.score,
			bestmove: result.bestmove,
		}
	})
	const final = _.zipWith(moves, evals, (m, e) => ({
		...e,
		move: m,
	}))
	await engine.quit()
	return final
}
