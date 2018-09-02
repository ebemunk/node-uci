/* eslint-disable no-console */

//testing with real engines
import { Engine } from '../'

const komodoPath = 'engines/komodo-9.02-64-osx'

xdescribe('komodo issue', () => {
  const komodo = new Engine(komodoPath)

  afterEach(async () => {
    await komodo.quit()
  })

  it('does', async () => {
    // jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000
    try {
      console.log('star')
      const rez = await komodo
        .chain()
        .init()
        .setoption('Threads', 8)
        // .setoption('Hash', 8192)
        // // .setoption('SyzygyPath', syzygy)
        // .setoption('Ponder', 'false')
        .setoption('Minimal Reporting', 1)
        .position(
          'r1bqrnk1/1pp2ppp/3b4/2p1pN2/p3P1PP/3PBN2/PPPQ1P2/R3K2R b KQ - 0 14',
        )
        // .go({ movetime: 10000 })
        .go({ depth: 1 })

      console.log('rez', rez)
    } catch (e) {
      console.log('eroz', e)
    }
  })
})

/* eslint-disable */
xdescribe('real', () => {
  describe('promise/async', () => {
    it('promise/async usage', async () => {
      const engine = new Engine(enginePath)
      const rez = await engine.init()
      await engine.setoption('MultiPV', '4')
      await engine.isready()
      console.log('engine ready', engine.id, engine.options)
      const go = await engine.go({ depth: 4 })
      console.log('go', go)
      await engine.quit()
    })

    it('goinfinite usage', async () => {
      const engine = new Engine(enginePath)
      await engine.init()
      await engine.isready()
      await engine.setoption('MultiPV', '3')
      const ee = engine.goInfinite()
      ee.on('data', a => {
        console.log(a)
      })
      setTimeout(async () => {
        const bm = await engine.stop()
        console.log('bestmove', bm)
        await engine.quit()
      }, 5000)
    })
  })

  describe('chain', () => {
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
