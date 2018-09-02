import { EOL } from 'os'

import Engine from '../'
import { syncify, engineInit } from '../../__test__/util'

jest.mock('child_process')
import { cpMock } from 'child_process'

describe('go', () => {
  it('should reject if infinite flag is set', async () => {
    const fn = await syncify(async () => {
      const e = await engineInit(cpMock)
      await e.go({ infinite: true })
    })

    expect(fn).toThrowError(/does not support infinite/)
  })

  it('should reject if process not running', async () => {
    const fn = await syncify(async () => {
      await new Engine('').go({ depth: 3 })
    })

    expect(fn).toThrow()
  })

  it('should ignore unparseable info lines', async () => {
    const engine = await engineInit(cpMock)
    let p = engine.go({ depth: 2 })
    cpMock.stdout.emit(
      'data',
      `info derpyherp 76 lolcakes 28${EOL}bestmove e2e4`,
    )
    p = await p

    expect(p).toMatchSnapshot()
  })

  it('should resolve bestmove object after "bestmove"', async () => {
    const engine = await engineInit(cpMock)
    let p = engine.go({ depth: 5 })
    cpMock.stdout.emit(
      'data',
      `info currmove e2e4${EOL}info tbhits 7 score mate 3${EOL}bestmove e2e4${EOL}`,
    )
    p = await p

    expect(p).toMatchSnapshot()
  })

  it('should include ponder result if available', async () => {
    const engine = await engineInit(cpMock)
    let p = engine.go({ depth: 5 })
    cpMock.stdout.emit('data', `bestmove e2e4 ponder e7e5${EOL}`)
    p = await p

    expect(p).toMatchSnapshot()
  })

  it('should remove listener after resolving', async () => {
    const engine = await engineInit(cpMock)
    let p = engine.go({ depth: 3 })
    cpMock.stdout.emit('data', `bestmove e2e4 ponder e7e5${EOL}`)
    await p

    expect(cpMock.stdout.listenerCount('on')).toBe(0)
  })

  it('should batch broken newlines - github issue #9', async () => {
    const engine = await engineInit(cpMock)
    let p = engine.go({ depth: 2 })
    cpMock.stdout.emit('data', 'info depth ')
    cpMock.stdout.emit('data', `16 tbhits 9 nps 333${EOL}bes`)
    cpMock.stdout.emit('data', 'tmove e2e4')
    p = await p

    expect(p).toMatchSnapshot()
  })
})
