'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _map = require('babel-runtime/core-js/map');

var _map2 = _interopRequireDefault(_map);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _child_process = require('child_process');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _os = require('os');

var _events = require('events');

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _EngineChain = require('./EngineChain');

var _EngineChain2 = _interopRequireDefault(_EngineChain);

var _parseUtil = require('./parseUtil');

var _const = require('./const');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)('uci:Engine');
var engineLog = (0, _debug2.default)('uci:Engine:log');

function fromEngineLog(lines) {
	engineLog('from engine:', lines, _os.EOL);
}

var Engine = function () {
	function Engine(filePath) {
		(0, _classCallCheck3.default)(this, Engine);

		this.filePath = _path2.default.normalize(filePath);
		this.id = {
			name: null,
			author: null
		};
		this.options = new _map2.default();
	}

	(0, _createClass3.default)(Engine, [{
		key: 'getBufferUntil',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(condition) {
				var _this = this;

				var lines, listener, p;
				return _regenerator2.default.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								lines = [];
								listener = void 0;
								p = new _bluebird2.default(function (resolve, reject) {
									//listener gets new lines until condition is true
									listener = function listener(buffer) {
										buffer.split(/\r?\n/g).filter(function (line) {
											return !!line.length;
										}).forEach(function (line) {
											lines.push(line);
											if (condition(line)) return resolve();
										});
									};
									_this.proc.stdout.on('data', listener);
									//reject if something goes wrong during buffering
									_this.proc.once('error', reject);
									_this.proc.once('close', reject);
								});
								_context.next = 5;
								return p;

							case 5:
								//cleanup
								this.proc.stdout.removeListener('data', listener);
								return _context.abrupt('return', lines);

							case 7:
							case 'end':
								return _context.stop();
						}
					}
				}, _callee, this);
			}));

			function getBufferUntil(_x) {
				return ref.apply(this, arguments);
			}

			return getBufferUntil;
		}()
	}, {
		key: 'write',
		value: function write(command) {
			this.proc.stdin.write('' + command + _os.EOL);
			engineLog('to engine:', command, _os.EOL);
		}
	}, {
		key: 'chain',
		value: function chain() {
			return new _EngineChain2.default(this);
		}
	}, {
		key: 'init',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
				var _this2 = this;

				var lines, _lines$reduce, id, options;

				return _regenerator2.default.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								if (!this.proc) {
									_context2.next = 2;
									break;
								}

								throw new Error('cannot call "init()": already initialized');

							case 2:
								//set up spawn
								this.proc = (0, _child_process.spawn)(this.filePath);
								this.proc.stdout.setEncoding('utf8');
								//log buffer from engine
								this.proc.stdout.on('data', fromEngineLog);
								//send command to engine
								this.write('uci');
								//parse lines
								_context2.next = 8;
								return this.getBufferUntil(function (line) {
									return line === 'uciok';
								});

							case 8:
								lines = _context2.sent;
								_lines$reduce = lines.reduce(_parseUtil.initReducer, {
									id: {},
									options: {}
								});
								id = _lines$reduce.id;
								options = _lines$reduce.options;
								//set id and options

								if (id) this.id = id;
								if (options) {
									//put options to Map
									(0, _keys2.default)(options).forEach(function (key) {
										_this2.options.set(key, options[key]);
									});
								}
								return _context2.abrupt('return', this);

							case 15:
							case 'end':
								return _context2.stop();
						}
					}
				}, _callee2, this);
			}));

			function init() {
				return ref.apply(this, arguments);
			}

			return init;
		}()
	}, {
		key: 'quit',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
				var _this3 = this;

				return _regenerator2.default.wrap(function _callee3$(_context3) {
					while (1) {
						switch (_context3.prev = _context3.next) {
							case 0:
								if (this.proc) {
									_context3.next = 2;
									break;
								}

								throw new Error('cannot call "quit()": engine process not running');

							case 2:
								_context3.next = 4;
								return new _bluebird2.default(function (resolve) {
									_this3.proc.on('close', resolve);
									_this3.write('quit');
								});

							case 4:
								//cleanup
								this.proc.stdout.removeListener('data', fromEngineLog);
								this.proc.removeAllListeners();
								delete this.proc;
								return _context3.abrupt('return', this);

							case 8:
							case 'end':
								return _context3.stop();
						}
					}
				}, _callee3, this);
			}));

			function quit() {
				return ref.apply(this, arguments);
			}

			return quit;
		}()
	}, {
		key: 'isready',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4() {
				return _regenerator2.default.wrap(function _callee4$(_context4) {
					while (1) {
						switch (_context4.prev = _context4.next) {
							case 0:
								if (this.proc) {
									_context4.next = 2;
									break;
								}

								throw new Error('cannot call "isready()": engine process not running');

							case 2:
								//send isready and wait for the response
								this.write('isready');
								_context4.next = 5;
								return this.getBufferUntil(function (line) {
									return line === 'readyok';
								});

							case 5:
								return _context4.abrupt('return', this);

							case 6:
							case 'end':
								return _context4.stop();
						}
					}
				}, _callee4, this);
			}));

			function isready() {
				return ref.apply(this, arguments);
			}

			return isready;
		}()
	}, {
		key: 'sendCmd',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(cmd) {
				return _regenerator2.default.wrap(function _callee5$(_context5) {
					while (1) {
						switch (_context5.prev = _context5.next) {
							case 0:
								if (this.proc) {
									_context5.next = 2;
									break;
								}

								throw new Error('cannot call "' + cmd + '()": engine process not running');

							case 2:
								//send cmd to engine
								log('sendCmd', cmd);
								this.write('' + cmd);
								//return after ready - avoids pitfalls for commands
								//that dont return a response
								return _context5.abrupt('return', this.isready());

							case 5:
							case 'end':
								return _context5.stop();
						}
					}
				}, _callee5, this);
			}));

			function sendCmd(_x2) {
				return ref.apply(this, arguments);
			}

			return sendCmd;
		}()
	}, {
		key: 'setoption',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6(name, value) {
				var cmd;
				return _regenerator2.default.wrap(function _callee6$(_context6) {
					while (1) {
						switch (_context6.prev = _context6.next) {
							case 0:
								//construct command
								cmd = 'name ' + name;

								if (value) cmd += ' value ' + value;
								//send and wait for response
								_context6.next = 4;
								return this.sendCmd('setoption ' + cmd);

							case 4:
								this.options.set(name, value);
								return _context6.abrupt('return', this);

							case 6:
							case 'end':
								return _context6.stop();
						}
					}
				}, _callee6, this);
			}));

			function setoption(_x3, _x4) {
				return ref.apply(this, arguments);
			}

			return setoption;
		}()
	}, {
		key: 'ucinewgame',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7() {
				return _regenerator2.default.wrap(function _callee7$(_context7) {
					while (1) {
						switch (_context7.prev = _context7.next) {
							case 0:
								return _context7.abrupt('return', this.sendCmd('ucinewgame'));

							case 1:
							case 'end':
								return _context7.stop();
						}
					}
				}, _callee7, this);
			}));

			function ucinewgame() {
				return ref.apply(this, arguments);
			}

			return ucinewgame;
		}()
	}, {
		key: 'ponderhit',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8() {
				return _regenerator2.default.wrap(function _callee8$(_context8) {
					while (1) {
						switch (_context8.prev = _context8.next) {
							case 0:
								return _context8.abrupt('return', this.sendCmd('ponderhit'));

							case 1:
							case 'end':
								return _context8.stop();
						}
					}
				}, _callee8, this);
			}));

			function ponderhit() {
				return ref.apply(this, arguments);
			}

			return ponderhit;
		}()
	}, {
		key: 'position',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9(fen, moves) {
				var cmd, movesStr;
				return _regenerator2.default.wrap(function _callee9$(_context9) {
					while (1) {
						switch (_context9.prev = _context9.next) {
							case 0:
								//can be startpos or fen string
								cmd = void 0;

								if (fen === 'startpos') {
									cmd = 'startpos';
								} else {
									cmd = 'fen ' + fen;
								}
								//add moves if provided
								if (moves && moves.length) {
									movesStr = moves.join(' ');

									cmd += ' moves ' + movesStr;
								}
								//send to engine
								return _context9.abrupt('return', this.sendCmd('position ' + cmd));

							case 4:
							case 'end':
								return _context9.stop();
						}
					}
				}, _callee9, this);
			}));

			function position(_x5, _x6) {
				return ref.apply(this, arguments);
			}

			return position;
		}()
	}, {
		key: 'go',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee10(options) {
				var command, lines, result;
				return _regenerator2.default.wrap(function _callee10$(_context10) {
					while (1) {
						switch (_context10.prev = _context10.next) {
							case 0:
								if (this.proc) {
									_context10.next = 2;
									break;
								}

								throw new Error('cannot call "go()": engine process not running');

							case 2:
								if (!options.infinite) {
									_context10.next = 4;
									break;
								}

								throw new Error('go() does not support infinite search, use goInfinite()');

							case 4:
								//construct command and send
								command = (0, _parseUtil.goCommand)(options);

								this.write(command);
								//parse lines
								_context10.next = 8;
								return this.getBufferUntil(function (line) {
									return _const.REGEX.bestmove.test(line);
								});

							case 8:
								lines = _context10.sent;
								result = lines.reduce(_parseUtil.goReducer, {
									bestmove: null,
									info: []
								});
								return _context10.abrupt('return', result);

							case 11:
							case 'end':
								return _context10.stop();
						}
					}
				}, _callee10, this);
			}));

			function go(_x7) {
				return ref.apply(this, arguments);
			}

			return go;
		}()
	}, {
		key: 'goInfinite',
		value: function goInfinite() {
			var _this4 = this;

			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			if (!this.proc) throw new Error('cannot call "goInfinite()": engine process not running');
			if (options.depth) throw new Error('goInfinite() does not support depth search, use go()');
			//set up emitter
			this.emitter = new _events.EventEmitter();
			var listener = function listener(buffer) {
				buffer.split(/\r?\n/g).filter(function (line) {
					return !!line.length;
				}).forEach(function (line) {
					var info = (0, _parseUtil.parseInfo)(line);
					if (info) return _this4.emitter.emit('data', info);
					var bestmove = (0, _parseUtil.parseBestmove)(line);
					if (bestmove) return _this4.emitter.emit('data', bestmove);
				});
			};
			options.infinite = true;
			var command = (0, _parseUtil.goCommand)(options);
			this.proc.stdout.on('data', listener);
			this.emitter.on('stop', function () {
				_this4.proc.stdout.removeListener('data', listener);
			});
			this.write(command);
			return this.emitter;
		}
	}, {
		key: 'stop',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee11() {
				var lines, result;
				return _regenerator2.default.wrap(function _callee11$(_context11) {
					while (1) {
						switch (_context11.prev = _context11.next) {
							case 0:
								if (this.emitter) {
									_context11.next = 2;
									break;
								}

								throw new Error('cannot call "stop()": goInfinite() is not in progress');

							case 2:
								//send the stop message & end goInfinite() listener
								this.write('stop');
								this.emitter.emit('stop');
								//same idea as go(), only we expect just bestmove line here
								_context11.next = 6;
								return this.getBufferUntil(function (line) {
									return _const.REGEX.bestmove.test(line);
								});

							case 6:
								lines = _context11.sent;
								result = lines.reduce(_parseUtil.goReducer, {
									bestmove: null,
									info: []
								});
								return _context11.abrupt('return', result);

							case 9:
							case 'end':
								return _context11.stop();
						}
					}
				}, _callee11, this);
			}));

			function stop() {
				return ref.apply(this, arguments);
			}

			return stop;
		}()
	}]);
	return Engine;
}();

exports.default = Engine;