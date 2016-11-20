import _ from 'lodash'
import Promise from 'bluebird'
// import {Chess} from 'chess.js'

import {Engine, Evaluator} from '../'

const enginePath = 'C:\\Users\\derp\\Downloads\\stockfish-7-win\\Windows\\stockfish.exe'

const moves = ['e2e4', 'e7e5', 'b1c3', 'b8c6', 'd2d3', 'd7d6']
const game1 = `[Event "Casual game"]
[Site "https://lichess.org/YJW98QbR"]
[Date "2016.09.03"]
[White "bnhsy"]
[Black "Ingvar80"]
[Result "1-0"]
[WhiteElo "1500"]
[BlackElo "1529"]
[PlyCount "41"]
[Variant "Standard"]
[TimeControl "600+0"]
[ECO "B46"]
[Opening "Sicilian Defense: Paulsen Variation"]
[Termination "Normal"]
[Annotator "lichess.org"]

1. e4 c5 2. Nf3 e6 3. d4 cxd4 4. Nxd4 a6 5. Nc3 Nc6 { B46 Sicilian Defense: Paulsen Variation } 6. Bc4 Qf6?! { (0.17 → 0.85) Inaccuracy. Best move was Qc7. } (6... Qc7 7. O-O Nf6 8. Be2 Bd6 9. Nf3 O-O 10. h3 Ne5 11. Nd4 Nc6 12. Nf3 Ne5 13. Bg5) 7. Be3 Be7 8. O-O Bd6?? { (1.13 → 4.48) Blunder. Best move was b5. } (8... b5 9. Be2 Bb7 10. a3 Nxd4 11. Bxd4 e5 12. Be3 Qc6 13. Nd5 Nf6 14. Nxe7 Kxe7 15. f3) 9. f4? { (4.48 → 1.85) Mistake. Best move was Nxc6. } (9. Nxc6 Bc7 10. Nd4 b5 11. Bd3 Bb7 12. f4 Qh6 13. Qe2 Ne7 14. a4 b4 15. Na2 O-O) 9... h5?? { (1.85 → 5.22) Blunder. Best move was Bc5. } (9... Bc5 10. e5 Nxe5 11. fxe5 Qxe5 12. Qd2 Nf6 13. Be2 d5 14. Rad1 Qc7 15. Nb3 Bd6 16. Bf4) 10. e5? { (5.22 → 3.56) Mistake. Best move was Nxc6. } (10. Nxc6 Bc7 11. e5 Qg6 12. Nd4 Ne7 13. Bd3 f5 14. exf6 Qxf6 15. Ne4 Qh6 16. Qf3 Nd5) 10... Nxe5? { (3.56 → 5.20) Mistake. Best move was Bxe5. } (10... Bxe5 11. fxe5 Qxe5 12. Bf2 Nf6 13. Nxc6 bxc6 14. Bd4 Qc7 15. Bxf6 gxf6 16. Ne4 d5 17. Nxf6+) 11. fxe5 Qxe5 12. Bf4 Qc5?? { (4.53 → 9.43) Blunder. Best move was Qxf4. } (12... Qxf4 13. Rxf4) 13. Bxd6?? { (9.43 → 5.71) Blunder. Best move was Ne4. } (13. Ne4 Nf6 14. Nxc5 Bxc5 15. c3 d5 16. Bd3 Ne4 17. Qf3 Bd7 18. Be3 f6 19. Rae1 O-O-O) 13... Qxd6 14. Ne4? { (5.70 → 2.86) Mistake. Best move was Nxe6. } (14. Nxe6 Qb6+ 15. Qd4 Qxd4+ 16. Nxd4 Nf6 17. Rae1+ Kd8 18. Nf5 b5 19. Bxf7 Rb8 20. Nxg7 Rb6) 14... Qb4? { (2.86 → 4.64) Mistake. Best move was Qb6. } (14... Qb6 15. Qd3 Ne7 16. Bb3 f6 17. Qe3 O-O 18. Rae1 a5 19. c3 a4 20. Bc2 Qxb2 21. Qg3) 15. c3 Qxb2?? { (3.95 → 17.97) Blunder. Best move was Qb6. } (15... Qb6) 16. Nd6+ Ke7?! { (16.11 → Mate in 7) Checkmate is now unavoidable. Best move was Kd8. } (16... Kd8 17. Nxf7+ Ke7 18. Nxh8 Qb6 19. Qxh5 Nf6 20. Qg5 Kf8 21. Qg6 Ke7 22. Qg5 Kf8 23. Qg6) 17. Rxf7+ Kxd6 18. Nb5+ Kc5 19. Qd6+?! { (Mate in 2 → Mate in 4) Not the best checkmate sequence. Best move was Qd4+. } (19. Qd4+ Kc6 20. Qd6#) 19... Kxc4 20. Na3+?! { (Mate in 4 → Mate in 4) Not the best checkmate sequence. Best move was Rf4+. } (20. Rf4+ Kxb5 21. a4+ Ka5 22. Qc5+ b5 23. Qc7#) 20... Kxc3 21. Rf3# { Black is checkmated } 1-0`

/* eslint-disable */
xdescribe('playground', () => {
	it('test', async () => {
	// it.only('test', async () => {
		const engine = new Engine(enginePath)
		const res = await engine.chain().init().go({depth: 3})
		console.log(res);
	})

	it('evaluator', async () => {
		const engine = new Engine(enginePath)
		const game = new Chess()
		game.load_pgn(game1)
		let gmoves = game.history({verbose: true})
		.map(move => {
			let str = `${move.from}${move.to}`
			if( move.promotion ) str += move.promotion
			return str
		})
		const wat = await Evaluator.evaluate(engine, gmoves, {reverse:false, depth:12})
		// console.log(wat);
		wat.map(hm => {
			console.log('---');
			console.log(hm);
		})
	})

	it('chain analysis', async () => {
		const engine = new Engine(enginePath)
		const chain = engine.chain()
		await chain
		.init()
		.ucinewgame()
		.exec()
		const evals = await Promise.mapSeries(moves, (move, i) => {
			const sliceIndex = reverse ? moves.length-i : i+1
			return chain
			.position('startpos', moves.slice(0, sliceIndex))
			.go({depth})
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
