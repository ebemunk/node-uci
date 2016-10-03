# node-uci
node-uci is an implementation of the [Universal Chess Interface](http://www.shredderchess.com/chess-info/features/uci-universal-chess-interface.html) protocol for node.js. In short, you can talk to engines (like Stockfish, Rybka, etc.) from node.js without any headaches. Abstracts away the pesky communication and parsing of UCI and provides a sane API to communicate with engines.

[![bitHound Overall Score](https://www.bithound.io/github/ebemunk/node-uci/badges/score.svg)](https://www.bithound.io/github/ebemunk/node-uci)
[![Build Status](https://travis-ci.org/ebemunk/node-uci.svg?branch=master)](https://travis-ci.org/ebemunk/node-uci)
[![Code Climate](https://codeclimate.com/github/ebemunk/node-uci/badges/gpa.svg)](https://codeclimate.com/github/ebemunk/node-uci)
[![Test Coverage](https://codeclimate.com/github/ebemunk/node-uci/badges/coverage.svg)](https://codeclimate.com/github/ebemunk/node-uci/coverage)

## Install
Through npm with `npm install node-uci`.

## Usage / Docs
[Usage examples and documentation](https://ebemunk.github.io/node-uci/)

## TLDR;
```javascript
import {Engine} from 'node-uci'
// or
const Engine = require('node-uci').Engine

// async/await
const engine = new Engine('engine/executable/path')
await engine.init()
await engine.setoption('MultiPV', '4')
await engine.isready()
console.log('engine ready', engine.id, engine.options)
const result = await engine.go({nodes: 2500000})
console.log('result', result);
await engine.quit()

//promises with chain
const engine = new Engine('engine/executable/path')
engine.chain()
.init()
.setoption('MultiPV', 3)
.position('r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3')
.go({depth: 15})
.then(result => {
	console.log(result);
})
```

## License
MIT

## Contribute
PRs always welcome
