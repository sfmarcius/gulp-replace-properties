/**!
 * Gulp plugin that replaces properties on text files, like the ant's filtering tool.
 * 
 * @author Marcius Fonseca
 */
"use strict";

const File = require("vinyl");
const applySourceMap = require("vinyl-sourcemaps-apply");
const dateformat = require("dateformat");
const { Transform } = require("readable-stream");
const SourceNode = require("source-map").SourceNode;

const LINE_MATCHER = /\n/gm;
const PROP_REGEX = /[a-zA-Z0-9_\\.\\-]+/;
const LOG_NONE = 0;
const LOG_SEVERE = 1;
const LOG_WARNING = 2;
const LOG_INFO = 3;
const LOG_SUCCESS = 4;
const LOG_FINE = 6;
const LOG_DEBUG = 8;
const LOG_ALL = 10;
const DEF_LOG_LEVEL = LOG_INFO;
const COLOR = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    gray: "\x1b[90m",
}

function isObject(val) {
    return Object.prototype.toString.call(val) === "[object Object]";
}
function getLogPreffix(type) {
    let time = dateformat(new Date(), "hh:MM:ss");
    let color = COLOR.reset;
    switch (type) {
        case "SEVERE": color = COLOR.red; break;
        case "WARNING": color = COLOR.yellow; break;
        case "SUCCESS": color = COLOR.green; break;
        case "FINE":
        case "DEBUG": color = COLOR.gray; break;
        default: type = "INFO"; color = COLOR.cyan; break;
    }
    return `${COLOR.reset}[${COLOR.gray}${time}${COLOR.reset}] ${color}${type}${COLOR.reset}`;
}
function logSevere(msg = "", options = { logLevel: DEF_LOG_LEVEL }) {
    if (options.logLevel >= LOG_SEVERE) { console.error(`${getLogPreffix("SEVERE")} - ${msg}`); }
}
function logWarn(msg = "", options = { logLevel: DEF_LOG_LEVEL }) {
    if (options.logLevel >= LOG_WARNING) { console.warn(`${getLogPreffix("WARNING")} - ${msg}`); }
}
function logSuccess(msg = "", options = { logLevel: DEF_LOG_LEVEL }) {
    if (options.logLevel >= LOG_SUCCESS) { console.log(`${getLogPreffix("SUCCESS")} - ${msg}`); }
}
function logInfo(msg = "", options = { logLevel: DEF_LOG_LEVEL }) {
    if (options.logLevel >= LOG_INFO) { console.info(`${getLogPreffix("INFO")} - ${msg}`); }
}
function logDebug(msg = "", options = { logLevel: DEF_LOG_LEVEL }) {
    if (options.logLevel >= LOG_DEBUG) { console.debug(`${getLogPreffix("DEBUG")} - ${msg}`); }
}
function _flatten(inputProps, outputProps = {}, preffix = "") {
    let _input = inputProps;
    if (!isObject(_input)) { _input = {}; }

    for (let name in _input) {
        if (_input.hasOwnProperty(name)) {
            let val = _input[name];
            let path = preffix ? `${preffix}.${name}` : name;
            if (isObject(val)) {
                _flatten(val, outputProps, path);
            } else {
                outputProps[`${path}`] = val;
            }
        }
    }
    return outputProps;
}
function _resolve(key, properties, options, chain = []) {
    if (!chain || !chain.length) chain = [key];
    let done = "";
    let remain = properties[key];
    let match;
    do {
        let re = getPropRegex(options);
        match = re.exec(remain);
        if (!match) {
            // simple prop with no references
            return done + remain;
        }
        let tgt = match[2];
        let newChain = chain.concat(tgt);
        if (chain.indexOf(tgt) >= 0) {
            // ciclic reference detected
            let err = new Error(`Ciclic reference found: [ '${COLOR.magenta}${newChain.join(`${COLOR.reset}' -> '${COLOR.magenta}`)}${COLOR.reset}' ]. Resolution of property '${COLOR.magenta}${newChain[0]}${COLOR.reset}' ignored.`);
            err.ciclic = true;
            throw err;
        }
        done += remain.substring(0, match.index);
        remain = remain.substring(match.index + match[0].length);
        if (properties.hasOwnProperty(tgt)) {
            done += _resolve(tgt, properties, options, newChain);
        } else {
            let msg = `Referenced property '${COLOR.magenta}${tgt}${COLOR.reset}' could not be resolved.`;
            if (options.failOnMissingProperties) {
                throw new Error(msg);
            } else {
                logWarn(`${msg} Resolving skipped.`, options);
                done += match[0];
            }
        }
    } while (match);
    return done + remain;
}
function initProperties(properties, options) {
    let now = new Date();
    let DEF_PROPERTIES = {
        "current.date": dateformat(now, options.dateFormat),
        "current.time": dateformat(now, options.timeFormat),
        "current.datetime": dateformat(now, options.datetimeFormat),
        "current.timestamp": dateformat(now, options.timestampFormat),
        "current.month": now.getMonth(),
        "current.monthname": dateformat(now, "mmmm"),
        "current.year": now.getFullYear()
    };
    properties = Object.assign({}, DEF_PROPERTIES, _flatten(properties));
    if (options.resolveProperties) {
        for (const key in properties) {
            if (properties.hasOwnProperty(key)) {
                let val;
                try {
                    val = _resolve(key, properties, options);
                    properties[key] = val;
                } catch (err) {
                    val = properties[key];
                    if (!err.ciclic || options.failOnCiclicProperties) {
                        throw err;
                    } else {
                        logWarn(err.message, options);
                    }
                }
            }
        }
    }
    if (!options.caseSensitive) {
        let tmp = {};
        for (const key in properties) {
            if (properties.hasOwnProperty(key)) {
                tmp[key.toLowerCase()] = properties[key]
            }
        }
        properties = tmp;
    }
    logDebug(`Properties in use: ${COLOR.magenta}${JSON.stringify(properties)}${COLOR.reset}`, options);
    return properties;
}
function initOptions(options = {}) {
    let DEF_OPTIONS = {
        enabled: true,
        startDelimiter: "#[[",
        endDelimiter: "]]",
        caseSensitive: true,
        dateFormat: "dd/mm/yyyy",
        timeFormat: "hh:MM:ss",
        datetimeFormat: "dd/mm/yyyy hh:MM:ss",
        timestampFormat: "yyyy_mm_dd-hh_MM_ss",
        logLevel: DEF_LOG_LEVEL,
        resolveProperties: true,
        failOnMissingProperties: false,
        failOnCiclicProperties: false,
    };
    options = Object.assign({}, DEF_OPTIONS, options)
    if (!options.startDelimiter) { throw new Error("startDelimiter not defined"); }
    if (!options.endDelimiter) { throw new Error("endDelimiter not defined"); }
    if (!options.dateFormat) { throw new Error("dateFormat not defined"); }
    if (!options.timeFormat) { throw new Error("timeFormat not defined"); }
    if (!options.datetimeFormat) { throw new Error("datetimeFormat not defined"); }
    if (!options.timestampFormat) { throw new Error("timestampFormat not defined"); }
    if (!options.hasOwnProperty("caseSensitive")) { options.caseSensitive = true; }
    if (!Number.isInteger(options.logLevel)) { options.logLevel = LOG_WARNING; }
    logDebug(`Options in use: ${COLOR.magenta}${JSON.stringify(options)}${COLOR.reset}`, options);
    return options;
}
function getPropRegex(options) {
    let start = options.startDelimiter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let end = options.endDelimiter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(${start})(${PROP_REGEX.source})(${end})`, options.caseSensitive ? "g" : "gi");
}
function getStrRegex(str, options) {
    let source = "";
    let flags = "";
    if (str.source) {
        source = str.source;
        flags = str.flags;
    } else {
        source = str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        flags = "g";
    }
    if (!options.caseSensitive && flags.indexOf("i") < 0) {
        flags += "i";
    }
    return new RegExp(source, flags);
}
class Position {
    constructor(file, line, column) {
        this.file = file;
        this.line = line || 1;
        this.column = column || 0;
    }
    // Advance in the file to move the cursor after content
    forward(content) {
        let lines = content.split(LINE_MATCHER);
        if (lines.length <= 1)
            this.column += content.length;
        else {
            this.line += lines.length - 1;
            this.column = lines[lines.length - 1].length;
        }
        return this;
    }
    // Add content to a node (needs to be added line per line)
    add(node, content, autoForward) {
        autoForward = autoForward === undefined ? true : !!autoForward;
        let pos = autoForward ? this : new Position(this.file, this.line, this.column);
        let match;
        let sub;
        let lastIndex = LINE_MATCHER.lastIndex = 0;
        do {
            match = LINE_MATCHER.exec(content);
            if (match) {
                sub = content.substring(lastIndex, LINE_MATCHER.lastIndex);
                node.add(new SourceNode(pos.line, pos.column, pos.file, sub));
                pos.forward(sub);
                lastIndex = LINE_MATCHER.lastIndex;
            }
        } while (match);
        if (lastIndex < content.length) {
            sub = content.substring(lastIndex);
            node.add(new SourceNode(pos.line, pos.column, pos.file, sub));
            pos.forward(sub);
        }
        return this;
    }
}

function replaceProps(properties = {}, options = {}) {
    options = initOptions(options);
    properties = initProperties(properties, options);
    let nSuccess = 0;
    let nProblems = 0;
    return new Transform({
        objectMode: true,
        transform: function (inputFile, encoding, callback) {
            let result = null;
            let err = null;
            try {
                if (!inputFile || inputFile.isNull() || !properties || !options.enabled) {
                    logDebug("Nothing to do.", options);
                } else {
                    logInfo(`Replacing content at '${COLOR.magenta}${inputFile.relative}${COLOR.reset}'...`, options);
                    let buffer = "";
                    let remain = String(inputFile.contents);
                    let node = new SourceNode();
                    node.setSourceContent(inputFile.path, remain);
                    let filePos = new Position(inputFile.path);
                    let match = null;
                    do {
                        let re = getPropRegex(options);
                        match = re.exec(remain);
                        if (match) {
                            buffer += remain.substring(0, match.index);
                            let tgt = options.caseSensitive ? match[2] : match[2].toLowerCase();
                            if (properties.hasOwnProperty(tgt)) {
                                if (buffer) {
                                    filePos.add(node, buffer);
                                    buffer = "";
                                }
                                let val = properties[tgt];
                                filePos.add(node, val, false);
                                filePos.forward(match[0]);
                            } else {
                                buffer += match[0];
                            }
                            remain = remain.substring(match.index + match[0].length);
                        } else {
                            buffer += remain;
                            if (buffer) {
                                filePos.add(node, buffer);
                                buffer = "";
                            }
                        }
                    } while (match);
                    result = node.toStringWithSourceMap({ file: inputFile.path });
                    result.map = result.map.toJSON();
                }
                if (result) {
                    inputFile.contents = Buffer.from(result.code, encoding);
                    if (inputFile.sourceMap && result.map) {
                        applySourceMap(inputFile, result.map);
                    }
                    nSuccess++;
                }
            } catch (err2) {
                err = err2;
                nProblems++;
            }
            return callback(err, inputFile);
        },
        flush: function (callback) {
            if (nSuccess > 0) {
                logSuccess(`${nSuccess} file(s) proccessed.`, options);
            }
            if (nProblems > 0) {
                logWarn(`${nProblems} files failed.`, options);
            }
            return callback();
        }
    });
}
function replace(target, replacement, options = {}) {
    options = initOptions(options);
    let nSuccess = 0;
    let nProblems = 0;
    return new Transform({
        objectMode: true,
        transform: function (inputFile, encoding, callback) {
            let result = null;
            let err = null;
            try {
                if (!inputFile || inputFile.isNull() || !target || !options.enabled) {
                    logDebug("Nothing to do.", options);
                } else {
                    logInfo(`Replacing content at '${COLOR.magenta}${inputFile.relative}${COLOR.reset}'...`, options);
                    let buffer = "";
                    let remain = String(inputFile.contents);
                    let node = new SourceNode();
                    node.setSourceContent(inputFile.path, remain);
                    let filePos = new Position(inputFile.path);
                    let match = null;
                    do {
                        let re = getStrRegex(target, options);
                        match = re.exec(remain);
                        if (match) {
                            buffer += remain.substring(0, match.index);
                            if (buffer) {
                                filePos.add(node, buffer);
                                buffer = "";
                            }
                            filePos.add(node, replacement, false);
                            filePos.forward(match[0]);
                            remain = remain.substring(match.index + match[0].length);
                        } else {
                            buffer += remain;
                            if (buffer) {
                                filePos.add(node, buffer);
                                buffer = "";
                            }
                        }
                    } while (match);
                    result = node.toStringWithSourceMap({ file: inputFile.path });
                    result.map = result.map.toJSON();
                }
                if (result) {
                    inputFile.contents = Buffer.from(result.code, encoding);
                    if (inputFile.sourceMap && result.map) {
                        applySourceMap(inputFile, result.map);
                    }
                    nSuccess++;
                }
            } catch (err2) {
                err = err2;
                nProblems++;
            }
            return callback(err, inputFile);
        },
        flush: function (callback) {
            if (nSuccess > 0) {
                logSuccess(`${nSuccess} file(s) proccessed.`, options);
            }
            if (nProblems > 0) {
                logWarn(`${nProblems} files failed.`, options);
            }
            return callback();
        }
    });
}

module.exports = { replaceProps, replace };