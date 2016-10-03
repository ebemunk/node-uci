# ideas

- mistake types
	- `INACCURACY` > 0.3
	- `MISTAKE` > 1.5
	- `BLUNDER` > 3

- mate detection
	- `WALKED_INTO_CHECKMATE` - i make a move and put myself into mate position
	- `LONGER_CHECKMATE` - i make a move but checkmate takes longer
	- `LOST_CHECKMATE` - lost forced mate chance
	- `NOT_BEST_DEFENSE` - shortened a longer mate sequence

- browser support via stockfishjs, garbochess etc?

# tactic extraction
https://en.lichess.org/blog/U4sjakQAAEAAhH9d/how-training-puzzles-are-generated


from http://deniz.dizman.org/Projects/TactixChessTacticsGenerator
```
Go a maximum of 6 moves (12 plies) deep during searching. 6 moves deep is very challenging even for masters of the game.
if the last move was not a capture
if the last move was not a check
if the last move was not a mate in X move
if the opponent would pass, a capture would not be made
```
