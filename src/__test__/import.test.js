const { Engine, EngineChain } = require('../../lib')

it('exports', () => {
  expect(Engine).toMatchSnapshot()
  expect(EngineChain).toMatchSnapshot()
})
