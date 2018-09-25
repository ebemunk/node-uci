/* eslint-disable */
import _ from 'lodash'
import Promise from 'bluebird'
// import { Chess } from 'chess.js'
import { writeFile } from 'fs'

import Engine from '../Engine'
import { mapMateTree } from '../Evaluation/Tactic'
// import { blundercheck } from '../src/blundercheck'

const enginePath = './engines/stockfish-9-64'

const moves = ['e2e4', 'e7e5', 'b1c3', 'b8c6', 'd2d3', 'd7d6']

async function getFromLichess(id) {
  // const url = `https://en.lichess.org/api/game/${id}`
  // const params = _({
  // 	with_moves: 1,
  // 	with_analysis: 1,
  // }).map((v,k) => `${k}=${v}`).join('&')
  // const fullUrl = `${url}?${params}`
  const url = `https://en.lichess.org/game/export/${id}.pgn`
  const res = await fetch(url, {
    headers: {
      'User-Agent': '',
    },
  })
  const json = await res.text()
  return json
}

xdescribe('playground', () => {
  // describe.only('playground', () => {
  const engine = new Engine(enginePath)

  beforeAll(async () => {
    await engine.init()
  })

  afterAll(async () => {
    await engine.quit()
  })

  it('playground', mate)

  async function mate() {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 50000

    const fen = 'B7/K1B1p1Q1/5r2/7p/1P1kp1bR/3P3R/1P1NP3/2n5 w - - 0 1' //mate in 2 simplest case
    // const fen = '8/6K1/1p1B1RB1/8/2Q5/2n1kP1N/3b4/4n3 w - - 0 1' //mate in 2
    // const fen = 'r1b3nr/1p1pkpp1/p2Np3/7p/2BN4/2P5/Pq4PP/R2Q1RK1 w - - 2 17'
    console.time('mapMateTree')
    const map = await mapMateTree(engine, fen)
    console.timeEnd('mapMateTree')
    console.log('results', map)
    console.log('yaya')
  }

  // async function annotation() {
  //   const pgn = await getFromLichess('DW2gu00D')
  //   const game = new Chess()
  //   game.load_pgn(pgn)
  //   let gmoves = game.history({ verbose: true }).map(move => {
  //     let str = `${move.from}${move.to}`
  //     if (move.promotion) str += move.promotion
  //     return str
  //   })
  //   const wat = await blundercheck(
  //     engine,
  //     gmoves,
  //     { reverse: true },
  //     { depth: 13 },
  //   )
  //   writeFile('wat.json', JSON.stringify(wat, null, 4))
  //   // console.log(wat);
  //   wat.map((hm, i) => {
  //     if (!hm.annotations.length) return
  //     console.log('---')
  //     console.log(hm)
  //     console.log('---')
  //   })
  // }
})
