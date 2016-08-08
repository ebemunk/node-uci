'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.getLines = getLines;
exports.goCommand = goCommand;
exports.parseInfo = parseInfo;
exports.parseBestmove = parseBestmove;
exports.parseId = parseId;
exports.parseOption = parseOption;

var _os = require('os');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _debug = require('debug');

var _debug2 = _interopRequireDefault(_debug);

var _const = require('./const');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var log = (0, _debug2.default)('uci:parseUtil');

//get a Buffer and split the newlines
function getLines(buffer) {
	var lines = buffer.split(/\r?\n/g).filter(function (line) {
		return !!line.length;
	});
	return lines;
}

//construct go command from options
function goCommand(options) {
	var cmd = 'go';
	var commands = ['searchmoves', //[moves]
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
	];

	commands.forEach(function (command) {
		if (!options.hasOwnProperty(command)) return;
		switch (command) {
			//array
			case 'searchmoves':
				if (options[command].length) {
					cmd += ' searchmoves ' + options[command].join(' ');
				}
				break;
			//bool
			case 'ponder':
			case 'infinite':
				if (options[command]) {
					cmd += ' ' + command;
				}
				break;
			//rest are >= 0
			default:
				if (options[command] >= 0) {
					cmd += ' ' + command + ' ' + options[command];
				}
		}
	});

	return '' + cmd + _os.EOL;
}

//parse an "info" command
function parseInfo(line) {
	log('parseInfo');
	log('line', line);
	var info = {};
	_lodash2.default.forEach(_const.REGEX.info, function (val, key) {
		var parsed = val.exec(line);
		if (!parsed) return;
		switch (key) {
			case 'score':
				info[key] = {
					unit: parsed[1],
					value: parseFloat(parsed[2])
				};
				break;
			default:
				if (_const.INFO_NUMBER_TYPES.includes(key)) {
					info[key] = parseFloat(parsed[1]);
				} else {
					info[key] = parsed[1];
				}
		}
	});
	log('info', info, _os.EOL);
	if (_lodash2.default.isEmpty(info)) {
		log('parseInfo cannot parse:', info, _os.EOL);
		return;
	}
	return info;
}

//parse "bestmove" command
function parseBestmove(line) {
	var bestmove = _const.REGEX.bestmove.exec(line);
	if (!bestmove || !bestmove[1]) return;
	var parsed = {
		bestmove: bestmove[1]
	};
	if (bestmove[2]) {
		parsed.ponder = bestmove[2];
	}
	return parsed;
}

//parse an "id" command
function parseId(line) {
	var parsed = _const.REGEX.id.exec(line);
	return {
		key: parsed[1],
		value: parsed[2]
	};
}

//parse an "option" command
function parseOption(line) {
	var parsed = _const.REGEX.option.exec(line);
	var option = {
		type: parsed[2]
	};

	switch (parsed[2]) {
		case 'check':
			option.default = parsed[3] === 'true';
			break;
		case 'spin':
			option.default = parseInt(parsed[3]);
			option.min = parseInt(parsed[4]);
			option.max = parseInt(parsed[5]);
			break;
		case 'combo':
			log(parsed);
			option.default = parsed[3];
			option.options = parsed[6].split(/ ?var ?/g);
			break; //combo breaker?
		case 'string':
			option.default = parsed[3];
			break;
		case 'button':
			//no other info
			break;
	}

	return {
		key: parsed[1],
		value: option
	};
}