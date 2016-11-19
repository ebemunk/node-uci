export default function goCommand(options) {
	let cmd = 'go'
	const commands = [
		'searchmoves', //[moves]
		'ponder', //bool
		'wtime', //msec
		'btime', //msec
		'winc', //msec
		'binc', //msec
		'movestogo', //>0
		'depth', //>0
		'nodes', //>0
		'mate', //>0
		'movetime', //msec
		'infinite' //bool
	]

	commands.forEach((command) => {
		if( ! options.hasOwnProperty(command) ) return
		switch( command ) {
			//array
			case 'searchmoves':
				if( options[command].length ) {
					cmd += ' searchmoves ' + options[command].join(' ')
				}
				break
			//bool
			case 'ponder':
			case 'infinite':
				if( options[command] ) {
					cmd += ` ${command}`
				}
				break
			//rest are >= 0
			default:
				if( options[command] >= 0 ) {
					cmd += ` ${command} ${options[command]}`
				}
		}
	})

	return `${cmd}`
}
