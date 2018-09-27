mkdir tmp
mkdir engines
#stockfish
curl https://stockfish.s3.amazonaws.com/stockfish-9-linux.zip -o tmp/stockfish-9-linux.zip
unzip tmp/stockfish-9-linux.zip -d tmp/
mv tmp/stockfish-9-linux/Linux/stockfish-9-bmi2 engines/stockfish-9-64
#komodo
curl https://komodochess.com/pub/komodo-9.zip -o tmp/komodo-9.zip
unzip tmp/komodo-9.zip -d tmp/
mv tmp/komodo-9_9dd577/Linux/komodo-9.02-linux engines/komodo-9.02
