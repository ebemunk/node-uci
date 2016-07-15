# node-uci
[Universal Chess Interface](http://www.shredderchess.com/chess-info/features/uci-universal-chess-interface.html) for node.js

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
