/* eslint-disable */
import _ from 'lodash'
import Promise from 'bluebird'
import debug from 'debug'

const log = debug('uci:TacticFinder')

export async function mapMateTree(engine, fen) {
  const ress = []
  await engine.setoption('MultiPV', 50)
  // await engine.setoption('Hash', 512)
  // await engine.setoption('Threads', 4)
  log('first search')
  const moves = [await getMatingMoves(engine, fen)]
  log('first search end')

  let MovesSearched = 0

  while (moves.length) {
    log('---------')
    log('analysing')
    log('moves', moves[0].join(' '))
    const curMove = moves[0]
    if (CACHE[curMove.join(' ')]) {
      ress.push(moves[0].join(' '))
      moves.shift()
      continue
    }
    MovesSearched++
    const result = await getMatingMoves(engine, fen, curMove)
    if (result.solution) {
      log('SOLUTION')
      ress.push(moves[0].join(' '))
      moves.shift()
      continue
    }
    const nextMoves = result.map(e => [...curMove, e])
    debugger
    moves.push(...nextMoves)
    moves.shift()
    log('---------')
    log()
  }

  console.log('MovesSearched', MovesSearched)

  return ress
}

const CACHE = {}

async function getMatingMoves(engine, fen, moves = []) {
  const depth = 14
  log('PURE')
  const { bestmove, info } = await engine
    .chain()
    .position(fen, moves)
    .go({ depth })
  log('PURE')

  log('  bestmove', bestmove)
  log('  infos', info.length)

  if (bestmove === '(none)') {
    return { solution: true }
  }

  const attackersTurn = moves.length % 2 === 0

  log('FILTER')
  const candidateMoves = _(info)
    .filter(inf => {
      return inf.depth === depth && _.get(inf, 'score.unit') === 'mate'
    })
    .filter(inf => {
      if (attackersTurn) {
        return inf.score.value > 0
      } else {
        return inf.score.value < 0
      }
    })
    .groupBy('multipv')
    .map(group => _.last(group))
    .sortBy('score.value')
    .value()
  log('FILTER')

  log(
    '  sorted candidates',
    _.take(candidateMoves, 3).map(c => ({ pv: c.pv, score: c.score })),
  )
  log('  sorted len', candidateMoves.length)

  if (!candidateMoves.length) {
    return []
  }

  const threshold = _.minBy(candidateMoves, 'score.value').score.value

  log('  threshold', threshold)

  const filtered = _(candidateMoves)
    .filter(c => {
      return attackersTurn ? c.score.value <= threshold : true
    })
    .tap(a => {
      // a.map(e => CACHE.push(`${moves.join(' ')} ${e.pv}`))
      a.map(e => {
        CACHE[`${moves.join(' ')} ${e.pv}`] = true
      })
    })
    .map(c => c.pv.split(' ')[0])
    .value()
  debugger
  log('  filtered len', filtered.length, filtered)

  return filtered
}
