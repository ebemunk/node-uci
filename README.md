# node-uci
[Universal Chess Interface](http://www.shredderchess.com/chess-info/features/uci-universal-chess-interface.html) for node.js

[![bitHound Overall Score](https://www.bithound.io/github/ebemunk/node-uci/badges/score.svg)](https://www.bithound.io/github/ebemunk/node-uci)
[![Build Status](https://travis-ci.org/ebemunk/node-uci.svg?branch=master)](https://travis-ci.org/ebemunk/node-uci)
[![Code Climate](https://codeclimate.com/github/ebemunk/node-uci/badges/gpa.svg)](https://codeclimate.com/github/ebemunk/node-uci)
[![Test Coverage](https://codeclimate.com/github/ebemunk/node-uci/badges/coverage.svg)](https://codeclimate.com/github/ebemunk/node-uci/coverage)

### work in progress

## supported commands
### to engine
- [x] uci
- [ ] debug
- [x] isready
- [x] setoption name [value]
- [ ] register
- [x] ucinewgame
- [x] position
- [x] go (except infinite)
- [x] stop
- [x] ponderhit
- [x] quit

### from engine
- [x] id
- [x] uciok
- [x] readyok
- [x] bestmove [ ponder]
- [ ] copyprotection
- [ ] registration
- [x] info
- [x] option
