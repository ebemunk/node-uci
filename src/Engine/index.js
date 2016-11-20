import {spawn} from 'child_process'
import path from 'path'
import {EOL} from 'os'
import {EventEmitter} from 'events'

import Promise from 'bluebird'
import debug from 'debug'

import EngineChain from '../EngineChain'
import {
	goCommand,
	initReducer,
	goReducer,
  parseInfo,
  parseBestmove,
} from '../parseUtil'
import {REGEX} from '../const'

const log = debug('uci:Engine')
const engineLog = debug('uci:Engine:log')

function fromEngineLog(lines) {
	engineLog('from engine:', lines, EOL)
}

/**
 * Engine is a UCI interface between an engine executable (that understands UCI)
 * and itself. It abstracts away communication to the engine process by providing methods
 * for sending commands and mechanisms for parsing responses.
 *
 * It also has a chainable api ({@link EngineChain}) that allows for terse coding.
 *
 * Implements everything in the UCI protocol except debug and registration.
 *
 * ##### commands to engine
 * - ✓ uci
 * - ✗ debug
 * - ✓ isready
 * - ✓ setoption
 * - ✗ register
 * - ✓ ucinewgame
 * - ✓ position
 * - ✓ go
 * - ✓ stop
 * - ✓ ponderhit
 * - ✓ quit
 *
 * ##### responses from engine
 * - ✓ id
 * - ✓ uciok
 * - ✓ readyok
 * - ✓ bestmove [ ponder]
 * - ✗ copyprotection
 * - ✗ registration
 * - ✓ info
 * - ✓ option
 * @param {string} filePath - absolute path to engine executable
 * @example
 * const enginePath = '/some/place/here'
 * //async/await
 * const engine = new Engine(enginePath)
 * await engine.init()
 * await engine.setoption('MultiPV', '4')
 * await engine.isready()
 * console.log('engine ready', engine.id, engine.options)
 * const result = await engine.go({depth: 4})
 * console.log('result', result)
 * await engine.quit()
 *
 * //with chain api
 * const engine = new Engine(enginePath)
 * engine.chain()
 * .init()
 * .setoption('MultiPV', 3)
 * .position('r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3')
 * .go({depth: 15})
 * .then(result => {
 *   console.log('result', result)
 * })
 */
export default class Engine {
	/**
	 * Create a new Engine instance. At first the Engine is uninitialized;
	 * engine id and options are empty. It must be {@link #Engine#init}'ed.
	 * @param {string} filePath absolute path to engine executable
	 * @return {Engine} new {@link Engine} instance
	 * @example
	 * const engine = new Engine('/Users/derp/stockfish-64')
	 * console.log(typeof engine)
	 * // -> Engine
	 */
	constructor(filePath) {
		this.filePath = path.normalize(filePath)
		this.id = {
			name: null,
			author: null
		}
		this.options = new Map()
	}

	/**
	 * Retireve the proc buffer until condition is true.
	 * You shouldn't need to use this normally.
	 * @param {function(string)} condition a function that returns true at some point
	 * @return {promise<string[]>} array of strings containing buffer received from engine
	 * @example
	 * //async/await
	 * const lines = await myEngine.getBufferUntil(line => line === 'uciok')
	 *
	 * //promise
	 * myEngine.getBufferUntil(function(line) {
	 *   return line === 'uciok'
	 * })
	 * .then(function(lines) {
	 *   console.log('engine says', lines)
	 * })
	 */
	async getBufferUntil(condition) {
		const lines = []
		let listener
		let reject_ref
		const p = new Promise((resolve, reject) => {
			reject_ref = reject
			//listener gets new lines until condition is true
			listener = buffer => {
				buffer
				.split(/\r?\n/g)
				.filter(line => !!line.length)
				.forEach(line => {
					lines.push(line)
					if( condition(line) ) return resolve()
				})
			}
			this.proc.stdout.on('data', listener)
			//reject if something goes wrong during buffering
			this.proc.once('error', reject)
			this.proc.once('close', reject)
		})
		await p
		//cleanup
		this.proc.stdout.removeListener('data', listener)
		this.proc.removeListener('error', reject_ref)
		this.proc.removeListener('close', reject_ref)
		return lines
	}

	/**
	 * Writes command to engine process. Normally you shouldn't need to use this.
	 * Does not validate string, use with caution or engine may have undefined behavior.
	 * @param {string} command command to write to engine process' stdin
	 * @return {undefined} has no return value
	 */
	write(command) {
		this.proc.stdin.write(`${command}${EOL}`)
		engineLog('to engine:', command, EOL)
	}

	/**
	 * Returns a new {@link EngineChain} using this engine.
	 * @return {EngineChain} new instance of {@link EngineChain}
	 * @example
	 * const chain = myEngine.chain()
	 *
	 * //equivalent to
	 * const myEngine = new Engine(myPath)
	 * const chain = new EngineChain(myEngine)
	 */
	chain() {
		return new EngineChain(this)
	}

	/**
	 * Initializes the engine process and handshakes with the UCI protocol.
	 * When this is done, {@link #Engine#id} and {@link #Engine#options} are populated.
	 * @return {promise<Engine>} itself (the Engine instance)
	 * @throws {Error} if init() has already been called (i.e Engine.proc is defined)
	 * @example
	 * //async/await
	 * const engine = new Engine(somePath)
	 * await engine.init()
	 * //engine is initialized, do stuff...
	 *
	 * //promise
	 * var myEngine = new Engine(somePath)
	 * myEngine.init()
	 * .then(function (engine) {
	 *   //myEngine === engine
	 *   //do stuff
	 * })
	 */
	async init() {
		if( this.proc )
			throw new Error('cannot call "init()": already initialized')
		//set up spawn
		this.proc = spawn(this.filePath)
		this.proc.stdout.setEncoding('utf8')
		//log buffer from engine
		this.proc.stdout.on('data', fromEngineLog)
		//send command to engine
		this.write('uci')
		//parse lines
		const lines = await this.getBufferUntil(line => line === 'uciok')
		const {id, options} = lines.reduce(initReducer, {
			id: {},
			options: {}
		})
		//set id and options
		if( id ) this.id = id
		if( options ) {
			//put options to Map
			Object.keys(options).forEach(key => {
				this.options.set(key, options[key])
			})
		}
		return this
	}

	/**
	 * Sends a quit message to the engine process, and cleans up.
	 * @return {promise<Engine>} itself (the Engine instance)
	 * @throws {Error} if engine process is not running (i.e. Engine.proc is undefined)
	 */
	async quit() {
		if( ! this.proc )
			throw new Error('cannot call "quit()": engine process not running')
		//send quit cmd and resolve when closed
		await new Promise(resolve => {
			this.proc.on('close', resolve)
			this.write('quit')
		})
		//cleanup
		this.proc.stdout.removeListener('data', fromEngineLog)
		this.proc.removeAllListeners()
		delete this.proc
		return this
	}

	/**
	 * Sends UCI `isready` command to the engine. Promise resolves after `readyok` is received.
	 * @return {promise<Engine>} itself (the Engine instance)
	 * @throws {Error} if Engine process is not running
	 */
	async isready() {
		if( ! this.proc )
			throw new Error('cannot call "isready()": engine process not running')
		//send isready and wait for the response
		this.write('isready')
		await this.getBufferUntil(line => line === 'readyok')
		return this
	}

	/**
	 * Sends a command to engine process. Promise resolves after `readyok` is received.
	 * Some commands in the UCI protocol do not require responses (like `setoption`).
	 * So, to be sure, {@link Engine#isready} is invoked to determine when it's safe to continue.
	 * @param {string} cmd command to send to the engine process
	 * @return {promise<Engine>} itself (the Engine instance)
	 * @throws {Error} if engine process is not running
	 */
	async sendCmd(cmd) {
		if( ! this.proc )
			throw new Error(`cannot call "${cmd}()": engine process not running`)
		//send cmd to engine
		log('sendCmd', cmd)
		this.write(`${cmd}`)
		//return after ready - avoids pitfalls for commands
		//that dont return a response
		return this.isready()
	}

	/**
	 * Sends the `setoption` command for given option name and its value.
	 * Does not validate parameters.
	 * @param {string} name - name of the option property
	 * @param {string} [value] - value of the option
	 * @return {promise<Engine>} itself (the Engine instance)
	 * @throws {Error} if engine process is not running
	 * @example
	 * //async/await
	 * await myEngine.setoption('MultiPV', '3')
	 * await myEngine.setoption('Slow Mover', '400')
	 * console.log(myEngine.options)
	 * // -> output includes newly set options
	 *
	 * //promise
	 * myEngine.setoption('MultiPV', '3')
	 * .then(function (engine) {
	 *   return engine.setoption('Slow Mover', '400');
	 * })
	 * .then(function (engine) {
	 *   console.log(myEngine.options)
	 *   // -> output includes newly set options
	 * })
	 */
	async setoption(name, value) {
		//construct command
		let cmd = `name ${name}`
		if( value ) cmd += ` value ${value}`
		//send and wait for response
		await this.sendCmd(`setoption ${cmd}`)
		this.options.set(name, value)
		return this
	}

	/**
	 * Sends `ucinewgame` command to engine process.
	 * @return {promise<Engine>} itself (the Engine instance)
	 * @throws {Error} if engine process is not running
	 */
	async ucinewgame() {
		return this.sendCmd('ucinewgame')
	}

	/**
	 * Sends `ponderhit` command to engine process.
	 * @return {promise<Engine>} itself (the Engine instance)
	 * @throws {Error} if engine process is not running
	 */
	async ponderhit() {
		return this.sendCmd('ponderhit')
	}

	/**
	 * Sends `position` command to engine process.
	 * Does not validate inputs.
	 * @param {string} fen - can be `startpos` for start position, or `fen ...` for
	 * setting position via FEN
	 * @param {string[]} moves - moves (in engine notation) to append to the command
	 * @return {promise<Engine>} itself (the Engine instance)
	 * @throws {Error} if engine process is not running
	 */
	async position(fen, moves) {
		//can be startpos or fen string
		let cmd
		if( fen === 'startpos' ) {
			cmd = 'startpos'
		} else {
			cmd = `fen ${fen}`
		}
		//add moves if provided
		if( moves && moves.length ) {
			const movesStr = moves.join(' ')
			cmd += ` moves ${movesStr}`
		}
		//send to engine
		return this.sendCmd(`position ${cmd}`)
	}

	/**
	 * Sends the `go` command to the engine process. Returns after engine finds the best move.
	 * Does not validate options. Does not work for infinite search. For intinite search, see {@link #Engine#goInfinite}.
	 * Options have identical names as the UCI `go` options. See UCI protocol for information.
	 * On completion, it returns an object containing the `bestmove` and an array of `info` objects,
	 * these `info` objects have properties that correspond to the UCI protocol.
	 * @param {object} options - options
	 * @param {string[]} options.searchmoves - moves (in engine notation) to search for
	 * @param {boolean} options.ponder - ponder mode
	 * @param {number} options.wtime - wtime (integer > 0)
	 * @param {number} options.btime - btime (integer > 0)
	 * @param {number} options.winc - winc (integer > 0)
	 * @param {number} options.binc - binc (integer > 0)
	 * @param {number} options.movestogo - movestogo (integer > 0)
	 * @param {number} options.depth - depth (integer > 0)
	 * @param {number} options.nodes - nodes (integer > 0)
	 * @param {number} options.mate - mate (integer > 0)
	 * @param {number} options.movetime - movetime (integer > 0)
	 * @return {promise<{bestmove: string, info: string[]}>} result - `bestmove` string
	 * and array of chronologically-ordered `info` objects
	 * @throws {Error} if engine process is not running
	 * @throws {Error} if `infinite` is supplied in the options param
	 * @example
	 * //async/await
	 * const engine = new Engine(somePath)
	 * await engine.init()
	 * const result = await engine.go({depth: 3})
	 * console.log(result)
	 * // -> {bestmove: 'e2e4', info: [{depth: 1, seldepth: 1, nodes: 21,...}, ...]}
	 *
	 * //promise
	 * var myEngine = new Engine(somePath)
	 * myEngine.init()
	 * .then(function (engine) {
	 *   return engine.go({depth: 3})
	 * })
	 * .then(function (result) {
	 *   console.log(result)
	 *   // -> {bestmove: 'e2e4', info: [{depth: 1, seldepth: 1, nodes: 21,...}, ...]}
	 * })
	 */
	async go(options) {
		if( ! this.proc )
			throw new Error('cannot call "go()": engine process not running')
		if( options.infinite )
			throw new Error('go() does not support infinite search, use goInfinite()')
		//construct command and send
		const command = goCommand(options)
		this.write(command)
		//parse lines
		const lines = await this.getBufferUntil(line => REGEX.bestmove.test(line))
		const result = lines.reduce(goReducer, {
			bestmove: null,
			info: []
		})
		return result
	}

	/**
	 * Special case of {@link #Engine#go} with `infinite` search enabled.
	 * @param {object} options - options for search. see {@link #Engine#go} for details
	 * @return {EventEmitter} an EventEmitter that will emit `data` events with either
	 * `bestmove` string or `info` objects. {@link #Engine#stop} must be used to stop
	 * the search and receive the bestmove.
	 * @throws {Error} if engine process is not running
	 * @example
	 * //async/await
	 * const engine = new Engine(enginePath)
	 * await engine.init()
	 * await engine.isready()
	 * await engine.setoption('MultiPV', '3')
	 * const emitter = engine.goInfinite()
	 * emitter.on('data', a => {
	 *   console.log('data', a)s
	 * })
	 * setTimeout(async () => {
	 *   const bestmove = await engine.stop()
	 *   console.log('bestmove', bestmove)s
	 *   await engine.quit()
	 * }, 5000)
	 */
	goInfinite(options = {}) {
		if( ! this.proc )
			throw new Error('cannot call "goInfinite()": engine process not running')
		//set up emitter
		this.emitter = new EventEmitter()
		const listener = buffer => {
			buffer
			.split(/\r?\n/g)
			.filter(line => !!line.length)
			.forEach(line => {
				const info = parseInfo(line)
				if( info )
					return this.emitter.emit('data', info)
				const bestmove = parseBestmove(line)
				if( bestmove )
					return this.emitter.emit('data', bestmove)
			})
		}
		options.infinite = true
		const command = goCommand(options)
		this.proc.stdout.on('data', listener)
		this.emitter.on('stop', () => {
			this.proc.stdout.removeListener('data', listener)
		})
		this.write(command)
		return this.emitter
	}

	/**
	 * Sends `stop` command to the engine, for stopping an ongoing search. Engine will
	 * reply with the `bestmove`, which is returned, along with any other `info` lines.
	 * See {@link #Engine#goInfinite} for usage example.
	 * @return {promise<{bestmove: string, info: string[]}>} result - See {@link #Engine#go}
	 *
	 */
	async stop() {
		if( ! this.emitter )
			throw new Error('cannot call "stop()": goInfinite() is not in progress')
    //send the stop message & end goInfinite() listener
		this.write('stop')
		this.emitter.emit('stop')
		//same idea as go(), only we expect just bestmove line here
		const lines = await this.getBufferUntil(line => REGEX.bestmove.test(line))
		const result = lines.reduce(goReducer, {
			bestmove: null,
			info: []
		})
		return result
	}
}
