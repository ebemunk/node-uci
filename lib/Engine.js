'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _keys = require('babel-runtime/core-js/object/keys');

var _keys2 = _interopRequireDefault(_keys);

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

var _listeners = require('./listeners');

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
		key: 'write',
		value: function write(command) {
			this.proc.stdin.write(command);
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
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
				var _this = this;

				var listener, p, _ref, id, options;

				return _regenerator2.default.wrap(function _callee$(_context) {
					while (1) {
						switch (_context.prev = _context.next) {
							case 0:
								if (!this.proc) {
									_context.next = 2;
									break;
								}

								throw new Error('cannot call "init()": already initialized');

							case 2:
								listener = void 0;
								p = new _bluebird2.default(function (resolve, reject) {
									_this.proc = (0, _child_process.spawn)(_this.filePath);
									_this.proc.stdout.setEncoding('utf8');
									_this.proc.on('close', reject).on('error', reject);
									_this.proc.stdout.on('data', fromEngineLog);

									listener = (0, _listeners.createListener)(_listeners.initListener, resolve, reject);
									_this.proc.stdout.on('data', listener);

									_this.write('uci' + _os.EOL);
								});
								_context.next = 6;
								return p;

							case 6:
								_ref = _context.sent;
								id = _ref.id;
								options = _ref.options;

								if (id) this.id = id;
								if (options) {
									(0, _keys2.default)(options).forEach(function (key) {
										_this.options.set(key, options[key]);
									});
								}

								this.proc.stdout.removeListener('data', listener);

								return _context.abrupt('return', this);

							case 13:
							case 'end':
								return _context.stop();
						}
					}
				}, _callee, this);
			}));

			function init() {
				return ref.apply(this, arguments);
			}

			return init;
		}()
	}, {
		key: 'quit',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
				var _this2 = this;

				var p;
				return _regenerator2.default.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								if (this.proc) {
									_context2.next = 2;
									break;
								}

								throw new Error('cannot call "quit()": engine process not running');

							case 2:
								p = new _bluebird2.default(function (resolve) {
									_this2.proc.on('close', resolve);
									_this2.write('quit' + _os.EOL);
								});
								_context2.next = 5;
								return p;

							case 5:
								this.proc.stdout.removeListener('data', fromEngineLog);
								this.proc.removeAllListeners();
								delete this.proc;

								return _context2.abrupt('return', this);

							case 9:
							case 'end':
								return _context2.stop();
						}
					}
				}, _callee2, this);
			}));

			function quit() {
				return ref.apply(this, arguments);
			}

			return quit;
		}()
	}, {
		key: 'isready',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
				var _this3 = this;

				var listener, p;
				return _regenerator2.default.wrap(function _callee3$(_context3) {
					while (1) {
						switch (_context3.prev = _context3.next) {
							case 0:
								if (this.proc) {
									_context3.next = 2;
									break;
								}

								throw new Error('cannot call "isready()": engine process not running');

							case 2:
								listener = void 0;
								p = new _bluebird2.default(function (resolve, reject) {
									listener = (0, _listeners.createListener)(_listeners.isreadyListener, resolve, reject);
									_this3.proc.stdout.once('data', listener);
									_this3.write('isready' + _os.EOL);

									resolve(_this3);
								});
								return _context3.abrupt('return', p);

							case 5:
							case 'end':
								return _context3.stop();
						}
					}
				}, _callee3, this);
			}));

			function isready() {
				return ref.apply(this, arguments);
			}

			return isready;
		}()
	}, {
		key: 'sendCmd',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(cmd) {
				return _regenerator2.default.wrap(function _callee4$(_context4) {
					while (1) {
						switch (_context4.prev = _context4.next) {
							case 0:
								if (this.proc) {
									_context4.next = 2;
									break;
								}

								throw new Error('cannot call "' + cmd + '()": engine process not running');

							case 2:

								log('sendCmd', cmd);
								this.write('' + cmd + _os.EOL);

								return _context4.abrupt('return', this.isready());

							case 5:
							case 'end':
								return _context4.stop();
						}
					}
				}, _callee4, this);
			}));

			function sendCmd(_x) {
				return ref.apply(this, arguments);
			}

			return sendCmd;
		}()
	}, {
		key: 'setoption',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(name, value) {
				var _this4 = this;

				var cmd;
				return _regenerator2.default.wrap(function _callee5$(_context5) {
					while (1) {
						switch (_context5.prev = _context5.next) {
							case 0:
								cmd = 'name ' + name;

								if (value) cmd += ' value ' + value;

								return _context5.abrupt('return', this.sendCmd('setoption ' + cmd).then(function () {
									_this4.options.set(name, value);
									return _this4;
								}));

							case 3:
							case 'end':
								return _context5.stop();
						}
					}
				}, _callee5, this);
			}));

			function setoption(_x2, _x3) {
				return ref.apply(this, arguments);
			}

			return setoption;
		}()
	}, {
		key: 'ucinewgame',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6() {
				return _regenerator2.default.wrap(function _callee6$(_context6) {
					while (1) {
						switch (_context6.prev = _context6.next) {
							case 0:
								return _context6.abrupt('return', this.sendCmd('ucinewgame'));

							case 1:
							case 'end':
								return _context6.stop();
						}
					}
				}, _callee6, this);
			}));

			function ucinewgame() {
				return ref.apply(this, arguments);
			}

			return ucinewgame;
		}()
	}, {
		key: 'ponderhit',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee7() {
				return _regenerator2.default.wrap(function _callee7$(_context7) {
					while (1) {
						switch (_context7.prev = _context7.next) {
							case 0:
								return _context7.abrupt('return', this.sendCmd('ponderhit'));

							case 1:
							case 'end':
								return _context7.stop();
						}
					}
				}, _callee7, this);
			}));

			function ponderhit() {
				return ref.apply(this, arguments);
			}

			return ponderhit;
		}()
	}, {
		key: 'position',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8(fen, moves) {
				var cmd, movesStr;
				return _regenerator2.default.wrap(function _callee8$(_context8) {
					while (1) {
						switch (_context8.prev = _context8.next) {
							case 0:
								cmd = void 0;

								if (fen === 'startpos') {
									cmd = 'startpos';
								} else {
									cmd = 'fen ' + fen;
								}

								if (moves && moves.length) {
									movesStr = moves.join(' ');

									cmd += ' moves ' + movesStr;
								}

								return _context8.abrupt('return', this.sendCmd('position ' + cmd));

							case 4:
							case 'end':
								return _context8.stop();
						}
					}
				}, _callee8, this);
			}));

			function position(_x4, _x5) {
				return ref.apply(this, arguments);
			}

			return position;
		}()
	}, {
		key: 'go',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9() {
				var _this5 = this;

				var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
				var listener, result;
				return _regenerator2.default.wrap(function _callee9$(_context9) {
					while (1) {
						switch (_context9.prev = _context9.next) {
							case 0:
								if (this.proc) {
									_context9.next = 2;
									break;
								}

								throw new Error('cannot call "go()": engine process not running');

							case 2:
								if (!options.infinite) {
									_context9.next = 4;
									break;
								}

								throw new Error('go() does not support infinite search, use goInfinite()');

							case 4:
								listener = void 0;
								_context9.next = 7;
								return new _bluebird2.default(function (resolve, reject) {
									listener = (0, _listeners.createListener)(_listeners.goListener, resolve, reject);
									_this5.proc.stdout.on('data', listener);

									var command = (0, _parseUtil.goCommand)(options);
									_this5.write(command);
								});

							case 7:
								result = _context9.sent;


								//cleanup
								this.proc.stdout.removeListener('data', listener);
								return _context9.abrupt('return', result);

							case 10:
							case 'end':
								return _context9.stop();
						}
					}
				}, _callee9, this);
			}));

			function go(_x6) {
				return ref.apply(this, arguments);
			}

			return go;
		}()
	}, {
		key: 'goInfinite',
		value: function goInfinite() {
			var _this6 = this;

			var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			if (!this.proc) throw new Error('cannot call "goInfinite()": engine process not running');
			if (options.depth) throw new Error('goInfinite() does not support depth search, use go()');

			//set up emitter
			this.emitter = new _events.EventEmitter();
			var listener = function listener(buffer) {
				var lines = (0, _parseUtil.getLines)(buffer);
				lines.forEach(function (line) {
					var info = (0, _parseUtil.parseInfo)(line);
					if (info) return _this6.emitter.emit('data', info);
					var bestmove = (0, _parseUtil.parseBestmove)(line);
					if (bestmove) return _this6.emitter.emit('data', bestmove);
				});
			};
			options.infinite = true;
			var command = (0, _parseUtil.goCommand)(options);
			this.proc.stdout.on('data', listener);
			this.emitter.on('stop', function () {
				_this6.proc.stdout.removeListener('data', listener);
			});
			this.write(command);
			return this.emitter;
		}
	}, {
		key: 'stop',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee10() {
				var _this7 = this;

				var listener, result;
				return _regenerator2.default.wrap(function _callee10$(_context10) {
					while (1) {
						switch (_context10.prev = _context10.next) {
							case 0:
								if (this.emitter) {
									_context10.next = 2;
									break;
								}

								throw new Error('cannot call "stop()": goInfinite() is not in progress');

							case 2:
								listener = void 0;
								_context10.next = 5;
								return new _bluebird2.default(function (resolve, reject) {
									listener = (0, _listeners.createListener)(_listeners.goListener, resolve, reject);
									_this7.proc.stdout.on('data', listener);

									_this7.write('stop' + _os.EOL);
									_this7.emitter.emit('stop');
								});

							case 5:
								result = _context10.sent;


								//cleanup
								this.proc.stdout.removeListener('data', listener);
								return _context10.abrupt('return', result);

							case 8:
							case 'end':
								return _context10.stop();
						}
					}
				}, _callee10, this);
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