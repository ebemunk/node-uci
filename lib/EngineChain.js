'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)('uci:EngineChain');

var CHAINABLE = ['init', 'isready', 'ucinewgame', 'quit', 'position', 'go'];

var EngineChain = function () {
	function EngineChain(engine) {
		var _this = this;

		(0, _classCallCheck3.default)(this, EngineChain);

		log('chain init');
		this._engine = engine;
		this._queue = [];

		CHAINABLE.forEach(function (fn) {
			_this[fn] = _this.chain(fn);
		});
	}

	(0, _createClass3.default)(EngineChain, [{
		key: 'chain',
		value: function chain(fn) {
			var _this2 = this;

			return function () {
				var _context;

				var p = (_context = _this2._engine)[fn].bind(_context);
				_this2._queue.push(p);
				return _this2;
			};
		}
	}, {
		key: 'commit',
		value: function commit() {
			var _this3 = this;

			return _bluebird2.default.mapSeries(this._queue, function (fn) {
				return fn();
			}).then(function () {
				return _this3._engine;
			});
		}
	}]);
	return EngineChain;
}();

exports.default = EngineChain;