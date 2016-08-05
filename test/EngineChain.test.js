import Engine from '../src'

/* eslint-disable */
// const enginePath = '/home/derpatron/Downloads/stockfish-7-linux/Linux/stockfish'
const enginePath = '/Users/bugrafirat/Downloads/stockfish-7-mac/Mac/stockfish-7-64'
describe.skip('yea', () => {
	it('should load it bro', async () => {
		// const game = new Chess()
		// game.load_pgn(pgn)

		// const engine = new Engine(enginePath)
		// const rez = await engine.init()
		// await engine.setoption('MultiPV', '4')
		// await engine.isready()
		//
		// console.log('engine ready', engine.id, engine.options)
		//
		// const go = await engine.go({depth: 15})
		// console.log('go', go);
		//
		// await engine.quit()

		const engine = new Engine(enginePath)
		await engine.init()
		await engine.isready()
    await engine.setoption('MultiPV', '3')
		const ee = engine.goInfinite()
		ee.on('data', a => {
			console.log(a);
		})
		setTimeout(async () => {
			console.log('stoppng');
			const bm = await engine.stop()
      console.log('bestmove', bm);
			await engine.quit()
		}, 5000)

		//ideal
		// const engine = new Engine(enginePath)
		//
		// const sad = await engine
		// .chain()
		// .init()
		// .isready()
		// .ucinewgame()
		// .quit()
		// .commit()
		// console.log('REZZZ',sad.options);
	})
})
