/* eslint-disable no-console */

import { Engine } from '../'
import Promise from 'bluebird'

const enginePath = 'engines/stockfish-9-64'

describe('real engine', () => {
  describe('promise/async', () => {
    it('promise/async usage', async () => {
      const engine = new Engine(enginePath)
      await engine.init()
      expect(engine.options).toMatchSnapshot()
      await engine.setoption('MultiPV', '4')
      expect(engine.options).toMatchSnapshot()
      const go = await engine.go({ depth: 4 })
      expect(go).toBeDefined()
      await engine.quit()
    })

    it('goinfinite usage', async () => {
      /* eslint-disable-next-line no-undef */
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000

      const engine = new Engine(enginePath)
      await engine.init()
      engine.goInfinite()
      await Promise.delay(5000)
      const bm = await engine.stop()
      expect(bm.bestmove).toBeDefined()
      expect(bm.info).toBeDefined()
      await engine.quit()
    })
  })

  xdescribe('chain', () => {
    it('chain usage', done => {
      const engine = new Engine(enginePath)
      engine
        .chain()
        .init()
        .setoption('MultiPV', 3)
        .position(
          'r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
        )
        .go({ depth: 15 })
        .then(result => {
          console.log('FIN')
          console.log(result)
          done()
        })
        .catch(err => {
          console.log(err.stack)
        })
    })
  })
})
