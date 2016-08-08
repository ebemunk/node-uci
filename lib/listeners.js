'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

exports.createListener = createListener;
exports.isreadyListener = isreadyListener;
exports.goListener = goListener;
exports.initListener = initListener;

var _os = require('os');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _const = require('./const');

var _parseUtil = require('./parseUtil');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)('uci:listeners');

//create a listener to parse lines from engine
function createListener(fn, resolve, reject) {
	return function (buffer) {
		var lines = (0, _parseUtil.getLines)(buffer);
		var result = {};
		var partialFn = _lodash2.default.partial(fn, resolve, reject, result);
		lines.forEach(partialFn);
	};
}

function isreadyListener(resolve, reject, result, line) {
	if (line === 'readyok') {
		resolve(true);
	} else {
		reject(new Error('unexpected line: expecting "readyok", got: "' + line + '"'));
	}
}

function goListener(resolve, reject, result, line) {
	//init result
	if (_lodash2.default.isEmpty(result)) {
		result.info = [];
	}
	var bestmove = (0, _parseUtil.parseBestmove)(line);
	if (bestmove) return resolve((0, _extends3.default)({}, result, bestmove));
	var info = (0, _parseUtil.parseInfo)(line);
	if (!_lodash2.default.isEmpty(info)) result.info.push(info);
}

function initListener(resolve, reject, result, line) {
	var cmdType = _lodash2.default.get(_const.REGEX.cmdType.exec(line), 1);
	if (!cmdType) {
		//couldn't parse, ignore
		log('init() ignoring:', line, _os.EOL);
		return;
	}

	switch (cmdType) {
		case 'id':
			try {
				var id = (0, _parseUtil.parseId)(line);
				_lodash2.default.set(result, 'id.' + id.key, id.value);
				log('id:', id, _os.EOL);
			} catch (err) {
				log('id: ignoring: parse error', _os.EOL);
			}
			break;
		case 'option':
			try {
				var option = (0, _parseUtil.parseOption)(line);
				_lodash2.default.set(result, 'options.' + option.key, option.value);
				log('option:', option, _os.EOL);
			} catch (err) {
				log('option: ignoring: parse error', _os.EOL);
			}
			break;
		case 'uciok':
			log('uciok');
			resolve(result);
			break;
	}
}