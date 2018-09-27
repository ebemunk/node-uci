import { Engine } from '../'
import Promise from 'bluebird'

const enginePaths = [
  //
  'engines/stockfish-9-64',
  'engines/komodo-9.02',
]

enginePaths.map(path => {
  describe(path, () => {
    describe('promise/async', () => {
      it('promise/async usage', async () => {
        const engine = new Engine(path)
        await engine.init()
        expect(engine.options).toMatchSnapshot()
        await engine.setoption('MultiPV', '4')
        expect(engine.options).toMatchSnapshot()
        const bm = await engine.go({ depth: 4 })
        expect(bm.bestmove).toBeDefined()
        expect(bm.info).toBeDefined()
        await engine.quit()
      })

      it('goinfinite usage', async () => {
        /* eslint-disable-next-line no-undef */
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000

        const engine = new Engine(path)
        await engine.init()
        engine.goInfinite()
        await Promise.delay(3000)
        const bm = await engine.stop()
        expect(bm.bestmove).toBeDefined()
        expect(bm.info).toBeDefined()
        await engine.quit()
      })
    })
  })

  describe('chain', () => {
    it('chain usage', async () => {
      const engine = new Engine(path)
      const bm = await engine
        .chain()
        .init()
        .setoption('MultiPV', 3)
        .position(
          'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
        )
        .go({ depth: 15 })

      expect(bm.bestmove).toBeDefined()
      expect(bm.info).toBeDefined()
      await engine.quit()
    })
  })
})
