'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.evaluate = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var evaluate = exports.evaluate = function () {
	var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee(engine, moves) {
		var _ref2 = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

		var _ref2$reverse = _ref2.reverse;
		var reverse = _ref2$reverse === undefined ? true : _ref2$reverse;
		var _ref2$depth = _ref2.depth;
		var depth = _ref2$depth === undefined ? 12 : _ref2$depth;
		var chain, evals, annotations, final;
		return _regenerator2.default.wrap(function _callee$(_context) {
			while (1) {
				switch (_context.prev = _context.next) {
					case 0:
						chain = engine.chain();
						_context.next = 3;
						return chain.init().ucinewgame().exec();

					case 3:
						//add startpos
						moves.unshift('');
						_context.next = 6;
						return _bluebird2.default.mapSeries(moves, function (move, i) {
							var sliceIndex = reverse ? moves.length - i : i + 1;
							return chain.position('startpos', moves.slice(0, sliceIndex)).go({ depth: depth });
						});

					case 6:
						evals = _context.sent;

						//annotations
						annotations = evals
						//extract & normalize scores
						.map(function (moveEval, i) {
							var info = _lodash2.default.last(moveEval.info);
							//change the sign of evals for black
							//because score comes relative to the side to play
							//we want to fix eval to white's perspective (+ white, - black)
							if (i % 2 === 1) {
								info.score.value *= -1;
							}
							if (info.score.unit === 'mate') {
								info.score.value *= 1000;
							}
							return _lodash2.default.pick(info, 'score', 'pv');
						})
						//associate evals with moves
						.map(function (moveEval, i, arr) {
							if (i === 0) return;
							var prev = arr[i - 1];
							return {
								beforeEval: prev.score,
								afterEval: moveEval.score,
								move: moveEval.move,
								pv: prev.pv
							};
						}).filter(function (el, i) {
							return i !== 0;
						}).map(function (moveEval) {
							//walked into mate
							if (moveEval.beforeEval.unit === 'cp' && moveEval.afterEval.unit === 'mate') {
								moveEval.matemissed = true;
							}
							//escaped from mate
							if (moveEval.beforeEval.unit === 'mate' && moveEval.afterEval.unit === 'cp') {
								moveEval.mateescaped = true;
							}
							//delta
							var delta = moveEval.afterEval.value - moveEval.beforeEval.value;
							moveEval.delta = delta;
							return moveEval;
						});
						//remove startpos

						moves.shift();
						final = _lodash2.default.zipWith(moves, annotations, function (m, e) {
							return (0, _extends3.default)({}, e, {
								move: m
							});
						});
						_context.next = 12;
						return engine.quit();

					case 12:
						return _context.abrupt('return', final);

					case 13:
					case 'end':
						return _context.stop();
				}
			}
		}, _callee, this);
	}));

	return function evaluate(_x, _x2, _x3) {
		return _ref.apply(this, arguments);
	};
}();

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }