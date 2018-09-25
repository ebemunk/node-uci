mkdir tmp
curl https://stockfish.s3.amazonaws.com/stockfish-9-linux.zip -o tmp/stockfish-9-linux.zip
unzip tmp/stockfish-9-linux.zip -d tmp/
mkdir engines
mv tmp/stockfish-9-linux/Linux/stockfish-9-bmi2 engines/stockfish-9-64
