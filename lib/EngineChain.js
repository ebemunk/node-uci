'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _toConsumableArray2 = require('babel-runtime/helpers/toConsumableArray');

var _toConsumableArray3 = _interopRequireDefault(_toConsumableArray2);

var _slicedToArray2 = require('babel-runtime/helpers/slicedToArray');

var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _lodash = require('lodash');

var _Engine = require('./Engine');

var _Engine2 = _interopRequireDefault(_Engine);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)('uci:EngineChain');

var CHAINABLE = ['init', 'setoption', 'isready', 'ucinewgame', 'quit', 'position', 'go'];

var EngineChain = function () {
	function EngineChain(engine) {
		var _this = this;

		(0, _classCallCheck3.default)(this, EngineChain);

		if (!engine || !(engine instanceof _Engine2.default)) throw new Error('EngineChain requires a valid Engine.');
		//init
		log('chain init');
		this._engine = engine;
		this._queue = [];
		//construct chain functions
		CHAINABLE.forEach(function (funcName) {
			_this[funcName] = _this.chain(funcName);
		});
	}

	//returns a function which puts the Engine call and args in the queue


	(0, _createClass3.default)(EngineChain, [{
		key: 'chain',
		value: function chain(funcName) {
			var self = this;
			return function () {
				var _context;

				this._queue.push([(_context = self._engine)[funcName].bind(_context), [].concat(Array.prototype.slice.call(arguments))]);
				if (funcName === 'go') {
					return this.exec();
				} else {
					return this;
				}
			};
		}
	}, {
		key: 'exec',
		value: function () {
			var ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
				var results;
				return _regenerator2.default.wrap(function _callee$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								_context2.next = 2;
								return _bluebird2.default.map(this._queue, function (_ref) {
									var _ref2 = (0, _slicedToArray3.default)(_ref, 2);

									var fn = _ref2[0];
									var params = _ref2[1];

									return fn.apply(undefined, (0, _toConsumableArray3.default)(params));
								}, { concurrency: 1 });

							case 2:
								results = _context2.sent;

								this._queue = [];
								return _context2.abrupt('return', (0, _lodash.last)(results));

							case 5:
							case 'end':
								return _context2.stop();
						}
					}
				}, _callee, this);
			}));

			function exec() {
				return ref.apply(this, arguments);
			}

			return exec;
		}()
	}]);
	return EngineChain;
}();

exports.default = EngineChain;