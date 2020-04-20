(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global){
'use strict';

var objectAssign = require('object-assign');

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:
// NB: The URL to the CommonJS spec is kept just for tradition.
//     node-assert has evolved a lot since then, both in API and behavior.

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

// Expose a strict only variant of assert
function strict(value, message) {
  if (!value) fail(value, true, message, '==', strict);
}
assert.strict = objectAssign(strict, assert, {
  equal: assert.strictEqual,
  deepEqual: assert.deepStrictEqual,
  notEqual: assert.notStrictEqual,
  notDeepEqual: assert.notDeepStrictEqual
});
assert.strict.strict = assert.strict;

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"object-assign":15,"util/":4}],2:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],3:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],4:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":3,"_process":17,"inherits":2}],5:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],6:[function(require,module,exports){

},{}],7:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],8:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var customInspectSymbol =
  (typeof Symbol === 'function' && typeof Symbol.for === 'function')
    ? Symbol.for('nodejs.util.inspect.custom')
    : null

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    var proto = { foo: function () { return 42 } }
    Object.setPrototypeOf(proto, Uint8Array.prototype)
    Object.setPrototypeOf(arr, proto)
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  Object.setPrototypeOf(buf, Buffer.prototype)
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw new TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof SharedArrayBuffer !== 'undefined' &&
      (isInstance(value, SharedArrayBuffer) ||
      (value && isInstance(value.buffer, SharedArrayBuffer)))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Object.setPrototypeOf(Buffer.prototype, Uint8Array.prototype)
Object.setPrototypeOf(Buffer, Uint8Array)

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(buf, Buffer.prototype)

  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}
if (customInspectSymbol) {
  Buffer.prototype[customInspectSymbol] = Buffer.prototype.inspect
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [val], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += hexSliceLookupTable[buf[i]]
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  Object.setPrototypeOf(newBuf, Buffer.prototype)

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  } else if (typeof val === 'boolean') {
    val = Number(val)
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

// Create lookup table for `toString('hex')`
// See: https://github.com/feross/buffer/issues/219
var hexSliceLookupTable = (function () {
  var alphabet = '0123456789abcdef'
  var table = new Array(256)
  for (var i = 0; i < 16; ++i) {
    var i16 = i * 16
    for (var j = 0; j < 16; ++j) {
      table[i16 + j] = alphabet[i] + alphabet[j]
    }
  }
  return table
})()

}).call(this,require("buffer").Buffer)
},{"base64-js":5,"buffer":8,"ieee754":11}],9:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../is-buffer/index.js")})
},{"../../is-buffer/index.js":13}],10:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],11:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],12:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      })
    }
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    if (superCtor) {
      ctor.super_ = superCtor
      var TempCtor = function () {}
      TempCtor.prototype = superCtor.prototype
      ctor.prototype = new TempCtor()
      ctor.prototype.constructor = ctor
    }
  }
}

},{}],13:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],14:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],15:[function(require,module,exports){
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

'use strict';
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],16:[function(require,module,exports){
(function (process){
'use strict';

if (typeof process === 'undefined' ||
    !process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = { nextTick: nextTick };
} else {
  module.exports = process
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}


}).call(this,require('_process'))
},{"_process":17}],17:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],18:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],19:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],20:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],21:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":19,"./encode":20}],22:[function(require,module,exports){
module.exports = require('./lib/_stream_duplex.js');

},{"./lib/_stream_duplex.js":23}],23:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var util = Object.create(require('core-util-is'));
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

{
  // avoid scope creep, the keys array can then be collected
  var keys = objectKeys(Writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  pna.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  pna.nextTick(cb, err);
};
},{"./_stream_readable":25,"./_stream_writable":27,"core-util-is":9,"inherits":12,"process-nextick-args":16}],24:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = Object.create(require('core-util-is'));
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":26,"core-util-is":9,"inherits":12}],25:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Readable;

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = require('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

/*<replacement>*/
var util = Object.create(require('core-util-is'));
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = require('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = require('./internal/streams/BufferList');
var destroyImpl = require('./internal/streams/destroy');
var StringDecoder;

util.inherits(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var readableHwm = options.readableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    pna.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        pna.nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    pna.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;

  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._readableState.highWaterMark;
  }
});

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    pna.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./_stream_duplex":23,"./internal/streams/BufferList":28,"./internal/streams/destroy":29,"./internal/streams/stream":30,"_process":17,"core-util-is":9,"events":10,"inherits":12,"isarray":14,"process-nextick-args":16,"safe-buffer":31,"string_decoder/":32,"util":6}],26:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = Object.create(require('core-util-is'));
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return this.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);

  cb(er);

  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function') {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this2 = this;

  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this2.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":23,"core-util-is":9,"inherits":12}],27:[function(require,module,exports){
(function (process,global,setImmediate){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = Object.create(require('core-util-is'));
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

var destroyImpl = require('./internal/streams/destroy');

util.inherits(Writable, Stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var writableHwm = options.writableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  pna.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    pna.nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    pna.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    pna.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      pna.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("timers").setImmediate)
},{"./_stream_duplex":23,"./internal/streams/destroy":29,"./internal/streams/stream":30,"_process":17,"core-util-is":9,"inherits":12,"process-nextick-args":16,"safe-buffer":31,"timers":38,"util-deprecate":41}],28:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = require('safe-buffer').Buffer;
var util = require('util');

function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

if (util && util.inspect && util.inspect.custom) {
  module.exports.prototype[util.inspect.custom] = function () {
    var obj = util.inspect({ length: this.length });
    return this.constructor.name + ' ' + obj;
  };
}
},{"safe-buffer":31,"util":6}],29:[function(require,module,exports){
'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      pna.nextTick(emitErrorNT, this, err);
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      pna.nextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });

  return this;
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};
},{"process-nextick-args":16}],30:[function(require,module,exports){
module.exports = require('events').EventEmitter;

},{"events":10}],31:[function(require,module,exports){
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":8}],32:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":31}],33:[function(require,module,exports){
module.exports = require('./readable').PassThrough

},{"./readable":34}],34:[function(require,module,exports){
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":23,"./lib/_stream_passthrough.js":24,"./lib/_stream_readable.js":25,"./lib/_stream_transform.js":26,"./lib/_stream_writable.js":27}],35:[function(require,module,exports){
module.exports = require('./readable').Transform

},{"./readable":34}],36:[function(require,module,exports){
module.exports = require('./lib/_stream_writable.js');

},{"./lib/_stream_writable.js":27}],37:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Stream;

var EE = require('events').EventEmitter;
var inherits = require('inherits');

inherits(Stream, EE);
Stream.Readable = require('readable-stream/readable.js');
Stream.Writable = require('readable-stream/writable.js');
Stream.Duplex = require('readable-stream/duplex.js');
Stream.Transform = require('readable-stream/transform.js');
Stream.PassThrough = require('readable-stream/passthrough.js');

// Backwards-compat with node 0.4.x
Stream.Stream = Stream;



// old-style streams.  Note that the pipe method (the only relevant
// part of this class) is overridden in the Readable class.

function Stream() {
  EE.call(this);
}

Stream.prototype.pipe = function(dest, options) {
  var source = this;

  function ondata(chunk) {
    if (dest.writable) {
      if (false === dest.write(chunk) && source.pause) {
        source.pause();
      }
    }
  }

  source.on('data', ondata);

  function ondrain() {
    if (source.readable && source.resume) {
      source.resume();
    }
  }

  dest.on('drain', ondrain);

  // If the 'end' option is not supplied, dest.end() will be called when
  // source gets the 'end' or 'close' events.  Only dest.end() once.
  if (!dest._isStdio && (!options || options.end !== false)) {
    source.on('end', onend);
    source.on('close', onclose);
  }

  var didOnEnd = false;
  function onend() {
    if (didOnEnd) return;
    didOnEnd = true;

    dest.end();
  }


  function onclose() {
    if (didOnEnd) return;
    didOnEnd = true;

    if (typeof dest.destroy === 'function') dest.destroy();
  }

  // don't leave dangling pipes when there are errors.
  function onerror(er) {
    cleanup();
    if (EE.listenerCount(this, 'error') === 0) {
      throw er; // Unhandled stream error in pipe.
    }
  }

  source.on('error', onerror);
  dest.on('error', onerror);

  // remove all the event listeners that were added.
  function cleanup() {
    source.removeListener('data', ondata);
    dest.removeListener('drain', ondrain);

    source.removeListener('end', onend);
    source.removeListener('close', onclose);

    source.removeListener('error', onerror);
    dest.removeListener('error', onerror);

    source.removeListener('end', cleanup);
    source.removeListener('close', cleanup);

    dest.removeListener('close', cleanup);
  }

  source.on('end', cleanup);
  source.on('close', cleanup);

  dest.on('close', cleanup);

  dest.emit('pipe', source);

  // Allow for unix-like usage: A.pipe(B).pipe(C)
  return dest;
};

},{"events":10,"inherits":12,"readable-stream/duplex.js":22,"readable-stream/passthrough.js":33,"readable-stream/readable.js":34,"readable-stream/transform.js":35,"readable-stream/writable.js":36}],38:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":17,"timers":38}],39:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":40,"punycode":18,"querystring":21}],40:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],41:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],42:[function(require,module,exports){
arguments[4][2][0].apply(exports,arguments)
},{"dup":2}],43:[function(require,module,exports){
arguments[4][3][0].apply(exports,arguments)
},{"dup":3}],44:[function(require,module,exports){
arguments[4][4][0].apply(exports,arguments)
},{"./support/isBuffer":43,"_process":17,"dup":4,"inherits":42}],45:[function(require,module,exports){
(function (Buffer){
/* global window */

//var Porcupine = require('./porcupine/porcupine')
var PorcupineManager = require('./porcupine/porcupine_manager')
var WebVoiceProcessor = require('./porcupine/web_voice_processor')
var KeywordData =  require('./porcupine/keyword_data')
//var PorcupineWorker =  require('./porcupine/porcupine_worker')
//var DownsampleWorker =  require('./porcupine/downsampling_worker')
//var PorcupineModule =  require('./porcupine/pv_porcupine')

//console.log('MODULE')
//console.log(PorcupineModule())

try {
    window.PorcupineManager = PorcupineManager
    window.WebVoiceProcessor = WebVoiceProcessor
    //window.KeywordData = KeywordData
    //window.PorcupineModule = PorcupineModule()
    //window.PorcupineWorker = PorcupineWorker
    //window.DownsampleWorker = DownsampleWorker
} catch(e) {}
 

//var Module = require('./pv_porcupine')
   
var hark = require('hark');
var getUserMedia = require('getusermedia')  
var mqtt = require('mqtt')
//var mqtt = require('./mqttws31.min.js')
//console.log('MQTT')
//console.log(mqtt)
var wav2mqtt = require('./wav2mqtt')
//var Porcupine = require('./porcupine')  
//var PicovoiceAudioManager = require('./picovoiceAudioManager')


var HermodWebClient = function(config) {
        
        var mqttClient = null;
        var isRecording = false;
        var isSending = false;
        var waitingFor = {}
        var onCallbacks = {}
        var hotwordManager = null;
        var hotwordInitialised = false;
        var hotwordStarted = false;
        var inputvolume = 1.0  // TODO also hotword volume?
        var outputvolume = 1.0
        var site = null;
        var inputGainNodes=[];
        var porcupineManager;
        var speakingTimeout = null;     
        var speaking = false;
        var microphoneAudioBuffer = []
        var SENSITIVITIES = new Float32Array([
                0.8 //, // "Hey Edison"
                //0.5, // "Hot Pink"
                //0.5, // "Deep Pink"
                //0.5, // "Fire Brick"
                //0.5, // "Papaya Whip"
                //0.5, // "Peach Puff"
                //0.5, // "Sandy Brown"
                //0.5, // "Lime Green"
                //0.5, // "Forest Green"
                //0.5, // "Midnight Blue"
                //0.5, // "Magenta"
                //0.5, // "White Smoke"
                //0.5, // "Lavender Blush"
                //0.5 // "Dim Gray"
            ]);
        
        
        
        
        var messageFunctions = {
            // SPEAKER
            'hermod/+/speaker/play/+' : function(topic,site,payload) {
               //console.log(['speaker play',site,payload]);
                if (site && site.length > 0) { 
                    mqttClient.publish("hermod/"+site+"/speaker/started",JSON.stringify({})); 
					playSound(payload).then(function() {
                        mqttClient.publish("hermod/"+site+"/speaker/finished",JSON.stringify({})); 
					}); 
                }
            },
            'hermod/+/hotword/detected': function(topic,site,payload) {
                // quarter volume for 10 seconds
            } ,
            //'hermod/+/microphone/start' : function(topic,site,payload) {
                //startMicrophone()
            //},
            //'hermod/+/microphone/stop' : function(topic,site,payload) {
                //stopMicrophone()
            //},
            'hermod/+/asr/start' : function(topic,site,payload) {
                startMicrophone()
            },
            'hermod/+/asr/stop' : function(topic,site,payload) {
                stopMicrophone()
            },
            'hermod/+/hotword/start' : function(topic,site,payload) {
                startHotword();
            },
            'hermod/+/hotword/stop' : function(topic,site,payload) {
                stopHotword();
            },
            'hermod/+/ready' : function(topic,site,payload) {
                console.log('reload on server restart')
                window.location.reload()
            }        
        }
        
        function onMessageArrived(message,payload) {
            //console.log(['MESSAGE ',message,payload])
            if (waitingFor.hasOwnProperty(message)) {
                // callback for sendAndWaitFor
                //console.log('run callback')
                mqttClient.unsubscribe(message)
                waitingFor[message](message,payload)
                delete waitingFor[message]
            } else {
                // handle messageFunction
                var parts = message.split("/")
                // special handling for id in speaker/play/<id>
                if (parts.length > 4 && parts[2] == "speaker" && parts[3] == "play") {
                    //console.log('SPAKE ')
                    parts[4]="+";
                }
                var site = parts[1]
                parts[1] = '+'
                var multiSite = parts.join("/")
                //console.log('MATCH '+multiSite)
                //console.log(messageFunctions)
                //console.log(messageFunctions[multiSite])  
                if (messageFunctions.hasOwnProperty(multiSite)) { 
                    //console.log(['CALL ',messageFunctions[multiSite]])
                
                    messageFunctions[multiSite](message,site,payload)
                }
            }
            if (onCallbacks.hasOwnProperty('message')) {
                onCallbacks['message'](message,payload)
            }
        }

        function connect() {
            
            return new Promise(function(resolve,reject) {
                function onConnect() {
                    //console.log('connected')
                    //console.log(config)
                    if (config.subscribe && config.subscribe.length  > 0) { 
                        mqttClient.subscribe('hermod/rasa/ready',function(err) { 
                            mqttClient.unsubscribe(config.subscribe,function(err) {
                               if (err) console.log(['unSUBSCRIBE ERROR',err])
                                mqttClient.subscribe(config.subscribe,function(err) {
                                   if (err) console.log(['SUBSCRIBE ERROR',err])
                                   //console.log(['init subscribed to '+config.subscribe])
                                   sendMessage('hermod/'+config.site+'/asr/activate',{})
                                   if (onCallbacks.hasOwnProperty('connect')) {
                                        onCallbacks['connect']()
                                    }
                                   resolve()
                                });
                            });
                        });
                    } else {
                        sendMessage('hermod/'+config.site+'/asr/activate',{})
                        resolve()
                    }
                }
                //console.log('connect')
                
                var options = {
                  clientId: 'webclient',
                  protocolId: 'MQTT',
                  protocolVersion: 4,
                  clean: true,
                  username: config.username,
                  password: config.password,
                  rejectUnauthorized: false
                }
                
                
                //console.log(config)
                //console.log(options)
                //console.log(config.server)
                //mqttClient  = mqtt.connect(config.server,{username:config.username,password:config.password}) //host:server,port:port,
                mqttClient = mqtt.connect(config.server, options);
                
                mqttClient.on('connect', onConnect)
                mqttClient.on('error', console.error)
                mqttClient.on('message',onMessageArrived);
                //console.log('connect done')
                

            })
            
        }
      
        function disconnect() {
            //console.log('discon')
            //console.log(mqttClient)
            if (onCallbacks.hasOwnProperty('disconnect')) {
                onCallbacks['disconnect']()
            }
            mqttClient.end()
            setTimeout(function() {
                connect()
            },3000)
        }
         
        function sendMessage(topic,payload) {
            mqttClient.publish(topic,JSON.stringify(payload));    
        }
        
        function sendNLUMessage(site,intent,entities) {
            if (!entities) entities = []
            mqttClient.publish('hermod/'+site+'/nlu/intent',JSON.stringify({intent:{name:intent}, entities:entities}));    
        }
        
         
        function sendASRTextMessage(site,text) {
            console.log('send text message '+site+text)
            mqttClient.publish('hermod/'+site+'/asr/text',JSON.stringify({text:text}));    
        }
        
        
        function sendAudioMessage(topic,payload) {
            mqttClient.publish(topic,payload);    
        }
        
        function sendAndWaitFor(sendTopic,payload,waitTopic) {
           // console.log(['send and wait',sendTopic,payload,waitTopic])
            //var innerMqttClient = null;
            return new Promise(function(resolve,reject) {
                mqttClient.subscribe(waitTopic)
                waitingFor[waitTopic] = function() {resolve()};
                mqttClient.publish(sendTopic,JSON.stringify(payload));  
            })
        }
        
        function say(text) {
            return sendAndWaitFor('hermod/'+config.site+'/tts/say',{text:text},'hermod/'+config.site+'/tts/finished')
        }
        
        function sendAudioAndWaitFor(site,audio,waitTopic) {
            sendTopic = 'hermod/' + site +'/microphone/audio'
           // console.log(['send audio and wait',site,audio,waitTopic])
            return new Promise(function(resolve,reject) {
                mqttClient.subscribe(waitTopic)
                waitingFor[waitTopic] = function() {wav2mqtt.stop(); resolve()};
                wav2mqtt.start(mqttClient,site,audio);  
            })
        }
        
        function authenticate() {
            
        }

        /**
         * API FUNCTIONS
         */
         
         
        function addInputGainNode(node) {
            inputGainNodes.push(node);
        };

        // event functions
        // accept callback for trigger on lifecycle events
        function bind(key,callback) {
            onCallbacks[key] = callback;
        } 
         
        function unbind(key) {
            delete onCallbacks[key]
        } 
            
        ///**
         //* Pause the hotword manager
         //*/ 
        //function stopHotword(site) {
            //if (hotwordManager) hotwordManager.pauseProcessing();
        //};
        
        ///**
         //* Create or continue the hotword manager
         //*/ 
        //function startHotword(site) {
            //console.log(['START HOTWORD',config]);
            //function hotwordCallback(value) {
                //if (!isNaN(value) && parseInt(value,10)>=0) {
                //console.log(['HOTWORD CB',value]);
                    //sendMessage('hermod/'+site+'/hotword/detected',JSON.stringify({}))
                //}
            //};
            
            //if (hotwordManager === null) {
                //console.log(['REALLY START HOTWORD',config]);
                  //let localHotword = 'navy blue';
                  //hotwordManager =  new PicovoiceAudioManager(addInputGainNode,inputvolume);
                  //let singleSensitivity = config.hotwordsensitivity ? config.hotwordsensitivity/100 : 0.9;
                  //let sensitivities=new Float32Array([singleSensitivity]);
                  //let selectedKeyword = null;
                  //if (HotwordResources.keywordIDs.hasOwnProperty(localHotword)) {
                      //selectedKeyword = HotwordResources.keywordIDs[localHotword];
                      //console.log(['SELECTED KW',localHotword,selectedKeyword]);
                      //hotwordManager.start(Porcupine.create([selectedKeyword], sensitivities), hotwordCallback, function(e) {
                        //console.log(['HOTWORD error',e]);
                      //});
                  //}                  

              //} else {
                  //if(hotwordManager) hotwordManager.continueProcessing();
              //}
      
        //};
        
        
                
       

        function startHotword() {
            //console.log('start hw')
            if (onCallbacks.hasOwnProperty('hotwordStart')) {
                onCallbacks['hotwordStart']()
            }
            hotwordStarted = true;
            if (!hotwordInitialised) {
                let processCallback = function (keyword) {
                    //console.log('heard '+keyword)
                    if (keyword && hotwordStarted) {
                        //console.log('heard and accept '+keyword)
                        sendMessage('hermod/'+config.site+'/hotword/detected',{})
                        if (onCallbacks.hasOwnProperty('hotwordDetected')) {
                            onCallbacks['hotwordDetected'](keyword)
                        }
                        
                        startMicrophone()
                    }
                };

                
                let audioManagerErrorCallback = function (ex) {
                    console.log(ex.toString());
                };

                //if (!porcupineManager) {
                    //console.log('CREATE NEW porc WORKER')
                    porcupineManager = PorcupineManager("./porcupine/porcupine_worker.js");
                //}
                porcupineManager.start(KeywordData, SENSITIVITIES, processCallback, audioManagerErrorCallback);
                hotwordInitialised = true;
            }
        };

        function stopHotword() {
            if (onCallbacks.hasOwnProperty('hotwordStop')) {
                onCallbacks['hotwordStop']()
            }
            //console.log('stop how')
            //console.log(porcupineManager)
            //porcupineManager.stop();
            hotwordStarted = false;
        };
        

        
        /**
         * HELPER FUNCTIONS
         */
        //function playSound(byteArray) {
            //console.log('play sopuid')
            //console.log(byteArray)
            //return new Promise(function(resolve,reject) {
                //console.log('in prom')
                //// Create blob from Uint8Array & Object URL.
                //const blob = new Blob([new Uint8Array(byteArray)], { type: 'audio/wav' });
                //const url = URL.createObjectURL(blob);
                //console.log('got url')
                //console.log(url);
                //// Get DOM elements.
                //const audio = document.createElement('audio');
                //const source = document.createElement('source');

                //// Insert blob object URL into audio element & play.
                //source.src = url;
                    //console.log('set src')
                
                //audio.load();
                    //console.log('loaded')
                //audio.play();
                    //console.log('played')
                //audio.on('ended',function() {
                    //console.log('ended')
                    //resolve()
                //})

                
            //})
        //}
        function playSound(bytes) {
            // console.log('PLAY SOUND BYTES')
            return new Promise(function(resolve,reject) {
                try {
                    if (bytes) {
                        var myAudio = document.createElement('audio');

                        //if (myAudio.canPlayType('audio/mpeg')) {
                          //myAudio.setAttribute('src','audiofile.mp3');
                        //}
                        
                       // console.log('PLAY SOUND BYTES have bytes'+bytes.length)
                        var buffer = new Uint8Array( bytes.length );
                        buffer.set( new Uint8Array(bytes), 0 );
                        let audioContext = window.AudioContext || window.webkitAudioContext;
                        let context = new audioContext();
                        let gainNode = context.createGain();
                        gainNode.gain.value =  outputvolume; //config.speakervolume/100 ? config.speakervolume/100 :
                        //console.log('PLAY SOUND BYTES decode')
                            context.decodeAudioData(buffer.buffer, function(audioBuffer) {
                            //console.log('PLAY SOUND BYTES decoded')
                           // console.log(audioBuffer);
                            var source = context.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(gainNode);
                            gainNode.connect( context.destination );
                            try {
                                source.start(0);
                            } catch (e) {
                                console.log('play sound error starting')
                                console.log(e)
                                resolve()
                            }
                            source.onended = function() {
                                console.log('PLAY SOUND BYTES source ended')
                                resolve();
                            };
                            source.onerror = function() {
                                console.log('PLAY SOUND BYTES source error')
                                resolve();
                            };
                        },function(e) {
                             console.log('PLAY SOUND BYTES decode FAIL')
                             console.log(e)
                             resolve()   
                        });
                        //resolve()
                    } else {
                        console.log('PLAY SOUND BYTES no bytes')
                        resolve();
                    }
                } catch (e) {
                    console.log('PLAY SOUND BYTES err')
                    console.log(e)
                    resolve()
                }
            });                        
        }
        
           
        /**
         * Bind silence recognition events to set speaking state
         */ 
        function bindSpeakingEvents() {
             //console.log('bind speaking')
             if (!navigator.getUserMedia) {
                navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
             }
             try {
                if (navigator.getUserMedia) {
                  navigator.getUserMedia({audio:true}, function(stream) {
                    //console.log('bind speaking have audoi')
                    var options = {};
                    var speechEvents = hark(stream, options);

                    speechEvents.on('speaking', function() {
                      clearTimeout(speakingTimeout)
                      //console.log('speaking');
                      sendAudioBuffer(config.site)
                      speaking = true
                    });

                    speechEvents.on('stopped_speaking', function() {
                      // send an extra second of silence for ASR
                      speakingTimeout = setTimeout(function() {
                             clearTimeout(speakingTimeout)
                             //console.log('stop speaking');
                             speaking = false
                      },4000);
                    });    
                      
                  }, function(e) {
                    console.log(['MIC Error capturing audio.',e]);
                  });
                } else {
                    console.log('MIC getUserMedia not supported in this browser.');
                }
             }   catch (e) {
                 console.log(e);
             }
            
        };
        
        function getThreshholdFromVolume(volume) {
            return 10 * Math.log((101 - volume )/800);
        };
        
        
        function bufferAudio(audio) {
            microphoneAudioBuffer.push(audio);
            if (microphoneAudioBuffer.length > 30) {
                microphoneAudioBuffer.shift();
            }
        }
        
        function sendAudioBuffer(site) {
            //console.log(['SEND BUFFER'])
            for (var a in microphoneAudioBuffer) {
                sendAudioMessage('hermod/'+site+'/microphone/audio',microphoneAudioBuffer[a]);
            }
            microphoneAudioBuffer = [];
        }
        
        
        function startMicrophone() {
            //console.log('start rec -'+config.site)
            isSending = true;
           
            if (onCallbacks.hasOwnProperty('microphoneStart')) {
                onCallbacks['microphoneStart']()
            }
            //sendMessage('hermod/'+config.site+'/asr/start',{})
            
        }
        
        function activateRecording(site) {
            //console.log('activate rec'+site)
            //this.setState({sending:true});
            //if (onCallbacks.hasOwnProperty('microphoneStart')) {
                //onCallbacks['microphoneStart']()
            //}
            //bindSpeakingEvents()
            if (isRecording) return;
            isRecording = true;
            
            if (!navigator.getUserMedia) {
                navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.msGetUserMedia;
            }
             try {
                if (navigator.getUserMedia) {
                  navigator.getUserMedia({audio:true}, success, function(e) {
                    console.log(['MIC Error capturing audio.',e]);
                  });
                } else {
                    console.log('MIC getUserMedia not supported in this browser.');
                }
             }   catch (e) {
                 console.log(e);
             }
            function success(e) {
                 // console.log('got navigator')
                  var audioContext = window.AudioContext || window.webkitAudioContext;
                  var context = new audioContext();
                  var gainNode = context.createGain();
                  gainNode.gain.value = inputvolume;
                  var audioInput = context.createMediaStreamSource(e);
                  
                  
                  var bufferSize = 2048;
                  
                    function convertFloat32ToInt16(buffer) {
                      if (buffer) {
                          let l = buffer.length;
                          let buf = new Int16Array(l);
                          while (l--) {
                            buf[l] = Math.min(1, buffer[l])*0x7FFF;
                          }
                          return buf.buffer;
                      }
                    }
                    
                    function resample(sourceAudioBuffer,TARGET_SAMPLE_RATE,onComplete) {
                          var offlineCtx = new OfflineAudioContext(sourceAudioBuffer.numberOfChannels, sourceAudioBuffer.duration * sourceAudioBuffer.numberOfChannels * TARGET_SAMPLE_RATE, TARGET_SAMPLE_RATE);
                          var buffer = offlineCtx.createBuffer(sourceAudioBuffer.numberOfChannels, sourceAudioBuffer.length, sourceAudioBuffer.sampleRate);
                          // Copy the source data into the offline AudioBuffer
                          for (var channel = 0; channel < sourceAudioBuffer.numberOfChannels; channel++) {
                              buffer.copyToChannel(sourceAudioBuffer.getChannelData(channel), channel);
                          }
                          // Play it from the beginning.
                          var source = offlineCtx.createBufferSource();
                          source.buffer = sourceAudioBuffer;
                          source.connect(offlineCtx.destination); 
                          source.start(0);
                          offlineCtx.oncomplete = function(e) {
                            // `resampled` contains an AudioBuffer resampled at 16000Hz.
                            // use resampled.getChannelData(x) to get an Float32Array for channel x.
                            var resampled = e.renderedBuffer;
                            var leftFloat32Array = resampled.getChannelData(0);
                            // use this float32array to send the samples to the server or whatever
                            onComplete(leftFloat32Array);
                          }
                          offlineCtx.startRendering();
                    }
         
                    
                  let recorder = context.createScriptProcessor(bufferSize, 1, 1);
                  recorder.onaudioprocess = function(e){
                      //console.log(['onaudio',isRecording  ,isSending ])
                        
                      //  var left = e.inputBuffer.getChannelData(0);
                      // && that.state.speaking && that.state.started
                      if (isRecording  && isSending) { // && speaking) {
                          //console.log(['REC'])
                          resample(e.inputBuffer,16000,function(res) {
                            if (speaking) {
                                //console.log(['SEND'])
                                sendAudioMessage('hermod/'+site+'/microphone/audio',Buffer.from(convertFloat32ToInt16(res)))
                            } else {
                                //console.log(['BUFFER'])
                                bufferAudio(Buffer.from(convertFloat32ToInt16(res)));
                            }
                          });
                      }
                  }
                  
                gainNode.connect(recorder);
                audioInput.connect(gainNode);
                recorder.connect(context.destination); 
               //   console.log(['REC started'])
                        
            }
        
        }
        function stopMicrophone() {
            isSending = false;
            if (onCallbacks.hasOwnProperty('microphoneStop')) {
                onCallbacks['microphoneStop']()
            }
            //sendMessage('hermod/'+config.site+'/asr/stop',{})
            
        }
        function stopAll() {
            stopHotword()
            stopMicrophone()
            //disconnect() 
        }   
        
        function init() {
            activateRecording(config.site)
            bindSpeakingEvents()
            
        }
        
        init()
             
        return {say:say, stopAll:stopAll, bind:bind,unbind:unbind,startMicrophone: startMicrophone, stopMicrophone: stopMicrophone, sendAndWaitFor:sendAndWaitFor,sendAudioAndWaitFor:sendAudioAndWaitFor,sendMessage:sendMessage,sendNLUMessage:sendNLUMessage,sendASRTextMessage:sendASRTextMessage,authenticate:authenticate,connect:connect,disconnect:disconnect,startHotword:startHotword,stopHotword:stopHotword}
}

module.exports=HermodWebClient 
try {
    if (window) {
        window.HermodWebClient = HermodWebClient
    }
} catch (e) {}


}).call(this,require("buffer").Buffer)
},{"./porcupine/keyword_data":204,"./porcupine/porcupine_manager":205,"./porcupine/web_voice_processor":206,"./wav2mqtt":207,"buffer":8,"getusermedia":121,"hark":122,"mqtt":133}],46:[function(require,module,exports){
var DuplexStream = require('readable-stream/duplex')
  , util         = require('util')
  , Buffer       = require('safe-buffer').Buffer


function BufferList (callback) {
  if (!(this instanceof BufferList))
    return new BufferList(callback)

  this._bufs  = []
  this.length = 0

  if (typeof callback == 'function') {
    this._callback = callback

    var piper = function piper (err) {
      if (this._callback) {
        this._callback(err)
        this._callback = null
      }
    }.bind(this)

    this.on('pipe', function onPipe (src) {
      src.on('error', piper)
    })
    this.on('unpipe', function onUnpipe (src) {
      src.removeListener('error', piper)
    })
  } else {
    this.append(callback)
  }

  DuplexStream.call(this)
}


util.inherits(BufferList, DuplexStream)


BufferList.prototype._offset = function _offset (offset) {
  var tot = 0, i = 0, _t
  if (offset === 0) return [ 0, 0 ]
  for (; i < this._bufs.length; i++) {
    _t = tot + this._bufs[i].length
    if (offset < _t || i == this._bufs.length - 1)
      return [ i, offset - tot ]
    tot = _t
  }
}


BufferList.prototype.append = function append (buf) {
  var i = 0

  if (Buffer.isBuffer(buf)) {
    this._appendBuffer(buf);
  } else if (Array.isArray(buf)) {
    for (; i < buf.length; i++)
      this.append(buf[i])
  } else if (buf instanceof BufferList) {
    // unwrap argument into individual BufferLists
    for (; i < buf._bufs.length; i++)
      this.append(buf._bufs[i])
  } else if (buf != null) {
    // coerce number arguments to strings, since Buffer(number) does
    // uninitialized memory allocation
    if (typeof buf == 'number')
      buf = buf.toString()

    this._appendBuffer(Buffer.from(buf));
  }

  return this
}


BufferList.prototype._appendBuffer = function appendBuffer (buf) {
  this._bufs.push(buf)
  this.length += buf.length
}


BufferList.prototype._write = function _write (buf, encoding, callback) {
  this._appendBuffer(buf)

  if (typeof callback == 'function')
    callback()
}


BufferList.prototype._read = function _read (size) {
  if (!this.length)
    return this.push(null)

  size = Math.min(size, this.length)
  this.push(this.slice(0, size))
  this.consume(size)
}


BufferList.prototype.end = function end (chunk) {
  DuplexStream.prototype.end.call(this, chunk)

  if (this._callback) {
    this._callback(null, this.slice())
    this._callback = null
  }
}


BufferList.prototype.get = function get (index) {
  return this.slice(index, index + 1)[0]
}


BufferList.prototype.slice = function slice (start, end) {
  if (typeof start == 'number' && start < 0)
    start += this.length
  if (typeof end == 'number' && end < 0)
    end += this.length
  return this.copy(null, 0, start, end)
}


BufferList.prototype.copy = function copy (dst, dstStart, srcStart, srcEnd) {
  if (typeof srcStart != 'number' || srcStart < 0)
    srcStart = 0
  if (typeof srcEnd != 'number' || srcEnd > this.length)
    srcEnd = this.length
  if (srcStart >= this.length)
    return dst || Buffer.alloc(0)
  if (srcEnd <= 0)
    return dst || Buffer.alloc(0)

  var copy   = !!dst
    , off    = this._offset(srcStart)
    , len    = srcEnd - srcStart
    , bytes  = len
    , bufoff = (copy && dstStart) || 0
    , start  = off[1]
    , l
    , i

  // copy/slice everything
  if (srcStart === 0 && srcEnd == this.length) {
    if (!copy) { // slice, but full concat if multiple buffers
      return this._bufs.length === 1
        ? this._bufs[0]
        : Buffer.concat(this._bufs, this.length)
    }

    // copy, need to copy individual buffers
    for (i = 0; i < this._bufs.length; i++) {
      this._bufs[i].copy(dst, bufoff)
      bufoff += this._bufs[i].length
    }

    return dst
  }

  // easy, cheap case where it's a subset of one of the buffers
  if (bytes <= this._bufs[off[0]].length - start) {
    return copy
      ? this._bufs[off[0]].copy(dst, dstStart, start, start + bytes)
      : this._bufs[off[0]].slice(start, start + bytes)
  }

  if (!copy) // a slice, we need something to copy in to
    dst = Buffer.allocUnsafe(len)

  for (i = off[0]; i < this._bufs.length; i++) {
    l = this._bufs[i].length - start

    if (bytes > l) {
      this._bufs[i].copy(dst, bufoff, start)
    } else {
      this._bufs[i].copy(dst, bufoff, start, start + bytes)
      break
    }

    bufoff += l
    bytes -= l

    if (start)
      start = 0
  }

  return dst
}

BufferList.prototype.shallowSlice = function shallowSlice (start, end) {
  start = start || 0
  end = end || this.length

  if (start < 0)
    start += this.length
  if (end < 0)
    end += this.length

  var startOffset = this._offset(start)
    , endOffset = this._offset(end)
    , buffers = this._bufs.slice(startOffset[0], endOffset[0] + 1)

  if (endOffset[1] == 0)
    buffers.pop()
  else
    buffers[buffers.length-1] = buffers[buffers.length-1].slice(0, endOffset[1])

  if (startOffset[1] != 0)
    buffers[0] = buffers[0].slice(startOffset[1])

  return new BufferList(buffers)
}

BufferList.prototype.toString = function toString (encoding, start, end) {
  return this.slice(start, end).toString(encoding)
}

BufferList.prototype.consume = function consume (bytes) {
  while (this._bufs.length) {
    if (bytes >= this._bufs[0].length) {
      bytes -= this._bufs[0].length
      this.length -= this._bufs[0].length
      this._bufs.shift()
    } else {
      this._bufs[0] = this._bufs[0].slice(bytes)
      this.length -= bytes
      break
    }
  }
  return this
}


BufferList.prototype.duplicate = function duplicate () {
  var i = 0
    , copy = new BufferList()

  for (; i < this._bufs.length; i++)
    copy.append(this._bufs[i])

  return copy
}


BufferList.prototype.destroy = function destroy () {
  this._bufs.length = 0
  this.length = 0
  this.push(null)
}


;(function () {
  var methods = {
      'readDoubleBE' : 8
    , 'readDoubleLE' : 8
    , 'readFloatBE'  : 4
    , 'readFloatLE'  : 4
    , 'readInt32BE'  : 4
    , 'readInt32LE'  : 4
    , 'readUInt32BE' : 4
    , 'readUInt32LE' : 4
    , 'readInt16BE'  : 2
    , 'readInt16LE'  : 2
    , 'readUInt16BE' : 2
    , 'readUInt16LE' : 2
    , 'readInt8'     : 1
    , 'readUInt8'    : 1
  }

  for (var m in methods) {
    (function (m) {
      BufferList.prototype[m] = function (offset) {
        return this.slice(offset, offset + methods[m])[m](0)
      }
    }(m))
  }
}())


module.exports = BufferList

},{"readable-stream/duplex":143,"safe-buffer":154,"util":44}],47:[function(require,module,exports){
(function (Buffer){
function allocUnsafe (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  }

  if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }

  if (Buffer.allocUnsafe) {
    return Buffer.allocUnsafe(size)
  } else {
    return new Buffer(size)
  }
}

module.exports = allocUnsafe

}).call(this,require("buffer").Buffer)
},{"buffer":8}],48:[function(require,module,exports){
(function (Buffer){
var bufferFill = require('buffer-fill')
var allocUnsafe = require('buffer-alloc-unsafe')

module.exports = function alloc (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be a number')
  }

  if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }

  if (Buffer.alloc) {
    return Buffer.alloc(size, fill, encoding)
  }

  var buffer = allocUnsafe(size)

  if (size === 0) {
    return buffer
  }

  if (fill === undefined) {
    return bufferFill(buffer, 0)
  }

  if (typeof encoding !== 'string') {
    encoding = undefined
  }

  return bufferFill(buffer, fill, encoding)
}

}).call(this,require("buffer").Buffer)
},{"buffer":8,"buffer-alloc-unsafe":47,"buffer-fill":49}],49:[function(require,module,exports){
(function (Buffer){
/* Node.js 6.4.0 and up has full support */
var hasFullSupport = (function () {
  try {
    if (!Buffer.isEncoding('latin1')) {
      return false
    }

    var buf = Buffer.alloc ? Buffer.alloc(4) : new Buffer(4)

    buf.fill('ab', 'ucs2')

    return (buf.toString('hex') === '61006200')
  } catch (_) {
    return false
  }
}())

function isSingleByte (val) {
  return (val.length === 1 && val.charCodeAt(0) < 256)
}

function fillWithNumber (buffer, val, start, end) {
  if (start < 0 || end > buffer.length) {
    throw new RangeError('Out of range index')
  }

  start = start >>> 0
  end = end === undefined ? buffer.length : end >>> 0

  if (end > start) {
    buffer.fill(val, start, end)
  }

  return buffer
}

function fillWithBuffer (buffer, val, start, end) {
  if (start < 0 || end > buffer.length) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return buffer
  }

  start = start >>> 0
  end = end === undefined ? buffer.length : end >>> 0

  var pos = start
  var len = val.length
  while (pos <= (end - len)) {
    val.copy(buffer, pos)
    pos += len
  }

  if (pos !== end) {
    val.copy(buffer, pos, 0, end - pos)
  }

  return buffer
}

function fill (buffer, val, start, end, encoding) {
  if (hasFullSupport) {
    return buffer.fill(val, start, end, encoding)
  }

  if (typeof val === 'number') {
    return fillWithNumber(buffer, val, start, end)
  }

  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = buffer.length
    } else if (typeof end === 'string') {
      encoding = end
      end = buffer.length
    }

    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }

    if (encoding === 'latin1') {
      encoding = 'binary'
    }

    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }

    if (val === '') {
      return fillWithNumber(buffer, 0, start, end)
    }

    if (isSingleByte(val)) {
      return fillWithNumber(buffer, val.charCodeAt(0), start, end)
    }

    val = new Buffer(val, encoding)
  }

  if (Buffer.isBuffer(val)) {
    return fillWithBuffer(buffer, val, start, end)
  }

  // Other values (e.g. undefined, boolean, object) results in zero-fill
  return fillWithNumber(buffer, 0, start, end)
}

module.exports = fill

}).call(this,require("buffer").Buffer)
},{"buffer":8}],50:[function(require,module,exports){
(function (Buffer){
var toString = Object.prototype.toString

var isModern = (
  typeof Buffer.alloc === 'function' &&
  typeof Buffer.allocUnsafe === 'function' &&
  typeof Buffer.from === 'function'
)

function isArrayBuffer (input) {
  return toString.call(input).slice(8, -1) === 'ArrayBuffer'
}

function fromArrayBuffer (obj, byteOffset, length) {
  byteOffset >>>= 0

  var maxLength = obj.byteLength - byteOffset

  if (maxLength < 0) {
    throw new RangeError("'offset' is out of bounds")
  }

  if (length === undefined) {
    length = maxLength
  } else {
    length >>>= 0

    if (length > maxLength) {
      throw new RangeError("'length' is out of bounds")
    }
  }

  return isModern
    ? Buffer.from(obj.slice(byteOffset, byteOffset + length))
    : new Buffer(new Uint8Array(obj.slice(byteOffset, byteOffset + length)))
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('"encoding" must be a valid string encoding')
  }

  return isModern
    ? Buffer.from(string, encoding)
    : new Buffer(string, encoding)
}

function bufferFrom (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (isArrayBuffer(value)) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return isModern
    ? Buffer.from(value)
    : new Buffer(value)
}

module.exports = bufferFrom

}).call(this,require("buffer").Buffer)
},{"buffer":8}],51:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../../../../../../../../../home/stever/.local/node-v12.16.1-linux-x64/lib/node_modules/watchify/node_modules/is-buffer/index.js")})
},{"../../../../../../../../../../home/stever/.local/node-v12.16.1-linux-x64/lib/node_modules/watchify/node_modules/is-buffer/index.js":13}],52:[function(require,module,exports){
"use strict";

var isValue             = require("type/value/is")
  , ensureValue         = require("type/value/ensure")
  , ensurePlainFunction = require("type/plain-function/ensure")
  , copy                = require("es5-ext/object/copy")
  , normalizeOptions    = require("es5-ext/object/normalize-options")
  , map                 = require("es5-ext/object/map");

var bind = Function.prototype.bind
  , defineProperty = Object.defineProperty
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , define;

define = function (name, desc, options) {
	var value = ensureValue(desc) && ensurePlainFunction(desc.value), dgs;
	dgs = copy(desc);
	delete dgs.writable;
	delete dgs.value;
	dgs.get = function () {
		if (!options.overwriteDefinition && hasOwnProperty.call(this, name)) return value;
		desc.value = bind.call(value, options.resolveContext ? options.resolveContext(this) : this);
		defineProperty(this, name, desc);
		return this[name];
	};
	return dgs;
};

module.exports = function (props/*, options*/) {
	var options = normalizeOptions(arguments[1]);
	if (isValue(options.resolveContext)) ensurePlainFunction(options.resolveContext);
	return map(props, function (desc, name) { return define(name, desc, options); });
};

},{"es5-ext/object/copy":76,"es5-ext/object/map":84,"es5-ext/object/normalize-options":85,"type/plain-function/ensure":168,"type/value/ensure":172,"type/value/is":173}],53:[function(require,module,exports){
"use strict";

var isValue         = require("type/value/is")
  , isPlainFunction = require("type/plain-function/is")
  , assign          = require("es5-ext/object/assign")
  , normalizeOpts   = require("es5-ext/object/normalize-options")
  , contains        = require("es5-ext/string/#/contains");

var d = (module.exports = function (dscr, value/*, options*/) {
	var c, e, w, options, desc;
	if (arguments.length < 2 || typeof dscr !== "string") {
		options = value;
		value = dscr;
		dscr = null;
	} else {
		options = arguments[2];
	}
	if (isValue(dscr)) {
		c = contains.call(dscr, "c");
		e = contains.call(dscr, "e");
		w = contains.call(dscr, "w");
	} else {
		c = w = true;
		e = false;
	}

	desc = { value: value, configurable: c, enumerable: e, writable: w };
	return !options ? desc : assign(normalizeOpts(options), desc);
});

d.gs = function (dscr, get, set/*, options*/) {
	var c, e, options, desc;
	if (typeof dscr !== "string") {
		options = set;
		set = get;
		get = dscr;
		dscr = null;
	} else {
		options = arguments[3];
	}
	if (!isValue(get)) {
		get = undefined;
	} else if (!isPlainFunction(get)) {
		options = get;
		get = set = undefined;
	} else if (!isValue(set)) {
		set = undefined;
	} else if (!isPlainFunction(set)) {
		options = set;
		set = undefined;
	}
	if (isValue(dscr)) {
		c = contains.call(dscr, "c");
		e = contains.call(dscr, "e");
	} else {
		c = true;
		e = false;
	}

	desc = { get: get, set: set, configurable: c, enumerable: e };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

},{"es5-ext/object/assign":73,"es5-ext/object/normalize-options":85,"es5-ext/string/#/contains":92,"type/plain-function/is":169,"type/value/is":173}],54:[function(require,module,exports){
(function (process,Buffer){
var stream = require('readable-stream')
var eos = require('end-of-stream')
var inherits = require('inherits')
var shift = require('stream-shift')

var SIGNAL_FLUSH = (Buffer.from && Buffer.from !== Uint8Array.from)
  ? Buffer.from([0])
  : new Buffer([0])

var onuncork = function(self, fn) {
  if (self._corked) self.once('uncork', fn)
  else fn()
}

var autoDestroy = function (self, err) {
  if (self._autoDestroy) self.destroy(err)
}

var destroyer = function(self, end) {
  return function(err) {
    if (err) autoDestroy(self, err.message === 'premature close' ? null : err)
    else if (end && !self._ended) self.end()
  }
}

var end = function(ws, fn) {
  if (!ws) return fn()
  if (ws._writableState && ws._writableState.finished) return fn()
  if (ws._writableState) return ws.end(fn)
  ws.end()
  fn()
}

var toStreams2 = function(rs) {
  return new (stream.Readable)({objectMode:true, highWaterMark:16}).wrap(rs)
}

var Duplexify = function(writable, readable, opts) {
  if (!(this instanceof Duplexify)) return new Duplexify(writable, readable, opts)
  stream.Duplex.call(this, opts)

  this._writable = null
  this._readable = null
  this._readable2 = null

  this._autoDestroy = !opts || opts.autoDestroy !== false
  this._forwardDestroy = !opts || opts.destroy !== false
  this._forwardEnd = !opts || opts.end !== false
  this._corked = 1 // start corked
  this._ondrain = null
  this._drained = false
  this._forwarding = false
  this._unwrite = null
  this._unread = null
  this._ended = false

  this.destroyed = false

  if (writable) this.setWritable(writable)
  if (readable) this.setReadable(readable)
}

inherits(Duplexify, stream.Duplex)

Duplexify.obj = function(writable, readable, opts) {
  if (!opts) opts = {}
  opts.objectMode = true
  opts.highWaterMark = 16
  return new Duplexify(writable, readable, opts)
}

Duplexify.prototype.cork = function() {
  if (++this._corked === 1) this.emit('cork')
}

Duplexify.prototype.uncork = function() {
  if (this._corked && --this._corked === 0) this.emit('uncork')
}

Duplexify.prototype.setWritable = function(writable) {
  if (this._unwrite) this._unwrite()

  if (this.destroyed) {
    if (writable && writable.destroy) writable.destroy()
    return
  }

  if (writable === null || writable === false) {
    this.end()
    return
  }

  var self = this
  var unend = eos(writable, {writable:true, readable:false}, destroyer(this, this._forwardEnd))

  var ondrain = function() {
    var ondrain = self._ondrain
    self._ondrain = null
    if (ondrain) ondrain()
  }

  var clear = function() {
    self._writable.removeListener('drain', ondrain)
    unend()
  }

  if (this._unwrite) process.nextTick(ondrain) // force a drain on stream reset to avoid livelocks

  this._writable = writable
  this._writable.on('drain', ondrain)
  this._unwrite = clear

  this.uncork() // always uncork setWritable
}

Duplexify.prototype.setReadable = function(readable) {
  if (this._unread) this._unread()

  if (this.destroyed) {
    if (readable && readable.destroy) readable.destroy()
    return
  }

  if (readable === null || readable === false) {
    this.push(null)
    this.resume()
    return
  }

  var self = this
  var unend = eos(readable, {writable:false, readable:true}, destroyer(this))

  var onreadable = function() {
    self._forward()
  }

  var onend = function() {
    self.push(null)
  }

  var clear = function() {
    self._readable2.removeListener('readable', onreadable)
    self._readable2.removeListener('end', onend)
    unend()
  }

  this._drained = true
  this._readable = readable
  this._readable2 = readable._readableState ? readable : toStreams2(readable)
  this._readable2.on('readable', onreadable)
  this._readable2.on('end', onend)
  this._unread = clear

  this._forward()
}

Duplexify.prototype._read = function() {
  this._drained = true
  this._forward()
}

Duplexify.prototype._forward = function() {
  if (this._forwarding || !this._readable2 || !this._drained) return
  this._forwarding = true

  var data

  while (this._drained && (data = shift(this._readable2)) !== null) {
    if (this.destroyed) continue
    this._drained = this.push(data)
  }

  this._forwarding = false
}

Duplexify.prototype.destroy = function(err) {
  if (this.destroyed) return
  this.destroyed = true

  var self = this
  process.nextTick(function() {
    self._destroy(err)
  })
}

Duplexify.prototype._destroy = function(err) {
  if (err) {
    var ondrain = this._ondrain
    this._ondrain = null
    if (ondrain) ondrain(err)
    else this.emit('error', err)
  }

  if (this._forwardDestroy) {
    if (this._readable && this._readable.destroy) this._readable.destroy()
    if (this._writable && this._writable.destroy) this._writable.destroy()
  }

  this.emit('close')
}

Duplexify.prototype._write = function(data, enc, cb) {
  if (this.destroyed) return cb()
  if (this._corked) return onuncork(this, this._write.bind(this, data, enc, cb))
  if (data === SIGNAL_FLUSH) return this._finish(cb)
  if (!this._writable) return cb()

  if (this._writable.write(data) === false) this._ondrain = cb
  else cb()
}

Duplexify.prototype._finish = function(cb) {
  var self = this
  this.emit('preend')
  onuncork(this, function() {
    end(self._forwardEnd && self._writable, function() {
      // haxx to not emit prefinish twice
      if (self._writableState.prefinished === false) self._writableState.prefinished = true
      self.emit('prefinish')
      onuncork(self, cb)
    })
  })
}

Duplexify.prototype.end = function(data, enc, cb) {
  if (typeof data === 'function') return this.end(null, null, data)
  if (typeof enc === 'function') return this.end(data, null, enc)
  this._ended = true
  if (data) this.write(data)
  if (!this._writableState.ending) this.write(SIGNAL_FLUSH)
  return stream.Writable.prototype.end.call(this, cb)
}

module.exports = Duplexify

}).call(this,require('_process'),require("buffer").Buffer)
},{"_process":17,"buffer":8,"end-of-stream":55,"inherits":123,"readable-stream":152,"stream-shift":160}],55:[function(require,module,exports){
(function (process){
var once = require('once');

var noop = function() {};

var isRequest = function(stream) {
	return stream.setHeader && typeof stream.abort === 'function';
};

var isChildProcess = function(stream) {
	return stream.stdio && Array.isArray(stream.stdio) && stream.stdio.length === 3
};

var eos = function(stream, opts, callback) {
	if (typeof opts === 'function') return eos(stream, null, opts);
	if (!opts) opts = {};

	callback = once(callback || noop);

	var ws = stream._writableState;
	var rs = stream._readableState;
	var readable = opts.readable || (opts.readable !== false && stream.readable);
	var writable = opts.writable || (opts.writable !== false && stream.writable);
	var cancelled = false;

	var onlegacyfinish = function() {
		if (!stream.writable) onfinish();
	};

	var onfinish = function() {
		writable = false;
		if (!readable) callback.call(stream);
	};

	var onend = function() {
		readable = false;
		if (!writable) callback.call(stream);
	};

	var onexit = function(exitCode) {
		callback.call(stream, exitCode ? new Error('exited with error code: ' + exitCode) : null);
	};

	var onerror = function(err) {
		callback.call(stream, err);
	};

	var onclose = function() {
		process.nextTick(onclosenexttick);
	};

	var onclosenexttick = function() {
		if (cancelled) return;
		if (readable && !(rs && (rs.ended && !rs.destroyed))) return callback.call(stream, new Error('premature close'));
		if (writable && !(ws && (ws.ended && !ws.destroyed))) return callback.call(stream, new Error('premature close'));
	};

	var onrequest = function() {
		stream.req.on('finish', onfinish);
	};

	if (isRequest(stream)) {
		stream.on('complete', onfinish);
		stream.on('abort', onclose);
		if (stream.req) onrequest();
		else stream.on('request', onrequest);
	} else if (writable && !ws) { // legacy streams
		stream.on('end', onlegacyfinish);
		stream.on('close', onlegacyfinish);
	}

	if (isChildProcess(stream)) stream.on('exit', onexit);

	stream.on('end', onend);
	stream.on('finish', onfinish);
	if (opts.error !== false) stream.on('error', onerror);
	stream.on('close', onclose);

	return function() {
		cancelled = true;
		stream.removeListener('complete', onfinish);
		stream.removeListener('abort', onclose);
		stream.removeListener('request', onrequest);
		if (stream.req) stream.req.removeListener('finish', onfinish);
		stream.removeListener('end', onlegacyfinish);
		stream.removeListener('close', onlegacyfinish);
		stream.removeListener('finish', onfinish);
		stream.removeListener('exit', onexit);
		stream.removeListener('end', onend);
		stream.removeListener('error', onerror);
		stream.removeListener('close', onclose);
	};
};

module.exports = eos;

}).call(this,require('_process'))
},{"_process":17,"once":141}],56:[function(require,module,exports){
// Inspired by Google Closure:
// http://closure-library.googlecode.com/svn/docs/
// closure_goog_array_array.js.html#goog.array.clear

"use strict";

var value = require("../../object/valid-value");

module.exports = function () {
	value(this).length = 0;
	return this;
};

},{"../../object/valid-value":91}],57:[function(require,module,exports){
"use strict";

var numberIsNaN       = require("../../number/is-nan")
  , toPosInt          = require("../../number/to-pos-integer")
  , value             = require("../../object/valid-value")
  , indexOf           = Array.prototype.indexOf
  , objHasOwnProperty = Object.prototype.hasOwnProperty
  , abs               = Math.abs
  , floor             = Math.floor;

module.exports = function (searchElement/*, fromIndex*/) {
	var i, length, fromIndex, val;
	if (!numberIsNaN(searchElement)) return indexOf.apply(this, arguments);

	length = toPosInt(value(this).length);
	fromIndex = arguments[1];
	if (isNaN(fromIndex)) fromIndex = 0;
	else if (fromIndex >= 0) fromIndex = floor(fromIndex);
	else fromIndex = toPosInt(this.length) - floor(abs(fromIndex));

	for (i = fromIndex; i < length; ++i) {
		if (objHasOwnProperty.call(this, i)) {
			val = this[i];
			if (numberIsNaN(val)) return i; // Jslint: ignore
		}
	}
	return -1;
};

},{"../../number/is-nan":67,"../../number/to-pos-integer":71,"../../object/valid-value":91}],58:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")() ? Array.from : require("./shim");

},{"./is-implemented":59,"./shim":60}],59:[function(require,module,exports){
"use strict";

module.exports = function () {
	var from = Array.from, arr, result;
	if (typeof from !== "function") return false;
	arr = ["raz", "dwa"];
	result = from(arr);
	return Boolean(result && result !== arr && result[1] === "dwa");
};

},{}],60:[function(require,module,exports){
"use strict";

var iteratorSymbol = require("es6-symbol").iterator
  , isArguments    = require("../../function/is-arguments")
  , isFunction     = require("../../function/is-function")
  , toPosInt       = require("../../number/to-pos-integer")
  , callable       = require("../../object/valid-callable")
  , validValue     = require("../../object/valid-value")
  , isValue        = require("../../object/is-value")
  , isString       = require("../../string/is-string")
  , isArray        = Array.isArray
  , call           = Function.prototype.call
  , desc           = { configurable: true, enumerable: true, writable: true, value: null }
  , defineProperty = Object.defineProperty;

// eslint-disable-next-line complexity, max-lines-per-function
module.exports = function (arrayLike/*, mapFn, thisArg*/) {
	var mapFn = arguments[1]
	  , thisArg = arguments[2]
	  , Context
	  , i
	  , j
	  , arr
	  , length
	  , code
	  , iterator
	  , result
	  , getIterator
	  , value;

	arrayLike = Object(validValue(arrayLike));

	if (isValue(mapFn)) callable(mapFn);
	if (!this || this === Array || !isFunction(this)) {
		// Result: Plain array
		if (!mapFn) {
			if (isArguments(arrayLike)) {
				// Source: Arguments
				length = arrayLike.length;
				if (length !== 1) return Array.apply(null, arrayLike);
				arr = new Array(1);
				arr[0] = arrayLike[0];
				return arr;
			}
			if (isArray(arrayLike)) {
				// Source: Array
				arr = new Array((length = arrayLike.length));
				for (i = 0; i < length; ++i) arr[i] = arrayLike[i];
				return arr;
			}
		}
		arr = [];
	} else {
		// Result: Non plain array
		Context = this;
	}

	if (!isArray(arrayLike)) {
		if ((getIterator = arrayLike[iteratorSymbol]) !== undefined) {
			// Source: Iterator
			iterator = callable(getIterator).call(arrayLike);
			if (Context) arr = new Context();
			result = iterator.next();
			i = 0;
			while (!result.done) {
				value = mapFn ? call.call(mapFn, thisArg, result.value, i) : result.value;
				if (Context) {
					desc.value = value;
					defineProperty(arr, i, desc);
				} else {
					arr[i] = value;
				}
				result = iterator.next();
				++i;
			}
			length = i;
		} else if (isString(arrayLike)) {
			// Source: String
			length = arrayLike.length;
			if (Context) arr = new Context();
			for (i = 0, j = 0; i < length; ++i) {
				value = arrayLike[i];
				if (i + 1 < length) {
					code = value.charCodeAt(0);
					// eslint-disable-next-line max-depth
					if (code >= 0xd800 && code <= 0xdbff) value += arrayLike[++i];
				}
				value = mapFn ? call.call(mapFn, thisArg, value, j) : value;
				if (Context) {
					desc.value = value;
					defineProperty(arr, j, desc);
				} else {
					arr[j] = value;
				}
				++j;
			}
			length = j;
		}
	}
	if (length === undefined) {
		// Source: array or array-like
		length = toPosInt(arrayLike.length);
		if (Context) arr = new Context(length);
		for (i = 0; i < length; ++i) {
			value = mapFn ? call.call(mapFn, thisArg, arrayLike[i], i) : arrayLike[i];
			if (Context) {
				desc.value = value;
				defineProperty(arr, i, desc);
			} else {
				arr[i] = value;
			}
		}
	}
	if (Context) {
		desc.value = null;
		arr.length = length;
	}
	return arr;
};

},{"../../function/is-arguments":61,"../../function/is-function":62,"../../number/to-pos-integer":71,"../../object/is-value":80,"../../object/valid-callable":90,"../../object/valid-value":91,"../../string/is-string":95,"es6-symbol":109}],61:[function(require,module,exports){
"use strict";

var objToString = Object.prototype.toString
  , id = objToString.call((function () { return arguments; })());

module.exports = function (value) { return objToString.call(value) === id; };

},{}],62:[function(require,module,exports){
"use strict";

var objToString = Object.prototype.toString
  , isFunctionStringTag = RegExp.prototype.test.bind(/^[object [A-Za-z0-9]*Function]$/);

module.exports = function (value) {
	return typeof value === "function" && isFunctionStringTag(objToString.call(value));
};

},{}],63:[function(require,module,exports){
"use strict";

// eslint-disable-next-line no-empty-function
module.exports = function () {};

},{}],64:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")() ? Math.sign : require("./shim");

},{"./is-implemented":65,"./shim":66}],65:[function(require,module,exports){
"use strict";

module.exports = function () {
	var sign = Math.sign;
	if (typeof sign !== "function") return false;
	return sign(10) === 1 && sign(-20) === -1;
};

},{}],66:[function(require,module,exports){
"use strict";

module.exports = function (value) {
	value = Number(value);
	if (isNaN(value) || value === 0) return value;
	return value > 0 ? 1 : -1;
};

},{}],67:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")() ? Number.isNaN : require("./shim");

},{"./is-implemented":68,"./shim":69}],68:[function(require,module,exports){
"use strict";

module.exports = function () {
	var numberIsNaN = Number.isNaN;
	if (typeof numberIsNaN !== "function") return false;
	return !numberIsNaN({}) && numberIsNaN(NaN) && !numberIsNaN(34);
};

},{}],69:[function(require,module,exports){
"use strict";

module.exports = function (value) {
	// eslint-disable-next-line no-self-compare
	return value !== value;
};

},{}],70:[function(require,module,exports){
"use strict";

var sign  = require("../math/sign")
  , abs   = Math.abs
  , floor = Math.floor;

module.exports = function (value) {
	if (isNaN(value)) return 0;
	value = Number(value);
	if (value === 0 || !isFinite(value)) return value;
	return sign(value) * floor(abs(value));
};

},{"../math/sign":64}],71:[function(require,module,exports){
"use strict";

var toInteger = require("./to-integer")
  , max       = Math.max;

module.exports = function (value) { return max(0, toInteger(value)); };

},{"./to-integer":70}],72:[function(require,module,exports){
// Internal method, used by iteration functions.
// Calls a function for each key-value pair found in object
// Optionally takes compareFn to iterate object in specific order

"use strict";

var callable                = require("./valid-callable")
  , value                   = require("./valid-value")
  , bind                    = Function.prototype.bind
  , call                    = Function.prototype.call
  , keys                    = Object.keys
  , objPropertyIsEnumerable = Object.prototype.propertyIsEnumerable;

module.exports = function (method, defVal) {
	return function (obj, cb/*, thisArg, compareFn*/) {
		var list, thisArg = arguments[2], compareFn = arguments[3];
		obj = Object(value(obj));
		callable(cb);

		list = keys(obj);
		if (compareFn) {
			list.sort(typeof compareFn === "function" ? bind.call(compareFn, obj) : undefined);
		}
		if (typeof method !== "function") method = list[method];
		return call.call(method, list, function (key, index) {
			if (!objPropertyIsEnumerable.call(obj, key)) return defVal;
			return call.call(cb, thisArg, obj[key], key, obj, index);
		});
	};
};

},{"./valid-callable":90,"./valid-value":91}],73:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")() ? Object.assign : require("./shim");

},{"./is-implemented":74,"./shim":75}],74:[function(require,module,exports){
"use strict";

module.exports = function () {
	var assign = Object.assign, obj;
	if (typeof assign !== "function") return false;
	obj = { foo: "raz" };
	assign(obj, { bar: "dwa" }, { trzy: "trzy" });
	return obj.foo + obj.bar + obj.trzy === "razdwatrzy";
};

},{}],75:[function(require,module,exports){
"use strict";

var keys  = require("../keys")
  , value = require("../valid-value")
  , max   = Math.max;

module.exports = function (dest, src/*, …srcn*/) {
	var error, i, length = max(arguments.length, 2), assign;
	dest = Object(value(dest));
	assign = function (key) {
		try {
			dest[key] = src[key];
		} catch (e) {
			if (!error) error = e;
		}
	};
	for (i = 1; i < length; ++i) {
		src = arguments[i];
		keys(src).forEach(assign);
	}
	if (error !== undefined) throw error;
	return dest;
};

},{"../keys":81,"../valid-value":91}],76:[function(require,module,exports){
"use strict";

var aFrom  = require("../array/from")
  , assign = require("./assign")
  , value  = require("./valid-value");

module.exports = function (obj/*, propertyNames, options*/) {
	var copy = Object(value(obj)), propertyNames = arguments[1], options = Object(arguments[2]);
	if (copy !== obj && !propertyNames) return copy;
	var result = {};
	if (propertyNames) {
		aFrom(propertyNames, function (propertyName) {
			if (options.ensure || propertyName in obj) result[propertyName] = obj[propertyName];
		});
	} else {
		assign(result, obj);
	}
	return result;
};

},{"../array/from":58,"./assign":73,"./valid-value":91}],77:[function(require,module,exports){
// Workaround for http://code.google.com/p/v8/issues/detail?id=2804

"use strict";

var create = Object.create, shim;

if (!require("./set-prototype-of/is-implemented")()) {
	shim = require("./set-prototype-of/shim");
}

module.exports = (function () {
	var nullObject, polyProps, desc;
	if (!shim) return create;
	if (shim.level !== 1) return create;

	nullObject = {};
	polyProps = {};
	desc = { configurable: false, enumerable: false, writable: true, value: undefined };
	Object.getOwnPropertyNames(Object.prototype).forEach(function (name) {
		if (name === "__proto__") {
			polyProps[name] = {
				configurable: true,
				enumerable: false,
				writable: true,
				value: undefined
			};
			return;
		}
		polyProps[name] = desc;
	});
	Object.defineProperties(nullObject, polyProps);

	Object.defineProperty(shim, "nullPolyfill", {
		configurable: false,
		enumerable: false,
		writable: false,
		value: nullObject
	});

	return function (prototype, props) {
		return create(prototype === null ? nullObject : prototype, props);
	};
})();

},{"./set-prototype-of/is-implemented":88,"./set-prototype-of/shim":89}],78:[function(require,module,exports){
"use strict";

module.exports = require("./_iterate")("forEach");

},{"./_iterate":72}],79:[function(require,module,exports){
"use strict";

var isValue = require("./is-value");

var map = { function: true, object: true };

module.exports = function (value) { return (isValue(value) && map[typeof value]) || false; };

},{"./is-value":80}],80:[function(require,module,exports){
"use strict";

var _undefined = require("../function/noop")(); // Support ES3 engines

module.exports = function (val) { return val !== _undefined && val !== null; };

},{"../function/noop":63}],81:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")() ? Object.keys : require("./shim");

},{"./is-implemented":82,"./shim":83}],82:[function(require,module,exports){
"use strict";

module.exports = function () {
	try {
		Object.keys("primitive");
		return true;
	} catch (e) {
		return false;
	}
};

},{}],83:[function(require,module,exports){
"use strict";

var isValue = require("../is-value");

var keys = Object.keys;

module.exports = function (object) { return keys(isValue(object) ? Object(object) : object); };

},{"../is-value":80}],84:[function(require,module,exports){
"use strict";

var callable = require("./valid-callable")
  , forEach  = require("./for-each")
  , call     = Function.prototype.call;

module.exports = function (obj, cb/*, thisArg*/) {
	var result = {}, thisArg = arguments[2];
	callable(cb);
	forEach(obj, function (value, key, targetObj, index) {
		result[key] = call.call(cb, thisArg, value, key, targetObj, index);
	});
	return result;
};

},{"./for-each":78,"./valid-callable":90}],85:[function(require,module,exports){
"use strict";

var isValue = require("./is-value");

var forEach = Array.prototype.forEach, create = Object.create;

var process = function (src, obj) {
	var key;
	for (key in src) obj[key] = src[key];
};

// eslint-disable-next-line no-unused-vars
module.exports = function (opts1/*, …options*/) {
	var result = create(null);
	forEach.call(arguments, function (options) {
		if (!isValue(options)) return;
		process(Object(options), result);
	});
	return result;
};

},{"./is-value":80}],86:[function(require,module,exports){
"use strict";

var forEach = Array.prototype.forEach, create = Object.create;

// eslint-disable-next-line no-unused-vars
module.exports = function (arg/*, …args*/) {
	var set = create(null);
	forEach.call(arguments, function (name) { set[name] = true; });
	return set;
};

},{}],87:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")() ? Object.setPrototypeOf : require("./shim");

},{"./is-implemented":88,"./shim":89}],88:[function(require,module,exports){
"use strict";

var create = Object.create, getPrototypeOf = Object.getPrototypeOf, plainObject = {};

module.exports = function (/* CustomCreate*/) {
	var setPrototypeOf = Object.setPrototypeOf, customCreate = arguments[0] || create;
	if (typeof setPrototypeOf !== "function") return false;
	return getPrototypeOf(setPrototypeOf(customCreate(null), plainObject)) === plainObject;
};

},{}],89:[function(require,module,exports){
/* eslint no-proto: "off" */

// Big thanks to @WebReflection for sorting this out
// https://gist.github.com/WebReflection/5593554

"use strict";

var isObject         = require("../is-object")
  , value            = require("../valid-value")
  , objIsPrototypeOf = Object.prototype.isPrototypeOf
  , defineProperty   = Object.defineProperty
  , nullDesc         = { configurable: true, enumerable: false, writable: true, value: undefined }
  , validate;

validate = function (obj, prototype) {
	value(obj);
	if (prototype === null || isObject(prototype)) return obj;
	throw new TypeError("Prototype must be null or an object");
};

module.exports = (function (status) {
	var fn, set;
	if (!status) return null;
	if (status.level === 2) {
		if (status.set) {
			set = status.set;
			fn = function (obj, prototype) {
				set.call(validate(obj, prototype), prototype);
				return obj;
			};
		} else {
			fn = function (obj, prototype) {
				validate(obj, prototype).__proto__ = prototype;
				return obj;
			};
		}
	} else {
		fn = function self(obj, prototype) {
			var isNullBase;
			validate(obj, prototype);
			isNullBase = objIsPrototypeOf.call(self.nullPolyfill, obj);
			if (isNullBase) delete self.nullPolyfill.__proto__;
			if (prototype === null) prototype = self.nullPolyfill;
			obj.__proto__ = prototype;
			if (isNullBase) defineProperty(self.nullPolyfill, "__proto__", nullDesc);
			return obj;
		};
	}
	return Object.defineProperty(fn, "level", {
		configurable: false,
		enumerable: false,
		writable: false,
		value: status.level
	});
})(
	(function () {
		var tmpObj1 = Object.create(null)
		  , tmpObj2 = {}
		  , set
		  , desc = Object.getOwnPropertyDescriptor(Object.prototype, "__proto__");

		if (desc) {
			try {
				set = desc.set; // Opera crashes at this point
				set.call(tmpObj1, tmpObj2);
			} catch (ignore) {}
			if (Object.getPrototypeOf(tmpObj1) === tmpObj2) return { set: set, level: 2 };
		}

		tmpObj1.__proto__ = tmpObj2;
		if (Object.getPrototypeOf(tmpObj1) === tmpObj2) return { level: 2 };

		tmpObj1 = {};
		tmpObj1.__proto__ = tmpObj2;
		if (Object.getPrototypeOf(tmpObj1) === tmpObj2) return { level: 1 };

		return false;
	})()
);

require("../create");

},{"../create":77,"../is-object":79,"../valid-value":91}],90:[function(require,module,exports){
"use strict";

module.exports = function (fn) {
	if (typeof fn !== "function") throw new TypeError(fn + " is not a function");
	return fn;
};

},{}],91:[function(require,module,exports){
"use strict";

var isValue = require("./is-value");

module.exports = function (value) {
	if (!isValue(value)) throw new TypeError("Cannot use null or undefined");
	return value;
};

},{"./is-value":80}],92:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")() ? String.prototype.contains : require("./shim");

},{"./is-implemented":93,"./shim":94}],93:[function(require,module,exports){
"use strict";

var str = "razdwatrzy";

module.exports = function () {
	if (typeof str.contains !== "function") return false;
	return str.contains("dwa") === true && str.contains("foo") === false;
};

},{}],94:[function(require,module,exports){
"use strict";

var indexOf = String.prototype.indexOf;

module.exports = function (searchString/*, position*/) {
	return indexOf.call(this, searchString, arguments[1]) > -1;
};

},{}],95:[function(require,module,exports){
"use strict";

var objToString = Object.prototype.toString, id = objToString.call("");

module.exports = function (value) {
	return (
		typeof value === "string" ||
		(value &&
			typeof value === "object" &&
			(value instanceof String || objToString.call(value) === id)) ||
		false
	);
};

},{}],96:[function(require,module,exports){
"use strict";

var setPrototypeOf = require("es5-ext/object/set-prototype-of")
  , contains       = require("es5-ext/string/#/contains")
  , d              = require("d")
  , Symbol         = require("es6-symbol")
  , Iterator       = require("./");

var defineProperty = Object.defineProperty, ArrayIterator;

ArrayIterator = module.exports = function (arr, kind) {
	if (!(this instanceof ArrayIterator)) throw new TypeError("Constructor requires 'new'");
	Iterator.call(this, arr);
	if (!kind) kind = "value";
	else if (contains.call(kind, "key+value")) kind = "key+value";
	else if (contains.call(kind, "key")) kind = "key";
	else kind = "value";
	defineProperty(this, "__kind__", d("", kind));
};
if (setPrototypeOf) setPrototypeOf(ArrayIterator, Iterator);

// Internal %ArrayIteratorPrototype% doesn't expose its constructor
delete ArrayIterator.prototype.constructor;

ArrayIterator.prototype = Object.create(Iterator.prototype, {
	_resolve: d(function (i) {
		if (this.__kind__ === "value") return this.__list__[i];
		if (this.__kind__ === "key+value") return [i, this.__list__[i]];
		return i;
	})
});
defineProperty(ArrayIterator.prototype, Symbol.toStringTag, d("c", "Array Iterator"));

},{"./":99,"d":53,"es5-ext/object/set-prototype-of":87,"es5-ext/string/#/contains":92,"es6-symbol":109}],97:[function(require,module,exports){
"use strict";

var isArguments = require("es5-ext/function/is-arguments")
  , callable    = require("es5-ext/object/valid-callable")
  , isString    = require("es5-ext/string/is-string")
  , get         = require("./get");

var isArray = Array.isArray, call = Function.prototype.call, some = Array.prototype.some;

module.exports = function (iterable, cb /*, thisArg*/) {
	var mode, thisArg = arguments[2], result, doBreak, broken, i, length, char, code;
	if (isArray(iterable) || isArguments(iterable)) mode = "array";
	else if (isString(iterable)) mode = "string";
	else iterable = get(iterable);

	callable(cb);
	doBreak = function () {
		broken = true;
	};
	if (mode === "array") {
		some.call(iterable, function (value) {
			call.call(cb, thisArg, value, doBreak);
			return broken;
		});
		return;
	}
	if (mode === "string") {
		length = iterable.length;
		for (i = 0; i < length; ++i) {
			char = iterable[i];
			if (i + 1 < length) {
				code = char.charCodeAt(0);
				if (code >= 0xd800 && code <= 0xdbff) char += iterable[++i];
			}
			call.call(cb, thisArg, char, doBreak);
			if (broken) break;
		}
		return;
	}
	result = iterable.next();

	while (!result.done) {
		call.call(cb, thisArg, result.value, doBreak);
		if (broken) return;
		result = iterable.next();
	}
};

},{"./get":98,"es5-ext/function/is-arguments":61,"es5-ext/object/valid-callable":90,"es5-ext/string/is-string":95}],98:[function(require,module,exports){
"use strict";

var isArguments    = require("es5-ext/function/is-arguments")
  , isString       = require("es5-ext/string/is-string")
  , ArrayIterator  = require("./array")
  , StringIterator = require("./string")
  , iterable       = require("./valid-iterable")
  , iteratorSymbol = require("es6-symbol").iterator;

module.exports = function (obj) {
	if (typeof iterable(obj)[iteratorSymbol] === "function") return obj[iteratorSymbol]();
	if (isArguments(obj)) return new ArrayIterator(obj);
	if (isString(obj)) return new StringIterator(obj);
	return new ArrayIterator(obj);
};

},{"./array":96,"./string":101,"./valid-iterable":102,"es5-ext/function/is-arguments":61,"es5-ext/string/is-string":95,"es6-symbol":109}],99:[function(require,module,exports){
"use strict";

var clear    = require("es5-ext/array/#/clear")
  , assign   = require("es5-ext/object/assign")
  , callable = require("es5-ext/object/valid-callable")
  , value    = require("es5-ext/object/valid-value")
  , d        = require("d")
  , autoBind = require("d/auto-bind")
  , Symbol   = require("es6-symbol");

var defineProperty = Object.defineProperty, defineProperties = Object.defineProperties, Iterator;

module.exports = Iterator = function (list, context) {
	if (!(this instanceof Iterator)) throw new TypeError("Constructor requires 'new'");
	defineProperties(this, {
		__list__: d("w", value(list)),
		__context__: d("w", context),
		__nextIndex__: d("w", 0)
	});
	if (!context) return;
	callable(context.on);
	context.on("_add", this._onAdd);
	context.on("_delete", this._onDelete);
	context.on("_clear", this._onClear);
};

// Internal %IteratorPrototype% doesn't expose its constructor
delete Iterator.prototype.constructor;

defineProperties(
	Iterator.prototype,
	assign(
		{
			_next: d(function () {
				var i;
				if (!this.__list__) return undefined;
				if (this.__redo__) {
					i = this.__redo__.shift();
					if (i !== undefined) return i;
				}
				if (this.__nextIndex__ < this.__list__.length) return this.__nextIndex__++;
				this._unBind();
				return undefined;
			}),
			next: d(function () {
				return this._createResult(this._next());
			}),
			_createResult: d(function (i) {
				if (i === undefined) return { done: true, value: undefined };
				return { done: false, value: this._resolve(i) };
			}),
			_resolve: d(function (i) {
				return this.__list__[i];
			}),
			_unBind: d(function () {
				this.__list__ = null;
				delete this.__redo__;
				if (!this.__context__) return;
				this.__context__.off("_add", this._onAdd);
				this.__context__.off("_delete", this._onDelete);
				this.__context__.off("_clear", this._onClear);
				this.__context__ = null;
			}),
			toString: d(function () {
				return "[object " + (this[Symbol.toStringTag] || "Object") + "]";
			})
		},
		autoBind({
			_onAdd: d(function (index) {
				if (index >= this.__nextIndex__) return;
				++this.__nextIndex__;
				if (!this.__redo__) {
					defineProperty(this, "__redo__", d("c", [index]));
					return;
				}
				this.__redo__.forEach(function (redo, i) {
					if (redo >= index) this.__redo__[i] = ++redo;
				}, this);
				this.__redo__.push(index);
			}),
			_onDelete: d(function (index) {
				var i;
				if (index >= this.__nextIndex__) return;
				--this.__nextIndex__;
				if (!this.__redo__) return;
				i = this.__redo__.indexOf(index);
				if (i !== -1) this.__redo__.splice(i, 1);
				this.__redo__.forEach(function (redo, j) {
					if (redo > index) this.__redo__[j] = --redo;
				}, this);
			}),
			_onClear: d(function () {
				if (this.__redo__) clear.call(this.__redo__);
				this.__nextIndex__ = 0;
			})
		})
	)
);

defineProperty(
	Iterator.prototype,
	Symbol.iterator,
	d(function () {
		return this;
	})
);

},{"d":53,"d/auto-bind":52,"es5-ext/array/#/clear":56,"es5-ext/object/assign":73,"es5-ext/object/valid-callable":90,"es5-ext/object/valid-value":91,"es6-symbol":109}],100:[function(require,module,exports){
"use strict";

var isArguments = require("es5-ext/function/is-arguments")
  , isValue     = require("es5-ext/object/is-value")
  , isString    = require("es5-ext/string/is-string");

var iteratorSymbol = require("es6-symbol").iterator
  , isArray        = Array.isArray;

module.exports = function (value) {
	if (!isValue(value)) return false;
	if (isArray(value)) return true;
	if (isString(value)) return true;
	if (isArguments(value)) return true;
	return typeof value[iteratorSymbol] === "function";
};

},{"es5-ext/function/is-arguments":61,"es5-ext/object/is-value":80,"es5-ext/string/is-string":95,"es6-symbol":109}],101:[function(require,module,exports){
// Thanks @mathiasbynens
// http://mathiasbynens.be/notes/javascript-unicode#iterating-over-symbols

"use strict";

var setPrototypeOf = require("es5-ext/object/set-prototype-of")
  , d              = require("d")
  , Symbol         = require("es6-symbol")
  , Iterator       = require("./");

var defineProperty = Object.defineProperty, StringIterator;

StringIterator = module.exports = function (str) {
	if (!(this instanceof StringIterator)) throw new TypeError("Constructor requires 'new'");
	str = String(str);
	Iterator.call(this, str);
	defineProperty(this, "__length__", d("", str.length));
};
if (setPrototypeOf) setPrototypeOf(StringIterator, Iterator);

// Internal %ArrayIteratorPrototype% doesn't expose its constructor
delete StringIterator.prototype.constructor;

StringIterator.prototype = Object.create(Iterator.prototype, {
	_next: d(function () {
		if (!this.__list__) return undefined;
		if (this.__nextIndex__ < this.__length__) return this.__nextIndex__++;
		this._unBind();
		return undefined;
	}),
	_resolve: d(function (i) {
		var char = this.__list__[i], code;
		if (this.__nextIndex__ === this.__length__) return char;
		code = char.charCodeAt(0);
		if (code >= 0xd800 && code <= 0xdbff) return char + this.__list__[this.__nextIndex__++];
		return char;
	})
});
defineProperty(StringIterator.prototype, Symbol.toStringTag, d("c", "String Iterator"));

},{"./":99,"d":53,"es5-ext/object/set-prototype-of":87,"es6-symbol":109}],102:[function(require,module,exports){
"use strict";

var isIterable = require("./is-iterable");

module.exports = function (value) {
	if (!isIterable(value)) throw new TypeError(value + " is not iterable");
	return value;
};

},{"./is-iterable":100}],103:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')() ? Map : require('./polyfill');

},{"./is-implemented":104,"./polyfill":108}],104:[function(require,module,exports){
'use strict';

module.exports = function () {
	var map, iterator, result;
	if (typeof Map !== 'function') return false;
	try {
		// WebKit doesn't support arguments and crashes
		map = new Map([['raz', 'one'], ['dwa', 'two'], ['trzy', 'three']]);
	} catch (e) {
		return false;
	}
	if (String(map) !== '[object Map]') return false;
	if (map.size !== 3) return false;
	if (typeof map.clear !== 'function') return false;
	if (typeof map.delete !== 'function') return false;
	if (typeof map.entries !== 'function') return false;
	if (typeof map.forEach !== 'function') return false;
	if (typeof map.get !== 'function') return false;
	if (typeof map.has !== 'function') return false;
	if (typeof map.keys !== 'function') return false;
	if (typeof map.set !== 'function') return false;
	if (typeof map.values !== 'function') return false;

	iterator = map.entries();
	result = iterator.next();
	if (result.done !== false) return false;
	if (!result.value) return false;
	if (result.value[0] !== 'raz') return false;
	if (result.value[1] !== 'one') return false;

	return true;
};

},{}],105:[function(require,module,exports){
// Exports true if environment provides native `Map` implementation,
// whatever that is.

'use strict';

module.exports = (function () {
	if (typeof Map === 'undefined') return false;
	return (Object.prototype.toString.call(new Map()) === '[object Map]');
}());

},{}],106:[function(require,module,exports){
'use strict';

module.exports = require('es5-ext/object/primitive-set')('key',
	'value', 'key+value');

},{"es5-ext/object/primitive-set":86}],107:[function(require,module,exports){
'use strict';

var setPrototypeOf    = require('es5-ext/object/set-prototype-of')
  , d                 = require('d')
  , Iterator          = require('es6-iterator')
  , toStringTagSymbol = require('es6-symbol').toStringTag
  , kinds             = require('./iterator-kinds')

  , defineProperties = Object.defineProperties
  , unBind = Iterator.prototype._unBind
  , MapIterator;

MapIterator = module.exports = function (map, kind) {
	if (!(this instanceof MapIterator)) return new MapIterator(map, kind);
	Iterator.call(this, map.__mapKeysData__, map);
	if (!kind || !kinds[kind]) kind = 'key+value';
	defineProperties(this, {
		__kind__: d('', kind),
		__values__: d('w', map.__mapValuesData__)
	});
};
if (setPrototypeOf) setPrototypeOf(MapIterator, Iterator);

MapIterator.prototype = Object.create(Iterator.prototype, {
	constructor: d(MapIterator),
	_resolve: d(function (i) {
		if (this.__kind__ === 'value') return this.__values__[i];
		if (this.__kind__ === 'key') return this.__list__[i];
		return [this.__list__[i], this.__values__[i]];
	}),
	_unBind: d(function () {
		this.__values__ = null;
		unBind.call(this);
	}),
	toString: d(function () { return '[object Map Iterator]'; })
});
Object.defineProperty(MapIterator.prototype, toStringTagSymbol,
	d('c', 'Map Iterator'));

},{"./iterator-kinds":106,"d":53,"es5-ext/object/set-prototype-of":87,"es6-iterator":99,"es6-symbol":109}],108:[function(require,module,exports){
'use strict';

var clear          = require('es5-ext/array/#/clear')
  , eIndexOf       = require('es5-ext/array/#/e-index-of')
  , setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , callable       = require('es5-ext/object/valid-callable')
  , validValue     = require('es5-ext/object/valid-value')
  , d              = require('d')
  , ee             = require('event-emitter')
  , Symbol         = require('es6-symbol')
  , iterator       = require('es6-iterator/valid-iterable')
  , forOf          = require('es6-iterator/for-of')
  , Iterator       = require('./lib/iterator')
  , isNative       = require('./is-native-implemented')

  , call = Function.prototype.call
  , defineProperties = Object.defineProperties, getPrototypeOf = Object.getPrototypeOf
  , MapPoly;

module.exports = MapPoly = function (/*iterable*/) {
	var iterable = arguments[0], keys, values, self;
	if (!(this instanceof MapPoly)) throw new TypeError('Constructor requires \'new\'');
	if (isNative && setPrototypeOf && (Map !== MapPoly)) {
		self = setPrototypeOf(new Map(), getPrototypeOf(this));
	} else {
		self = this;
	}
	if (iterable != null) iterator(iterable);
	defineProperties(self, {
		__mapKeysData__: d('c', keys = []),
		__mapValuesData__: d('c', values = [])
	});
	if (!iterable) return self;
	forOf(iterable, function (value) {
		var key = validValue(value)[0];
		value = value[1];
		if (eIndexOf.call(keys, key) !== -1) return;
		keys.push(key);
		values.push(value);
	}, self);
	return self;
};

if (isNative) {
	if (setPrototypeOf) setPrototypeOf(MapPoly, Map);
	MapPoly.prototype = Object.create(Map.prototype, {
		constructor: d(MapPoly)
	});
}

ee(defineProperties(MapPoly.prototype, {
	clear: d(function () {
		if (!this.__mapKeysData__.length) return;
		clear.call(this.__mapKeysData__);
		clear.call(this.__mapValuesData__);
		this.emit('_clear');
	}),
	delete: d(function (key) {
		var index = eIndexOf.call(this.__mapKeysData__, key);
		if (index === -1) return false;
		this.__mapKeysData__.splice(index, 1);
		this.__mapValuesData__.splice(index, 1);
		this.emit('_delete', index, key);
		return true;
	}),
	entries: d(function () { return new Iterator(this, 'key+value'); }),
	forEach: d(function (cb/*, thisArg*/) {
		var thisArg = arguments[1], iterator, result;
		callable(cb);
		iterator = this.entries();
		result = iterator._next();
		while (result !== undefined) {
			call.call(cb, thisArg, this.__mapValuesData__[result],
				this.__mapKeysData__[result], this);
			result = iterator._next();
		}
	}),
	get: d(function (key) {
		var index = eIndexOf.call(this.__mapKeysData__, key);
		if (index === -1) return;
		return this.__mapValuesData__[index];
	}),
	has: d(function (key) {
		return (eIndexOf.call(this.__mapKeysData__, key) !== -1);
	}),
	keys: d(function () { return new Iterator(this, 'key'); }),
	set: d(function (key, value) {
		var index = eIndexOf.call(this.__mapKeysData__, key), emit;
		if (index === -1) {
			index = this.__mapKeysData__.push(key) - 1;
			emit = true;
		}
		this.__mapValuesData__[index] = value;
		if (emit) this.emit('_add', index, key);
		return this;
	}),
	size: d.gs(function () { return this.__mapKeysData__.length; }),
	values: d(function () { return new Iterator(this, 'value'); }),
	toString: d(function () { return '[object Map]'; })
}));
Object.defineProperty(MapPoly.prototype, Symbol.iterator, d(function () {
	return this.entries();
}));
Object.defineProperty(MapPoly.prototype, Symbol.toStringTag, d('c', 'Map'));

},{"./is-native-implemented":105,"./lib/iterator":107,"d":53,"es5-ext/array/#/clear":56,"es5-ext/array/#/e-index-of":57,"es5-ext/object/set-prototype-of":87,"es5-ext/object/valid-callable":90,"es5-ext/object/valid-value":91,"es6-iterator/for-of":97,"es6-iterator/valid-iterable":102,"es6-symbol":109,"event-emitter":117}],109:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")()
	? require("ext/global-this").Symbol
	: require("./polyfill");

},{"./is-implemented":110,"./polyfill":115,"ext/global-this":119}],110:[function(require,module,exports){
"use strict";

var global     = require("ext/global-this")
  , validTypes = { object: true, symbol: true };

module.exports = function () {
	var Symbol = global.Symbol;
	var symbol;
	if (typeof Symbol !== "function") return false;
	symbol = Symbol("test symbol");
	try { String(symbol); }
	catch (e) { return false; }

	// Return 'true' also for polyfills
	if (!validTypes[typeof Symbol.iterator]) return false;
	if (!validTypes[typeof Symbol.toPrimitive]) return false;
	if (!validTypes[typeof Symbol.toStringTag]) return false;

	return true;
};

},{"ext/global-this":119}],111:[function(require,module,exports){
"use strict";

module.exports = function (value) {
	if (!value) return false;
	if (typeof value === "symbol") return true;
	if (!value.constructor) return false;
	if (value.constructor.name !== "Symbol") return false;
	return value[value.constructor.toStringTag] === "Symbol";
};

},{}],112:[function(require,module,exports){
"use strict";

var d = require("d");

var create = Object.create, defineProperty = Object.defineProperty, objPrototype = Object.prototype;

var created = create(null);
module.exports = function (desc) {
	var postfix = 0, name, ie11BugWorkaround;
	while (created[desc + (postfix || "")]) ++postfix;
	desc += postfix || "";
	created[desc] = true;
	name = "@@" + desc;
	defineProperty(
		objPrototype,
		name,
		d.gs(null, function (value) {
			// For IE11 issue see:
			// https://connect.microsoft.com/IE/feedbackdetail/view/1928508/
			//    ie11-broken-getters-on-dom-objects
			// https://github.com/medikoo/es6-symbol/issues/12
			if (ie11BugWorkaround) return;
			ie11BugWorkaround = true;
			defineProperty(this, name, d(value));
			ie11BugWorkaround = false;
		})
	);
	return name;
};

},{"d":53}],113:[function(require,module,exports){
"use strict";

var d            = require("d")
  , NativeSymbol = require("ext/global-this").Symbol;

module.exports = function (SymbolPolyfill) {
	return Object.defineProperties(SymbolPolyfill, {
		// To ensure proper interoperability with other native functions (e.g. Array.from)
		// fallback to eventual native implementation of given symbol
		hasInstance: d(
			"", (NativeSymbol && NativeSymbol.hasInstance) || SymbolPolyfill("hasInstance")
		),
		isConcatSpreadable: d(
			"",
			(NativeSymbol && NativeSymbol.isConcatSpreadable) ||
				SymbolPolyfill("isConcatSpreadable")
		),
		iterator: d("", (NativeSymbol && NativeSymbol.iterator) || SymbolPolyfill("iterator")),
		match: d("", (NativeSymbol && NativeSymbol.match) || SymbolPolyfill("match")),
		replace: d("", (NativeSymbol && NativeSymbol.replace) || SymbolPolyfill("replace")),
		search: d("", (NativeSymbol && NativeSymbol.search) || SymbolPolyfill("search")),
		species: d("", (NativeSymbol && NativeSymbol.species) || SymbolPolyfill("species")),
		split: d("", (NativeSymbol && NativeSymbol.split) || SymbolPolyfill("split")),
		toPrimitive: d(
			"", (NativeSymbol && NativeSymbol.toPrimitive) || SymbolPolyfill("toPrimitive")
		),
		toStringTag: d(
			"", (NativeSymbol && NativeSymbol.toStringTag) || SymbolPolyfill("toStringTag")
		),
		unscopables: d(
			"", (NativeSymbol && NativeSymbol.unscopables) || SymbolPolyfill("unscopables")
		)
	});
};

},{"d":53,"ext/global-this":119}],114:[function(require,module,exports){
"use strict";

var d              = require("d")
  , validateSymbol = require("../../../validate-symbol");

var registry = Object.create(null);

module.exports = function (SymbolPolyfill) {
	return Object.defineProperties(SymbolPolyfill, {
		for: d(function (key) {
			if (registry[key]) return registry[key];
			return (registry[key] = SymbolPolyfill(String(key)));
		}),
		keyFor: d(function (symbol) {
			var key;
			validateSymbol(symbol);
			for (key in registry) {
				if (registry[key] === symbol) return key;
			}
			return undefined;
		})
	});
};

},{"../../../validate-symbol":116,"d":53}],115:[function(require,module,exports){
// ES2015 Symbol polyfill for environments that do not (or partially) support it

"use strict";

var d                    = require("d")
  , validateSymbol       = require("./validate-symbol")
  , NativeSymbol         = require("ext/global-this").Symbol
  , generateName         = require("./lib/private/generate-name")
  , setupStandardSymbols = require("./lib/private/setup/standard-symbols")
  , setupSymbolRegistry  = require("./lib/private/setup/symbol-registry");

var create = Object.create
  , defineProperties = Object.defineProperties
  , defineProperty = Object.defineProperty;

var SymbolPolyfill, HiddenSymbol, isNativeSafe;

if (typeof NativeSymbol === "function") {
	try {
		String(NativeSymbol());
		isNativeSafe = true;
	} catch (ignore) {}
} else {
	NativeSymbol = null;
}

// Internal constructor (not one exposed) for creating Symbol instances.
// This one is used to ensure that `someSymbol instanceof Symbol` always return false
HiddenSymbol = function Symbol(description) {
	if (this instanceof HiddenSymbol) throw new TypeError("Symbol is not a constructor");
	return SymbolPolyfill(description);
};

// Exposed `Symbol` constructor
// (returns instances of HiddenSymbol)
module.exports = SymbolPolyfill = function Symbol(description) {
	var symbol;
	if (this instanceof Symbol) throw new TypeError("Symbol is not a constructor");
	if (isNativeSafe) return NativeSymbol(description);
	symbol = create(HiddenSymbol.prototype);
	description = description === undefined ? "" : String(description);
	return defineProperties(symbol, {
		__description__: d("", description),
		__name__: d("", generateName(description))
	});
};

setupStandardSymbols(SymbolPolyfill);
setupSymbolRegistry(SymbolPolyfill);

// Internal tweaks for real symbol producer
defineProperties(HiddenSymbol.prototype, {
	constructor: d(SymbolPolyfill),
	toString: d("", function () { return this.__name__; })
});

// Proper implementation of methods exposed on Symbol.prototype
// They won't be accessible on produced symbol instances as they derive from HiddenSymbol.prototype
defineProperties(SymbolPolyfill.prototype, {
	toString: d(function () { return "Symbol (" + validateSymbol(this).__description__ + ")"; }),
	valueOf: d(function () { return validateSymbol(this); })
});
defineProperty(
	SymbolPolyfill.prototype,
	SymbolPolyfill.toPrimitive,
	d("", function () {
		var symbol = validateSymbol(this);
		if (typeof symbol === "symbol") return symbol;
		return symbol.toString();
	})
);
defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toStringTag, d("c", "Symbol"));

// Proper implementaton of toPrimitive and toStringTag for returned symbol instances
defineProperty(
	HiddenSymbol.prototype, SymbolPolyfill.toStringTag,
	d("c", SymbolPolyfill.prototype[SymbolPolyfill.toStringTag])
);

// Note: It's important to define `toPrimitive` as last one, as some implementations
// implement `toPrimitive` natively without implementing `toStringTag` (or other specified symbols)
// And that may invoke error in definition flow:
// See: https://github.com/medikoo/es6-symbol/issues/13#issuecomment-164146149
defineProperty(
	HiddenSymbol.prototype, SymbolPolyfill.toPrimitive,
	d("c", SymbolPolyfill.prototype[SymbolPolyfill.toPrimitive])
);

},{"./lib/private/generate-name":112,"./lib/private/setup/standard-symbols":113,"./lib/private/setup/symbol-registry":114,"./validate-symbol":116,"d":53,"ext/global-this":119}],116:[function(require,module,exports){
"use strict";

var isSymbol = require("./is-symbol");

module.exports = function (value) {
	if (!isSymbol(value)) throw new TypeError(value + " is not a symbol");
	return value;
};

},{"./is-symbol":111}],117:[function(require,module,exports){
'use strict';

var d        = require('d')
  , callable = require('es5-ext/object/valid-callable')

  , apply = Function.prototype.apply, call = Function.prototype.call
  , create = Object.create, defineProperty = Object.defineProperty
  , defineProperties = Object.defineProperties
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , descriptor = { configurable: true, enumerable: false, writable: true }

  , on, once, off, emit, methods, descriptors, base;

on = function (type, listener) {
	var data;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) {
		data = descriptor.value = create(null);
		defineProperty(this, '__ee__', descriptor);
		descriptor.value = null;
	} else {
		data = this.__ee__;
	}
	if (!data[type]) data[type] = listener;
	else if (typeof data[type] === 'object') data[type].push(listener);
	else data[type] = [data[type], listener];

	return this;
};

once = function (type, listener) {
	var once, self;

	callable(listener);
	self = this;
	on.call(this, type, once = function () {
		off.call(self, type, once);
		apply.call(listener, this, arguments);
	});

	once.__eeOnceListener__ = listener;
	return this;
};

off = function (type, listener) {
	var data, listeners, candidate, i;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) return this;
	data = this.__ee__;
	if (!data[type]) return this;
	listeners = data[type];

	if (typeof listeners === 'object') {
		for (i = 0; (candidate = listeners[i]); ++i) {
			if ((candidate === listener) ||
					(candidate.__eeOnceListener__ === listener)) {
				if (listeners.length === 2) data[type] = listeners[i ? 0 : 1];
				else listeners.splice(i, 1);
			}
		}
	} else {
		if ((listeners === listener) ||
				(listeners.__eeOnceListener__ === listener)) {
			delete data[type];
		}
	}

	return this;
};

emit = function (type) {
	var i, l, listener, listeners, args;

	if (!hasOwnProperty.call(this, '__ee__')) return;
	listeners = this.__ee__[type];
	if (!listeners) return;

	if (typeof listeners === 'object') {
		l = arguments.length;
		args = new Array(l - 1);
		for (i = 1; i < l; ++i) args[i - 1] = arguments[i];

		listeners = listeners.slice();
		for (i = 0; (listener = listeners[i]); ++i) {
			apply.call(listener, this, args);
		}
	} else {
		switch (arguments.length) {
		case 1:
			call.call(listeners, this);
			break;
		case 2:
			call.call(listeners, this, arguments[1]);
			break;
		case 3:
			call.call(listeners, this, arguments[1], arguments[2]);
			break;
		default:
			l = arguments.length;
			args = new Array(l - 1);
			for (i = 1; i < l; ++i) {
				args[i - 1] = arguments[i];
			}
			apply.call(listeners, this, args);
		}
	}
};

methods = {
	on: on,
	once: once,
	off: off,
	emit: emit
};

descriptors = {
	on: d(on),
	once: d(once),
	off: d(off),
	emit: d(emit)
};

base = defineProperties({}, descriptors);

module.exports = exports = function (o) {
	return (o == null) ? create(base) : defineProperties(Object(o), descriptors);
};
exports.methods = methods;

},{"d":53,"es5-ext/object/valid-callable":90}],118:[function(require,module,exports){
var naiveFallback = function () {
	if (typeof self === "object" && self) return self;
	if (typeof window === "object" && window) return window;
	throw new Error("Unable to resolve global `this`");
};

module.exports = (function () {
	if (this) return this;

	// Unexpected strict mode (may happen if e.g. bundled into ESM module)

	// Thanks @mathiasbynens -> https://mathiasbynens.be/notes/globalthis
	// In all ES5+ engines global object inherits from Object.prototype
	// (if you approached one that doesn't please report)
	try {
		Object.defineProperty(Object.prototype, "__global__", {
			get: function () { return this; },
			configurable: true
		});
	} catch (error) {
		// Unfortunate case of Object.prototype being sealed (via preventExtensions, seal or freeze)
		return naiveFallback();
	}
	try {
		// Safari case (window.__global__ is resolved with global context, but __global__ does not)
		if (!__global__) return naiveFallback();
		return __global__;
	} finally {
		delete Object.prototype.__global__;
	}
})();

},{}],119:[function(require,module,exports){
"use strict";

module.exports = require("./is-implemented")() ? globalThis : require("./implementation");

},{"./implementation":118,"./is-implemented":120}],120:[function(require,module,exports){
"use strict";

module.exports = function () {
	if (typeof globalThis !== "object") return false;
	if (!globalThis) return false;
	return globalThis.Array === Array;
};

},{}],121:[function(require,module,exports){
// getUserMedia helper by @HenrikJoreteg used for navigator.getUserMedia shim
var adapter = require('webrtc-adapter');

module.exports = function (constraints, cb) {
    var error;
    var haveOpts = arguments.length === 2;
    var defaultOpts = {video: true, audio: true};

    var denied = 'PermissionDeniedError';
    var altDenied = 'PERMISSION_DENIED';
    var notSatisfied = 'ConstraintNotSatisfiedError';

    // make constraints optional
    if (!haveOpts) {
        cb = constraints;
        constraints = defaultOpts;
    }

    // treat lack of browser support like an error
    if (typeof navigator === 'undefined' || !navigator.getUserMedia) {
        // throw proper error per spec
        error = new Error('MediaStreamError');
        error.name = 'NotSupportedError';

        // keep all callbacks async
        return setTimeout(function () {
            cb(error);
        }, 0);
    }

    // normalize error handling when no media types are requested
    if (!constraints.audio && !constraints.video) {
        error = new Error('MediaStreamError');
        error.name = 'NoMediaRequestedError';

        // keep all callbacks async
        return setTimeout(function () {
            cb(error);
        }, 0);
    }

    navigator.mediaDevices.getUserMedia(constraints)
    .then(function (stream) {
        cb(null, stream);
    }).catch(function (err) {
        var error;
        // coerce into an error object since FF gives us a string
        // there are only two valid names according to the spec
        // we coerce all non-denied to "constraint not satisfied".
        if (typeof err === 'string') {
            error = new Error('MediaStreamError');
            if (err === denied || err === altDenied) {
                error.name = denied;
            } else {
                error.name = notSatisfied;
            }
        } else {
            // if we get an error object make sure '.name' property is set
            // according to spec: http://dev.w3.org/2011/webrtc/editor/getusermedia.html#navigatorusermediaerror-and-navigatorusermediaerrorcallback
            error = err;
            if (!error.name) {
                // this is likely chrome which
                // sets a property called "ERROR_DENIED" on the error object
                // if so we make sure to set a name
                if (error[denied]) {
                    err.name = denied;
                } else {
                    err.name = notSatisfied;
                }
            }
        }

        cb(error);
    });
};

},{"webrtc-adapter":188}],122:[function(require,module,exports){
var WildEmitter = require('wildemitter');

function getMaxVolume (analyser, fftBins) {
  var maxVolume = -Infinity;
  analyser.getFloatFrequencyData(fftBins);

  for(var i=4, ii=fftBins.length; i < ii; i++) {
    if (fftBins[i] > maxVolume && fftBins[i] < 0) {
      maxVolume = fftBins[i];
    }
  };

  return maxVolume;
}


var audioContextType;
if (typeof window !== 'undefined') {
  audioContextType = window.AudioContext || window.webkitAudioContext;
}
// use a single audio context due to hardware limits
var audioContext = null;
module.exports = function(stream, options) {
  var harker = new WildEmitter();

  // make it not break in non-supported browsers
  if (!audioContextType) return harker;

  //Config
  var options = options || {},
      smoothing = (options.smoothing || 0.1),
      interval = (options.interval || 50),
      threshold = options.threshold,
      play = options.play,
      history = options.history || 10,
      running = true;

  // Ensure that just a single AudioContext is internally created
  audioContext = options.audioContext || audioContext || new audioContextType();

  var sourceNode, fftBins, analyser;

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = smoothing;
  fftBins = new Float32Array(analyser.frequencyBinCount);

  if (stream.jquery) stream = stream[0];
  if (stream instanceof HTMLAudioElement || stream instanceof HTMLVideoElement) {
    //Audio Tag
    sourceNode = audioContext.createMediaElementSource(stream);
    if (typeof play === 'undefined') play = true;
    threshold = threshold || -50;
  } else {
    //WebRTC Stream
    sourceNode = audioContext.createMediaStreamSource(stream);
    threshold = threshold || -50;
  }

  sourceNode.connect(analyser);
  if (play) analyser.connect(audioContext.destination);

  harker.speaking = false;

  harker.suspend = function() {
    return audioContext.suspend();
  }
  harker.resume = function() {
    return audioContext.resume();
  }
  Object.defineProperty(harker, 'state', { get: function() {
    return audioContext.state;
  }});
  audioContext.onstatechange = function() {
    harker.emit('state_change', audioContext.state);
  }

  harker.setThreshold = function(t) {
    threshold = t;
  };

  harker.setInterval = function(i) {
    interval = i;
  };

  harker.stop = function() {
    running = false;
    harker.emit('volume_change', -100, threshold);
    if (harker.speaking) {
      harker.speaking = false;
      harker.emit('stopped_speaking');
    }
    analyser.disconnect();
    sourceNode.disconnect();
  };
  harker.speakingHistory = [];
  for (var i = 0; i < history; i++) {
      harker.speakingHistory.push(0);
  }

  // Poll the analyser node to determine if speaking
  // and emit events if changed
  var looper = function() {
    setTimeout(function() {

      //check if stop has been called
      if(!running) {
        return;
      }

      var currentVolume = getMaxVolume(analyser, fftBins);

      harker.emit('volume_change', currentVolume, threshold);

      var history = 0;
      if (currentVolume > threshold && !harker.speaking) {
        // trigger quickly, short history
        for (var i = harker.speakingHistory.length - 3; i < harker.speakingHistory.length; i++) {
          history += harker.speakingHistory[i];
        }
        if (history >= 2) {
          harker.speaking = true;
          harker.emit('speaking');
        }
      } else if (currentVolume < threshold && harker.speaking) {
        for (var i = 0; i < harker.speakingHistory.length; i++) {
          history += harker.speakingHistory[i];
        }
        if (history == 0) {
          harker.speaking = false;
          harker.emit('stopped_speaking');
        }
      }
      harker.speakingHistory.shift();
      harker.speakingHistory.push(0 + (currentVolume > threshold));

      looper();
    }, interval);
  };
  looper();

  return harker;
}

},{"wildemitter":200}],123:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12}],124:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14}],125:[function(require,module,exports){
'use strict'

var Buffer = require('safe-buffer').Buffer

/* Protocol - protocol constants */
var protocol = module.exports

/* Command code => mnemonic */
protocol.types = {
  0: 'reserved',
  1: 'connect',
  2: 'connack',
  3: 'publish',
  4: 'puback',
  5: 'pubrec',
  6: 'pubrel',
  7: 'pubcomp',
  8: 'subscribe',
  9: 'suback',
  10: 'unsubscribe',
  11: 'unsuback',
  12: 'pingreq',
  13: 'pingresp',
  14: 'disconnect',
  15: 'reserved'
}

/* Mnemonic => Command code */
protocol.codes = {}
for (var k in protocol.types) {
  var v = protocol.types[k]
  protocol.codes[v] = k
}

/* Header */
protocol.CMD_SHIFT = 4
protocol.CMD_MASK = 0xF0
protocol.DUP_MASK = 0x08
protocol.QOS_MASK = 0x03
protocol.QOS_SHIFT = 1
protocol.RETAIN_MASK = 0x01

/* Length */
protocol.LENGTH_MASK = 0x7F
protocol.LENGTH_FIN_MASK = 0x80

/* Connack */
protocol.SESSIONPRESENT_MASK = 0x01
protocol.SESSIONPRESENT_HEADER = Buffer.from([protocol.SESSIONPRESENT_MASK])
protocol.CONNACK_HEADER = Buffer.from([protocol.codes['connack'] << protocol.CMD_SHIFT])

/* Connect */
protocol.USERNAME_MASK = 0x80
protocol.PASSWORD_MASK = 0x40
protocol.WILL_RETAIN_MASK = 0x20
protocol.WILL_QOS_MASK = 0x18
protocol.WILL_QOS_SHIFT = 3
protocol.WILL_FLAG_MASK = 0x04
protocol.CLEAN_SESSION_MASK = 0x02
protocol.CONNECT_HEADER = Buffer.from([protocol.codes['connect'] << protocol.CMD_SHIFT])

function genHeader (type) {
  return [0, 1, 2].map(function (qos) {
    return [0, 1].map(function (dup) {
      return [0, 1].map(function (retain) {
        var buf = new Buffer(1)
        buf.writeUInt8(
          protocol.codes[type] << protocol.CMD_SHIFT |
          (dup ? protocol.DUP_MASK : 0) |
          qos << protocol.QOS_SHIFT | retain, 0, true)
        return buf
      })
    })
  })
}

/* Publish */
protocol.PUBLISH_HEADER = genHeader('publish')

/* Subscribe */
protocol.SUBSCRIBE_HEADER = genHeader('subscribe')

/* Unsubscribe */
protocol.UNSUBSCRIBE_HEADER = genHeader('unsubscribe')

/* Confirmations */
protocol.ACKS = {
  unsuback: genHeader('unsuback'),
  puback: genHeader('puback'),
  pubcomp: genHeader('pubcomp'),
  pubrel: genHeader('pubrel'),
  pubrec: genHeader('pubrec')
}

protocol.SUBACK_HEADER = Buffer.from([protocol.codes['suback'] << protocol.CMD_SHIFT])

/* Protocol versions */
protocol.VERSION3 = Buffer.from([3])
protocol.VERSION4 = Buffer.from([4])

/* QoS */
protocol.QOS = [0, 1, 2].map(function (qos) {
  return Buffer.from([qos])
})

/* Empty packets */
protocol.EMPTY = {
  pingreq: Buffer.from([protocol.codes['pingreq'] << 4, 0]),
  pingresp: Buffer.from([protocol.codes['pingresp'] << 4, 0]),
  disconnect: Buffer.from([protocol.codes['disconnect'] << 4, 0])
}

},{"safe-buffer":154}],126:[function(require,module,exports){
'use strict'

var Buffer = require('safe-buffer').Buffer
var writeToStream = require('./writeToStream')
var EE = require('events').EventEmitter
var inherits = require('inherits')

function generate (packet) {
  var stream = new Accumulator()
  writeToStream(packet, stream)
  return stream.concat()
}

function Accumulator () {
  this._array = new Array(20)
  this._i = 0
}

inherits(Accumulator, EE)

Accumulator.prototype.write = function (chunk) {
  this._array[this._i++] = chunk
  return true
}

Accumulator.prototype.concat = function () {
  var length = 0
  var lengths = new Array(this._array.length)
  var list = this._array
  var pos = 0
  var i
  var result

  for (i = 0; i < list.length && list[i] !== undefined; i++) {
    if (typeof list[i] !== 'string') lengths[i] = list[i].length
    else lengths[i] = Buffer.byteLength(list[i])

    length += lengths[i]
  }

  result = Buffer.allocUnsafe(length)

  for (i = 0; i < list.length && list[i] !== undefined; i++) {
    if (typeof list[i] !== 'string') {
      list[i].copy(result, pos)
      pos += lengths[i]
    } else {
      result.write(list[i], pos)
      pos += lengths[i]
    }
  }

  return result
}

module.exports = generate

},{"./writeToStream":131,"events":10,"inherits":123,"safe-buffer":154}],127:[function(require,module,exports){
'use strict'

exports.parser = require('./parser')
exports.generate = require('./generate')
exports.writeToStream = require('./writeToStream')

},{"./generate":126,"./parser":130,"./writeToStream":131}],128:[function(require,module,exports){
'use strict'

var Buffer = require('safe-buffer').Buffer
var max = 65536
var cache = {}

function generateBuffer (i) {
  var buffer = Buffer.allocUnsafe(2)
  buffer.writeUInt8(i >> 8, 0)
  buffer.writeUInt8(i & 0x00FF, 0 + 1)

  return buffer
}

function generateCache () {
  for (var i = 0; i < max; i++) {
    cache[i] = generateBuffer(i)
  }
}

module.exports = {
  cache: cache,
  generateCache: generateCache,
  generateNumber: generateBuffer
}

},{"safe-buffer":154}],129:[function(require,module,exports){

function Packet () {
  this.cmd = null
  this.retain = false
  this.qos = 0
  this.dup = false
  this.length = -1
  this.topic = null
  this.payload = null
}

module.exports = Packet

},{}],130:[function(require,module,exports){
'use strict'

var bl = require('bl')
var inherits = require('inherits')
var EE = require('events').EventEmitter
var Packet = require('./packet')
var constants = require('./constants')

function Parser () {
  if (!(this instanceof Parser)) return new Parser()

  this._states = [
    '_parseHeader',
    '_parseLength',
    '_parsePayload',
    '_newPacket'
  ]

  this._resetState()
}

inherits(Parser, EE)

Parser.prototype._resetState = function () {
  this.packet = new Packet()
  this.error = null
  this._list = bl()
  this._stateCounter = 0
}

Parser.prototype.parse = function (buf) {
  if (this.error) this._resetState()

  this._list.append(buf)

  while ((this.packet.length !== -1 || this._list.length > 0) &&
         this[this._states[this._stateCounter]]() &&
         !this.error) {
    this._stateCounter++

    if (this._stateCounter >= this._states.length) this._stateCounter = 0
  }

  return this._list.length
}

Parser.prototype._parseHeader = function () {
  // There is at least one byte in the buffer
  var zero = this._list.readUInt8(0)
  this.packet.cmd = constants.types[zero >> constants.CMD_SHIFT]
  this.packet.retain = (zero & constants.RETAIN_MASK) !== 0
  this.packet.qos = (zero >> constants.QOS_SHIFT) & constants.QOS_MASK
  this.packet.dup = (zero & constants.DUP_MASK) !== 0

  this._list.consume(1)

  return true
}

Parser.prototype._parseLength = function () {
  // There is at least one byte in the list
  var bytes = 0
  var mul = 1
  var length = 0
  var result = true
  var current

  while (bytes < 5) {
    current = this._list.readUInt8(bytes++)
    length += mul * (current & constants.LENGTH_MASK)
    mul *= 0x80

    if ((current & constants.LENGTH_FIN_MASK) === 0) break
    if (this._list.length <= bytes) {
      result = false
      break
    }
  }

  if (result) {
    this.packet.length = length
    this._list.consume(bytes)
  }

  return result
}

Parser.prototype._parsePayload = function () {
  var result = false

  // Do we have a payload? Do we have enough data to complete the payload?
  // PINGs have no payload
  if (this.packet.length === 0 || this._list.length >= this.packet.length) {
    this._pos = 0

    switch (this.packet.cmd) {
      case 'connect':
        this._parseConnect()
        break
      case 'connack':
        this._parseConnack()
        break
      case 'publish':
        this._parsePublish()
        break
      case 'puback':
      case 'pubrec':
      case 'pubrel':
      case 'pubcomp':
        this._parseMessageId()
        break
      case 'subscribe':
        this._parseSubscribe()
        break
      case 'suback':
        this._parseSuback()
        break
      case 'unsubscribe':
        this._parseUnsubscribe()
        break
      case 'unsuback':
        this._parseUnsuback()
        break
      case 'pingreq':
      case 'pingresp':
      case 'disconnect':
        // These are empty, nothing to do
        break
      default:
        this._emitError(new Error('Not supported'))
    }

    result = true
  }

  return result
}

Parser.prototype._parseConnect = function () {
  var protocolId // Protocol ID
  var clientId // Client ID
  var topic // Will topic
  var payload // Will payload
  var password // Password
  var username // Username
  var flags = {}
  var packet = this.packet

  // Parse protocolId
  protocolId = this._parseString()

  if (protocolId === null) return this._emitError(new Error('Cannot parse protocolId'))
  if (protocolId !== 'MQTT' && protocolId !== 'MQIsdp') {
    return this._emitError(new Error('Invalid protocolId'))
  }

  packet.protocolId = protocolId

  // Parse constants version number
  if (this._pos >= this._list.length) return this._emitError(new Error('Packet too short'))

  packet.protocolVersion = this._list.readUInt8(this._pos)

  if (packet.protocolVersion !== 3 && packet.protocolVersion !== 4) {
    return this._emitError(new Error('Invalid protocol version'))
  }

  this._pos++

  if (this._pos >= this._list.length) {
    return this._emitError(new Error('Packet too short'))
  }

  // Parse connect flags
  flags.username = (this._list.readUInt8(this._pos) & constants.USERNAME_MASK)
  flags.password = (this._list.readUInt8(this._pos) & constants.PASSWORD_MASK)
  flags.will = (this._list.readUInt8(this._pos) & constants.WILL_FLAG_MASK)

  if (flags.will) {
    packet.will = {}
    packet.will.retain = (this._list.readUInt8(this._pos) & constants.WILL_RETAIN_MASK) !== 0
    packet.will.qos = (this._list.readUInt8(this._pos) &
                          constants.WILL_QOS_MASK) >> constants.WILL_QOS_SHIFT
  }

  packet.clean = (this._list.readUInt8(this._pos) & constants.CLEAN_SESSION_MASK) !== 0
  this._pos++

  // Parse keepalive
  packet.keepalive = this._parseNum()
  if (packet.keepalive === -1) return this._emitError(new Error('Packet too short'))

  // Parse clientId
  clientId = this._parseString()
  if (clientId === null) return this._emitError(new Error('Packet too short'))
  packet.clientId = clientId

  if (flags.will) {
    // Parse will topic
    topic = this._parseString()
    if (topic === null) return this._emitError(new Error('Cannot parse will topic'))
    packet.will.topic = topic

    // Parse will payload
    payload = this._parseBuffer()
    if (payload === null) return this._emitError(new Error('Cannot parse will payload'))
    packet.will.payload = payload
  }

  // Parse username
  if (flags.username) {
    username = this._parseString()
    if (username === null) return this._emitError(new Error('Cannot parse username'))
    packet.username = username
  }

  // Parse password
  if (flags.password) {
    password = this._parseBuffer()
    if (password === null) return this._emitError(new Error('Cannot parse password'))
    packet.password = password
  }

  return packet
}

Parser.prototype._parseConnack = function () {
  var packet = this.packet

  if (this._list.length < 2) return null

  packet.sessionPresent = !!(this._list.readUInt8(this._pos++) & constants.SESSIONPRESENT_MASK)
  packet.returnCode = this._list.readUInt8(this._pos)

  if (packet.returnCode === -1) return this._emitError(new Error('Cannot parse return code'))
}

Parser.prototype._parsePublish = function () {
  var packet = this.packet
  packet.topic = this._parseString()

  if (packet.topic === null) return this._emitError(new Error('Cannot parse topic'))

  // Parse messageId
  if (packet.qos > 0) if (!this._parseMessageId()) { return }

  packet.payload = this._list.slice(this._pos, packet.length)
}

Parser.prototype._parseSubscribe = function () {
  var packet = this.packet
  var topic
  var qos

  if (packet.qos !== 1) {
    return this._emitError(new Error('Wrong subscribe header'))
  }

  packet.subscriptions = []

  if (!this._parseMessageId()) { return }

  while (this._pos < packet.length) {
    // Parse topic
    topic = this._parseString()
    if (topic === null) return this._emitError(new Error('Cannot parse topic'))

    if (this._pos >= packet.length) return this._emitError(new Error('Malformed Subscribe Payload'))
    qos = this._list.readUInt8(this._pos++)

    // Push pair to subscriptions
    packet.subscriptions.push({ topic: topic, qos: qos })
  }
}

Parser.prototype._parseSuback = function () {
  this.packet.granted = []

  if (!this._parseMessageId()) { return }

  // Parse granted QoSes
  while (this._pos < this.packet.length) {
    this.packet.granted.push(this._list.readUInt8(this._pos++))
  }
}

Parser.prototype._parseUnsubscribe = function () {
  var packet = this.packet

  packet.unsubscriptions = []

  // Parse messageId
  if (!this._parseMessageId()) { return }

  while (this._pos < packet.length) {
    var topic

    // Parse topic
    topic = this._parseString()
    if (topic === null) return this._emitError(new Error('Cannot parse topic'))

    // Push topic to unsubscriptions
    packet.unsubscriptions.push(topic)
  }
}

Parser.prototype._parseUnsuback = function () {
  if (!this._parseMessageId()) return this._emitError(new Error('Cannot parse messageId'))
}

Parser.prototype._parseMessageId = function () {
  var packet = this.packet

  packet.messageId = this._parseNum()

  if (packet.messageId === null) {
    this._emitError(new Error('Cannot parse messageId'))
    return false
  }

  return true
}

Parser.prototype._parseString = function (maybeBuffer) {
  var length = this._parseNum()
  var result
  var end = length + this._pos

  if (length === -1 || end > this._list.length || end > this.packet.length) return null

  result = this._list.toString('utf8', this._pos, end)
  this._pos += length

  return result
}

Parser.prototype._parseBuffer = function () {
  var length = this._parseNum()
  var result
  var end = length + this._pos

  if (length === -1 || end > this._list.length || end > this.packet.length) return null

  result = this._list.slice(this._pos, end)

  this._pos += length

  return result
}

Parser.prototype._parseNum = function () {
  if (this._list.length - this._pos < 2) return -1

  var result = this._list.readUInt16BE(this._pos)
  this._pos += 2

  return result
}

Parser.prototype._newPacket = function () {
  if (this.packet) {
    this._list.consume(this.packet.length)
    this.emit('packet', this.packet)
  }

  this.packet = new Packet()

  return true
}

Parser.prototype._emitError = function (err) {
  this.error = err
  this.emit('error', err)
}

module.exports = Parser

},{"./constants":125,"./packet":129,"bl":46,"events":10,"inherits":123}],131:[function(require,module,exports){
'use strict'

var protocol = require('./constants')
var Buffer = require('safe-buffer').Buffer
var empty = Buffer.allocUnsafe(0)
var zeroBuf = Buffer.from([0])
var numbers = require('./numbers')
var nextTick = require('process-nextick-args').nextTick

var numCache = numbers.cache
var generateNumber = numbers.generateNumber
var generateCache = numbers.generateCache
var writeNumber = writeNumberCached
var toGenerate = true

function generate (packet, stream) {
  if (stream.cork) {
    stream.cork()
    nextTick(uncork, stream)
  }

  if (toGenerate) {
    toGenerate = false
    generateCache()
  }

  switch (packet.cmd) {
    case 'connect':
      return connect(packet, stream)
    case 'connack':
      return connack(packet, stream)
    case 'publish':
      return publish(packet, stream)
    case 'puback':
    case 'pubrec':
    case 'pubrel':
    case 'pubcomp':
    case 'unsuback':
      return confirmation(packet, stream)
    case 'subscribe':
      return subscribe(packet, stream)
    case 'suback':
      return suback(packet, stream)
    case 'unsubscribe':
      return unsubscribe(packet, stream)
    case 'pingreq':
    case 'pingresp':
    case 'disconnect':
      return emptyPacket(packet, stream)
    default:
      stream.emit('error', new Error('Unknown command'))
      return false
  }
}
/**
 * Controls numbers cache.
 * Set to "false" to allocate buffers on-the-flight instead of pre-generated cache
 */
Object.defineProperty(generate, 'cacheNumbers', {
  get: function () {
    return writeNumber === writeNumberCached
  },
  set: function (value) {
    if (value) {
      if (!numCache || Object.keys(numCache).length === 0) toGenerate = true
      writeNumber = writeNumberCached
    } else {
      toGenerate = false
      writeNumber = writeNumberGenerated
    }
  }
})

function uncork (stream) {
  stream.uncork()
}

function connect (opts, stream) {
  var settings = opts || {}
  var protocolId = settings.protocolId || 'MQTT'
  var protocolVersion = settings.protocolVersion || 4
  var will = settings.will
  var clean = settings.clean
  var keepalive = settings.keepalive || 0
  var clientId = settings.clientId || ''
  var username = settings.username
  var password = settings.password

  if (clean === undefined) clean = true

  var length = 0

  // Must be a string and non-falsy
  if (!protocolId ||
     (typeof protocolId !== 'string' && !Buffer.isBuffer(protocolId))) {
    stream.emit('error', new Error('Invalid protocolId'))
    return false
  } else length += protocolId.length + 2

  // Must be 3 or 4
  if (protocolVersion !== 3 && protocolVersion !== 4) {
    stream.emit('error', new Error('Invalid protocol version'))
    return false
  } else length += 1

  // ClientId might be omitted in 3.1.1, but only if cleanSession is set to 1
  if ((typeof clientId === 'string' || Buffer.isBuffer(clientId)) &&
     (clientId || protocolVersion === 4) && (clientId || clean)) {
    length += clientId.length + 2
  } else {
    if (protocolVersion < 4) {
      stream.emit('error', new Error('clientId must be supplied before 3.1.1'))
      return false
    }
    if ((clean * 1) === 0) {
      stream.emit('error', new Error('clientId must be given if cleanSession set to 0'))
      return false
    }
  }

  // Must be a two byte number
  if (typeof keepalive !== 'number' ||
      keepalive < 0 ||
      keepalive > 65535 ||
      keepalive % 1 !== 0) {
    stream.emit('error', new Error('Invalid keepalive'))
    return false
  } else length += 2

  // Connect flags
  length += 1

  // If will exists...
  if (will) {
    // It must be an object
    if (typeof will !== 'object') {
      stream.emit('error', new Error('Invalid will'))
      return false
    }
    // It must have topic typeof string
    if (!will.topic || typeof will.topic !== 'string') {
      stream.emit('error', new Error('Invalid will topic'))
      return false
    } else {
      length += Buffer.byteLength(will.topic) + 2
    }

    // Payload
    if (will.payload && will.payload) {
      if (will.payload.length >= 0) {
        if (typeof will.payload === 'string') {
          length += Buffer.byteLength(will.payload) + 2
        } else {
          length += will.payload.length + 2
        }
      } else {
        stream.emit('error', new Error('Invalid will payload'))
        return false
      }
    } else {
      length += 2
    }
  }

  // Username
  var providedUsername = false
  if (username != null) {
    if (isStringOrBuffer(username)) {
      providedUsername = true
      length += Buffer.byteLength(username) + 2
    } else {
      stream.emit('error', new Error('Invalid username'))
      return false
    }
  }

  // Password
  if (password != null) {
    if (!providedUsername) {
      stream.emit('error', new Error('Username is required to use password'))
      return false
    }

    if (isStringOrBuffer(password)) {
      length += byteLength(password) + 2
    } else {
      stream.emit('error', new Error('Invalid password'))
      return false
    }
  }

  // Generate header
  stream.write(protocol.CONNECT_HEADER)

  // Generate length
  writeLength(stream, length)

  // Generate protocol ID
  writeStringOrBuffer(stream, protocolId)
  stream.write(
    protocolVersion === 4 ? protocol.VERSION4 : protocol.VERSION3
  )

  // Connect flags
  var flags = 0
  flags |= (username != null) ? protocol.USERNAME_MASK : 0
  flags |= (password != null) ? protocol.PASSWORD_MASK : 0
  flags |= (will && will.retain) ? protocol.WILL_RETAIN_MASK : 0
  flags |= (will && will.qos) ? will.qos << protocol.WILL_QOS_SHIFT : 0
  flags |= will ? protocol.WILL_FLAG_MASK : 0
  flags |= clean ? protocol.CLEAN_SESSION_MASK : 0

  stream.write(Buffer.from([flags]))

  // Keepalive
  writeNumber(stream, keepalive)

  // Client ID
  writeStringOrBuffer(stream, clientId)

  // Will
  if (will) {
    writeString(stream, will.topic)
    writeStringOrBuffer(stream, will.payload)
  }

  // Username and password
  if (username != null) {
    writeStringOrBuffer(stream, username)
  }
  if (password != null) {
    writeStringOrBuffer(stream, password)
  }
  // This is a small packet that happens only once on a stream
  // We assume the stream is always free to receive more data after this
  return true
}

function connack (opts, stream) {
  var settings = opts || {}
  var rc = settings.returnCode

  // Check return code
  if (typeof rc !== 'number') {
    stream.emit('error', new Error('Invalid return code'))
    return false
  }

  stream.write(protocol.CONNACK_HEADER)
  writeLength(stream, 2)
  stream.write(opts.sessionPresent ? protocol.SESSIONPRESENT_HEADER : zeroBuf)

  return stream.write(Buffer.from([rc]))
}

function publish (opts, stream) {
  var settings = opts || {}
  var qos = settings.qos || 0
  var retain = settings.retain ? protocol.RETAIN_MASK : 0
  var topic = settings.topic
  var payload = settings.payload || empty
  var id = settings.messageId

  var length = 0

  // Topic must be a non-empty string or Buffer
  if (typeof topic === 'string') length += Buffer.byteLength(topic) + 2
  else if (Buffer.isBuffer(topic)) length += topic.length + 2
  else {
    stream.emit('error', new Error('Invalid topic'))
    return false
  }

  // Get the payload length
  if (!Buffer.isBuffer(payload)) length += Buffer.byteLength(payload)
  else length += payload.length

  // Message ID must a number if qos > 0
  if (qos && typeof id !== 'number') {
    stream.emit('error', new Error('Invalid messageId'))
    return false
  } else if (qos) length += 2

  // Header
  stream.write(protocol.PUBLISH_HEADER[qos][opts.dup ? 1 : 0][retain ? 1 : 0])

  // Remaining length
  writeLength(stream, length)

  // Topic
  writeNumber(stream, byteLength(topic))
  stream.write(topic)

  // Message ID
  if (qos > 0) writeNumber(stream, id)

  // Payload
  return stream.write(payload)
}

/* Puback, pubrec, pubrel and pubcomp */
function confirmation (opts, stream) {
  var settings = opts || {}
  var type = settings.cmd || 'puback'
  var id = settings.messageId
  var dup = (settings.dup && type === 'pubrel') ? protocol.DUP_MASK : 0
  var qos = 0

  if (type === 'pubrel') qos = 1

  // Check message ID
  if (typeof id !== 'number') {
    stream.emit('error', new Error('Invalid messageId'))
    return false
  }

  // Header
  stream.write(protocol.ACKS[type][qos][dup][0])

  // Length
  writeLength(stream, 2)

  // Message ID
  return writeNumber(stream, id)
}

function subscribe (opts, stream) {
  var settings = opts || {}
  var dup = settings.dup ? protocol.DUP_MASK : 0
  var id = settings.messageId
  var subs = settings.subscriptions

  var length = 0

  // Check message ID
  if (typeof id !== 'number') {
    stream.emit('error', new Error('Invalid messageId'))
    return false
  } else length += 2

  // Check subscriptions
  if (typeof subs === 'object' && subs.length) {
    for (var i = 0; i < subs.length; i += 1) {
      var itopic = subs[i].topic
      var iqos = subs[i].qos

      if (typeof itopic !== 'string') {
        stream.emit('error', new Error('Invalid subscriptions - invalid topic'))
        return false
      }
      if (typeof iqos !== 'number') {
        stream.emit('error', new Error('Invalid subscriptions - invalid qos'))
        return false
      }

      length += Buffer.byteLength(itopic) + 2 + 1
    }
  } else {
    stream.emit('error', new Error('Invalid subscriptions'))
    return false
  }

  // Generate header
  stream.write(protocol.SUBSCRIBE_HEADER[1][dup ? 1 : 0][0])

  // Generate length
  writeLength(stream, length)

  // Generate message ID
  writeNumber(stream, id)

  var result = true

  // Generate subs
  for (var j = 0; j < subs.length; j++) {
    var sub = subs[j]
    var jtopic = sub.topic
    var jqos = sub.qos

    // Write topic string
    writeString(stream, jtopic)

    // Write qos
    result = stream.write(protocol.QOS[jqos])
  }

  return result
}

function suback (opts, stream) {
  var settings = opts || {}
  var id = settings.messageId
  var granted = settings.granted

  var length = 0

  // Check message ID
  if (typeof id !== 'number') {
    stream.emit('error', new Error('Invalid messageId'))
    return false
  } else length += 2

  // Check granted qos vector
  if (typeof granted === 'object' && granted.length) {
    for (var i = 0; i < granted.length; i += 1) {
      if (typeof granted[i] !== 'number') {
        stream.emit('error', new Error('Invalid qos vector'))
        return false
      }
      length += 1
    }
  } else {
    stream.emit('error', new Error('Invalid qos vector'))
    return false
  }

  // header
  stream.write(protocol.SUBACK_HEADER)

  // Length
  writeLength(stream, length)

  // Message ID
  writeNumber(stream, id)

  return stream.write(Buffer.from(granted))
}

function unsubscribe (opts, stream) {
  var settings = opts || {}
  var id = settings.messageId
  var dup = settings.dup ? protocol.DUP_MASK : 0
  var unsubs = settings.unsubscriptions

  var length = 0

  // Check message ID
  if (typeof id !== 'number') {
    stream.emit('error', new Error('Invalid messageId'))
    return false
  } else {
    length += 2
  }
  // Check unsubs
  if (typeof unsubs === 'object' && unsubs.length) {
    for (var i = 0; i < unsubs.length; i += 1) {
      if (typeof unsubs[i] !== 'string') {
        stream.emit('error', new Error('Invalid unsubscriptions'))
        return false
      }
      length += Buffer.byteLength(unsubs[i]) + 2
    }
  } else {
    stream.emit('error', new Error('Invalid unsubscriptions'))
    return false
  }

  // Header
  stream.write(protocol.UNSUBSCRIBE_HEADER[1][dup ? 1 : 0][0])

  // Length
  writeLength(stream, length)

  // Message ID
  writeNumber(stream, id)

  // Unsubs
  var result = true
  for (var j = 0; j < unsubs.length; j++) {
    result = writeString(stream, unsubs[j])
  }

  return result
}

function emptyPacket (opts, stream) {
  return stream.write(protocol.EMPTY[opts.cmd])
}

/**
 * calcLengthLength - calculate the length of the remaining
 * length field
 *
 * @api private
 */
function calcLengthLength (length) {
  if (length >= 0 && length < 128) return 1
  else if (length >= 128 && length < 16384) return 2
  else if (length >= 16384 && length < 2097152) return 3
  else if (length >= 2097152 && length < 268435456) return 4
  else return 0
}

function genBufLength (length) {
  var digit = 0
  var pos = 0
  var buffer = Buffer.allocUnsafe(calcLengthLength(length))

  do {
    digit = length % 128 | 0
    length = length / 128 | 0
    if (length > 0) digit = digit | 0x80

    buffer.writeUInt8(digit, pos++)
  } while (length > 0)

  return buffer
}

/**
 * writeLength - write an MQTT style length field to the buffer
 *
 * @param <Buffer> buffer - destination
 * @param <Number> pos - offset
 * @param <Number> length - length (>0)
 * @returns <Number> number of bytes written
 *
 * @api private
 */

var lengthCache = {}
function writeLength (stream, length) {
  var buffer = lengthCache[length]

  if (!buffer) {
    buffer = genBufLength(length)
    if (length < 16384) lengthCache[length] = buffer
  }

  stream.write(buffer)
}

/**
 * writeString - write a utf8 string to the buffer
 *
 * @param <Buffer> buffer - destination
 * @param <Number> pos - offset
 * @param <String> string - string to write
 * @return <Number> number of bytes written
 *
 * @api private
 */

function writeString (stream, string) {
  var strlen = Buffer.byteLength(string)
  writeNumber(stream, strlen)

  stream.write(string, 'utf8')
}

/**
 * writeNumber - write a two byte number to the buffer
 *
 * @param <Buffer> buffer - destination
 * @param <Number> pos - offset
 * @param <String> number - number to write
 * @return <Number> number of bytes written
 *
 * @api private
 */
function writeNumberCached (stream, number) {
  return stream.write(numCache[number])
}
function writeNumberGenerated (stream, number) {
  return stream.write(generateNumber(number))
}

/**
 * writeStringOrBuffer - write a String or Buffer with the its length prefix
 *
 * @param <Buffer> buffer - destination
 * @param <Number> pos - offset
 * @param <String> toWrite - String or Buffer
 * @return <Number> number of bytes written
 */
function writeStringOrBuffer (stream, toWrite) {
  if (typeof toWrite === 'string') {
    writeString(stream, toWrite)
  } else if (toWrite) {
    writeNumber(stream, toWrite.length)
    stream.write(toWrite)
  } else writeNumber(stream, 0)
}

function byteLength (bufOrString) {
  if (!bufOrString) return 0
  else if (bufOrString instanceof Buffer) return bufOrString.length
  else return Buffer.byteLength(bufOrString)
}

function isStringOrBuffer (field) {
  return typeof field === 'string' || field instanceof Buffer
}

module.exports = generate

},{"./constants":125,"./numbers":128,"process-nextick-args":142,"safe-buffer":154}],132:[function(require,module,exports){
(function (process,global){
'use strict'

/**
 * Module dependencies
 */
var events = require('events')
var Store = require('./store')
var eos = require('end-of-stream')
var mqttPacket = require('mqtt-packet')
var Writable = require('readable-stream').Writable
var inherits = require('inherits')
var reInterval = require('reinterval')
var validations = require('./validations')
var xtend = require('xtend')
var setImmediate = global.setImmediate || function (callback) {
  // works in node v0.8
  process.nextTick(callback)
}
var defaultConnectOptions = {
  keepalive: 60,
  reschedulePings: true,
  protocolId: 'MQTT',
  protocolVersion: 4,
  reconnectPeriod: 1000,
  connectTimeout: 30 * 1000,
  clean: true,
  resubscribe: true
}

function defaultId () {
  return 'mqttjs_' + Math.random().toString(16).substr(2, 8)
}

function sendPacket (client, packet, cb) {
  client.emit('packetsend', packet)

  var result = mqttPacket.writeToStream(packet, client.stream)

  if (!result && cb) {
    client.stream.once('drain', cb)
  } else if (cb) {
    cb()
  }
}

function flush (queue) {
  if (queue) {
    Object.keys(queue).forEach(function (messageId) {
      if (typeof queue[messageId] === 'function') {
        queue[messageId](new Error('Connection closed'))
        delete queue[messageId]
      }
    })
  }
}

function storeAndSend (client, packet, cb) {
  client.outgoingStore.put(packet, function storedPacket (err) {
    if (err) {
      return cb && cb(err)
    }
    sendPacket(client, packet, cb)
  })
}

function nop () {}

/**
 * MqttClient constructor
 *
 * @param {Stream} stream - stream
 * @param {Object} [options] - connection options
 * (see Connection#connect)
 */
function MqttClient (streamBuilder, options) {
  var k
  var that = this

  if (!(this instanceof MqttClient)) {
    return new MqttClient(streamBuilder, options)
  }

  this.options = options || {}

  // Defaults
  for (k in defaultConnectOptions) {
    if (typeof this.options[k] === 'undefined') {
      this.options[k] = defaultConnectOptions[k]
    } else {
      this.options[k] = options[k]
    }
  }

  this.options.clientId = (typeof this.options.clientId === 'string') ? this.options.clientId : defaultId()

  this.streamBuilder = streamBuilder

  // Inflight message storages
  this.outgoingStore = this.options.outgoingStore || new Store()
  this.incomingStore = this.options.incomingStore || new Store()

  // Should QoS zero messages be queued when the connection is broken?
  this.queueQoSZero = this.options.queueQoSZero === undefined ? true : this.options.queueQoSZero

  // map of subscribed topics to support reconnection
  this._resubscribeTopics = {}

  // map of a subscribe messageId and a topic
  this.messageIdToTopic = {}

  // Ping timer, setup in _setupPingTimer
  this.pingTimer = null
  // Is the client connected?
  this.connected = false
  // Are we disconnecting?
  this.disconnecting = false
  // Packet queue
  this.queue = []
  // connack timer
  this.connackTimer = null
  // Reconnect timer
  this.reconnectTimer = null
  /**
   * MessageIDs starting with 1
   * ensure that nextId is min. 1, see https://github.com/mqttjs/MQTT.js/issues/810
   */
  this.nextId = Math.max(1, Math.floor(Math.random() * 65535))

  // Inflight callbacks
  this.outgoing = {}

  // Mark connected on connect
  this.on('connect', function () {
    if (this.disconnected) {
      return
    }

    this.connected = true
    var outStore = this.outgoingStore.createStream()

    this.once('close', remove)
    outStore.on('end', function () {
      that.removeListener('close', remove)
    })
    outStore.on('error', function (err) {
      that.removeListener('close', remove)
      that.emit('error', err)
    })

    function remove () {
      outStore.destroy()
      outStore = null
    }

    function storeDeliver () {
      // edge case, we wrapped this twice
      if (!outStore) {
        return
      }

      var packet = outStore.read(1)
      var cb

      if (!packet) {
        // read when data is available in the future
        outStore.once('readable', storeDeliver)
        return
      }

      // Avoid unnecessary stream read operations when disconnected
      if (!that.disconnecting && !that.reconnectTimer) {
        cb = that.outgoing[packet.messageId]
        that.outgoing[packet.messageId] = function (err, status) {
          // Ensure that the original callback passed in to publish gets invoked
          if (cb) {
            cb(err, status)
          }

          storeDeliver()
        }
        that._sendPacket(packet)
      } else if (outStore.destroy) {
        outStore.destroy()
      }
    }

    // start flowing
    storeDeliver()
  })

  // Mark disconnected on stream close
  this.on('close', function () {
    this.connected = false
    clearTimeout(this.connackTimer)
  })

  // Setup ping timer
  this.on('connect', this._setupPingTimer)

  // Send queued packets
  this.on('connect', function () {
    var queue = this.queue

    function deliver () {
      var entry = queue.shift()
      var packet = null

      if (!entry) {
        return
      }

      packet = entry.packet

      that._sendPacket(
        packet,
        function (err) {
          if (entry.cb) {
            entry.cb(err)
          }
          deliver()
        }
      )
    }

    deliver()
  })

  var firstConnection = true
  // resubscribe
  this.on('connect', function () {
    if (!firstConnection &&
        this.options.clean &&
        Object.keys(this._resubscribeTopics).length > 0) {
      if (this.options.resubscribe) {
        this._resubscribeTopics.resubscribe = true
        this.subscribe(this._resubscribeTopics)
      } else {
        this._resubscribeTopics = {}
      }
    }

    firstConnection = false
  })

  // Clear ping timer
  this.on('close', function () {
    if (that.pingTimer !== null) {
      that.pingTimer.clear()
      that.pingTimer = null
    }
  })

  // Setup reconnect timer on disconnect
  this.on('close', this._setupReconnect)

  events.EventEmitter.call(this)

  this._setupStream()
}
inherits(MqttClient, events.EventEmitter)

/**
 * setup the event handlers in the inner stream.
 *
 * @api private
 */
MqttClient.prototype._setupStream = function () {
  var connectPacket
  var that = this
  var writable = new Writable()
  var parser = mqttPacket.parser(this.options)
  var completeParse = null
  var packets = []

  this._clearReconnect()

  this.stream = this.streamBuilder(this)

  parser.on('packet', function (packet) {
    packets.push(packet)
  })

  function nextTickWork () {
    process.nextTick(work)
  }

  function work () {
    var packet = packets.shift()
    var done = completeParse

    if (packet) {
      that._handlePacket(packet, nextTickWork)
    } else {
      completeParse = null
      done()
    }
  }

  writable._write = function (buf, enc, done) {
    completeParse = done
    parser.parse(buf)
    work()
  }

  this.stream.pipe(writable)

  // Suppress connection errors
  this.stream.on('error', nop)

  // Echo stream close
  eos(this.stream, this.emit.bind(this, 'close'))

  // Send a connect packet
  connectPacket = Object.create(this.options)
  connectPacket.cmd = 'connect'
  // avoid message queue
  sendPacket(this, connectPacket)

  // Echo connection errors
  parser.on('error', this.emit.bind(this, 'error'))

  // many drain listeners are needed for qos 1 callbacks if the connection is intermittent
  this.stream.setMaxListeners(1000)

  clearTimeout(this.connackTimer)
  this.connackTimer = setTimeout(function () {
    that._cleanUp(true)
  }, this.options.connectTimeout)
}

MqttClient.prototype._handlePacket = function (packet, done) {
  this.emit('packetreceive', packet)

  switch (packet.cmd) {
    case 'publish':
      this._handlePublish(packet, done)
      break
    case 'puback':
    case 'pubrec':
    case 'pubcomp':
    case 'suback':
    case 'unsuback':
      this._handleAck(packet)
      done()
      break
    case 'pubrel':
      this._handlePubrel(packet, done)
      break
    case 'connack':
      this._handleConnack(packet)
      done()
      break
    case 'pingresp':
      this._handlePingresp(packet)
      done()
      break
    default:
      // do nothing
      // maybe we should do an error handling
      // or just log it
      break
  }
}

MqttClient.prototype._checkDisconnecting = function (callback) {
  if (this.disconnecting) {
    if (callback) {
      callback(new Error('client disconnecting'))
    } else {
      this.emit('error', new Error('client disconnecting'))
    }
  }
  return this.disconnecting
}

/**
 * publish - publish <message> to <topic>
 *
 * @param {String} topic - topic to publish to
 * @param {String, Buffer} message - message to publish
 * @param {Object} [opts] - publish options, includes:
 *    {Number} qos - qos level to publish on
 *    {Boolean} retain - whether or not to retain the message
 *    {Boolean} dup - whether or not mark a message as duplicate
 * @param {Function} [callback] - function(err){}
 *    called when publish succeeds or fails
 * @returns {MqttClient} this - for chaining
 * @api public
 *
 * @example client.publish('topic', 'message');
 * @example
 *     client.publish('topic', 'message', {qos: 1, retain: true, dup: true});
 * @example client.publish('topic', 'message', console.log);
 */
MqttClient.prototype.publish = function (topic, message, opts, callback) {
  var packet

  // .publish(topic, payload, cb);
  if (typeof opts === 'function') {
    callback = opts
    opts = null
  }

  // default opts
  var defaultOpts = {qos: 0, retain: false, dup: false}
  opts = xtend(defaultOpts, opts)

  if (this._checkDisconnecting(callback)) {
    return this
  }

  packet = {
    cmd: 'publish',
    topic: topic,
    payload: message,
    qos: opts.qos,
    retain: opts.retain,
    messageId: this._nextId(),
    dup: opts.dup
  }

  switch (opts.qos) {
    case 1:
    case 2:

      // Add to callbacks
      this.outgoing[packet.messageId] = callback || nop
      this._sendPacket(packet)
      break
    default:
      this._sendPacket(packet, callback)
      break
  }

  return this
}

/**
 * subscribe - subscribe to <topic>
 *
 * @param {String, Array, Object} topic - topic(s) to subscribe to, supports objects in the form {'topic': qos}
 * @param {Object} [opts] - optional subscription options, includes:
 *    {Number} qos - subscribe qos level
 * @param {Function} [callback] - function(err, granted){} where:
 *    {Error} err - subscription error (none at the moment!)
 *    {Array} granted - array of {topic: 't', qos: 0}
 * @returns {MqttClient} this - for chaining
 * @api public
 * @example client.subscribe('topic');
 * @example client.subscribe('topic', {qos: 1});
 * @example client.subscribe({'topic': 0, 'topic2': 1}, console.log);
 * @example client.subscribe('topic', console.log);
 */
MqttClient.prototype.subscribe = function () {
  var packet
  var args = Array.prototype.slice.call(arguments)
  var subs = []
  var obj = args.shift()
  var resubscribe = obj.resubscribe
  var callback = args.pop() || nop
  var opts = args.pop()
  var invalidTopic
  var that = this

  delete obj.resubscribe

  if (typeof obj === 'string') {
    obj = [obj]
  }

  if (typeof callback !== 'function') {
    opts = callback
    callback = nop
  }

  invalidTopic = validations.validateTopics(obj)
  if (invalidTopic !== null) {
    setImmediate(callback, new Error('Invalid topic ' + invalidTopic))
    return this
  }

  if (this._checkDisconnecting(callback)) {
    return this
  }

  var defaultOpts = { qos: 0 }
  opts = xtend(defaultOpts, opts)

  if (Array.isArray(obj)) {
    obj.forEach(function (topic) {
      if (that._resubscribeTopics[topic] < opts.qos ||
          !that._resubscribeTopics.hasOwnProperty(topic) ||
          resubscribe) {
        subs.push({
          topic: topic,
          qos: opts.qos
        })
      }
    })
  } else {
    Object
      .keys(obj)
      .forEach(function (k) {
        if (that._resubscribeTopics[k] < obj[k] ||
            !that._resubscribeTopics.hasOwnProperty(k) ||
            resubscribe) {
          subs.push({
            topic: k,
            qos: obj[k]
          })
        }
      })
  }

  packet = {
    cmd: 'subscribe',
    subscriptions: subs,
    qos: 1,
    retain: false,
    dup: false,
    messageId: this._nextId()
  }

  if (!subs.length) {
    callback(null, [])
    return
  }

  // subscriptions to resubscribe to in case of disconnect
  if (this.options.resubscribe) {
    var topics = []
    subs.forEach(function (sub) {
      if (that.options.reconnectPeriod > 0) {
        that._resubscribeTopics[sub.topic] = sub.qos
        topics.push(sub.topic)
      }
    })
    that.messageIdToTopic[packet.messageId] = topics
  }

  this.outgoing[packet.messageId] = function (err, packet) {
    if (!err) {
      var granted = packet.granted
      for (var i = 0; i < granted.length; i += 1) {
        subs[i].qos = granted[i]
      }
    }

    callback(err, subs)
  }

  this._sendPacket(packet)

  return this
}

/**
 * unsubscribe - unsubscribe from topic(s)
 *
 * @param {String, Array} topic - topics to unsubscribe from
 * @param {Function} [callback] - callback fired on unsuback
 * @returns {MqttClient} this - for chaining
 * @api public
 * @example client.unsubscribe('topic');
 * @example client.unsubscribe('topic', console.log);
 */
MqttClient.prototype.unsubscribe = function (topic, callback) {
  var packet = {
    cmd: 'unsubscribe',
    qos: 1,
    messageId: this._nextId()
  }
  var that = this

  callback = callback || nop

  if (this._checkDisconnecting(callback)) {
    return this
  }

  if (typeof topic === 'string') {
    packet.unsubscriptions = [topic]
  } else if (typeof topic === 'object' && topic.length) {
    packet.unsubscriptions = topic
  }

  if (this.options.resubscribe) {
    packet.unsubscriptions.forEach(function (topic) {
      delete that._resubscribeTopics[topic]
    })
  }

  this.outgoing[packet.messageId] = callback

  this._sendPacket(packet)

  return this
}

/**
 * end - close connection
 *
 * @returns {MqttClient} this - for chaining
 * @param {Boolean} force - do not wait for all in-flight messages to be acked
 * @param {Function} cb - called when the client has been closed
 *
 * @api public
 */
MqttClient.prototype.end = function (force, cb) {
  var that = this

  if (typeof force === 'function') {
    cb = force
    force = false
  }

  function closeStores () {
    that.disconnected = true
    that.incomingStore.close(function () {
      that.outgoingStore.close(function () {
        if (cb) {
          cb.apply(null, arguments)
        }
        that.emit('end')
      })
    })
    if (that._deferredReconnect) {
      that._deferredReconnect()
    }
  }

  function finish () {
    // defer closesStores of an I/O cycle,
    // just to make sure things are
    // ok for websockets
    that._cleanUp(force, setImmediate.bind(null, closeStores))
  }

  if (this.disconnecting) {
    return this
  }

  this._clearReconnect()

  this.disconnecting = true

  if (!force && Object.keys(this.outgoing).length > 0) {
    // wait 10ms, just to be sure we received all of it
    this.once('outgoingEmpty', setTimeout.bind(null, finish, 10))
  } else {
    finish()
  }

  return this
}

/**
 * removeOutgoingMessage - remove a message in outgoing store
 * the outgoing callback will be called withe Error('Message removed') if the message is removed
 *
 * @param {Number} mid - messageId to remove message
 * @returns {MqttClient} this - for chaining
 * @api public
 *
 * @example client.removeOutgoingMessage(client.getLastMessageId());
 */
MqttClient.prototype.removeOutgoingMessage = function (mid) {
  var cb = this.outgoing[mid]
  delete this.outgoing[mid]
  this.outgoingStore.del({messageId: mid}, function () {
    cb(new Error('Message removed'))
  })
  return this
}

/**
 * reconnect - connect again using the same options as connect()
 *
 * @param {Object} [opts] - optional reconnect options, includes:
 *    {Store} incomingStore - a store for the incoming packets
 *    {Store} outgoingStore - a store for the outgoing packets
 *    if opts is not given, current stores are used
 * @returns {MqttClient} this - for chaining
 *
 * @api public
 */
MqttClient.prototype.reconnect = function (opts) {
  var that = this
  var f = function () {
    if (opts) {
      that.options.incomingStore = opts.incomingStore
      that.options.outgoingStore = opts.outgoingStore
    } else {
      that.options.incomingStore = null
      that.options.outgoingStore = null
    }
    that.incomingStore = that.options.incomingStore || new Store()
    that.outgoingStore = that.options.outgoingStore || new Store()
    that.disconnecting = false
    that.disconnected = false
    that._deferredReconnect = null
    that._reconnect()
  }

  if (this.disconnecting && !this.disconnected) {
    this._deferredReconnect = f
  } else {
    f()
  }
  return this
}

/**
 * _reconnect - implement reconnection
 * @api privateish
 */
MqttClient.prototype._reconnect = function () {
  this.emit('reconnect')
  this._setupStream()
}

/**
 * _setupReconnect - setup reconnect timer
 */
MqttClient.prototype._setupReconnect = function () {
  var that = this

  if (!that.disconnecting && !that.reconnectTimer && (that.options.reconnectPeriod > 0)) {
    if (!this.reconnecting) {
      this.emit('offline')
      this.reconnecting = true
    }
    that.reconnectTimer = setInterval(function () {
      that._reconnect()
    }, that.options.reconnectPeriod)
  }
}

/**
 * _clearReconnect - clear the reconnect timer
 */
MqttClient.prototype._clearReconnect = function () {
  if (this.reconnectTimer) {
    clearInterval(this.reconnectTimer)
    this.reconnectTimer = null
  }
}

/**
 * _cleanUp - clean up on connection end
 * @api private
 */
MqttClient.prototype._cleanUp = function (forced, done) {
  if (done) {
    this.stream.on('close', done)
  }

  if (forced) {
    if ((this.options.reconnectPeriod === 0) && this.options.clean) {
      flush(this.outgoing)
    }
    this.stream.destroy()
  } else {
    this._sendPacket(
      { cmd: 'disconnect' },
      setImmediate.bind(
        null,
        this.stream.end.bind(this.stream)
      )
    )
  }

  if (!this.disconnecting) {
    this._clearReconnect()
    this._setupReconnect()
  }

  if (this.pingTimer !== null) {
    this.pingTimer.clear()
    this.pingTimer = null
  }

  if (done && !this.connected) {
    this.stream.removeListener('close', done)
    done()
  }
}

/**
 * _sendPacket - send or queue a packet
 * @param {String} type - packet type (see `protocol`)
 * @param {Object} packet - packet options
 * @param {Function} cb - callback when the packet is sent
 * @api private
 */
MqttClient.prototype._sendPacket = function (packet, cb) {
  if (!this.connected) {
    if (((packet.qos || 0) === 0 && this.queueQoSZero) || packet.cmd !== 'publish') {
      this.queue.push({ packet: packet, cb: cb })
    } else if (packet.qos > 0) {
      cb = this.outgoing[packet.messageId]
      this.outgoingStore.put(packet, function (err) {
        if (err) {
          return cb && cb(err)
        }
      })
    } else if (cb) {
      cb(new Error('No connection to broker'))
    }

    return
  }

  // When sending a packet, reschedule the ping timer
  this._shiftPingInterval()

  switch (packet.cmd) {
    case 'publish':
      break
    case 'pubrel':
      storeAndSend(this, packet, cb)
      return
    default:
      sendPacket(this, packet, cb)
      return
  }

  switch (packet.qos) {
    case 2:
    case 1:
      storeAndSend(this, packet, cb)
      break
    /**
     * no need of case here since it will be caught by default
     * and jshint comply that before default it must be a break
     * anyway it will result in -1 evaluation
     */
    case 0:
      /* falls through */
    default:
      sendPacket(this, packet, cb)
      break
  }
}

/**
 * _setupPingTimer - setup the ping timer
 *
 * @api private
 */
MqttClient.prototype._setupPingTimer = function () {
  var that = this

  if (!this.pingTimer && this.options.keepalive) {
    this.pingResp = true
    this.pingTimer = reInterval(function () {
      that._checkPing()
    }, this.options.keepalive * 1000)
  }
}

/**
 * _shiftPingInterval - reschedule the ping interval
 *
 * @api private
 */
MqttClient.prototype._shiftPingInterval = function () {
  if (this.pingTimer && this.options.keepalive && this.options.reschedulePings) {
    this.pingTimer.reschedule(this.options.keepalive * 1000)
  }
}
/**
 * _checkPing - check if a pingresp has come back, and ping the server again
 *
 * @api private
 */
MqttClient.prototype._checkPing = function () {
  if (this.pingResp) {
    this.pingResp = false
    this._sendPacket({ cmd: 'pingreq' })
  } else {
    // do a forced cleanup since socket will be in bad shape
    this._cleanUp(true)
  }
}

/**
 * _handlePingresp - handle a pingresp
 *
 * @api private
 */
MqttClient.prototype._handlePingresp = function () {
  this.pingResp = true
}

/**
 * _handleConnack
 *
 * @param {Object} packet
 * @api private
 */

MqttClient.prototype._handleConnack = function (packet) {
  var rc = packet.returnCode
  var errors = [
    '',
    'Unacceptable protocol version',
    'Identifier rejected',
    'Server unavailable',
    'Bad username or password',
    'Not authorized'
  ]

  clearTimeout(this.connackTimer)

  if (rc === 0) {
    this.reconnecting = false
    this.emit('connect', packet)
  } else if (rc > 0) {
    var err = new Error('Connection refused: ' + errors[rc])
    err.code = rc
    this.emit('error', err)
  }
}

/**
 * _handlePublish
 *
 * @param {Object} packet
 * @api private
 */
/*
those late 2 case should be rewrite to comply with coding style:

case 1:
case 0:
  // do not wait sending a puback
  // no callback passed
  if (1 === qos) {
    this._sendPacket({
      cmd: 'puback',
      messageId: mid
    });
  }
  // emit the message event for both qos 1 and 0
  this.emit('message', topic, message, packet);
  this.handleMessage(packet, done);
  break;
default:
  // do nothing but every switch mus have a default
  // log or throw an error about unknown qos
  break;

for now i just suppressed the warnings
*/
MqttClient.prototype._handlePublish = function (packet, done) {
  done = typeof done !== 'undefined' ? done : nop
  var topic = packet.topic.toString()
  var message = packet.payload
  var qos = packet.qos
  var mid = packet.messageId
  var that = this

  switch (qos) {
    case 2:
      this.incomingStore.put(packet, function (err) {
        if (err) {
          return done(err)
        }
        that._sendPacket({cmd: 'pubrec', messageId: mid}, done)
      })
      break
    case 1:
      // emit the message event
      this.emit('message', topic, message, packet)
      this.handleMessage(packet, function (err) {
        if (err) {
          return done(err)
        }
        // send 'puback' if the above 'handleMessage' method executed
        // successfully.
        that._sendPacket({cmd: 'puback', messageId: mid}, done)
      })
      break
    case 0:
      // emit the message event
      this.emit('message', topic, message, packet)
      this.handleMessage(packet, done)
      break
    default:
      // do nothing
      // log or throw an error about unknown qos
      break
  }
}

/**
 * Handle messages with backpressure support, one at a time.
 * Override at will.
 *
 * @param Packet packet the packet
 * @param Function callback call when finished
 * @api public
 */
MqttClient.prototype.handleMessage = function (packet, callback) {
  callback()
}

/**
 * _handleAck
 *
 * @param {Object} packet
 * @api private
 */

MqttClient.prototype._handleAck = function (packet) {
  /* eslint no-fallthrough: "off" */
  var mid = packet.messageId
  var type = packet.cmd
  var response = null
  var cb = this.outgoing[mid]
  var that = this

  if (!cb) {
    // Server sent an ack in error, ignore it.
    return
  }

  // Process
  switch (type) {
    case 'pubcomp':
      // same thing as puback for QoS 2
    case 'puback':
      // Callback - we're done
      delete this.outgoing[mid]
      this.outgoingStore.del(packet, cb)
      break
    case 'pubrec':
      response = {
        cmd: 'pubrel',
        qos: 2,
        messageId: mid
      }

      this._sendPacket(response)
      break
    case 'suback':
      delete this.outgoing[mid]
      if (packet.granted.length === 1 && (packet.granted[0] & 0x80) !== 0) {
        // suback with Failure status
        var topics = this.messageIdToTopic[mid]
        if (topics) {
          topics.forEach(function (topic) {
            delete that._resubscribeTopics[topic]
          })
        }
      }
      cb(null, packet)
      break
    case 'unsuback':
      delete this.outgoing[mid]
      cb(null)
      break
    default:
      that.emit('error', new Error('unrecognized packet type'))
  }

  if (this.disconnecting &&
      Object.keys(this.outgoing).length === 0) {
    this.emit('outgoingEmpty')
  }
}

/**
 * _handlePubrel
 *
 * @param {Object} packet
 * @api private
 */
MqttClient.prototype._handlePubrel = function (packet, callback) {
  callback = typeof callback !== 'undefined' ? callback : nop
  var mid = packet.messageId
  var that = this

  var comp = {cmd: 'pubcomp', messageId: mid}

  that.incomingStore.get(packet, function (err, pub) {
    if (!err && pub.cmd !== 'pubrel') {
      that.emit('message', pub.topic, pub.payload, pub)
      that.incomingStore.put(packet, function (err) {
        if (err) {
          return callback(err)
        }
        that.handleMessage(pub, function (err) {
          if (err) {
            return callback(err)
          }
          that._sendPacket(comp, callback)
        })
      })
    } else {
      that._sendPacket(comp, callback)
    }
  })
}

/**
 * _nextId
 * @return unsigned int
 */
MqttClient.prototype._nextId = function () {
  // id becomes current state of this.nextId and increments afterwards
  var id = this.nextId++
  // Ensure 16 bit unsigned int (max 65535, nextId got one higher)
  if (this.nextId === 65536) {
    this.nextId = 1
  }
  return id
}

/**
 * getLastMessageId
 * @return unsigned int
 */
MqttClient.prototype.getLastMessageId = function () {
  return (this.nextId === 1) ? 65535 : (this.nextId - 1)
}

module.exports = MqttClient

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./store":138,"./validations":139,"_process":17,"end-of-stream":55,"events":10,"inherits":123,"mqtt-packet":127,"readable-stream":152,"reinterval":153,"xtend":202}],133:[function(require,module,exports){
(function (process){
'use strict'

var MqttClient = require('../client')
var Store = require('../store')
var url = require('url')
var xtend = require('xtend')
var protocols = {}

if (process.title !== 'browser') {
  protocols.mqtt = require('./tcp')
  protocols.tcp = require('./tcp')
  protocols.ssl = require('./tls')
  protocols.tls = require('./tls')
  protocols.mqtts = require('./tls')
} else {
  protocols.wx = require('./wx')
  protocols.wxs = require('./wx')
}

protocols.ws = require('./ws')
protocols.wss = require('./ws')

/**
 * Parse the auth attribute and merge username and password in the options object.
 *
 * @param {Object} [opts] option object
 */
function parseAuthOptions (opts) {
  var matches
  if (opts.auth) {
    matches = opts.auth.match(/^(.+):(.+)$/)
    if (matches) {
      opts.username = matches[1]
      opts.password = matches[2]
    } else {
      opts.username = opts.auth
    }
  }
}

/**
 * connect - connect to an MQTT broker.
 *
 * @param {String} [brokerUrl] - url of the broker, optional
 * @param {Object} opts - see MqttClient#constructor
 */
function connect (brokerUrl, opts) {
  if ((typeof brokerUrl === 'object') && !opts) {
    opts = brokerUrl
    brokerUrl = null
  }

  opts = opts || {}

  if (brokerUrl) {
    var parsed = url.parse(brokerUrl, true)
    if (parsed.port != null) {
      parsed.port = Number(parsed.port)
    }

    opts = xtend(parsed, opts)

    if (opts.protocol === null) {
      throw new Error('Missing protocol')
    }
    opts.protocol = opts.protocol.replace(/:$/, '')
  }

  // merge in the auth options if supplied
  parseAuthOptions(opts)

  // support clientId passed in the query string of the url
  if (opts.query && typeof opts.query.clientId === 'string') {
    opts.clientId = opts.query.clientId
  }

  if (opts.cert && opts.key) {
    if (opts.protocol) {
      if (['mqtts', 'wss', 'wxs'].indexOf(opts.protocol) === -1) {
        switch (opts.protocol) {
          case 'mqtt':
            opts.protocol = 'mqtts'
            break
          case 'ws':
            opts.protocol = 'wss'
            break
          case 'wx':
            opts.protocol = 'wxs'
            break
          default:
            throw new Error('Unknown protocol for secure connection: "' + opts.protocol + '"!')
        }
      }
    } else {
      // don't know what protocol he want to use, mqtts or wss
      throw new Error('Missing secure protocol key')
    }
  }

  if (!protocols[opts.protocol]) {
    var isSecure = ['mqtts', 'wss'].indexOf(opts.protocol) !== -1
    opts.protocol = [
      'mqtt',
      'mqtts',
      'ws',
      'wss',
      'wx',
      'wxs'
    ].filter(function (key, index) {
      if (isSecure && index % 2 === 0) {
        // Skip insecure protocols when requesting a secure one.
        return false
      }
      return (typeof protocols[key] === 'function')
    })[0]
  }

  if (opts.clean === false && !opts.clientId) {
    throw new Error('Missing clientId for unclean clients')
  }

  if (opts.protocol) {
    opts.defaultProtocol = opts.protocol
  }

  function wrapper (client) {
    if (opts.servers) {
      if (!client._reconnectCount || client._reconnectCount === opts.servers.length) {
        client._reconnectCount = 0
      }

      opts.host = opts.servers[client._reconnectCount].host
      opts.port = opts.servers[client._reconnectCount].port
      opts.protocol = (!opts.servers[client._reconnectCount].protocol ? opts.defaultProtocol : opts.servers[client._reconnectCount].protocol)
      opts.hostname = opts.host

      client._reconnectCount++
    }

    return protocols[opts.protocol](client, opts)
  }

  return new MqttClient(wrapper, opts)
}

module.exports = connect
module.exports.connect = connect
module.exports.MqttClient = MqttClient
module.exports.Store = Store

}).call(this,require('_process'))
},{"../client":132,"../store":138,"./tcp":134,"./tls":135,"./ws":136,"./wx":137,"_process":17,"url":39,"xtend":202}],134:[function(require,module,exports){
'use strict'
var net = require('net')

/*
  variables port and host can be removed since
  you have all required information in opts object
*/
function buildBuilder (client, opts) {
  var port, host
  opts.port = opts.port || 1883
  opts.hostname = opts.hostname || opts.host || 'localhost'

  port = opts.port
  host = opts.hostname

  return net.createConnection(port, host)
}

module.exports = buildBuilder

},{"net":6}],135:[function(require,module,exports){
'use strict'
var tls = require('tls')

function buildBuilder (mqttClient, opts) {
  var connection
  opts.port = opts.port || 8883
  opts.host = opts.hostname || opts.host || 'localhost'

  opts.rejectUnauthorized = opts.rejectUnauthorized !== false

  delete opts.path

  connection = tls.connect(opts)
  /* eslint no-use-before-define: [2, "nofunc"] */
  connection.on('secureConnect', function () {
    if (opts.rejectUnauthorized && !connection.authorized) {
      connection.emit('error', new Error('TLS not authorized'))
    } else {
      connection.removeListener('error', handleTLSerrors)
    }
  })

  function handleTLSerrors (err) {
    // How can I get verify this error is a tls error?
    if (opts.rejectUnauthorized) {
      mqttClient.emit('error', err)
    }

    // close this connection to match the behaviour of net
    // otherwise all we get is an error from the connection
    // and close event doesn't fire. This is a work around
    // to enable the reconnect code to work the same as with
    // net.createConnection
    connection.end()
  }

  connection.on('error', handleTLSerrors)
  return connection
}

module.exports = buildBuilder

},{"tls":6}],136:[function(require,module,exports){
(function (process){
'use strict'

var websocket = require('websocket-stream')
var urlModule = require('url')
var WSS_OPTIONS = [
  'rejectUnauthorized',
  'ca',
  'cert',
  'key',
  'pfx',
  'passphrase'
]
var IS_BROWSER = process.title === 'browser'

function buildUrl (opts, client) {
  var url = opts.protocol + '://' + opts.hostname + ':' + opts.port + opts.path
  if (typeof (opts.transformWsUrl) === 'function') {
    url = opts.transformWsUrl(url, opts, client)
  }
  return url
}

function setDefaultOpts (opts) {
  if (!opts.hostname) {
    opts.hostname = 'localhost'
  }
  if (!opts.port) {
    if (opts.protocol === 'wss') {
      opts.port = 443
    } else {
      opts.port = 80
    }
  }
  if (!opts.path) {
    opts.path = '/'
  }

  if (!opts.wsOptions) {
    opts.wsOptions = {}
  }
  if (!IS_BROWSER && opts.protocol === 'wss') {
    // Add cert/key/ca etc options
    WSS_OPTIONS.forEach(function (prop) {
      if (opts.hasOwnProperty(prop) && !opts.wsOptions.hasOwnProperty(prop)) {
        opts.wsOptions[prop] = opts[prop]
      }
    })
  }
}

function createWebSocket (client, opts) {
  var websocketSubProtocol =
    (opts.protocolId === 'MQIsdp') && (opts.protocolVersion === 3)
      ? 'mqttv3.1'
      : 'mqtt'

  setDefaultOpts(opts)
  var url = buildUrl(opts, client)
  return websocket(url, [websocketSubProtocol], opts.wsOptions)
}

function buildBuilder (client, opts) {
  return createWebSocket(client, opts)
}

function buildBuilderBrowser (client, opts) {
  if (!opts.hostname) {
    opts.hostname = opts.host
  }

  if (!opts.hostname) {
    // Throwing an error in a Web Worker if no `hostname` is given, because we
    // can not determine the `hostname` automatically.  If connecting to
    // localhost, please supply the `hostname` as an argument.
    if (typeof (document) === 'undefined') {
      throw new Error('Could not determine host. Specify host manually.')
    }
    var parsed = urlModule.parse(document.URL)
    opts.hostname = parsed.hostname

    if (!opts.port) {
      opts.port = parsed.port
    }
  }
  return createWebSocket(client, opts)
}

if (IS_BROWSER) {
  module.exports = buildBuilderBrowser
} else {
  module.exports = buildBuilder
}

}).call(this,require('_process'))
},{"_process":17,"url":39,"websocket-stream":197}],137:[function(require,module,exports){
'use strict'

/* global wx */
var socketOpen = false
var socketMsgQueue = []

function sendSocketMessage (msg) {
  if (socketOpen) {
    wx.sendSocketMessage({
      data: msg.buffer || msg
    })
  } else {
    socketMsgQueue.push(msg)
  }
}

function WebSocket (url, protocols) {
  var ws = {
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
    readyState: socketOpen ? 1 : 0,
    send: sendSocketMessage,
    close: wx.closeSocket,
    onopen: null,
    onmessage: null,
    onclose: null,
    onerror: null
  }

  wx.connectSocket({
    url: url,
    protocols: protocols
  })
  wx.onSocketOpen(function (res) {
    ws.readyState = ws.OPEN
    socketOpen = true
    for (var i = 0; i < socketMsgQueue.length; i++) {
      sendSocketMessage(socketMsgQueue[i])
    }
    socketMsgQueue = []

    ws.onopen && ws.onopen.apply(ws, arguments)
  })
  wx.onSocketMessage(function (res) {
    ws.onmessage && ws.onmessage.apply(ws, arguments)
  })
  wx.onSocketClose(function () {
    ws.onclose && ws.onclose.apply(ws, arguments)
    ws.readyState = ws.CLOSED
    socketOpen = false
  })
  wx.onSocketError(function () {
    ws.onerror && ws.onerror.apply(ws, arguments)
    ws.readyState = ws.CLOSED
    socketOpen = false
  })

  return ws
}

var websocket = require('websocket-stream')

function buildUrl (opts, client) {
  var protocol = opts.protocol === 'wxs' ? 'wss' : 'ws'
  var url = protocol + '://' + opts.hostname + opts.path
  if (opts.port && opts.port !== 80 && opts.port !== 443) {
    url = protocol + '://' + opts.hostname + ':' + opts.port + opts.path
  }
  if (typeof (opts.transformWsUrl) === 'function') {
    url = opts.transformWsUrl(url, opts, client)
  }
  return url
}

function setDefaultOpts (opts) {
  if (!opts.hostname) {
    opts.hostname = 'localhost'
  }
  if (!opts.path) {
    opts.path = '/'
  }

  if (!opts.wsOptions) {
    opts.wsOptions = {}
  }
}

function createWebSocket (client, opts) {
  var websocketSubProtocol =
    (opts.protocolId === 'MQIsdp') && (opts.protocolVersion === 3)
      ? 'mqttv3.1'
      : 'mqtt'

  setDefaultOpts(opts)
  var url = buildUrl(opts, client)
  return websocket(WebSocket(url, [websocketSubProtocol]))
}

function buildBuilder (client, opts) {
  opts.hostname = opts.hostname || opts.host

  if (!opts.hostname) {
    throw new Error('Could not determine host. Specify host manually.')
  }

  return createWebSocket(client, opts)
}

module.exports = buildBuilder

},{"websocket-stream":197}],138:[function(require,module,exports){
(function (process){
'use strict'

/**
 * Module dependencies
 */
var xtend = require('xtend')

var Readable = require('readable-stream').Readable
var streamsOpts = { objectMode: true }
var defaultStoreOptions = {
  clean: true
}

/**
 * es6-map can preserve insertion order even if ES version is older.
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Description
 * It should be noted that a Map which is a map of an object, especially
 * a dictionary of dictionaries, will only map to the object's insertion
 * order. In ES2015 this is ordered for objects but for older versions of
 * ES, this may be random and not ordered.
 *
 */
var Map = require('es6-map')

/**
 * In-memory implementation of the message store
 * This can actually be saved into files.
 *
 * @param {Object} [options] - store options
 */
function Store (options) {
  if (!(this instanceof Store)) {
    return new Store(options)
  }

  this.options = options || {}

  // Defaults
  this.options = xtend(defaultStoreOptions, options)

  this._inflights = new Map()
}

/**
 * Adds a packet to the store, a packet is
 * anything that has a messageId property.
 *
 */
Store.prototype.put = function (packet, cb) {
  this._inflights.set(packet.messageId, packet)

  if (cb) {
    cb()
  }

  return this
}

/**
 * Creates a stream with all the packets in the store
 *
 */
Store.prototype.createStream = function () {
  var stream = new Readable(streamsOpts)
  var destroyed = false
  var values = []
  var i = 0

  this._inflights.forEach(function (value, key) {
    values.push(value)
  })

  stream._read = function () {
    if (!destroyed && i < values.length) {
      this.push(values[i++])
    } else {
      this.push(null)
    }
  }

  stream.destroy = function () {
    if (destroyed) {
      return
    }

    var self = this

    destroyed = true

    process.nextTick(function () {
      self.emit('close')
    })
  }

  return stream
}

/**
 * deletes a packet from the store.
 */
Store.prototype.del = function (packet, cb) {
  packet = this._inflights.get(packet.messageId)
  if (packet) {
    this._inflights.delete(packet.messageId)
    cb(null, packet)
  } else if (cb) {
    cb(new Error('missing packet'))
  }

  return this
}

/**
 * get a packet from the store.
 */
Store.prototype.get = function (packet, cb) {
  packet = this._inflights.get(packet.messageId)
  if (packet) {
    cb(null, packet)
  } else if (cb) {
    cb(new Error('missing packet'))
  }

  return this
}

/**
 * Close the store
 */
Store.prototype.close = function (cb) {
  if (this.options.clean) {
    this._inflights = null
  }
  if (cb) {
    cb()
  }
}

module.exports = Store

}).call(this,require('_process'))
},{"_process":17,"es6-map":103,"readable-stream":152,"xtend":202}],139:[function(require,module,exports){
'use strict'

/**
 * Validate a topic to see if it's valid or not.
 * A topic is valid if it follow below rules:
 * - Rule #1: If any part of the topic is not `+` or `#`, then it must not contain `+` and '#'
 * - Rule #2: Part `#` must be located at the end of the mailbox
 *
 * @param {String} topic - A topic
 * @returns {Boolean} If the topic is valid, returns true. Otherwise, returns false.
 */
function validateTopic (topic) {
  var parts = topic.split('/')

  for (var i = 0; i < parts.length; i++) {
    if (parts[i] === '+') {
      continue
    }

    if (parts[i] === '#') {
      // for Rule #2
      return i === parts.length - 1
    }

    if (parts[i].indexOf('+') !== -1 || parts[i].indexOf('#') !== -1) {
      return false
    }
  }

  return true
}

/**
 * Validate an array of topics to see if any of them is valid or not
  * @param {Array} topics - Array of topics
 * @returns {String} If the topics is valid, returns null. Otherwise, returns the invalid one
 */
function validateTopics (topics) {
  if (topics.length === 0) {
    return 'empty_topic_list'
  }
  for (var i = 0; i < topics.length; i++) {
    if (!validateTopic(topics[i])) {
      return topics[i]
    }
  }
  return null
}

module.exports = {
  validateTopics: validateTopics
}

},{}],140:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} [options]
 * @throws {Error} throw an error if val is not a non-empty string or a number
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === 'string' && val.length > 0) {
    return parse(val);
  } else if (type === 'number' && isNaN(val) === false) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error(
    'val is not a non-empty string or a valid number. val=' +
      JSON.stringify(val)
  );
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(
    str
  );
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
    default:
      return undefined;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtShort(ms) {
  if (ms >= d) {
    return Math.round(ms / d) + 'd';
  }
  if (ms >= h) {
    return Math.round(ms / h) + 'h';
  }
  if (ms >= m) {
    return Math.round(ms / m) + 'm';
  }
  if (ms >= s) {
    return Math.round(ms / s) + 's';
  }
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function fmtLong(ms) {
  return plural(ms, d, 'day') ||
    plural(ms, h, 'hour') ||
    plural(ms, m, 'minute') ||
    plural(ms, s, 'second') ||
    ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) {
    return;
  }
  if (ms < n * 1.5) {
    return Math.floor(ms / n) + ' ' + name;
  }
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],141:[function(require,module,exports){
var wrappy = require('wrappy')
module.exports = wrappy(once)
module.exports.strict = wrappy(onceStrict)

once.proto = once(function () {
  Object.defineProperty(Function.prototype, 'once', {
    value: function () {
      return once(this)
    },
    configurable: true
  })

  Object.defineProperty(Function.prototype, 'onceStrict', {
    value: function () {
      return onceStrict(this)
    },
    configurable: true
  })
})

function once (fn) {
  var f = function () {
    if (f.called) return f.value
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  f.called = false
  return f
}

function onceStrict (fn) {
  var f = function () {
    if (f.called)
      throw new Error(f.onceError)
    f.called = true
    return f.value = fn.apply(this, arguments)
  }
  var name = fn.name || 'Function wrapped with `once`'
  f.onceError = name + " shouldn't be called more than once"
  f.called = false
  return f
}

},{"wrappy":201}],142:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"_process":17,"dup":16}],143:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"./lib/_stream_duplex.js":144,"dup":22}],144:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"./_stream_readable":146,"./_stream_writable":148,"core-util-is":51,"dup":23,"inherits":123,"process-nextick-args":142}],145:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"./_stream_transform":147,"core-util-is":51,"dup":24,"inherits":123}],146:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"./_stream_duplex":144,"./internal/streams/BufferList":149,"./internal/streams/destroy":150,"./internal/streams/stream":151,"_process":17,"core-util-is":51,"dup":25,"events":10,"inherits":123,"isarray":124,"process-nextick-args":142,"safe-buffer":154,"string_decoder/":161,"util":6}],147:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"./_stream_duplex":144,"core-util-is":51,"dup":26,"inherits":123}],148:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"./_stream_duplex":144,"./internal/streams/destroy":150,"./internal/streams/stream":151,"_process":17,"core-util-is":51,"dup":27,"inherits":123,"process-nextick-args":142,"safe-buffer":154,"timers":38,"util-deprecate":174}],149:[function(require,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"dup":28,"safe-buffer":154,"util":6}],150:[function(require,module,exports){
arguments[4][29][0].apply(exports,arguments)
},{"dup":29,"process-nextick-args":142}],151:[function(require,module,exports){
arguments[4][30][0].apply(exports,arguments)
},{"dup":30,"events":10}],152:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"./lib/_stream_duplex.js":144,"./lib/_stream_passthrough.js":145,"./lib/_stream_readable.js":146,"./lib/_stream_transform.js":147,"./lib/_stream_writable.js":148,"dup":34}],153:[function(require,module,exports){
'use strict'

function ReInterval (callback, interval, args) {
  var self = this;

  this._callback = callback;
  this._args = args;

  this._interval = setInterval(callback, interval, this._args);

  this.reschedule = function (interval) {
    // if no interval entered, use the interval passed in on creation
    if (!interval)
      interval = self._interval;

    if (self._interval)
      clearInterval(self._interval);
    self._interval = setInterval(self._callback, interval, self._args);
  };

  this.clear = function () {
    if (self._interval) {
      clearInterval(self._interval);
      self._interval = undefined;
    }
  };
  
  this.destroy = function () {
    if (self._interval) {
      clearInterval(self._interval);
    }
    self._callback = undefined;
    self._interval = undefined;
    self._args = undefined;
  };
}

function reInterval () {
  if (typeof arguments[0] !== 'function')
    throw new Error('callback needed');
  if (typeof arguments[1] !== 'number')
    throw new Error('interval needed');

  var args;

  if (arguments.length > 0) {
    args = new Array(arguments.length - 2);

    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i + 2];
    }
  }

  return new ReInterval(arguments[0], arguments[1], args);
}

module.exports = reInterval;

},{}],154:[function(require,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"buffer":8,"dup":31}],155:[function(require,module,exports){
 /* eslint-env node */
'use strict';

// SDP helpers.
var SDPUtils = {};

// Generate an alphanumeric identifier for cname or mids.
// TODO: use UUIDs instead? https://gist.github.com/jed/982883
SDPUtils.generateIdentifier = function() {
  return Math.random().toString(36).substr(2, 10);
};

// The RTCP CNAME used by all peerconnections from the same JS.
SDPUtils.localCName = SDPUtils.generateIdentifier();

// Splits SDP into lines, dealing with both CRLF and LF.
SDPUtils.splitLines = function(blob) {
  return blob.trim().split('\n').map(function(line) {
    return line.trim();
  });
};
// Splits SDP into sessionpart and mediasections. Ensures CRLF.
SDPUtils.splitSections = function(blob) {
  var parts = blob.split('\nm=');
  return parts.map(function(part, index) {
    return (index > 0 ? 'm=' + part : part).trim() + '\r\n';
  });
};

// Returns lines that start with a certain prefix.
SDPUtils.matchPrefix = function(blob, prefix) {
  return SDPUtils.splitLines(blob).filter(function(line) {
    return line.indexOf(prefix) === 0;
  });
};

// Parses an ICE candidate line. Sample input:
// candidate:702786350 2 udp 41819902 8.8.8.8 60769 typ relay raddr 8.8.8.8
// rport 55996"
SDPUtils.parseCandidate = function(line) {
  var parts;
  // Parse both variants.
  if (line.indexOf('a=candidate:') === 0) {
    parts = line.substring(12).split(' ');
  } else {
    parts = line.substring(10).split(' ');
  }

  var candidate = {
    foundation: parts[0],
    component: parts[1],
    protocol: parts[2].toLowerCase(),
    priority: parseInt(parts[3], 10),
    ip: parts[4],
    port: parseInt(parts[5], 10),
    // skip parts[6] == 'typ'
    type: parts[7]
  };

  for (var i = 8; i < parts.length; i += 2) {
    switch (parts[i]) {
      case 'raddr':
        candidate.relatedAddress = parts[i + 1];
        break;
      case 'rport':
        candidate.relatedPort = parseInt(parts[i + 1], 10);
        break;
      case 'tcptype':
        candidate.tcpType = parts[i + 1];
        break;
      default: // extension handling, in particular ufrag
        candidate[parts[i]] = parts[i + 1];
        break;
    }
  }
  return candidate;
};

// Translates a candidate object into SDP candidate attribute.
SDPUtils.writeCandidate = function(candidate) {
  var sdp = [];
  sdp.push(candidate.foundation);
  sdp.push(candidate.component);
  sdp.push(candidate.protocol.toUpperCase());
  sdp.push(candidate.priority);
  sdp.push(candidate.ip);
  sdp.push(candidate.port);

  var type = candidate.type;
  sdp.push('typ');
  sdp.push(type);
  if (type !== 'host' && candidate.relatedAddress &&
      candidate.relatedPort) {
    sdp.push('raddr');
    sdp.push(candidate.relatedAddress); // was: relAddr
    sdp.push('rport');
    sdp.push(candidate.relatedPort); // was: relPort
  }
  if (candidate.tcpType && candidate.protocol.toLowerCase() === 'tcp') {
    sdp.push('tcptype');
    sdp.push(candidate.tcpType);
  }
  return 'candidate:' + sdp.join(' ');
};

// Parses an ice-options line, returns an array of option tags.
// a=ice-options:foo bar
SDPUtils.parseIceOptions = function(line) {
  return line.substr(14).split(' ');
}

// Parses an rtpmap line, returns RTCRtpCoddecParameters. Sample input:
// a=rtpmap:111 opus/48000/2
SDPUtils.parseRtpMap = function(line) {
  var parts = line.substr(9).split(' ');
  var parsed = {
    payloadType: parseInt(parts.shift(), 10) // was: id
  };

  parts = parts[0].split('/');

  parsed.name = parts[0];
  parsed.clockRate = parseInt(parts[1], 10); // was: clockrate
  // was: channels
  parsed.numChannels = parts.length === 3 ? parseInt(parts[2], 10) : 1;
  return parsed;
};

// Generate an a=rtpmap line from RTCRtpCodecCapability or
// RTCRtpCodecParameters.
SDPUtils.writeRtpMap = function(codec) {
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  return 'a=rtpmap:' + pt + ' ' + codec.name + '/' + codec.clockRate +
      (codec.numChannels !== 1 ? '/' + codec.numChannels : '') + '\r\n';
};

// Parses an a=extmap line (headerextension from RFC 5285). Sample input:
// a=extmap:2 urn:ietf:params:rtp-hdrext:toffset
// a=extmap:2/sendonly urn:ietf:params:rtp-hdrext:toffset
SDPUtils.parseExtmap = function(line) {
  var parts = line.substr(9).split(' ');
  return {
    id: parseInt(parts[0], 10),
    direction: parts[0].indexOf('/') > 0 ? parts[0].split('/')[1] : 'sendrecv',
    uri: parts[1]
  };
};

// Generates a=extmap line from RTCRtpHeaderExtensionParameters or
// RTCRtpHeaderExtension.
SDPUtils.writeExtmap = function(headerExtension) {
  return 'a=extmap:' + (headerExtension.id || headerExtension.preferredId) +
      (headerExtension.direction && headerExtension.direction !== 'sendrecv'
          ? '/' + headerExtension.direction
          : '') +
      ' ' + headerExtension.uri + '\r\n';
};

// Parses an ftmp line, returns dictionary. Sample input:
// a=fmtp:96 vbr=on;cng=on
// Also deals with vbr=on; cng=on
SDPUtils.parseFmtp = function(line) {
  var parsed = {};
  var kv;
  var parts = line.substr(line.indexOf(' ') + 1).split(';');
  for (var j = 0; j < parts.length; j++) {
    kv = parts[j].trim().split('=');
    parsed[kv[0].trim()] = kv[1];
  }
  return parsed;
};

// Generates an a=ftmp line from RTCRtpCodecCapability or RTCRtpCodecParameters.
SDPUtils.writeFmtp = function(codec) {
  var line = '';
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  if (codec.parameters && Object.keys(codec.parameters).length) {
    var params = [];
    Object.keys(codec.parameters).forEach(function(param) {
      params.push(param + '=' + codec.parameters[param]);
    });
    line += 'a=fmtp:' + pt + ' ' + params.join(';') + '\r\n';
  }
  return line;
};

// Parses an rtcp-fb line, returns RTCPRtcpFeedback object. Sample input:
// a=rtcp-fb:98 nack rpsi
SDPUtils.parseRtcpFb = function(line) {
  var parts = line.substr(line.indexOf(' ') + 1).split(' ');
  return {
    type: parts.shift(),
    parameter: parts.join(' ')
  };
};
// Generate a=rtcp-fb lines from RTCRtpCodecCapability or RTCRtpCodecParameters.
SDPUtils.writeRtcpFb = function(codec) {
  var lines = '';
  var pt = codec.payloadType;
  if (codec.preferredPayloadType !== undefined) {
    pt = codec.preferredPayloadType;
  }
  if (codec.rtcpFeedback && codec.rtcpFeedback.length) {
    // FIXME: special handling for trr-int?
    codec.rtcpFeedback.forEach(function(fb) {
      lines += 'a=rtcp-fb:' + pt + ' ' + fb.type +
      (fb.parameter && fb.parameter.length ? ' ' + fb.parameter : '') +
          '\r\n';
    });
  }
  return lines;
};

// Parses an RFC 5576 ssrc media attribute. Sample input:
// a=ssrc:3735928559 cname:something
SDPUtils.parseSsrcMedia = function(line) {
  var sp = line.indexOf(' ');
  var parts = {
    ssrc: parseInt(line.substr(7, sp - 7), 10)
  };
  var colon = line.indexOf(':', sp);
  if (colon > -1) {
    parts.attribute = line.substr(sp + 1, colon - sp - 1);
    parts.value = line.substr(colon + 1);
  } else {
    parts.attribute = line.substr(sp + 1);
  }
  return parts;
};

// Extracts the MID (RFC 5888) from a media section.
// returns the MID or undefined if no mid line was found.
SDPUtils.getMid = function(mediaSection) {
  var mid = SDPUtils.matchPrefix(mediaSection, 'a=mid:')[0];
  if (mid) {
    return mid.substr(6);
  }
}

SDPUtils.parseFingerprint = function(line) {
  var parts = line.substr(14).split(' ');
  return {
    algorithm: parts[0].toLowerCase(), // algorithm is case-sensitive in Edge.
    value: parts[1]
  };
};

// Extracts DTLS parameters from SDP media section or sessionpart.
// FIXME: for consistency with other functions this should only
//   get the fingerprint line as input. See also getIceParameters.
SDPUtils.getDtlsParameters = function(mediaSection, sessionpart) {
  var lines = SDPUtils.matchPrefix(mediaSection + sessionpart,
      'a=fingerprint:');
  // Note: a=setup line is ignored since we use the 'auto' role.
  // Note2: 'algorithm' is not case sensitive except in Edge.
  return {
    role: 'auto',
    fingerprints: lines.map(SDPUtils.parseFingerprint)
  };
};

// Serializes DTLS parameters to SDP.
SDPUtils.writeDtlsParameters = function(params, setupType) {
  var sdp = 'a=setup:' + setupType + '\r\n';
  params.fingerprints.forEach(function(fp) {
    sdp += 'a=fingerprint:' + fp.algorithm + ' ' + fp.value + '\r\n';
  });
  return sdp;
};
// Parses ICE information from SDP media section or sessionpart.
// FIXME: for consistency with other functions this should only
//   get the ice-ufrag and ice-pwd lines as input.
SDPUtils.getIceParameters = function(mediaSection, sessionpart) {
  var lines = SDPUtils.splitLines(mediaSection);
  // Search in session part, too.
  lines = lines.concat(SDPUtils.splitLines(sessionpart));
  var iceParameters = {
    usernameFragment: lines.filter(function(line) {
      return line.indexOf('a=ice-ufrag:') === 0;
    })[0].substr(12),
    password: lines.filter(function(line) {
      return line.indexOf('a=ice-pwd:') === 0;
    })[0].substr(10)
  };
  return iceParameters;
};

// Serializes ICE parameters to SDP.
SDPUtils.writeIceParameters = function(params) {
  return 'a=ice-ufrag:' + params.usernameFragment + '\r\n' +
      'a=ice-pwd:' + params.password + '\r\n';
};

// Parses the SDP media section and returns RTCRtpParameters.
SDPUtils.parseRtpParameters = function(mediaSection) {
  var description = {
    codecs: [],
    headerExtensions: [],
    fecMechanisms: [],
    rtcp: []
  };
  var lines = SDPUtils.splitLines(mediaSection);
  var mline = lines[0].split(' ');
  for (var i = 3; i < mline.length; i++) { // find all codecs from mline[3..]
    var pt = mline[i];
    var rtpmapline = SDPUtils.matchPrefix(
        mediaSection, 'a=rtpmap:' + pt + ' ')[0];
    if (rtpmapline) {
      var codec = SDPUtils.parseRtpMap(rtpmapline);
      var fmtps = SDPUtils.matchPrefix(
          mediaSection, 'a=fmtp:' + pt + ' ');
      // Only the first a=fmtp:<pt> is considered.
      codec.parameters = fmtps.length ? SDPUtils.parseFmtp(fmtps[0]) : {};
      codec.rtcpFeedback = SDPUtils.matchPrefix(
          mediaSection, 'a=rtcp-fb:' + pt + ' ')
        .map(SDPUtils.parseRtcpFb);
      description.codecs.push(codec);
      // parse FEC mechanisms from rtpmap lines.
      switch (codec.name.toUpperCase()) {
        case 'RED':
        case 'ULPFEC':
          description.fecMechanisms.push(codec.name.toUpperCase());
          break;
        default: // only RED and ULPFEC are recognized as FEC mechanisms.
          break;
      }
    }
  }
  SDPUtils.matchPrefix(mediaSection, 'a=extmap:').forEach(function(line) {
    description.headerExtensions.push(SDPUtils.parseExtmap(line));
  });
  // FIXME: parse rtcp.
  return description;
};

// Generates parts of the SDP media section describing the capabilities /
// parameters.
SDPUtils.writeRtpDescription = function(kind, caps) {
  var sdp = '';

  // Build the mline.
  sdp += 'm=' + kind + ' ';
  sdp += caps.codecs.length > 0 ? '9' : '0'; // reject if no codecs.
  sdp += ' UDP/TLS/RTP/SAVPF ';
  sdp += caps.codecs.map(function(codec) {
    if (codec.preferredPayloadType !== undefined) {
      return codec.preferredPayloadType;
    }
    return codec.payloadType;
  }).join(' ') + '\r\n';

  sdp += 'c=IN IP4 0.0.0.0\r\n';
  sdp += 'a=rtcp:9 IN IP4 0.0.0.0\r\n';

  // Add a=rtpmap lines for each codec. Also fmtp and rtcp-fb.
  caps.codecs.forEach(function(codec) {
    sdp += SDPUtils.writeRtpMap(codec);
    sdp += SDPUtils.writeFmtp(codec);
    sdp += SDPUtils.writeRtcpFb(codec);
  });
  var maxptime = 0;
  caps.codecs.forEach(function(codec) {
    if (codec.maxptime > maxptime) {
      maxptime = codec.maxptime;
    }
  });
  if (maxptime > 0) {
    sdp += 'a=maxptime:' + maxptime + '\r\n';
  }
  sdp += 'a=rtcp-mux\r\n';

  caps.headerExtensions.forEach(function(extension) {
    sdp += SDPUtils.writeExtmap(extension);
  });
  // FIXME: write fecMechanisms.
  return sdp;
};

// Parses the SDP media section and returns an array of
// RTCRtpEncodingParameters.
SDPUtils.parseRtpEncodingParameters = function(mediaSection) {
  var encodingParameters = [];
  var description = SDPUtils.parseRtpParameters(mediaSection);
  var hasRed = description.fecMechanisms.indexOf('RED') !== -1;
  var hasUlpfec = description.fecMechanisms.indexOf('ULPFEC') !== -1;

  // filter a=ssrc:... cname:, ignore PlanB-msid
  var ssrcs = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
  .map(function(line) {
    return SDPUtils.parseSsrcMedia(line);
  })
  .filter(function(parts) {
    return parts.attribute === 'cname';
  });
  var primarySsrc = ssrcs.length > 0 && ssrcs[0].ssrc;
  var secondarySsrc;

  var flows = SDPUtils.matchPrefix(mediaSection, 'a=ssrc-group:FID')
  .map(function(line) {
    var parts = line.split(' ');
    parts.shift();
    return parts.map(function(part) {
      return parseInt(part, 10);
    });
  });
  if (flows.length > 0 && flows[0].length > 1 && flows[0][0] === primarySsrc) {
    secondarySsrc = flows[0][1];
  }

  description.codecs.forEach(function(codec) {
    if (codec.name.toUpperCase() === 'RTX' && codec.parameters.apt) {
      var encParam = {
        ssrc: primarySsrc,
        codecPayloadType: parseInt(codec.parameters.apt, 10),
        rtx: {
          ssrc: secondarySsrc
        }
      };
      encodingParameters.push(encParam);
      if (hasRed) {
        encParam = JSON.parse(JSON.stringify(encParam));
        encParam.fec = {
          ssrc: secondarySsrc,
          mechanism: hasUlpfec ? 'red+ulpfec' : 'red'
        };
        encodingParameters.push(encParam);
      }
    }
  });
  if (encodingParameters.length === 0 && primarySsrc) {
    encodingParameters.push({
      ssrc: primarySsrc
    });
  }

  // we support both b=AS and b=TIAS but interpret AS as TIAS.
  var bandwidth = SDPUtils.matchPrefix(mediaSection, 'b=');
  if (bandwidth.length) {
    if (bandwidth[0].indexOf('b=TIAS:') === 0) {
      bandwidth = parseInt(bandwidth[0].substr(7), 10);
    } else if (bandwidth[0].indexOf('b=AS:') === 0) {
      bandwidth = parseInt(bandwidth[0].substr(5), 10);
    }
    encodingParameters.forEach(function(params) {
      params.maxBitrate = bandwidth;
    });
  }
  return encodingParameters;
};

// parses http://draft.ortc.org/#rtcrtcpparameters*
SDPUtils.parseRtcpParameters = function(mediaSection) {
  var rtcpParameters = {};

  var cname;
  // Gets the first SSRC. Note that with RTX there might be multiple
  // SSRCs.
  var remoteSsrc = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
      .map(function(line) {
        return SDPUtils.parseSsrcMedia(line);
      })
      .filter(function(obj) {
        return obj.attribute === 'cname';
      })[0];
  if (remoteSsrc) {
    rtcpParameters.cname = remoteSsrc.value;
    rtcpParameters.ssrc = remoteSsrc.ssrc;
  }

  // Edge uses the compound attribute instead of reducedSize
  // compound is !reducedSize
  var rsize = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-rsize');
  rtcpParameters.reducedSize = rsize.length > 0;
  rtcpParameters.compound = rsize.length === 0;

  // parses the rtcp-mux attrіbute.
  // Note that Edge does not support unmuxed RTCP.
  var mux = SDPUtils.matchPrefix(mediaSection, 'a=rtcp-mux');
  rtcpParameters.mux = mux.length > 0;

  return rtcpParameters;
};

// parses either a=msid: or a=ssrc:... msid lines and returns
// the id of the MediaStream and MediaStreamTrack.
SDPUtils.parseMsid = function(mediaSection) {
  var parts;
  var spec = SDPUtils.matchPrefix(mediaSection, 'a=msid:');
  if (spec.length === 1) {
    parts = spec[0].substr(7).split(' ');
    return {stream: parts[0], track: parts[1]};
  }
  var planB = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
  .map(function(line) {
    return SDPUtils.parseSsrcMedia(line);
  })
  .filter(function(parts) {
    return parts.attribute === 'msid';
  });
  if (planB.length > 0) {
    parts = planB[0].value.split(' ');
    return {stream: parts[0], track: parts[1]};
  }
};

SDPUtils.writeSessionBoilerplate = function() {
  // FIXME: sess-id should be an NTP timestamp.
  return 'v=0\r\n' +
      'o=thisisadapterortc 8169639915646943137 2 IN IP4 127.0.0.1\r\n' +
      's=-\r\n' +
      't=0 0\r\n';
};

SDPUtils.writeMediaSection = function(transceiver, caps, type, stream) {
  var sdp = SDPUtils.writeRtpDescription(transceiver.kind, caps);

  // Map ICE parameters (ufrag, pwd) to SDP.
  sdp += SDPUtils.writeIceParameters(
      transceiver.iceGatherer.getLocalParameters());

  // Map DTLS parameters to SDP.
  sdp += SDPUtils.writeDtlsParameters(
      transceiver.dtlsTransport.getLocalParameters(),
      type === 'offer' ? 'actpass' : 'active');

  sdp += 'a=mid:' + transceiver.mid + '\r\n';

  if (transceiver.direction) {
    sdp += 'a=' + transceiver.direction + '\r\n';
  } else if (transceiver.rtpSender && transceiver.rtpReceiver) {
    sdp += 'a=sendrecv\r\n';
  } else if (transceiver.rtpSender) {
    sdp += 'a=sendonly\r\n';
  } else if (transceiver.rtpReceiver) {
    sdp += 'a=recvonly\r\n';
  } else {
    sdp += 'a=inactive\r\n';
  }

  if (transceiver.rtpSender) {
    // spec.
    var msid = 'msid:' + stream.id + ' ' +
        transceiver.rtpSender.track.id + '\r\n';
    sdp += 'a=' + msid;

    // for Chrome.
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
        ' ' + msid;
    if (transceiver.sendEncodingParameters[0].rtx) {
      sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
          ' ' + msid;
      sdp += 'a=ssrc-group:FID ' +
          transceiver.sendEncodingParameters[0].ssrc + ' ' +
          transceiver.sendEncodingParameters[0].rtx.ssrc +
          '\r\n';
    }
  }
  // FIXME: this should be written by writeRtpDescription.
  sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].ssrc +
      ' cname:' + SDPUtils.localCName + '\r\n';
  if (transceiver.rtpSender && transceiver.sendEncodingParameters[0].rtx) {
    sdp += 'a=ssrc:' + transceiver.sendEncodingParameters[0].rtx.ssrc +
        ' cname:' + SDPUtils.localCName + '\r\n';
  }
  return sdp;
};

// Gets the direction from the mediaSection or the sessionpart.
SDPUtils.getDirection = function(mediaSection, sessionpart) {
  // Look for sendrecv, sendonly, recvonly, inactive, default to sendrecv.
  var lines = SDPUtils.splitLines(mediaSection);
  for (var i = 0; i < lines.length; i++) {
    switch (lines[i]) {
      case 'a=sendrecv':
      case 'a=sendonly':
      case 'a=recvonly':
      case 'a=inactive':
        return lines[i].substr(2);
      default:
        // FIXME: What should happen here?
    }
  }
  if (sessionpart) {
    return SDPUtils.getDirection(sessionpart);
  }
  return 'sendrecv';
};

SDPUtils.getKind = function(mediaSection) {
  var lines = SDPUtils.splitLines(mediaSection);
  var mline = lines[0].split(' ');
  return mline[0].substr(2);
};

SDPUtils.isRejected = function(mediaSection) {
  return mediaSection.split(' ', 2)[1] === '0';
};

// Expose public methods.
module.exports = SDPUtils;

},{}],156:[function(require,module,exports){
(function (Buffer){
/**
 * @copyright (c) 2014-2015 Kristian Lyngbaek
 * @author Kristian Lyngbaek
 * @module stream-chunker
 */
var through2 = require('through2');

/**
 * Returns a transform stream which chunks incoming data into chunkSize byte
 * chunks.
 * @param  {integer}    chunkSize   Size of chunks in bytes
 * @param  {boolean}    [flush]     Flush incomplete chunk data on stream end
 *                                  Default is false
 * @return {Stream.Transform}       A transform stream
 */
module.exports = function (chunkSize, opts) {

    if (!opts) opts = {};
    var flush = opts.flush;
    var encoding = opts.encoding;

    // buffer to store the last few bytes of incoming data
    // if it does not divide evenly into chunkSize
    var buffer = new Buffer(0);

    var transformOpts = {
        encoding: encoding,
        halfOpen: false,
        objectMode: false
    };

    var transformFunction = function (data, enc, next) {
        var allData = Buffer.concat([buffer, data]);
        var totalLength = allData.length;
        var remainder = totalLength % chunkSize;
        var cutoff = totalLength - remainder;
        for (var i=0 ; i<cutoff ; i+=chunkSize) {
            var chunk = allData.slice(i, i+chunkSize);
            this.push(chunk);
        }
        buffer = allData.slice(cutoff, totalLength);
        next();
    };

    var flushFunction;
    if (flush) {
        flushFunction = function (next) {

            if (opts.align && buffer.length > 0) {
                var remaining = new Buffer(chunkSize - buffer.length);
                remaining.fill(0);
                buffer = Buffer.concat([ buffer, remaining ], chunkSize);
            }

            this.push(buffer);
            next();
        };
    }

    return through2(transformOpts, transformFunction, flushFunction);

};

}).call(this,require("buffer").Buffer)
},{"buffer":8,"through2":162}],157:[function(require,module,exports){
(function (process,Buffer){

/**
 * Module dependencies.
 */

var assert = require('assert');
var debug = require('debug')('stream-parser');

/**
 * Module exports.
 */

module.exports = Parser;

/**
 * Parser states.
 */

var INIT        = -1;
var BUFFERING   = 0;
var SKIPPING    = 1;
var PASSTHROUGH = 2;

/**
 * The `Parser` stream mixin works with either `Writable` or `Transform` stream
 * instances/subclasses. Provides a convenient generic "parsing" API:
 *
 *   _bytes(n, cb) - buffers "n" bytes and then calls "cb" with the "chunk"
 *   _skipBytes(n, cb) - skips "n" bytes and then calls "cb" when done
 *
 * If you extend a `Transform` stream, then the `_passthrough()` function is also
 * added:
 *
 *   _passthrough(n, cb) - passes through "n" bytes untouched and then calls "cb"
 *
 * @param {Stream} stream Transform or Writable stream instance to extend
 * @api public
 */

function Parser (stream) {
  var isTransform = stream && 'function' == typeof stream._transform;
  var isWritable = stream && 'function' == typeof stream._write;

  if (!isTransform && !isWritable) throw new Error('must pass a Writable or Transform stream in');
  debug('extending Parser into stream');

  // Transform streams and Writable streams get `_bytes()` and `_skipBytes()`
  stream._bytes = _bytes;
  stream._skipBytes = _skipBytes;

  // only Transform streams get the `_passthrough()` function
  if (isTransform) stream._passthrough = _passthrough;

  // take control of the streams2 callback functions for this stream
  if (isTransform) {
    stream._transform = transform;
  } else {
    stream._write = write;
  }
}

function init (stream) {
  debug('initializing parser stream');

  // number of bytes left to parser for the next "chunk"
  stream._parserBytesLeft = 0;

  // array of Buffer instances that make up the next "chunk"
  stream._parserBuffers = [];

  // number of bytes parsed so far for the next "chunk"
  stream._parserBuffered = 0;

  // flag that keeps track of if what the parser should do with bytes received
  stream._parserState = INIT;

  // the callback for the next "chunk"
  stream._parserCallback = null;

  // XXX: backwards compat with the old Transform API... remove at some point..
  if ('function' == typeof stream.push) {
    stream._parserOutput = stream.push.bind(stream);
  }

  stream._parserInit = true;
}

/**
 * Buffers `n` bytes and then invokes `fn` once that amount has been collected.
 *
 * @param {Number} n the number of bytes to buffer
 * @param {Function} fn callback function to invoke when `n` bytes are buffered
 * @api public
 */

function _bytes (n, fn) {
  assert(!this._parserCallback, 'there is already a "callback" set!');
  assert(isFinite(n) && n > 0, 'can only buffer a finite number of bytes > 0, got "' + n + '"');
  if (!this._parserInit) init(this);
  debug('buffering %o bytes', n);
  this._parserBytesLeft = n;
  this._parserCallback = fn;
  this._parserState = BUFFERING;
}

/**
 * Skips over the next `n` bytes, then invokes `fn` once that amount has
 * been discarded.
 *
 * @param {Number} n the number of bytes to discard
 * @param {Function} fn callback function to invoke when `n` bytes have been skipped
 * @api public
 */

function _skipBytes (n, fn) {
  assert(!this._parserCallback, 'there is already a "callback" set!');
  assert(n > 0, 'can only skip > 0 bytes, got "' + n + '"');
  if (!this._parserInit) init(this);
  debug('skipping %o bytes', n);
  this._parserBytesLeft = n;
  this._parserCallback = fn;
  this._parserState = SKIPPING;
}

/**
 * Passes through `n` bytes to the readable side of this stream untouched,
 * then invokes `fn` once that amount has been passed through.
 *
 * @param {Number} n the number of bytes to pass through
 * @param {Function} fn callback function to invoke when `n` bytes have passed through
 * @api public
 */

function _passthrough (n, fn) {
  assert(!this._parserCallback, 'There is already a "callback" set!');
  assert(n > 0, 'can only pass through > 0 bytes, got "' + n + '"');
  if (!this._parserInit) init(this);
  debug('passing through %o bytes', n);
  this._parserBytesLeft = n;
  this._parserCallback = fn;
  this._parserState = PASSTHROUGH;
}

/**
 * The `_write()` callback function implementation.
 *
 * @api private
 */

function write (chunk, encoding, fn) {
  if (!this._parserInit) init(this);
  debug('write(%o bytes)', chunk.length);

  // XXX: old Writable stream API compat... remove at some point...
  if ('function' == typeof encoding) fn = encoding;

  data(this, chunk, null, fn);
}

/**
 * The `_transform()` callback function implementation.
 *
 * @api private
 */


function transform (chunk, output, fn) {
  if (!this._parserInit) init(this);
  debug('transform(%o bytes)', chunk.length);

  // XXX: old Transform stream API compat... remove at some point...
  if ('function' != typeof output) {
    output = this._parserOutput;
  }

  data(this, chunk, output, fn);
}

/**
 * The internal buffering/passthrough logic...
 *
 * This `_data` function get's "trampolined" to prevent stack overflows for tight
 * loops. This technique requires us to return a "thunk" function for any
 * synchronous action. Async stuff breaks the trampoline, but that's ok since it's
 * working with a new stack at that point anyway.
 *
 * @api private
 */

function _data (stream, chunk, output, fn) {
  if (stream._parserBytesLeft <= 0) {
    return fn(new Error('got data but not currently parsing anything'));
  }

  if (chunk.length <= stream._parserBytesLeft) {
    // small buffer fits within the "_parserBytesLeft" window
    return function () {
      return process(stream, chunk, output, fn);
    };
  } else {
    // large buffer needs to be sliced on "_parserBytesLeft" and processed
    return function () {
      var b = chunk.slice(0, stream._parserBytesLeft);
      return process(stream, b, output, function (err) {
        if (err) return fn(err);
        if (chunk.length > b.length) {
          return function () {
            return _data(stream, chunk.slice(b.length), output, fn);
          };
        }
      });
    };
  }
}

/**
 * The internal `process` function gets called by the `data` function when
 * something "interesting" happens. This function takes care of buffering the
 * bytes when buffering, passing through the bytes when doing that, and invoking
 * the user callback when the number of bytes has been reached.
 *
 * @api private
 */

function process (stream, chunk, output, fn) {
  stream._parserBytesLeft -= chunk.length;
  debug('%o bytes left for stream piece', stream._parserBytesLeft);

  if (stream._parserState === BUFFERING) {
    // buffer
    stream._parserBuffers.push(chunk);
    stream._parserBuffered += chunk.length;
  } else if (stream._parserState === PASSTHROUGH) {
    // passthrough
    output(chunk);
  }
  // don't need to do anything for the SKIPPING case

  if (0 === stream._parserBytesLeft) {
    // done with stream "piece", invoke the callback
    var cb = stream._parserCallback;
    if (cb && stream._parserState === BUFFERING && stream._parserBuffers.length > 1) {
      chunk = Buffer.concat(stream._parserBuffers, stream._parserBuffered);
    }
    if (stream._parserState !== BUFFERING) {
      chunk = null;
    }
    stream._parserCallback = null;
    stream._parserBuffered = 0;
    stream._parserState = INIT;
    stream._parserBuffers.splice(0); // empty

    if (cb) {
      var args = [];
      if (chunk) {
        // buffered
        args.push(chunk);
      } else {
        // passthrough
      }
      if (output) {
        // on a Transform stream, has "output" function
        args.push(output);
      }
      var async = cb.length > args.length;
      if (async) {
        args.push(trampoline(fn));
      }
      // invoke cb
      var rtn = cb.apply(stream, args);
      if (!async || fn === rtn) return fn;
    }
  } else {
    // need more bytes
    return fn;
  }
}

var data = trampoline(_data);

/**
 * Generic thunk-based "trampoline" helper function.
 *
 * @param {Function} input function
 * @return {Function} "trampolined" function
 * @api private
 */

function trampoline (fn) {
  return function () {
    var result = fn.apply(this, arguments);

    while ('function' == typeof result) {
      result = result();
    }

    return result;
  };
}

}).call(this,require('_process'),require("buffer").Buffer)
},{"_process":17,"assert":1,"buffer":8,"debug":158}],158:[function(require,module,exports){
(function (process){
/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // NB: In an Electron preload script, document will be defined but not fully
  // initialized. Since we know we're in Chrome, we'll just detect this case
  // explicitly
  if (typeof window !== 'undefined' && window.process && window.process.type === 'renderer') {
    return true;
  }

  // is webkit? http://stackoverflow.com/a/16459606/376773
  // document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
  return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    // double check webkit in userAgent just in case we are in a worker
    (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  try {
    return JSON.stringify(v);
  } catch (err) {
    return '[UnexpectedJSONParseError]: ' + err.message;
  }
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs(args) {
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return;

  var c = 'color: ' + this.color;
  args.splice(1, 0, c, 'color: inherit')

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}

  // If debug isn't set in LS, and we're in Electron, try to load $DEBUG
  if (!r && typeof process !== 'undefined' && 'env' in process) {
    r = process.env.DEBUG;
  }

  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage() {
  try {
    return window.localStorage;
  } catch (e) {}
}

}).call(this,require('_process'))
},{"./debug":159,"_process":17}],159:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = createDebug.debug = createDebug['default'] = createDebug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
 */

exports.formatters = {};

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 * @param {String} namespace
 * @return {Number}
 * @api private
 */

function selectColor(namespace) {
  var hash = 0, i;

  for (i in namespace) {
    hash  = ((hash << 5) - hash) + namespace.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }

  return exports.colors[Math.abs(hash) % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function createDebug(namespace) {

  function debug() {
    // disabled?
    if (!debug.enabled) return;

    var self = debug;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // turn the `arguments` into a proper Array
    var args = new Array(arguments.length);
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i];
    }

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %O
      args.unshift('%O');
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-zA-Z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    // apply env-specific formatting (colors, etc.)
    exports.formatArgs.call(self, args);

    var logFn = debug.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }

  debug.namespace = namespace;
  debug.enabled = exports.enabled(namespace);
  debug.useColors = exports.useColors();
  debug.color = selectColor(namespace);

  // env-specific initialization logic for debug instances
  if ('function' === typeof exports.init) {
    exports.init(debug);
  }

  return debug;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  exports.names = [];
  exports.skips = [];

  var split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":140}],160:[function(require,module,exports){
module.exports = shift

function shift (stream) {
  var rs = stream._readableState
  if (!rs) return null
  return (rs.objectMode || typeof stream._duplexState === 'number') ? stream.read() : stream.read(getStateLength(rs))
}

function getStateLength (state) {
  if (state.buffer.length) {
    // Since node 6.3.0 state.buffer is a BufferList not an array
    if (state.buffer.head) {
      return state.buffer.head.data.length
    }

    return state.buffer[0].length
  }

  return state.length
}

},{}],161:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"dup":32,"safe-buffer":154}],162:[function(require,module,exports){
(function (process){
var Transform = require('readable-stream').Transform
  , inherits  = require('util').inherits
  , xtend     = require('xtend')

function DestroyableTransform(opts) {
  Transform.call(this, opts)
  this._destroyed = false
}

inherits(DestroyableTransform, Transform)

DestroyableTransform.prototype.destroy = function(err) {
  if (this._destroyed) return
  this._destroyed = true
  
  var self = this
  process.nextTick(function() {
    if (err)
      self.emit('error', err)
    self.emit('close')
  })
}

// a noop _transform function
function noop (chunk, enc, callback) {
  callback(null, chunk)
}


// create a new export function, used by both the main export and
// the .ctor export, contains common logic for dealing with arguments
function through2 (construct) {
  return function (options, transform, flush) {
    if (typeof options == 'function') {
      flush     = transform
      transform = options
      options   = {}
    }

    if (typeof transform != 'function')
      transform = noop

    if (typeof flush != 'function')
      flush = null

    return construct(options, transform, flush)
  }
}


// main export, just make me a transform stream!
module.exports = through2(function (options, transform, flush) {
  var t2 = new DestroyableTransform(options)

  t2._transform = transform

  if (flush)
    t2._flush = flush

  return t2
})


// make me a reusable prototype that I can `new`, or implicitly `new`
// with a constructor call
module.exports.ctor = through2(function (options, transform, flush) {
  function Through2 (override) {
    if (!(this instanceof Through2))
      return new Through2(override)

    this.options = xtend(options, override)

    DestroyableTransform.call(this, this.options)
  }

  inherits(Through2, DestroyableTransform)

  Through2.prototype._transform = transform

  if (flush)
    Through2.prototype._flush = flush

  return Through2
})


module.exports.obj = through2(function (options, transform, flush) {
  var t2 = new DestroyableTransform(xtend({ objectMode: true, highWaterMark: 16 }, options))

  t2._transform = transform

  if (flush)
    t2._flush = flush

  return t2
})

}).call(this,require('_process'))
},{"_process":17,"readable-stream":152,"util":44,"xtend":202}],163:[function(require,module,exports){
"use strict";

var isPrototype = require("../prototype/is");

module.exports = function (value) {
	if (typeof value !== "function") return false;

	if (!hasOwnProperty.call(value, "length")) return false;

	try {
		if (typeof value.length !== "number") return false;
		if (typeof value.call !== "function") return false;
		if (typeof value.apply !== "function") return false;
	} catch (error) {
		return false;
	}

	return !isPrototype(value);
};

},{"../prototype/is":170}],164:[function(require,module,exports){
"use strict";

var isValue       = require("../value/is")
  , isObject      = require("../object/is")
  , stringCoerce  = require("../string/coerce")
  , toShortString = require("./to-short-string");

var resolveMessage = function (message, value) {
	return message.replace("%v", toShortString(value));
};

module.exports = function (value, defaultMessage, inputOptions) {
	if (!isObject(inputOptions)) throw new TypeError(resolveMessage(defaultMessage, value));
	if (!isValue(value)) {
		if ("default" in inputOptions) return inputOptions["default"];
		if (inputOptions.isOptional) return null;
	}
	var errorMessage = stringCoerce(inputOptions.errorMessage);
	if (!isValue(errorMessage)) errorMessage = defaultMessage;
	throw new TypeError(resolveMessage(errorMessage, value));
};

},{"../object/is":167,"../string/coerce":171,"../value/is":173,"./to-short-string":166}],165:[function(require,module,exports){
"use strict";

module.exports = function (value) {
	try {
		return value.toString();
	} catch (error) {
		try { return String(value); }
		catch (error2) { return null; }
	}
};

},{}],166:[function(require,module,exports){
"use strict";

var safeToString = require("./safe-to-string");

var reNewLine = /[\n\r\u2028\u2029]/g;

module.exports = function (value) {
	var string = safeToString(value);
	if (string === null) return "<Non-coercible to string value>";
	// Trim if too long
	if (string.length > 100) string = string.slice(0, 99) + "…";
	// Replace eventual new lines
	string = string.replace(reNewLine, function (char) {
		switch (char) {
			case "\n":
				return "\\n";
			case "\r":
				return "\\r";
			case "\u2028":
				return "\\u2028";
			case "\u2029":
				return "\\u2029";
			/* istanbul ignore next */
			default:
				throw new Error("Unexpected character");
		}
	});
	return string;
};

},{"./safe-to-string":165}],167:[function(require,module,exports){
"use strict";

var isValue = require("../value/is");

// prettier-ignore
var possibleTypes = { "object": true, "function": true, "undefined": true /* document.all */ };

module.exports = function (value) {
	if (!isValue(value)) return false;
	return hasOwnProperty.call(possibleTypes, typeof value);
};

},{"../value/is":173}],168:[function(require,module,exports){
"use strict";

var resolveException = require("../lib/resolve-exception")
  , is               = require("./is");

module.exports = function (value/*, options*/) {
	if (is(value)) return value;
	return resolveException(value, "%v is not a plain function", arguments[1]);
};

},{"../lib/resolve-exception":164,"./is":169}],169:[function(require,module,exports){
"use strict";

var isFunction = require("../function/is");

var classRe = /^\s*class[\s{/}]/, functionToString = Function.prototype.toString;

module.exports = function (value) {
	if (!isFunction(value)) return false;
	if (classRe.test(functionToString.call(value))) return false;
	return true;
};

},{"../function/is":163}],170:[function(require,module,exports){
"use strict";

var isObject = require("../object/is");

module.exports = function (value) {
	if (!isObject(value)) return false;
	try {
		if (!value.constructor) return false;
		return value.constructor.prototype === value;
	} catch (error) {
		return false;
	}
};

},{"../object/is":167}],171:[function(require,module,exports){
"use strict";

var isValue  = require("../value/is")
  , isObject = require("../object/is");

var objectToString = Object.prototype.toString;

module.exports = function (value) {
	if (!isValue(value)) return null;
	if (isObject(value)) {
		// Reject Object.prototype.toString coercion
		var valueToString = value.toString;
		if (typeof valueToString !== "function") return null;
		if (valueToString === objectToString) return null;
		// Note: It can be object coming from other realm, still as there's no ES3 and CSP compliant
		// way to resolve its realm's Object.prototype.toString it's left as not addressed edge case
	}
	try {
		return "" + value; // Ensure implicit coercion
	} catch (error) {
		return null;
	}
};

},{"../object/is":167,"../value/is":173}],172:[function(require,module,exports){
"use strict";

var resolveException = require("../lib/resolve-exception")
  , is               = require("./is");

module.exports = function (value/*, options*/) {
	if (is(value)) return value;
	return resolveException(value, "Cannot use %v", arguments[1]);
};

},{"../lib/resolve-exception":164,"./is":173}],173:[function(require,module,exports){
"use strict";

// ES3 safe
var _undefined = void 0;

module.exports = function (value) { return value !== _undefined && value !== null; };

},{}],174:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41}],175:[function(require,module,exports){

/**
 * References:
 *  - http://tools.ietf.org/html/rfc2361
 *  - http://www.sonicspot.com/guide/wavefiles.html
 *  - https://ccrma.stanford.edu/courses/422/projects/WaveFormat/
 *  - http://www-mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html
 *  - http://www.blitter.com/~russtopia/MIDI/~jglatt/tech/wave.htm
 */

/**
 * The `Reader` class accepts a WAVE audio file, emits a "format" event, and
 * outputs the raw "data" from the WAVE file (usually raw PCM data, but if the
 * WAVE file uses compression then the compressed data will be output, you are
 * responsible for uncompressing in that case if necessary).
 */

exports.Reader = require('./lib/reader');

/**
 * The `Writer` class outputs a valid WAVE file from the audio data written to
 * it. You may set any of the "channels", "sampleRate" or "bitsPerSample"
 * properties before writing the first chunk. You may also set the "dataLength" to
 * the number of bytes expected in the "data" portion of the WAVE file. If
 * "dataLength" is not set, then the maximum valid length for a WAVE file is
 * written.
 */

exports.Writer = require('./lib/writer');

/**
 * The `FileWriter` is a subclass of `Writer` that automatically takes care of
 * writing the "header" event at the end of the stream to the beginning of the
 * output file.
 */

exports.FileWriter = require('./lib/file-writer');

},{"./lib/file-writer":176,"./lib/reader":177,"./lib/writer":178}],176:[function(require,module,exports){

/**
 * Module dependencies.
 */

var fs = require('fs');
var Writer = require('./writer');
var inherits = require('util').inherits;

/**
 * Module exports.
 */

module.exports = FileWriter;

/**
 * The `FileWriter` class.
 *
 * @param {String} path The file path to write the WAVE file to
 * @param {Object} opts Object contains options for the stream and format info
 * @api public
 */

function FileWriter (path, opts) {
  if (!(this instanceof FileWriter)) return new FileWriter(path, opts);
  Writer.call(this, opts);
  this.path = path;
  this.file = fs.createWriteStream(path, opts);
  this.pipe(this.file);
  this.on('header', this._onHeader);
}
inherits(FileWriter, Writer);

/**
 * Writes the updated WAVE header to the beginning of the file.
 * Emits a "done" event when everything is all good.
 *
 * @api private
 */

FileWriter.prototype._onHeader = function (header) {
  var self = this;
  var fd;

  function onOpen (err, f) {
    if (err) return self.emit('error', err);
    fd = f;
    fs.write(fd, header, 0, header.length, 0, onWrite);
  }

  function onWrite (err, bytesWritten) {
    if (err) return self.emit('error', err);
    if (bytesWritten !== header.length) {
      return self.emit('error', new Error('problem writing "header" data'));
    }
    fs.close(fd, onClose);
  }

  function onClose (err) {
    if (err) return self.emit('error', err);
    self.emit('done');
  }

  fs.open(self.path, 'r+', onOpen);
};

},{"./writer":178,"fs":7,"util":44}],177:[function(require,module,exports){

/**
 * Module dependencies.
 */

var util = require('util');
var Parser = require('stream-parser');
var Transform = require('readable-stream/transform');
var debug = require('debug')('wave:reader');
var inherits = util.inherits;
var f = util.format;

/**
 * Values for the `audioFormat` byte.
 */

var formats = {
  WAVE_FORMAT_UNKNOWN: 0x0000, // Microsoft Unknown Wave Format
  WAVE_FORMAT_PCM: 0x0001, // Microsoft PCM Format
  WAVE_FORMAT_ADPCM: 0x0002, // Microsoft ADPCM Format
  WAVE_FORMAT_IEEE_FLOAT: 0x0003, // IEEE float
  WAVE_FORMAT_VSELP: 0x0004, // Compaq Computer's VSELP
  WAVE_FORMAT_IBM_CVSD: 0x0005, // IBM CVSD
  WAVE_FORMAT_ALAW: 0x0006, // 8-bit ITU-T G.711 A-law
  WAVE_FORMAT_MULAW: 0x0007, // 8-bit ITU-T G.711 µ-law
  WAVE_FORMAT_EXTENSIBLE: 0xFFFE // Determined by SubFormat
};

/**
 * Module exports.
 */

module.exports = Reader;

/**
 * The `Reader` class accepts a WAV audio file written to it and outputs the raw
 * audio data with the WAV header stripped (most of the time, PCM audio data will
 * be output, depending on the `audioFormat` property).
 *
 * A `"format"` event gets emitted after the WAV header has been parsed.
 *
 * @param {Object} opts optional options object
 * @api public
 */

function Reader (opts) {
  if (!(this instanceof Reader)) {
    return new Reader(opts);
  }
  Transform.call(this, opts);

  this._bytes(4, this._onRiffID);
}
inherits(Reader, Transform);

/**
 * Mixin `Parser`.
 */

Parser(Reader.prototype);

// the beginning of the WAV file
Reader.prototype._onRiffID = function (chunk) {
  debug('onRiffID: %o', chunk);
  var id = this.riffId = chunk.toString('ascii');
  if (id === 'RIFF') {
    debug('detected little-endian WAVE file');
    this.endianness = 'LE';
    this._bytes(4, this._onChunkSize);
  } else if (id === 'RIFX') {
    debug('detected big-endian WAVE file');
    this.endianness = 'BE';
    this._bytes(4, this._onChunkSize);
  } else {
    this.emit('error', new Error(f('bad "chunk id": expected "RIFF" or "RIFX", got %j', id)));
  }
};

// size of the WAV
Reader.prototype._onChunkSize = function (chunk) {
  debug('onChunkSize: %o', chunk);
  this.chunkSize = chunk['readUInt32' + this.endianness](0);
  this._bytes(4, this._onFormat);
};

// the RIFF "format", should always be "WAVE"
Reader.prototype._onFormat = function (chunk) {
  debug('onFormat: %o', chunk);
  this.waveId = chunk.toString('ascii');
  if (this.waveId === 'WAVE') {
    this._bytes(4, this._onSubchunk1ID);
  } else {
    this.emit('error', new Error(f('bad "format": expected "WAVE", got %j', this.waveId)));
  }
};

// size of the "subchunk1" (the header)
Reader.prototype._onSubchunk1ID = function (chunk) {
  debug('onSubchunk1ID: %o', chunk);
  var subchunk1ID = chunk.toString('ascii');
  this.chunkId = subchunk1ID;
  if (subchunk1ID === 'fmt ') {
    this._bytes(4, this._onSubchunk1Size);
  } else {
    this.emit('error', new Error(f('bad "fmt id": expected "fmt ", got %j', subchunk1ID)));
  }
};

Reader.prototype._onSubchunk1Size = function (chunk) {
  debug('onSubchunk1Size: %o', chunk);
  this.subchunk1Size = chunk['readUInt32' + this.endianness](0);
  // TODO: assert should be 16 for PCM
  this._bytes(this.subchunk1Size, this._onSubchunk1);
};

Reader.prototype._onSubchunk1 = function (chunk) {
  debug('onSubchunk1: %o', chunk);
  this.audioFormat = chunk['readUInt16' + this.endianness](0);
  this.channels = chunk['readUInt16' + this.endianness](2);
  this.sampleRate = chunk['readUInt32' + this.endianness](4);
  this.byteRate = chunk['readUInt32' + this.endianness](8); // useless...
  this.blockAlign = chunk['readUInt16' + this.endianness](12); // useless...
  this.bitDepth = chunk['readUInt16' + this.endianness](14);
  this.signed = this.bitDepth !== 8;

  var format = {
    audioFormat: this.audioFormat,
    endianness: this.endianness,
    channels: this.channels,
    sampleRate: this.sampleRate,
    byteRate: this.byteRate,
    blockAlign: this.blockAlign,
    bitDepth: this.bitDepth,
    signed: this.signed
  };

  switch (format.audioFormat) {
    case formats.WAVE_FORMAT_PCM:
      // default, common case. don't need to do anything.
      break;
    case formats.WAVE_FORMAT_IEEE_FLOAT:
      format.float = true;
      break;
    case formats.WAVE_FORMAT_ALAW:
      format.alaw = true;
      break;
    case formats.WAVE_FORMAT_MULAW:
      format.ulaw = true;
      break;
  }

  this.emit('format', format);

  this._bytes(4, this._onSubchunk2ID);
};

Reader.prototype._onSubchunk2ID = function (chunk) {
  debug('onSubchunk2ID: %o', chunk);
  var subchunk2ID = chunk.toString('ascii');

  if (subchunk2ID === 'data') {
    // Data Chunk - "data"
    this._bytes(4, this._onDataChunkSize);
  } else if (subchunk2ID === 'fact') {
    // Fact Chunk - "fact"
    this._bytes(4, this._onFactChunkSize);
  } else {
    // Unknown Chunk - parse it an emit a "chunk" event
    debug('parsing unknown %o chunk', subchunk2ID);
    this.unknownID = subchunk2ID;
    this._bytes(4, this._onUnknownChunkSize);
  }
};

// size of the remaining data in this WAV file
Reader.prototype._onDataChunkSize = function (chunk) {
  debug('onDataChunkSize: %o', chunk);
  var chunkSize = chunk['readUInt32' + this.endianness](0);

  if (chunkSize === 0) {
    // Some encoders write `0` for the byte length here in the case of a WAV file
    // being generated on-the-fly. In that case, we're just gonna passthrough the
    // remaining bytes assuming they're going to be audio data.
    chunkSize = Infinity;
  }

  this._passthrough(chunkSize, this._onDataChunkDone);
};

Reader.prototype._onDataChunkDone = function () {
  debug('onFactChunkDone');
  // now we're done with the "data" chunk so read a new "chunk ID" to figure out
  // what's next
  this._bytes(4, this._onSubchunk2ID);
};

Reader.prototype._onFactChunkSize = function (chunk) {
  debug('onFactChunkSize: %o', chunk);
  var chunkDataSize = chunk['readUInt32' + this.endianness](0);
  this._bytes(chunkDataSize, this._onFactChunkData);
};

Reader.prototype._onFactChunkData = function (chunk) {
  debug('onFactChunkData: %o', chunk);
  // There is currently only one field defined for the format dependant data.
  // It is a single 4-byte value that specifies the number of samples in the
  // waveform data chunk.
  //
  // The number of samples field is redundant for sampled data, since the Data
  // chunk indicates the length of the data. The number of samples can be
  // determined from the length of the data and the container size as determined
  // from the Format chunk.
  var numSamples = chunk['readUInt32' + this.endianness](0);
  debug('number of samples: %o', numSamples);
  this.numSamples = numSamples;

  // now we're done with the "fact" chunk so read a new "chunk ID" to figure out
  // what's next
  this._bytes(4, this._onSubchunk2ID);
};

Reader.prototype._onUnknownChunkSize = function (chunk) {
  debug('onUnknownChunkSize: %o', chunk);
  var chunkSize = chunk['readUInt32' + this.endianness](0);
  this._bytes(chunkSize, this._onUnknownChunkData);
};

Reader.prototype._onUnknownChunkData = function (chunk) {
  debug('onUnknownChunkData: %o', chunk);

  this.emit('chunk', {
    id: this.unknownID,
    data: chunk
  });

  // now we're done with the "unknown" chunk so read a new "chunk ID" to figure
  // out what's next
  this._bytes(4, this._onSubchunk2ID);
};

},{"debug":179,"readable-stream/transform":186,"stream-parser":157,"util":44}],178:[function(require,module,exports){
(function (process){

/**
 * Module dependencies.
 */

var inherits = require('util').inherits;
var Transform = require('readable-stream/transform');
var debug = require('debug')('wave:writer');
var bufferAlloc = require('buffer-alloc');
var bufferFrom = require('buffer-from');

/**
 * Module exports.
 */

module.exports = Writer;

/**
 * RIFF Chunk IDs in Buffers.
 *
 * @api private
 */

var RIFF = bufferFrom('RIFF');
var WAVE = bufferFrom('WAVE');
var fmt = bufferFrom('fmt ');
var data = bufferFrom('data');

/**
 * The max size of the "data" chunk of a WAVE file. This is the max unsigned
 * 32-bit int value, minus 100 bytes (overkill, 44 would be safe) for the header.
 *
 * @api private
 */

var MAX_WAV = 4294967295 - 100;

/**
 * The `Writer` class accepts raw audio data written to it (only PCM audio data is
 * currently supported), and outputs a WAV file with a valid WAVE header at the
 * beginning specifying the formatting information of the audio stream.
 *
 * Note that there's an interesting problem, because the WAVE header also
 * specifies the total byte length of the audio data in the file, and there's no
 * way that we can know this ahead of time. Therefore the WAVE header will contain
 * a byte-length if `0` initially, which most WAVE decoders will know means to
 * just read until `EOF`.
 *
 * Optionally, if you are in a situation where you can seek back to the beginning
 * of the destination of the WAVE file (like writing to a regular file, for
 * example), then you may listen for the `"header"` event which will be emitted
 * _after_ all the data has been written, and you can go back and rewrite the new
 * header with proper audio byte length into the beginning of the destination
 * (though if your destination _is_ a regular file, you should use the the
 * `FileWriter` class instead).
 *
 * @param {Object} opts optional options object
 * @api public
 */

function Writer (opts) {
  if (!(this instanceof Writer)) {
    return new Writer(opts);
  }
  Transform.call(this, opts);

  // TODO: allow/properly handle other WAVE audio formats
  this.endianness = 'LE';
  this.format = 1; // raw PCM
  this.channels = 2;
  this.sampleRate = 44100;
  this.bitDepth = 16;
  this.bytesProcessed = 0;

  if (opts) {
    if (opts.format != null) this.format = opts.format;
    if (opts.channels != null) this.channels = opts.channels;
    if (opts.sampleRate != null) this.sampleRate = opts.sampleRate;
    if (opts.bitDepth != null) this.bitDepth = opts.bitDepth;
  }

  this._writeHeader();
}
inherits(Writer, Transform);

/**
 * Writes the WAVE header.
 *
 * @api private
 */

Writer.prototype._writeHeader = function () {
  debug('_writeHeader()');

  // TODO: 44 is only for format 1 (PCM), any other
  // format will have a variable size...
  var headerLength = 44;

  var dataLength = this.dataLength;
  if (dataLength == null) {
    debug('using default "dataLength" of %d', MAX_WAV);
    dataLength = MAX_WAV;
  }
  var fileSize = dataLength + headerLength;
  var header = bufferAlloc(headerLength);
  var offset = 0;

  // write the "RIFF" identifier
  RIFF.copy(header, offset);
  offset += RIFF.length;

  // write the file size minus the identifier and this 32-bit int
  header['writeUInt32' + this.endianness](fileSize - 8, offset);
  offset += 4;

  // write the "WAVE" identifier
  WAVE.copy(header, offset);
  offset += WAVE.length;

  // write the "fmt " sub-chunk identifier
  fmt.copy(header, offset);
  offset += fmt.length;

  // write the size of the "fmt " chunk
  // XXX: value of 16 is hard-coded for raw PCM format. other formats have
  // different size.
  header['writeUInt32' + this.endianness](16, offset);
  offset += 4;

  // write the audio format code
  header['writeUInt16' + this.endianness](this.format, offset);
  offset += 2;

  // write the number of channels
  header['writeUInt16' + this.endianness](this.channels, offset);
  offset += 2;

  // write the sample rate
  header['writeUInt32' + this.endianness](this.sampleRate, offset);
  offset += 4;

  // write the byte rate
  var byteRate = this.byteRate;
  if (byteRate == null) {
    byteRate = this.sampleRate * this.channels * this.bitDepth / 8;
  }
  header['writeUInt32' + this.endianness](byteRate, offset);
  offset += 4;

  // write the block align
  var blockAlign = this.blockAlign;
  if (blockAlign == null) {
    blockAlign = this.channels * this.bitDepth / 8;
  }
  header['writeUInt16' + this.endianness](blockAlign, offset);
  offset += 2;

  // write the bits per sample
  header['writeUInt16' + this.endianness](this.bitDepth, offset);
  offset += 2;

  // write the "data" sub-chunk ID
  data.copy(header, offset);
  offset += data.length;

  // write the remaining length of the rest of the data
  header['writeUInt32' + this.endianness](dataLength, offset);
  offset += 4;

  // save the "header" Buffer for the end, we emit the "header" event at the end
  // with the "size" values properly filled out. if this stream is being piped to
  // a file (or anything else seekable), then this correct header should be placed
  // at the very beginning of the file.
  this._header = header;
  this.headerLength = headerLength;

  this.push(header);
};

/**
 * Called for the "end" event of this Writer instance.
 *
 * @api private
 */

Writer.prototype._onEnd = function (write) {
  debug('_onEnd()');
};

/**
 * Transform incoming data. We don't do anything special, just pass it through.
 *
 * @api private
 */

Writer.prototype._transform = function (chunk, enc, done) {
  this.push(chunk);
  this.bytesProcessed += chunk.length;
  done();
};

/**
 * Emits a "header" event after the readable side of the stream has finished.
 *
 * @api private
 */

Writer.prototype._flush = function (done) {
  debug('_flush()');
  done();
  this.dataLength = this.bytesProcessed;
  process.nextTick(this._emitHeader.bind(this));
};

/**
 * Emits the "header" event. This can safely be ignored, or if you are writing
 * this WAVE file to somewhere that is seekable (i.e. the filesystem), then you
 * should write this "header" buffer at the beginning of the file to get the
 * correct file size values in the file. This isn't too important since most audio
 * players look at the file size rather than those byte values in the header, but
 * it's good to when when possible.
 *
 * @api private
 */

Writer.prototype._emitHeader = function () {
  debug('_emitHeader()');
  var dataLength = this.dataLength;
  var headerLength = this.headerLength;
  var header = this._header;

  // write the file length at the beginning of the header
  header['writeUInt32' + this.endianness](dataLength + headerLength - 8, 4);

  // write the data length at the end of the header
  header['writeUInt32' + this.endianness](dataLength, headerLength - 4);

  this.emit('header', header);
};

}).call(this,require('_process'))
},{"_process":17,"buffer-alloc":48,"buffer-from":50,"debug":179,"readable-stream/transform":186,"util":44}],179:[function(require,module,exports){
arguments[4][158][0].apply(exports,arguments)
},{"./debug":180,"_process":17,"dup":158}],180:[function(require,module,exports){
arguments[4][159][0].apply(exports,arguments)
},{"dup":159,"ms":140}],181:[function(require,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],182:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

module.exports = Duplex;

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}
/*</replacement>*/


/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

forEach(objectKeys(Writable.prototype), function(method) {
  if (!Duplex.prototype[method])
    Duplex.prototype[method] = Writable.prototype[method];
});

function Duplex(options) {
  if (!(this instanceof Duplex))
    return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false)
    this.readable = false;

  if (options && options.writable === false)
    this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false)
    this.allowHalfOpen = false;

  this.once('end', onend);
}

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended)
    return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  process.nextTick(this.end.bind(this));
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

}).call(this,require('_process'))
},{"./_stream_readable":183,"./_stream_writable":185,"_process":17,"core-util-is":51,"inherits":123}],183:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = Readable;

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/


/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Readable.ReadableState = ReadableState;

var EE = require('events').EventEmitter;

/*<replacement>*/
if (!EE.listenerCount) EE.listenerCount = function(emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

var Stream = require('stream');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var StringDecoder;


/*<replacement>*/
var debug = require('util');
if (debug && debug.debuglog) {
  debug = debug.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/


util.inherits(Readable, Stream);

function ReadableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.buffer = [];
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;


  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.readableObjectMode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // when piping, we only care about 'readable' events that happen
  // after read()ing all the bytes and not getting any pushback.
  this.ranOut = false;

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder)
      StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  var Duplex = require('./_stream_duplex');

  if (!(this instanceof Readable))
    return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  Stream.call(this);
}

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function(chunk, encoding) {
  var state = this._readableState;

  if (util.isString(chunk) && !state.objectMode) {
    encoding = encoding || state.defaultEncoding;
    if (encoding !== state.encoding) {
      chunk = new Buffer(chunk, encoding);
      encoding = '';
    }
  }

  return readableAddChunk(this, state, chunk, encoding, false);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function(chunk) {
  var state = this._readableState;
  return readableAddChunk(this, state, chunk, '', true);
};

function readableAddChunk(stream, state, chunk, encoding, addToFront) {
  var er = chunkInvalid(state, chunk);
  if (er) {
    stream.emit('error', er);
  } else if (util.isNullOrUndefined(chunk)) {
    state.reading = false;
    if (!state.ended)
      onEofChunk(stream, state);
  } else if (state.objectMode || chunk && chunk.length > 0) {
    if (state.ended && !addToFront) {
      var e = new Error('stream.push() after EOF');
      stream.emit('error', e);
    } else if (state.endEmitted && addToFront) {
      var e = new Error('stream.unshift() after end event');
      stream.emit('error', e);
    } else {
      if (state.decoder && !addToFront && !encoding)
        chunk = state.decoder.write(chunk);

      if (!addToFront)
        state.reading = false;

      // if we want the data now, just emit it.
      if (state.flowing && state.length === 0 && !state.sync) {
        stream.emit('data', chunk);
        stream.read(0);
      } else {
        // update the buffer info.
        state.length += state.objectMode ? 1 : chunk.length;
        if (addToFront)
          state.buffer.unshift(chunk);
        else
          state.buffer.push(chunk);

        if (state.needReadable)
          emitReadable(stream);
      }

      maybeReadMore(stream, state);
    }
  } else if (!addToFront) {
    state.reading = false;
  }

  return needMoreData(state);
}



// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended &&
         (state.needReadable ||
          state.length < state.highWaterMark ||
          state.length === 0);
}

// backwards compatibility.
Readable.prototype.setEncoding = function(enc) {
  if (!StringDecoder)
    StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 128MB
var MAX_HWM = 0x800000;
function roundUpToNextPowerOf2(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2
    n--;
    for (var p = 1; p < 32; p <<= 1) n |= n >> p;
    n++;
  }
  return n;
}

function howMuchToRead(n, state) {
  if (state.length === 0 && state.ended)
    return 0;

  if (state.objectMode)
    return n === 0 ? 0 : 1;

  if (isNaN(n) || util.isNull(n)) {
    // only flow one buffer at a time
    if (state.flowing && state.buffer.length)
      return state.buffer[0].length;
    else
      return state.length;
  }

  if (n <= 0)
    return 0;

  // If we're asking for more than the target buffer level,
  // then raise the water mark.  Bump up to the next highest
  // power of 2, to prevent increasing it excessively in tiny
  // amounts.
  if (n > state.highWaterMark)
    state.highWaterMark = roundUpToNextPowerOf2(n);

  // don't have that much.  return null, unless we've ended.
  if (n > state.length) {
    if (!state.ended) {
      state.needReadable = true;
      return 0;
    } else
      return state.length;
  }

  return n;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function(n) {
  debug('read', n);
  var state = this._readableState;
  var nOrig = n;

  if (!util.isNumber(n) || n > 0)
    state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 &&
      state.needReadable &&
      (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended)
      endReadable(this);
    else
      emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0)
      endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  }

  if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0)
      state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
  }

  // If _read pushed data synchronously, then `reading` will be false,
  // and we need to re-evaluate how much data we can return to the user.
  if (doRead && !state.reading)
    n = howMuchToRead(nOrig, state);

  var ret;
  if (n > 0)
    ret = fromList(n, state);
  else
    ret = null;

  if (util.isNull(ret)) {
    state.needReadable = true;
    n = 0;
  }

  state.length -= n;

  // If we have nothing in the buffer, then we want to know
  // as soon as we *do* get something into the buffer.
  if (state.length === 0 && !state.ended)
    state.needReadable = true;

  // If we tried to read() past the EOF, then emit end on the next tick.
  if (nOrig !== n && state.ended && state.length === 0)
    endReadable(this);

  if (!util.isNull(ret))
    this.emit('data', ret);

  return ret;
};

function chunkInvalid(state, chunk) {
  var er = null;
  if (!util.isBuffer(chunk) &&
      !util.isString(chunk) &&
      !util.isNullOrUndefined(chunk) &&
      !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}


function onEofChunk(stream, state) {
  if (state.decoder && !state.ended) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync)
      process.nextTick(function() {
        emitReadable_(stream);
      });
    else
      emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}


// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    process.nextTick(function() {
      maybeReadMore_(stream, state);
    });
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended &&
         state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;
    else
      len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function(n) {
  this.emit('error', new Error('not implemented'));
};

Readable.prototype.pipe = function(dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) &&
              dest !== process.stdout &&
              dest !== process.stderr;

  var endFn = doEnd ? onend : cleanup;
  if (state.endEmitted)
    process.nextTick(endFn);
  else
    src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable) {
    debug('onunpipe');
    if (readable === src) {
      cleanup();
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', cleanup);
    src.removeListener('data', ondata);

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain &&
        (!dest._writableState || dest._writableState.needDrain))
      ondrain();
  }

  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    var ret = dest.write(chunk);
    if (false === ret) {
      debug('false write response, pause',
            src._readableState.awaitDrain);
      src._readableState.awaitDrain++;
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EE.listenerCount(dest, 'error') === 0)
      dest.emit('error', er);
  }
  // This is a brutally ugly hack to make sure that our error handler
  // is attached before any userland ones.  NEVER DO THIS.
  if (!dest._events || !dest._events.error)
    dest.on('error', onerror);
  else if (isArray(dest._events.error))
    dest._events.error.unshift(onerror);
  else
    dest._events.error = [onerror, dest._events.error];



  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function() {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain)
      state.awaitDrain--;
    if (state.awaitDrain === 0 && EE.listenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}


Readable.prototype.unpipe = function(dest) {
  var state = this._readableState;

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0)
    return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes)
      return this;

    if (!dest)
      dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest)
      dest.emit('unpipe', this);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++)
      dests[i].emit('unpipe', this);
    return this;
  }

  // try to find the right one.
  var i = indexOf(state.pipes, dest);
  if (i === -1)
    return this;

  state.pipes.splice(i, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1)
    state.pipes = state.pipes[0];

  dest.emit('unpipe', this);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function(ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  // If listening to data, and it has not explicitly been paused,
  // then call resume to start the flow of data on the next tick.
  if (ev === 'data' && false !== this._readableState.flowing) {
    this.resume();
  }

  if (ev === 'readable' && this.readable) {
    var state = this._readableState;
    if (!state.readableListening) {
      state.readableListening = true;
      state.emittedReadable = false;
      state.needReadable = true;
      if (!state.reading) {
        var self = this;
        process.nextTick(function() {
          debug('readable nexttick read 0');
          self.read(0);
        });
      } else if (state.length) {
        emitReadable(this, state);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function() {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    if (!state.reading) {
      debug('resume read 0');
      this.read(0);
    }
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    process.nextTick(function() {
      resume_(stream, state);
    });
  }
}

function resume_(stream, state) {
  state.resumeScheduled = false;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading)
    stream.read(0);
}

Readable.prototype.pause = function() {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  if (state.flowing) {
    do {
      var chunk = stream.read();
    } while (null !== chunk && state.flowing);
  }
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function(stream) {
  var state = this._readableState;
  var paused = false;

  var self = this;
  stream.on('end', function() {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length)
        self.push(chunk);
    }

    self.push(null);
  });

  stream.on('data', function(chunk) {
    debug('wrapped data');
    if (state.decoder)
      chunk = state.decoder.write(chunk);
    if (!chunk || !state.objectMode && !chunk.length)
      return;

    var ret = self.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (util.isFunction(stream[i]) && util.isUndefined(this[i])) {
      this[i] = function(method) { return function() {
        return stream[method].apply(stream, arguments);
      }}(i);
    }
  }

  // proxy certain important events.
  var events = ['error', 'close', 'destroy', 'pause', 'resume'];
  forEach(events, function(ev) {
    stream.on(ev, self.emit.bind(self, ev));
  });

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  self._read = function(n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return self;
};



// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
function fromList(n, state) {
  var list = state.buffer;
  var length = state.length;
  var stringMode = !!state.decoder;
  var objectMode = !!state.objectMode;
  var ret;

  // nothing in the list, definitely empty.
  if (list.length === 0)
    return null;

  if (length === 0)
    ret = null;
  else if (objectMode)
    ret = list.shift();
  else if (!n || n >= length) {
    // read it all, truncate the array.
    if (stringMode)
      ret = list.join('');
    else
      ret = Buffer.concat(list, length);
    list.length = 0;
  } else {
    // read just some of it.
    if (n < list[0].length) {
      // just take a part of the first list item.
      // slice is the same for buffers and strings.
      var buf = list[0];
      ret = buf.slice(0, n);
      list[0] = buf.slice(n);
    } else if (n === list[0].length) {
      // first list is a perfect match
      ret = list.shift();
    } else {
      // complex case.
      // we have enough to cover it, but it spans past the first buffer.
      if (stringMode)
        ret = '';
      else
        ret = new Buffer(n);

      var c = 0;
      for (var i = 0, l = list.length; i < l && c < n; i++) {
        var buf = list[0];
        var cpy = Math.min(n - c, buf.length);

        if (stringMode)
          ret += buf.slice(0, cpy);
        else
          buf.copy(ret, c, 0, cpy);

        if (cpy < buf.length)
          list[0] = buf.slice(cpy);
        else
          list.shift();

        c += cpy;
      }
    }
  }

  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0)
    throw new Error('endReadable called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    process.nextTick(function() {
      // Check that we didn't get one last unshift.
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit('end');
      }
    });
  }
}

function forEach (xs, f) {
  for (var i = 0, l = xs.length; i < l; i++) {
    f(xs[i], i);
  }
}

function indexOf (xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}

}).call(this,require('_process'))
},{"./_stream_duplex":182,"_process":17,"buffer":8,"core-util-is":51,"events":10,"inherits":123,"isarray":181,"stream":37,"string_decoder/":187,"util":6}],184:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.


// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);


function TransformState(options, stream) {
  this.afterTransform = function(er, data) {
    return afterTransform(stream, er, data);
  };

  this.needTransform = false;
  this.transforming = false;
  this.writecb = null;
  this.writechunk = null;
}

function afterTransform(stream, er, data) {
  var ts = stream._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb)
    return stream.emit('error', new Error('no writecb in Transform class'));

  ts.writechunk = null;
  ts.writecb = null;

  if (!util.isNullOrUndefined(data))
    stream.push(data);

  if (cb)
    cb(er);

  var rs = stream._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    stream._read(rs.highWaterMark);
  }
}


function Transform(options) {
  if (!(this instanceof Transform))
    return new Transform(options);

  Duplex.call(this, options);

  this._transformState = new TransformState(options, this);

  // when the writable side finishes, then flush out anything remaining.
  var stream = this;

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  this.once('prefinish', function() {
    if (util.isFunction(this._flush))
      this._flush(function(er) {
        done(stream, er);
      });
    else
      done(stream);
  });
}

Transform.prototype.push = function(chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function(chunk, encoding, cb) {
  throw new Error('not implemented');
};

Transform.prototype._write = function(chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform ||
        rs.needReadable ||
        rs.length < rs.highWaterMark)
      this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function(n) {
  var ts = this._transformState;

  if (!util.isNull(ts.writechunk) && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};


function done(stream, er) {
  if (er)
    return stream.emit('error', er);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  var ws = stream._writableState;
  var ts = stream._transformState;

  if (ws.length)
    throw new Error('calling transform done when ws.length != 0');

  if (ts.transforming)
    throw new Error('calling transform done when still transforming');

  return stream.push(null);
}

},{"./_stream_duplex":182,"core-util-is":51,"inherits":123}],185:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, cb), and it'll handle all
// the drain event emission and buffering.

module.exports = Writable;

/*<replacement>*/
var Buffer = require('buffer').Buffer;
/*</replacement>*/

Writable.WritableState = WritableState;


/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Stream = require('stream');

util.inherits(Writable, Stream);

function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
}

function WritableState(options, stream) {
  var Duplex = require('./_stream_duplex');

  options = options || {};

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var defaultHwm = options.objectMode ? 16 : 16 * 1024;
  this.highWaterMark = (hwm || hwm === 0) ? hwm : defaultHwm;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (stream instanceof Duplex)
    this.objectMode = this.objectMode || !!options.writableObjectMode;

  // cast to ints.
  this.highWaterMark = ~~this.highWaterMark;

  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function(er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.buffer = [];

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;
}

function Writable(options) {
  var Duplex = require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, though they're not
  // instanceof Writable, they're instanceof Readable.
  if (!(this instanceof Writable) && !(this instanceof Duplex))
    return new Writable(options);

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function() {
  this.emit('error', new Error('Cannot pipe. Not readable.'));
};


function writeAfterEnd(stream, state, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  process.nextTick(function() {
    cb(er);
  });
}

// If we get something that is not a buffer, string, null, or undefined,
// and we're not in objectMode, then that's an error.
// Otherwise stream chunks are all considered to be of length=1, and the
// watermarks determine how many objects to keep in the buffer, rather than
// how many bytes or characters.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  if (!util.isBuffer(chunk) &&
      !util.isString(chunk) &&
      !util.isNullOrUndefined(chunk) &&
      !state.objectMode) {
    var er = new TypeError('Invalid non-string/buffer chunk');
    stream.emit('error', er);
    process.nextTick(function() {
      cb(er);
    });
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function(chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;

  if (util.isFunction(encoding)) {
    cb = encoding;
    encoding = null;
  }

  if (util.isBuffer(chunk))
    encoding = 'buffer';
  else if (!encoding)
    encoding = state.defaultEncoding;

  if (!util.isFunction(cb))
    cb = function() {};

  if (state.ended)
    writeAfterEnd(this, state, cb);
  else if (validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function() {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function() {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing &&
        !state.corked &&
        !state.finished &&
        !state.bufferProcessing &&
        state.buffer.length)
      clearBuffer(this, state);
  }
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode &&
      state.decodeStrings !== false &&
      util.isString(chunk)) {
    chunk = new Buffer(chunk, encoding);
  }
  return chunk;
}

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, chunk, encoding, cb) {
  chunk = decodeChunk(state, chunk, encoding);
  if (util.isBuffer(chunk))
    encoding = 'buffer';
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret)
    state.needDrain = true;

  if (state.writing || state.corked)
    state.buffer.push(new WriteReq(chunk, encoding, cb));
  else
    doWrite(stream, state, false, len, chunk, encoding, cb);

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev)
    stream._writev(chunk, state.onwrite);
  else
    stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  if (sync)
    process.nextTick(function() {
      state.pendingcb--;
      cb(er);
    });
  else {
    state.pendingcb--;
    cb(er);
  }

  stream._writableState.errorEmitted = true;
  stream.emit('error', er);
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er)
    onwriteError(stream, state, sync, er, cb);
  else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(stream, state);

    if (!finished &&
        !state.corked &&
        !state.bufferProcessing &&
        state.buffer.length) {
      clearBuffer(stream, state);
    }

    if (sync) {
      process.nextTick(function() {
        afterWrite(stream, state, finished, cb);
      });
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished)
    onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}


// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;

  if (stream._writev && state.buffer.length > 1) {
    // Fast case, write everything using _writev()
    var cbs = [];
    for (var c = 0; c < state.buffer.length; c++)
      cbs.push(state.buffer[c].callback);

    // count the one we are adding, as well.
    // TODO(isaacs) clean this up
    state.pendingcb++;
    doWrite(stream, state, true, state.length, state.buffer, '', function(err) {
      for (var i = 0; i < cbs.length; i++) {
        state.pendingcb--;
        cbs[i](err);
      }
    });

    // Clear buffer
    state.buffer = [];
  } else {
    // Slow case, write chunks one-by-one
    for (var c = 0; c < state.buffer.length; c++) {
      var entry = state.buffer[c];
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);

      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        c++;
        break;
      }
    }

    if (c < state.buffer.length)
      state.buffer = state.buffer.slice(c);
    else
      state.buffer.length = 0;
  }

  state.bufferProcessing = false;
}

Writable.prototype._write = function(chunk, encoding, cb) {
  cb(new Error('not implemented'));

};

Writable.prototype._writev = null;

Writable.prototype.end = function(chunk, encoding, cb) {
  var state = this._writableState;

  if (util.isFunction(chunk)) {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (util.isFunction(encoding)) {
    cb = encoding;
    encoding = null;
  }

  if (!util.isNullOrUndefined(chunk))
    this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished)
    endWritable(this, state, cb);
};


function needFinish(stream, state) {
  return (state.ending &&
          state.length === 0 &&
          !state.finished &&
          !state.writing);
}

function prefinish(stream, state) {
  if (!state.prefinished) {
    state.prefinished = true;
    stream.emit('prefinish');
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(stream, state);
  if (need) {
    if (state.pendingcb === 0) {
      prefinish(stream, state);
      state.finished = true;
      stream.emit('finish');
    } else
      prefinish(stream, state);
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished)
      process.nextTick(cb);
    else
      stream.once('finish', cb);
  }
  state.ended = true;
}

}).call(this,require('_process'))
},{"./_stream_duplex":182,"_process":17,"buffer":8,"core-util-is":51,"inherits":123,"stream":37}],186:[function(require,module,exports){
module.exports = require("./lib/_stream_transform.js")

},{"./lib/_stream_transform.js":184}],187:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var Buffer = require('buffer').Buffer;

var isBufferEncoding = Buffer.isEncoding
  || function(encoding) {
       switch (encoding && encoding.toLowerCase()) {
         case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
         default: return false;
       }
     }


function assertEncoding(encoding) {
  if (encoding && !isBufferEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters. CESU-8 is handled as part of the UTF-8 encoding.
//
// @TODO Handling all encodings inside a single object makes it very difficult
// to reason about this code, so it should be split up in the future.
// @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
// points as used by CESU-8.
var StringDecoder = exports.StringDecoder = function(encoding) {
  this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
  assertEncoding(encoding);
  switch (this.encoding) {
    case 'utf8':
      // CESU-8 represents each of Surrogate Pair by 3-bytes
      this.surrogateSize = 3;
      break;
    case 'ucs2':
    case 'utf16le':
      // UTF-16 represents each of Surrogate Pair by 2-bytes
      this.surrogateSize = 2;
      this.detectIncompleteChar = utf16DetectIncompleteChar;
      break;
    case 'base64':
      // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
      this.surrogateSize = 3;
      this.detectIncompleteChar = base64DetectIncompleteChar;
      break;
    default:
      this.write = passThroughWrite;
      return;
  }

  // Enough space to store all bytes of a single character. UTF-8 needs 4
  // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
  this.charBuffer = new Buffer(6);
  // Number of bytes received for the current incomplete multi-byte character.
  this.charReceived = 0;
  // Number of bytes expected for the current incomplete multi-byte character.
  this.charLength = 0;
};


// write decodes the given buffer and returns it as JS string that is
// guaranteed to not contain any partial multi-byte characters. Any partial
// character found at the end of the buffer is buffered up, and will be
// returned when calling write again with the remaining bytes.
//
// Note: Converting a Buffer containing an orphan surrogate to a String
// currently works, but converting a String to a Buffer (via `new Buffer`, or
// Buffer#write) will replace incomplete surrogates with the unicode
// replacement character. See https://codereview.chromium.org/121173009/ .
StringDecoder.prototype.write = function(buffer) {
  var charStr = '';
  // if our last write ended with an incomplete multibyte character
  while (this.charLength) {
    // determine how many remaining bytes this buffer has to offer for this char
    var available = (buffer.length >= this.charLength - this.charReceived) ?
        this.charLength - this.charReceived :
        buffer.length;

    // add the new bytes to the char buffer
    buffer.copy(this.charBuffer, this.charReceived, 0, available);
    this.charReceived += available;

    if (this.charReceived < this.charLength) {
      // still not enough chars in this buffer? wait for more ...
      return '';
    }

    // remove bytes belonging to the current character from the buffer
    buffer = buffer.slice(available, buffer.length);

    // get the character that was split
    charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

    // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
    var charCode = charStr.charCodeAt(charStr.length - 1);
    if (charCode >= 0xD800 && charCode <= 0xDBFF) {
      this.charLength += this.surrogateSize;
      charStr = '';
      continue;
    }
    this.charReceived = this.charLength = 0;

    // if there are no more bytes in this buffer, just emit our char
    if (buffer.length === 0) {
      return charStr;
    }
    break;
  }

  // determine and set charLength / charReceived
  this.detectIncompleteChar(buffer);

  var end = buffer.length;
  if (this.charLength) {
    // buffer the incomplete character bytes we got
    buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
    end -= this.charReceived;
  }

  charStr += buffer.toString(this.encoding, 0, end);

  var end = charStr.length - 1;
  var charCode = charStr.charCodeAt(end);
  // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
  if (charCode >= 0xD800 && charCode <= 0xDBFF) {
    var size = this.surrogateSize;
    this.charLength += size;
    this.charReceived += size;
    this.charBuffer.copy(this.charBuffer, size, 0, size);
    buffer.copy(this.charBuffer, 0, 0, size);
    return charStr.substring(0, end);
  }

  // or just emit the charStr
  return charStr;
};

// detectIncompleteChar determines if there is an incomplete UTF-8 character at
// the end of the given buffer. If so, it sets this.charLength to the byte
// length that character, and sets this.charReceived to the number of bytes
// that are available for this character.
StringDecoder.prototype.detectIncompleteChar = function(buffer) {
  // determine how many bytes we have to check at the end of this buffer
  var i = (buffer.length >= 3) ? 3 : buffer.length;

  // Figure out if one of the last i bytes of our buffer announces an
  // incomplete char.
  for (; i > 0; i--) {
    var c = buffer[buffer.length - i];

    // See http://en.wikipedia.org/wiki/UTF-8#Description

    // 110XXXXX
    if (i == 1 && c >> 5 == 0x06) {
      this.charLength = 2;
      break;
    }

    // 1110XXXX
    if (i <= 2 && c >> 4 == 0x0E) {
      this.charLength = 3;
      break;
    }

    // 11110XXX
    if (i <= 3 && c >> 3 == 0x1E) {
      this.charLength = 4;
      break;
    }
  }
  this.charReceived = i;
};

StringDecoder.prototype.end = function(buffer) {
  var res = '';
  if (buffer && buffer.length)
    res = this.write(buffer);

  if (this.charReceived) {
    var cr = this.charReceived;
    var buf = this.charBuffer;
    var enc = this.encoding;
    res += buf.slice(0, cr).toString(enc);
  }

  return res;
};

function passThroughWrite(buffer) {
  return buffer.toString(this.encoding);
}

function utf16DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 2;
  this.charLength = this.charReceived ? 2 : 0;
}

function base64DetectIncompleteChar(buffer) {
  this.charReceived = buffer.length % 3;
  this.charLength = this.charReceived ? 3 : 0;
}

},{"buffer":8}],188:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */

'use strict';

// Shimming starts here.
(function() {
  // Utils.
  var logging = require('./utils').log;
  var browserDetails = require('./utils').browserDetails;
  // Export to the adapter global object visible in the browser.
  module.exports.browserDetails = browserDetails;
  module.exports.extractVersion = require('./utils').extractVersion;
  module.exports.disableLog = require('./utils').disableLog;

  // Uncomment the line below if you want logging to occur, including logging
  // for the switch statement below. Can also be turned on in the browser via
  // adapter.disableLog(false), but then logging from the switch statement below
  // will not appear.
  // require('./utils').disableLog(false);

  // Browser shims.
  var chromeShim = require('./chrome/chrome_shim') || null;
  var edgeShim = require('./edge/edge_shim') || null;
  var firefoxShim = require('./firefox/firefox_shim') || null;
  var safariShim = require('./safari/safari_shim') || null;

  // Shim browser if found.
  switch (browserDetails.browser) {
    case 'opera': // fallthrough as it uses chrome shims
    case 'chrome':
      if (!chromeShim || !chromeShim.shimPeerConnection) {
        logging('Chrome shim is not included in this adapter release.');
        return;
      }
      logging('adapter.js shimming chrome.');
      // Export to the adapter global object visible in the browser.
      module.exports.browserShim = chromeShim;

      chromeShim.shimGetUserMedia();
      chromeShim.shimMediaStream();
      chromeShim.shimSourceObject();
      chromeShim.shimPeerConnection();
      chromeShim.shimOnTrack();
      break;
    case 'firefox':
      if (!firefoxShim || !firefoxShim.shimPeerConnection) {
        logging('Firefox shim is not included in this adapter release.');
        return;
      }
      logging('adapter.js shimming firefox.');
      // Export to the adapter global object visible in the browser.
      module.exports.browserShim = firefoxShim;

      firefoxShim.shimGetUserMedia();
      firefoxShim.shimSourceObject();
      firefoxShim.shimPeerConnection();
      firefoxShim.shimOnTrack();
      break;
    case 'edge':
      if (!edgeShim || !edgeShim.shimPeerConnection) {
        logging('MS edge shim is not included in this adapter release.');
        return;
      }
      logging('adapter.js shimming edge.');
      // Export to the adapter global object visible in the browser.
      module.exports.browserShim = edgeShim;

      edgeShim.shimGetUserMedia();
      edgeShim.shimPeerConnection();
      break;
    case 'safari':
      if (!safariShim) {
        logging('Safari shim is not included in this adapter release.');
        return;
      }
      logging('adapter.js shimming safari.');
      // Export to the adapter global object visible in the browser.
      module.exports.browserShim = safariShim;

      safariShim.shimGetUserMedia();
      break;
    default:
      logging('Unsupported browser!');
  }
})();

},{"./chrome/chrome_shim":189,"./edge/edge_shim":191,"./firefox/firefox_shim":193,"./safari/safari_shim":195,"./utils":196}],189:[function(require,module,exports){

/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';
var logging = require('../utils.js').log;
var browserDetails = require('../utils.js').browserDetails;

var chromeShim = {
  shimMediaStream: function() {
    window.MediaStream = window.MediaStream || window.webkitMediaStream;
  },

  shimOnTrack: function() {
    if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
        window.RTCPeerConnection.prototype)) {
      Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
        get: function() {
          return this._ontrack;
        },
        set: function(f) {
          var self = this;
          if (this._ontrack) {
            this.removeEventListener('track', this._ontrack);
            this.removeEventListener('addstream', this._ontrackpoly);
          }
          this.addEventListener('track', this._ontrack = f);
          this.addEventListener('addstream', this._ontrackpoly = function(e) {
            // onaddstream does not fire when a track is added to an existing
            // stream. But stream.onaddtrack is implemented so we use that.
            e.stream.addEventListener('addtrack', function(te) {
              var event = new Event('track');
              event.track = te.track;
              event.receiver = {track: te.track};
              event.streams = [e.stream];
              self.dispatchEvent(event);
            });
            e.stream.getTracks().forEach(function(track) {
              var event = new Event('track');
              event.track = track;
              event.receiver = {track: track};
              event.streams = [e.stream];
              this.dispatchEvent(event);
            }.bind(this));
          }.bind(this));
        }
      });
    }
  },

  shimSourceObject: function() {
    if (typeof window === 'object') {
      if (window.HTMLMediaElement &&
        !('srcObject' in window.HTMLMediaElement.prototype)) {
        // Shim the srcObject property, once, when HTMLMediaElement is found.
        Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
          get: function() {
            return this._srcObject;
          },
          set: function(stream) {
            var self = this;
            // Use _srcObject as a private property for this shim
            this._srcObject = stream;
            if (this.src) {
              URL.revokeObjectURL(this.src);
            }

            if (!stream) {
              this.src = '';
              return;
            }
            this.src = URL.createObjectURL(stream);
            // We need to recreate the blob url when a track is added or
            // removed. Doing it manually since we want to avoid a recursion.
            stream.addEventListener('addtrack', function() {
              if (self.src) {
                URL.revokeObjectURL(self.src);
              }
              self.src = URL.createObjectURL(stream);
            });
            stream.addEventListener('removetrack', function() {
              if (self.src) {
                URL.revokeObjectURL(self.src);
              }
              self.src = URL.createObjectURL(stream);
            });
          }
        });
      }
    }
  },

  shimPeerConnection: function() {
    // The RTCPeerConnection object.
    window.RTCPeerConnection = function(pcConfig, pcConstraints) {
      // Translate iceTransportPolicy to iceTransports,
      // see https://code.google.com/p/webrtc/issues/detail?id=4869
      logging('PeerConnection');
      if (pcConfig && pcConfig.iceTransportPolicy) {
        pcConfig.iceTransports = pcConfig.iceTransportPolicy;
      }

      var pc = new webkitRTCPeerConnection(pcConfig, pcConstraints);
      var origGetStats = pc.getStats.bind(pc);
      pc.getStats = function(selector, successCallback, errorCallback) {
        var self = this;
        var args = arguments;

        // If selector is a function then we are in the old style stats so just
        // pass back the original getStats format to avoid breaking old users.
        if (arguments.length > 0 && typeof selector === 'function') {
          return origGetStats(selector, successCallback);
        }

        var fixChromeStats_ = function(response) {
          var standardReport = {};
          var reports = response.result();
          reports.forEach(function(report) {
            var standardStats = {
              id: report.id,
              timestamp: report.timestamp,
              type: report.type
            };
            report.names().forEach(function(name) {
              standardStats[name] = report.stat(name);
            });
            standardReport[standardStats.id] = standardStats;
          });

          return standardReport;
        };

        // shim getStats with maplike support
        var makeMapStats = function(stats, legacyStats) {
          var map = new Map(Object.keys(stats).map(function(key) {
            return[key, stats[key]];
          }));
          legacyStats = legacyStats || stats;
          Object.keys(legacyStats).forEach(function(key) {
            map[key] = legacyStats[key];
          });
          return map;
        };

        if (arguments.length >= 2) {
          var successCallbackWrapper_ = function(response) {
            args[1](makeMapStats(fixChromeStats_(response)));
          };

          return origGetStats.apply(this, [successCallbackWrapper_,
              arguments[0]]);
        }

        // promise-support
        return new Promise(function(resolve, reject) {
          if (args.length === 1 && typeof selector === 'object') {
            origGetStats.apply(self, [
              function(response) {
                resolve(makeMapStats(fixChromeStats_(response)));
              }, reject]);
          } else {
            // Preserve legacy chrome stats only on legacy access of stats obj
            origGetStats.apply(self, [
              function(response) {
                resolve(makeMapStats(fixChromeStats_(response),
                    response.result()));
              }, reject]);
          }
        }).then(successCallback, errorCallback);
      };

      return pc;
    };
    window.RTCPeerConnection.prototype = webkitRTCPeerConnection.prototype;

    // wrap static methods. Currently just generateCertificate.
    if (webkitRTCPeerConnection.generateCertificate) {
      Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
        get: function() {
          return webkitRTCPeerConnection.generateCertificate;
        }
      });
    }

    ['createOffer', 'createAnswer'].forEach(function(method) {
      var nativeMethod = webkitRTCPeerConnection.prototype[method];
      webkitRTCPeerConnection.prototype[method] = function() {
        var self = this;
        if (arguments.length < 1 || (arguments.length === 1 &&
            typeof arguments[0] === 'object')) {
          var opts = arguments.length === 1 ? arguments[0] : undefined;
          return new Promise(function(resolve, reject) {
            nativeMethod.apply(self, [resolve, reject, opts]);
          });
        }
        return nativeMethod.apply(this, arguments);
      };
    });

    // add promise support -- natively available in Chrome 51
    if (browserDetails.version < 51) {
      ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
          .forEach(function(method) {
            var nativeMethod = webkitRTCPeerConnection.prototype[method];
            webkitRTCPeerConnection.prototype[method] = function() {
              var args = arguments;
              var self = this;
              var promise = new Promise(function(resolve, reject) {
                nativeMethod.apply(self, [args[0], resolve, reject]);
              });
              if (args.length < 2) {
                return promise;
              }
              return promise.then(function() {
                args[1].apply(null, []);
              },
              function(err) {
                if (args.length >= 3) {
                  args[2].apply(null, [err]);
                }
              });
            };
          });
    }

    // shim implicit creation of RTCSessionDescription/RTCIceCandidate
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
        .forEach(function(method) {
          var nativeMethod = webkitRTCPeerConnection.prototype[method];
          webkitRTCPeerConnection.prototype[method] = function() {
            arguments[0] = new ((method === 'addIceCandidate') ?
                RTCIceCandidate : RTCSessionDescription)(arguments[0]);
            return nativeMethod.apply(this, arguments);
          };
        });

    // support for addIceCandidate(null or undefined)
    var nativeAddIceCandidate =
        RTCPeerConnection.prototype.addIceCandidate;
    RTCPeerConnection.prototype.addIceCandidate = function() {
      if (!arguments[0]) {
        if (arguments[1]) {
          arguments[1].apply(null);
        }
        return Promise.resolve();
      }
      return nativeAddIceCandidate.apply(this, arguments);
    };
  }
};


// Expose public methods.
module.exports = {
  shimMediaStream: chromeShim.shimMediaStream,
  shimOnTrack: chromeShim.shimOnTrack,
  shimSourceObject: chromeShim.shimSourceObject,
  shimPeerConnection: chromeShim.shimPeerConnection,
  shimGetUserMedia: require('./getusermedia')
};

},{"../utils.js":196,"./getusermedia":190}],190:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';
var logging = require('../utils.js').log;

// Expose public methods.
module.exports = function() {
  var constraintsToChrome_ = function(c) {
    if (typeof c !== 'object' || c.mandatory || c.optional) {
      return c;
    }
    var cc = {};
    Object.keys(c).forEach(function(key) {
      if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
        return;
      }
      var r = (typeof c[key] === 'object') ? c[key] : {ideal: c[key]};
      if (r.exact !== undefined && typeof r.exact === 'number') {
        r.min = r.max = r.exact;
      }
      var oldname_ = function(prefix, name) {
        if (prefix) {
          return prefix + name.charAt(0).toUpperCase() + name.slice(1);
        }
        return (name === 'deviceId') ? 'sourceId' : name;
      };
      if (r.ideal !== undefined) {
        cc.optional = cc.optional || [];
        var oc = {};
        if (typeof r.ideal === 'number') {
          oc[oldname_('min', key)] = r.ideal;
          cc.optional.push(oc);
          oc = {};
          oc[oldname_('max', key)] = r.ideal;
          cc.optional.push(oc);
        } else {
          oc[oldname_('', key)] = r.ideal;
          cc.optional.push(oc);
        }
      }
      if (r.exact !== undefined && typeof r.exact !== 'number') {
        cc.mandatory = cc.mandatory || {};
        cc.mandatory[oldname_('', key)] = r.exact;
      } else {
        ['min', 'max'].forEach(function(mix) {
          if (r[mix] !== undefined) {
            cc.mandatory = cc.mandatory || {};
            cc.mandatory[oldname_(mix, key)] = r[mix];
          }
        });
      }
    });
    if (c.advanced) {
      cc.optional = (cc.optional || []).concat(c.advanced);
    }
    return cc;
  };

  var shimConstraints_ = function(constraints, func) {
    constraints = JSON.parse(JSON.stringify(constraints));
    if (constraints && constraints.audio) {
      constraints.audio = constraintsToChrome_(constraints.audio);
    }
    if (constraints && typeof constraints.video === 'object') {
      // Shim facingMode for mobile, where it defaults to "user".
      var face = constraints.video.facingMode;
      face = face && ((typeof face === 'object') ? face : {ideal: face});

      if ((face && (face.exact === 'user' || face.exact === 'environment' ||
                    face.ideal === 'user' || face.ideal === 'environment')) &&
          !(navigator.mediaDevices.getSupportedConstraints &&
            navigator.mediaDevices.getSupportedConstraints().facingMode)) {
        delete constraints.video.facingMode;
        if (face.exact === 'environment' || face.ideal === 'environment') {
          // Look for "back" in label, or use last cam (typically back cam).
          return navigator.mediaDevices.enumerateDevices()
          .then(function(devices) {
            devices = devices.filter(function(d) {
              return d.kind === 'videoinput';
            });
            var back = devices.find(function(d) {
              return d.label.toLowerCase().indexOf('back') !== -1;
            }) || (devices.length && devices[devices.length - 1]);
            if (back) {
              constraints.video.deviceId = face.exact ? {exact: back.deviceId} :
                                                        {ideal: back.deviceId};
            }
            constraints.video = constraintsToChrome_(constraints.video);
            logging('chrome: ' + JSON.stringify(constraints));
            return func(constraints);
          });
        }
      }
      constraints.video = constraintsToChrome_(constraints.video);
    }
    logging('chrome: ' + JSON.stringify(constraints));
    return func(constraints);
  };

  var shimError_ = function(e) {
    return {
      name: {
        PermissionDeniedError: 'NotAllowedError',
        ConstraintNotSatisfiedError: 'OverconstrainedError'
      }[e.name] || e.name,
      message: e.message,
      constraint: e.constraintName,
      toString: function() {
        return this.name + (this.message && ': ') + this.message;
      }
    };
  };

  var getUserMedia_ = function(constraints, onSuccess, onError) {
    shimConstraints_(constraints, function(c) {
      navigator.webkitGetUserMedia(c, onSuccess, function(e) {
        onError(shimError_(e));
      });
    });
  };

  navigator.getUserMedia = getUserMedia_;

  // Returns the result of getUserMedia as a Promise.
  var getUserMediaPromise_ = function(constraints) {
    return new Promise(function(resolve, reject) {
      navigator.getUserMedia(constraints, resolve, reject);
    });
  };

  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {
      getUserMedia: getUserMediaPromise_,
      enumerateDevices: function() {
        return new Promise(function(resolve) {
          var kinds = {audio: 'audioinput', video: 'videoinput'};
          return MediaStreamTrack.getSources(function(devices) {
            resolve(devices.map(function(device) {
              return {label: device.label,
                      kind: kinds[device.kind],
                      deviceId: device.id,
                      groupId: ''};
            }));
          });
        });
      }
    };
  }

  // A shim for getUserMedia method on the mediaDevices object.
  // TODO(KaptenJansson) remove once implemented in Chrome stable.
  if (!navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      return getUserMediaPromise_(constraints);
    };
  } else {
    // Even though Chrome 45 has navigator.mediaDevices and a getUserMedia
    // function which returns a Promise, it does not accept spec-style
    // constraints.
    var origGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(cs) {
      return shimConstraints_(cs, function(c) {
        return origGetUserMedia(c).then(function(stream) {
          if (c.audio && !stream.getAudioTracks().length ||
              c.video && !stream.getVideoTracks().length) {
            stream.getTracks().forEach(function(track) {
              track.stop();
            });
            throw new DOMException('', 'NotFoundError');
          }
          return stream;
        }, function(e) {
          return Promise.reject(shimError_(e));
        });
      });
    };
  }

  // Dummy devicechange event methods.
  // TODO(KaptenJansson) remove once implemented in Chrome stable.
  if (typeof navigator.mediaDevices.addEventListener === 'undefined') {
    navigator.mediaDevices.addEventListener = function() {
      logging('Dummy mediaDevices.addEventListener called.');
    };
  }
  if (typeof navigator.mediaDevices.removeEventListener === 'undefined') {
    navigator.mediaDevices.removeEventListener = function() {
      logging('Dummy mediaDevices.removeEventListener called.');
    };
  }
};

},{"../utils.js":196}],191:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

var SDPUtils = require('sdp');
var browserDetails = require('../utils').browserDetails;

var edgeShim = {
  shimPeerConnection: function() {
    if (window.RTCIceGatherer) {
      // ORTC defines an RTCIceCandidate object but no constructor.
      // Not implemented in Edge.
      if (!window.RTCIceCandidate) {
        window.RTCIceCandidate = function(args) {
          return args;
        };
      }
      // ORTC does not have a session description object but
      // other browsers (i.e. Chrome) that will support both PC and ORTC
      // in the future might have this defined already.
      if (!window.RTCSessionDescription) {
        window.RTCSessionDescription = function(args) {
          return args;
        };
      }
      // this adds an additional event listener to MediaStrackTrack that signals
      // when a tracks enabled property was changed.
      var origMSTEnabled = Object.getOwnPropertyDescriptor(
          MediaStreamTrack.prototype, 'enabled');
      Object.defineProperty(MediaStreamTrack.prototype, 'enabled', {
        set: function(value) {
          origMSTEnabled.set.call(this, value);
          var ev = new Event('enabled');
          ev.enabled = value;
          this.dispatchEvent(ev);
        }
      });
    }

    window.RTCPeerConnection = function(config) {
      var self = this;

      var _eventTarget = document.createDocumentFragment();
      ['addEventListener', 'removeEventListener', 'dispatchEvent']
          .forEach(function(method) {
            self[method] = _eventTarget[method].bind(_eventTarget);
          });

      this.onicecandidate = null;
      this.onaddstream = null;
      this.ontrack = null;
      this.onremovestream = null;
      this.onsignalingstatechange = null;
      this.oniceconnectionstatechange = null;
      this.onnegotiationneeded = null;
      this.ondatachannel = null;

      this.localStreams = [];
      this.remoteStreams = [];
      this.getLocalStreams = function() {
        return self.localStreams;
      };
      this.getRemoteStreams = function() {
        return self.remoteStreams;
      };

      this.localDescription = new RTCSessionDescription({
        type: '',
        sdp: ''
      });
      this.remoteDescription = new RTCSessionDescription({
        type: '',
        sdp: ''
      });
      this.signalingState = 'stable';
      this.iceConnectionState = 'new';
      this.iceGatheringState = 'new';

      this.iceOptions = {
        gatherPolicy: 'all',
        iceServers: []
      };
      if (config && config.iceTransportPolicy) {
        switch (config.iceTransportPolicy) {
          case 'all':
          case 'relay':
            this.iceOptions.gatherPolicy = config.iceTransportPolicy;
            break;
          case 'none':
            // FIXME: remove once implementation and spec have added this.
            throw new TypeError('iceTransportPolicy "none" not supported');
          default:
            // don't set iceTransportPolicy.
            break;
        }
      }
      this.usingBundle = config && config.bundlePolicy === 'max-bundle';

      if (config && config.iceServers) {
        // Edge does not like
        // 1) stun:
        // 2) turn: that does not have all of turn:host:port?transport=udp
        // 3) turn: with ipv6 addresses
        var iceServers = JSON.parse(JSON.stringify(config.iceServers));
        this.iceOptions.iceServers = iceServers.filter(function(server) {
          if (server && server.urls) {
            var urls = server.urls;
            if (typeof urls === 'string') {
              urls = [urls];
            }
            urls = urls.filter(function(url) {
              return (url.indexOf('turn:') === 0 &&
                  url.indexOf('transport=udp') !== -1 &&
                  url.indexOf('turn:[') === -1) ||
                  (url.indexOf('stun:') === 0 &&
                    browserDetails.version >= 14393);
            })[0];
            return !!urls;
          }
          return false;
        });
      }
      this._config = config;

      // per-track iceGathers, iceTransports, dtlsTransports, rtpSenders, ...
      // everything that is needed to describe a SDP m-line.
      this.transceivers = [];

      // since the iceGatherer is currently created in createOffer but we
      // must not emit candidates until after setLocalDescription we buffer
      // them in this array.
      this._localIceCandidatesBuffer = [];
    };

    window.RTCPeerConnection.prototype._emitBufferedCandidates = function() {
      var self = this;
      var sections = SDPUtils.splitSections(self.localDescription.sdp);
      // FIXME: need to apply ice candidates in a way which is async but
      // in-order
      this._localIceCandidatesBuffer.forEach(function(event) {
        var end = !event.candidate || Object.keys(event.candidate).length === 0;
        if (end) {
          for (var j = 1; j < sections.length; j++) {
            if (sections[j].indexOf('\r\na=end-of-candidates\r\n') === -1) {
              sections[j] += 'a=end-of-candidates\r\n';
            }
          }
        } else if (event.candidate.candidate.indexOf('typ endOfCandidates')
            === -1) {
          sections[event.candidate.sdpMLineIndex + 1] +=
              'a=' + event.candidate.candidate + '\r\n';
        }
        self.localDescription.sdp = sections.join('');
        self.dispatchEvent(event);
        if (self.onicecandidate !== null) {
          self.onicecandidate(event);
        }
        if (!event.candidate && self.iceGatheringState !== 'complete') {
          var complete = self.transceivers.every(function(transceiver) {
            return transceiver.iceGatherer &&
                transceiver.iceGatherer.state === 'completed';
          });
          if (complete) {
            self.iceGatheringState = 'complete';
          }
        }
      });
      this._localIceCandidatesBuffer = [];
    };

    window.RTCPeerConnection.prototype.getConfiguration = function() {
      return this._config;
    };

    window.RTCPeerConnection.prototype.addStream = function(stream) {
      // Clone is necessary for local demos mostly, attaching directly
      // to two different senders does not work (build 10547).
      var clonedStream = stream.clone();
      stream.getTracks().forEach(function(track, idx) {
        var clonedTrack = clonedStream.getTracks()[idx];
        track.addEventListener('enabled', function(event) {
          clonedTrack.enabled = event.enabled;
        });
      });
      this.localStreams.push(clonedStream);
      this._maybeFireNegotiationNeeded();
    };

    window.RTCPeerConnection.prototype.removeStream = function(stream) {
      var idx = this.localStreams.indexOf(stream);
      if (idx > -1) {
        this.localStreams.splice(idx, 1);
        this._maybeFireNegotiationNeeded();
      }
    };

    window.RTCPeerConnection.prototype.getSenders = function() {
      return this.transceivers.filter(function(transceiver) {
        return !!transceiver.rtpSender;
      })
      .map(function(transceiver) {
        return transceiver.rtpSender;
      });
    };

    window.RTCPeerConnection.prototype.getReceivers = function() {
      return this.transceivers.filter(function(transceiver) {
        return !!transceiver.rtpReceiver;
      })
      .map(function(transceiver) {
        return transceiver.rtpReceiver;
      });
    };

    // Determines the intersection of local and remote capabilities.
    window.RTCPeerConnection.prototype._getCommonCapabilities =
        function(localCapabilities, remoteCapabilities) {
          var commonCapabilities = {
            codecs: [],
            headerExtensions: [],
            fecMechanisms: []
          };
          localCapabilities.codecs.forEach(function(lCodec) {
            for (var i = 0; i < remoteCapabilities.codecs.length; i++) {
              var rCodec = remoteCapabilities.codecs[i];
              if (lCodec.name.toLowerCase() === rCodec.name.toLowerCase() &&
                  lCodec.clockRate === rCodec.clockRate) {
                // number of channels is the highest common number of channels
                rCodec.numChannels = Math.min(lCodec.numChannels,
                    rCodec.numChannels);
                // push rCodec so we reply with offerer payload type
                commonCapabilities.codecs.push(rCodec);

                // determine common feedback mechanisms
                rCodec.rtcpFeedback = rCodec.rtcpFeedback.filter(function(fb) {
                  for (var j = 0; j < lCodec.rtcpFeedback.length; j++) {
                    if (lCodec.rtcpFeedback[j].type === fb.type &&
                        lCodec.rtcpFeedback[j].parameter === fb.parameter) {
                      return true;
                    }
                  }
                  return false;
                });
                // FIXME: also need to determine .parameters
                //  see https://github.com/openpeer/ortc/issues/569
                break;
              }
            }
          });

          localCapabilities.headerExtensions
              .forEach(function(lHeaderExtension) {
                for (var i = 0; i < remoteCapabilities.headerExtensions.length;
                     i++) {
                  var rHeaderExtension = remoteCapabilities.headerExtensions[i];
                  if (lHeaderExtension.uri === rHeaderExtension.uri) {
                    commonCapabilities.headerExtensions.push(rHeaderExtension);
                    break;
                  }
                }
              });

          // FIXME: fecMechanisms
          return commonCapabilities;
        };

    // Create ICE gatherer, ICE transport and DTLS transport.
    window.RTCPeerConnection.prototype._createIceAndDtlsTransports =
        function(mid, sdpMLineIndex) {
          var self = this;
          var iceGatherer = new RTCIceGatherer(self.iceOptions);
          var iceTransport = new RTCIceTransport(iceGatherer);
          iceGatherer.onlocalcandidate = function(evt) {
            var event = new Event('icecandidate');
            event.candidate = {sdpMid: mid, sdpMLineIndex: sdpMLineIndex};

            var cand = evt.candidate;
            var end = !cand || Object.keys(cand).length === 0;
            // Edge emits an empty object for RTCIceCandidateComplete‥
            if (end) {
              // polyfill since RTCIceGatherer.state is not implemented in
              // Edge 10547 yet.
              if (iceGatherer.state === undefined) {
                iceGatherer.state = 'completed';
              }

              // Emit a candidate with type endOfCandidates to make the samples
              // work. Edge requires addIceCandidate with this empty candidate
              // to start checking. The real solution is to signal
              // end-of-candidates to the other side when getting the null
              // candidate but some apps (like the samples) don't do that.
              event.candidate.candidate =
                  'candidate:1 1 udp 1 0.0.0.0 9 typ endOfCandidates';
            } else {
              // RTCIceCandidate doesn't have a component, needs to be added
              cand.component = iceTransport.component === 'RTCP' ? 2 : 1;
              event.candidate.candidate = SDPUtils.writeCandidate(cand);
            }

            // update local description.
            var sections = SDPUtils.splitSections(self.localDescription.sdp);
            if (event.candidate.candidate.indexOf('typ endOfCandidates')
                === -1) {
              sections[event.candidate.sdpMLineIndex + 1] +=
                  'a=' + event.candidate.candidate + '\r\n';
            } else {
              sections[event.candidate.sdpMLineIndex + 1] +=
                  'a=end-of-candidates\r\n';
            }
            self.localDescription.sdp = sections.join('');

            var complete = self.transceivers.every(function(transceiver) {
              return transceiver.iceGatherer &&
                  transceiver.iceGatherer.state === 'completed';
            });

            // Emit candidate if localDescription is set.
            // Also emits null candidate when all gatherers are complete.
            switch (self.iceGatheringState) {
              case 'new':
                self._localIceCandidatesBuffer.push(event);
                if (end && complete) {
                  self._localIceCandidatesBuffer.push(
                      new Event('icecandidate'));
                }
                break;
              case 'gathering':
                self._emitBufferedCandidates();
                self.dispatchEvent(event);
                if (self.onicecandidate !== null) {
                  self.onicecandidate(event);
                }
                if (complete) {
                  self.dispatchEvent(new Event('icecandidate'));
                  if (self.onicecandidate !== null) {
                    self.onicecandidate(new Event('icecandidate'));
                  }
                  self.iceGatheringState = 'complete';
                }
                break;
              case 'complete':
                // should not happen... currently!
                break;
              default: // no-op.
                break;
            }
          };
          iceTransport.onicestatechange = function() {
            self._updateConnectionState();
          };

          var dtlsTransport = new RTCDtlsTransport(iceTransport);
          dtlsTransport.ondtlsstatechange = function() {
            self._updateConnectionState();
          };
          dtlsTransport.onerror = function() {
            // onerror does not set state to failed by itself.
            dtlsTransport.state = 'failed';
            self._updateConnectionState();
          };

          return {
            iceGatherer: iceGatherer,
            iceTransport: iceTransport,
            dtlsTransport: dtlsTransport
          };
        };

    // Start the RTP Sender and Receiver for a transceiver.
    window.RTCPeerConnection.prototype._transceive = function(transceiver,
        send, recv) {
      var params = this._getCommonCapabilities(transceiver.localCapabilities,
          transceiver.remoteCapabilities);
      if (send && transceiver.rtpSender) {
        params.encodings = transceiver.sendEncodingParameters;
        params.rtcp = {
          cname: SDPUtils.localCName
        };
        if (transceiver.recvEncodingParameters.length) {
          params.rtcp.ssrc = transceiver.recvEncodingParameters[0].ssrc;
        }
        transceiver.rtpSender.send(params);
      }
      if (recv && transceiver.rtpReceiver) {
        // remove RTX field in Edge 14942
        if (transceiver.kind === 'video'
            && transceiver.recvEncodingParameters) {
          transceiver.recvEncodingParameters.forEach(function(p) {
            delete p.rtx;
          });
        }
        params.encodings = transceiver.recvEncodingParameters;
        params.rtcp = {
          cname: transceiver.cname
        };
        if (transceiver.sendEncodingParameters.length) {
          params.rtcp.ssrc = transceiver.sendEncodingParameters[0].ssrc;
        }
        transceiver.rtpReceiver.receive(params);
      }
    };

    window.RTCPeerConnection.prototype.setLocalDescription =
        function(description) {
          var self = this;
          var sections;
          var sessionpart;
          if (description.type === 'offer') {
            // FIXME: What was the purpose of this empty if statement?
            // if (!this._pendingOffer) {
            // } else {
            if (this._pendingOffer) {
              // VERY limited support for SDP munging. Limited to:
              // * changing the order of codecs
              sections = SDPUtils.splitSections(description.sdp);
              sessionpart = sections.shift();
              sections.forEach(function(mediaSection, sdpMLineIndex) {
                var caps = SDPUtils.parseRtpParameters(mediaSection);
                self._pendingOffer[sdpMLineIndex].localCapabilities = caps;
              });
              this.transceivers = this._pendingOffer;
              delete this._pendingOffer;
            }
          } else if (description.type === 'answer') {
            sections = SDPUtils.splitSections(self.remoteDescription.sdp);
            sessionpart = sections.shift();
            var isIceLite = SDPUtils.matchPrefix(sessionpart,
                'a=ice-lite').length > 0;
            sections.forEach(function(mediaSection, sdpMLineIndex) {
              var transceiver = self.transceivers[sdpMLineIndex];
              var iceGatherer = transceiver.iceGatherer;
              var iceTransport = transceiver.iceTransport;
              var dtlsTransport = transceiver.dtlsTransport;
              var localCapabilities = transceiver.localCapabilities;
              var remoteCapabilities = transceiver.remoteCapabilities;

              var rejected = mediaSection.split('\n', 1)[0]
                  .split(' ', 2)[1] === '0';

              if (!rejected && !transceiver.isDatachannel) {
                var remoteIceParameters = SDPUtils.getIceParameters(
                    mediaSection, sessionpart);
                if (isIceLite) {
                  var cands = SDPUtils.matchPrefix(mediaSection, 'a=candidate:')
                  .map(function(cand) {
                    return SDPUtils.parseCandidate(cand);
                  })
                  .filter(function(cand) {
                    return cand.component === '1';
                  });
                  // ice-lite only includes host candidates in the SDP so we can
                  // use setRemoteCandidates (which implies an
                  // RTCIceCandidateComplete)
                  if (cands.length) {
                    iceTransport.setRemoteCandidates(cands);
                  }
                }
                var remoteDtlsParameters = SDPUtils.getDtlsParameters(
                    mediaSection, sessionpart);
                if (isIceLite) {
                  remoteDtlsParameters.role = 'server';
                }

                if (!self.usingBundle || sdpMLineIndex === 0) {
                  iceTransport.start(iceGatherer, remoteIceParameters,
                      isIceLite ? 'controlling' : 'controlled');
                  dtlsTransport.start(remoteDtlsParameters);
                }

                // Calculate intersection of capabilities.
                var params = self._getCommonCapabilities(localCapabilities,
                    remoteCapabilities);

                // Start the RTCRtpSender. The RTCRtpReceiver for this
                // transceiver has already been started in setRemoteDescription.
                self._transceive(transceiver,
                    params.codecs.length > 0,
                    false);
              }
            });
          }

          this.localDescription = {
            type: description.type,
            sdp: description.sdp
          };
          switch (description.type) {
            case 'offer':
              this._updateSignalingState('have-local-offer');
              break;
            case 'answer':
              this._updateSignalingState('stable');
              break;
            default:
              throw new TypeError('unsupported type "' + description.type +
                  '"');
          }

          // If a success callback was provided, emit ICE candidates after it
          // has been executed. Otherwise, emit callback after the Promise is
          // resolved.
          var hasCallback = arguments.length > 1 &&
            typeof arguments[1] === 'function';
          if (hasCallback) {
            var cb = arguments[1];
            window.setTimeout(function() {
              cb();
              if (self.iceGatheringState === 'new') {
                self.iceGatheringState = 'gathering';
              }
              self._emitBufferedCandidates();
            }, 0);
          }
          var p = Promise.resolve();
          p.then(function() {
            if (!hasCallback) {
              if (self.iceGatheringState === 'new') {
                self.iceGatheringState = 'gathering';
              }
              // Usually candidates will be emitted earlier.
              window.setTimeout(self._emitBufferedCandidates.bind(self), 500);
            }
          });
          return p;
        };

    window.RTCPeerConnection.prototype.setRemoteDescription =
        function(description) {
          var self = this;
          var stream = new MediaStream();
          var receiverList = [];
          var sections = SDPUtils.splitSections(description.sdp);
          var sessionpart = sections.shift();
          var isIceLite = SDPUtils.matchPrefix(sessionpart,
              'a=ice-lite').length > 0;
          this.usingBundle = SDPUtils.matchPrefix(sessionpart,
              'a=group:BUNDLE ').length > 0;
          sections.forEach(function(mediaSection, sdpMLineIndex) {
            var lines = SDPUtils.splitLines(mediaSection);
            var mline = lines[0].substr(2).split(' ');
            var kind = mline[0];
            var rejected = mline[1] === '0';
            var direction = SDPUtils.getDirection(mediaSection, sessionpart);

            var mid = SDPUtils.matchPrefix(mediaSection, 'a=mid:');
            if (mid.length) {
              mid = mid[0].substr(6);
            } else {
              mid = SDPUtils.generateIdentifier();
            }

            // Reject datachannels which are not implemented yet.
            if (kind === 'application' && mline[2] === 'DTLS/SCTP') {
              self.transceivers[sdpMLineIndex] = {
                mid: mid,
                isDatachannel: true
              };
              return;
            }

            var transceiver;
            var iceGatherer;
            var iceTransport;
            var dtlsTransport;
            var rtpSender;
            var rtpReceiver;
            var sendEncodingParameters;
            var recvEncodingParameters;
            var localCapabilities;

            var track;
            // FIXME: ensure the mediaSection has rtcp-mux set.
            var remoteCapabilities = SDPUtils.parseRtpParameters(mediaSection);
            var remoteIceParameters;
            var remoteDtlsParameters;
            if (!rejected) {
              remoteIceParameters = SDPUtils.getIceParameters(mediaSection,
                  sessionpart);
              remoteDtlsParameters = SDPUtils.getDtlsParameters(mediaSection,
                  sessionpart);
              remoteDtlsParameters.role = 'client';
            }
            recvEncodingParameters =
                SDPUtils.parseRtpEncodingParameters(mediaSection);

            var cname;
            // Gets the first SSRC. Note that with RTX there might be multiple
            // SSRCs.
            var remoteSsrc = SDPUtils.matchPrefix(mediaSection, 'a=ssrc:')
                .map(function(line) {
                  return SDPUtils.parseSsrcMedia(line);
                })
                .filter(function(obj) {
                  return obj.attribute === 'cname';
                })[0];
            if (remoteSsrc) {
              cname = remoteSsrc.value;
            }

            var isComplete = SDPUtils.matchPrefix(mediaSection,
                'a=end-of-candidates', sessionpart).length > 0;
            var cands = SDPUtils.matchPrefix(mediaSection, 'a=candidate:')
                .map(function(cand) {
                  return SDPUtils.parseCandidate(cand);
                })
                .filter(function(cand) {
                  return cand.component === '1';
                });
            if (description.type === 'offer' && !rejected) {
              var transports = self.usingBundle && sdpMLineIndex > 0 ? {
                iceGatherer: self.transceivers[0].iceGatherer,
                iceTransport: self.transceivers[0].iceTransport,
                dtlsTransport: self.transceivers[0].dtlsTransport
              } : self._createIceAndDtlsTransports(mid, sdpMLineIndex);

              if (isComplete) {
                transports.iceTransport.setRemoteCandidates(cands);
              }

              localCapabilities = RTCRtpReceiver.getCapabilities(kind);

              // filter RTX until additional stuff needed for RTX is implemented
              // in adapter.js
              localCapabilities.codecs = localCapabilities.codecs.filter(
                  function(codec) {
                    return codec.name !== 'rtx';
                  });

              sendEncodingParameters = [{
                ssrc: (2 * sdpMLineIndex + 2) * 1001
              }];

              rtpReceiver = new RTCRtpReceiver(transports.dtlsTransport, kind);

              track = rtpReceiver.track;
              receiverList.push([track, rtpReceiver]);
              // FIXME: not correct when there are multiple streams but that is
              // not currently supported in this shim.
              stream.addTrack(track);

              // FIXME: look at direction.
              if (self.localStreams.length > 0 &&
                  self.localStreams[0].getTracks().length >= sdpMLineIndex) {
                var localTrack;
                if (kind === 'audio') {
                  localTrack = self.localStreams[0].getAudioTracks()[0];
                } else if (kind === 'video') {
                  localTrack = self.localStreams[0].getVideoTracks()[0];
                }
                if (localTrack) {
                  rtpSender = new RTCRtpSender(localTrack,
                      transports.dtlsTransport);
                }
              }

              self.transceivers[sdpMLineIndex] = {
                iceGatherer: transports.iceGatherer,
                iceTransport: transports.iceTransport,
                dtlsTransport: transports.dtlsTransport,
                localCapabilities: localCapabilities,
                remoteCapabilities: remoteCapabilities,
                rtpSender: rtpSender,
                rtpReceiver: rtpReceiver,
                kind: kind,
                mid: mid,
                cname: cname,
                sendEncodingParameters: sendEncodingParameters,
                recvEncodingParameters: recvEncodingParameters
              };
              // Start the RTCRtpReceiver now. The RTPSender is started in
              // setLocalDescription.
              self._transceive(self.transceivers[sdpMLineIndex],
                  false,
                  direction === 'sendrecv' || direction === 'sendonly');
            } else if (description.type === 'answer' && !rejected) {
              transceiver = self.transceivers[sdpMLineIndex];
              iceGatherer = transceiver.iceGatherer;
              iceTransport = transceiver.iceTransport;
              dtlsTransport = transceiver.dtlsTransport;
              rtpSender = transceiver.rtpSender;
              rtpReceiver = transceiver.rtpReceiver;
              sendEncodingParameters = transceiver.sendEncodingParameters;
              localCapabilities = transceiver.localCapabilities;

              self.transceivers[sdpMLineIndex].recvEncodingParameters =
                  recvEncodingParameters;
              self.transceivers[sdpMLineIndex].remoteCapabilities =
                  remoteCapabilities;
              self.transceivers[sdpMLineIndex].cname = cname;

              if ((isIceLite || isComplete) && cands.length) {
                iceTransport.setRemoteCandidates(cands);
              }
              if (!self.usingBundle || sdpMLineIndex === 0) {
                iceTransport.start(iceGatherer, remoteIceParameters,
                    'controlling');
                dtlsTransport.start(remoteDtlsParameters);
              }

              self._transceive(transceiver,
                  direction === 'sendrecv' || direction === 'recvonly',
                  direction === 'sendrecv' || direction === 'sendonly');

              if (rtpReceiver &&
                  (direction === 'sendrecv' || direction === 'sendonly')) {
                track = rtpReceiver.track;
                receiverList.push([track, rtpReceiver]);
                stream.addTrack(track);
              } else {
                // FIXME: actually the receiver should be created later.
                delete transceiver.rtpReceiver;
              }
            }
          });

          this.remoteDescription = {
            type: description.type,
            sdp: description.sdp
          };
          switch (description.type) {
            case 'offer':
              this._updateSignalingState('have-remote-offer');
              break;
            case 'answer':
              this._updateSignalingState('stable');
              break;
            default:
              throw new TypeError('unsupported type "' + description.type +
                  '"');
          }
          if (stream.getTracks().length) {
            self.remoteStreams.push(stream);
            window.setTimeout(function() {
              var event = new Event('addstream');
              event.stream = stream;
              self.dispatchEvent(event);
              if (self.onaddstream !== null) {
                window.setTimeout(function() {
                  self.onaddstream(event);
                }, 0);
              }

              receiverList.forEach(function(item) {
                var track = item[0];
                var receiver = item[1];
                var trackEvent = new Event('track');
                trackEvent.track = track;
                trackEvent.receiver = receiver;
                trackEvent.streams = [stream];
                self.dispatchEvent(event);
                if (self.ontrack !== null) {
                  window.setTimeout(function() {
                    self.ontrack(trackEvent);
                  }, 0);
                }
              });
            }, 0);
          }
          if (arguments.length > 1 && typeof arguments[1] === 'function') {
            window.setTimeout(arguments[1], 0);
          }
          return Promise.resolve();
        };

    window.RTCPeerConnection.prototype.close = function() {
      this.transceivers.forEach(function(transceiver) {
        /* not yet
        if (transceiver.iceGatherer) {
          transceiver.iceGatherer.close();
        }
        */
        if (transceiver.iceTransport) {
          transceiver.iceTransport.stop();
        }
        if (transceiver.dtlsTransport) {
          transceiver.dtlsTransport.stop();
        }
        if (transceiver.rtpSender) {
          transceiver.rtpSender.stop();
        }
        if (transceiver.rtpReceiver) {
          transceiver.rtpReceiver.stop();
        }
      });
      // FIXME: clean up tracks, local streams, remote streams, etc
      this._updateSignalingState('closed');
    };

    // Update the signaling state.
    window.RTCPeerConnection.prototype._updateSignalingState =
        function(newState) {
          this.signalingState = newState;
          var event = new Event('signalingstatechange');
          this.dispatchEvent(event);
          if (this.onsignalingstatechange !== null) {
            this.onsignalingstatechange(event);
          }
        };

    // Determine whether to fire the negotiationneeded event.
    window.RTCPeerConnection.prototype._maybeFireNegotiationNeeded =
        function() {
          // Fire away (for now).
          var event = new Event('negotiationneeded');
          this.dispatchEvent(event);
          if (this.onnegotiationneeded !== null) {
            this.onnegotiationneeded(event);
          }
        };

    // Update the connection state.
    window.RTCPeerConnection.prototype._updateConnectionState = function() {
      var self = this;
      var newState;
      var states = {
        'new': 0,
        closed: 0,
        connecting: 0,
        checking: 0,
        connected: 0,
        completed: 0,
        failed: 0
      };
      this.transceivers.forEach(function(transceiver) {
        states[transceiver.iceTransport.state]++;
        states[transceiver.dtlsTransport.state]++;
      });
      // ICETransport.completed and connected are the same for this purpose.
      states.connected += states.completed;

      newState = 'new';
      if (states.failed > 0) {
        newState = 'failed';
      } else if (states.connecting > 0 || states.checking > 0) {
        newState = 'connecting';
      } else if (states.disconnected > 0) {
        newState = 'disconnected';
      } else if (states.new > 0) {
        newState = 'new';
      } else if (states.connected > 0 || states.completed > 0) {
        newState = 'connected';
      }

      if (newState !== self.iceConnectionState) {
        self.iceConnectionState = newState;
        var event = new Event('iceconnectionstatechange');
        this.dispatchEvent(event);
        if (this.oniceconnectionstatechange !== null) {
          this.oniceconnectionstatechange(event);
        }
      }
    };

    window.RTCPeerConnection.prototype.createOffer = function() {
      var self = this;
      if (this._pendingOffer) {
        throw new Error('createOffer called while there is a pending offer.');
      }
      var offerOptions;
      if (arguments.length === 1 && typeof arguments[0] !== 'function') {
        offerOptions = arguments[0];
      } else if (arguments.length === 3) {
        offerOptions = arguments[2];
      }

      var tracks = [];
      var numAudioTracks = 0;
      var numVideoTracks = 0;
      // Default to sendrecv.
      if (this.localStreams.length) {
        numAudioTracks = this.localStreams[0].getAudioTracks().length;
        numVideoTracks = this.localStreams[0].getVideoTracks().length;
      }
      // Determine number of audio and video tracks we need to send/recv.
      if (offerOptions) {
        // Reject Chrome legacy constraints.
        if (offerOptions.mandatory || offerOptions.optional) {
          throw new TypeError(
              'Legacy mandatory/optional constraints not supported.');
        }
        if (offerOptions.offerToReceiveAudio !== undefined) {
          numAudioTracks = offerOptions.offerToReceiveAudio;
        }
        if (offerOptions.offerToReceiveVideo !== undefined) {
          numVideoTracks = offerOptions.offerToReceiveVideo;
        }
      }
      if (this.localStreams.length) {
        // Push local streams.
        this.localStreams[0].getTracks().forEach(function(track) {
          tracks.push({
            kind: track.kind,
            track: track,
            wantReceive: track.kind === 'audio' ?
                numAudioTracks > 0 : numVideoTracks > 0
          });
          if (track.kind === 'audio') {
            numAudioTracks--;
          } else if (track.kind === 'video') {
            numVideoTracks--;
          }
        });
      }
      // Create M-lines for recvonly streams.
      while (numAudioTracks > 0 || numVideoTracks > 0) {
        if (numAudioTracks > 0) {
          tracks.push({
            kind: 'audio',
            wantReceive: true
          });
          numAudioTracks--;
        }
        if (numVideoTracks > 0) {
          tracks.push({
            kind: 'video',
            wantReceive: true
          });
          numVideoTracks--;
        }
      }

      var sdp = SDPUtils.writeSessionBoilerplate();
      var transceivers = [];
      tracks.forEach(function(mline, sdpMLineIndex) {
        // For each track, create an ice gatherer, ice transport,
        // dtls transport, potentially rtpsender and rtpreceiver.
        var track = mline.track;
        var kind = mline.kind;
        var mid = SDPUtils.generateIdentifier();

        var transports = self.usingBundle && sdpMLineIndex > 0 ? {
          iceGatherer: transceivers[0].iceGatherer,
          iceTransport: transceivers[0].iceTransport,
          dtlsTransport: transceivers[0].dtlsTransport
        } : self._createIceAndDtlsTransports(mid, sdpMLineIndex);

        var localCapabilities = RTCRtpSender.getCapabilities(kind);
        // filter RTX until additional stuff needed for RTX is implemented
        // in adapter.js
        localCapabilities.codecs = localCapabilities.codecs.filter(
            function(codec) {
              return codec.name !== 'rtx';
            });
        localCapabilities.codecs.forEach(function(codec) {
          // work around https://bugs.chromium.org/p/webrtc/issues/detail?id=6552
          // by adding level-asymmetry-allowed=1
          if (codec.name === 'H264' &&
              codec.parameters['level-asymmetry-allowed'] === undefined) {
            codec.parameters['level-asymmetry-allowed'] = '1';
          }
        });

        var rtpSender;
        var rtpReceiver;

        // generate an ssrc now, to be used later in rtpSender.send
        var sendEncodingParameters = [{
          ssrc: (2 * sdpMLineIndex + 1) * 1001
        }];
        if (track) {
          rtpSender = new RTCRtpSender(track, transports.dtlsTransport);
        }

        if (mline.wantReceive) {
          rtpReceiver = new RTCRtpReceiver(transports.dtlsTransport, kind);
        }

        transceivers[sdpMLineIndex] = {
          iceGatherer: transports.iceGatherer,
          iceTransport: transports.iceTransport,
          dtlsTransport: transports.dtlsTransport,
          localCapabilities: localCapabilities,
          remoteCapabilities: null,
          rtpSender: rtpSender,
          rtpReceiver: rtpReceiver,
          kind: kind,
          mid: mid,
          sendEncodingParameters: sendEncodingParameters,
          recvEncodingParameters: null
        };
      });
      if (this.usingBundle) {
        sdp += 'a=group:BUNDLE ' + transceivers.map(function(t) {
          return t.mid;
        }).join(' ') + '\r\n';
      }
      tracks.forEach(function(mline, sdpMLineIndex) {
        var transceiver = transceivers[sdpMLineIndex];
        sdp += SDPUtils.writeMediaSection(transceiver,
            transceiver.localCapabilities, 'offer', self.localStreams[0]);
      });

      this._pendingOffer = transceivers;
      var desc = new RTCSessionDescription({
        type: 'offer',
        sdp: sdp
      });
      if (arguments.length && typeof arguments[0] === 'function') {
        window.setTimeout(arguments[0], 0, desc);
      }
      return Promise.resolve(desc);
    };

    window.RTCPeerConnection.prototype.createAnswer = function() {
      var self = this;

      var sdp = SDPUtils.writeSessionBoilerplate();
      if (this.usingBundle) {
        sdp += 'a=group:BUNDLE ' + this.transceivers.map(function(t) {
          return t.mid;
        }).join(' ') + '\r\n';
      }
      this.transceivers.forEach(function(transceiver) {
        if (transceiver.isDatachannel) {
          sdp += 'm=application 0 DTLS/SCTP 5000\r\n' +
              'c=IN IP4 0.0.0.0\r\n' +
              'a=mid:' + transceiver.mid + '\r\n';
          return;
        }
        // Calculate intersection of capabilities.
        var commonCapabilities = self._getCommonCapabilities(
            transceiver.localCapabilities,
            transceiver.remoteCapabilities);

        sdp += SDPUtils.writeMediaSection(transceiver, commonCapabilities,
            'answer', self.localStreams[0]);
      });

      var desc = new RTCSessionDescription({
        type: 'answer',
        sdp: sdp
      });
      if (arguments.length && typeof arguments[0] === 'function') {
        window.setTimeout(arguments[0], 0, desc);
      }
      return Promise.resolve(desc);
    };

    window.RTCPeerConnection.prototype.addIceCandidate = function(candidate) {
      if (!candidate) {
        this.transceivers.forEach(function(transceiver) {
          transceiver.iceTransport.addRemoteCandidate({});
        });
      } else {
        var mLineIndex = candidate.sdpMLineIndex;
        if (candidate.sdpMid) {
          for (var i = 0; i < this.transceivers.length; i++) {
            if (this.transceivers[i].mid === candidate.sdpMid) {
              mLineIndex = i;
              break;
            }
          }
        }
        var transceiver = this.transceivers[mLineIndex];
        if (transceiver) {
          var cand = Object.keys(candidate.candidate).length > 0 ?
              SDPUtils.parseCandidate(candidate.candidate) : {};
          // Ignore Chrome's invalid candidates since Edge does not like them.
          if (cand.protocol === 'tcp' && (cand.port === 0 || cand.port === 9)) {
            return;
          }
          // Ignore RTCP candidates, we assume RTCP-MUX.
          if (cand.component !== '1') {
            return;
          }
          // A dirty hack to make samples work.
          if (cand.type === 'endOfCandidates') {
            cand = {};
          }
          transceiver.iceTransport.addRemoteCandidate(cand);

          // update the remoteDescription.
          var sections = SDPUtils.splitSections(this.remoteDescription.sdp);
          sections[mLineIndex + 1] += (cand.type ? candidate.candidate.trim()
              : 'a=end-of-candidates') + '\r\n';
          this.remoteDescription.sdp = sections.join('');
        }
      }
      if (arguments.length > 1 && typeof arguments[1] === 'function') {
        window.setTimeout(arguments[1], 0);
      }
      return Promise.resolve();
    };

    window.RTCPeerConnection.prototype.getStats = function() {
      var promises = [];
      this.transceivers.forEach(function(transceiver) {
        ['rtpSender', 'rtpReceiver', 'iceGatherer', 'iceTransport',
            'dtlsTransport'].forEach(function(method) {
              if (transceiver[method]) {
                promises.push(transceiver[method].getStats());
              }
            });
      });
      var cb = arguments.length > 1 && typeof arguments[1] === 'function' &&
          arguments[1];
      return new Promise(function(resolve) {
        // shim getStats with maplike support
        var results = new Map();
        Promise.all(promises).then(function(res) {
          res.forEach(function(result) {
            Object.keys(result).forEach(function(id) {
              results.set(id, result[id]);
              results[id] = result[id];
            });
          });
          if (cb) {
            window.setTimeout(cb, 0, results);
          }
          resolve(results);
        });
      });
    };
  }
};

// Expose public methods.
module.exports = {
  shimPeerConnection: edgeShim.shimPeerConnection,
  shimGetUserMedia: require('./getusermedia')
};

},{"../utils":196,"./getusermedia":192,"sdp":155}],192:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

// Expose public methods.
module.exports = function() {
  var shimError_ = function(e) {
    return {
      name: {PermissionDeniedError: 'NotAllowedError'}[e.name] || e.name,
      message: e.message,
      constraint: e.constraint,
      toString: function() {
        return this.name;
      }
    };
  };

  // getUserMedia error shim.
  var origGetUserMedia = navigator.mediaDevices.getUserMedia.
      bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia = function(c) {
    return origGetUserMedia(c).catch(function(e) {
      return Promise.reject(shimError_(e));
    });
  };
};

},{}],193:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

var browserDetails = require('../utils').browserDetails;

var firefoxShim = {
  shimOnTrack: function() {
    if (typeof window === 'object' && window.RTCPeerConnection && !('ontrack' in
        window.RTCPeerConnection.prototype)) {
      Object.defineProperty(window.RTCPeerConnection.prototype, 'ontrack', {
        get: function() {
          return this._ontrack;
        },
        set: function(f) {
          if (this._ontrack) {
            this.removeEventListener('track', this._ontrack);
            this.removeEventListener('addstream', this._ontrackpoly);
          }
          this.addEventListener('track', this._ontrack = f);
          this.addEventListener('addstream', this._ontrackpoly = function(e) {
            e.stream.getTracks().forEach(function(track) {
              var event = new Event('track');
              event.track = track;
              event.receiver = {track: track};
              event.streams = [e.stream];
              this.dispatchEvent(event);
            }.bind(this));
          }.bind(this));
        }
      });
    }
  },

  shimSourceObject: function() {
    // Firefox has supported mozSrcObject since FF22, unprefixed in 42.
    if (typeof window === 'object') {
      if (window.HTMLMediaElement &&
        !('srcObject' in window.HTMLMediaElement.prototype)) {
        // Shim the srcObject property, once, when HTMLMediaElement is found.
        Object.defineProperty(window.HTMLMediaElement.prototype, 'srcObject', {
          get: function() {
            return this.mozSrcObject;
          },
          set: function(stream) {
            this.mozSrcObject = stream;
          }
        });
      }
    }
  },

  shimPeerConnection: function() {
    if (typeof window !== 'object' || !(window.RTCPeerConnection ||
        window.mozRTCPeerConnection)) {
      return; // probably media.peerconnection.enabled=false in about:config
    }
    // The RTCPeerConnection object.
    if (!window.RTCPeerConnection) {
      window.RTCPeerConnection = function(pcConfig, pcConstraints) {
        if (browserDetails.version < 38) {
          // .urls is not supported in FF < 38.
          // create RTCIceServers with a single url.
          if (pcConfig && pcConfig.iceServers) {
            var newIceServers = [];
            for (var i = 0; i < pcConfig.iceServers.length; i++) {
              var server = pcConfig.iceServers[i];
              if (server.hasOwnProperty('urls')) {
                for (var j = 0; j < server.urls.length; j++) {
                  var newServer = {
                    url: server.urls[j]
                  };
                  if (server.urls[j].indexOf('turn') === 0) {
                    newServer.username = server.username;
                    newServer.credential = server.credential;
                  }
                  newIceServers.push(newServer);
                }
              } else {
                newIceServers.push(pcConfig.iceServers[i]);
              }
            }
            pcConfig.iceServers = newIceServers;
          }
        }
        return new mozRTCPeerConnection(pcConfig, pcConstraints);
      };
      window.RTCPeerConnection.prototype = mozRTCPeerConnection.prototype;

      // wrap static methods. Currently just generateCertificate.
      if (mozRTCPeerConnection.generateCertificate) {
        Object.defineProperty(window.RTCPeerConnection, 'generateCertificate', {
          get: function() {
            return mozRTCPeerConnection.generateCertificate;
          }
        });
      }

      window.RTCSessionDescription = mozRTCSessionDescription;
      window.RTCIceCandidate = mozRTCIceCandidate;
    }

    // shim away need for obsolete RTCIceCandidate/RTCSessionDescription.
    ['setLocalDescription', 'setRemoteDescription', 'addIceCandidate']
        .forEach(function(method) {
          var nativeMethod = RTCPeerConnection.prototype[method];
          RTCPeerConnection.prototype[method] = function() {
            arguments[0] = new ((method === 'addIceCandidate') ?
                RTCIceCandidate : RTCSessionDescription)(arguments[0]);
            return nativeMethod.apply(this, arguments);
          };
        });

    // support for addIceCandidate(null or undefined)
    var nativeAddIceCandidate =
        RTCPeerConnection.prototype.addIceCandidate;
    RTCPeerConnection.prototype.addIceCandidate = function() {
      if (!arguments[0]) {
        if (arguments[1]) {
          arguments[1].apply(null);
        }
        return Promise.resolve();
      }
      return nativeAddIceCandidate.apply(this, arguments);
    };

    if (browserDetails.version < 48) {
      // shim getStats with maplike support
      var makeMapStats = function(stats) {
        var map = new Map();
        Object.keys(stats).forEach(function(key) {
          map.set(key, stats[key]);
          map[key] = stats[key];
        });
        return map;
      };

      var nativeGetStats = RTCPeerConnection.prototype.getStats;
      RTCPeerConnection.prototype.getStats = function(selector, onSucc, onErr) {
        return nativeGetStats.apply(this, [selector || null])
          .then(function(stats) {
            return makeMapStats(stats);
          })
          .then(onSucc, onErr);
      };
    }
  }
};

// Expose public methods.
module.exports = {
  shimOnTrack: firefoxShim.shimOnTrack,
  shimSourceObject: firefoxShim.shimSourceObject,
  shimPeerConnection: firefoxShim.shimPeerConnection,
  shimGetUserMedia: require('./getusermedia')
};

},{"../utils":196,"./getusermedia":194}],194:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

var logging = require('../utils').log;
var browserDetails = require('../utils').browserDetails;

// Expose public methods.
module.exports = function() {
  var shimError_ = function(e) {
    return {
      name: {
        SecurityError: 'NotAllowedError',
        PermissionDeniedError: 'NotAllowedError'
      }[e.name] || e.name,
      message: {
        'The operation is insecure.': 'The request is not allowed by the ' +
        'user agent or the platform in the current context.'
      }[e.message] || e.message,
      constraint: e.constraint,
      toString: function() {
        return this.name + (this.message && ': ') + this.message;
      }
    };
  };

  // getUserMedia constraints shim.
  var getUserMedia_ = function(constraints, onSuccess, onError) {
    var constraintsToFF37_ = function(c) {
      if (typeof c !== 'object' || c.require) {
        return c;
      }
      var require = [];
      Object.keys(c).forEach(function(key) {
        if (key === 'require' || key === 'advanced' || key === 'mediaSource') {
          return;
        }
        var r = c[key] = (typeof c[key] === 'object') ?
            c[key] : {ideal: c[key]};
        if (r.min !== undefined ||
            r.max !== undefined || r.exact !== undefined) {
          require.push(key);
        }
        if (r.exact !== undefined) {
          if (typeof r.exact === 'number') {
            r. min = r.max = r.exact;
          } else {
            c[key] = r.exact;
          }
          delete r.exact;
        }
        if (r.ideal !== undefined) {
          c.advanced = c.advanced || [];
          var oc = {};
          if (typeof r.ideal === 'number') {
            oc[key] = {min: r.ideal, max: r.ideal};
          } else {
            oc[key] = r.ideal;
          }
          c.advanced.push(oc);
          delete r.ideal;
          if (!Object.keys(r).length) {
            delete c[key];
          }
        }
      });
      if (require.length) {
        c.require = require;
      }
      return c;
    };
    constraints = JSON.parse(JSON.stringify(constraints));
    if (browserDetails.version < 38) {
      logging('spec: ' + JSON.stringify(constraints));
      if (constraints.audio) {
        constraints.audio = constraintsToFF37_(constraints.audio);
      }
      if (constraints.video) {
        constraints.video = constraintsToFF37_(constraints.video);
      }
      logging('ff37: ' + JSON.stringify(constraints));
    }
    return navigator.mozGetUserMedia(constraints, onSuccess, function(e) {
      onError(shimError_(e));
    });
  };

  // Returns the result of getUserMedia as a Promise.
  var getUserMediaPromise_ = function(constraints) {
    return new Promise(function(resolve, reject) {
      getUserMedia_(constraints, resolve, reject);
    });
  };

  // Shim for mediaDevices on older versions.
  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {getUserMedia: getUserMediaPromise_,
      addEventListener: function() { },
      removeEventListener: function() { }
    };
  }
  navigator.mediaDevices.enumerateDevices =
      navigator.mediaDevices.enumerateDevices || function() {
        return new Promise(function(resolve) {
          var infos = [
            {kind: 'audioinput', deviceId: 'default', label: '', groupId: ''},
            {kind: 'videoinput', deviceId: 'default', label: '', groupId: ''}
          ];
          resolve(infos);
        });
      };

  if (browserDetails.version < 41) {
    // Work around http://bugzil.la/1169665
    var orgEnumerateDevices =
        navigator.mediaDevices.enumerateDevices.bind(navigator.mediaDevices);
    navigator.mediaDevices.enumerateDevices = function() {
      return orgEnumerateDevices().then(undefined, function(e) {
        if (e.name === 'NotFoundError') {
          return [];
        }
        throw e;
      });
    };
  }
  if (browserDetails.version < 49) {
    var origGetUserMedia = navigator.mediaDevices.getUserMedia.
        bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function(c) {
      return origGetUserMedia(c).then(function(stream) {
        // Work around https://bugzil.la/802326
        if (c.audio && !stream.getAudioTracks().length ||
            c.video && !stream.getVideoTracks().length) {
          stream.getTracks().forEach(function(track) {
            track.stop();
          });
          throw new DOMException('The object can not be found here.',
                                 'NotFoundError');
        }
        return stream;
      }, function(e) {
        return Promise.reject(shimError_(e));
      });
    };
  }
  navigator.getUserMedia = function(constraints, onSuccess, onError) {
    if (browserDetails.version < 44) {
      return getUserMedia_(constraints, onSuccess, onError);
    }
    // Replace Firefox 44+'s deprecation warning with unprefixed version.
    console.warn('navigator.getUserMedia has been replaced by ' +
                 'navigator.mediaDevices.getUserMedia');
    navigator.mediaDevices.getUserMedia(constraints).then(onSuccess, onError);
  };
};

},{"../utils":196}],195:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
'use strict';
var safariShim = {
  // TODO: DrAlex, should be here, double check against LayoutTests
  // shimOnTrack: function() { },

  // TODO: once the back-end for the mac port is done, add.
  // TODO: check for webkitGTK+
  // shimPeerConnection: function() { },

  shimGetUserMedia: function() {
    navigator.getUserMedia = navigator.webkitGetUserMedia;
  }
};

// Expose public methods.
module.exports = {
  shimGetUserMedia: safariShim.shimGetUserMedia
  // TODO
  // shimOnTrack: safariShim.shimOnTrack,
  // shimPeerConnection: safariShim.shimPeerConnection
};

},{}],196:[function(require,module,exports){
/*
 *  Copyright (c) 2016 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */
 /* eslint-env node */
'use strict';

var logDisabled_ = true;

// Utility methods.
var utils = {
  disableLog: function(bool) {
    if (typeof bool !== 'boolean') {
      return new Error('Argument type: ' + typeof bool +
          '. Please use a boolean.');
    }
    logDisabled_ = bool;
    return (bool) ? 'adapter.js logging disabled' :
        'adapter.js logging enabled';
  },

  log: function() {
    if (typeof window === 'object') {
      if (logDisabled_) {
        return;
      }
      if (typeof console !== 'undefined' && typeof console.log === 'function') {
        console.log.apply(console, arguments);
      }
    }
  },

  /**
   * Extract browser version out of the provided user agent string.
   *
   * @param {!string} uastring userAgent string.
   * @param {!string} expr Regular expression used as match criteria.
   * @param {!number} pos position in the version string to be returned.
   * @return {!number} browser version.
   */
  extractVersion: function(uastring, expr, pos) {
    var match = uastring.match(expr);
    return match && match.length >= pos && parseInt(match[pos], 10);
  },

  /**
   * Browser detector.
   *
   * @return {object} result containing browser and version
   *     properties.
   */
  detectBrowser: function() {
    // Returned result object.
    var result = {};
    result.browser = null;
    result.version = null;

    // Fail early if it's not a browser
    if (typeof window === 'undefined' || !window.navigator) {
      result.browser = 'Not a browser.';
      return result;
    }

    // Firefox.
    if (navigator.mozGetUserMedia) {
      result.browser = 'firefox';
      result.version = this.extractVersion(navigator.userAgent,
          /Firefox\/([0-9]+)\./, 1);

    // all webkit-based browsers
    } else if (navigator.webkitGetUserMedia) {
      // Chrome, Chromium, Webview, Opera, all use the chrome shim for now
      if (window.webkitRTCPeerConnection) {
        result.browser = 'chrome';
        result.version = this.extractVersion(navigator.userAgent,
          /Chrom(e|ium)\/([0-9]+)\./, 2);

      // Safari or unknown webkit-based
      // for the time being Safari has support for MediaStreams but not webRTC
      } else {
        // Safari UA substrings of interest for reference:
        // - webkit version:           AppleWebKit/602.1.25 (also used in Op,Cr)
        // - safari UI version:        Version/9.0.3 (unique to Safari)
        // - safari UI webkit version: Safari/601.4.4 (also used in Op,Cr)
        //
        // if the webkit version and safari UI webkit versions are equals,
        // ... this is a stable version.
        //
        // only the internal webkit version is important today to know if
        // media streams are supported
        //
        if (navigator.userAgent.match(/Version\/(\d+).(\d+)/)) {
          result.browser = 'safari';
          result.version = this.extractVersion(navigator.userAgent,
            /AppleWebKit\/([0-9]+)\./, 1);

        // unknown webkit-based browser
        } else {
          result.browser = 'Unsupported webkit-based browser ' +
              'with GUM support but no WebRTC support.';
          return result;
        }
      }

    // Edge.
    } else if (navigator.mediaDevices &&
        navigator.userAgent.match(/Edge\/(\d+).(\d+)$/)) {
      result.browser = 'edge';
      result.version = this.extractVersion(navigator.userAgent,
          /Edge\/(\d+).(\d+)$/, 2);

    // Default fallthrough: not supported.
    } else {
      result.browser = 'Not a supported browser.';
      return result;
    }

    return result;
  }
};

// Export.
module.exports = {
  log: utils.log,
  disableLog: utils.disableLog,
  browserDetails: utils.detectBrowser(),
  extractVersion: utils.extractVersion
};

},{}],197:[function(require,module,exports){
(function (process,global){
'use strict'

var Transform = require('readable-stream').Transform
var duplexify = require('duplexify')
var WS = require('ws')
var Buffer = require('safe-buffer').Buffer

module.exports = WebSocketStream

function buildProxy (options, socketWrite, socketEnd) {
  var proxy = new Transform({
    objectMode: options.objectMode
  })

  proxy._write = socketWrite
  proxy._flush = socketEnd

  return proxy
}

function WebSocketStream(target, protocols, options) {
  var stream, socket

  var isBrowser = process.title === 'browser'
  var isNative = !!global.WebSocket
  var socketWrite = isBrowser ? socketWriteBrowser : socketWriteNode

  if (protocols && !Array.isArray(protocols) && 'object' === typeof protocols) {
    // accept the "options" Object as the 2nd argument
    options = protocols
    protocols = null

    if (typeof options.protocol === 'string' || Array.isArray(options.protocol)) {
      protocols = options.protocol;
    }
  }

  if (!options) options = {}

  if (options.objectMode === undefined) {
    options.objectMode = !(options.binary === true || options.binary === undefined)
  }

  var proxy = buildProxy(options, socketWrite, socketEnd)

  if (!options.objectMode) {
    proxy._writev = writev
  }

  // browser only: sets the maximum socket buffer size before throttling
  var bufferSize = options.browserBufferSize || 1024 * 512

  // browser only: how long to wait when throttling
  var bufferTimeout = options.browserBufferTimeout || 1000

  // use existing WebSocket object that was passed in
  if (typeof target === 'object') {
    socket = target
  // otherwise make a new one
  } else {
    // special constructor treatment for native websockets in browsers, see
    // https://github.com/maxogden/websocket-stream/issues/82
    if (isNative && isBrowser) {
      socket = new WS(target, protocols)
    } else {
      socket = new WS(target, protocols, options)
    }

    socket.binaryType = 'arraybuffer'
  }
  
  // according to https://github.com/baygeldin/ws-streamify/issues/1
  // Nodejs WebSocketServer cause memory leak
  // Handlers like onerror, onclose, onmessage and onopen are accessible via setter/getter
  // And setter first of all fires removeAllListeners, that doesnt make inner array of clients on WebSocketServer cleared ever
  var eventListenerSupport = ('undefined' === typeof socket.addEventListener)

  // was already open when passed in
  if (socket.readyState === socket.OPEN) {
    stream = proxy
  } else {
    stream = stream = duplexify(undefined, undefined, options)
    if (!options.objectMode) {
      stream._writev = writev
    }
    
    if (eventListenerSupport) {
       socket.addEventListener('open', onopen)
    } else {
       socket.onopen = onopen
    }
  }

  stream.socket = socket

  if (eventListenerSupport) {
     socket.addEventListener('close', onclose)
     socket.addEventListener('error', onerror)
     socket.addEventListener('message', onmessage)
  } else {
     socket.onclose = onclose
     socket.onerror = onerror
     socket.onmessage = onmessage
  }

  proxy.on('close', destroy)

  var coerceToBuffer = !options.objectMode

  function socketWriteNode(chunk, enc, next) {
    // avoid errors, this never happens unless
    // destroy() is called
    if (socket.readyState !== socket.OPEN) {
      next()
      return
    }

    if (coerceToBuffer && typeof chunk === 'string') {
      chunk = Buffer.from(chunk, 'utf8')
    }
    socket.send(chunk, next)
  }

  function socketWriteBrowser(chunk, enc, next) {
    if (socket.bufferedAmount > bufferSize) {
      setTimeout(socketWriteBrowser, bufferTimeout, chunk, enc, next)
      return
    }

    if (coerceToBuffer && typeof chunk === 'string') {
      chunk = Buffer.from(chunk, 'utf8')
    }

    try {
      socket.send(chunk)
    } catch(err) {
      return next(err)
    }

    next()
  }

  function socketEnd(done) {
    socket.close()
    done()
  }

  function onopen() {
    stream.setReadable(proxy)
    stream.setWritable(proxy)
    stream.emit('connect')
  }

  function onclose() {
    stream.end()
    stream.destroy()
  }

  function onerror(err) {
    stream.destroy(err)
  }

  function onmessage(event) {
    var data = event.data
    if (data instanceof ArrayBuffer) data = Buffer.from(data)
    else data = Buffer.from(data, 'utf8')
    proxy.push(data)
  }

  function destroy() {
    socket.close()
  }

  // this is to be enabled only if objectMode is false
  function writev (chunks, cb) {
    var buffers = new Array(chunks.length)
    for (var i = 0; i < chunks.length; i++) {
      if (typeof chunks[i].chunk === 'string') {
        buffers[i] = Buffer.from(chunks[i], 'utf8')
      } else {
        buffers[i] = chunks[i].chunk
      }
    }

    this._write(Buffer.concat(buffers), 'binary', cb)
  }

  return stream
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":17,"duplexify":54,"readable-stream":152,"safe-buffer":154,"ws":198}],198:[function(require,module,exports){

var ws = null

if (typeof WebSocket !== 'undefined') {
  ws = WebSocket
} else if (typeof MozWebSocket !== 'undefined') {
  ws = MozWebSocket
} else if (typeof window !== 'undefined') {
  ws = window.WebSocket || window.MozWebSocket
}

module.exports = ws

},{}],199:[function(require,module,exports){
var bundleFn = arguments[3];
var sources = arguments[4];
var cache = arguments[5];

var stringify = JSON.stringify;

module.exports = function (fn, options) {
    var wkey;
    var cacheKeys = Object.keys(cache);

    for (var i = 0, l = cacheKeys.length; i < l; i++) {
        var key = cacheKeys[i];
        var exp = cache[key].exports;
        // Using babel as a transpiler to use esmodule, the export will always
        // be an object with the default export as a property of it. To ensure
        // the existing api and babel esmodule exports are both supported we
        // check for both
        if (exp === fn || exp && exp.default === fn) {
            wkey = key;
            break;
        }
    }

    if (!wkey) {
        wkey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);
        var wcache = {};
        for (var i = 0, l = cacheKeys.length; i < l; i++) {
            var key = cacheKeys[i];
            wcache[key] = key;
        }
        sources[wkey] = [
            'function(require,module,exports){' + fn + '(self); }',
            wcache
        ];
    }
    var skey = Math.floor(Math.pow(16, 8) * Math.random()).toString(16);

    var scache = {}; scache[wkey] = wkey;
    sources[skey] = [
        'function(require,module,exports){' +
            // try to call default if defined to also support babel esmodule exports
            'var f = require(' + stringify(wkey) + ');' +
            '(f.default ? f.default : f)(self);' +
        '}',
        scache
    ];

    var workerSources = {};
    resolveSources(skey);

    function resolveSources(key) {
        workerSources[key] = true;

        for (var depPath in sources[key][1]) {
            var depKey = sources[key][1][depPath];
            if (!workerSources[depKey]) {
                resolveSources(depKey);
            }
        }
    }

    var src = '(' + bundleFn + ')({'
        + Object.keys(workerSources).map(function (key) {
            return stringify(key) + ':['
                + sources[key][0]
                + ',' + stringify(sources[key][1]) + ']'
            ;
        }).join(',')
        + '},{},[' + stringify(skey) + '])'
    ;

    var URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

    var blob = new Blob([src], { type: 'text/javascript' });
    if (options && options.bare) { return blob; }
    var workerUrl = URL.createObjectURL(blob);
    var worker = new Worker(workerUrl);
    worker.objectURL = workerUrl;
    return worker;
};

},{}],200:[function(require,module,exports){
/*
WildEmitter.js is a slim little event emitter by @henrikjoreteg largely based
on @visionmedia's Emitter from UI Kit.

Why? I wanted it standalone.

I also wanted support for wildcard emitters like this:

emitter.on('*', function (eventName, other, event, payloads) {

});

emitter.on('somenamespace*', function (eventName, payloads) {

});

Please note that callbacks triggered by wildcard registered events also get
the event name as the first argument.
*/

module.exports = WildEmitter;

function WildEmitter() { }

WildEmitter.mixin = function (constructor) {
    var prototype = constructor.prototype || constructor;

    prototype.isWildEmitter= true;

    // Listen on the given `event` with `fn`. Store a group name if present.
    prototype.on = function (event, groupName, fn) {
        this.callbacks = this.callbacks || {};
        var hasGroup = (arguments.length === 3),
            group = hasGroup ? arguments[1] : undefined,
            func = hasGroup ? arguments[2] : arguments[1];
        func._groupName = group;
        (this.callbacks[event] = this.callbacks[event] || []).push(func);
        return this;
    };

    // Adds an `event` listener that will be invoked a single
    // time then automatically removed.
    prototype.once = function (event, groupName, fn) {
        var self = this,
            hasGroup = (arguments.length === 3),
            group = hasGroup ? arguments[1] : undefined,
            func = hasGroup ? arguments[2] : arguments[1];
        function on() {
            self.off(event, on);
            func.apply(this, arguments);
        }
        this.on(event, group, on);
        return this;
    };

    // Unbinds an entire group
    prototype.releaseGroup = function (groupName) {
        this.callbacks = this.callbacks || {};
        var item, i, len, handlers;
        for (item in this.callbacks) {
            handlers = this.callbacks[item];
            for (i = 0, len = handlers.length; i < len; i++) {
                if (handlers[i]._groupName === groupName) {
                    //console.log('removing');
                    // remove it and shorten the array we're looping through
                    handlers.splice(i, 1);
                    i--;
                    len--;
                }
            }
        }
        return this;
    };

    // Remove the given callback for `event` or all
    // registered callbacks.
    prototype.off = function (event, fn) {
        this.callbacks = this.callbacks || {};
        var callbacks = this.callbacks[event],
            i;

        if (!callbacks) return this;

        // remove all handlers
        if (arguments.length === 1) {
            delete this.callbacks[event];
            return this;
        }

        // remove specific handler
        i = callbacks.indexOf(fn);
        if (i !== -1) {
            callbacks.splice(i, 1);
            if (callbacks.length === 0) {
                delete this.callbacks[event];
            }
        }
        return this;
    };

    /// Emit `event` with the given args.
    // also calls any `*` handlers
    prototype.emit = function (event) {
        this.callbacks = this.callbacks || {};
        var args = [].slice.call(arguments, 1),
            callbacks = this.callbacks[event],
            specialCallbacks = this.getWildcardCallbacks(event),
            i,
            len,
            item,
            listeners;

        if (callbacks) {
            listeners = callbacks.slice();
            for (i = 0, len = listeners.length; i < len; ++i) {
                if (!listeners[i]) {
                    break;
                }
                listeners[i].apply(this, args);
            }
        }

        if (specialCallbacks) {
            len = specialCallbacks.length;
            listeners = specialCallbacks.slice();
            for (i = 0, len = listeners.length; i < len; ++i) {
                if (!listeners[i]) {
                    break;
                }
                listeners[i].apply(this, [event].concat(args));
            }
        }

        return this;
    };

    // Helper for for finding special wildcard event handlers that match the event
    prototype.getWildcardCallbacks = function (eventName) {
        this.callbacks = this.callbacks || {};
        var item,
            split,
            result = [];

        for (item in this.callbacks) {
            split = item.split('*');
            if (item === '*' || (split.length === 2 && eventName.slice(0, split[0].length) === split[0])) {
                result = result.concat(this.callbacks[item]);
            }
        }
        return result;
    };

};

WildEmitter.mixin(WildEmitter);

},{}],201:[function(require,module,exports){
// Returns a wrapper function that returns a wrapped callback
// The wrapper function should do some stuff, and return a
// presumably different callback function.
// This makes sure that own properties are retained, so that
// decorations and such are not lost along the way.
module.exports = wrappy
function wrappy (fn, cb) {
  if (fn && cb) return wrappy(fn)(cb)

  if (typeof fn !== 'function')
    throw new TypeError('need wrapper function')

  Object.keys(fn).forEach(function (k) {
    wrapper[k] = fn[k]
  })

  return wrapper

  function wrapper() {
    var args = new Array(arguments.length)
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }
    var ret = fn.apply(this, args)
    var cb = args[args.length-1]
    if (typeof ret === 'function' && ret !== cb) {
      Object.keys(cb).forEach(function (k) {
        ret[k] = cb[k]
      })
    }
    return ret
  }
}

},{}],202:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],203:[function(require,module,exports){
(function (process){
module.exports = function (self) {
    onmessage = function (e) {
        switch (e.data.command) {
            case "init":
                init(e.data.inputSampleRate);
                break;
            case "process":
                process(e.data.inputFrame);
                break;
            case "reset":
                reset();
                break;
        }
    };

    let inputSampleRate;
    let inputBuffer = [];

    function init(x) {
        inputSampleRate = x;
    }

    function process(inputFrame) {
        for (let i = 0; i < inputFrame.length; i++) {
            inputBuffer.push((inputFrame[i]) * 32767);
        }

        const PV_SAMPLE_RATE = 16000;
        const PV_FRAME_LENGTH = 512;

        while ((inputBuffer.length * PV_SAMPLE_RATE / inputSampleRate) > PV_FRAME_LENGTH) {
            let outputFrame = new Int16Array(PV_FRAME_LENGTH);
            let sum = 0;
            let num = 0;
            let outputIndex = 0;
            let inputIndex = 0;

            while (outputIndex < PV_FRAME_LENGTH) {
                sum = 0;
                num = 0;
                while (inputIndex < Math.min(inputBuffer.length, (outputIndex + 1) * inputSampleRate / PV_SAMPLE_RATE)) {
                    sum += inputBuffer[inputIndex];
                    num++;
                    inputIndex++;
                }
                outputFrame[outputIndex] = sum / num;
                outputIndex++;
            }

            postMessage(outputFrame);

            inputBuffer = inputBuffer.slice(inputIndex);
        }
    }

    function reset() {
        inputBuffer = [];
    }
}

}).call(this,require('_process'))
},{"_process":17}],204:[function(require,module,exports){
const KEYWORDS_ID = {
    "Hey Edison": new Uint8Array([
        0x76, 0xed, 0x94, 0x87, 0x9f, 0xdc, 0x24, 0xc9, 0x38, 0xef, 0x91, 0xed,
        0xb4, 0x5d, 0x02, 0x8d, 0x34, 0x19, 0x92, 0xb9, 0x40, 0x39, 0xd7, 0xe8,
        0xce, 0x7e, 0x51, 0xe1, 0x94, 0xdc, 0xe9, 0x7d, 0xd0, 0x14, 0x9b, 0x63,
        0xfa, 0x6f, 0x55, 0x3e, 0x89, 0xd5, 0x62, 0x7e, 0x5f, 0x99, 0x48, 0x34,
        0x6f, 0xf9, 0x2c, 0xd5, 0xc5, 0x7b, 0x6e, 0x46, 0xe4, 0xd8, 0x73, 0x46,
        0x97, 0x62, 0x19, 0x82, 0x39, 0xde, 0x51, 0x70, 0xd7, 0xe5, 0x7f, 0xe8,
        0xa5, 0xc5, 0xc0, 0x9c, 0xc9, 0xf4, 0x89, 0x14, 0x32, 0x6d, 0x09, 0xee,
        0x3a, 0xf7, 0xde, 0x26, 0xe5, 0xbb, 0xf1, 0xce, 0x0a, 0x15, 0x29, 0x7c,
        0xc0, 0x3f, 0x18, 0x18, 0x30, 0xb0, 0x35, 0x68, 0xd9, 0x86, 0xe9, 0xa0,
        0xc6, 0xec, 0x8c, 0xac, 0x64, 0x86, 0x92, 0x48, 0x0c, 0x34, 0xbc, 0xd6,
        0xe5, 0x89, 0x3d, 0x99, 0x55, 0x1c, 0xd9, 0xd9, 0xb6, 0x93, 0xf5, 0x97,
        0xf7, 0x09, 0xe2, 0xca, 0xa5, 0xb8, 0x48, 0x27, 0x25, 0xa7, 0x34, 0x11,
        0x85, 0x31, 0xb4, 0x7f, 0x4a, 0x43, 0x64, 0x29, 0x7c, 0x48, 0x70, 0xac,
        0xfc, 0x47, 0xd1, 0xd2, 0xbd, 0x8f, 0x00, 0x31, 0xac, 0xd5, 0x15, 0x53,
        0xcd, 0x42, 0x4f, 0x2e, 0xf5, 0xe5, 0xf6, 0xea, 0x59, 0xa9, 0x06, 0x82,
        0xbc, 0x0b, 0x25, 0xc0, 0x6c, 0x65, 0xdb, 0x82, 0x40, 0x25, 0x4a, 0x39,
        0x3c, 0xe6, 0x86, 0x8e, 0xce, 0x68, 0xb9, 0x80, 0xb2, 0x58, 0xb7, 0x37,
        0x65, 0xd5, 0xe3, 0xd4, 0x9c, 0x6b, 0x77, 0x70, 0x81, 0x39, 0xb6, 0xd1,
        0x07, 0xa4, 0x37, 0xc7, 0xbb, 0x76, 0x76, 0x84, 0xc7, 0x99, 0xff, 0xac,
        0xf3, 0x14, 0x84, 0x24, 0x4d, 0x6f, 0x38, 0x57, 0x9c, 0x4c, 0x07, 0x5f,
        0xc7, 0x89, 0x7d, 0x5e, 0x21, 0xd2, 0xd3, 0x67, 0x10, 0x43, 0x54, 0xff,
        0x0c, 0x58, 0x9d, 0x33, 0x95, 0x99, 0x22, 0x09, 0xd1, 0xaf, 0xb1, 0xd2,
        0x1b, 0xd3, 0x59, 0xcc, 0xbd, 0x75, 0x22, 0xad, 0x3f, 0x1f, 0xac, 0x61,
        0x76, 0xf5, 0xcf, 0xb3, 0x16, 0x01, 0x32, 0x41, 0xe4, 0x82, 0xb9, 0x44,
        0x04, 0xaf, 0xad, 0x94, 0x2a, 0x46, 0xd3, 0x07, 0xc6, 0x69, 0xbf, 0x7d,
        0xed, 0xca, 0x93, 0xd9, 0x69, 0xe3, 0xbf, 0x25, 0x84, 0xda, 0xb8, 0x9d,
        0xb8, 0x17, 0x41, 0x18, 0x9b, 0xce, 0x9b, 0x68, 0xd5, 0x3f, 0x14, 0xf3,
        0x21, 0xb8, 0x12, 0x41, 0x61, 0x32, 0x83, 0x03, 0x94, 0x4e, 0xc4, 0x55,
        0xfc, 0xd2, 0xb7, 0x0a, 0xe4, 0xac, 0x19, 0x96, 0xe9, 0x0a, 0x68, 0x04,
        0xb3, 0x62, 0xc2, 0x05, 0x6a, 0x01, 0xcf, 0x94, 0x5b, 0x87, 0x98, 0x39,
        0x85, 0xd7, 0x1c, 0xec, 0xff, 0xd9, 0x3a, 0xe1, 0x40, 0x3b, 0x5f, 0xcf,
        0x95, 0x89, 0x0f, 0x96, 0x08, 0x1a, 0x53, 0x78, 0x01, 0x44, 0x60, 0x34,
        0xfe, 0xab, 0x91, 0x0a, 0xfc, 0x31, 0xea, 0x0f, 0x12, 0xb4, 0x49, 0x7e,
        0x87, 0x00, 0x25, 0x6d, 0xbc, 0x36, 0xde, 0x85, 0x3a, 0xf9, 0xa2, 0xdc,
        0x38, 0x14, 0xcc, 0x85, 0x2e, 0x5b, 0xd0, 0xba, 0xb0, 0xcc, 0x5d, 0x7e,
        0x24, 0x97, 0x33, 0x12, 0xcf, 0x35, 0x4e, 0xb1, 0x02, 0x69, 0xa7, 0x6b,
        0x42, 0xb7, 0xb8, 0xd2, 0x4b, 0xd2, 0xfb, 0xa9, 0x88, 0x61, 0xeb, 0x11,
        0xa1, 0x51, 0x39, 0x7d, 0x53, 0xc1, 0xe0, 0x9f, 0x11, 0x5e, 0xf3, 0x94,
        0xb5, 0xa7, 0x1c, 0x5d, 0xd0, 0x6f, 0xc6, 0xbe, 0x7b, 0x86, 0x3b, 0x60,
        0xde, 0x9e, 0xb2, 0xc6, 0xe1, 0x5a, 0xc4, 0xbf, 0xe7, 0x4f, 0xac, 0x33,
        0x55, 0x55, 0x64, 0x9d, 0x5d, 0x89, 0xf6, 0x57, 0x71, 0xee, 0x2c, 0x11,
        0xa8, 0x1d, 0xd5, 0x01, 0x74, 0x1b, 0x66, 0x1d, 0xc0, 0xb1, 0x61, 0xa0,
        0xb6, 0xea, 0x06, 0x92, 0x4a, 0x6a, 0x83, 0x9d, 0xd4, 0xe3, 0x5d, 0xd5,
        0xb2, 0xe5, 0x2f, 0x4b, 0xe2, 0x39, 0x6d, 0xbb, 0xc9, 0x27, 0x4d, 0x88,
        0xce, 0x70, 0x7a, 0x9a, 0x8a, 0x04, 0xf5, 0xbb, 0x69, 0x7d, 0xa6, 0x9f,
        0x54, 0x2a, 0x56, 0xe7, 0x50, 0x7f, 0x25, 0xb6, 0xe8, 0xe5, 0x23, 0x3d,
        0xd4, 0x41, 0x63, 0x0a, 0xf9, 0xec, 0xff, 0xfc, 0x12, 0x57, 0x5b, 0xac,
        0xb0, 0xaf, 0xc3, 0xee, 0x4d, 0xf3, 0x16, 0x70, 0xc3, 0x33, 0x29, 0xfb,
        0x9d, 0x3a, 0xea, 0x19, 0x02, 0xbc, 0x3b, 0xab, 0x6e, 0xa8, 0xa4, 0x69,
        0x96, 0xe2, 0x27, 0x5b, 0x86, 0x60, 0xe8, 0x74, 0xf3, 0x7d, 0x8c, 0xa5,
        0x3a, 0x9c, 0xd4, 0xf1, 0x5d, 0x6f, 0xf2, 0x26, 0x69, 0xcf, 0xed, 0xcf,
        0x89, 0xd9, 0x09, 0xd2, 0x68, 0xf3, 0x33, 0xf8, 0xc6, 0xc5, 0x8a, 0x44,
        0x14, 0x88, 0x2c, 0xa2, 0x6e, 0x15, 0x36, 0x63, 0x7a, 0x68, 0x8d, 0x0b,
        0x9c, 0xa4, 0xe9, 0x8d, 0xe0, 0xf4, 0x98, 0x79, 0x44, 0x07, 0x4d, 0x5b,
        0x4c, 0x8b, 0xf9, 0x59, 0xd6, 0x2b, 0x97, 0x35, 0xf7, 0x59, 0x86, 0x6c,
        0x95, 0x08, 0x47, 0xdd, 0x87, 0x67, 0xc4, 0x35, 0xeb, 0xc6, 0xaf, 0x01,
        0xf8, 0x5e, 0x0b, 0x4e, 0xee, 0x84, 0x08, 0xa1, 0x72, 0xc5, 0x94, 0xf3,
        0x81, 0x06, 0xc1, 0x2f, 0x91, 0x0a, 0xbd, 0x87, 0x60, 0x70, 0xc8, 0xa3,
        0xe2, 0x6d, 0x00, 0xaa, 0x8b, 0xd4, 0x2c, 0x4e, 0x9d, 0x6b, 0xcf, 0xdd,
        0x36, 0x9a, 0x30, 0xa2, 0x21, 0xf2, 0xa0, 0x38, 0x12, 0x65, 0xa3, 0xfa,
        0x66, 0x9a, 0x8f, 0xae, 0x9b, 0x61, 0x80, 0xf8, 0xdd, 0xe0, 0xf5, 0xe4,
        0xfa, 0xdb, 0xeb, 0x6a, 0x55, 0x96, 0x19, 0x24, 0xaa, 0x9a, 0xce, 0xfa,
        0xae, 0x23, 0x8a, 0x5b, 0x4a, 0xc1, 0x46, 0x08, 0xc5, 0x33, 0x34, 0x62,
        0xf3, 0xca, 0xb1, 0x8a, 0xf2, 0xba, 0x8e, 0x2e, 0xb1, 0x2d, 0x26, 0x41,
        0x87, 0xc7, 0xf0, 0xa8, 0x86, 0x4e, 0xac, 0xe7, 0x9c, 0x40, 0x21, 0x66,
        0x13, 0xe2, 0x51, 0xbe, 0x1f, 0xcd, 0x40, 0x39, 0xef, 0x70, 0x2e, 0x2f,
        0x17, 0xba, 0x26, 0x13, 0x4b, 0xfc, 0xb9, 0x54, 0x60, 0x6f, 0xc7, 0x68,
        0xed, 0x69, 0x3c, 0x5a, 0xc0, 0x78, 0xf0, 0xcf, 0x4f, 0x9f, 0x35, 0xfe,
        0x43, 0xfc, 0xd4, 0x8b, 0xbc, 0x41, 0x5e, 0x19, 0x80, 0x8b, 0xa6, 0x29,
        0xaf, 0x57, 0xf3, 0xb8, 0xc8, 0xb3, 0xa6, 0xe4, 0xf7, 0xaa, 0x4b, 0x2b,
        0xfd, 0x2a, 0x2c, 0x0f, 0xe0, 0x0f, 0x8c, 0xb8, 0xac, 0xd2, 0x8a, 0xf0,
        0xef, 0x34, 0x56, 0x94, 0x35, 0x14, 0x02, 0x70, 0x57, 0xf4, 0xe6, 0xc5,
        0x82, 0x26, 0x81, 0x6b, 0xd2, 0xc8, 0x80, 0x70, 0xc1, 0xa6, 0x6b, 0x64,
        0x09, 0xe7, 0x52, 0xaf, 0xb2, 0x7f, 0xaa, 0xa0, 0xfc, 0x1a, 0x4d, 0x1c,
        0xe9, 0x35, 0xe2, 0xa8, 0xf9, 0x7c, 0x34, 0x88, 0x01, 0x39, 0x7d, 0x02,
        0xff, 0x6f, 0x40, 0x17, 0x59, 0xe3, 0xe8, 0x56, 0x18, 0x87, 0x74, 0x4f,
        0xe1, 0x2f, 0xf2, 0x9d, 0x57, 0xd1, 0x5d, 0x42, 0xe5, 0x01, 0x21, 0xf4,
        0x8d, 0xff, 0x0b, 0x0f, 0xd1, 0x8a, 0x81, 0x40, 0xa4, 0xad, 0x70, 0x72,
        0x75, 0x3a, 0xb0, 0xa1, 0x9a, 0xbf, 0xdf, 0x3c, 0xab, 0x61, 0x52, 0xf7,
        0xd6, 0xf1, 0x0f, 0x40, 0x15, 0x57, 0x46, 0xa6, 0xc6, 0x8c, 0x75, 0x39,
        0xc0, 0x8a, 0xb6, 0xfa, 0x0e, 0x11, 0x96, 0xf8, 0x96, 0x69, 0xb8, 0x1f,
        0xb1, 0xf9, 0xf4, 0xb4, 0x02, 0x3c, 0xb9, 0x43, 0xce, 0xd7, 0x2b, 0xf4,
        0x76, 0x63, 0x28, 0x2d, 0xeb, 0x55, 0x83, 0x92, 0x54, 0x98, 0xf3, 0x16,
        0x43, 0x33, 0x29, 0xc9, 0xce, 0x2f, 0x47, 0x28, 0xd2, 0x81, 0xef, 0xe8,
        0x95, 0xdc, 0xa0, 0x44, 0xe5, 0x64, 0x69, 0x79, 0x34, 0x7f, 0x70, 0x80,
        0xf5, 0xf0, 0x91, 0x43, 0x51, 0x05, 0xf4, 0xbf, 0x12, 0x6b, 0x2e, 0x75,
        0xb9, 0x7c, 0x3b, 0x7d, 0xba, 0x92, 0x22, 0x25, 0xd1, 0x83, 0x16, 0x80,
        0x93, 0x21, 0x8b, 0x61, 0x7c, 0xcf, 0x11, 0x26, 0xad, 0x8e, 0x67, 0xf9,
        0xf1, 0x0c, 0x53, 0xaa, 0x47, 0xf3, 0x33, 0x21, 0x9c, 0xdd, 0xc4, 0x7d,
        0x62, 0xf7, 0x29, 0x8f, 0xd1, 0x3c, 0x20, 0x53, 0x1b, 0xf6, 0xac, 0x99,
        0x58, 0x48, 0xf4, 0xff, 0x41, 0x7c, 0x5f, 0x29, 0x75, 0xd3, 0x86, 0xd0,
        0xe3, 0x66, 0x44, 0x09, 0x37, 0x86, 0x35, 0x21, 0x81, 0x7b, 0xc4, 0x86,
        0x6c, 0x97, 0xb8, 0x21, 0xd9, 0xda, 0x4a, 0xdd, 0xab, 0xbd, 0xef, 0x93,
        0xa3, 0x11, 0x48, 0xaa, 0x3c, 0xfe, 0x1c, 0xa5, 0x1f, 0xac, 0x3d, 0x50,
        0x65, 0x98, 0xb5, 0xce, 0xe3, 0x4a, 0xbf, 0x4d, 0xa0, 0xb6, 0x86, 0x63,
        0x83, 0x36, 0x96, 0x43, 0x19, 0x8d, 0xea, 0xaf, 0x0e, 0x34, 0xef, 0xbc,
        0x37, 0x5f, 0xc2, 0xe6, 0x30, 0x08, 0x1c, 0x45, 0xdf, 0xe5, 0x29, 0x49,
        0x3c, 0x7d, 0x4a, 0x0a, 0xa5, 0x2b, 0xb4, 0xa2, 0xb1, 0xad, 0x73, 0x75,
        0x9b, 0x1e, 0x19, 0x80, 0x31, 0x0c, 0xec, 0xa0, 0xc5, 0xaf, 0x08, 0xfe,
        0x12, 0x1e, 0xee, 0xa0, 0x4d, 0xa2, 0x93, 0x70, 0xbf, 0x3f, 0x16, 0xb2,
        0x3e, 0x00, 0x1d, 0x5c, 0x9c, 0x4c, 0xbf, 0xb4, 0x62, 0xab, 0x2a, 0xf3,
        0xe4, 0xce, 0x23, 0xed, 0xb4, 0xa6, 0xc6, 0x76, 0x55, 0xbb, 0x1b, 0x7d,
        0xc6, 0x9a, 0xc8, 0xe4, 0xc2, 0xe7, 0x26, 0x53, 0x8c, 0x2e, 0x12, 0xd2,
        0x0d, 0x24, 0x90, 0x60, 0xcc, 0xbf, 0xd1, 0x26, 0xa1, 0x5e, 0x21, 0xfa,
        0xa6, 0x00, 0x18, 0x96, 0x65, 0xe8, 0xae, 0xd6, 0x3e, 0x33, 0x2f, 0xa8,
        0xe4, 0xab, 0xb6, 0x01, 0x98, 0xf7, 0xab, 0x8c, 0x9a, 0x0e, 0xe4, 0x6c,
        0xcc, 0xf2, 0xaa, 0x10, 0x85, 0xf6, 0x67, 0x9a, 0x62, 0x29, 0x38, 0x3f,
        0x6f, 0x08, 0x4b, 0xaa, 0xbb, 0x22, 0x4d, 0x6c, 0x24, 0x3a, 0xe7, 0x3b,
        0xe8, 0xb8, 0x54, 0x20, 0xdf, 0xd7, 0x96, 0x3e, 0x99, 0x1d, 0x52, 0x55,
        0x82, 0x1d, 0x71, 0x23, 0xf5, 0x9a, 0x5c, 0x67, 0xf1, 0x36, 0xf6, 0xd8,
        0x4e, 0xae, 0x94, 0xa0, 0xc7, 0x4e, 0xd0, 0xc4, 0x77, 0xf5, 0xff, 0x7f,
        0xc8, 0x86, 0x1f, 0xf6, 0xfe, 0xa0, 0xd0, 0x3c, 0x19, 0xbf, 0xc0, 0x40,
        0x04, 0x13, 0x1b, 0x6e, 0x27, 0xc4, 0xc3, 0x7a, 0x22, 0xb6, 0xdc, 0x50,
        0xd6, 0xec, 0x63, 0x83, 0x75, 0xac, 0x18, 0x50, 0xb9, 0x40, 0xdc, 0xac,
        0x79, 0xb9, 0x79, 0x54, 0x45, 0x8b, 0x2e, 0x0d, 0x5c, 0x27, 0x9c, 0xc2,
        0x5e, 0x32, 0x4d, 0x91, 0x15, 0x15, 0xa5, 0xed, 0xb4, 0x88, 0x2f, 0xdf,
        0x3c, 0x47, 0x13, 0x6d, 0x91, 0xb8, 0x03, 0xf8, 0xbf, 0xac, 0x72, 0x62,
        0x9b, 0x65, 0x56, 0xc8, 0xcf, 0x17, 0x2d, 0xa6, 0xd3, 0x16, 0x37, 0x68,
        0x5e, 0x11, 0xd9, 0xad, 0x40, 0x24, 0x07, 0x56, 0x61, 0x0c, 0x00, 0x17,
        0x18, 0xf6, 0x6d, 0xac, 0xe8, 0x86, 0x88, 0xc2, 0x52, 0xac, 0x12, 0xbd,
        0x47, 0x9e, 0x8a, 0xf6, 0xb6, 0x65, 0x6e, 0x97, 0xd6, 0xd2, 0x40, 0xc0,
        0xc0, 0x4c, 0x2e, 0x6b, 0x4e, 0x23, 0x27, 0x90, 0x5f, 0x4a, 0xe0, 0x64,
        0x55, 0xae, 0xf9, 0x34, 0x1a, 0xae, 0x17, 0xec, 0xf8, 0x91, 0x78, 0xb4,
        0x6f, 0x3a, 0x9d, 0x3c, 0xac, 0x10, 0x59, 0xfa, 0x7c, 0x83, 0xa5, 0x0a,
        0x21, 0x63, 0xc8, 0x30, 0x7b, 0xea, 0x59, 0xd6, 0x5c, 0xd4, 0x6a, 0xaf,
        0xe2, 0xbe, 0xca, 0x6d, 0x07, 0x69, 0x8e, 0xb0, 0x14, 0x84, 0xa2, 0x73,
        0x8e, 0xcf, 0x87, 0x48, 0xfb, 0xee, 0x57, 0x11, 0x7b, 0x35, 0xea, 0x3f,
        0x64, 0xdf, 0xee, 0x78, 0xb0, 0x39, 0x8f, 0xab, 0x00, 0x40, 0xef, 0x38,
        0x1e, 0x40, 0x17, 0x85, 0x24, 0xfe, 0xe4, 0xbd, 0xe9, 0x38, 0x68, 0x25,
        0xd8, 0x10, 0x18, 0xda, 0x6c, 0xb4, 0x21, 0x43, 0xb0, 0xfb, 0xa8, 0xa9,
        0x6c, 0x5a, 0x3d, 0x64, 0x6a, 0x0e, 0xe7, 0x93, 0xd5, 0x3f, 0x4d, 0xbc,
        0xb0, 0x32, 0xa2, 0xea, 0xda, 0x74, 0x36, 0x60, 0xac, 0x81, 0x7f, 0x02,
        0x86, 0xb4, 0x03, 0x9d, 0xa0, 0xee, 0x81, 0x7c, 0x05, 0xc6, 0x56, 0x9c,
        0x41, 0xc4, 0x5d, 0x08, 0x37, 0x12, 0x53, 0xd5, 0xc3, 0xee, 0x12, 0x9a,
        0xd3, 0x7e, 0x96, 0x27, 0x2e, 0xa5, 0x07, 0xb5, 0x0b, 0xc4, 0xd0, 0x08,
        0x49, 0x64, 0x5d, 0x43, 0xaa, 0x7d, 0x56, 0x22, 0x48, 0xd1, 0x74, 0x0e,
        0xe0, 0x8c, 0xa7, 0x3f, 0x84, 0xdd, 0xa1, 0xfc, 0x02, 0xdb, 0x32, 0xa0,
        0x1c, 0x92, 0x6e, 0xc0, 0x69, 0x5a, 0x45, 0x5b, 0xb7, 0x73, 0x37, 0xd5,
        0xa1, 0x40, 0x5f, 0xf3, 0x57, 0x07, 0xa4, 0x57, 0x45, 0xb3, 0x3d, 0x12,
        0x47, 0x2c, 0x5c, 0xbc, 0xe0, 0x31, 0x92, 0xda, 0xb6, 0x29, 0x5a, 0xd3,
        0x65, 0xd5, 0xd4, 0x67, 0xd0, 0x26, 0x6a, 0x76, 0x0c, 0x5c, 0xb4, 0x1f,
        0x61, 0xd3, 0x00, 0xa9, 0xce, 0x1d, 0xe9, 0x3d, 0x7e, 0xbe, 0x92, 0xc6,
        0xa0, 0xe1, 0x77, 0x58, 0x07, 0xc7, 0x31, 0x96, 0x56, 0x69, 0x49, 0x34,
        0xf6, 0xbd, 0x42, 0x13, 0x86, 0xe4, 0x12, 0x56, 0xae, 0x0b, 0xb2, 0xf1,
        0xe5, 0xf6, 0xba, 0xc2, 0xcf, 0xa8, 0xe4, 0x22, 0x86, 0xdd, 0x2a, 0x86,
        0xee, 0x7c, 0xc5, 0x1e, 0x3f, 0x0c, 0xe9, 0x3c, 0x62, 0xc3, 0x97, 0xc6,
        0x40, 0xa8, 0x53, 0x82, 0xcf, 0xdc, 0x88, 0x42, 0xb7, 0x76, 0x7e, 0x6c,
        0xc1, 0x03, 0xf6, 0xf9, 0x1a, 0x93, 0x60, 0x44, 0xb1, 0x50, 0xe3, 0x9e,
        0xa7, 0x00, 0x2e, 0x73, 0x88, 0x35, 0x8e, 0x5e, 0xdb, 0xdf, 0x63, 0xa5,
        0x22, 0x50, 0x1a, 0x31, 0x2d, 0x28, 0xe6, 0xf1, 0xbe, 0xe4, 0x4d, 0x05,
        0x60, 0x01, 0x63, 0x58, 0x71, 0x52, 0x11, 0x11, 0xf1, 0x9f, 0xe7, 0x48,
        0x1d, 0x67, 0xc3, 0x5a, 0x50, 0x35, 0xe9, 0x4e, 0xcf, 0xda, 0x27, 0x04,
        0x95, 0x60, 0xd6, 0x5a, 0xc2, 0x32, 0xf8, 0x00, 0x29, 0x5b, 0x46, 0xac,
        0x9a, 0x22, 0xd6, 0x93, 0xe3, 0x1a, 0xa2, 0xea, 0x56, 0x4a, 0xb8, 0xf0,
        0x08, 0x50, 0x17, 0xcc, 0x9e, 0xf4, 0x80, 0x5c, 0x12, 0xca, 0x87, 0x23,
        0x03, 0x31, 0xde, 0x63, 0x18, 0x44, 0x92, 0x7f, 0xff, 0xfb, 0xb2, 0x68,
        0xbb, 0x55, 0x0f, 0xc6, 0x68, 0xcc, 0xcd, 0xda, 0x58, 0x5b, 0x2a, 0x9d,
        0x59, 0x8e, 0x4c, 0x80, 0x93, 0x6e, 0xf7, 0x60, 0x41, 0x71, 0x13, 0x4e,
        0x41, 0x5f, 0xda, 0x7f, 0xea, 0x39, 0x1c, 0xc5, 0x06, 0x79, 0xfe, 0x47,
        0xc0, 0x47, 0x2f, 0x5e, 0x64, 0x4b, 0x91, 0x82, 0x90, 0xe1, 0x17, 0x95,
        0x5d, 0xeb, 0x0d, 0x93, 0x81, 0xbc, 0x7a, 0x95, 0x7e, 0xd9, 0x67, 0xc6,
        0xf8, 0xef, 0x17, 0x8a, 0x64, 0x8d, 0x14, 0x52, 0xb0, 0x3a, 0xac, 0xce,
        0xea, 0x76, 0xd5, 0xd8, 0xc1, 0x64, 0x84, 0xba, 0xff, 0x66, 0x0b, 0x14,
        0xe4, 0x13, 0x87, 0xa1, 0x6e, 0x38, 0x19, 0x28, 0xe6, 0x47, 0x7c, 0x6a,
        0xc5, 0xa8, 0x04, 0xd3, 0x24, 0x61, 0x22, 0xf2, 0x28, 0x0b, 0xfc, 0x24,
        0x05, 0x91, 0xe6, 0x05, 0x48, 0x2e, 0xc1, 0xc3, 0xec, 0xa5, 0x6c, 0xbf,
        0x03, 0x44, 0x37, 0x16, 0x0b, 0x56, 0xd7, 0xaa, 0x21, 0xae, 0x04, 0x1c,
        0xcd, 0x8b, 0xf6, 0xe3, 0xab, 0x46, 0x65, 0x3b, 0x71, 0x96, 0x98, 0x0a,
        0xce, 0x95, 0xc7, 0x8f, 0x6a, 0x1b, 0xfa, 0x0b, 0x6f, 0xea, 0xac, 0x83,
        0x09, 0x19, 0xd6, 0x69, 0x0b, 0x5b, 0xfe, 0x13, 0x85, 0x81, 0xef, 0xb3,
        0x0e, 0x79, 0x56, 0x4e, 0x44, 0x5f, 0x4b, 0x2d, 0x18, 0x0a, 0xb9, 0x17,
        0x5d, 0x51, 0xb2, 0x73, 0xec, 0xdf, 0x98, 0x4c, 0x02, 0x2a, 0xa1, 0x3d,
        0xfd, 0x89, 0xde, 0x52, 0x4e, 0x5e, 0x7c, 0x8a, 0xb2, 0x31, 0xcb, 0x20,
        0xea, 0x7d, 0x60, 0x61, 0x1f, 0x1d, 0x92, 0xc1, 0xe6, 0x67, 0xa9, 0x10,
        0x1a, 0xb0, 0xa1, 0x8c, 0xec, 0x2c, 0xc7, 0xf2, 0x6b, 0x25, 0xa7, 0xf4,
        0x41, 0xef, 0xb9, 0x34, 0x6c, 0x7d, 0x7c, 0xe5, 0xc1, 0xb0, 0xa5, 0x11,
        0x94, 0xce, 0x1f, 0xab, 0x39, 0x87, 0xf7, 0x16, 0xb1, 0x2c, 0x0b, 0x42,
        0x63, 0x30, 0x44, 0x0d, 0x46, 0xbb, 0x8a, 0x2d, 0xdb, 0x81, 0x03, 0x55,
        0x1c, 0x9d, 0xf1, 0xfa, 0xe7, 0x88, 0xd4, 0xce, 0x98, 0x7b, 0xfc, 0x0e,
        0x13, 0x6f, 0x10, 0xdc, 0x58, 0x1b, 0x42, 0xf4, 0x89, 0xd0, 0x83, 0xdc,
        0x9b, 0x97, 0xfe, 0x60, 0xa6, 0xab, 0xff, 0xfb, 0x35, 0xcf, 0x20, 0x36,
        0xca, 0x45, 0xac, 0xc0, 0x9f, 0x27, 0x1a, 0x8b, 0x61, 0x35, 0x0d, 0x32,
        0x17, 0x3d, 0xe6, 0x8b, 0x45, 0x82, 0x4c, 0xf0, 0xb9, 0xdf, 0x49, 0x6e,
        0x2f, 0x2f, 0xd4, 0x85, 0xc0, 0xdb, 0xcf, 0x91, 0x60, 0x20, 0x23, 0x1d,
        0xba, 0xb0, 0xb3, 0x71, 0xdc, 0x58, 0x3a, 0xab, 0x25, 0x0e, 0x17, 0x52,
        0x2b, 0xec, 0xf9, 0xcc, 0xc2, 0x22, 0x26, 0x00, 0xe3, 0xb0, 0x53, 0xc4,
        0x7a, 0x42, 0xab, 0x6a, 0x0e, 0x74, 0x68, 0xcb, 0x6e, 0xb2, 0xf8, 0x5d,
        0x2c, 0xb7, 0xc0, 0x32, 0x04, 0xec, 0x23, 0xb8, 0xdd, 0x18, 0x6a, 0x98,
        0x71, 0x13, 0x59, 0x4b, 0xb6, 0x4c, 0x0c, 0xfb, 0x4c, 0x12, 0x2a, 0xa0,
        0x23, 0xb6, 0x94, 0x1d, 0xb8, 0x20, 0x94, 0x0d, 0x1e, 0x6d, 0x69, 0x41,
        0x24, 0x3c, 0x83, 0xf5, 0x1b, 0x74, 0x3d, 0x36, 0xfc, 0xf4, 0x91, 0xd9,
        0xd7, 0x8a, 0x29, 0xcd, 0x6e, 0x9c, 0x02, 0xc0, 0xc7, 0x7d, 0x62, 0x15,
        0xa8, 0x80, 0xf6, 0x5a, 0x8a, 0x2a, 0x5e, 0xb4, 0x06, 0x1a, 0xf1, 0x0f,
        0xe0, 0x8d, 0xe7, 0xc5, 0x67, 0x39, 0xc7, 0xb0, 0xf7, 0x0c, 0xf4, 0xf0,
        0xe4, 0x5f, 0x07, 0x3b, 0x1d, 0xce, 0x44, 0xc9, 0x49, 0xfd, 0x28, 0xa8,
        0x61, 0x34, 0x54, 0x74, 0x72, 0xf1, 0x20, 0x27, 0x55, 0x34, 0xfe, 0x0d,
        0x2f, 0xe7, 0xdf, 0x1e, 0xc9, 0x54, 0x0e, 0x06, 0xe2, 0xda, 0x42, 0xc2,
        0x14, 0x2b, 0x67, 0xae, 0x5b, 0x31, 0x7f, 0x59, 0x0a, 0x73, 0xde, 0xc6,
        0xfa, 0xe7, 0xac, 0x88, 0x0e, 0x60, 0xa9, 0x42, 0xa5, 0xca, 0x6c, 0x40,
        0x15, 0x07, 0xff, 0xe5, 0x23, 0x02, 0x0e, 0x97, 0x20, 0x00, 0x17, 0x05,
        0x1e, 0x93, 0x64, 0x95, 0x79, 0x34, 0x1b, 0x8c, 0x30, 0xce, 0xc5, 0x5e,
        0x93, 0x16, 0x06, 0x41, 0x81, 0x4a, 0x74, 0xd6, 0x2e, 0xec, 0x60, 0x17,
        0x90, 0x97, 0x3e, 0x30, 0x48, 0x9e, 0xb9, 0x67, 0xb8, 0xf0, 0xc1, 0xdd,
        0x97, 0x71, 0xcf, 0x48, 0xd0, 0xeb, 0x4e, 0x24, 0xc4, 0x67, 0x6c, 0xca,
        0x95, 0x51, 0x21, 0x0d, 0x76, 0xd3, 0x81, 0x7d, 0x8e, 0xe8, 0xff, 0xdd,
        0xc3, 0x09, 0xd6, 0xab, 0x26, 0xc4, 0x48, 0xe9, 0xfc, 0x69, 0x0c, 0x43,
        0xa1, 0xf2, 0x35, 0xca, 0x5a, 0xbf, 0x1a, 0xbd, 0xea, 0x46, 0x22, 0x99,
        0x75, 0x65, 0x2b, 0xce, 0x16, 0x73, 0xd9, 0xf5, 0x40, 0x2b, 0x7e, 0x3c,
        0x94, 0xe4, 0x79, 0xfd, 0x5e, 0xb9, 0x9a, 0x99, 0xdd, 0x58, 0x4e, 0xe2,
        0xcf, 0x2d, 0x36, 0x42, 0x26, 0x15, 0x59, 0xfb, 0xd4, 0xe1, 0xb7, 0x5a,
        0x51, 0xe3, 0xcc, 0x7f, 0x5f, 0xcc, 0x8f, 0xc6, 0x4e, 0x84, 0xa2, 0xd7,
        0xdb, 0x75, 0xe1, 0x4c, 0xb1, 0x0d, 0x67, 0x12, 0x11, 0x48, 0x0d, 0x33,
        0x6b, 0xff, 0xfc, 0xda, 0xd8, 0xed, 0x37, 0xfe, 0x7e, 0x41, 0x0b, 0x73,
        0x8e, 0x10, 0x2f, 0x07, 0x2a, 0xe3, 0xdc, 0xf9, 0x98, 0x4f, 0xd5, 0xbe,
        0xa1, 0xd6, 0x4a, 0x77, 0x3b, 0x22, 0xcc, 0xd4, 0x57, 0xc6, 0x2c, 0x02,
        0xda, 0x4d, 0xf8, 0xca, 0x21, 0x21, 0xc6, 0x55, 0x2d, 0xf6, 0x45, 0xdb,
        0x75, 0xa8, 0xfa, 0xfe, 0xf4, 0x59, 0x4f, 0xf1, 0x0b, 0x69, 0x6d, 0x37,
        0xfe, 0x92, 0x23, 0x57, 0x85, 0x31, 0xae, 0x44, 0x6b, 0xd7, 0x9f, 0x28,
        0x8c, 0x4c, 0xd0, 0xc9, 0xca, 0xf8, 0x8e, 0x1b, 0x27, 0x82, 0x1d, 0xef,
        0xf5, 0xb3, 0xf1, 0x8f, 0x28, 0x71, 0xde, 0xb8, 0x1c, 0xfa, 0x2a, 0xe9,
        0x8a, 0x40, 0x6d, 0x92, 0x84, 0x8e, 0x63, 0x42, 0x04, 0x24, 0x17, 0x18,
        0xb2, 0x80, 0xe4, 0xbe, 0x58, 0x6a, 0xb4, 0xf5, 0x15, 0x1e, 0x1b, 0x08,
        0xc5, 0x3f, 0xa6, 0xdf, 0xd9, 0xc9, 0x46, 0xda, 0xf3, 0x12, 0xcd, 0xc7,
        0x02, 0x3a, 0xde, 0x45, 0xe6, 0xee, 0xde, 0x36, 0x3a, 0x8c, 0xc8, 0xfb,
        0x3a, 0xa5, 0x1a, 0x33, 0x81, 0xe1, 0x9e, 0x55, 0xfa, 0x6b, 0xd3, 0x85,
        0x36, 0x92, 0xd6, 0x83, 0x86, 0x9d, 0x6f, 0xee, 0xff, 0xa6, 0x27, 0xed,
        0x4d, 0xe8, 0x3f, 0x34, 0xbd, 0x45, 0x32, 0x5a, 0xab, 0x99, 0x02, 0x99,
        0x0c, 0xa3, 0xff, 0x79, 0xaf, 0x65, 0x22, 0x56, 0x77, 0xac, 0x49, 0xaf,
        0xba, 0x17, 0xab, 0xd6, 0x15, 0x41, 0xf3, 0x86, 0x78, 0x5f, 0xbd, 0x5c,
        0x5e, 0x34, 0x41, 0x7e, 0x32, 0x4f, 0xa8, 0xa4, 0xca, 0xe3, 0x3b, 0x6d,
        0x1c, 0x25, 0x79, 0xd0, 0xfd, 0xc2, 0x60, 0x2f, 0x0e, 0x22, 0x5f, 0x41,
        0x43, 0xb4, 0xfc, 0xf6, 0x3a, 0xa3, 0x75, 0xba, 0xe6, 0xf8, 0x1e, 0xf6,
        0x37, 0x65, 0xc1, 0x88, 0xb7, 0xa8, 0xb7, 0xc7, 0x3b, 0x75, 0x29, 0x21,
        0xc7, 0xed, 0x40, 0x0e, 0xc9, 0xd7, 0xdd, 0x9d, 0xb0, 0x2e, 0xeb, 0x1b,
        0xff, 0xf2, 0x1f, 0x23, 0xf3, 0xd5, 0x64, 0xe2, 0x89, 0x6b, 0x6b, 0x58,
        0xfb, 0xd0, 0xbb, 0xb5, 0x5b, 0x2b, 0x63, 0x4f, 0xb3, 0x6c, 0x8c, 0x3f,
        0xb0, 0x8a, 0x52, 0x0a, 0xa0, 0xc8, 0x76, 0x59, 0xa6, 0x0a, 0xe1, 0xe0,
        0xd1, 0xd7, 0x6c, 0x77, 0x33, 0xed, 0x55, 0x10, 0x88, 0x6b, 0xef, 0x07,
        0x95, 0xc7, 0xdb, 0x1e, 0x06, 0x4b, 0x5e, 0xe4, 0xd8, 0x99, 0xb3, 0x24,
        0xe2, 0x21, 0x19, 0x76, 0xd0, 0x3c, 0x2d, 0x8a, 0xa8, 0xbe, 0x7f, 0x53,
        0x58, 0xa8, 0x56, 0xea, 0x1e, 0x70, 0x7f, 0x1c, 0x8e, 0xf7, 0xca, 0xf5,
        0xb9, 0xcb, 0x2f, 0x75, 0x94, 0x51, 0x71, 0x78, 0x10, 0x26, 0x07, 0xe5,
        0xf6, 0x3a, 0x28, 0x72, 0x38, 0x87, 0x23, 0xc6, 0x6e, 0x2d, 0x00, 0x95,
        0x22, 0xb2, 0xa9, 0x3d, 0x2a, 0x5f, 0x32, 0x80, 0x62, 0x5e, 0x35, 0x3b,
        0x37, 0x29, 0x00, 0x3c, 0x06, 0x11, 0xa4, 0x8e, 0xc4, 0xeb, 0xde, 0x5b,
        0xbb, 0xd6, 0x88, 0xa4, 0x33, 0xe8, 0x39, 0xea, 0xca, 0xc7, 0x69, 0x89,
        0x86, 0xb9, 0x45, 0x03, 0x51, 0xd3, 0x84, 0x41, 0xff, 0xaf, 0x2f, 0x6d,
        0x12, 0x33, 0x48, 0x7b, 0x28, 0x40, 0xb1, 0x36, 0xae, 0xa3, 0xbb, 0x6c,
        0xd0, 0xad, 0x89, 0x7c, 0xf5, 0xa8, 0xc3, 0xdd, 0xa9, 0x58, 0x2e, 0x03,
        0x85, 0x9d, 0xa5, 0xcb, 0xa2, 0x69, 0x96, 0x2e, 0x26, 0x99, 0x71, 0xc9,
        0x16, 0xfe, 0xb7, 0x11, 0xb7, 0x5e, 0x77, 0xc0, 0x63, 0x96, 0x82, 0xf0,
        0xc6, 0x84, 0xf9, 0x2e, 0x4e, 0xa5, 0x05, 0xc1, 0x06, 0x98, 0xa5, 0x1c,
        0xa4, 0x5b, 0xa5, 0x3a, 0x2f, 0x3e, 0xc8, 0x39, 0x0e, 0x05, 0x6a, 0x81,
        0x55, 0x87, 0xbe, 0xef
    ]),
    "Hot Pink": new Uint8Array([
        0xc4, 0xec, 0x0e, 0xbb, 0x5a, 0xda, 0x74, 0x5c, 0x08, 0x23, 0xe3, 0x40,
        0x57, 0x64, 0x67, 0x2e, 0xf5, 0xab, 0x14, 0x3f, 0x59, 0x4d, 0x24, 0xab,
        0x48, 0x82, 0xc2, 0xca, 0x4c, 0x0c, 0x68, 0xf8, 0xd0, 0xbd, 0x6b, 0xd3,
        0xcf, 0xc4, 0x3c, 0xda, 0xb5, 0x83, 0xf8, 0x13, 0x43, 0xd3, 0x53, 0xf6,
        0x24, 0x52, 0x89, 0xae, 0xaa, 0xbf, 0xea, 0x34, 0xee, 0xb2, 0xd2, 0x62,
        0xe1, 0x7b, 0xea, 0x55, 0x34, 0x85, 0x88, 0x87, 0x5d, 0x21, 0xba, 0xd3,
        0x2c, 0xb0, 0xa9, 0xdb, 0x92, 0x29, 0xb4, 0xef, 0xe1, 0x6f, 0xda, 0x80,
        0xde, 0x8f, 0xf0, 0xf2, 0xdd, 0xa6, 0x77, 0x53, 0xcf, 0x86, 0x48, 0xcf,
        0x59, 0x68, 0xb8, 0xa9, 0x45, 0x4c, 0x4b, 0xf5, 0x66, 0x32, 0xb8, 0xbe,
        0xb8, 0x40, 0x1b, 0xe3, 0x10, 0xee, 0xe9, 0x2c, 0x7d, 0xf2, 0x00, 0xe0,
        0xfa, 0xc7, 0x02, 0xe5, 0xcf, 0x53, 0xcb, 0xb2, 0xad, 0x22, 0x38, 0xff,
        0x0c, 0x3f, 0x4c, 0x4f, 0x62, 0x08, 0xdd, 0xbf, 0x38, 0xb4, 0xae, 0xe3,
        0x35, 0xcb, 0xd6, 0xb4, 0x57, 0x03, 0x3a, 0x43, 0xb3, 0x1a, 0xdd, 0x05,
        0x64, 0x80, 0xc6, 0xc7, 0x9a, 0xd4, 0xb0, 0x1c, 0xc5, 0x6b, 0xef, 0x52,
        0x10, 0x73, 0xa4, 0x03, 0x1f, 0xf2, 0x36, 0x89, 0x3d, 0xcd, 0x43, 0x11,
        0xe7, 0x22, 0xb3, 0xd7, 0x8c, 0xcf, 0x74, 0xb1, 0xac, 0x5a, 0x5c, 0x3e,
        0x8b, 0xf7, 0x83, 0x28, 0x03, 0x3b, 0xdb, 0x49, 0xb6, 0x39, 0x4d, 0x69,
        0x67, 0xb6, 0x6a, 0x07, 0xc5, 0x6e, 0x24, 0x58, 0xe0, 0xd2, 0xdb, 0x56,
        0xb3, 0x4e, 0xa2, 0xeb, 0xc1, 0x98, 0x88, 0xdf, 0x64, 0xba, 0x59, 0x61,
        0xdd, 0x6b, 0x74, 0xa9, 0x14, 0x45, 0xa8, 0xd2, 0x17, 0x4f, 0xc6, 0x9f,
        0xeb, 0x5d, 0xf9, 0x78, 0x8d, 0xb2, 0x06, 0x31, 0x5f, 0xa7, 0xea, 0x59,
        0x93, 0x1d, 0xa3, 0x09, 0x2a, 0x41, 0x31, 0x1f, 0xbe, 0x08, 0xf3, 0x52,
        0x40, 0x63, 0xb2, 0x93, 0x63, 0x4a, 0xaa, 0xac, 0x5f, 0x71, 0xea, 0xb0,
        0xa7, 0xd1, 0x79, 0x2e, 0x8c, 0x2a, 0x59, 0x61, 0xd5, 0x68, 0x27, 0x70,
        0x19, 0x3b, 0xae, 0xbb, 0x05, 0x5f, 0xc9, 0x17, 0xa2, 0x69, 0x3b, 0x19,
        0xbd, 0xd6, 0x2e, 0xf5, 0x88, 0xd5, 0x45, 0x3e, 0x58, 0x90, 0xbb, 0x2d,
        0x76, 0xdb, 0x55, 0xca, 0xeb, 0x6d, 0x33, 0x61, 0x9c, 0xe4, 0xa0, 0x9e,
        0xf3, 0x38, 0x8e, 0x32, 0xe6, 0xba, 0x0a, 0xca, 0xe3, 0xc1, 0xe7, 0x9d,
        0x9c, 0xde, 0x6d, 0x49, 0xc9, 0xb0, 0x33, 0xb0, 0x6a, 0xf0, 0x19, 0xd4,
        0xda, 0x5f, 0x1f, 0x97, 0x25, 0x6e, 0xf1, 0xa4, 0xa2, 0x45, 0x6f, 0x28,
        0x74, 0xb1, 0xa7, 0xef, 0xa0, 0x3f, 0xb8, 0x40, 0xba, 0x3b, 0x05, 0xe9,
        0xc4, 0xa4, 0xf9, 0xf9, 0x5e, 0x4a, 0x08, 0x02, 0x13, 0xc4, 0x5b, 0x9a,
        0xa0, 0xd1, 0x86, 0xc2, 0x4b, 0x4b, 0x78, 0xd9, 0xaf, 0x72, 0xd3, 0x28,
        0x0e, 0x0a, 0x70, 0x61, 0x60, 0x17, 0x22, 0x19, 0x13, 0xca, 0xce, 0x7d,
        0x6a, 0x21, 0x5c, 0x15, 0x84, 0xbb, 0xe2, 0xc8, 0xed, 0xaa, 0xa4, 0x46,
        0xc2, 0x3d, 0x42, 0x7f, 0x27, 0x9d, 0x68, 0xfc, 0xd4, 0x88, 0x05, 0x15,
        0xa3, 0xad, 0xca, 0x2c, 0x3f, 0xaf, 0x36, 0x85, 0xfe, 0x3f, 0x78, 0xbb,
        0x74, 0x77, 0x4d, 0x62, 0x0b, 0xfa, 0xca, 0x90, 0x1e, 0x75, 0xd1, 0xef,
        0xbd, 0xf5, 0x48, 0x35, 0x6b, 0x81, 0xdd, 0xca, 0x21, 0x7d, 0x4f, 0x10,
        0x11, 0xfd, 0x1c, 0x09, 0x10, 0xf0, 0xc1, 0x52, 0x7c, 0x21, 0x4a, 0x9d,
        0x2f, 0x8e, 0x4c, 0xa6, 0xed, 0x50, 0xcf, 0xce, 0x70, 0xcb, 0x13, 0x94,
        0x58, 0x83, 0xcb, 0x84, 0x42, 0xdc, 0x1f, 0xb7, 0xcc, 0x84, 0xb0, 0x76,
        0xcc, 0x13, 0xcd, 0x5c, 0x67, 0x9f, 0x11, 0x5e, 0xd9, 0xe9, 0x82, 0x79,
        0x67, 0x02, 0x43, 0xfc, 0xf3, 0x75, 0x5b, 0x9c, 0xf5, 0xdf, 0xd0, 0x6d,
        0x3b, 0x09, 0x5b, 0xe5, 0x61, 0xe2, 0x8d, 0x3c, 0xd1, 0x1a, 0x6f, 0x17,
        0x72, 0xf1, 0x93, 0xd4, 0xc9, 0xc6, 0xd1, 0xc4, 0xea, 0xfa, 0x68, 0xa9,
        0x75, 0x0f, 0x2c, 0x9a, 0x03, 0x99, 0x64, 0x45, 0xaf, 0xc7, 0x78, 0xce,
        0x46, 0xd1, 0x2b, 0x21, 0xad, 0x95, 0xcc, 0xcb, 0x67, 0x03, 0x9c, 0x74,
        0x6a, 0x4d, 0x9b, 0xc4, 0xb7, 0xf1, 0x13, 0x6e, 0xcb, 0x76, 0x1c, 0xb1,
        0x3b, 0x3f, 0x5a, 0x66, 0x73, 0xd3, 0x7d, 0xac, 0x79, 0xec, 0xf4, 0x80,
        0x88, 0x5e, 0xcd, 0x7d, 0x0e, 0xcc, 0x9b, 0xce, 0xb5, 0xe6, 0xa6, 0x4c,
        0x71, 0x44, 0xa2, 0x88, 0xa0, 0x27, 0xa9, 0x8a, 0x76, 0x0a, 0x45, 0xed,
        0xac, 0xb8, 0x1b, 0xc2, 0x99, 0x8c, 0x19, 0xb5, 0xe2, 0x75, 0x45, 0x2b,
        0xf6, 0x1f, 0x28, 0x16, 0x7d, 0x3b, 0xa7, 0x02, 0xbe, 0xd5, 0x04, 0xc4,
        0x34, 0x16, 0xab, 0xf4, 0xb4, 0xc4, 0xf7, 0x2c, 0xe1, 0x44, 0xd0, 0xc0,
        0x50, 0xf9, 0xbd, 0xf5, 0x11, 0xf9, 0x45, 0xca, 0x05, 0xa8, 0x9e, 0xc3,
        0xd3, 0x06, 0x2f, 0x87, 0xf8, 0x04, 0xad, 0x4d, 0x75, 0xa3, 0xb3, 0x17,
        0x43, 0xcd, 0xdc, 0xeb, 0xe3, 0x9d, 0x82, 0xdc, 0xa1, 0x0b, 0x99, 0xe9,
        0xb3, 0x8c, 0x2a, 0x01, 0xb6, 0xfa, 0x06, 0x14, 0x07, 0x9d, 0xdd, 0x1b,
        0x95, 0x15, 0xe1, 0x0b, 0x77, 0x34, 0x59, 0x43, 0x1c, 0xee, 0xd9, 0x55,
        0xa8, 0x94, 0x30, 0x08, 0xe9, 0x5c, 0x38, 0x37, 0x2e, 0x67, 0x9f, 0x3c,
        0xde, 0x91, 0xfe, 0x10, 0x63, 0x4d, 0xae, 0x79, 0x89, 0x40, 0xcc, 0xc0,
        0xae, 0x05, 0x4c, 0xb6, 0xac, 0xf0, 0xd5, 0xbc, 0x3b, 0x41, 0xb7, 0x2f,
        0x08, 0x83, 0xc5, 0xe5, 0xc0, 0xae, 0x4e, 0x2c, 0xbf, 0x7a, 0xce, 0xab,
        0x46, 0x74, 0x73, 0x09, 0x10, 0xf5, 0xd9, 0x64, 0x26, 0x0b, 0xba, 0x18,
        0xff, 0x4f, 0x80, 0x5e, 0xc7, 0xa0, 0x25, 0x5e, 0x44, 0x83, 0x1e, 0x6a,
        0x56, 0x70, 0xb6, 0x88, 0x72, 0x0a, 0x48, 0x0c, 0x66, 0x80, 0xee, 0x9a,
        0xdd, 0x69, 0xf3, 0x94, 0xbe, 0x1b, 0xb6, 0xb5, 0xe2, 0xd4, 0xf3, 0x39,
        0xc6, 0xc8, 0x81, 0x71, 0xab, 0xc7, 0x39, 0x9e, 0x4a, 0x20, 0x53, 0x40,
        0xb3, 0xe8, 0xeb, 0xb1, 0xbc, 0x59, 0xb7, 0x78, 0x25, 0x59, 0xc1, 0xc5,
        0x58, 0xab, 0x2e, 0xa7, 0xfc, 0x27, 0x5c, 0x0f, 0xb7, 0x8a, 0x18, 0x4c,
        0xa5, 0x3e, 0xa4, 0x75, 0x75, 0x4d, 0x58, 0xd2, 0xf6, 0x55, 0x9d, 0xda,
        0xb6, 0xa2, 0x13, 0x5b, 0xfc, 0x0b, 0x9e, 0x86, 0x28, 0x39, 0x2b, 0x02,
        0xe7, 0x86, 0x77, 0x7d, 0x5e, 0x1f, 0x82, 0x03, 0x0f, 0x2c, 0x23, 0x58,
        0x13, 0x5b, 0x4c, 0xe6, 0xb3, 0xc9, 0x0a, 0x66, 0xc6, 0x6f, 0xb7, 0x9b,
        0xbd, 0x41, 0x9b, 0xbd, 0x7b, 0x31, 0x74, 0x27, 0x66, 0xa7, 0x2f, 0xc8,
        0x85, 0x38, 0xe5, 0xdf, 0x19, 0x16, 0xc0, 0x4a, 0x12, 0x94, 0x16, 0xa5,
        0x8c, 0xe0, 0x1d, 0x04, 0x85, 0x5b, 0x60, 0x72, 0x69, 0xcf, 0x6a, 0xdf,
        0x60, 0x66, 0xed, 0xde, 0x11, 0xc6, 0x8d, 0xe2, 0xa8, 0x38, 0xc7, 0xf6,
        0xe4, 0x27, 0x0c, 0xa0, 0x2c, 0x02, 0x62, 0x5e, 0x62, 0xdd, 0xef, 0x27,
        0xd0, 0xf7, 0x74, 0xcb, 0xa6, 0x03, 0xb0, 0x98, 0x5d, 0x11, 0x37, 0x9a,
        0xf0, 0xc2, 0xbf, 0xa3, 0x40, 0xb2, 0x28, 0x10, 0x46, 0x57, 0x12, 0x04,
        0x1d, 0x63, 0x25, 0x4a, 0x7a, 0x05, 0x93, 0xa2, 0x66, 0xea, 0xff, 0x16,
        0xae, 0xa4, 0x74, 0x89, 0xdd, 0xfe, 0xeb, 0x4e, 0xc8, 0x2d, 0xf3, 0xfd,
        0x4d, 0x5f, 0x50, 0x20, 0x2d, 0x28, 0xf0, 0xba, 0x31, 0x49, 0xc5, 0xfa,
        0xc9, 0x72, 0x87, 0xe8, 0x0a, 0x1c, 0xfd, 0xa2, 0x8b, 0xbe, 0x05, 0x5c,
        0xb1, 0x6c, 0x23, 0x57, 0x46, 0xdc, 0x51, 0x14, 0x3f, 0x8e, 0x36, 0xf3,
        0x1a, 0x4f, 0x35, 0x33, 0x8a, 0x43, 0x01, 0xcf, 0x62, 0x26, 0x26, 0x2f,
        0x89, 0x39, 0xe1, 0x96, 0xe6, 0xae, 0x73, 0xf1, 0x1c, 0x14, 0x69, 0x2c,
        0xb1, 0xbc, 0x9c, 0x4b, 0x65, 0x67, 0xf3, 0x26, 0x1b, 0x2b, 0xdb, 0xc7,
        0x53, 0x4c, 0x58, 0x35, 0x02, 0x0d, 0x38, 0x5b, 0xce, 0xde, 0x98, 0x82,
        0x58, 0x57, 0x0f, 0x16, 0x4f, 0x17, 0x67, 0x3a, 0xe3, 0x98, 0x08, 0x51,
        0xbc, 0x6f, 0x18, 0xce, 0x67, 0xb5, 0x54, 0xec, 0x27, 0x57, 0x8c, 0x49,
        0xeb, 0xbd, 0xfa, 0x3e, 0x6d, 0xff, 0x3e, 0x41, 0xd8, 0x15, 0xe5, 0x31,
        0x4f, 0xc0, 0xde, 0x6c, 0x8b, 0x41, 0x92, 0x09, 0x63, 0x29, 0xb8, 0x4c,
        0x04, 0xbb, 0xe7, 0xa7, 0xa5, 0x13, 0x6e, 0xe5, 0x22, 0x02, 0x6b, 0x51,
        0xf8, 0xa5, 0xea, 0xc2, 0x9d, 0x06, 0xe5, 0x1d, 0x93, 0xc5, 0x16, 0x4d,
        0x96, 0x11, 0x87, 0xe3, 0x5c, 0x8d, 0x7d, 0x9a, 0x80, 0x42, 0x94, 0x33,
        0x1e, 0x03, 0xf2, 0x15, 0x53, 0xae, 0x1a, 0x51, 0x34, 0xe8, 0x2a, 0x3f,
        0xe2, 0x00, 0xfb, 0x04, 0x4f, 0xcb, 0xd2, 0x3a, 0x3d, 0x6d, 0xa9, 0xb6,
        0xfe, 0x74, 0xeb, 0x85, 0x58, 0x49, 0x94, 0x2f, 0x6a, 0xdd, 0xdd, 0xcf,
        0x05, 0xb5, 0x1e, 0x27, 0x8e, 0xb9, 0x40, 0x83, 0x68, 0xcd, 0x59, 0x11,
        0x14, 0xd8, 0xcf, 0xd3, 0xf5, 0x87, 0xa2, 0x08, 0x0d, 0x1f, 0x42, 0xb8,
        0x41, 0x71, 0xdd, 0x33, 0x8d, 0xd1, 0x85, 0x54, 0x91, 0xf1, 0x2f, 0x00,
        0x1e, 0x21, 0xf8, 0x17, 0xb1, 0x9e, 0x36, 0x00, 0xc5, 0xba, 0x1d, 0x8c,
        0x4d, 0xc6, 0x30, 0xfb, 0x3e, 0x19, 0x52, 0x41, 0xf4, 0x40, 0x9d, 0x29,
        0x83, 0xf8, 0x82, 0x68, 0xaf, 0xe1, 0x9b, 0xf0, 0x3a, 0xe9, 0x03, 0x1c,
        0xae, 0xaa, 0x78, 0x5d, 0x0d, 0xce, 0x3f, 0x68, 0x79, 0x06, 0x7e, 0x97,
        0xc9, 0x83, 0x05, 0xf8, 0x60, 0x24, 0x95, 0xf3, 0x88, 0x98, 0xc9, 0x08,
        0x51, 0x4f, 0xa5, 0x03, 0x8d, 0x1a, 0xb2, 0x67, 0xef, 0xde, 0xbb, 0x4f,
        0xf7, 0xa9, 0x14, 0x6e, 0x58, 0x8e, 0x76, 0x11, 0x11, 0x27, 0x97, 0x82,
        0x3e, 0x11, 0x9f, 0xa7, 0xd0, 0xf9, 0x10, 0x3f, 0x04, 0xbe, 0xb0, 0x80,
        0x6d, 0x29, 0x78, 0x76, 0x06, 0xd4, 0x70, 0x95, 0x29, 0x47, 0x2d, 0xe2,
        0xe1, 0xa6, 0x5f, 0xe1, 0x21, 0xcc, 0x70, 0x17, 0xa8, 0x87, 0xf1, 0x74,
        0x69, 0xf2, 0x04, 0x18, 0x9f, 0x33, 0x61, 0x9f, 0xbe, 0x3c, 0x38, 0xaf,
        0xd0, 0x22, 0xf0, 0x71, 0x73, 0x68, 0x9c, 0x0f, 0xf0, 0x2f, 0x44, 0x81,
        0x3f, 0x2d, 0xf7, 0xef, 0xe3, 0x8d, 0x6d, 0xf6, 0xf9, 0xda, 0x5b, 0xbe,
        0x77, 0x44, 0xe0, 0x95, 0xb8, 0x05, 0x0a, 0x55, 0x9c, 0x15, 0x32, 0x71,
        0x23, 0xe2, 0x12, 0x6b, 0x89, 0x42, 0x39, 0x5f, 0x24, 0x97, 0x9f, 0x74,
        0xe0, 0x86, 0xee, 0x10, 0xa3, 0xc0, 0xac, 0x9c, 0xd5, 0x2b, 0xae, 0xd7,
        0x52, 0x29, 0x85, 0x3b, 0xe7, 0x3c, 0x06, 0x14, 0xa2, 0xb9, 0x94, 0x4d,
        0x08, 0xc7, 0xab, 0x44, 0x5d, 0xbf, 0x7e, 0x37, 0xdd, 0x32, 0x6d, 0x62,
        0xa8, 0x06, 0x6b, 0x3e, 0x72, 0xbd, 0x39, 0xf0, 0x72, 0x9c, 0x43, 0xf8,
        0xb2, 0x30, 0x4e, 0xa0, 0x9c, 0xc2, 0x9d, 0x40, 0x58, 0x3a, 0xdf, 0xd1,
        0xaa, 0xaa, 0xa2, 0x45, 0xee, 0xa1, 0x92, 0xee, 0x1d, 0x67, 0xc8, 0x7f,
        0x98, 0x48, 0x56, 0x38, 0xd6, 0x23, 0xd8, 0x9c, 0x5c, 0x73, 0xe6, 0x72,
        0x7d, 0xc2, 0xdf, 0xcd, 0xcb, 0xc6, 0xc6, 0xc8, 0xe3, 0xc2, 0x47, 0x07,
        0x57, 0x4e, 0x02, 0x77, 0xf7, 0x99, 0xfb, 0xb1, 0x45, 0xfa, 0xfc, 0x44,
        0xe4, 0x33, 0xb7, 0xad, 0x2c, 0x56, 0x5b, 0x42, 0x5f, 0xb5, 0x46, 0x83,
        0xd5, 0x2d, 0x5d, 0x97, 0xc3, 0xe0, 0x9a, 0x54, 0x40, 0xa0, 0xb5, 0xbf,
        0xb3, 0x44, 0x01, 0x75, 0xa8, 0x7e, 0x10, 0x57, 0xbe, 0x5b, 0xa4, 0x38,
        0xaa, 0xe5, 0x63, 0x42, 0x71, 0x5b, 0x9d, 0xe4, 0x0a, 0xdf, 0x44, 0xab,
        0xc5, 0x82, 0x3f, 0x11, 0xd6, 0xd3, 0x0c, 0xcb, 0x9e, 0x2d, 0xc2, 0x48,
        0xb9, 0xd5, 0x5d, 0x7c, 0x74, 0x69, 0x38, 0xdf, 0xc7, 0x62, 0xc6, 0x4f,
        0xb8, 0x89, 0xb2, 0xcf, 0x9c, 0x34, 0xb1, 0x27, 0x96, 0x63, 0x74, 0xd8,
        0x83, 0xd8, 0xb5, 0xf7, 0x87, 0x19, 0x67, 0xa8, 0xba, 0x2c, 0x8e, 0xc5,
        0xd8, 0x8c, 0xd0, 0xff, 0x73, 0xfa, 0x84, 0xaf, 0xec, 0xd7, 0x85, 0xa2,
        0xdf, 0x79, 0x9f, 0x13, 0xdf, 0x7a, 0x81, 0x53, 0xd8, 0xa8, 0x0c, 0x92,
        0xef, 0x8a, 0x2a, 0xf0, 0x61, 0x3e, 0x4a, 0xf1, 0xe4, 0xa9, 0x47, 0xba,
        0xe0, 0x8c, 0x31, 0x37, 0x43, 0xbf, 0xfc, 0xc5, 0x27, 0xd0, 0xc3, 0xb4,
        0xf2, 0x97, 0xe0, 0x05, 0xbc, 0x73, 0x73, 0x06, 0x87, 0x47, 0x37, 0xbb,
        0x57, 0x1d, 0xbd, 0xc1, 0x8e, 0x44, 0x83, 0x08, 0xca, 0xc8, 0x2a, 0x35,
        0x0d, 0x05, 0x97, 0x40, 0x44, 0xe3, 0x67, 0x36, 0x6d, 0x6d, 0x08, 0x73,
        0x3e, 0x3c, 0xb3, 0x5a, 0x01, 0x3f, 0xc3, 0x50, 0x0d, 0xa1, 0x4b, 0xc9,
        0xbb, 0x50, 0x46, 0xa9, 0x05, 0xde, 0x3a, 0x78, 0xf3, 0x44, 0xa5, 0x69,
        0x63, 0x94, 0x14, 0xf7, 0xa3, 0x79, 0xa4, 0xe9, 0xb8, 0x9e, 0x71, 0x4e,
        0xea, 0xca, 0x20, 0x5b, 0x74, 0x1c, 0xa4, 0x8f, 0x7b, 0x92, 0xfa, 0xe5,
        0xc7, 0x02, 0x02, 0x6c, 0xbb, 0x00, 0x41, 0x4e, 0x8f, 0x05, 0xb9, 0x21,
        0x3e, 0x7c, 0x1f, 0x3a, 0xe6, 0x45, 0x9c, 0x85, 0x76, 0xf2, 0x29, 0xec,
        0x99, 0xca, 0x5b, 0x8e, 0x6b, 0x4c, 0x7b, 0x2f, 0x00, 0x75, 0xcc, 0x8b,
        0x6e, 0xcb, 0x88, 0x26, 0x76, 0x03, 0xbe, 0xfe, 0xac, 0x7c, 0xf9, 0x46,
        0x2f, 0xbe, 0xe4, 0xd5, 0x65, 0xfa, 0x59, 0xb1, 0xe8, 0x10, 0x5c, 0x09,
        0x61, 0x96, 0xef, 0x98, 0x99, 0xc4, 0x0d, 0xf4, 0x83, 0x18, 0x13, 0xb2,
        0x90, 0x95, 0xb8, 0x17, 0x20, 0xd7, 0xbb, 0xe1, 0xd9, 0xc8, 0x36, 0xf2,
        0x15, 0x34, 0x99, 0xb2, 0x10, 0x32, 0x27, 0xe6, 0x0a, 0xed, 0xa0, 0x0d,
        0x75, 0xcc, 0x0a, 0x26, 0xb7, 0x5d, 0x70, 0x0c, 0x2d, 0x76, 0x73, 0x7a,
        0x94, 0x0d, 0x67, 0x4c, 0xe3, 0x0a, 0x83, 0xa7, 0x09, 0x75, 0xad, 0x12,
        0x42, 0xca, 0xc9, 0xd1, 0xb3, 0xa6, 0x8d, 0x9e, 0xfa, 0x42, 0xf3, 0xcb,
        0x00, 0xcc, 0xbc, 0x26, 0x7c, 0xab, 0x79, 0xa1, 0x4a, 0x71, 0x71, 0x81,
        0xca, 0x8b, 0xa0, 0x40, 0x41, 0x45, 0x2b, 0xfc, 0x49, 0x4b, 0x53, 0xd4,
        0x07, 0x8f, 0x41, 0xe5, 0xc6, 0x1d, 0x29, 0x12, 0x6b, 0x11, 0xec, 0x56,
        0xcb, 0x51, 0x25, 0xc5, 0xd4, 0xa0, 0x10, 0xc7, 0x28, 0xd2, 0xac, 0x9b,
        0x0c, 0xcf, 0x5a, 0xb3, 0xea, 0xb4, 0x86, 0xca, 0xaa, 0x5a, 0xe3, 0x8a,
        0xea, 0xdf, 0x9b, 0x84, 0xfc, 0xd5, 0xab, 0x19, 0x60, 0xee, 0xf1, 0xdd,
        0xdc, 0x31, 0xe6, 0x03, 0x34, 0x32, 0xbb, 0x1f, 0x56, 0xe0, 0xb9, 0x2c,
        0xa2, 0x85, 0xaf, 0xcd, 0x2f, 0x95, 0x3a, 0x28, 0x9b, 0x0b, 0x58, 0xf0,
        0xac, 0xff, 0xbd, 0xcc, 0x4a, 0x5c, 0xd7, 0x67, 0x68, 0xe9, 0x38, 0x25,
        0x00, 0xe0, 0xab, 0x01, 0x02, 0xcc, 0xad, 0x19, 0x2a, 0x2e, 0xaf, 0xf1,
        0x53, 0xed, 0x52, 0xea, 0x2f, 0x09, 0x60, 0xa1, 0x57, 0x04, 0x50, 0xe9,
        0x31, 0x03, 0x5d, 0xa7, 0xf5, 0x0d, 0xa3, 0xb6, 0x4c, 0x10, 0x13, 0xdd,
        0x2d, 0xa7, 0xaf, 0xb6, 0x4c, 0x1b, 0x78, 0xae, 0xdd, 0x77, 0x5a, 0x66,
        0xf1, 0xa2, 0xa6, 0x60, 0x77, 0xe8, 0xd4, 0xc3, 0x86, 0xf9, 0x5e, 0xc8,
        0xce, 0xe2, 0x88, 0x83, 0x50, 0x3b, 0x03, 0x4f, 0xbb, 0x89, 0xbf, 0xbb,
        0xc2, 0xbb, 0x92, 0xa4, 0xbd, 0xf0, 0xa0, 0xea, 0xc6, 0xd5, 0x79, 0x44,
        0xfa, 0x4b, 0xf7, 0xac, 0x7e, 0x17, 0x01, 0x81, 0x46, 0xdb, 0x7c, 0x84,
        0x14, 0x50, 0x75, 0x5a, 0x1f, 0xdb, 0xf7, 0x44, 0xf0, 0xf8, 0x8b, 0x65,
        0x06, 0xd3, 0x7e, 0x09, 0xba, 0x71, 0x5c, 0xfb, 0x35, 0xac, 0x0b, 0xda,
        0xf9, 0x5e, 0x61, 0x95, 0xe5, 0x3d, 0x47, 0xb2, 0xcc, 0xcb, 0x20, 0x9c,
        0x89, 0xf4, 0xdd, 0x12, 0x54, 0x89, 0xd6, 0xdb, 0x52, 0xe9, 0x6a, 0xb2,
        0xb4, 0xa7, 0xb4, 0xc9, 0x19, 0x94, 0xa2, 0xa4, 0xdc, 0x67, 0xc8, 0xe5,
        0x16, 0xe2, 0x17, 0x1a, 0xec, 0x67, 0x4d, 0x99, 0x71, 0x9c, 0x63, 0xb5,
        0x63, 0x41, 0x2b, 0x24, 0xf8, 0x73, 0xc4, 0x8d, 0xb2, 0xda, 0x21, 0x5b,
        0xf4, 0x8c, 0x88, 0xd5, 0x25, 0x40, 0x39, 0xb1, 0xa9, 0xeb, 0x74, 0x97,
        0x6e, 0x53, 0x15, 0x03, 0x29, 0x76, 0xab, 0x79, 0x22, 0x5c, 0xbd, 0x47,
        0x06, 0x64, 0x42, 0xc6, 0xd9, 0x88, 0x20, 0x1f, 0xe4, 0xba, 0x88, 0xa8,
        0x21, 0xc0, 0x42, 0xbb, 0x11, 0x62, 0x82, 0xca, 0xc5, 0xfb, 0x0b, 0x64,
        0x84, 0x10, 0xce, 0x49, 0x92, 0x9b, 0xbd, 0x70, 0x26, 0x92, 0x33, 0xbb,
        0x56, 0x6b, 0x71, 0x62, 0xcb, 0x2c, 0x11, 0x95, 0xc3, 0xb4, 0x06, 0xe2,
        0xc1, 0x7d, 0xf3, 0x0b, 0x63, 0xf5, 0x84, 0x1a, 0x15, 0xb0, 0x25, 0x70,
        0xbc, 0xac, 0x6d, 0xd1, 0xde, 0x33, 0xe2, 0x96, 0xc9, 0x01, 0xa3, 0xcd,
        0x5a, 0x0d, 0xbe, 0x29, 0xb1, 0x78, 0x0d, 0x5d, 0xc6, 0x87, 0x6d, 0x8f,
        0x40, 0x58, 0xe8, 0xe0, 0x41, 0x15, 0x6d, 0xfb, 0x02, 0xb8, 0x0e, 0xce,
        0x41, 0xe3, 0x5b, 0x34, 0x77, 0xe4, 0x50, 0x23, 0xf4, 0x4b, 0xa0, 0xdb,
        0xf8, 0x33, 0x7c, 0x68, 0xd2, 0xdf, 0xd4, 0x5c, 0xd1, 0x7e, 0x09, 0x93,
        0x6f, 0xdc, 0xd5, 0xb5, 0x95, 0x6d, 0x0c, 0x7f, 0x6e, 0xf4, 0x64, 0x59,
        0xf2, 0x49, 0x4a, 0xd1, 0xa0, 0x3e, 0xcf, 0xf0, 0x25, 0x8f, 0x3e, 0x18,
        0x89, 0x16, 0x9b, 0x73, 0xde, 0x6e, 0xa1, 0x6c, 0xe7, 0x1e, 0x01, 0x88,
        0x93, 0x6f, 0x45, 0x0d, 0xa2, 0x2c, 0x17, 0x03, 0x2f, 0x91, 0x1b, 0x8a,
        0x7f, 0xa9, 0x6f, 0x0b, 0xff, 0x5a, 0x2e, 0x31, 0xfe, 0x4e, 0x95, 0x07,
        0x57, 0xac, 0xde, 0xb1, 0x73, 0x8d, 0x65, 0x93, 0x16, 0x50, 0xf3, 0xf6,
        0x3b, 0x19, 0xf0, 0xcc, 0x80, 0x40, 0x91, 0x96, 0x2d, 0x35, 0xd4, 0x92,
        0xf0, 0xd5, 0x34, 0x2f, 0xbd, 0x3e, 0xc3, 0x81, 0xc5, 0x49, 0xaf, 0xf1,
        0x75, 0x91, 0x25, 0x32, 0x72, 0xd4, 0x8a, 0xb0, 0x59, 0xcc, 0x74, 0x18,
        0xdd, 0x10, 0x23, 0xf9, 0x3f, 0x31, 0xab, 0xd0, 0xa7, 0x2b, 0x76, 0x61,
        0xcf, 0xa1, 0xbd, 0x93, 0x19, 0xef, 0xa9, 0xdc, 0xb3, 0xf5, 0x12, 0x5b,
        0x51, 0x88, 0xa3, 0x22, 0x35, 0xbf, 0x13, 0x83, 0xa3, 0xfe, 0x61, 0xa4,
        0xcb, 0x47, 0x4f, 0xc7, 0x36, 0x93, 0x57, 0xaf, 0x5e, 0xb9, 0x67, 0x52,
        0x83, 0xfb, 0xd4, 0x7f, 0xb6, 0x87, 0x03, 0xa0, 0xee, 0x32, 0x07, 0x3e,
        0xae, 0x03, 0x9b, 0x95, 0x25, 0xf5, 0x6c, 0x05, 0x64, 0x57, 0xa6, 0xd9,
        0x95, 0x34, 0xb9, 0xa4, 0x3b, 0x48, 0x5d, 0x91, 0xce, 0xfd, 0x09, 0xe8,
        0xdc, 0x2d, 0x1f, 0xac, 0xa5, 0xb4, 0xf6, 0x4e, 0x9a, 0xf0, 0x75, 0xff,
        0x78, 0x55, 0x08, 0xe7, 0xf8, 0x11, 0xe8, 0x8b, 0x7d, 0x94, 0x58, 0xa1,
        0xcf, 0x38, 0xd8, 0x14, 0xdd, 0x38, 0x48, 0x99, 0x32, 0x89, 0x0d, 0x15,
        0x2e, 0x72, 0x3a, 0x12, 0xe3, 0x7d, 0x15, 0x73, 0x14, 0x34, 0x2e, 0xb9,
        0xdb, 0x27, 0x98, 0x76, 0x3c, 0x55, 0x01, 0xf7, 0x83, 0xe7, 0xc0, 0xe9,
        0x67, 0x6a, 0xbc, 0x5e, 0x07, 0x77, 0xb3, 0x81, 0x01, 0xaa, 0xe5, 0x3c,
        0xd5, 0xf3, 0xff, 0xee, 0x89, 0x07, 0x53, 0x8c, 0x9c, 0x32, 0x6a, 0x23,
        0xc5, 0xd6, 0xc9, 0xbf, 0xbc, 0x67, 0x47, 0x19, 0x26, 0xcb, 0x0d, 0xe5,
        0x29, 0x6c, 0x78, 0x6a, 0x16, 0xa6, 0x5c, 0x28, 0xaa, 0x09, 0x3e, 0xca,
        0xe2, 0xf7, 0xd2, 0x8a, 0x60, 0xa8, 0x10, 0x6b, 0x80, 0x3f, 0x65, 0x1d,
        0x4a, 0x44, 0xac, 0x01, 0xca, 0xde, 0x59, 0xd1, 0x5b, 0x77, 0x15, 0x4f,
        0x67, 0x94, 0xaa, 0xc9, 0x32, 0x7e, 0x86, 0xd8, 0x9f, 0xaa, 0x0e, 0xaf,
        0x02, 0x1e, 0xc9, 0xf0, 0x75, 0xb2, 0x8e, 0x07, 0x27, 0xc8, 0xb6, 0x36,
        0xab, 0x24, 0xb4, 0x22, 0xf6, 0x11, 0xf4, 0x9b, 0x99, 0xd7, 0xc6, 0xeb,
        0xc0, 0x6e, 0x32, 0xb1, 0xe0, 0x62, 0x5a, 0xdf, 0x5d, 0xc9, 0x76, 0x6c,
        0xec, 0x78, 0xf5, 0xb8, 0xd4, 0x8f, 0xdf, 0xf7, 0x10, 0x4b, 0xa7, 0x45,
        0xf7, 0xfc, 0x35, 0x5e, 0x74, 0x9d, 0x07, 0x47, 0x6b, 0xb0, 0xf6, 0x3a,
        0x80, 0x30, 0x3d, 0x22, 0x54, 0xfd, 0xc0, 0xdd, 0xc2, 0x08, 0x4f, 0xca,
        0xcd, 0x7b, 0x47, 0x08, 0x6a, 0xb8, 0x8f, 0x5c, 0xd5, 0x51, 0xa0, 0xb9,
        0x1d, 0xc0, 0x44, 0xeb, 0xc8, 0xd8, 0xda, 0x3e, 0xa2, 0xe1, 0xfc, 0x99,
        0xc0, 0xb1, 0x89, 0x59, 0x55, 0xa7, 0xf7, 0xbf, 0x35, 0xce, 0x2d, 0x83,
        0x21, 0x83, 0xa4, 0xa1, 0x84, 0x22, 0xb4, 0xee, 0x51, 0xb8, 0x59, 0xc0,
        0xdc, 0xc6, 0x7d, 0x02, 0x99, 0x29, 0xb1, 0xbf, 0x3f, 0x5c, 0x2a, 0x2d,
        0xac, 0x24, 0xf7, 0xfa, 0x61, 0x63, 0xfe, 0xf7, 0x29, 0x3f, 0xa5, 0x12,
        0xce, 0x29, 0x7a, 0xfa, 0xc3, 0xc4, 0xa0, 0x0e, 0xc3, 0xa3, 0x21, 0x95,
        0x21, 0xf3, 0xd9, 0x0b, 0x97, 0x99, 0x3a, 0xef, 0xcc, 0x29, 0x76, 0xc2,
        0xbd, 0xc7, 0x77, 0xfe, 0x48, 0x2d, 0x12, 0x8c, 0x87, 0x50, 0x2c, 0x8f
    ]),
    "Deep Pink": new Uint8Array([
        0x24, 0xbf, 0x51, 0x14, 0x36, 0x64, 0xfc, 0x5e, 0x25, 0x82, 0x36, 0xc7,
        0x1d, 0x3d, 0xc5, 0x39, 0x21, 0xde, 0xd1, 0x33, 0x7b, 0x18, 0xed, 0x1c,
        0x42, 0x2a, 0xd1, 0xc7, 0x0d, 0x63, 0x70, 0x82, 0xf1, 0x2b, 0x2c, 0xef,
        0x7f, 0x0f, 0xb8, 0x2b, 0x3a, 0x1c, 0x8f, 0xa4, 0x38, 0xfc, 0xc1, 0x98,
        0x1c, 0xed, 0xbb, 0x66, 0x25, 0x76, 0xa4, 0xc2, 0x64, 0x0f, 0x11, 0x62,
        0x78, 0x75, 0xdd, 0xf5, 0x25, 0x78, 0xb8, 0xe8, 0x20, 0xe9, 0x9c, 0xde,
        0x4f, 0x5c, 0xed, 0xc4, 0x2b, 0xab, 0x98, 0x88, 0xc2, 0xee, 0x80, 0x08,
        0x7e, 0x83, 0xab, 0xcb, 0x70, 0x8a, 0x40, 0x8a, 0xd5, 0x2c, 0x4f, 0xb1,
        0xd2, 0x2a, 0x39, 0xa2, 0x46, 0xeb, 0x7c, 0x2a, 0x62, 0xbe, 0x20, 0xa0,
        0x6e, 0x45, 0x1a, 0xff, 0xfe, 0x62, 0x17, 0x9a, 0xb4, 0x62, 0x28, 0xde,
        0x6d, 0x58, 0x8d, 0xe4, 0xe6, 0xc4, 0x70, 0x41, 0x5c, 0x67, 0xd5, 0x51,
        0xf5, 0x70, 0xd7, 0x3f, 0x28, 0x93, 0x17, 0x1f, 0x7e, 0x7c, 0x6a, 0x2b,
        0xf1, 0x1c, 0x77, 0x57, 0x15, 0x56, 0x6b, 0x79, 0x23, 0x05, 0x34, 0x65,
        0xda, 0xa3, 0x7a, 0x04, 0x1e, 0xfb, 0xe7, 0xd4, 0xc8, 0xbb, 0xa8, 0x2d,
        0x27, 0x0f, 0x3b, 0xfe, 0x4b, 0xb6, 0xc6, 0x35, 0xba, 0xe0, 0x93, 0xa9,
        0xd5, 0xe5, 0x40, 0x65, 0xf7, 0x5b, 0x0d, 0xf1, 0x6d, 0x06, 0x17, 0x82,
        0x4d, 0x71, 0xa2, 0x1e, 0x42, 0xa1, 0xbf, 0x7e, 0x26, 0x50, 0xcc, 0x7c,
        0xe2, 0x0e, 0xbc, 0x53, 0xb3, 0x78, 0x95, 0x03, 0xd8, 0x77, 0xee, 0x83,
        0x85, 0x1e, 0x83, 0x3c, 0xd5, 0x60, 0x4b, 0x77, 0xad, 0x6a, 0x77, 0xa6,
        0x9b, 0x84, 0xf6, 0x1d, 0x47, 0x93, 0x75, 0xfb, 0x37, 0xd3, 0xd3, 0x11,
        0x0b, 0xa1, 0x2c, 0x37, 0x82, 0x6e, 0xfd, 0x5d, 0x03, 0x1b, 0x10, 0x2f,
        0xfb, 0x38, 0x6f, 0x65, 0xda, 0xea, 0xbf, 0x3c, 0x4e, 0x06, 0xff, 0x54,
        0xe9, 0x06, 0xdf, 0x2f, 0x78, 0x11, 0x99, 0x44, 0x93, 0x4e, 0xa0, 0x14,
        0x4d, 0x2c, 0xf1, 0x98, 0x7e, 0x98, 0x51, 0xce, 0xdf, 0x91, 0xff, 0x1a,
        0xe8, 0x95, 0xbb, 0xc7, 0x0e, 0x79, 0x00, 0xaf, 0xa2, 0x1d, 0x7a, 0xb1,
        0x38, 0x68, 0xc6, 0xb1, 0xae, 0xce, 0x9d, 0xc6, 0xcb, 0x51, 0x5c, 0x73,
        0x4e, 0x54, 0x66, 0xdc, 0x31, 0xcc, 0x5c, 0x8d, 0x7a, 0x8e, 0x86, 0xb8,
        0x5f, 0x54, 0xb7, 0x16, 0xdd, 0xc1, 0x74, 0x6a, 0xc5, 0x03, 0xc8, 0x6c,
        0x59, 0x44, 0x4c, 0x09, 0x37, 0x64, 0x41, 0x98, 0xb7, 0x04, 0xda, 0xa4,
        0xba, 0xe6, 0xff, 0x12, 0x30, 0x56, 0xf9, 0x7d, 0xc7, 0xfc, 0x84, 0xcf,
        0x95, 0x46, 0x67, 0x2e, 0x3f, 0xf5, 0xdf, 0x43, 0x06, 0x6e, 0x39, 0x65,
        0x4d, 0xd7, 0x12, 0x97, 0xf4, 0x3b, 0xf1, 0x4b, 0x04, 0xef, 0x39, 0xd7,
        0x6b, 0x65, 0x75, 0x13, 0xef, 0x1f, 0xb7, 0x28, 0x6a, 0xc4, 0xda, 0x0c,
        0xd8, 0x0f, 0xc6, 0x5a, 0x94, 0xaf, 0x27, 0x92, 0x57, 0x4d, 0xf6, 0x79,
        0x74, 0xd5, 0x75, 0xc8, 0x7d, 0x07, 0x52, 0x1a, 0x50, 0x7d, 0xbe, 0x7a,
        0x99, 0x1d, 0x8c, 0x81, 0xcf, 0x52, 0x31, 0xdc, 0xee, 0x57, 0xbd, 0x01,
        0x78, 0x39, 0x20, 0xe1, 0x49, 0x70, 0xda, 0x09, 0x9e, 0xdd, 0xc2, 0xe2,
        0x63, 0xeb, 0x4d, 0x29, 0x52, 0x7e, 0x39, 0x7d, 0xb1, 0xf3, 0xee, 0x34,
        0xbf, 0xae, 0x5e, 0xbf, 0x4e, 0x3d, 0xbf, 0x72, 0x18, 0xb1, 0x37, 0x95,
        0x41, 0x88, 0xb1, 0x28, 0x9f, 0x9b, 0x6a, 0xb0, 0x7a, 0x3a, 0x4d, 0xf9,
        0x52, 0x5b, 0x5d, 0xb6, 0x64, 0x4a, 0xa8, 0x90, 0x6d, 0x6b, 0x51, 0x2b,
        0x51, 0x92, 0xf0, 0x70, 0xec, 0xa1, 0x92, 0x08, 0xbb, 0x68, 0xb1, 0xe1,
        0xf9, 0xa5, 0x2e, 0xab, 0x2b, 0x48, 0x47, 0x0d, 0xb0, 0x22, 0xdd, 0x64,
        0x8b, 0xa4, 0x83, 0xef, 0x20, 0x11, 0xd8, 0x78, 0x20, 0xf6, 0x7c, 0x76,
        0x68, 0x9a, 0x76, 0x76, 0x73, 0x58, 0x32, 0xef, 0x16, 0xfe, 0x63, 0x80,
        0x0f, 0x05, 0x38, 0x51, 0x05, 0xfc, 0xdf, 0xda, 0x3d, 0xc8, 0x5c, 0xfa,
        0xd6, 0x4b, 0xec, 0x3b, 0xf4, 0x10, 0xe9, 0xc4, 0xf8, 0x6a, 0x33, 0xd6,
        0x83, 0x85, 0xc9, 0x7d, 0x7a, 0xd3, 0x1f, 0xbf, 0x99, 0xd7, 0x7f, 0x0a,
        0x72, 0x02, 0x4e, 0x22, 0x21, 0x97, 0x4a, 0x6b, 0x2f, 0x92, 0x63, 0x07,
        0x49, 0x2b, 0xbe, 0xfd, 0x2a, 0xe4, 0xaa, 0x0c, 0x37, 0xa4, 0x20, 0xed,
        0x83, 0x2d, 0xec, 0x8d, 0x2c, 0x66, 0xce, 0xc8, 0x2f, 0x15, 0x80, 0x15,
        0x6e, 0x8e, 0xb9, 0x70, 0x80, 0x90, 0xf8, 0x9a, 0xd7, 0x0e, 0xa6, 0x71,
        0xc4, 0xdd, 0xc4, 0xed, 0x44, 0x77, 0x60, 0x2f, 0x64, 0x9b, 0x4c, 0xaa,
        0x37, 0xcf, 0x96, 0xce, 0x13, 0xe9, 0x38, 0x1b, 0x1d, 0xae, 0x7a, 0xf8,
        0xcc, 0xae, 0xe1, 0xb7, 0x80, 0x08, 0xa9, 0x90, 0x2e, 0xdd, 0x00, 0x99,
        0x54, 0x00, 0xf4, 0x22, 0x75, 0x19, 0x32, 0x8b, 0x48, 0xdf, 0xca, 0x3f,
        0x9e, 0x6e, 0xd5, 0x56, 0xaf, 0xc2, 0x25, 0x92, 0xa3, 0x4d, 0xde, 0xe6,
        0x9b, 0x1f, 0x33, 0xda, 0x9a, 0x87, 0x83, 0xf7, 0x24, 0xcc, 0xb8, 0xb5,
        0x77, 0x8f, 0x8d, 0x89, 0xa9, 0x53, 0x79, 0xfc, 0xc7, 0xe2, 0x28, 0x1d,
        0xc3, 0xac, 0x27, 0x9c, 0x9f, 0x04, 0x0d, 0xd0, 0x73, 0x55, 0x14, 0x44,
        0xa5, 0x57, 0x46, 0x39, 0x85, 0xb6, 0x80, 0x92, 0xc3, 0xc6, 0xc1, 0xd3,
        0x15, 0xa1, 0x17, 0xd4, 0xb2, 0x2b, 0xb7, 0x8f, 0xb6, 0x5d, 0xa4, 0x41,
        0x7a, 0x59, 0x77, 0x1e, 0x7b, 0x40, 0xbe, 0xbb, 0xa3, 0x12, 0x74, 0xbe,
        0xe4, 0x8c, 0xa1, 0x52, 0x9c, 0x64, 0xea, 0xa7, 0x4b, 0xa2, 0x58, 0x6e,
        0x19, 0xfd, 0x10, 0x56, 0xfd, 0x84, 0xcd, 0x3e, 0x16, 0x0f, 0xed, 0x3a,
        0xa6, 0xe5, 0x71, 0xaa, 0x4f, 0xbc, 0xe9, 0xd1, 0xb2, 0xbf, 0x51, 0x30,
        0xc5, 0xd5, 0x33, 0x15, 0x21, 0xd5, 0x65, 0xd1, 0x2d, 0x0a, 0x9b, 0x2b,
        0x95, 0xd0, 0xaf, 0x46, 0xe9, 0x62, 0x60, 0x50, 0x1c, 0x87, 0x56, 0x98,
        0x44, 0xe3, 0xcd, 0x32, 0x09, 0x32, 0xdd, 0x95, 0xd0, 0xb6, 0xaf, 0x65,
        0x04, 0xad, 0x1f, 0x99, 0x7d, 0xc3, 0x5b, 0x15, 0xda, 0xc7, 0x96, 0xb5,
        0x0b, 0x47, 0xf4, 0x2e, 0x12, 0x7d, 0x71, 0x99, 0x86, 0x04, 0x89, 0x0c,
        0x27, 0xa5, 0x84, 0xc0, 0xb7, 0xd7, 0x35, 0xd0, 0xe7, 0x11, 0x9e, 0xc0,
        0xfd, 0xfc, 0xcb, 0xbc, 0xbc, 0x80, 0x52, 0x4f, 0xe3, 0x6b, 0x58, 0x1e,
        0x45, 0x76, 0xe1, 0x6b, 0xf4, 0x6b, 0xd0, 0x51, 0xce, 0x90, 0x76, 0x65,
        0xfe, 0x4c, 0x7c, 0xcb, 0xbb, 0x66, 0x15, 0xcc, 0x10, 0x06, 0x75, 0xb9,
        0xed, 0x54, 0x83, 0xd8, 0xee, 0xbb, 0xd2, 0xf7, 0x4f, 0x10, 0xd5, 0x83,
        0x8a, 0x1d, 0xd8, 0xed, 0x4b, 0x81, 0x69, 0x1e, 0xc0, 0xa4, 0x77, 0x67,
        0xf2, 0x9e, 0xee, 0x83, 0xa7, 0x90, 0x3b, 0x5b, 0x40, 0x61, 0x66, 0x05,
        0x88, 0xde, 0x8a, 0x7b, 0x37, 0x2b, 0x52, 0x14, 0x8c, 0x36, 0xcb, 0x1c,
        0xf9, 0xdc, 0xfb, 0xd2, 0x39, 0x81, 0xe2, 0xe9, 0xff, 0x83, 0xaf, 0x46,
        0xe5, 0xb9, 0x6d, 0xd0, 0xd6, 0x08, 0x1a, 0x6f, 0xc0, 0x41, 0xcf, 0xf0,
        0x73, 0x8d, 0xac, 0x34, 0x6b, 0xc0, 0x9e, 0x3e, 0x04, 0x98, 0xcf, 0x43,
        0xf5, 0xf3, 0xac, 0x89, 0x59, 0x5a, 0xa5, 0xc5, 0x03, 0x59, 0xf8, 0x4d,
        0x18, 0xbe, 0xc8, 0x3c, 0x8c, 0x7e, 0x58, 0xdc, 0x91, 0x39, 0xc2, 0x98,
        0x2c, 0x64, 0xcc, 0x76, 0xb1, 0x86, 0x83, 0x1e, 0x4a, 0x60, 0x53, 0x8b,
        0x59, 0xfb, 0xe1, 0x1e, 0x9a, 0x86, 0x0f, 0x66, 0xdb, 0x5a, 0x02, 0x72,
        0x74, 0x30, 0x6e, 0x68, 0x6d, 0x3f, 0x28, 0x66, 0x49, 0x5f, 0x36, 0x0b,
        0x51, 0xa7, 0xb0, 0x07, 0x8a, 0x7f, 0xd9, 0x96, 0xb5, 0xff, 0x34, 0xfa,
        0xf0, 0x9d, 0xe5, 0xf2, 0x16, 0x24, 0xe2, 0xba, 0x20, 0x13, 0x10, 0x41,
        0x36, 0xf7, 0x19, 0x2e, 0x83, 0xf8, 0xc2, 0x62, 0x32, 0xfd, 0xbf, 0x93,
        0xa6, 0x5b, 0x00, 0x6e, 0xc4, 0x04, 0x4f, 0xf9, 0xf3, 0x10, 0xcf, 0xa0,
        0x96, 0x48, 0x4e, 0x69, 0x92, 0x02, 0xd8, 0x5b, 0xa8, 0x9a, 0xf3, 0xae,
        0xdc, 0x76, 0xf0, 0x3d, 0x05, 0xac, 0x7b, 0x59, 0x1f, 0xf5, 0x6a, 0x21,
        0x72, 0x23, 0xb6, 0xbb, 0x6a, 0xf9, 0xdb, 0xf2, 0xaf, 0x76, 0xda, 0x2e,
        0xdf, 0xb4, 0x4c, 0x22, 0x11, 0x2a, 0xc2, 0xbf, 0xca, 0x24, 0xf8, 0xda,
        0x31, 0x54, 0xa6, 0xaa, 0x5e, 0xf9, 0x9c, 0xd2, 0x9e, 0x9a, 0x1f, 0x0c,
        0x51, 0xc5, 0x27, 0x63, 0x02, 0x3e, 0x81, 0x95, 0x12, 0x51, 0xb8, 0xdc,
        0x02, 0x92, 0xd0, 0x9a, 0xd4, 0xfd, 0xe5, 0x26, 0x7f, 0x72, 0xaa, 0x4b,
        0xfa, 0x1e, 0x0e, 0x21, 0xd8, 0x80, 0xc0, 0x86, 0xbd, 0xc4, 0x08, 0x48,
        0xa2, 0xf1, 0xf2, 0xb4, 0xd6, 0xfd, 0x52, 0xb8, 0xfa, 0xc2, 0x65, 0x3d,
        0xf6, 0xc6, 0x12, 0x8e, 0xcc, 0xfa, 0x01, 0x87, 0x61, 0x58, 0xa0, 0x49,
        0x4e, 0xc4, 0x14, 0xc7, 0xed, 0x5b, 0x8c, 0x5f, 0x95, 0xe3, 0x4d, 0x42,
        0x55, 0xa1, 0x12, 0x2e, 0xaa, 0x10, 0x0e, 0x55, 0xc1, 0xb3, 0x69, 0xa0,
        0x98, 0x18, 0x15, 0xad, 0xc2, 0x82, 0xdf, 0x64, 0x9a, 0xab, 0xb7, 0x85,
        0x88, 0x84, 0xfe, 0xe7, 0xb3, 0xbc, 0xe9, 0x9e, 0x2a, 0x38, 0x40, 0x7f,
        0xf0, 0x79, 0x23, 0x5e, 0xb1, 0x20, 0x77, 0x22, 0xb3, 0xe3, 0x19, 0x84,
        0xd4, 0x21, 0x4e, 0xc3, 0x5d, 0xe6, 0x70, 0xd6, 0x88, 0x86, 0x11, 0xc1,
        0x45, 0x18, 0x5b, 0x54, 0xf1, 0xb9, 0x5d, 0xfa, 0x4a, 0x83, 0xec, 0x8c,
        0xe5, 0xbb, 0x00, 0x27, 0x6e, 0xfc, 0x38, 0x4b, 0x03, 0xbf, 0xc0, 0xee,
        0x9b, 0x20, 0xbd, 0x3e, 0x70, 0x09, 0x3a, 0x67, 0xf9, 0xc7, 0x7d, 0x64,
        0xdb, 0x7e, 0x63, 0x84, 0x05, 0x34, 0x5b, 0x63, 0xad, 0x91, 0x2a, 0xe3,
        0xc4, 0xac, 0x61, 0xfd, 0x6f, 0x27, 0x13, 0xfa, 0x7a, 0x08, 0xf5, 0xd4,
        0x13, 0x21, 0xeb, 0x1c, 0xf9, 0x19, 0x77, 0x0a, 0x09, 0x7f, 0x55, 0x72,
        0x19, 0xae, 0x4c, 0xce, 0x51, 0x4c, 0x20, 0x1b, 0x73, 0xdb, 0xef, 0xfb,
        0xb4, 0x0b, 0x02, 0x3d, 0xfd, 0x79, 0x31, 0x38, 0x64, 0x65, 0x3d, 0x2e,
        0x8c, 0xfe, 0x8c, 0xa0, 0x88, 0xc0, 0x5b, 0xe5, 0xbe, 0x8d, 0x61, 0x63,
        0xb2, 0x16, 0xbf, 0x60, 0xb9, 0x3e, 0x93, 0x2d, 0xfb, 0x2a, 0xf6, 0xfa,
        0x9c, 0x9e, 0x7d, 0x97, 0x0d, 0xda, 0xff, 0x5c, 0xe5, 0x26, 0x67, 0x66,
        0x26, 0x3e, 0xa7, 0x06, 0x3e, 0x1c, 0x73, 0x71, 0x90, 0xfb, 0x1a, 0x13,
        0x6d, 0x64, 0x00, 0xe4, 0xd0, 0xae, 0x3f, 0xd5, 0x2a, 0x7a, 0x44, 0x74,
        0xf2, 0x9c, 0x19, 0x03, 0xd2, 0x6a, 0x96, 0xd3, 0x7b, 0xd8, 0x70, 0x61,
        0x95, 0xa4, 0x14, 0x00, 0xe2, 0xd1, 0x8e, 0xeb, 0xe9, 0x43, 0x74, 0xca,
        0xf1, 0x2b, 0xa8, 0xce, 0x9e, 0xa8, 0x08, 0x06, 0x6b, 0xe6, 0x55, 0x57,
        0x8a, 0xd9, 0xc1, 0xc1, 0x42, 0xcb, 0x76, 0x12, 0x65, 0x8a, 0x35, 0x4c,
        0xe7, 0xce, 0xa3, 0xb7, 0xab, 0x6b, 0x4e, 0x84, 0xbe, 0x22, 0x75, 0x7f,
        0x0e, 0x91, 0x33, 0xc0, 0x63, 0xf4, 0x5f, 0x8a, 0x98, 0x6a, 0xa2, 0xd1,
        0xbe, 0x0e, 0x98, 0xb4, 0x43, 0xf9, 0xa4, 0x46, 0x24, 0xaa, 0x4e, 0x40,
        0x3d, 0x1b, 0xb0, 0xf7, 0x6f, 0x46, 0xc3, 0x14, 0x7b, 0x55, 0xdb, 0x9b,
        0x8f, 0x58, 0x9a, 0x36, 0x1f, 0xfd, 0xc7, 0x4f, 0x29, 0xa6, 0x62, 0xd0,
        0x8b, 0xdf, 0x0b, 0xb0, 0x8e, 0x97, 0x83, 0x0e, 0x86, 0xa6, 0x26, 0x4c,
        0xea, 0x90, 0xd0, 0x90, 0x80, 0x6f, 0x20, 0x03, 0x84, 0xb1, 0x39, 0x4e,
        0x8f, 0x9e, 0x17, 0x0e, 0xa3, 0x25, 0xc1, 0x53, 0x01, 0x34, 0x4c, 0x44,
        0xf8, 0xfa, 0x82, 0xe2, 0x9d, 0xd5, 0x42, 0x65, 0xfe, 0x9b, 0xec, 0x27,
        0x95, 0xe5, 0xfe, 0x92, 0x59, 0xf5, 0xa9, 0x49, 0x06, 0x96, 0x34, 0x48,
        0xe9, 0x44, 0xd7, 0x08, 0xdd, 0x33, 0x5e, 0xf5, 0x40, 0xa1, 0x32, 0x43,
        0xad, 0x00, 0x8a, 0xbd, 0xd3, 0xce, 0x60, 0xda, 0xef, 0xf6, 0x1b, 0x27,
        0x11, 0x64, 0xa5, 0x81, 0x90, 0xfa, 0x29, 0x9f, 0xb7, 0x29, 0xb7, 0x88,
        0x4d, 0xf1, 0x73, 0x88, 0x77, 0x1b, 0x1b, 0xc0, 0x8c, 0xe8, 0xc3, 0x3e,
        0x83, 0x41, 0x12, 0xe6, 0x70, 0x18, 0x51, 0xf9, 0x2d, 0x90, 0x33, 0xcc,
        0xed, 0x8f, 0xc6, 0x66, 0x3c, 0x7a, 0xab, 0xfe, 0x8b, 0xca, 0x63, 0x39,
        0x8b, 0x73, 0xec, 0x1f, 0x34, 0x73, 0xe7, 0x70, 0x4c, 0x2b, 0x2d, 0x03,
        0x9a, 0x76, 0xc5, 0xdf, 0x92, 0x14, 0xc4, 0x47, 0x09, 0x2e, 0x97, 0x46,
        0xda, 0xa6, 0xf5, 0x01, 0xc0, 0xce, 0x5d, 0x53, 0xc8, 0x10, 0x7c, 0xd4,
        0xeb, 0x1a, 0x6f, 0x7d, 0x67, 0xf7, 0xbd, 0xcc, 0x7e, 0x54, 0x27, 0xe0,
        0x28, 0x03, 0x5b, 0xeb, 0xb0, 0x74, 0x2b, 0x1a, 0x8a, 0xbd, 0xe7, 0xc3,
        0x17, 0x7d, 0xb0, 0x32, 0x1c, 0x2d, 0x49, 0xbc, 0x9b, 0xf0, 0xbd, 0x92,
        0xef, 0x86, 0x29, 0xa3, 0xe9, 0xc9, 0x63, 0x5e, 0xca, 0x96, 0x7b, 0x7d,
        0x4d, 0xd8, 0xe5, 0x54, 0xd0, 0x4e, 0x06, 0xfa, 0x0d, 0x6d, 0x69, 0x16,
        0x06, 0x88, 0xba, 0x7e, 0xff, 0xf6, 0xb1, 0x34, 0x80, 0x08, 0x88, 0x27,
        0x49, 0xf3, 0x3d, 0x63, 0x91, 0xb8, 0x81, 0x6b, 0xe3, 0x9e, 0x82, 0x2f,
        0xe8, 0x26, 0xb4, 0x45, 0x05, 0x62, 0xf5, 0xc8, 0xb9, 0xa7, 0xb5, 0x85,
        0x11, 0xc4, 0x54, 0x1f, 0x43, 0x9a, 0x16, 0xf2, 0x42, 0xbe, 0x2f, 0x52,
        0x6e, 0x46, 0x51, 0x7f, 0x6d, 0xb7, 0xd8, 0x00, 0x83, 0x50, 0x4f, 0xb6,
        0xdd, 0x1f, 0x9d, 0x78, 0xb5, 0x82, 0xf1, 0x0c, 0x08, 0x06, 0x7a, 0xa5,
        0x27, 0x66, 0x05, 0x62, 0x92, 0x77, 0x4a, 0x1b, 0x6b, 0xa8, 0xd7, 0x83,
        0x33, 0x1a, 0xa7, 0x69, 0x62, 0x9d, 0x32, 0x4c, 0x1b, 0xc6, 0xbe, 0x18,
        0xff, 0x3d, 0xe8, 0xc4, 0xe4, 0xf7, 0x57, 0x31, 0xb9, 0x1f, 0xc1, 0x62,
        0xef, 0xac, 0xb8, 0x9b, 0x96, 0x2f, 0x2d, 0x47, 0x6a, 0x60, 0xc8, 0x15,
        0x85, 0x43, 0x6d, 0x32, 0x86, 0x01, 0x18, 0x32, 0xef, 0x58, 0xdc, 0x67,
        0xd5, 0xab, 0xdb, 0x2f, 0x26, 0x77, 0xc8, 0x5c, 0x33, 0xd8, 0x72, 0x47,
        0xc1, 0xab, 0x7e, 0x74, 0xcc, 0xe8, 0x91, 0x75, 0xcd, 0x4a, 0x79, 0xbf,
        0x89, 0x4d, 0xd7, 0x88, 0xa4, 0x93, 0x90, 0xe0, 0x25, 0xe0, 0xbf, 0x83,
        0x73, 0xdc, 0xee, 0x0b, 0x4e, 0xde, 0x0b, 0x31, 0xa3, 0xe0, 0x15, 0xcb,
        0xea, 0x1d, 0xa9, 0x52, 0x71, 0x67, 0xde, 0x85, 0xdb, 0x85, 0x4f, 0x78,
        0xfe, 0x6a, 0xf7, 0x14, 0x60, 0xe8, 0x3f, 0x11, 0xc7, 0xdd, 0xde, 0xa2,
        0x48, 0x05, 0x48, 0xa8, 0xae, 0xe6, 0x50, 0x06, 0x61, 0xf5, 0xc3, 0x84,
        0x1f, 0x96, 0x45, 0x83, 0xf0, 0xc9, 0x25, 0x4e, 0x28, 0x13, 0x03, 0x1d,
        0xb0, 0x90, 0x80, 0xfc, 0xc6, 0x9e, 0xb3, 0xed, 0x8d, 0x96, 0xf6, 0x7b,
        0x09, 0x4f, 0x4d, 0x44, 0x0b, 0x71, 0x4b, 0xff, 0x62, 0x3e, 0xc8, 0x77,
        0x20, 0x9c, 0xa8, 0x23, 0x57, 0x35, 0xd6, 0x48, 0x86, 0x48, 0xce, 0x4b,
        0xd3, 0x43, 0x65, 0x63, 0x83, 0xb6, 0x51, 0x37, 0x65, 0xfb, 0xb7, 0x4a,
        0x5c, 0xf9, 0xfe, 0x28, 0xb8, 0x86, 0xed, 0xba, 0xfe, 0x7c, 0xf8, 0xe9,
        0xb6, 0xfc, 0x43, 0x1e, 0xc2, 0x6a, 0x30, 0x31, 0xe7, 0x3e, 0x86, 0x64,
        0xaa, 0xbd, 0x60, 0x6c, 0xda, 0x55, 0x30, 0x0c, 0x15, 0x57, 0x43, 0xc8,
        0x3f, 0x5a, 0xd2, 0x8c, 0xce, 0xc7, 0x99, 0x7b, 0x1e, 0x53, 0x32, 0x12,
        0x9e, 0x45, 0xc0, 0x48, 0x69, 0xb6, 0x6f, 0x2b, 0xa6, 0xb4, 0xd1, 0x04,
        0x46, 0x52, 0x7b, 0x07, 0xf8, 0xa7, 0xfb, 0x76, 0xc2, 0x1e, 0x8a, 0xcf,
        0xce, 0x35, 0x33, 0x72, 0xf9, 0xff, 0xf3, 0x3d, 0x4d, 0xc0, 0x36, 0x85,
        0x70, 0xc7, 0xe4, 0xcb, 0x53, 0x70, 0x48, 0x22, 0xf5, 0x00, 0x03, 0xfd,
        0xca, 0x91, 0xfd, 0x58, 0x82, 0x00, 0xca, 0x45, 0x82, 0xce, 0x4a, 0xd5,
        0x20, 0xc5, 0x27, 0x1f, 0x5d, 0x3a, 0x60, 0xa6, 0xba, 0xd1, 0x3c, 0xf6,
        0xfd, 0x9d, 0x67, 0xab, 0x1c, 0x72, 0xed, 0x08, 0x32, 0xbb, 0x0c, 0x91,
        0xd0, 0xbc, 0x55, 0x90, 0x77, 0x3c, 0x95, 0x86, 0x38, 0x90, 0xd4, 0x86,
        0xf5, 0x13, 0x4f, 0xbb, 0xc5, 0x59, 0x03, 0x51, 0x5f, 0xd7, 0x61, 0xfa,
        0x82, 0x04, 0x3a, 0xc7, 0x3b, 0x7a, 0xa4, 0x2c, 0x20, 0xf2, 0xbf, 0xbb,
        0xf7, 0x83, 0xe8, 0xa8, 0x06, 0xea, 0xf8, 0xf7, 0x10, 0xc9, 0xcf, 0x33,
        0x7f, 0xcf, 0x16, 0xe0, 0x72, 0x33, 0xdd, 0xee, 0x8b, 0x42, 0x0d, 0x9f,
        0x1b, 0xc7, 0x8e, 0x13, 0x1b, 0xf9, 0x31, 0xc6, 0x4a, 0x7a, 0xaa, 0x48,
        0x1b, 0xa1, 0xea, 0x52, 0xfa, 0x32, 0xae, 0xb3, 0xc2, 0xe9, 0x0c, 0x0c,
        0x35, 0xd4, 0x1a, 0x5e, 0x1a, 0x7a, 0x2d, 0x2a, 0xfa, 0x5b, 0xc8, 0xb0,
        0x96, 0x8e, 0xc8, 0x4b, 0x86, 0xae, 0x5e, 0x38, 0xa1, 0x0f, 0xb1, 0x62,
        0x75, 0xaa, 0xc8, 0xbe, 0xd9, 0x0c, 0xfe, 0xbb, 0x97, 0x1f, 0x91, 0x37,
        0x24, 0x19, 0x31, 0xaf, 0x34, 0x42, 0x26, 0xae, 0xdd, 0x73, 0x94, 0x0b,
        0xea, 0x03, 0x20, 0xb1, 0xd1, 0xdf, 0x2b, 0x0d, 0xfb, 0x36, 0x7a, 0x69,
        0x18, 0xf3, 0xf6, 0x9a, 0x8c, 0x54, 0xe0, 0xb8, 0x8e, 0x2d, 0xdd, 0x06,
        0x1e, 0x99, 0xbe, 0x91, 0xa1, 0x17, 0xd4, 0x40, 0x5c, 0x3a, 0xc5, 0x1d,
        0xb8, 0xf5, 0xc8, 0x46, 0xd7, 0x1a, 0xef, 0xa0, 0x00, 0xc6, 0x23, 0x8e,
        0x30, 0x88, 0xda, 0xf2, 0x97, 0x28, 0x3f, 0xf4, 0xc1, 0xd8, 0xdd, 0x9e,
        0xba, 0x9f, 0x88, 0x9c, 0xd1, 0x20, 0xcb, 0x8a, 0x67, 0xdf, 0x4b, 0xe1,
        0x27, 0xc0, 0xca, 0xb8, 0xbe, 0x00, 0xe5, 0xdf, 0x5d, 0xc4, 0x20, 0x41,
        0xcf, 0x5b, 0x0d, 0xa7, 0x44, 0x47, 0x0d, 0xbc, 0xbf, 0xcf, 0x63, 0x0d,
        0x1a, 0xd2, 0xf1, 0x16, 0xe9, 0x14, 0x52, 0x50, 0x68, 0x1a, 0x2d, 0xf5,
        0xa0, 0x95, 0x9e, 0x16, 0x17, 0xc9, 0xdc, 0x97, 0x66, 0xe6, 0xca, 0xbd,
        0x25, 0x2e, 0x22, 0xef, 0x36, 0x4d, 0x6f, 0x1a, 0xc8, 0x8a, 0xa9, 0xdf,
        0x03, 0xfe, 0xa8, 0x7d, 0x6d, 0xa0, 0x54, 0x97, 0x41, 0x10, 0xb2, 0xdc,
        0x48, 0x90, 0xd9, 0x72, 0xd8, 0x23, 0x14, 0xc2, 0x2a, 0xc9, 0x73, 0x75,
        0x9b, 0xa0, 0x10, 0x68, 0x9a, 0x1f, 0xd1, 0x45, 0x4f, 0x86, 0x3f, 0x3f,
        0xd4, 0xe3, 0x57, 0x40, 0x93, 0xab, 0xc3, 0x9d, 0x9e, 0xde, 0x68, 0x8a,
        0x72, 0xe8, 0xd2, 0xd7, 0x99, 0x48, 0x4b, 0x81, 0xa9, 0xca, 0xbe, 0xd9,
        0xb2, 0xde, 0x0f, 0xbe, 0xb0, 0x87, 0x9b, 0xc4, 0xe1, 0x2a, 0xeb, 0x02,
        0xd8, 0xcd, 0x15, 0x74, 0x33, 0xdd, 0xf7, 0x2c, 0x47, 0xa3, 0x90, 0x8d,
        0xd5, 0xa1, 0xbc, 0xfc, 0xd4, 0xc6, 0x34, 0x05, 0xda, 0xc5, 0x97, 0xcc,
        0x19, 0x58, 0x84, 0x45, 0x80, 0xbc, 0xfa, 0x5b, 0xa2, 0x6b, 0x41, 0xd1,
        0x09, 0x26, 0xb2, 0x0f, 0x07, 0xd5, 0x51, 0x42, 0x90, 0x40, 0xca, 0xf2,
        0x05, 0x32, 0xab, 0xd6, 0x49, 0xbc, 0xc8, 0x91, 0x13, 0x61, 0x07, 0x0d,
        0x6e, 0x96, 0x13, 0x2a, 0x4c, 0xb3, 0x07, 0x4b, 0xe9, 0x1d, 0x49, 0x1d,
        0x2a, 0x2e, 0x2e, 0x37, 0x94, 0x2d, 0x63, 0x82, 0xab, 0xc3, 0x75, 0x7f,
        0x58, 0x3a, 0xa2, 0x8e, 0x03, 0xbd, 0x51, 0x76, 0x8b, 0x54, 0x75, 0x3d,
        0x39, 0xbd, 0x29, 0x95, 0x89, 0x81, 0x8c, 0x0f, 0xf9, 0x56, 0xee, 0x07,
        0xd0, 0xcc, 0x9b, 0xc4, 0xd0, 0xf6, 0x2d, 0x92, 0x76, 0xfc, 0x6d, 0x43,
        0x36, 0x59, 0xcf, 0xd2, 0x0d, 0x06, 0xca, 0x88, 0xa0, 0x61, 0x49, 0x04,
        0x38, 0x9c, 0x2b, 0xcf, 0x67, 0xc7, 0x02, 0xac, 0xf0, 0xd6, 0xfc, 0xe6,
        0xbd, 0xfc, 0x77, 0x00, 0x0a, 0xb7, 0xac, 0x43, 0xac, 0xb5, 0x14, 0x3f,
        0x03, 0xcf, 0xa6, 0x20, 0x9a, 0x16, 0x72, 0x54, 0x47, 0x40, 0xd7, 0x88,
        0xf2, 0x6d, 0x1d, 0x3d, 0x8c, 0xf3, 0x4e, 0x88, 0x16, 0xb6, 0xb4, 0xfe,
        0xa2, 0x65, 0xbc, 0xa6, 0x5a, 0x7e, 0x65, 0x33, 0xa7, 0x7b, 0x6f, 0x38,
        0x4a, 0xb2, 0x4c, 0x47, 0x69, 0x45, 0x47, 0xe8, 0x2c, 0x8f, 0xf0, 0xa1,
        0xeb, 0xf5, 0x21, 0xe5, 0xd2, 0x95, 0x25, 0x85, 0xba, 0x11, 0xa8, 0xc2,
        0x45, 0x2d, 0x2e, 0xbb, 0xa4, 0x45, 0x72, 0x0b, 0x7d, 0xff, 0x57, 0x95,
        0x3e, 0x84, 0x42, 0x43, 0x61, 0x1e, 0xf1, 0x46, 0x4f, 0x4b, 0x88, 0x62,
        0x97, 0xbd, 0x05, 0xe5, 0x34, 0x03, 0xb7, 0x9a, 0x69, 0x09, 0x89, 0x1a,
        0x35, 0x1f, 0xd5, 0x1b, 0xf1, 0xc6, 0xd9, 0x69, 0x0f, 0x70, 0x7c, 0x1f,
        0xe0, 0x72, 0xa3, 0x4f, 0x1b, 0x5c, 0x8d, 0xcd, 0x07, 0x3c, 0xa9, 0x1f,
        0xcf, 0x0a, 0x9d, 0x52, 0x38, 0x1a, 0x68, 0x95, 0xba, 0x8b, 0xf8, 0x35,
        0x70, 0xf7, 0x5a, 0x9a, 0x86, 0x56, 0x3a, 0x0b, 0x52, 0xf1, 0x67, 0xe0,
        0x79, 0xf0, 0xe8, 0xdc, 0x25, 0xe3, 0x89, 0xdc, 0x0f, 0x29, 0x28, 0xd6,
        0xee, 0x85, 0x36, 0x0f, 0x16, 0x3d, 0xf2, 0xda, 0x76, 0xea, 0x29, 0xc3,
        0x8d, 0x17, 0xcc, 0x49, 0x70, 0x49, 0x7d, 0x60, 0xf7, 0xf6, 0x65, 0x32,
        0x06, 0x2f, 0x16, 0x69, 0x90, 0xfa, 0xa0, 0x48, 0x52, 0x25, 0x33, 0x9a,
        0xff, 0x27, 0xbd, 0xd4, 0xc9, 0xee, 0xac, 0x13
    ]),
    "Fire Brick": new Uint8Array([
        0x47, 0x8f, 0x42, 0x10, 0xac, 0x86, 0x58, 0x69, 0x41, 0x27, 0x82, 0xd7,
        0x89, 0xf0, 0x21, 0x45, 0x39, 0x21, 0x39, 0xe2, 0xde, 0x76, 0x82, 0x63,
        0x27, 0x62, 0x4e, 0xdd, 0x47, 0x45, 0x4d, 0xfb, 0x15, 0xef, 0xc0, 0x95,
        0xe7, 0xa3, 0x16, 0x16, 0x07, 0x9d, 0xd2, 0xca, 0x5c, 0xa0, 0x9c, 0x3f,
        0xaa, 0x67, 0x20, 0xd2, 0x39, 0x1c, 0x76, 0xdf, 0x68, 0x18, 0xb5, 0x01,
        0x93, 0x06, 0x6b, 0x21, 0xec, 0x6f, 0x1e, 0x06, 0xf0, 0x1f, 0x68, 0xd7,
        0xd0, 0x2b, 0xa4, 0x31, 0xbf, 0xd4, 0x81, 0x03, 0x86, 0xfe, 0x44, 0x71,
        0xa4, 0x7f, 0x3d, 0x75, 0x8b, 0xda, 0x54, 0x5c, 0xcf, 0xd8, 0x1b, 0x5b,
        0x7c, 0xfa, 0x3c, 0xff, 0xc3, 0x95, 0x6b, 0x26, 0x8e, 0xad, 0x57, 0xde,
        0x16, 0xad, 0xc0, 0xa7, 0x00, 0xe3, 0xeb, 0xdd, 0x49, 0x61, 0x8b, 0x83,
        0x62, 0xc9, 0x70, 0xd1, 0x0a, 0xe6, 0x98, 0x9f, 0xde, 0xf9, 0x4a, 0x2b,
        0x8a, 0x57, 0x7c, 0x1a, 0xf1, 0x80, 0x81, 0xa1, 0x82, 0x6a, 0xd5, 0x21,
        0xf5, 0x21, 0x44, 0x61, 0x20, 0x7d, 0x7c, 0x2c, 0x7b, 0xae, 0x37, 0xbf,
        0xcb, 0x34, 0x1d, 0x56, 0xe8, 0xb2, 0x8a, 0xd4, 0x86, 0xcb, 0xf8, 0x70,
        0x97, 0x41, 0x2c, 0x52, 0x84, 0xe4, 0x78, 0x99, 0x2f, 0x51, 0x92, 0x22,
        0xdf, 0x3e, 0x8f, 0x3c, 0xcf, 0x29, 0xd8, 0xaa, 0xdf, 0xef, 0x32, 0xb1,
        0xc4, 0x92, 0xcd, 0xa4, 0x8c, 0xe8, 0xa1, 0xa0, 0xab, 0x42, 0x07, 0x70,
        0xdf, 0x92, 0x84, 0x3f, 0x10, 0x63, 0xac, 0x72, 0xd2, 0xa3, 0x3d, 0x27,
        0x36, 0xfb, 0x05, 0xe9, 0x73, 0x2e, 0xfd, 0xff, 0x21, 0x2c, 0xc1, 0x30,
        0xbc, 0x1b, 0x8f, 0x1b, 0x57, 0xc3, 0x68, 0x6f, 0xd1, 0xef, 0xd9, 0x1b,
        0xd7, 0x57, 0x70, 0xab, 0x09, 0x06, 0xf3, 0x7f, 0xed, 0xbc, 0x1d, 0xc5,
        0xe7, 0xc9, 0xc2, 0xa3, 0xbb, 0x0c, 0x60, 0x2b, 0x89, 0x38, 0xc9, 0xb3,
        0xea, 0x74, 0x2d, 0xa3, 0xda, 0xc9, 0xb6, 0xb5, 0x82, 0x14, 0x5f, 0xb3,
        0xd7, 0x76, 0x24, 0xc6, 0x6d, 0x62, 0x20, 0x9b, 0xc6, 0xf5, 0xd9, 0x22,
        0x07, 0x18, 0xef, 0x12, 0xef, 0xd3, 0x67, 0xca, 0x1b, 0x46, 0x5a, 0xb4,
        0x29, 0xc4, 0xf2, 0xd9, 0x0c, 0x43, 0x3b, 0xad, 0x44, 0x4e, 0xd1, 0x3f,
        0x82, 0x2a, 0x1a, 0x58, 0x13, 0x91, 0x32, 0x89, 0x34, 0xe0, 0x57, 0xf8,
        0x23, 0x21, 0x96, 0xee, 0xfe, 0x68, 0x9d, 0x42, 0x94, 0xa8, 0x04, 0x8a,
        0x6e, 0x90, 0x2a, 0xc8, 0xb7, 0x3d, 0x4c, 0x8b, 0x27, 0x45, 0x39, 0xac,
        0x31, 0x09, 0xf0, 0x16, 0x18, 0x64, 0x33, 0xcf, 0xe7, 0x1c, 0x9c, 0xfa,
        0xa7, 0x62, 0xbf, 0x4c, 0x1a, 0x00, 0x6e, 0x58, 0xd7, 0xa3, 0x66, 0x1e,
        0xa4, 0xbb, 0xf4, 0xc4, 0x37, 0xc4, 0x73, 0x86, 0x28, 0xe3, 0x20, 0xfb,
        0x08, 0x19, 0xb4, 0x27, 0x7f, 0x42, 0xc4, 0xf3, 0x8f, 0xe2, 0xf8, 0x5a,
        0x53, 0x75, 0xc9, 0x4f, 0x84, 0x13, 0x9b, 0xdb, 0x8f, 0x70, 0x2d, 0x78,
        0x62, 0x9e, 0xf1, 0x04, 0x84, 0xca, 0x3d, 0xcb, 0x37, 0xf7, 0x3e, 0x8e,
        0xb6, 0x4d, 0x97, 0xdf, 0x4f, 0x2b, 0xc5, 0xd9, 0xcf, 0xea, 0x3e, 0x17,
        0x6f, 0x42, 0xc7, 0x4f, 0x16, 0x16, 0xc7, 0xd8, 0xd1, 0x58, 0x80, 0xa4,
        0x7d, 0x92, 0xaf, 0xc8, 0x04, 0x6b, 0x9f, 0xf4, 0x2a, 0xa1, 0xbe, 0x5e,
        0x18, 0x1d, 0x97, 0x43, 0xde, 0x55, 0xea, 0x3b, 0x49, 0x63, 0x01, 0x6c,
        0x51, 0x96, 0xa7, 0x18, 0x88, 0xe8, 0xbb, 0xde, 0x0f, 0x36, 0x21, 0x88,
        0x70, 0x2c, 0xa8, 0x7d, 0xb4, 0xfe, 0x28, 0x56, 0xad, 0x5a, 0x24, 0x54,
        0xb5, 0x13, 0xc6, 0xf4, 0x0a, 0x37, 0x52, 0x11, 0x4e, 0x5d, 0xeb, 0xad,
        0x6a, 0xaf, 0x4b, 0x2a, 0x0f, 0x27, 0x76, 0xb6, 0x0f, 0x01, 0x72, 0x62,
        0x2e, 0x22, 0x97, 0xc5, 0x03, 0xd6, 0xa4, 0x14, 0x7a, 0xa8, 0xe6, 0x31,
        0xf3, 0x73, 0xac, 0x59, 0x2e, 0x14, 0x03, 0x55, 0x5f, 0xf8, 0x08, 0x52,
        0x62, 0x65, 0xa6, 0xc7, 0x61, 0x89, 0xce, 0x31, 0x94, 0xb6, 0x92, 0x8b,
        0x89, 0xa6, 0xbd, 0x64, 0x5f, 0x15, 0xc4, 0x81, 0x69, 0xdf, 0x3a, 0x41,
        0xf5, 0x0f, 0xbe, 0x2e, 0x6a, 0x85, 0xca, 0x9f, 0x34, 0x66, 0x30, 0x79,
        0x1a, 0x7a, 0x6c, 0x46, 0x67, 0x66, 0x58, 0xd2, 0x8e, 0x03, 0x02, 0xed,
        0xe7, 0xa2, 0xf6, 0x35, 0xbe, 0xc5, 0x6c, 0x73, 0x80, 0xe3, 0x2a, 0x46,
        0x5b, 0xcf, 0x20, 0x04, 0x52, 0x34, 0x4c, 0x45, 0xa6, 0x48, 0x1a, 0xff,
        0x04, 0xbe, 0xa9, 0x0a, 0x3e, 0xb7, 0x08, 0x5a, 0x8f, 0xd6, 0x1c, 0x46,
        0xeb, 0xc1, 0x97, 0x97, 0x2e, 0xe3, 0xfd, 0xe8, 0xa0, 0xab, 0xf0, 0x20,
        0xed, 0x4c, 0x8f, 0x0a, 0x58, 0x94, 0x51, 0x54, 0x86, 0x62, 0x9b, 0x0f,
        0x56, 0x11, 0x92, 0xe9, 0x72, 0xca, 0xb6, 0x4a, 0x61, 0x80, 0xa2, 0x8f,
        0x27, 0x5b, 0x84, 0x47, 0x94, 0xca, 0x53, 0x02, 0x9a, 0x78, 0x45, 0x24,
        0xdf, 0xbb, 0xaf, 0x6b, 0xb4, 0x60, 0xd0, 0xfa, 0x7c, 0xbe, 0x88, 0x53,
        0xb5, 0x00, 0x8e, 0xa2, 0x74, 0xde, 0xdd, 0x39, 0x8d, 0x5c, 0xad, 0xcb,
        0xa2, 0x1a, 0x75, 0x94, 0x2b, 0xe1, 0x49, 0xc8, 0x71, 0x65, 0x54, 0xa9,
        0x26, 0xe2, 0x4b, 0x5c, 0x73, 0x03, 0x1c, 0x26, 0xa0, 0x26, 0x0e, 0xfe,
        0xcb, 0xcd, 0x7e, 0x7e, 0x5f, 0xc1, 0xc3, 0x80, 0x23, 0x11, 0xab, 0x9d,
        0xb8, 0xb5, 0x78, 0x7f, 0xde, 0xe3, 0xba, 0x1c, 0x50, 0xc6, 0x89, 0xd4,
        0x35, 0x48, 0x57, 0x26, 0x7a, 0x8c, 0x85, 0x47, 0xf7, 0x15, 0x74, 0x3c,
        0x74, 0xee, 0x69, 0xc5, 0xe2, 0x62, 0x6a, 0x32, 0x38, 0x25, 0xea, 0x2d,
        0xc2, 0xae, 0xb6, 0xec, 0x91, 0x77, 0xb8, 0xf9, 0x16, 0x46, 0xfc, 0x4d,
        0x1c, 0xb2, 0xef, 0x99, 0xcf, 0xb7, 0xdb, 0x99, 0xd3, 0xf1, 0xd0, 0xd1,
        0x35, 0xb4, 0xe7, 0x4b, 0x97, 0x92, 0x12, 0xfb, 0xaa, 0xf0, 0x5e, 0x4e,
        0x28, 0x48, 0xc0, 0x90, 0xf6, 0x09, 0xfd, 0x2f, 0x7f, 0xdf, 0x5c, 0xf6,
        0x07, 0xdc, 0x64, 0x6d, 0xfd, 0xfc, 0xcf, 0x59, 0x5d, 0x78, 0x63, 0x2a,
        0xd9, 0x40, 0xe9, 0x21, 0xa6, 0x81, 0x39, 0x1d, 0x07, 0x58, 0xfb, 0x2b,
        0x30, 0x5e, 0x22, 0x73, 0x80, 0x5a, 0xb4, 0xa8, 0xc3, 0x40, 0x4b, 0x10,
        0x6b, 0x41, 0x25, 0x66, 0x9d, 0x52, 0x81, 0x00, 0xa7, 0xd5, 0xa4, 0x0b,
        0x4f, 0x47, 0xa5, 0xdb, 0x12, 0x84, 0x1e, 0xf5, 0xee, 0x4b, 0xb2, 0xfc,
        0x22, 0x89, 0xc4, 0x2f, 0x98, 0x0f, 0x6e, 0x27, 0x5e, 0x9e, 0xec, 0x1d,
        0x0a, 0xdf, 0x07, 0xb4, 0xbc, 0x29, 0x26, 0x65, 0x83, 0xd6, 0xed, 0x4a,
        0x3e, 0x11, 0xc1, 0x05, 0x58, 0x01, 0xae, 0x23, 0x3e, 0xc4, 0x84, 0x3e,
        0x6e, 0x25, 0x87, 0xe4, 0xdb, 0x16, 0x7e, 0x1c, 0x09, 0x7d, 0x2d, 0x0d,
        0x95, 0x05, 0xe9, 0x4a, 0xa2, 0xde, 0xdf, 0xe4, 0x1d, 0xfe, 0x1c, 0xf4,
        0x72, 0x50, 0x19, 0xa0, 0x72, 0x94, 0x86, 0xe3, 0xf4, 0x8a, 0xf5, 0xd0,
        0xdd, 0x21, 0xae, 0x90, 0x51, 0x5c, 0x32, 0xb3, 0x65, 0x87, 0x76, 0x4d,
        0xb8, 0x15, 0x9f, 0x7f, 0x76, 0x65, 0x1c, 0xf0, 0x52, 0x86, 0xed, 0xa2,
        0xd9, 0xa2, 0x01, 0x12, 0x2a, 0xd8, 0xd0, 0xb4, 0x00, 0x05, 0xa4, 0x83,
        0x1a, 0xbc, 0x7b, 0xc2, 0x13, 0x6c, 0x20, 0x4a, 0xe3, 0x6d, 0x49, 0x25,
        0xdd, 0x4a, 0xc1, 0x17, 0x01, 0xa5, 0x1c, 0x16, 0xd0, 0x12, 0x66, 0x11,
        0xe5, 0x7c, 0x35, 0xcf, 0x9a, 0x83, 0x4f, 0xb3, 0xda, 0x5f, 0x58, 0x8e,
        0x97, 0x70, 0xfa, 0xc3, 0xe2, 0x52, 0xf6, 0x6c, 0xa4, 0xce, 0xcc, 0x20,
        0xfa, 0xf1, 0xea, 0x2c, 0x73, 0x34, 0x09, 0xdd, 0x59, 0x04, 0xc9, 0xf0,
        0x44, 0xdd, 0xe1, 0x6f, 0xe6, 0xd2, 0x76, 0x8d, 0xab, 0xf7, 0xed, 0x99,
        0x65, 0xdd, 0x9a, 0x04, 0x72, 0x7a, 0x8a, 0x47, 0x76, 0xa2, 0xc2, 0x64,
        0xd1, 0xbf, 0xa3, 0x4c, 0xdf, 0x75, 0x2c, 0xd7, 0xfd, 0x92, 0xa9, 0xf4,
        0xbc, 0x98, 0xf8, 0x84, 0xd2, 0x9a, 0x4d, 0x38, 0x22, 0x5b, 0x81, 0xc0,
        0x69, 0x9d, 0x53, 0x7e, 0xdf, 0xe7, 0x26, 0xb5, 0xeb, 0xdb, 0xb5, 0x44,
        0xaa, 0x08, 0x4c, 0x70, 0xbf, 0x8e, 0x10, 0x27, 0x9e, 0x46, 0x73, 0xec,
        0x18, 0x11, 0xe3, 0x70, 0x9f, 0xc0, 0x64, 0x64, 0x2d, 0xbb, 0x62, 0xdf,
        0xd6, 0xce, 0x2f, 0xb2, 0x5e, 0xe5, 0xc5, 0xd0, 0xba, 0x14, 0x03, 0xf6,
        0xf0, 0xb4, 0xe3, 0xc4, 0xf8, 0x51, 0x21, 0xec, 0xc1, 0x03, 0xa4, 0x25,
        0x8d, 0x28, 0xbd, 0x7c, 0xb7, 0xe8, 0x3f, 0xc2, 0xe1, 0x9f, 0x79, 0x52,
        0xfe, 0x87, 0xfd, 0x34, 0xd7, 0x03, 0xbd, 0x21, 0x70, 0xac, 0xcc, 0x94,
        0xf9, 0x22, 0x28, 0xc8, 0x78, 0xe2, 0x26, 0xad, 0x3f, 0x96, 0x98, 0xcf,
        0x7e, 0x9c, 0x13, 0xc9, 0x47, 0x9e, 0x7f, 0xad, 0x5b, 0xc4, 0xb6, 0x6f,
        0x2e, 0x13, 0xd8, 0x81, 0xca, 0xc5, 0x44, 0x96, 0x15, 0x8a, 0x86, 0x5e,
        0xe4, 0xeb, 0xd6, 0x93, 0x85, 0xdc, 0x86, 0xb9, 0xe0, 0x9e, 0xd5, 0x54,
        0xf2, 0x92, 0xf6, 0xd6, 0xc4, 0x88, 0xe2, 0x84, 0x5a, 0x17, 0x00, 0xff,
        0xb7, 0x85, 0xaa, 0xf2, 0xef, 0xef, 0x65, 0xd0, 0x0e, 0x28, 0x34, 0xba,
        0xb6, 0x19, 0x6d, 0xfb, 0xa5, 0xdf, 0xe8, 0xd2, 0x8e, 0xdb, 0xe8, 0x0b,
        0x41, 0x8e, 0x02, 0xef, 0xf8, 0xb6, 0x1d, 0x28, 0x96, 0x3c, 0x4e, 0xd8,
        0x9d, 0x80, 0x6c, 0x14, 0x66, 0xb8, 0xad, 0xa9, 0x80, 0x16, 0x84, 0x00,
        0xb2, 0x79, 0x40, 0x59, 0x5d, 0x39, 0x07, 0xa4, 0x27, 0xb5, 0x9f, 0x29,
        0x03, 0x28, 0xd7, 0x59, 0x7a, 0x28, 0x56, 0x72, 0xe5, 0xb1, 0xce, 0x16,
        0x93, 0xb1, 0x0e, 0x09, 0xdc, 0x37, 0xb0, 0xbd, 0xa4, 0x54, 0x05, 0xee,
        0x83, 0xc6, 0x3f, 0x1d, 0xb9, 0xa8, 0x52, 0xd9, 0x23, 0x08, 0x0d, 0xc6,
        0x08, 0x7b, 0x8f, 0xc1, 0x89, 0x62, 0xe4, 0xd7, 0xd3, 0x43, 0x46, 0x59,
        0xdf, 0xda, 0x0d, 0x30, 0xd4, 0xf0, 0xe7, 0x76, 0x47, 0x6e, 0x4b, 0x40,
        0x48, 0x39, 0x93, 0x95, 0x89, 0xfb, 0x76, 0x8e, 0x00, 0x42, 0x51, 0xce,
        0x3b, 0x7b, 0xdf, 0x34, 0x87, 0xae, 0x5f, 0xfc, 0x9b, 0xf4, 0x8c, 0x4e,
        0x52, 0x37, 0x21, 0x6a, 0xf0, 0xb2, 0x4c, 0xbb, 0x58, 0x95, 0xad, 0xa0,
        0x3f, 0xae, 0x93, 0x8b, 0xdd, 0x65, 0xed, 0x1e, 0xba, 0xf0, 0xe4, 0x56,
        0xf7, 0x9d, 0x42, 0x18, 0xcf, 0x7d, 0x3a, 0x3d, 0xe8, 0x71, 0xd9, 0x0e,
        0x7b, 0x1d, 0x11, 0x51, 0xeb, 0x30, 0xcd, 0x7f, 0x41, 0x88, 0xbd, 0xf3,
        0xfe, 0x4b, 0x09, 0xc9, 0x18, 0x5f, 0x4b, 0x02, 0x32, 0xe3, 0x8b, 0xff,
        0xc2, 0x74, 0x2f, 0x5c, 0xe1, 0x66, 0xbb, 0x73, 0xf1, 0x47, 0x96, 0x8c,
        0xdc, 0x57, 0x0a, 0xbd, 0x93, 0x3f, 0xe3, 0x20, 0xed, 0x62, 0xdf, 0x1c,
        0xe4, 0x85, 0x1c, 0x2b, 0x66, 0xd2, 0x9a, 0x0f, 0x08, 0x03, 0x4b, 0x68,
        0x56, 0x37, 0xc7, 0xda, 0x2d, 0x06, 0xf0, 0x2b, 0xf8, 0x0a, 0x31, 0xdf,
        0x25, 0x19, 0xd2, 0x57, 0xbf, 0xf7, 0x42, 0x32, 0x10, 0x41, 0x27, 0xdd,
        0x1c, 0xc7, 0xdb, 0x07, 0x4e, 0xa2, 0xf6, 0x51, 0xfb, 0x63, 0xc5, 0xef,
        0xd5, 0xa9, 0x93, 0x61, 0x50, 0x33, 0x81, 0x42, 0xf9, 0x94, 0x13, 0x30,
        0xb9, 0x57, 0xdb, 0xdf, 0xcb, 0xb9, 0x2e, 0x0d, 0x14, 0xfb, 0xf8, 0xc9,
        0x46, 0x8d, 0xfe, 0x54, 0x69, 0xfe, 0x14, 0x75, 0x2d, 0xa1, 0x96, 0x61,
        0xaa, 0xe1, 0x44, 0x09, 0x75, 0x6f, 0x16, 0x07, 0x1d, 0x5a, 0xf1, 0x6d,
        0xb2, 0x98, 0x48, 0x56, 0x55, 0x14, 0xd0, 0xfb, 0x34, 0x57, 0x2a, 0x58,
        0xdf, 0x10, 0xb8, 0xe4, 0x57, 0xe7, 0x68, 0xcf, 0xa9, 0x8b, 0xff, 0x26,
        0x8a, 0xc1, 0xc3, 0x94, 0x71, 0x9f, 0x8a, 0xfd, 0x0f, 0x28, 0xda, 0xea,
        0x3d, 0xa3, 0xbc, 0x3b, 0x32, 0xd2, 0x3d, 0xb7, 0xfe, 0xa8, 0x09, 0x17,
        0x7f, 0xf6, 0x04, 0xc1, 0xad, 0x25, 0x0d, 0x2f, 0xa8, 0x00, 0x9f, 0xf3,
        0x5b, 0x8d, 0x74, 0x78, 0x04, 0x34, 0xb7, 0x27, 0x09, 0x17, 0xed, 0xe8,
        0xd7, 0x0b, 0xc0, 0x5d, 0x97, 0x60, 0xcd, 0x4b, 0x2f, 0xc4, 0x10, 0xef,
        0x04, 0x17, 0x70, 0x5c, 0xe6, 0x2f, 0xca, 0xf5, 0x3c, 0xc0, 0xf5, 0xec,
        0xc9, 0x00, 0xa3, 0xfc, 0x29, 0x5f, 0x8b, 0xd4, 0x0c, 0x4c, 0xa7, 0xdd,
        0x34, 0xd9, 0xd0, 0xc5, 0xac, 0x6b, 0xcb, 0x13, 0x70, 0x6b, 0x59, 0xbd,
        0x7a, 0x01, 0x4b, 0x65, 0x47, 0x35, 0xe7, 0x19, 0x22, 0xc9, 0x0f, 0xbe,
        0xbc, 0x05, 0xa7, 0x35, 0x80, 0x89, 0x17, 0xf8, 0x94, 0x49, 0x6a, 0xe6,
        0x1e, 0x84, 0x6a, 0x34, 0xe9, 0xf6, 0xc6, 0x65, 0x21, 0x55, 0x61, 0x25,
        0x73, 0x47, 0xfc, 0xc9, 0x91, 0x47, 0x09, 0x9a, 0xac, 0x82, 0x09, 0x7a,
        0x1d, 0x02, 0x27, 0x2a, 0xfa, 0x2f, 0x2b, 0x5d, 0xfe, 0x9c, 0x3c, 0xbd,
        0x73, 0xfe, 0xc4, 0x8e, 0xe5, 0xc5, 0x72, 0xfc, 0xa1, 0x2d, 0xd4, 0x5f,
        0x2d, 0x5d, 0x45, 0x0b, 0x12, 0x22, 0x4d, 0x5e, 0x97, 0x0f, 0xd6, 0x0c,
        0x86, 0xb4, 0x45, 0xfe, 0x39, 0x20, 0xd9, 0x6b, 0x72, 0xb2, 0xee, 0xed,
        0x19, 0xee, 0xae, 0x8c, 0xe1, 0x48, 0xdb, 0x00, 0xe5, 0xd9, 0xd2, 0x32,
        0x2d, 0x13, 0xf9, 0x98, 0xe6, 0x93, 0x2c, 0x02, 0xe1, 0x31, 0x11, 0x03,
        0xa2, 0x45, 0x69, 0x1a, 0x84, 0x7f, 0x76, 0x66, 0x11, 0x3e, 0xc0, 0x80,
        0x46, 0x2b, 0x0e, 0xab, 0xcb, 0x80, 0xfc, 0x66, 0x02, 0x13, 0x72, 0x61,
        0x35, 0x8e, 0x88, 0xff, 0xbc, 0xa1, 0x0d, 0xb6, 0xd2, 0x17, 0x02, 0x09,
        0xfb, 0x8d, 0x4d, 0x74, 0x97, 0x20, 0x40, 0xb4, 0x31, 0x76, 0xe6, 0xba,
        0x93, 0xfc, 0x98, 0x60, 0x61, 0xba, 0x70, 0x4b, 0xd7, 0xda, 0x19, 0x05,
        0x5d, 0x55, 0xfb, 0x6c, 0x54, 0x65, 0x05, 0xac, 0xf6, 0xab, 0x09, 0x29,
        0xfc, 0x56, 0x30, 0x93, 0xdd, 0x11, 0x4f, 0xb2, 0x2d, 0x18, 0x13, 0xab,
        0xc3, 0x68, 0x6e, 0x94, 0x9d, 0x3e, 0x5f, 0x9d, 0x72, 0x27, 0xe7, 0x9f,
        0x1b, 0x08, 0xc9, 0x64, 0x8f, 0x71, 0xc0, 0xb6, 0xab, 0x80, 0xef, 0x38,
        0xb3, 0x21, 0x83, 0xc1, 0x00, 0x29, 0xd9, 0xd8, 0xba, 0x4d, 0x25, 0xa7,
        0x16, 0x41, 0x69, 0x06, 0x76, 0xdc, 0xe0, 0x23, 0x55, 0x0f, 0x60, 0x99,
        0x7f, 0xb2, 0xdd, 0x73, 0xa3, 0x09, 0xdf, 0x17, 0xad, 0x99, 0xa5, 0xd6,
        0x3e, 0xdc, 0x14, 0x08, 0xcc, 0xe6, 0x20, 0x73, 0x75, 0xfd, 0x0e, 0x48,
        0xf5, 0x6c, 0xdf, 0x72, 0x2b, 0xc0, 0xd4, 0xe6, 0x45, 0x01, 0x59, 0x9e,
        0xca, 0x20, 0x5d, 0xba, 0xf8, 0x84, 0xce, 0x79, 0x54, 0xfd, 0x72, 0x3e,
        0xd8, 0x47, 0xe1, 0x60, 0x78, 0xf7, 0xf0, 0x5e, 0xf5, 0x65, 0x80, 0x9f,
        0xf0, 0x3a, 0x2d, 0xe5, 0x84, 0xf7, 0xd7, 0xd8, 0xf0, 0x04, 0x1f, 0x1c,
        0x43, 0xf4, 0x73, 0xda, 0x56, 0xf7, 0x91, 0x89, 0x89, 0x80, 0xed, 0xd9,
        0x5c, 0x75, 0xe7, 0xcd, 0x91, 0x21, 0x8a, 0x21, 0xde, 0x81, 0x50, 0x7e,
        0x81, 0xb0, 0x95, 0x27, 0x14, 0x8a, 0x4e, 0xfb, 0x3e, 0xbc, 0x08, 0x1d,
        0x9d, 0x4b, 0x46, 0x14, 0xce, 0xde, 0xc1, 0x91, 0xa0, 0x28, 0x27, 0x67,
        0x37, 0xfa, 0xe7, 0x72, 0xfe, 0xf2, 0xa0, 0xcc, 0xf3, 0x9b, 0x8f, 0xd0,
        0x16, 0xbf, 0xd6, 0x8c, 0xfe, 0x48, 0x0a, 0x91, 0x84, 0xd8, 0x5e, 0xd5,
        0x37, 0x0d, 0xc4, 0x53, 0xff, 0xb9, 0x0e, 0x9b, 0x01, 0x49, 0x95, 0x8a,
        0x2a, 0xcd, 0xa7, 0x59, 0xc2, 0xac, 0xbf, 0x85, 0xeb, 0xdf, 0x82, 0xa9,
        0xaf, 0xe4, 0x74, 0xe1, 0xae, 0xfc, 0x86, 0x8b, 0x2a, 0x5f, 0x8c, 0x45,
        0xf2, 0xce, 0x67, 0xd8, 0x20, 0x20, 0x04, 0xf9, 0x9a, 0x70, 0x49, 0xda,
        0xdc, 0x34, 0xc4, 0x37, 0xc3, 0x6d, 0x72, 0x77, 0x01, 0x8d, 0x02, 0xe4,
        0x54, 0xc8, 0xf6, 0x7c, 0x0a, 0xe0, 0xe3, 0x00, 0xab, 0x5e, 0xef, 0x64,
        0x83, 0x6f, 0x1f, 0xed, 0x30, 0x56, 0x70, 0x40, 0xd8, 0x5a, 0xfa, 0x12,
        0xa4, 0xbc, 0x59, 0x54, 0x57, 0x9f, 0xf5, 0x5b, 0xf5, 0x0e, 0x21, 0xd8,
        0x60, 0x8a, 0x1d, 0x5c, 0x33, 0x07, 0xf4, 0x04, 0x27, 0xff, 0xe9, 0xb2,
        0xa7, 0xd2, 0x3f, 0x66, 0x58, 0xac, 0x93, 0xeb, 0x4b, 0xb4, 0xe0, 0x1c,
        0x5d, 0x6f, 0xa9, 0xbe, 0xde, 0x7e, 0x85, 0x0f, 0x2e, 0x09, 0x85, 0x06,
        0xd3, 0x68, 0x9d, 0xa8, 0x9b, 0x97, 0xe6, 0x23, 0xe4, 0x87, 0xec, 0xd0,
        0xe0, 0x98, 0x8d, 0x9f, 0xf6, 0x49, 0xc4, 0x6f, 0x25, 0xf0, 0x4b, 0xbe,
        0x77, 0xdf, 0x33, 0xcf, 0xa2, 0x1b, 0xb5, 0xda, 0x35, 0x7f, 0x95, 0x78,
        0x44, 0x92, 0xaf, 0x88, 0x21, 0xa6, 0xdf, 0xfd, 0x7f, 0x23, 0x27, 0xb1,
        0xeb, 0xc6, 0xa0, 0x6b, 0xc7, 0x10, 0xbc, 0xff, 0x15, 0x06, 0xae, 0xe6,
        0x35, 0xe5, 0x1a, 0x6e, 0x22, 0xd7, 0x3b, 0x11, 0x5e, 0xb3, 0x13, 0x73,
        0x0a, 0xea, 0xd3, 0xd7, 0x55, 0xc0, 0x81, 0x39, 0x43, 0x61, 0x97, 0x0f,
        0x43, 0x7a, 0x56, 0xf0, 0x1f, 0x16, 0x7b, 0xee, 0x89, 0x86, 0xec, 0x4d,
        0xd6, 0x17, 0x3c, 0x02, 0x8c, 0xf9, 0x99, 0xb8, 0x0a, 0xcc, 0xdf, 0x19,
        0x8f, 0x69, 0xea, 0x94, 0x1f, 0x86, 0x95, 0xa5, 0x7e, 0x82, 0x7e, 0x65,
        0xa6, 0x35, 0x92, 0xc6, 0x55, 0x56, 0x97, 0x2d, 0xba, 0x59, 0xaa, 0xbc,
        0x21, 0x1b, 0xc6, 0x13, 0x62, 0x39, 0x61, 0x83, 0x78, 0x45, 0x31, 0xbf,
        0xe3, 0x4a, 0x06, 0xa9, 0xad, 0x2a, 0x57, 0x69, 0x3c, 0x04, 0xba, 0x09,
        0xd1, 0x98, 0x37, 0x95, 0x17, 0xf3, 0x93, 0xc4, 0x55, 0x60, 0x9f, 0x1b,
        0xa6, 0x1f, 0x5d, 0x58, 0x7f, 0x49, 0xc9, 0xb3, 0x4c, 0xbe, 0x80, 0xd7,
        0xd2, 0x17, 0x05, 0xe4, 0xb1, 0x21, 0xd0, 0xca, 0x26, 0x1b, 0xa4, 0x15,
        0xea, 0x6b, 0x7a, 0xb9, 0x97, 0xd7, 0x8c, 0x5a, 0x3f, 0x6b, 0xe0, 0x5b,
        0xfb, 0x4a, 0x0a, 0x50, 0xaf, 0xf9, 0x8f, 0x19, 0x07, 0x63, 0x2a, 0x6f,
        0xea, 0x23, 0x46, 0x32, 0x99, 0x2e, 0xd0, 0xcc, 0xba, 0xb4, 0xc0, 0x7b,
        0x32, 0x29, 0xf6, 0xd3, 0xb1, 0x52, 0xfa, 0x6d, 0xa7, 0xf7, 0x56, 0xfd,
        0x83, 0xe8, 0x9b, 0xab, 0x23, 0x8a, 0xfa, 0x11, 0x1a, 0xe9, 0x2a, 0xe5,
        0xcd, 0x10, 0x9a, 0xdd, 0xf7, 0xcd, 0x79, 0x07, 0x46, 0x83, 0x68, 0x59,
        0x56, 0x3f, 0x55, 0x3e, 0x7e, 0x04, 0x46, 0x65, 0x5c, 0xea, 0xe2, 0xc6,
        0x3f, 0x35, 0x40, 0x81, 0x8f, 0x69, 0x08, 0x4d, 0x5a, 0xab, 0x3a, 0xfd,
        0xd6, 0x51, 0x0a, 0x2c, 0x8e, 0xee, 0x27, 0x2f, 0x8f, 0xba, 0xe7, 0xc4,
        0x5d, 0x6b, 0x51, 0x23, 0xc0, 0x3f, 0x97, 0x8e, 0xea, 0x5e, 0x05, 0x47,
        0x78, 0x99, 0xf6, 0xf1, 0x70, 0xce, 0xe5, 0x97, 0xbd, 0x08, 0x00, 0x1e,
        0xcf, 0xdf, 0x1b, 0x1a, 0x05, 0x35, 0x5c, 0x36, 0x09, 0xef, 0x98, 0x0d,
        0x4b, 0x1f, 0x0b, 0xa2, 0xf0, 0x9d, 0xd5, 0x54, 0xd1, 0xf6, 0x33, 0x84,
        0x9d, 0xf9, 0x77, 0x25, 0xfa, 0xa5, 0x28, 0xc1, 0xdf, 0xaa, 0x4f, 0xad,
        0x33, 0x6b, 0xac, 0xa7, 0x9e, 0xb2, 0x00, 0x18, 0x56, 0x80, 0xea, 0x61,
        0xae, 0x7e, 0xa5, 0x56, 0x0b, 0xa9, 0x28, 0x44, 0x42, 0x4f, 0x81, 0xd0,
        0x23, 0xe1, 0xc0, 0x01, 0xc7, 0xeb, 0x6e, 0xe2, 0x9f, 0x98, 0x33, 0x01,
        0x0d, 0xe6, 0xed, 0x3d, 0xb3, 0xa2, 0xd0, 0x39, 0x15, 0x56, 0xd4, 0xdc,
        0x08, 0x43, 0x25, 0xb7, 0xa1, 0x30, 0x0e, 0xf1, 0x14, 0xac, 0x5a, 0x43,
        0x15, 0x81, 0x00, 0xf3, 0xad, 0x32, 0xac, 0xbf, 0xf7, 0xd2, 0xf2, 0x75,
        0x66, 0xe9, 0xee, 0xa4, 0xaa, 0x3c, 0x37, 0xd4, 0xb0, 0x4c, 0xba, 0x41,
        0x07, 0x6b, 0x71, 0x0e, 0x61, 0x62, 0x9f, 0xbe, 0x11, 0x8b, 0x74, 0x7b,
        0x23, 0x4e, 0x1a, 0x6c, 0x68, 0x24, 0x69, 0x6d, 0x5f, 0xf0, 0xa2, 0xe5,
        0xbb, 0x05, 0x4d, 0x75, 0xb3, 0xd2, 0xca, 0xad, 0xe1, 0xb7, 0x8a, 0x45,
        0x29, 0x7a, 0x5a, 0x37, 0xec, 0x1a, 0x49, 0xa2, 0x1e, 0x43, 0x40, 0x8a,
        0x32, 0x1c, 0x5a, 0xbe, 0x93, 0xf9, 0xf9, 0xad, 0x50, 0x61, 0xa2, 0xb6,
        0x61, 0x47, 0x0f, 0xa2, 0x4a, 0xa0, 0x8d, 0xe2, 0x15, 0xd0, 0x85, 0x63,
        0xb0, 0x3f, 0x1a, 0xf1, 0x8e, 0x6a, 0x84, 0x36, 0x39, 0xbd, 0xd5, 0xd3,
        0x62, 0xef, 0x09, 0x1b, 0xba, 0xb8, 0x0b, 0xa0, 0xc1, 0xf4, 0x94, 0xb6,
        0x5d, 0x55, 0x72, 0x92, 0xbd, 0x31, 0xf5, 0x43, 0x44, 0x75, 0xd6, 0xd0,
        0x17, 0xf9, 0x67, 0x50, 0x46, 0x41, 0xd1, 0x97, 0x30, 0xec, 0xa2, 0x21,
        0x31, 0xbb, 0x37, 0x4b, 0xda, 0xfe, 0x38, 0x31, 0x80, 0x30, 0xc6, 0x80,
        0x57, 0xf3, 0x96, 0x44, 0x19, 0x02, 0x2c, 0xe1, 0xcc, 0x33, 0x94, 0x6c,
        0x3c, 0xbe, 0xa3, 0x2d, 0x28, 0x3d, 0xbf, 0xaf, 0xf5, 0x7a, 0x71, 0x50,
        0x5a, 0x91, 0xa5, 0x1f, 0x7e, 0xd3, 0x78, 0xfa, 0x5c, 0x2b, 0xd8, 0xd3,
        0x6e, 0x6c, 0x0b, 0x9e, 0xa6, 0xec, 0x97, 0x5d, 0xf9, 0x58, 0xb4, 0xa0,
        0x93, 0xcc, 0x72, 0x9a, 0x81, 0xea, 0x4e, 0x15, 0x2e, 0xd5, 0xe8, 0x84,
        0xff, 0x93, 0x3c, 0x47, 0x52, 0x43, 0xa5, 0x0f, 0xf0, 0x6b, 0xcf, 0x2f,
        0x5a, 0xbe, 0x13, 0xd9, 0x9f, 0x2a, 0x78, 0x0c, 0x27, 0xfe, 0x0e, 0xe0,
        0x89, 0x41, 0xb7, 0x2c, 0xec, 0xc9, 0xcf, 0x64, 0xe2, 0xa4, 0x3e, 0x22,
        0x79, 0xe3, 0x3e, 0x7c, 0x06, 0x9d, 0x2c, 0x7c, 0x59, 0xb2, 0x96, 0x2c,
        0x1f, 0x25, 0xde, 0xf2, 0x98, 0xa7, 0x4d, 0xba, 0x3e, 0xce, 0x49, 0xdc,
        0x14, 0xf8, 0x88, 0xd2
    ]),
    "Papaya Whip": new Uint8Array([
        0xb9, 0xd6, 0x36, 0x7a, 0x18, 0xe2, 0x51, 0x0d, 0x30, 0xa9, 0xf5, 0x80,
        0xeb, 0x50, 0x56, 0x70, 0x97, 0xbb, 0xaf, 0xd9, 0x24, 0x41, 0x68, 0xf3,
        0xb7, 0xb4, 0xac, 0x47, 0x18, 0x0c, 0xb8, 0xd4, 0x44, 0x32, 0x80, 0xaf,
        0xe1, 0xb0, 0xc3, 0x98, 0x43, 0xde, 0x7e, 0xa0, 0xd5, 0x23, 0xe5, 0x20,
        0x6f, 0xae, 0xe9, 0xd2, 0x84, 0x49, 0x54, 0x9f, 0xc0, 0xd3, 0xf5, 0x03,
        0xca, 0x09, 0x40, 0xbe, 0x15, 0x68, 0x9d, 0xe7, 0x56, 0xbd, 0xae, 0x41,
        0x62, 0xfd, 0x2e, 0x39, 0x06, 0xa4, 0x76, 0xb4, 0x67, 0x07, 0xf3, 0x44,
        0xba, 0xf7, 0xaf, 0xb9, 0x5b, 0x0a, 0x8d, 0x9f, 0x1e, 0x18, 0x83, 0x1d,
        0x49, 0x52, 0xff, 0xf6, 0xe4, 0x2b, 0x62, 0xdf, 0xd2, 0x24, 0x29, 0xf9,
        0xd9, 0x5e, 0xe6, 0xd8, 0xdc, 0xcd, 0xe6, 0xcb, 0x75, 0xc6, 0x5b, 0x40,
        0xfb, 0x38, 0x19, 0x8f, 0x9f, 0x96, 0x82, 0xd5, 0xf4, 0xe5, 0x32, 0xb8,
        0x1f, 0x4f, 0x11, 0xc0, 0x29, 0x8b, 0x36, 0x1a, 0x6d, 0x02, 0x52, 0x2f,
        0x38, 0x46, 0x1d, 0xf6, 0x64, 0xac, 0x7a, 0x7c, 0xd1, 0x17, 0xb0, 0x5c,
        0xfa, 0x5a, 0xba, 0x62, 0xd9, 0xdc, 0xab, 0x72, 0x25, 0x90, 0xcc, 0x4d,
        0x3e, 0x5a, 0x9d, 0xbe, 0x3f, 0x86, 0x71, 0x9d, 0xb0, 0x13, 0xf5, 0x94,
        0x6d, 0xfe, 0x10, 0x88, 0xf0, 0x47, 0xae, 0x69, 0xf9, 0x54, 0x22, 0x48,
        0x98, 0xff, 0x45, 0x38, 0x21, 0x76, 0x4e, 0x0e, 0xd2, 0x49, 0x73, 0x9a,
        0xd2, 0x08, 0xfe, 0x22, 0xa0, 0x2c, 0xb3, 0xaf, 0x69, 0x5a, 0xe6, 0xc9,
        0xd1, 0xc0, 0x11, 0x1e, 0xae, 0x31, 0xe6, 0x53, 0x65, 0x5e, 0x6c, 0x6d,
        0x2b, 0xaf, 0x4f, 0x86, 0x68, 0x59, 0x17, 0x0e, 0x07, 0x74, 0xb4, 0x0c,
        0x09, 0xe7, 0xf4, 0xf0, 0xc7, 0xed, 0x75, 0x17, 0x90, 0x44, 0x22, 0x8e,
        0x5d, 0x89, 0xcb, 0xb3, 0x69, 0x6c, 0x1f, 0x88, 0xb5, 0x1a, 0x32, 0x42,
        0xeb, 0x11, 0xe7, 0x15, 0x5d, 0xb8, 0x57, 0x61, 0xb3, 0x09, 0x8c, 0xa7,
        0x41, 0xf0, 0xbb, 0xa2, 0xc2, 0x75, 0x87, 0x63, 0x91, 0xa9, 0xf2, 0xa0,
        0x1d, 0x68, 0xbc, 0x75, 0x79, 0xba, 0xc7, 0xe4, 0xa3, 0x2d, 0xfb, 0xd2,
        0x84, 0x36, 0xe0, 0xb0, 0x94, 0x4c, 0x8b, 0x94, 0x90, 0x52, 0xea, 0x75,
        0x07, 0xef, 0x86, 0xbc, 0x86, 0xe4, 0xbf, 0x2b, 0x6a, 0x92, 0x51, 0xf0,
        0x5c, 0x64, 0xa6, 0xcd, 0x05, 0xfe, 0xe5, 0x1b, 0xaf, 0xc7, 0xc5, 0xc9,
        0x27, 0x35, 0x7a, 0xbb, 0x89, 0x05, 0x2a, 0x74, 0x3d, 0xf0, 0xec, 0xf9,
        0x51, 0x18, 0xf4, 0x3b, 0x4e, 0xa3, 0x93, 0x6f, 0x93, 0xfb, 0x1f, 0xa8,
        0x49, 0xab, 0xd4, 0xe0, 0xd7, 0x7e, 0x26, 0x06, 0x21, 0xea, 0x39, 0x51,
        0xa1, 0x72, 0x40, 0x1c, 0x97, 0x8b, 0xea, 0x6c, 0x3c, 0xa0, 0x0a, 0x65,
        0xd1, 0xa9, 0xe3, 0x43, 0x39, 0x38, 0x85, 0x9c, 0xa5, 0x92, 0x4b, 0xe5,
        0xc8, 0xb3, 0x88, 0x80, 0x73, 0x44, 0xf1, 0x15, 0x92, 0x7d, 0x52, 0x0d,
        0x4e, 0xe2, 0x37, 0xa4, 0x27, 0x8c, 0x21, 0xf7, 0x96, 0xdc, 0xc3, 0xe6,
        0xdd, 0x4f, 0x6b, 0x58, 0x7c, 0x4c, 0xb8, 0x88, 0x62, 0xf9, 0x7f, 0xc3,
        0x00, 0x74, 0x7b, 0x1e, 0xb8, 0xa6, 0xd3, 0xc7, 0x6e, 0x0b, 0x76, 0xfc,
        0xb0, 0xb1, 0x22, 0x01, 0x87, 0x34, 0xc2, 0x39, 0x04, 0x1d, 0x5a, 0x25,
        0xab, 0xbf, 0x9e, 0xc0, 0x79, 0x65, 0xd8, 0x35, 0x6e, 0x79, 0x68, 0xa1,
        0x7b, 0xa3, 0x16, 0x5e, 0x84, 0x3a, 0xd1, 0x88, 0x86, 0x66, 0xad, 0x1c,
        0xdf, 0xab, 0x22, 0x76, 0x9c, 0xe5, 0x73, 0xac, 0xf7, 0x99, 0x67, 0x7a,
        0xee, 0x4d, 0x61, 0x54, 0xd2, 0x1c, 0xf7, 0x03, 0x2d, 0x78, 0xfb, 0xff,
        0x31, 0x49, 0xf4, 0xae, 0xd9, 0x6e, 0xa1, 0x49, 0x65, 0xce, 0x2c, 0x8b,
        0x60, 0x77, 0xbd, 0x2b, 0x38, 0x67, 0x53, 0xc3, 0x78, 0xe7, 0xa0, 0x0b,
        0x2d, 0xc3, 0xb4, 0x20, 0x83, 0x1a, 0xeb, 0xb6, 0x15, 0x22, 0x28, 0x2b,
        0x0d, 0x88, 0xf4, 0x77, 0x4a, 0x13, 0x4c, 0xbd, 0xb4, 0x79, 0xdc, 0xfa,
        0x74, 0xe9, 0xcd, 0x19, 0x88, 0x31, 0x51, 0x3e, 0x9d, 0x29, 0x40, 0xa3,
        0xfc, 0xb9, 0x6d, 0xac, 0x38, 0xc7, 0x1d, 0x24, 0xe2, 0xbd, 0xc8, 0xd0,
        0x6e, 0x90, 0x53, 0x38, 0xe0, 0x8f, 0x12, 0xcc, 0xad, 0x37, 0xda, 0xec,
        0x58, 0x93, 0x46, 0xe3, 0x32, 0x0b, 0x26, 0xca, 0xb2, 0x83, 0x45, 0x1a,
        0x5c, 0xd8, 0xbd, 0xa9, 0x53, 0x62, 0x7d, 0x7c, 0x7f, 0x9a, 0x11, 0xb4,
        0x18, 0x04, 0xfe, 0x68, 0x25, 0x7b, 0x87, 0x48, 0xe6, 0xad, 0x61, 0x58,
        0xfc, 0x5c, 0xa4, 0x51, 0x4a, 0x0d, 0x2b, 0x23, 0xcf, 0x81, 0x9c, 0x7b,
        0x5d, 0x54, 0x5c, 0x49, 0x0d, 0x19, 0x11, 0x1b, 0xaa, 0x34, 0x83, 0xae,
        0xbf, 0x41, 0x7b, 0xd6, 0xb7, 0x92, 0x85, 0x12, 0xde, 0xc8, 0x67, 0x41,
        0x06, 0x25, 0x4e, 0xd5, 0x40, 0x34, 0x33, 0xb8, 0x92, 0x78, 0x97, 0xdc,
        0xfb, 0xca, 0x8b, 0xe4, 0xdb, 0x8d, 0x5b, 0x52, 0x57, 0x79, 0x96, 0xcd,
        0xd3, 0x59, 0x7c, 0x61, 0xd7, 0xa3, 0xc1, 0x7c, 0x08, 0x8c, 0x0d, 0x9b,
        0x2c, 0x69, 0x29, 0x7b, 0xd2, 0x07, 0xe3, 0xd6, 0x1f, 0x23, 0x9d, 0xa5,
        0x9a, 0x0f, 0x3b, 0xb2, 0xc6, 0x94, 0xdf, 0x7e, 0x1b, 0x62, 0xb0, 0xc8,
        0x43, 0x4d, 0xbc, 0xa3, 0xf8, 0x26, 0x4d, 0xd1, 0x08, 0x4b, 0x50, 0x90,
        0xa6, 0x34, 0xdf, 0x65, 0xc3, 0x5f, 0x05, 0x1d, 0xc9, 0x4a, 0xa1, 0x2a,
        0xe8, 0x70, 0x85, 0xe3, 0x0b, 0x86, 0xfa, 0x4e, 0x84, 0x5a, 0x7c, 0xc3,
        0x3e, 0x14, 0x8f, 0x3f, 0x45, 0x74, 0x09, 0x89, 0x71, 0x62, 0xf0, 0x78,
        0xe4, 0x0b, 0x8f, 0x83, 0x0f, 0x6b, 0x9d, 0xaf, 0x8c, 0x93, 0xdc, 0x6c,
        0x65, 0xd7, 0xb8, 0x67, 0xa6, 0x5c, 0x76, 0x00, 0x45, 0xe2, 0x4b, 0x33,
        0x88, 0x34, 0x49, 0x1c, 0x96, 0xf0, 0x0a, 0x1c, 0xe3, 0xbe, 0x49, 0x5c,
        0x64, 0x75, 0x2c, 0xdc, 0xe5, 0x34, 0x86, 0x5f, 0x68, 0xe6, 0x13, 0xe3,
        0x1d, 0xbb, 0x31, 0x4d, 0x12, 0xb3, 0x51, 0x98, 0xb4, 0x70, 0x51, 0x41,
        0x98, 0xc7, 0x76, 0x6c, 0x27, 0x53, 0xa0, 0xa4, 0xbf, 0xe3, 0x80, 0x2b,
        0xac, 0xf3, 0x7b, 0xab, 0xa4, 0x56, 0x04, 0x19, 0xb2, 0xac, 0x08, 0x3b,
        0x76, 0x89, 0xe5, 0x48, 0xbf, 0xbc, 0xdd, 0xba, 0xa8, 0x2f, 0x54, 0xbd,
        0x48, 0x4a, 0x73, 0x5c, 0x20, 0x5f, 0x58, 0xbc, 0x16, 0xf6, 0x65, 0x15,
        0xe0, 0x4b, 0xda, 0x75, 0xe6, 0x52, 0x2f, 0x79, 0xa0, 0xdf, 0xe0, 0x5d,
        0x0a, 0xf2, 0xf2, 0xaf, 0x95, 0x89, 0xec, 0xe2, 0x3f, 0x53, 0x22, 0x69,
        0x59, 0x3f, 0x23, 0xac, 0xea, 0x99, 0x99, 0x84, 0x9d, 0x7f, 0xb7, 0x51,
        0xce, 0x4a, 0xab, 0x63, 0xe0, 0x49, 0x87, 0x9c, 0xfa, 0x6d, 0xde, 0xd1,
        0x79, 0x35, 0x64, 0x83, 0xe9, 0xb2, 0x17, 0xe1, 0x13, 0x13, 0xf5, 0x73,
        0xd2, 0xec, 0x4f, 0x46, 0x2a, 0x92, 0x1d, 0xf7, 0xc1, 0xc7, 0x12, 0x16,
        0xaf, 0xc7, 0xc0, 0x9e, 0xe7, 0xdf, 0x13, 0x70, 0x69, 0xfa, 0xe0, 0x38,
        0x45, 0xe4, 0x30, 0xd1, 0xbd, 0x3e, 0x9a, 0x34, 0xf8, 0x09, 0xef, 0xbb,
        0xdb, 0x9a, 0xa0, 0x08, 0x91, 0x19, 0x37, 0x81, 0x4e, 0x44, 0xbe, 0xf5,
        0x4b, 0xde, 0xd0, 0x3a, 0xe7, 0x66, 0x52, 0x3b, 0xbd, 0x2e, 0xdc, 0x84,
        0x84, 0x89, 0x4f, 0x12, 0x03, 0x80, 0xa4, 0x42, 0x89, 0x68, 0x78, 0x74,
        0x3b, 0xb1, 0x2d, 0xad, 0x35, 0xc1, 0xf3, 0x7a, 0x66, 0x91, 0x84, 0xc0,
        0x05, 0x6f, 0x10, 0x2f, 0x13, 0xa5, 0x44, 0x7b, 0x28, 0xb4, 0x7c, 0x6c,
        0x32, 0x4d, 0x1a, 0x19, 0x3c, 0x70, 0xe7, 0x62, 0x5b, 0xc0, 0x45, 0x83,
        0x96, 0x2d, 0x02, 0xfd, 0xec, 0xa5, 0x64, 0x3f, 0xa6, 0xbf, 0x72, 0x46,
        0x43, 0x52, 0x6d, 0xe2, 0xa9, 0x0c, 0x08, 0x6e, 0xd4, 0xff, 0x14, 0x1a,
        0xc0, 0xa0, 0xfc, 0xa6, 0x77, 0x3d, 0xe6, 0x60, 0xa6, 0xb0, 0x3c, 0x29,
        0xd2, 0xed, 0xd1, 0x91, 0x59, 0x06, 0x3f, 0x15, 0x96, 0x5e, 0x7a, 0xa9,
        0x7d, 0x21, 0xf6, 0xbb, 0x8a, 0x51, 0xf9, 0x10, 0x54, 0x6f, 0x8c, 0xf2,
        0x07, 0x76, 0x96, 0x01, 0xe8, 0xd9, 0xcf, 0x42, 0xb7, 0x43, 0x0e, 0xd2,
        0x2d, 0x55, 0xc1, 0xd0, 0x14, 0x44, 0x50, 0x95, 0xbd, 0x67, 0x48, 0xe7,
        0x25, 0x14, 0x17, 0xa2, 0x8d, 0x96, 0x95, 0x06, 0x50, 0xe1, 0x61, 0x55,
        0xa4, 0x48, 0x59, 0x4e, 0x75, 0x2b, 0x8d, 0x0b, 0x69, 0x3f, 0xc0, 0x5d,
        0xd7, 0xa2, 0xd9, 0x96, 0xe4, 0xef, 0x71, 0x9a, 0xe2, 0x91, 0xfc, 0xd2,
        0x77, 0x4f, 0x03, 0xf8, 0xad, 0x29, 0xa1, 0x0e, 0xfa, 0x14, 0xcb, 0x6a,
        0xd2, 0xc1, 0xf1, 0x34, 0x1f, 0x75, 0x2e, 0x09, 0x9e, 0x1e, 0xa4, 0xa2,
        0x2e, 0xd1, 0xf1, 0x21, 0x40, 0x21, 0x33, 0xb5, 0x41, 0xa4, 0x1a, 0xb4,
        0x19, 0x98, 0x7e, 0xcd, 0x5e, 0x85, 0xb9, 0x8c, 0x5c, 0x64, 0x90, 0x47,
        0xf0, 0x67, 0x10, 0xba, 0xab, 0x05, 0xf8, 0x62, 0xf5, 0xc9, 0xcf, 0x4b,
        0xee, 0xee, 0x11, 0xee, 0x13, 0x06, 0xd5, 0x98, 0x1d, 0x55, 0x38, 0x36,
        0xc3, 0x99, 0x28, 0xde, 0x2d, 0x2b, 0x6f, 0x88, 0xaf, 0xe7, 0x2c, 0x4d,
        0x75, 0x1d, 0xc0, 0xd7, 0xf1, 0xed, 0xf7, 0x1c, 0xca, 0x62, 0xb6, 0xd4,
        0x52, 0x90, 0x02, 0x0c, 0x1c, 0x50, 0x4f, 0x64, 0xd7, 0x89, 0x44, 0xc1,
        0x0f, 0x43, 0xcb, 0x84, 0x0f, 0xb4, 0x3b, 0x9b, 0x37, 0xa0, 0x77, 0x13,
        0x21, 0x35, 0xf5, 0x50, 0xfc, 0xed, 0x08, 0xe1, 0x97, 0x84, 0xc4, 0x6e,
        0x8c, 0xd9, 0xe0, 0xf8, 0x82, 0x1d, 0xc7, 0xd8, 0xc4, 0x70, 0xa2, 0xa3,
        0x8f, 0x7b, 0x05, 0xce, 0x5a, 0x6e, 0xf5, 0x5f, 0x78, 0xab, 0x99, 0xaa,
        0x0e, 0xb3, 0xe3, 0x48, 0x7d, 0x0a, 0x21, 0xd1, 0x98, 0x91, 0x28, 0xa4,
        0xb9, 0x04, 0x8f, 0xc6, 0xfc, 0x0e, 0x86, 0xc4, 0x98, 0x81, 0xe5, 0x07,
        0x8e, 0xa6, 0xcc, 0x9d, 0xa1, 0x99, 0x9d, 0xc1, 0x83, 0x6a, 0x9e, 0x1e,
        0x99, 0xd5, 0x08, 0xe4, 0xe4, 0xab, 0x06, 0xe0, 0x2e, 0x35, 0x22, 0x2d,
        0x3b, 0x3e, 0xe9, 0x69, 0x8f, 0x15, 0xb8, 0xfa, 0xa0, 0x41, 0x38, 0x52,
        0xad, 0x06, 0x54, 0xf5, 0x73, 0x82, 0xb7, 0x60, 0x06, 0x47, 0xd9, 0x62,
        0x6d, 0x83, 0x2a, 0x48, 0x9a, 0x00, 0x2e, 0x44, 0x57, 0xcc, 0xea, 0xa7,
        0x5a, 0x5b, 0x45, 0xc3, 0x62, 0x3f, 0xdd, 0xfc, 0x6d, 0x4a, 0x48, 0xbf,
        0x86, 0xe0, 0xb5, 0xa3, 0x7e, 0xf2, 0x64, 0x64, 0xe1, 0x57, 0xea, 0xd1,
        0xe3, 0x35, 0x08, 0x19, 0xb3, 0x77, 0x9a, 0x50, 0x85, 0xf7, 0x0f, 0xa3,
        0x62, 0xf8, 0x3b, 0xb7, 0xb8, 0x5e, 0x3b, 0xaa, 0xd4, 0x64, 0x12, 0x0e,
        0x11, 0x51, 0xc2, 0xad, 0xa1, 0xe2, 0x2c, 0xf4, 0xa9, 0x06, 0x3c, 0x58,
        0x6a, 0x90, 0x77, 0x16, 0x5e, 0x24, 0x92, 0x04, 0x5a, 0xd4, 0xc8, 0xe1,
        0xa8, 0x1f, 0x00, 0xa3, 0x3a, 0x39, 0xa8, 0x16, 0x32, 0xd4, 0xa3, 0x14,
        0x25, 0x8f, 0x07, 0x4d, 0xf4, 0xd8, 0xc6, 0x0d, 0xda, 0x0f, 0x69, 0xd1,
        0xdd, 0xae, 0x48, 0xb1, 0x1a, 0xbb, 0x84, 0xbc, 0x3c, 0xb6, 0xce, 0x8e,
        0x8b, 0x51, 0xac, 0xe8, 0xde, 0xed, 0xa8, 0x1d, 0x82, 0xaf, 0x75, 0x62,
        0x85, 0x08, 0x85, 0x05, 0xdb, 0xfd, 0x29, 0xae, 0xae, 0x38, 0x4b, 0x67,
        0xff, 0x85, 0xd4, 0x69, 0xa5, 0xe5, 0xd4, 0x84, 0x9b, 0xa4, 0x95, 0x22,
        0x1d, 0xc2, 0x92, 0x68, 0xf0, 0x57, 0xd6, 0x64, 0x08, 0xd4, 0x05, 0x7f,
        0x7d, 0xb5, 0xb6, 0xba, 0xa4, 0x0e, 0x6e, 0x96, 0x9d, 0x14, 0x49, 0x91,
        0xc7, 0x0c, 0xfe, 0x89, 0xf7, 0xa3, 0x7d, 0xdf, 0x59, 0x4d, 0x78, 0xde,
        0x3c, 0x4c, 0x17, 0x6a, 0xba, 0x63, 0x23, 0xf9, 0xd9, 0xef, 0x04, 0x10,
        0xc4, 0xad, 0x12, 0x9b, 0x74, 0xb1, 0x3c, 0xdb, 0x4b, 0x20, 0xc4, 0xe2,
        0xde, 0xc6, 0x53, 0x48, 0x95, 0xcb, 0xc3, 0x5f, 0x2d, 0x51, 0x44, 0x3d,
        0xb5, 0x35, 0xae, 0x38, 0x76, 0xae, 0xaf, 0x11, 0xc9, 0x9d, 0x39, 0x60,
        0x00, 0x00, 0xee, 0x5c, 0x14, 0x24, 0x01, 0x73, 0x2d, 0xfe, 0x25, 0x95,
        0xcb, 0x81, 0x0b, 0x0d, 0x98, 0xfe, 0xbf, 0xc5, 0xba, 0x1c, 0x6d, 0x8b,
        0xe8, 0x3f, 0x4d, 0x34, 0x4c, 0x44, 0x32, 0x46, 0x14, 0x66, 0xd3, 0x2d,
        0x30, 0x57, 0x25, 0xd9, 0xf5, 0xfc, 0x84, 0xbe, 0x09, 0x0d, 0x6c, 0x25,
        0xbc, 0xa5, 0xe4, 0xe0, 0xb7, 0x0f, 0x76, 0x5b, 0x00, 0x8c, 0xec, 0xc3,
        0x62, 0x81, 0xd6, 0x96, 0xb1, 0x56, 0x8f, 0x25, 0x82, 0x24, 0x7f, 0xbb,
        0x13, 0x16, 0x7d, 0x8b, 0xc0, 0xc6, 0x2c, 0xce, 0xac, 0xf2, 0xd9, 0x33,
        0x30, 0xdf, 0xee, 0xee, 0xd8, 0x27, 0x8d, 0xd7, 0x75, 0x86, 0x9c, 0x56,
        0x25, 0x1e, 0x32, 0xf9, 0x91, 0x92, 0x65, 0xf9, 0x3f, 0x5d, 0x26, 0x5b,
        0x8e, 0xd3, 0x87, 0xc2, 0x52, 0x19, 0xf7, 0x90, 0xf7, 0xcb, 0x72, 0xda,
        0x2d, 0x40, 0x4f, 0x4f, 0xde, 0x08, 0x11, 0x73, 0x9d, 0x51, 0xed, 0xa0,
        0x04, 0xac, 0x8d, 0xd9, 0x4e, 0xde, 0x68, 0x66, 0x54, 0x0c, 0xf8, 0x54,
        0x5d, 0x9b, 0xec, 0x0c, 0xc0, 0x38, 0x57, 0x3c, 0x9f, 0x6e, 0xf8, 0x6b,
        0x68, 0xeb, 0x91, 0x9c, 0x9e, 0xcd, 0x5b, 0x71, 0x33, 0x60, 0x4e, 0x39,
        0x8d, 0x4d, 0x7c, 0xda, 0xb6, 0xa6, 0xce, 0xa3, 0xa0, 0xed, 0x60, 0x40,
        0x2e, 0xf0, 0x84, 0x99, 0x05, 0x87, 0x3d, 0xde, 0xe9, 0x20, 0x7e, 0x4a,
        0x74, 0xe5, 0xf8, 0xc9, 0x7f, 0xca, 0xa7, 0xee, 0xbb, 0x9b, 0xdd, 0x1d,
        0x15, 0xaf, 0x91, 0x58, 0xe3, 0xfd, 0x8a, 0xa8, 0x86, 0xa3, 0x9b, 0xc4,
        0x73, 0xa3, 0xf1, 0x18, 0xdb, 0x95, 0xcf, 0xc2, 0xd4, 0xbc, 0xf7, 0xe1,
        0x84, 0x78, 0xa7, 0xf2, 0xe4, 0xc8, 0xbd, 0xc4, 0x77, 0x29, 0x52, 0xf8,
        0x05, 0xac, 0xc1, 0xc6, 0xfc, 0xbe, 0xb1, 0xd6, 0xeb, 0xe1, 0xda, 0x65,
        0x35, 0xa7, 0x52, 0x3a, 0x29, 0x25, 0x81, 0xf4, 0xf3, 0x07, 0xd9, 0x38,
        0x9b, 0xd6, 0x7f, 0x20, 0x71, 0x35, 0x73, 0x21, 0xc5, 0x71, 0x8e, 0x20,
        0x9c, 0xdf, 0x16, 0x54, 0x0d, 0xc6, 0x44, 0x71, 0xe3, 0x8d, 0x7f, 0x77,
        0x7a, 0x59, 0xc0, 0xa0, 0x18, 0x4d, 0x94, 0x50, 0xba, 0x57, 0x9e, 0x13,
        0xcb, 0x78, 0x18, 0xe8, 0x46, 0x56, 0x8c, 0x07, 0x54, 0x3d, 0xae, 0x23,
        0xd5, 0x50, 0x7c, 0x2e, 0x55, 0x03, 0x80, 0x9d, 0x8f, 0xd1, 0xe2, 0x66,
        0xab, 0xfb, 0xcf, 0xe1, 0xcc, 0x42, 0xe3, 0xb5, 0x6c, 0x6f, 0x1d, 0x11,
        0x3f, 0x3a, 0x85, 0xac, 0x25, 0xe4, 0xde, 0x76, 0x28, 0x2f, 0x32, 0xb1,
        0x56, 0xfe, 0x8d, 0xa8, 0x58, 0x2e, 0xee, 0x22, 0x13, 0x99, 0x34, 0x33,
        0xc6, 0x90, 0x62, 0xfa, 0xba, 0xb4, 0xa6, 0xb8, 0x87, 0xdc, 0x25, 0x30,
        0x9b, 0x06, 0x15, 0x18, 0x25, 0xa4, 0x21, 0x24, 0x10, 0x9c, 0x49, 0x33,
        0x21, 0x31, 0x63, 0x68, 0xe7, 0x6c, 0xf8, 0xea, 0xec, 0x8d, 0xec, 0x1f,
        0x20, 0xbb, 0x66, 0x81, 0x62, 0xa0, 0xc5, 0xa5, 0xb6, 0xa5, 0xc9, 0xad,
        0xf7, 0x3f, 0xb9, 0x3e, 0x0b, 0x9e, 0x62, 0xc0, 0x1d, 0x5f, 0x0b, 0x0e,
        0x8b, 0x49, 0x85, 0xd6, 0x04, 0x71, 0x36, 0x57, 0x19, 0xe8, 0xc5, 0x54,
        0x72, 0x59, 0x4f, 0x4c, 0xb6, 0xfe, 0xa9, 0x5c, 0x8b, 0x8a, 0x9a, 0xfa,
        0xb5, 0xaf, 0x32, 0xb1, 0x6f, 0x0f, 0xfb, 0xee, 0x08, 0xe7, 0x67, 0xb1,
        0x07, 0x94, 0xd2, 0x97, 0x4a, 0xeb, 0x12, 0xdf, 0x52, 0x78, 0xcd, 0x06,
        0x0a, 0x27, 0x73, 0x1b, 0x5a, 0x68, 0x76, 0x6a, 0x35, 0x2f, 0x4d, 0x40,
        0xdd, 0xea, 0x09, 0x48, 0x49, 0x56, 0x89, 0x5a, 0x31, 0xa0, 0xe1, 0x2a,
        0x1f, 0x13, 0x61, 0x69, 0x92, 0xed, 0x51, 0x23, 0x2b, 0xd6, 0x46, 0x77,
        0x61, 0x4c, 0x03, 0x58, 0xf5, 0x2b, 0x90, 0xdc, 0x59, 0x90, 0xce, 0x60,
        0x90, 0x8c, 0x73, 0x09, 0x65, 0x56, 0x32, 0x48, 0xff, 0x39, 0xfc, 0x2d,
        0x4c, 0xb8, 0x1b, 0x52, 0x37, 0x9f, 0xc5, 0xa1, 0xfb, 0xa9, 0x89, 0x91,
        0x37, 0xec, 0x3a, 0x63, 0xf5, 0x7e, 0x27, 0xde, 0xb1, 0x40, 0x65, 0xb4,
        0x9f, 0xb4, 0x9c, 0xcf, 0x1e, 0xe6, 0xd4, 0x6a, 0x38, 0x80, 0xd5, 0x99,
        0xc5, 0x72, 0x92, 0x4a, 0x96, 0x55, 0x38, 0xb8, 0xfe, 0xa9, 0x4b, 0x5a,
        0xf5, 0x1c, 0xcf, 0x34, 0xd3, 0xcd, 0xfe, 0x48, 0xfc, 0x0f, 0xf8, 0xe0,
        0x26, 0xc3, 0x09, 0xaa, 0xe5, 0x52, 0x1b, 0x38, 0xa1, 0x79, 0xca, 0x29,
        0x08, 0x46, 0xcf, 0x49, 0xcc, 0x47, 0x96, 0xbd, 0x85, 0x8d, 0xc4, 0x53,
        0x3f, 0xf2, 0xd0, 0xc5, 0xc2, 0x1f, 0xb3, 0x97, 0x8c, 0x45, 0x66, 0xdb,
        0x69, 0x03, 0x11, 0xad, 0x1d, 0xc6, 0x5f, 0x2d, 0x07, 0xf0, 0x3f, 0xe6,
        0xae, 0xf6, 0xec, 0xd1, 0xa5, 0x05, 0x06, 0xdd, 0x16, 0x39, 0x44, 0xde,
        0x29, 0x31, 0x2a, 0xc7, 0x98, 0xdd, 0x6f, 0x2c, 0xd3, 0xfd, 0x43, 0xa5,
        0x9b, 0x4f, 0xc3, 0x99, 0xe2, 0x76, 0xd0, 0x87, 0x08, 0x12, 0xa8, 0x76,
        0x33, 0x5e, 0xeb, 0x14, 0x50, 0xb5, 0xf8, 0x2a, 0x94, 0x4d, 0x30, 0xbf,
        0x77, 0x8e, 0xb1, 0xfb, 0x95, 0xff, 0xfd, 0x8f, 0x59, 0xe4, 0x70, 0x43,
        0x87, 0x4a, 0xef, 0xe4, 0x42, 0x0d, 0x1e, 0xc1, 0x72, 0x7f, 0xb4, 0x88,
        0x73, 0xf9, 0xf2, 0x54, 0x0d, 0x18, 0x48, 0x7e, 0xcd, 0xc9, 0xb2, 0xf6,
        0xf5, 0xd0, 0x4b, 0x2e, 0xdd, 0xa4, 0xcf, 0x0d, 0xb3, 0xf3, 0x4a, 0x42,
        0xb2, 0x33, 0xff, 0x7f, 0x45, 0x1a, 0xa9, 0x1f, 0x6b, 0x51, 0x71, 0x20,
        0x05, 0x3e, 0x59, 0x62, 0x42, 0x1f, 0xfb, 0x55, 0xd0, 0x63, 0x9e, 0x23,
        0x12, 0x65, 0x2b, 0x3e, 0x91, 0x76, 0x67, 0x2c, 0x5f, 0xb4, 0x92, 0x32,
        0xb6, 0x12, 0xb0, 0xcf, 0x79, 0x98, 0x59, 0x7f, 0xaf, 0xd6, 0x29, 0xda,
        0x78, 0x14, 0x6e, 0xb6, 0x2e, 0xf8, 0xe9, 0x9c, 0x16, 0x41, 0x9c, 0x88,
        0x1f, 0x5d, 0x96, 0x03, 0x13, 0x09, 0xe6, 0xf4, 0x19, 0xe9, 0x83, 0x6b,
        0xa3, 0xad, 0x8c, 0xc5, 0xcd, 0x7e, 0x65, 0x50, 0x0a, 0xeb, 0x50, 0x5d,
        0x03, 0x44, 0xb4, 0xcb, 0x35, 0x30, 0x21, 0xa9, 0x6d, 0x5f, 0xf6, 0x07,
        0x42, 0x63, 0x97, 0xd2, 0xc9, 0xe3, 0x54, 0xde, 0x10, 0x0d, 0x00, 0x1f,
        0xa8, 0x37, 0x1c, 0xb4, 0x53, 0x8c, 0xef, 0xae, 0xd6, 0x53, 0x8c, 0x5d,
        0x9b, 0x7e, 0xf0, 0xee, 0x02, 0xfa, 0x07, 0x79, 0x2a, 0x15, 0x49, 0x6d,
        0xe9, 0x0c, 0x78, 0xe1, 0x67, 0x49, 0xb7, 0x6b, 0x80, 0x88, 0xbf, 0xa9,
        0xca, 0x3a, 0xdb, 0x43, 0x45, 0xae, 0x9f, 0x80, 0x12, 0xf2, 0x22, 0xcc,
        0xeb, 0xbf, 0x3a, 0x63, 0x95, 0x33, 0xa3, 0xee, 0x46, 0xf3, 0xe6, 0xde,
        0xe0, 0x35, 0x13, 0xd5, 0xd5, 0xa8, 0x43, 0xb2, 0x63, 0xd3, 0x1e, 0xa8,
        0xf2, 0x69, 0xda, 0xd8, 0x1a, 0xbb, 0x42, 0x60, 0xfa, 0xf9, 0xe5, 0x7e,
        0x6d, 0xc0, 0x13, 0xff, 0xf2, 0x11, 0xd3, 0xa2, 0xe1, 0x75, 0x7c, 0x1a,
        0x44, 0x88, 0xb3, 0x26, 0x94, 0x7c, 0xc3, 0x3a, 0x88, 0x64, 0x7e, 0x7d,
        0x8a, 0xff, 0x1c, 0x12, 0x71, 0xd8, 0x70, 0x64, 0x2e, 0xc3, 0xd5, 0x4f,
        0x78, 0x46, 0x8c, 0xc3, 0xd3, 0x6e, 0x06, 0x96, 0xaa, 0x79, 0xef, 0xe0,
        0xe3, 0xd0, 0x6e, 0x0c, 0x5d, 0x59, 0x92, 0xf5, 0x37, 0x6c, 0xda, 0xf9,
        0x78, 0x6f, 0xe5, 0x4d, 0x16, 0xdc, 0x44, 0xa1, 0x96, 0x31, 0xd9, 0x15,
        0x1a, 0x86, 0x72, 0x21, 0x8a, 0x9c, 0x8b, 0x76, 0xbb, 0x7b, 0x19, 0x88,
        0x68, 0xf3, 0xc3, 0xeb, 0x54, 0x11, 0x99, 0xa0, 0x2c, 0xad, 0x15, 0xca,
        0x08, 0x30, 0x25, 0x5d, 0x77, 0x41, 0x7c, 0x68, 0x7e, 0x04, 0xa0, 0x91,
        0xaf, 0x4f, 0x77, 0x91, 0x3a, 0xe7, 0xeb, 0x30, 0xb6, 0xc6, 0xfb, 0x9b,
        0xd8, 0x7e, 0x23, 0xe8, 0x27, 0xed, 0x72, 0x31, 0xbb, 0x30, 0x38, 0x27,
        0x60, 0x00, 0x3d, 0x6f, 0x04, 0x5d, 0xd0, 0x2b, 0x37, 0x70, 0x88, 0xaa,
        0x59, 0x74, 0xe4, 0x87, 0xe4, 0x6c, 0x6d, 0x4c, 0x45, 0x5b, 0x50, 0x98,
        0x08, 0xd2, 0x6a, 0x49, 0x41, 0xff, 0x0f, 0x3d, 0x77, 0x0b, 0x3e, 0xfe,
        0x67, 0x5d, 0x69, 0x9f, 0xd8, 0xd1, 0x01, 0xc5, 0xd2, 0x27, 0x89, 0x48,
        0x2a, 0x01, 0x11, 0xf1, 0x68, 0x2a, 0x68, 0x87, 0x45, 0x9e, 0x42, 0x56,
        0x65, 0x04, 0xd7, 0x75, 0xd5, 0xaa, 0x81, 0x35, 0xbc, 0xdd, 0x99, 0x5e,
        0x79, 0x99, 0xeb, 0x20, 0x8e, 0x73, 0x6d, 0xbd, 0x41, 0x8a, 0x06, 0x6f,
        0x79, 0x5c, 0x5c, 0x4f, 0x12, 0x50, 0x32, 0xff, 0x41, 0x9d, 0x6c, 0xc7,
        0x5e, 0xa9, 0xf8, 0xee, 0xba, 0xab, 0x18, 0x30, 0x2c, 0x13, 0x6b, 0x6c,
        0x87, 0x7c, 0xa5, 0x6d, 0x42, 0xc1, 0x4b, 0x4b, 0x41, 0x62, 0x62, 0x73,
        0x4a, 0xa4, 0xa6, 0x40, 0xde, 0x17, 0x99, 0x9f, 0x1e, 0x3f, 0xce, 0x29,
        0xc6, 0x80, 0x61, 0x28, 0x8d, 0x8b, 0x1d, 0xef, 0xa8, 0xf7, 0x4f, 0x8b,
        0xac, 0x71, 0x95, 0x12, 0x3d, 0x7e, 0xae, 0x4e, 0x78, 0xd8, 0x19, 0xf6,
        0xad, 0x6d, 0x7d, 0xca, 0xa4, 0x81, 0x99, 0x44, 0x65, 0x8d, 0xaa, 0x58,
        0x10, 0xaf, 0xc7, 0xe8, 0x44, 0xf2, 0x4e, 0xe4, 0x67, 0xae, 0x2b, 0x2b,
        0x43, 0x89, 0x08, 0x32, 0xfa, 0x8a, 0xb6, 0x2f, 0x5d, 0x6a, 0x2c, 0xeb,
        0xba, 0xec, 0x59, 0x38, 0x9a, 0xa5, 0x79, 0x41, 0x8d, 0xfa, 0x56, 0xb6,
        0x0a, 0x3b, 0x7d, 0x51, 0x37, 0xd6, 0x7b, 0xc5, 0x31, 0x90, 0x93, 0x15,
        0xe7, 0x49, 0x39, 0x61, 0xe7, 0xb7, 0xbe, 0x1c, 0xb8, 0x50, 0x72, 0x7c,
        0x28, 0xe5, 0xe0, 0x62, 0xc7, 0xc2, 0x47, 0x23, 0x1a, 0x13, 0xdb, 0x71,
        0xa7, 0xa2, 0x84, 0xe8, 0x35, 0xf5, 0x06, 0x2c, 0xe5, 0x99, 0x62, 0xb0,
        0x1a, 0x76, 0xa4, 0x2d, 0xa5, 0x9b, 0x2c, 0x39, 0xd1, 0x00, 0x14, 0xd9,
        0x6f, 0xa8, 0x5c, 0x35, 0x6e, 0x60, 0x38, 0xf1, 0x98, 0xe1, 0xa6, 0xc5,
        0xdc, 0xbe, 0xd0, 0x36, 0xaf, 0x98, 0x9e, 0xed, 0x6a, 0x5e, 0x28, 0xc6,
        0x72, 0x76, 0xa0, 0x2d, 0x90, 0x90, 0x08, 0x18, 0x1a, 0x57, 0xf0, 0x4a,
        0xdf, 0xb4, 0x5f, 0xa5, 0x38, 0xc2, 0x73, 0xb3, 0x21, 0xd6, 0x9d, 0x7f,
        0x02, 0xc7, 0x1c, 0x66, 0xa9, 0xf9, 0x85, 0x3c, 0x57, 0x5a, 0x46, 0xdb,
        0x57, 0xa5, 0x67, 0xa9, 0x2e, 0x6e, 0xdf, 0x9d, 0x54, 0xa7, 0x73, 0xc7,
        0x0f, 0x0c, 0x44, 0x2a, 0x76, 0x2e, 0x18, 0x8a, 0x4e, 0x92, 0x38, 0x27,
        0xeb, 0xa6, 0x92, 0x5f, 0x02, 0x82, 0xb2, 0x25, 0xa5, 0xc6, 0x31, 0x3c,
        0x9e, 0x17, 0x6f, 0x45, 0x32, 0xed, 0x76, 0xcc, 0xb5, 0x1c, 0x8c, 0x91,
        0xef, 0xe4, 0xf3, 0xbf, 0x2a, 0x63, 0xa7, 0x51, 0x40, 0x09, 0x4e, 0x33,
        0xb4, 0xa0, 0x95, 0x16, 0x50, 0x56, 0x7f, 0x46, 0xea, 0x7a, 0x4a, 0x34,
        0xc6, 0x90, 0x67, 0xdd, 0x38, 0x64, 0x53, 0x5a, 0xa3, 0xe7, 0x51, 0x5f,
        0xa2, 0x19, 0x7d, 0x20, 0x48, 0x71, 0x2d, 0xce, 0xf0, 0x85, 0xda, 0x0e,
        0x2d, 0xae, 0x3d, 0xac, 0x4c, 0x9e, 0xbc, 0xa9, 0xd2, 0xa1, 0x7a, 0x8a,
        0x33, 0x54, 0x4b, 0x45, 0xc9, 0xe1, 0xb0, 0xa8, 0x7b, 0x25, 0x11, 0x1f,
        0x55, 0x16, 0xd3, 0xd1, 0x61, 0x7d, 0xb8, 0x49, 0x7c, 0x68, 0x29, 0x18,
        0xb0, 0x44, 0x68, 0xf4, 0x48, 0x00, 0xfa, 0x0b, 0xd7, 0xdc, 0x21, 0x5a,
        0xa6, 0x01, 0x99, 0x2d, 0xb4, 0xeb, 0x1e, 0x50, 0xee, 0xc9, 0x84, 0x99,
        0x39, 0xe7, 0x18, 0x05, 0xb8, 0x5f, 0x63, 0x71, 0x2e, 0xac, 0xc0, 0xb6,
        0x01, 0x9d, 0x04, 0xd7, 0x65, 0x9a, 0x4a, 0x67, 0xf2, 0xf3, 0x2d, 0xe4,
        0x75, 0xbe, 0x10, 0x1f, 0xf8, 0xe2, 0xd6, 0x92, 0xd1, 0xe1, 0xe7, 0x2e,
        0xd9, 0x2f, 0xf6, 0xbe
    ]),
    "Peach Puff": new Uint8Array([
        0xf5, 0xd5, 0x59, 0xfa, 0x45, 0x65, 0xb8, 0x24, 0xc0, 0x0b, 0x15, 0x4c,
        0xc2, 0x16, 0xbf, 0xfd, 0x50, 0xb6, 0x79, 0x64, 0x99, 0x84, 0xc0, 0x1b,
        0xe8, 0xcd, 0x59, 0xa4, 0x9a, 0xdb, 0x08, 0xfd, 0x95, 0xe4, 0x85, 0x8b,
        0x70, 0x74, 0x85, 0x07, 0x7b, 0x8d, 0xbc, 0xc7, 0x6e, 0x22, 0x6e, 0x3f,
        0x32, 0x2b, 0x73, 0x6e, 0x9c, 0x6e, 0x70, 0x4a, 0x83, 0x92, 0xb5, 0xa0,
        0x10, 0x9c, 0xa5, 0xde, 0x25, 0xb5, 0xe7, 0xea, 0xfd, 0x47, 0x74, 0x0c,
        0x01, 0xb2, 0x23, 0x56, 0x06, 0x52, 0x27, 0x71, 0x32, 0x64, 0x59, 0x27,
        0xd4, 0x7c, 0x16, 0x96, 0xb5, 0x7d, 0x9b, 0x03, 0x32, 0x88, 0x69, 0x89,
        0x1a, 0x42, 0xb8, 0xc9, 0xd9, 0x19, 0xff, 0xbf, 0xab, 0x0e, 0x07, 0x7f,
        0xf1, 0xdb, 0x1d, 0x6e, 0x85, 0x96, 0xc5, 0x81, 0xd1, 0xb9, 0x7a, 0xa5,
        0x44, 0xc5, 0x77, 0xf7, 0xc0, 0x90, 0xbe, 0x9c, 0x61, 0x31, 0x71, 0x35,
        0xf0, 0x35, 0xe3, 0xaa, 0xda, 0xd4, 0xbf, 0x89, 0x3d, 0x6b, 0xb2, 0xa1,
        0xf4, 0x40, 0xc9, 0x3e, 0xeb, 0xaa, 0xc4, 0x96, 0x99, 0x27, 0x65, 0xfa,
        0xe4, 0x36, 0xd2, 0x08, 0x2b, 0x32, 0xf7, 0x74, 0xa3, 0xdd, 0xaa, 0x41,
        0xdb, 0x8f, 0xaa, 0xb0, 0x5f, 0x8a, 0x81, 0x42, 0x6f, 0x84, 0xb8, 0x18,
        0x18, 0xcd, 0xaa, 0x15, 0x47, 0x70, 0x06, 0x67, 0xce, 0x7d, 0xd6, 0xc0,
        0x94, 0xca, 0x3c, 0x86, 0x73, 0x4d, 0x91, 0x1c, 0x06, 0xce, 0x2d, 0x26,
        0x78, 0x78, 0x0d, 0x46, 0xb0, 0x9e, 0xd9, 0x7b, 0xa7, 0x7a, 0xd0, 0xa2,
        0x14, 0x12, 0x07, 0xc4, 0xaa, 0x55, 0xd3, 0x5d, 0x39, 0xdb, 0x64, 0x5a,
        0x22, 0x75, 0x55, 0xb8, 0x22, 0x48, 0xe8, 0x87, 0x53, 0xa1, 0x53, 0xad,
        0x7d, 0xe1, 0x4c, 0x6f, 0x6e, 0x7f, 0x69, 0x1e, 0xd1, 0xe2, 0xe9, 0xaf,
        0xf0, 0xe1, 0x3c, 0x12, 0x5e, 0x09, 0x8b, 0x7c, 0x06, 0x95, 0xee, 0x7f,
        0xff, 0x21, 0xbc, 0xad, 0x72, 0x38, 0x31, 0x33, 0xd6, 0xc4, 0xd2, 0x2e,
        0x77, 0xc7, 0xf2, 0x23, 0x33, 0x05, 0x3d, 0xfe, 0x5b, 0xec, 0xd2, 0x44,
        0x52, 0xe3, 0x36, 0x8e, 0x55, 0xe4, 0xb1, 0x58, 0xa8, 0x29, 0xa6, 0x8a,
        0x4f, 0x30, 0xf2, 0x12, 0x27, 0xfa, 0xde, 0x63, 0x16, 0x5d, 0xb9, 0x43,
        0x32, 0xb0, 0xa6, 0xee, 0x5f, 0x88, 0x15, 0x6b, 0xd6, 0x32, 0xe1, 0x13,
        0xcb, 0x84, 0x24, 0xf0, 0x75, 0xe9, 0xb4, 0x16, 0x9a, 0xbd, 0xf5, 0xf7,
        0x8e, 0x83, 0x45, 0x99, 0x0a, 0x6f, 0xf7, 0xa7, 0xed, 0xc3, 0x31, 0xab,
        0x85, 0x07, 0x94, 0xf4, 0xe3, 0x84, 0x22, 0x79, 0x58, 0x62, 0xb0, 0x74,
        0xc9, 0x11, 0x9f, 0x09, 0x2f, 0x8c, 0x65, 0x04, 0xdc, 0x2f, 0x9f, 0x87,
        0xa8, 0x24, 0x5f, 0x7e, 0x94, 0x90, 0x76, 0x64, 0xca, 0xf9, 0x17, 0x6c,
        0x73, 0x98, 0xbf, 0x64, 0xb6, 0x69, 0xa9, 0x58, 0x41, 0x28, 0x8d, 0x2a,
        0x6f, 0x81, 0x51, 0x4d, 0x35, 0x9c, 0xd7, 0xca, 0x39, 0x13, 0xcc, 0x72,
        0x6d, 0xc8, 0x3d, 0xa6, 0xeb, 0xb6, 0xee, 0xca, 0x04, 0xa0, 0x51, 0x44,
        0x82, 0xfb, 0xb1, 0xee, 0x8a, 0xf9, 0x2c, 0xd0, 0xa8, 0x91, 0x67, 0x01,
        0x66, 0x09, 0x5b, 0xb7, 0x34, 0xfa, 0xee, 0x94, 0x3b, 0x69, 0xd1, 0x94,
        0xe3, 0x8d, 0x98, 0xa0, 0x6b, 0xa9, 0x88, 0x3f, 0xe2, 0x47, 0x8d, 0xeb,
        0x09, 0x8b, 0x94, 0xec, 0xb1, 0x74, 0xce, 0x17, 0xe8, 0xd2, 0x1c, 0x3d,
        0xaf, 0x36, 0x27, 0x63, 0xe5, 0x37, 0x25, 0xa9, 0xba, 0xc9, 0x3b, 0x7c,
        0xfc, 0x47, 0x47, 0xe2, 0x56, 0xdd, 0x57, 0xc9, 0x19, 0x9e, 0x47, 0xc2,
        0xc8, 0xa1, 0xaa, 0x73, 0x86, 0x40, 0xf3, 0x80, 0x14, 0xff, 0x2c, 0x42,
        0xa3, 0x03, 0x11, 0x20, 0x57, 0x4a, 0x02, 0x67, 0x66, 0x59, 0xa4, 0x7a,
        0x45, 0x50, 0x6e, 0x45, 0x7c, 0x68, 0x7d, 0x4c, 0xc0, 0xb7, 0x98, 0xd0,
        0x09, 0xe9, 0x44, 0x11, 0x56, 0xf3, 0x3b, 0xbc, 0xe0, 0xf1, 0x7a, 0x60,
        0xb4, 0xeb, 0xdb, 0xdb, 0x89, 0x75, 0xbe, 0xbc, 0x33, 0x4b, 0xd5, 0xe5,
        0xde, 0x72, 0xe3, 0xe3, 0xcd, 0x5a, 0x1f, 0x22, 0x89, 0x11, 0x92, 0xc2,
        0xce, 0x89, 0x0c, 0xcb, 0x25, 0x80, 0x31, 0x08, 0x0d, 0x75, 0x31, 0x35,
        0x97, 0x15, 0x47, 0x39, 0xfc, 0xea, 0xaa, 0xe1, 0x01, 0x48, 0x9f, 0xa1,
        0xbf, 0x95, 0x5c, 0xf0, 0xe6, 0x62, 0x55, 0xd0, 0x3d, 0xdf, 0xcc, 0xc4,
        0xed, 0xe5, 0xce, 0xbb, 0x68, 0xbf, 0x43, 0x8f, 0x6a, 0x44, 0x3e, 0x59,
        0x34, 0x37, 0x53, 0xea, 0x70, 0x89, 0x3b, 0x28, 0x95, 0x87, 0x10, 0xa9,
        0x62, 0x6a, 0xa9, 0x13, 0x91, 0x08, 0xeb, 0x11, 0xfb, 0x7d, 0x36, 0xdd,
        0xb3, 0xf9, 0x86, 0x3d, 0xbe, 0x32, 0x8a, 0xb4, 0x38, 0xb2, 0xda, 0x94,
        0xd0, 0x99, 0xb7, 0x04, 0x37, 0x85, 0xd2, 0x34, 0x24, 0xd2, 0xf1, 0x6b,
        0x4b, 0xb0, 0x85, 0xab, 0xb3, 0xb8, 0x74, 0x9d, 0x67, 0x8d, 0x86, 0x58,
        0x37, 0xf9, 0x31, 0x82, 0x3b, 0x51, 0xe8, 0x8a, 0x13, 0x28, 0xaa, 0x6b,
        0x75, 0x23, 0x16, 0x27, 0x54, 0xac, 0xfa, 0x49, 0x9e, 0xec, 0xcb, 0x97,
        0x45, 0x37, 0x05, 0xaf, 0x24, 0x2e, 0xe3, 0xfd, 0xb3, 0x33, 0x8b, 0x4b,
        0x95, 0xe5, 0x69, 0xe7, 0xb5, 0x8c, 0xe4, 0x22, 0xcb, 0xdf, 0xa3, 0x11,
        0xa7, 0x06, 0xda, 0x1a, 0x2c, 0x8d, 0xa7, 0x3c, 0xc3, 0x58, 0x37, 0xd5,
        0xab, 0x67, 0x89, 0x33, 0x06, 0xd8, 0xd2, 0x32, 0xa7, 0xde, 0x43, 0x5e,
        0xd1, 0x32, 0x6f, 0x18, 0x45, 0x3d, 0x79, 0x90, 0x91, 0xcc, 0x70, 0x2d,
        0xbe, 0x7f, 0x32, 0x99, 0x01, 0xbd, 0x43, 0xb5, 0x6c, 0x6b, 0x5e, 0x7b,
        0x8d, 0x9b, 0x37, 0x29, 0x3c, 0x75, 0x0c, 0xa3, 0xac, 0x0a, 0xcf, 0x1d,
        0xdf, 0x63, 0x23, 0xd4, 0xe8, 0x3a, 0xf2, 0xcd, 0x00, 0xf6, 0x3a, 0x71,
        0xca, 0x68, 0xf9, 0x3d, 0x45, 0x46, 0x76, 0xd6, 0x09, 0xd3, 0x62, 0x19,
        0x30, 0x6d, 0xf7, 0x72, 0xb8, 0x0c, 0x12, 0xb5, 0x98, 0xb0, 0xe2, 0xf1,
        0xb9, 0x1d, 0x27, 0xc8, 0x1c, 0x79, 0x0a, 0xd0, 0x0d, 0x29, 0xfa, 0x10,
        0x45, 0xe6, 0xd9, 0x08, 0x1e, 0x0b, 0xb5, 0x11, 0x78, 0x11, 0x0c, 0x20,
        0xa3, 0x42, 0x19, 0x96, 0x79, 0xd9, 0x8a, 0x3d, 0xa2, 0x5d, 0x31, 0xca,
        0xe0, 0x65, 0x3f, 0x68, 0xb7, 0x67, 0x18, 0x3c, 0x37, 0x33, 0x39, 0xf1,
        0x36, 0x66, 0x50, 0x6b, 0x74, 0x30, 0xfa, 0x3d, 0xe9, 0x7d, 0x8b, 0xb1,
        0x07, 0x52, 0x05, 0xbe, 0x54, 0xce, 0x25, 0x20, 0x79, 0xdf, 0xb5, 0x64,
        0x0a, 0x1e, 0x57, 0xeb, 0x80, 0x5d, 0xba, 0xdb, 0x2b, 0x41, 0x5a, 0xca,
        0x84, 0x2d, 0x93, 0xc3, 0xe2, 0x7c, 0x96, 0xcc, 0x71, 0x74, 0x33, 0x8c,
        0x59, 0xad, 0xc8, 0xac, 0xc1, 0x11, 0x0c, 0x1d, 0xe3, 0xa2, 0xee, 0xc1,
        0x2a, 0xd1, 0xdb, 0x61, 0x79, 0xa2, 0xef, 0xca, 0x54, 0x1b, 0xb9, 0x96,
        0x51, 0x9d, 0xcf, 0x25, 0x45, 0x3c, 0x81, 0x83, 0x38, 0x86, 0xa9, 0x10,
        0x1d, 0xaf, 0x1d, 0xb1, 0xf6, 0xba, 0x24, 0x34, 0xa8, 0x67, 0xeb, 0xb2,
        0x40, 0x15, 0xb6, 0xc6, 0xea, 0x87, 0x8a, 0x22, 0x59, 0x4f, 0x9f, 0xbb,
        0x68, 0xc2, 0xbf, 0xc7, 0x21, 0x98, 0x82, 0x33, 0x38, 0x19, 0x7c, 0x05,
        0xa1, 0x66, 0x23, 0xc0, 0x91, 0xdf, 0xf6, 0x76, 0xaa, 0xed, 0x09, 0x9c,
        0x91, 0x49, 0xeb, 0x4b, 0x50, 0xb9, 0x41, 0xd9, 0x14, 0xc1, 0x58, 0x74,
        0x5d, 0x2a, 0x7a, 0x69, 0x7e, 0x5e, 0xb4, 0xed, 0x68, 0x3d, 0x87, 0xde,
        0x06, 0x3f, 0x08, 0x82, 0xa9, 0xd2, 0x07, 0xf3, 0x7a, 0x73, 0x35, 0xee,
        0x92, 0x1e, 0x7d, 0x12, 0xff, 0xde, 0x3b, 0x34, 0x2a, 0x26, 0xd5, 0x90,
        0xa7, 0x8f, 0x99, 0x7f, 0x50, 0x6b, 0x34, 0xcc, 0x5e, 0xa7, 0xc0, 0xd6,
        0x50, 0x45, 0x3f, 0x6f, 0x12, 0x51, 0x1e, 0x3b, 0x09, 0x77, 0x51, 0xf1,
        0x18, 0xf1, 0x7d, 0x85, 0xc3, 0xcb, 0x01, 0xfd, 0x87, 0xe8, 0x31, 0x73,
        0x44, 0x3b, 0xab, 0xa3, 0x1a, 0xd6, 0x96, 0xa1, 0x82, 0xd8, 0x79, 0x45,
        0x21, 0xf2, 0xb8, 0xaa, 0x21, 0x32, 0xb9, 0xa8, 0xf7, 0x8b, 0x0f, 0x94,
        0x7c, 0x8c, 0x88, 0x35, 0x33, 0xfc, 0x8a, 0x15, 0x6b, 0xbc, 0xa3, 0x39,
        0xbf, 0xf8, 0x22, 0x24, 0x29, 0x69, 0x30, 0xcc, 0x12, 0x69, 0xa9, 0xb8,
        0x47, 0x5e, 0x73, 0x19, 0x25, 0xed, 0x47, 0x25, 0x0f, 0xe0, 0x35, 0xbd,
        0xc3, 0xb0, 0x5d, 0xff, 0xd8, 0xe1, 0x87, 0x6c, 0x98, 0x84, 0xf7, 0xa3,
        0xc9, 0x7c, 0x4a, 0x5b, 0x7a, 0x12, 0xab, 0xcc, 0xfd, 0x00, 0x25, 0xf9,
        0x64, 0x98, 0xda, 0xfd, 0xc4, 0x6e, 0x4e, 0xcb, 0x2e, 0x42, 0xd9, 0xa0,
        0x54, 0xfd, 0x9c, 0x8f, 0x5e, 0xc4, 0xfb, 0xca, 0x22, 0xb6, 0x78, 0x56,
        0x1a, 0x42, 0xa3, 0xd0, 0x09, 0x96, 0x6e, 0xd3, 0xed, 0x2f, 0xa6, 0x30,
        0xb2, 0x6b, 0xc2, 0xc0, 0x6d, 0x4f, 0x88, 0x68, 0xa9, 0x12, 0x7a, 0xf8,
        0x18, 0x99, 0xf0, 0xd9, 0x44, 0x5d, 0x89, 0x25, 0xf3, 0xb5, 0x9f, 0x83,
        0x12, 0x97, 0xb3, 0x4f, 0x67, 0xc5, 0xe2, 0x39, 0xe0, 0x8b, 0x77, 0x0c,
        0xe5, 0xbe, 0x4e, 0x89, 0xa6, 0x67, 0x04, 0xe0, 0x12, 0x65, 0xbb, 0xee,
        0x85, 0xf4, 0xd6, 0xf6, 0xbc, 0xb8, 0xa1, 0x46, 0xf0, 0x8f, 0xef, 0xa9,
        0xc7, 0x0f, 0x91, 0x12, 0x90, 0x70, 0xcf, 0xb3, 0x5a, 0x3a, 0x2d, 0x46,
        0x24, 0xbe, 0x65, 0xba, 0xba, 0x14, 0x98, 0x8d, 0xb2, 0x20, 0x0e, 0xf6,
        0xd2, 0x9f, 0x2e, 0x8d, 0x5d, 0xd8, 0x79, 0x74, 0x97, 0x51, 0x2d, 0x28,
        0xe4, 0x4c, 0xf3, 0xcd, 0xb5, 0x9a, 0xde, 0xee, 0x47, 0x09, 0xeb, 0x07,
        0xd0, 0xfe, 0x47, 0x95, 0xa7, 0x7a, 0x16, 0x36, 0x95, 0x9d, 0x1b, 0x26,
        0x64, 0xb4, 0x9e, 0x34, 0x5f, 0x89, 0xcb, 0x58, 0x1b, 0x4e, 0xa3, 0x1b,
        0xd7, 0x81, 0x94, 0x6e, 0xee, 0xae, 0xc7, 0xb4, 0x57, 0x82, 0x60, 0xb4,
        0xf3, 0xf6, 0xb6, 0xef, 0x4f, 0xae, 0x7c, 0x27, 0x41, 0x53, 0xa5, 0xa0,
        0x37, 0x2d, 0xea, 0x35, 0x87, 0x19, 0xbe, 0xe3, 0xa2, 0x3b, 0x2b, 0xdf,
        0xb1, 0x60, 0x7d, 0x02, 0x73, 0xb9, 0xef, 0xb2, 0x3e, 0x4b, 0x62, 0x0b,
        0xdb, 0xf8, 0xce, 0xe3, 0x28, 0x75, 0x13, 0xbe, 0x39, 0x72, 0xd2, 0x30,
        0x1c, 0xc7, 0xd9, 0x8d, 0x11, 0x18, 0xc5, 0xdf, 0x51, 0xa3, 0x05, 0x4b,
        0x72, 0x95, 0x5f, 0x96, 0x95, 0x62, 0x06, 0xd5, 0x6e, 0x7b, 0xc7, 0xd0,
        0x6d, 0x04, 0xe6, 0xe6, 0x5c, 0xfe, 0x91, 0xcd, 0xd9, 0xb4, 0x1c, 0xd0,
        0x47, 0x7f, 0xcf, 0x41, 0xe0, 0x4c, 0x51, 0xbf, 0x9e, 0x41, 0x04, 0xb1,
        0xe2, 0x1c, 0x75, 0x56, 0x07, 0xe6, 0xdd, 0x3f, 0xd7, 0x32, 0xd2, 0x32,
        0x4a, 0xea, 0xd9, 0x54, 0x04, 0x68, 0xc2, 0x71, 0xf4, 0xda, 0x36, 0x04,
        0xac, 0xd8, 0x20, 0x9e, 0xbc, 0xe4, 0x42, 0x07, 0x0c, 0x4b, 0xac, 0xd4,
        0x88, 0x93, 0x5c, 0x26, 0x2b, 0x95, 0xd4, 0xc2, 0x41, 0xb7, 0x3a, 0x9e,
        0x79, 0x8a, 0x44, 0x75, 0xf0, 0x3f, 0x63, 0x9b, 0xd2, 0x61, 0xab, 0x53,
        0xf5, 0x37, 0x35, 0xc5, 0x6b, 0x5f, 0xa8, 0xb9, 0x60, 0x4a, 0x81, 0x4f,
        0xc7, 0x30, 0xfa, 0x02, 0xdf, 0x96, 0x9d, 0xf0, 0xb0, 0xff, 0x72, 0x77,
        0xb8, 0x0f, 0xbc, 0x0c, 0xea, 0xb3, 0x17, 0xe8, 0x9e, 0xaa, 0x8a, 0x8f,
        0xc1, 0xc4, 0x1d, 0xce, 0xf5, 0x30, 0x0f, 0x4d, 0xac, 0x34, 0x19, 0x0f,
        0x34, 0xf9, 0x67, 0x6a, 0x4b, 0x9e, 0x0f, 0xe4, 0xcf, 0xc2, 0x30, 0x97,
        0x46, 0xc5, 0x01, 0xe3, 0xbe, 0x4c, 0x43, 0xd1, 0xcf, 0x6d, 0x1c, 0xac,
        0x38, 0x9b, 0xa6, 0x22, 0x35, 0x24, 0x8c, 0x87, 0xcd, 0x9b, 0x15, 0x74,
        0x22, 0x93, 0xd3, 0x8a, 0x1f, 0x2c, 0xf9, 0xac, 0x96, 0x73, 0x79, 0x3c,
        0x83, 0xc4, 0x35, 0x75, 0x23, 0xfa, 0xc4, 0x7f, 0x4f, 0xbb, 0xf5, 0x38,
        0x92, 0x59, 0x27, 0x4c, 0xc1, 0xd2, 0x91, 0x80, 0x70, 0x0a, 0x90, 0x3a,
        0xa1, 0x52, 0xd7, 0x6e, 0xde, 0x71, 0x24, 0xc1, 0x93, 0x25, 0xfc, 0x0e,
        0xff, 0x1f, 0x6d, 0x46, 0xd7, 0xae, 0xb4, 0x21, 0x06, 0x67, 0xef, 0x2d,
        0x5c, 0xcc, 0xd0, 0x1c, 0x04, 0x8c, 0x4c, 0x66, 0xb2, 0xa0, 0xf5, 0xd8,
        0x82, 0xd1, 0x60, 0x56, 0x89, 0xb6, 0x7f, 0xc7, 0x12, 0xcc, 0x1d, 0x9c,
        0x64, 0x0e, 0x01, 0x5a, 0x18, 0xdb, 0xbc, 0x42, 0x42, 0xf1, 0x2c, 0xe2,
        0xf1, 0xd7, 0x9b, 0x4a, 0xb1, 0x5e, 0x9a, 0xdd, 0x94, 0x36, 0x11, 0x04,
        0x10, 0x81, 0x6c, 0xd9, 0xf3, 0x3d, 0xae, 0x8a, 0x2a, 0x22, 0xdd, 0x11,
        0xf9, 0x47, 0x5c, 0x0c, 0x17, 0xec, 0xae, 0x8f, 0x5c, 0xc3, 0xb2, 0xef,
        0x13, 0x7e, 0xc2, 0x61, 0x08, 0xa6, 0x07, 0x25, 0xcd, 0x3a, 0x3f, 0x13,
        0x95, 0xcc, 0x6d, 0x9d, 0x36, 0x61, 0x83, 0x4a, 0x94, 0x1e, 0x4b, 0xcf,
        0x7f, 0x96, 0xbb, 0xbb, 0xe7, 0x89, 0xe1, 0xb0, 0x95, 0xe2, 0x47, 0xc9,
        0x04, 0xa4, 0x57, 0xc4, 0xe8, 0x8d, 0xae, 0xd0, 0xe9, 0xaa, 0xbe, 0x21,
        0x19, 0x7c, 0xc0, 0xbc, 0x92, 0x26, 0xaa, 0x19, 0xcd, 0x92, 0xcc, 0xa5,
        0xd7, 0x53, 0x2a, 0x9e, 0x36, 0xc4, 0xc1, 0x90, 0x01, 0x35, 0x6c, 0xf0,
        0x13, 0xe9, 0xfc, 0x61, 0x5d, 0xf0, 0xc2, 0x52, 0x10, 0xd0, 0xaf, 0xc2,
        0x09, 0xb3, 0x40, 0x4e, 0xe1, 0x37, 0xf9, 0x32, 0x30, 0x8f, 0x11, 0xb9,
        0xe9, 0xd7, 0x9c, 0x72, 0x29, 0xb3, 0xd7, 0xdd, 0xe2, 0xa1, 0xda, 0xfa,
        0xf6, 0x36, 0xd8, 0x27, 0x12, 0x9d, 0x6b, 0x57, 0x44, 0xfe, 0x58, 0x8b,
        0xc7, 0xe2, 0x0b, 0x9b, 0x8f, 0x65, 0x81, 0x02, 0x6c, 0x59, 0x88, 0x89,
        0x1e, 0x5f, 0x1b, 0xd2, 0x8a, 0x12, 0x0a, 0x89, 0x5c, 0x41, 0xad, 0x37,
        0x08, 0x2e, 0x37, 0x6a, 0x6d, 0x10, 0x1d, 0x8b, 0xdf, 0xf8, 0x5c, 0x34,
        0x29, 0x31, 0x0c, 0x30, 0x46, 0x40, 0xff, 0x45, 0x0e, 0xb8, 0x7e, 0xb6,
        0xc6, 0xa3, 0x8e, 0x38, 0xb0, 0x07, 0xf3, 0x95, 0x96, 0x2a, 0x59, 0xcc,
        0x82, 0xdb, 0xd8, 0x2e, 0xba, 0xc1, 0xac, 0x11, 0x9c, 0xaf, 0x09, 0xe0,
        0x73, 0xd2, 0x0b, 0xa9, 0x81, 0x2c, 0xcb, 0xef, 0x4e, 0x88, 0x57, 0xac,
        0x99, 0x74, 0xa5, 0xe4, 0xb2, 0x05, 0x98, 0xef, 0x99, 0x38, 0x6e, 0x9f,
        0x40, 0x6d, 0x2f, 0xe8, 0xb1, 0x68, 0x35, 0x4b, 0x31, 0xec, 0xda, 0x1a,
        0xbd, 0x14, 0xfb, 0xcd, 0x65, 0xa3, 0x3f, 0x84, 0x90, 0x41, 0xc6, 0x00,
        0xed, 0x45, 0x90, 0x9f, 0xcf, 0xad, 0x9a, 0x47, 0xf7, 0x99, 0x91, 0x6d,
        0xc0, 0x65, 0xe8, 0x4e, 0xbd, 0xb4, 0xb5, 0x8d, 0x8a, 0x65, 0xd4, 0x1a,
        0x63, 0xe6, 0x51, 0x5e, 0x20, 0xa0, 0x8f, 0x99, 0x67, 0x00, 0xca, 0x86,
        0xf4, 0x9f, 0x3e, 0x1e, 0xc5, 0x45, 0xb5, 0x36, 0x56, 0xb2, 0x7b, 0x29,
        0x43, 0x58, 0x44, 0xb5, 0x70, 0xfa, 0xf4, 0xd7, 0xab, 0xe7, 0x27, 0x66,
        0xf2, 0xee, 0x95, 0xcd, 0x5d, 0x8e, 0xf8, 0x46, 0xe6, 0x15, 0xe8, 0x2d,
        0xd4, 0x98, 0x9d, 0x6f, 0xdc, 0x68, 0x45, 0x57, 0xa2, 0xed, 0xff, 0x25,
        0x33, 0xab, 0x62, 0x06, 0xfb, 0x28, 0x6b, 0x9e, 0x77, 0x4d, 0x88, 0x37,
        0x82, 0x16, 0x7c, 0xdb, 0x0c, 0x4b, 0xa9, 0x02, 0xb4, 0xcb, 0x28, 0x82,
        0x7a, 0x6c, 0xe5, 0xb5, 0x9b, 0xba, 0xce, 0x44, 0x7d, 0x25, 0xdc, 0x9d,
        0x0b, 0xcc, 0x93, 0xbb, 0x9b, 0x6b, 0xae, 0xd4, 0x33, 0xc3, 0xcf, 0xa2,
        0x5d, 0x16, 0x52, 0x4c, 0x9a, 0x0f, 0x22, 0x0a, 0xa1, 0xc4, 0x3f, 0x3b,
        0xa6, 0x03, 0xe2, 0xd8, 0x87, 0xd4, 0x8b, 0x2d, 0xf1, 0x29, 0xff, 0x1b,
        0x23, 0x01, 0xed, 0x02, 0xca, 0x25, 0xb3, 0x5c, 0x8c, 0xc0, 0xa4, 0xf2,
        0xf7, 0x3e, 0x43, 0xaa, 0xa8, 0x1b, 0x52, 0x75, 0x63, 0x02, 0xb1, 0xfc,
        0x81, 0xe1, 0x45, 0x42, 0xa7, 0xbf, 0xe2, 0xa6, 0x1c, 0x52, 0x0d, 0x50,
        0xcc, 0x1c, 0xc3, 0xb7, 0x2a, 0x21, 0xde, 0xd7, 0x07, 0x68, 0x67, 0x56,
        0x01, 0x94, 0x72, 0x70, 0x8e, 0x31, 0x16, 0x0a, 0x25, 0x67, 0xf8, 0x29,
        0xe8, 0x7d, 0x51, 0xe8, 0x1a, 0xf9, 0x6b, 0x29, 0xde, 0xdb, 0xdb, 0x87,
        0xd6, 0xb1, 0xe8, 0x12, 0xe9, 0x5f, 0xa5, 0x60, 0xf5, 0xe3, 0x24, 0xaf,
        0x44, 0xa1, 0xa3, 0xc2, 0x8d, 0x06, 0x16, 0x4d, 0xdb, 0x6f, 0x94, 0xf3,
        0x8d, 0xcb, 0x12, 0x27, 0xd5, 0x44, 0x0e, 0x34, 0x59, 0x0e, 0x0f, 0xf3,
        0x24, 0x03, 0xdd, 0x83, 0xc4, 0xb2, 0x01, 0x94, 0x1a, 0xb2, 0x11, 0xe6,
        0x4c, 0x90, 0xdc, 0x64, 0x78, 0xce, 0xc7, 0xf5, 0xee, 0x09, 0xc4, 0xde,
        0xc9, 0x11, 0x19, 0x32, 0xc7, 0xc2, 0x0d, 0x0d, 0x26, 0x4b, 0x2f, 0x32,
        0x4b, 0xb6, 0x30, 0x06, 0xe1, 0x73, 0x85, 0x14, 0x3c, 0x66, 0xa6, 0x13,
        0x5d, 0xca, 0x7b, 0xde, 0x86, 0x5d, 0x65, 0xd4, 0xb4, 0x94, 0xab, 0x5f,
        0x1f, 0x15, 0x15, 0x35, 0xd1, 0x48, 0x87, 0x9c, 0x20, 0x61, 0x14, 0x1c,
        0xab, 0x0b, 0xe1, 0x4b, 0x38, 0x0f, 0xa3, 0x6b, 0x2d, 0xd8, 0x53, 0x8a,
        0xcc, 0x0a, 0x87, 0x25, 0x8b, 0x1d, 0xc7, 0xcb, 0xdc, 0xae, 0x7a, 0xd1,
        0xed, 0xad, 0x69, 0x29, 0xe6, 0x85, 0xb1, 0x41, 0x48, 0x18, 0x59, 0xfe,
        0xd4, 0x05, 0x90, 0x3d, 0x60, 0xf8, 0x14, 0x4b, 0xcb, 0x96, 0xae, 0x7f,
        0xcd, 0x2b, 0xab, 0x46, 0x4e, 0xee, 0xef, 0x9d, 0xf1, 0xb4, 0xec, 0xfb,
        0x2b, 0x99, 0x2f, 0x52, 0xcb, 0x46, 0x30, 0xd6, 0x4e, 0x07, 0x46, 0x35,
        0xb0, 0xe2, 0xc4, 0xf0, 0xe6, 0x3c, 0xd2, 0x09, 0x40, 0x0e, 0xe3, 0xfc,
        0x95, 0xd2, 0x5f, 0xb1, 0x41, 0x64, 0xb2, 0x59, 0x62, 0x52, 0x7c, 0x0b,
        0x52, 0x68, 0xb2, 0x49, 0x85, 0x17, 0x60, 0x25, 0xeb, 0x8c, 0x3b, 0x72,
        0x63, 0x08, 0x32, 0xfe, 0x77, 0xc3, 0x72, 0x91, 0x4b, 0x8a, 0x76, 0x8d,
        0x51, 0xa6, 0x25, 0x52, 0x0b, 0xb5, 0x50, 0xe2, 0x9d, 0xc9, 0xcf, 0x67,
        0xe5, 0xf7, 0x90, 0xd9, 0xa9, 0x04, 0xa5, 0x1a, 0x7c, 0x57, 0xb9, 0x8f,
        0xb2, 0x6a, 0x12, 0x91, 0xe4, 0xf1, 0xc6, 0xec, 0xc4, 0x85, 0x35, 0xde,
        0x2e, 0xf7, 0xbd, 0x2e, 0x8e, 0x8e, 0xfc, 0xb8, 0xe8, 0x63, 0xe3, 0xd6,
        0xae, 0x9e, 0x26, 0xcd, 0x7e, 0xd8, 0x99, 0x5a, 0x30, 0x7b, 0xfe, 0xe2,
        0xc4, 0x0d, 0xb4, 0x06, 0xf4, 0xc1, 0xd1, 0x91, 0x4d, 0xa5, 0x56, 0xc6,
        0x30, 0x42, 0xd2, 0x2a, 0x2d, 0xc1, 0x7e, 0xb8, 0x40, 0x1f, 0x88, 0xbc,
        0x65, 0x7a, 0xa0, 0xd0, 0xf9, 0x9a, 0x52, 0x21, 0x60, 0x2e, 0xb2, 0x32,
        0xaa, 0x6a, 0x8b, 0xcd, 0x5b, 0xee, 0x61, 0x68, 0xdd, 0x7d, 0x0c, 0x8a,
        0xd4, 0x6b, 0x18, 0xac, 0xc8, 0xbb, 0xd4, 0x14, 0x3b, 0x7f, 0x20, 0x29,
        0x99, 0x2b, 0xbf, 0x5e, 0x56, 0xb8, 0x0e, 0x9f, 0xc7, 0x0d, 0x73, 0xc1,
        0x55, 0x1b, 0x6b, 0x49, 0xa7, 0x8d, 0xf0, 0x4f, 0xd4, 0x71, 0xb2, 0xce,
        0xe5, 0xcf, 0x50, 0x3a, 0x2f, 0x52, 0x3b, 0xbf, 0xc2, 0x34, 0x30, 0xb4,
        0x35, 0xe0, 0xc8, 0xe0, 0xd3, 0x68, 0xaf, 0x99, 0xa9, 0x2b, 0xff, 0xff,
        0xdc, 0xbc, 0x16, 0xf8, 0xe8, 0x52, 0x33, 0x51, 0xd9, 0x9b, 0x0a, 0x5b,
        0xd7, 0x5a, 0xba, 0xf8, 0x15, 0xb2, 0x65, 0xc9, 0xf6, 0xba, 0xea, 0x34,
        0xcd, 0x5e, 0x71, 0xe6, 0xe0, 0xc5, 0xc4, 0xfd, 0x9d, 0xda, 0x0a, 0xd1,
        0x09, 0x4e, 0x76, 0x51, 0xc1, 0x31, 0xe9, 0xf6, 0x9e, 0x41, 0x90, 0x32,
        0x49, 0x29, 0x44, 0x55, 0x73, 0x0b, 0x2c, 0x7b, 0xed, 0xfa, 0x12, 0x99,
        0x00, 0x03, 0xc8, 0xe0, 0x7b, 0x4b, 0xb1, 0xc1, 0x3f, 0x00, 0xd8, 0x50,
        0x25, 0x55, 0xc9, 0xcf, 0x9e, 0xe7, 0x0a, 0xd2, 0xda, 0x83, 0x8f, 0x22,
        0x4a, 0xd6, 0x5b, 0x39, 0x39, 0x0c, 0x46, 0x33, 0xca, 0x70, 0xe1, 0x1f,
        0x13, 0x45, 0x5c, 0x7e, 0x32, 0x9b, 0x77, 0x33, 0xe4, 0x27, 0xfb, 0xa5,
        0xe1, 0xa5, 0x80, 0x8b, 0x09, 0x22, 0xef, 0x63, 0x5e, 0x86, 0xbc, 0xa2,
        0x44, 0x76, 0xa6, 0x5c, 0xc8, 0xcc, 0xab, 0x2f, 0xf8, 0x56, 0xf7, 0xe7,
        0x76, 0x14, 0x27, 0xc9, 0x1c, 0x4c, 0xa2, 0x5f, 0x49, 0x50, 0x44, 0x58,
        0x88, 0x27, 0x50, 0xeb, 0x4f, 0x36, 0x00, 0xb5, 0x31, 0x12, 0x77, 0x4c,
        0xb4, 0x52, 0x25, 0xf2, 0x20, 0x1c, 0xa0, 0x59, 0x2b, 0x20, 0xa1, 0x28,
        0xd8, 0xe4, 0x31, 0x0a, 0x9b, 0xdf, 0xbb, 0xc9, 0x63, 0x74, 0x3e, 0xa5,
        0x61, 0x74, 0xb8, 0xe5, 0x41, 0x2f, 0xab, 0x11, 0x02, 0x4c, 0x9f, 0x02,
        0x07, 0x93, 0x21, 0xc7
    ]),
    "Sandy Brown": new Uint8Array([
        0xff, 0x7c, 0xe0, 0x4a, 0xc0, 0x6c, 0xb8, 0x1a, 0x0f, 0x9a, 0x1c, 0x02,
        0x34, 0xd9, 0x84, 0x3f, 0x01, 0xea, 0xaf, 0x17, 0x3b, 0x50, 0x3d, 0x45,
        0xe8, 0x03, 0xe0, 0x4e, 0x6a, 0xbc, 0x9c, 0x67, 0x7b, 0x6e, 0xf4, 0x85,
        0xe4, 0x7c, 0x87, 0x13, 0x5f, 0x4a, 0x68, 0x27, 0x8f, 0xf3, 0x9b, 0x30,
        0xfb, 0x13, 0x47, 0xc2, 0x82, 0x71, 0x65, 0xac, 0x25, 0x86, 0xe9, 0x4b,
        0x68, 0x5b, 0x50, 0x21, 0x04, 0xe5, 0x41, 0x94, 0xe8, 0x7c, 0x52, 0xf1,
        0xd7, 0xaf, 0x7d, 0x8d, 0x33, 0x15, 0x0a, 0xbf, 0xb6, 0x7e, 0x66, 0x1d,
        0xf0, 0xff, 0x89, 0x67, 0x4e, 0xc3, 0x45, 0xbf, 0x28, 0x21, 0xe9, 0x43,
        0x93, 0x6e, 0x2b, 0x09, 0xf6, 0xba, 0x19, 0x51, 0x6e, 0x81, 0x6b, 0x6c,
        0x25, 0x81, 0x1a, 0xd1, 0x56, 0x27, 0x27, 0x50, 0x31, 0xc5, 0x87, 0x0e,
        0x41, 0xf3, 0x0f, 0x9b, 0x2e, 0x5c, 0x6c, 0x4f, 0x92, 0x65, 0xda, 0x86,
        0x0b, 0x13, 0xb0, 0x7e, 0x95, 0x84, 0xda, 0x78, 0x1b, 0x9d, 0x39, 0x09,
        0x49, 0x93, 0xfa, 0xac, 0xfc, 0x12, 0x72, 0x6c, 0x8d, 0x96, 0xbf, 0x8d,
        0x6f, 0x54, 0x52, 0x42, 0x74, 0xf0, 0x80, 0x8e, 0xc2, 0x7f, 0x67, 0x6c,
        0xd2, 0x99, 0x5d, 0x0f, 0x92, 0x49, 0xdf, 0xec, 0xf2, 0x4d, 0x65, 0x4b,
        0xed, 0x71, 0x4b, 0x3c, 0x67, 0x08, 0x06, 0x5b, 0x1d, 0xcf, 0xcb, 0x54,
        0x67, 0xe0, 0x14, 0xca, 0xe0, 0xe7, 0x16, 0x31, 0x52, 0xa6, 0x8f, 0x1b,
        0x15, 0x62, 0xc9, 0xc0, 0xba, 0x7a, 0x68, 0x41, 0x63, 0x11, 0x3a, 0x00,
        0x5b, 0x97, 0xda, 0x03, 0x9b, 0xd1, 0xe9, 0xb1, 0x75, 0x53, 0x65, 0x6d,
        0xb0, 0x5a, 0x9c, 0xa9, 0x7a, 0x20, 0xfc, 0x2f, 0xd8, 0x35, 0xf0, 0xb9,
        0x47, 0xd5, 0x46, 0xdd, 0xdb, 0x35, 0xf1, 0x20, 0x63, 0x49, 0x22, 0x60,
        0x43, 0x23, 0xd3, 0x44, 0x62, 0x98, 0xcf, 0x93, 0x06, 0xaf, 0xd5, 0xb6,
        0x8f, 0x2c, 0x57, 0x78, 0xd2, 0xf4, 0xb7, 0xc7, 0x32, 0xae, 0x5b, 0xf0,
        0xad, 0xe1, 0x83, 0xf9, 0x0b, 0x4d, 0xfd, 0xa9, 0xcc, 0xad, 0x4c, 0x68,
        0xce, 0x98, 0x5f, 0xbb, 0xfc, 0x43, 0xba, 0x9c, 0xe1, 0x4f, 0xc8, 0xa9,
        0xa2, 0x29, 0x26, 0xdc, 0xc9, 0xba, 0xca, 0x01, 0x52, 0x88, 0x41, 0xcd,
        0x3e, 0x48, 0x0b, 0x9b, 0x2f, 0x93, 0xf1, 0xdb, 0x30, 0xda, 0xb1, 0x79,
        0xe7, 0xc8, 0xba, 0x96, 0xed, 0x62, 0x49, 0xa6, 0x8b, 0x41, 0x21, 0x31,
        0x8b, 0xb6, 0x11, 0xa1, 0x33, 0xf8, 0x7d, 0x9f, 0x4c, 0xd1, 0xb8, 0x34,
        0x7e, 0xb0, 0xa9, 0x6e, 0x34, 0xa6, 0x33, 0xaa, 0x6d, 0x6b, 0x15, 0xfc,
        0xf5, 0xb7, 0xf5, 0x18, 0x63, 0x76, 0x86, 0x30, 0x2c, 0x8b, 0x49, 0x43,
        0xd1, 0xdc, 0x2f, 0x41, 0x82, 0x4a, 0xb6, 0x28, 0x7c, 0xad, 0x0a, 0xd3,
        0xd0, 0x5c, 0x53, 0xf6, 0x07, 0xc9, 0x24, 0xe4, 0x4d, 0x93, 0x56, 0xcf,
        0x8f, 0x05, 0x34, 0x67, 0x3c, 0x8d, 0xdb, 0xca, 0x3e, 0x61, 0x30, 0xed,
        0x23, 0xb1, 0x9a, 0xd0, 0x70, 0x53, 0xc9, 0x2c, 0xd7, 0x10, 0x90, 0xe0,
        0xdb, 0x1c, 0x12, 0xfa, 0x3b, 0x37, 0xdf, 0x6c, 0xf5, 0xb1, 0xe4, 0x1b,
        0x6d, 0xd8, 0x9b, 0xea, 0x6c, 0xcb, 0xde, 0x25, 0xe5, 0xb4, 0xee, 0x19,
        0xd5, 0x97, 0xfe, 0x6d, 0x86, 0x4d, 0xdc, 0x25, 0x72, 0xee, 0xb6, 0xd9,
        0xe2, 0x8a, 0xfc, 0xff, 0x40, 0xbb, 0xc2, 0x87, 0x5e, 0xb3, 0x96, 0x72,
        0x18, 0xc4, 0xb7, 0x36, 0x7c, 0x42, 0xb3, 0x61, 0xf0, 0x2a, 0x49, 0x8f,
        0xb9, 0x14, 0xf3, 0xd9, 0x44, 0x2c, 0xd5, 0x38, 0xcc, 0x3a, 0x8c, 0xdf,
        0xa5, 0x58, 0x85, 0x0e, 0xe9, 0x79, 0xf1, 0x72, 0x58, 0x4c, 0x03, 0x19,
        0x0d, 0x04, 0x60, 0x58, 0x89, 0x06, 0x0c, 0x81, 0x42, 0x25, 0x87, 0x77,
        0x54, 0xd0, 0xd9, 0x74, 0x85, 0xc6, 0xbf, 0x3e, 0x1d, 0x01, 0x49, 0x98,
        0x8a, 0x3d, 0x7a, 0xd5, 0xe5, 0xd0, 0xbd, 0xdc, 0x6f, 0x92, 0x09, 0xa8,
        0x4d, 0x0a, 0x2c, 0x02, 0x53, 0xd3, 0x39, 0xe2, 0x61, 0xb4, 0xb5, 0xba,
        0x09, 0xc2, 0x07, 0xf5, 0x5e, 0x5b, 0xa0, 0x67, 0x0c, 0x11, 0x29, 0x02,
        0xc6, 0xb8, 0x8a, 0x30, 0x6e, 0x88, 0x61, 0x5b, 0x7f, 0xaf, 0xfd, 0x46,
        0x10, 0xa7, 0xc1, 0x77, 0xf1, 0x1b, 0x4d, 0xf6, 0x79, 0x3d, 0xb9, 0x0f,
        0xf4, 0xa0, 0x2d, 0x40, 0x22, 0x02, 0x02, 0x0a, 0xfe, 0xd2, 0x46, 0x35,
        0x7c, 0x44, 0x15, 0x43, 0x5f, 0x66, 0xdb, 0xea, 0x51, 0x4d, 0x16, 0x38,
        0x88, 0xea, 0xe1, 0xf5, 0x86, 0xe1, 0xdc, 0x04, 0x76, 0xe0, 0x0b, 0x30,
        0xe1, 0xa2, 0xf2, 0x9a, 0x8b, 0x6b, 0x99, 0x70, 0xed, 0x50, 0x92, 0xe8,
        0x9e, 0x8e, 0xbd, 0x26, 0x40, 0x3a, 0xe9, 0x60, 0x0d, 0x78, 0x7e, 0x89,
        0x25, 0xfb, 0xb2, 0xec, 0xb8, 0x30, 0x1b, 0xca, 0x27, 0xb7, 0x03, 0xe2,
        0x77, 0x5f, 0xb5, 0x68, 0x92, 0xa5, 0x09, 0x04, 0x26, 0x4e, 0xfe, 0x3c,
        0xfc, 0xb4, 0xcc, 0xf1, 0x7d, 0x32, 0xad, 0x41, 0x80, 0xe2, 0xf2, 0xba,
        0xa1, 0xb6, 0xdb, 0xea, 0x6d, 0x50, 0xb8, 0x19, 0x7b, 0x48, 0x2b, 0x9e,
        0x2e, 0xe0, 0xa4, 0x7c, 0xce, 0x57, 0x23, 0x12, 0x90, 0x30, 0xa3, 0xba,
        0x66, 0x73, 0xab, 0xd2, 0x88, 0x68, 0x5c, 0xb3, 0xd6, 0xe3, 0x6c, 0x89,
        0x90, 0x13, 0x06, 0xdb, 0x52, 0xff, 0xa6, 0x54, 0xd0, 0x33, 0x40, 0x02,
        0x77, 0x77, 0x76, 0x1c, 0x46, 0xad, 0x28, 0x68, 0x1b, 0xa5, 0x54, 0x14,
        0x24, 0x1a, 0x10, 0x42, 0xfb, 0x86, 0x77, 0x82, 0x75, 0x75, 0x0c, 0x06,
        0x1f, 0x5c, 0xa4, 0xa2, 0x69, 0x64, 0x64, 0x4f, 0xe9, 0x4a, 0x03, 0x7d,
        0xe8, 0xff, 0x9b, 0x69, 0x6b, 0xc9, 0x04, 0x8d, 0x00, 0xe5, 0x65, 0xa2,
        0xcb, 0x6c, 0x71, 0x22, 0x0a, 0x20, 0x8b, 0x3c, 0x6e, 0x9a, 0xd8, 0x48,
        0x5e, 0x17, 0x10, 0x3c, 0x33, 0x98, 0xd1, 0xbb, 0x95, 0xd5, 0xd4, 0x60,
        0x80, 0xbb, 0xe8, 0xa3, 0xd3, 0x6c, 0x92, 0x70, 0xed, 0xaa, 0xe1, 0x01,
        0x42, 0x2d, 0xcc, 0x5d, 0x3a, 0x69, 0x4c, 0x82, 0x7e, 0x5b, 0x4b, 0x15,
        0x6f, 0x3f, 0x3f, 0x04, 0x5a, 0xa9, 0x29, 0x7d, 0x47, 0x7f, 0xe7, 0x08,
        0xe1, 0x9a, 0x32, 0x05, 0x5b, 0xa4, 0xc3, 0x91, 0x99, 0x3a, 0x53, 0x9f,
        0x2c, 0x74, 0xec, 0xf4, 0xad, 0x19, 0x70, 0xd6, 0x3f, 0xae, 0x1b, 0x86,
        0x66, 0xd0, 0x27, 0x9d, 0x99, 0x68, 0xac, 0x3c, 0x64, 0xa9, 0xb1, 0xee,
        0x47, 0x39, 0x10, 0x8e, 0xb8, 0xfc, 0xa7, 0x09, 0x4d, 0x85, 0x15, 0x18,
        0x3a, 0xe1, 0x42, 0x0b, 0xcb, 0x8b, 0x0c, 0xd0, 0x0a, 0x1b, 0xba, 0x42,
        0x44, 0x13, 0x5e, 0x0c, 0x9d, 0xb4, 0x37, 0x50, 0x56, 0xfc, 0x2e, 0x7e,
        0xc5, 0x1f, 0xfd, 0xd7, 0xfa, 0xcc, 0xae, 0x31, 0x97, 0xda, 0xf6, 0xf5,
        0x14, 0x6b, 0x08, 0x8f, 0xd8, 0x2f, 0x8e, 0x6c, 0x0f, 0x79, 0x71, 0xf3,
        0x76, 0xd6, 0xee, 0xd7, 0x26, 0xcf, 0xe3, 0xc5, 0x7f, 0x31, 0x02, 0x84,
        0xa3, 0x8c, 0xfa, 0x05, 0x0e, 0xc8, 0x9e, 0x2f, 0xf3, 0x88, 0x5d, 0xac,
        0x6f, 0x7f, 0x74, 0xc7, 0x8c, 0x17, 0x06, 0x68, 0x59, 0x89, 0x96, 0xe6,
        0xae, 0x29, 0xba, 0xed, 0x72, 0x80, 0x29, 0xf9, 0xd7, 0xee, 0x18, 0x66,
        0x64, 0x90, 0x51, 0xb0, 0xb2, 0xe2, 0x42, 0xec, 0x99, 0xe7, 0x1a, 0x45,
        0x65, 0x21, 0x06, 0xe3, 0x30, 0xda, 0x22, 0x06, 0xaa, 0xa5, 0x6d, 0xf6,
        0xf1, 0xfb, 0x33, 0xff, 0x31, 0x25, 0x30, 0x81, 0x57, 0x32, 0xdb, 0x19,
        0x0a, 0x1d, 0x9a, 0xa1, 0xe6, 0x39, 0x84, 0xb1, 0x0d, 0xdc, 0x7c, 0xe4,
        0xfb, 0x93, 0x41, 0x80, 0x61, 0xdf, 0xdb, 0xee, 0x8f, 0x56, 0x4d, 0xa9,
        0x23, 0xe8, 0xa8, 0x6f, 0xb1, 0x2c, 0xcb, 0xdf, 0x71, 0xef, 0x6b, 0x19,
        0x05, 0xe0, 0xd7, 0xf3, 0x5b, 0xf4, 0x8e, 0x24, 0x6d, 0x8d, 0x8f, 0xf2,
        0x04, 0x0e, 0x82, 0xd0, 0xe7, 0x9b, 0x27, 0x59, 0xd5, 0x8d, 0x9e, 0x05,
        0xe7, 0x04, 0x1f, 0xa1, 0x77, 0xe7, 0xda, 0xef, 0x39, 0x4f, 0x53, 0xa3,
        0xc4, 0xe3, 0x8a, 0x2b, 0x77, 0x78, 0xc1, 0xd6, 0xed, 0x76, 0x26, 0x0f,
        0xc8, 0x0a, 0x82, 0xde, 0xc5, 0x12, 0x3a, 0x9a, 0x34, 0xc0, 0x64, 0xcf,
        0x72, 0xec, 0xff, 0x33, 0x85, 0xc5, 0xa2, 0x80, 0xdf, 0xbe, 0xdb, 0x04,
        0x04, 0x84, 0x16, 0xab, 0xa7, 0x74, 0xda, 0x5b, 0xf8, 0x27, 0x05, 0xbd,
        0x3b, 0x24, 0xdd, 0xbb, 0x08, 0x27, 0x0c, 0xc4, 0x41, 0x3c, 0x63, 0x20,
        0x65, 0x2b, 0xb4, 0xdc, 0xf0, 0x71, 0xa6, 0xdd, 0x8f, 0xed, 0xea, 0x07,
        0xf4, 0x1b, 0x9c, 0x2a, 0xc8, 0x08, 0x4e, 0x69, 0x44, 0xd5, 0xaa, 0xba,
        0x01, 0x28, 0xc2, 0x7f, 0x56, 0x7d, 0x7f, 0xf9, 0x6e, 0x66, 0x77, 0x62,
        0x21, 0x3b, 0xf5, 0xd6, 0x99, 0xff, 0x0a, 0xf1, 0xf8, 0xec, 0x49, 0x70,
        0x10, 0xc1, 0x5a, 0x37, 0x8e, 0xc7, 0x26, 0x5b, 0x1f, 0x5e, 0xa6, 0x4f,
        0xef, 0x1c, 0xa5, 0xc7, 0xa3, 0xcc, 0xab, 0xab, 0x72, 0x09, 0xac, 0xd9,
        0xac, 0xbb, 0x95, 0xe4, 0x37, 0x6f, 0x7f, 0x30, 0x0c, 0xee, 0x36, 0xf6,
        0x71, 0x9b, 0x65, 0x3d, 0xe0, 0x4b, 0xe5, 0x69, 0x49, 0x56, 0x05, 0x2b,
        0xb8, 0x94, 0x61, 0x09, 0x2d, 0xcb, 0xe6, 0x83, 0x86, 0x59, 0x3f, 0xdd,
        0x34, 0x8b, 0x50, 0xdc, 0x8a, 0x74, 0x30, 0xcc, 0x07, 0x7d, 0xcb, 0xcf,
        0x34, 0x82, 0xcf, 0xde, 0x2d, 0xf9, 0xaa, 0x79, 0x03, 0xe5, 0x9a, 0x3a,
        0x37, 0x4c, 0xdd, 0xbf, 0x86, 0x1d, 0x2e, 0x81, 0xb0, 0xf1, 0x1c, 0x81,
        0x2b, 0x8f, 0xfd, 0x36, 0x8a, 0x42, 0x0f, 0xcb, 0x13, 0x7b, 0x1c, 0x79,
        0x79, 0x47, 0x1f, 0xa2, 0x95, 0x9e, 0x66, 0xea, 0x70, 0xb7, 0x7d, 0x7e,
        0x16, 0x32, 0x4d, 0x9c, 0xed, 0xb0, 0xb2, 0x4a, 0x7b, 0xfd, 0x2d, 0x30,
        0x5e, 0x19, 0x9b, 0x71, 0x72, 0x89, 0x71, 0x37, 0xcf, 0xa5, 0xfc, 0xfa,
        0x5a, 0x39, 0x0e, 0xba, 0x85, 0xcb, 0x96, 0x1c, 0xdc, 0xe2, 0x3b, 0x63,
        0xbc, 0x3b, 0xd6, 0x91, 0xbb, 0x0a, 0xd4, 0x1c, 0xe2, 0x42, 0xd9, 0x27,
        0x2f, 0x47, 0x81, 0x85, 0xa3, 0x91, 0x45, 0x6e, 0xc0, 0xfc, 0x4c, 0x52,
        0x41, 0xe1, 0x7b, 0xed, 0x09, 0x6e, 0x03, 0x94, 0x28, 0x0b, 0x11, 0xbe,
        0x91, 0x88, 0xb1, 0x06, 0xc2, 0xb0, 0x72, 0xeb, 0xbc, 0x34, 0x0d, 0x7e,
        0x17, 0x28, 0x7a, 0xfa, 0x89, 0x17, 0x64, 0x86, 0x21, 0x3d, 0x42, 0x66,
        0x91, 0xc9, 0x76, 0xb2, 0xbc, 0x16, 0xee, 0x31, 0x1a, 0xd0, 0x31, 0x92,
        0x6e, 0x31, 0x98, 0xd6, 0x6c, 0xaa, 0x13, 0x81, 0x8c, 0x47, 0xa6, 0x7b,
        0x4c, 0xe8, 0xce, 0x15, 0x8f, 0xe3, 0x05, 0xdf, 0xac, 0x39, 0xca, 0x3c,
        0xa0, 0x57, 0x2c, 0xaa, 0x65, 0x5c, 0xef, 0xc1, 0xc8, 0x0e, 0x80, 0x4d,
        0x1d, 0x34, 0x81, 0x9d, 0x41, 0x5b, 0x59, 0x3c, 0xe4, 0x07, 0xc7, 0x25,
        0xce, 0x6b, 0x04, 0x5a, 0x88, 0x64, 0x7a, 0x4b, 0x40, 0x8a, 0x4a, 0x1f,
        0xa8, 0x8c, 0xb2, 0xaf, 0xff, 0xe0, 0x76, 0x53, 0xf4, 0x38, 0x58, 0x6a,
        0x1b, 0x87, 0xb0, 0xfd, 0x07, 0x29, 0x72, 0x4e, 0xe6, 0x5f, 0xd9, 0x86,
        0xb6, 0x27, 0xd3, 0x6a, 0x43, 0xd2, 0xbd, 0xee, 0x0c, 0x26, 0x67, 0x06,
        0x1c, 0xdd, 0x29, 0x3a, 0x85, 0xcd, 0x3f, 0x9b, 0xfa, 0xde, 0xe6, 0x45,
        0xa0, 0xc5, 0x36, 0x28, 0x65, 0x67, 0x16, 0x65, 0x64, 0xc3, 0x91, 0x27,
        0xd5, 0x7b, 0x04, 0x26, 0xd9, 0xf4, 0xb1, 0x96, 0x81, 0x89, 0xbe, 0x81,
        0xed, 0x1c, 0xf3, 0x9c, 0xea, 0x0c, 0x40, 0xcf, 0x8c, 0x85, 0x94, 0xba,
        0x8e, 0x07, 0x49, 0xb1, 0x98, 0xc6, 0x97, 0x48, 0xfe, 0x35, 0xd0, 0x59,
        0x97, 0xdb, 0xe8, 0xac, 0x03, 0xbb, 0x1b, 0x8c, 0xed, 0xfd, 0x76, 0x9c,
        0xbf, 0xf1, 0xfb, 0x8f, 0xde, 0xa0, 0xdf, 0xec, 0x29, 0x59, 0xbd, 0xae,
        0xea, 0xa3, 0x6d, 0x9d, 0x34, 0x2e, 0x5e, 0xd7, 0x55, 0xa8, 0x6a, 0xef,
        0x9c, 0xac, 0x75, 0xa5, 0x3f, 0xf5, 0x32, 0x44, 0x5a, 0xa2, 0x2d, 0xaf,
        0x96, 0xd6, 0xeb, 0xba, 0xe3, 0x2c, 0xe9, 0xea, 0xda, 0x2c, 0xaa, 0x13,
        0xed, 0xb3, 0xee, 0x51, 0xad, 0x4b, 0x70, 0x63, 0x6c, 0xae, 0x3f, 0x9e,
        0xbf, 0x1e, 0xfa, 0x80, 0xce, 0xff, 0x8d, 0x99, 0xaf, 0x5d, 0x20, 0xc5,
        0xff, 0x3d, 0xdb, 0x6a, 0x07, 0x71, 0x0e, 0x74, 0xed, 0x56, 0x35, 0x29,
        0x31, 0x38, 0xae, 0x3d, 0x27, 0x1d, 0xb5, 0x59, 0xd3, 0x85, 0x77, 0xe2,
        0xd8, 0x98, 0x0c, 0xda, 0x5c, 0x6f, 0x34, 0x9c, 0xa5, 0xb7, 0x4b, 0x7f,
        0xf9, 0x85, 0xdc, 0x19, 0xfb, 0xef, 0x8a, 0xf7, 0x0e, 0xac, 0x62, 0xe3,
        0x0b, 0x21, 0xe4, 0xe2, 0x0a, 0xa0, 0x76, 0xb6, 0x18, 0x17, 0x73, 0xdf,
        0x9a, 0xd3, 0x9d, 0x07, 0x3d, 0x1b, 0x94, 0xff, 0x3e, 0x1f, 0xde, 0xbe,
        0xaa, 0x51, 0xf0, 0x7e, 0x48, 0xdd, 0x69, 0x1d, 0xaf, 0x44, 0xaf, 0xe5,
        0x12, 0xf5, 0x63, 0xee, 0x6b, 0x23, 0x37, 0xaa, 0x08, 0xf4, 0x94, 0x77,
        0x5e, 0x08, 0xcb, 0xd9, 0xe0, 0x5b, 0x47, 0xfd, 0xc9, 0xa6, 0x49, 0x0a,
        0xfd, 0x6f, 0x94, 0xcd, 0xb9, 0x28, 0x9f, 0x19, 0x5c, 0xe2, 0x1e, 0xb7,
        0x0f, 0x3a, 0x91, 0x30, 0x30, 0x64, 0x94, 0x0c, 0xbc, 0xa1, 0x3c, 0xfd,
        0xe7, 0x07, 0x98, 0x9a, 0x15, 0xcd, 0xc8, 0x7f, 0xf8, 0x97, 0xa0, 0xa5,
        0x08, 0x19, 0xab, 0xa5, 0xd8, 0x3a, 0xaf, 0x92, 0xec, 0x42, 0x02, 0x26,
        0x10, 0xf3, 0x7c, 0x6a, 0xde, 0x79, 0x2f, 0x82, 0xb2, 0x70, 0x39, 0x16,
        0xde, 0xf6, 0x0f, 0xd5, 0xbc, 0x56, 0x3a, 0x30, 0xfc, 0xb9, 0x23, 0x75,
        0x1a, 0x2c, 0xf0, 0xe9, 0xbd, 0x5e, 0x19, 0xc2, 0xd0, 0xd7, 0x20, 0x9a,
        0xd3, 0xe7, 0x9e, 0xa4, 0x32, 0x5b, 0x53, 0x17, 0xd5, 0x8f, 0x4d, 0x30,
        0x3d, 0xe5, 0x0b, 0x8f, 0xd4, 0xeb, 0x4a, 0xb7, 0x8e, 0x2a, 0xd6, 0xfc,
        0x2f, 0x82, 0x7d, 0x74, 0xd7, 0xa7, 0xb7, 0x4c, 0x25, 0x2e, 0x12, 0xcb,
        0xbc, 0x2b, 0xc9, 0x60, 0x40, 0x9c, 0x92, 0x6c, 0xcc, 0x1c, 0xd4, 0x0a,
        0xd0, 0xc8, 0x80, 0xa3, 0x6a, 0x1b, 0x9c, 0x4d, 0xe3, 0x7b, 0x7d, 0xd3,
        0x7c, 0xfc, 0x31, 0xeb, 0xd5, 0xe1, 0x6e, 0x1b, 0x95, 0xe3, 0xd9, 0x95,
        0xb6, 0x60, 0x39, 0x34, 0x61, 0x0b, 0xa8, 0x63, 0xa0, 0xf7, 0x4a, 0xac,
        0x38, 0x38, 0x6e, 0x26, 0x5e, 0x1e, 0x55, 0x8f, 0xab, 0xc0, 0xa0, 0xdb,
        0x87, 0x37, 0x55, 0x97, 0x55, 0x05, 0x4f, 0x93, 0x8a, 0xcb, 0xae, 0xa9,
        0x78, 0x22, 0x32, 0x45, 0x56, 0x19, 0x89, 0x00, 0xaf, 0x38, 0xe7, 0x23,
        0x68, 0xfc, 0xde, 0x61, 0xe4, 0xb4, 0xca, 0xdb, 0xbd, 0xff, 0xe7, 0x46,
        0xab, 0x3b, 0x0f, 0x67, 0xb2, 0x51, 0x31, 0x89, 0xab, 0xb5, 0x1f, 0x5a,
        0xc2, 0x46, 0x62, 0xc7, 0x18, 0x59, 0x77, 0xf2, 0xeb, 0x85, 0x5d, 0xd3,
        0x60, 0xd6, 0x69, 0x90, 0x17, 0x4d, 0x52, 0x46, 0xab, 0xd0, 0xfc, 0xf3,
        0xcc, 0x26, 0xe8, 0x9c, 0x74, 0xe2, 0x47, 0xf6, 0x13, 0x03, 0xf1, 0xf6,
        0x6f, 0x55, 0xa2, 0x69, 0x36, 0xbc, 0xfc, 0xc6, 0x16, 0xfa, 0x19, 0x50,
        0x9e, 0x15, 0x56, 0x6b, 0x89, 0x7f, 0xef, 0x9e, 0x20, 0x8c, 0xce, 0x51,
        0x6c, 0x2e, 0xd8, 0xbb, 0x6d, 0x7c, 0xb8, 0x1e, 0xa1, 0xfc, 0xbe, 0x3e,
        0x11, 0x40, 0x67, 0x25, 0x8c, 0x21, 0xdf, 0x75, 0x49, 0x6a, 0xe6, 0xf8,
        0x54, 0x20, 0xb6, 0x4e, 0xbc, 0x0f, 0x8c, 0x04, 0x0b, 0x71, 0xe8, 0x16,
        0xbc, 0x10, 0x6f, 0xad, 0x98, 0xa9, 0x3d, 0xdf, 0x22, 0x29, 0xbe, 0x3e,
        0xa5, 0xa7, 0xdb, 0x7a, 0x3a, 0x31, 0x50, 0xb0, 0xbe, 0x90, 0x3d, 0xc1,
        0xc3, 0x8c, 0xef, 0xaf, 0x42, 0xed, 0xcc, 0x76, 0xe9, 0x53, 0xb7, 0x3b,
        0x33, 0x90, 0xb0, 0xac, 0x65, 0x52, 0x41, 0x73, 0x95, 0xfe, 0x8f, 0x19,
        0x50, 0xcf, 0x8e, 0x5b, 0x5b, 0x76, 0x49, 0x95, 0x14, 0xe5, 0x13, 0xd9,
        0xf2, 0x2e, 0xbf, 0x2a, 0xb8, 0x19, 0x02, 0x0f, 0x44, 0x6b, 0xad, 0x6f,
        0x0b, 0xf9, 0xa8, 0xbb, 0x62, 0x35, 0x70, 0x2f, 0x56, 0x90, 0xa5, 0xc5,
        0x7b, 0x64, 0x56, 0x3f, 0xc2, 0x95, 0x3d, 0x4e, 0x9b, 0x96, 0x28, 0x52,
        0x5f, 0x2e, 0xd7, 0x92, 0xef, 0x03, 0x6f, 0x57, 0xe4, 0x6c, 0x2e, 0xe0,
        0x77, 0x54, 0x23, 0x6b, 0x72, 0x24, 0x85, 0x77, 0xb3, 0x1e, 0xc5, 0xac,
        0xac, 0xe3, 0x70, 0x8e, 0x0b, 0xe6, 0xb2, 0x14, 0x17, 0x22, 0x56, 0xe9,
        0xb1, 0x6e, 0x81, 0xa9, 0xca, 0xee, 0xa1, 0x25, 0x94, 0x6d, 0xea, 0x76,
        0xd0, 0xef, 0x39, 0x87, 0xc5, 0xe1, 0x85, 0x65, 0x91, 0x93, 0x29, 0x2f,
        0xb4, 0x31, 0x95, 0xc6, 0x56, 0xc0, 0x56, 0xaf, 0xd5, 0x6f, 0x84, 0x9c,
        0x3c, 0x3c, 0x23, 0x70, 0x5e, 0x37, 0x36, 0x97, 0x1f, 0x4e, 0xd6, 0xa9,
        0xf0, 0x81, 0x24, 0xc7, 0x54, 0x50, 0x23, 0x19, 0x9b, 0xe9, 0xdc, 0x6f,
        0x9a, 0x92, 0x42, 0xeb, 0xb3, 0x0f, 0x30, 0x69, 0xc0, 0x99, 0xec, 0x1e,
        0xe8, 0x39, 0xff, 0x1e, 0x64, 0x30, 0x5c, 0x3b, 0xe2, 0x01, 0xbf, 0x8f,
        0xe0, 0x4b, 0x82, 0xb4, 0x2e, 0xc1, 0x2c, 0xa4, 0x0d, 0x48, 0x02, 0x25,
        0x2a, 0x59, 0x1d, 0x3d, 0xf0, 0x91, 0xab, 0xce, 0x7f, 0x0e, 0x98, 0x4d,
        0x7e, 0x93, 0x5e, 0x0b, 0xd5, 0xfe, 0xf9, 0xf4, 0xb6, 0xb2, 0xfc, 0xbb,
        0x93, 0x3e, 0xd0, 0xde, 0x37, 0xad, 0xc7, 0x96, 0x5c, 0x74, 0xa0, 0x59,
        0xd6, 0xde, 0x09, 0xe1, 0x57, 0x26, 0x1f, 0x5b, 0xdf, 0xaa, 0x80, 0x5d,
        0x5c, 0xd0, 0x7a, 0xc9, 0xa2, 0x45, 0xfc, 0x19, 0x67, 0xb7, 0x2f, 0x95,
        0x4d, 0x2f, 0x43, 0x22, 0xb8, 0xa5, 0xb3, 0x74, 0x1f, 0x31, 0x6e, 0x5f,
        0xe2, 0x18, 0xfb, 0x95, 0x2b, 0x14, 0x5f, 0x6a, 0xd0, 0xf6, 0xbd, 0x67,
        0xc4, 0x94, 0xe1, 0x68, 0x1c, 0x34, 0xce, 0x6f, 0x13, 0xf0, 0xd0, 0x71,
        0x26, 0xf9, 0xaa, 0x7a, 0xc4, 0x33, 0xbb, 0x9f, 0x41, 0x4a, 0xf1, 0xe8,
        0xe3, 0xad, 0xe9, 0x87, 0x1d, 0x24, 0x95, 0x27, 0x68, 0x92, 0xe4, 0xa0,
        0xd6, 0x2c, 0x02, 0xfe, 0xb5, 0xa7, 0xf1, 0x9a, 0xc0, 0xbe, 0xaa, 0x82,
        0x19, 0xe1, 0xad, 0x74, 0xc6, 0xbf, 0xbe, 0x18, 0x52, 0x82, 0x9f, 0x5e,
        0x41, 0xc0, 0x89, 0xed, 0xf3, 0x2a, 0x00, 0x88, 0xcb, 0x37, 0x3b, 0xab,
        0x70, 0xac, 0x50, 0x48, 0x7f, 0x98, 0x38, 0xe8, 0x9a, 0x44, 0xce, 0x3e,
        0x45, 0x59, 0x9b, 0x40, 0xb9, 0x59, 0x58, 0xbc, 0x52, 0x7b, 0x34, 0xe6,
        0x24, 0x51, 0xa7, 0xbc, 0x65, 0xea, 0x03, 0xc1, 0xa4, 0x7d, 0x5d, 0x25,
        0x67, 0xea, 0x9f, 0x55, 0xd8, 0x2d, 0xbb, 0x2a, 0x05, 0x77, 0x54, 0x3a,
        0x34, 0x97, 0x40, 0xb5, 0x41, 0xdf, 0x51, 0xd9, 0xb2, 0x84, 0x61, 0x8b,
        0x17, 0xdd, 0xa5, 0xd5, 0x55, 0xb5, 0x6b, 0x61, 0x6e, 0xbc, 0x36, 0x33,
        0x3e, 0xfe, 0x0d, 0xa8, 0xce, 0x5f, 0xc2, 0x2c, 0x7e, 0x6c, 0xfc, 0x97,
        0xda, 0x2a, 0xb7, 0xf5, 0x06, 0xe1, 0x18, 0x3a, 0xec, 0xae, 0xe9, 0xea,
        0xc3, 0xbd, 0x9d, 0x34, 0xeb, 0x99, 0xee, 0xee, 0x4d, 0xcc, 0x61, 0xda,
        0x5e, 0x06, 0xf9, 0xeb, 0xdc, 0x94, 0x8c, 0x51, 0x59, 0xd4, 0xfd, 0x2a,
        0x5a, 0x57, 0x72, 0x83, 0x4a, 0xc4, 0x49, 0x48, 0x3d, 0x2d, 0x00, 0x15,
        0x66, 0x0d, 0x25, 0xf4, 0x3d, 0x7a, 0xf6, 0xd7, 0x0b, 0xae, 0xb2, 0x58,
        0x54, 0xeb, 0x25, 0x76, 0x5e, 0xb6, 0xd7, 0x3d, 0x16, 0x94, 0xbe, 0x22,
        0x8c, 0x4f, 0x43, 0x81, 0x51, 0x94, 0x9c, 0xc9, 0x90, 0x47, 0xfd, 0x65,
        0xdd, 0x07, 0x2d, 0x53, 0x0a, 0xb3, 0xf4, 0xc1, 0x40, 0xa7, 0x29, 0x7a,
        0xbf, 0x29, 0x6c, 0x87, 0x76, 0x02, 0x6d, 0x4a, 0x6d, 0x41, 0x14, 0xd1,
        0x5b, 0x29, 0xe8, 0x15, 0x4e, 0x6c, 0x07, 0x22, 0x51, 0x41, 0x70, 0x98,
        0xb0, 0xa8, 0x70, 0xae, 0xc8, 0x60, 0x03, 0xc0, 0xff, 0xe9, 0x13, 0x63,
        0xf2, 0xfa, 0x63, 0xb2, 0x98, 0x73, 0x3b, 0x49, 0xca, 0x03, 0xd4, 0xa6,
        0x14, 0xc7, 0x2e, 0x6a, 0x17, 0x7b, 0x81, 0xa7, 0x38, 0x94, 0x48, 0x61,
        0xf9, 0x2b, 0x99, 0x92, 0x3b, 0x9c, 0xe0, 0xcf, 0x08, 0x0f, 0x00, 0x8d,
        0xf7, 0x90, 0x21, 0xd0, 0x92, 0xc9, 0x70, 0x5f, 0x43, 0x1a, 0x83, 0xe0,
        0xa8, 0x3c, 0x5c, 0xb0, 0x17, 0x7f, 0x56, 0xdf, 0x9e, 0x89, 0x02, 0x26,
        0xf7, 0x77, 0xe9, 0x42, 0xac, 0x5d, 0xc1, 0xb9, 0x87, 0x9e, 0x93, 0xab,
        0x87, 0xad, 0x09, 0x53, 0x02, 0xe1, 0xa1, 0x4e, 0x5e, 0x7d, 0xa1, 0x2e,
        0x2c, 0x7d, 0x2a, 0x05, 0x57, 0x52, 0x7f, 0x68, 0xd4, 0x5d, 0xac, 0x52,
        0xc7, 0x2b, 0x84, 0x55, 0xfa, 0x2b, 0xe5, 0x5e, 0x53, 0x98, 0x50, 0x75,
        0x58, 0x55, 0x1a, 0x60, 0x76, 0xed, 0x26, 0x29, 0x1f, 0x63, 0x40, 0x8b,
        0x4b, 0xda, 0xdb, 0xee, 0x07, 0x99, 0x2a, 0xd9, 0x7a, 0xb0, 0x87, 0x27,
        0xf9, 0xd0, 0x38, 0x9d, 0x67, 0xb3, 0x39, 0xbd, 0x41, 0x51, 0x83, 0x2d,
        0x68, 0xd8, 0xa7, 0x15, 0x0c, 0x93, 0xc6, 0xfe, 0xcd, 0x9a, 0x9b, 0x57,
        0xd3, 0x6d, 0x1f, 0x4b, 0xc1, 0xf5, 0x43, 0x6c, 0xc3, 0x8d, 0x65, 0xa7,
        0x82, 0x3f, 0xe2, 0xb0, 0x18, 0xfe, 0x63, 0xa6, 0xe6, 0xee, 0xaa, 0xb1,
        0x26, 0x49, 0x46, 0x8e, 0xd2, 0x89, 0x2b, 0x21, 0x18, 0x19, 0x31, 0xa5,
        0x58, 0x7f, 0xeb, 0x0d, 0x08, 0xbd, 0x26, 0x94, 0x99, 0xb7, 0x10, 0xb3,
        0xa5, 0xe7, 0x99, 0x9a, 0xd1, 0x5c, 0x6c, 0xec, 0x34, 0x07, 0xe4, 0xcf,
        0x65, 0x88, 0xe2, 0x1b, 0xf7, 0xa2, 0xfb, 0x9d, 0xee, 0xb8, 0x49, 0x3c,
        0xd4, 0x3b, 0x37, 0xc2, 0x7d, 0x1b, 0x29, 0xf5, 0x16, 0x87, 0xde, 0xcd,
        0xb0, 0xc0, 0x12, 0x12, 0x71, 0xfc, 0xe3, 0xb6, 0x53, 0x3d, 0x3b, 0x5a,
        0x18, 0x76, 0xee, 0x0e, 0x1a, 0x8c, 0x77, 0xc6, 0xf2, 0x84, 0xe3, 0x50,
        0xdf, 0x50, 0x9a, 0x2e, 0x92, 0x2d, 0x4c, 0x2f, 0xed, 0x70, 0x99, 0x62,
        0xf5, 0xf7, 0x43, 0x29, 0x89, 0xab, 0xdc, 0xe6, 0xae, 0xcd, 0xae, 0x73,
        0xce, 0x10, 0xa3, 0x48, 0xe7, 0x87, 0x40, 0x49, 0xe8, 0x07, 0x9e, 0x24,
        0x1c, 0xc8, 0x7d, 0xb2, 0xe2, 0x06, 0x6f, 0x17, 0x3f, 0x7d, 0xaa, 0x53,
        0x07, 0xd9, 0xb7, 0x82, 0xc5, 0x52, 0x98, 0x48, 0xfb, 0xed, 0x70, 0x8d,
        0xde, 0xf5, 0xbd, 0x7d, 0x83, 0x41, 0x8c, 0xcc, 0x77, 0xb9, 0x99, 0x2f,
        0x9e, 0x5b, 0xad, 0x40, 0x81, 0x75, 0xdd, 0x79, 0x74, 0xac, 0x12, 0xee,
        0x26, 0x3d, 0xfc, 0xf2, 0x5e, 0xff, 0x27, 0xe6, 0xbc, 0xf1, 0xc6, 0xc1,
        0xde, 0xfb, 0xf5, 0x6b, 0xe7, 0x83, 0x18, 0xab, 0xcd, 0xc6, 0x55, 0xc5,
        0xac, 0x68, 0x37, 0x8a, 0x16, 0xcc, 0x43, 0x24, 0xc9, 0x63, 0x4d, 0xfc,
        0x52, 0xa3, 0xe3, 0x77, 0xa3, 0x71, 0xcf, 0xcb, 0x85, 0xaa, 0x2e, 0xf5,
        0x3e, 0xdd, 0x67, 0x6b, 0x06, 0x30, 0x94, 0x1a, 0x46, 0x14, 0xcb, 0x7f,
        0x35, 0x22, 0x43, 0x8c, 0xaf, 0x89, 0x9d, 0x55, 0xa6, 0x56, 0xd5, 0xa5,
        0xa7, 0xd3, 0x84, 0x24, 0xa9, 0x70, 0x0b, 0x80, 0xe0, 0x96, 0x4f, 0xd9,
        0xbc, 0x82, 0xad, 0x89, 0x05, 0x2b, 0x1e, 0x8f, 0xb6, 0xc1, 0x02, 0xc3,
        0xdf, 0xf7, 0x6a, 0x7f, 0xe9, 0xf0, 0xf3, 0x4c, 0x59, 0x38, 0x6e, 0x77,
        0x88, 0x03, 0xf8, 0x0d, 0xad, 0xb9, 0x94, 0xb4, 0xd5, 0x34, 0xd5, 0xcc,
        0x51, 0xcf, 0x23, 0x24, 0x37, 0xc6, 0xb0, 0x6e, 0xc2, 0xb4, 0xdf, 0xde,
        0xbb, 0x13, 0x98, 0x52, 0x75, 0xe1, 0x0e, 0xc5, 0x45, 0x3f, 0x42, 0xfe,
        0xbd, 0xc9, 0xb0, 0xdf, 0xa3, 0xa3, 0xda, 0x86, 0xd2, 0xc9, 0x53, 0xdb,
        0x36, 0x15, 0xfb, 0x11
    ]),
    "Lime Green": new Uint8Array([
        0x27, 0x8f, 0x37, 0x28, 0xea, 0x88, 0xc1, 0xf9, 0xd9, 0xe2, 0x4f, 0xfc,
        0xbb, 0x1d, 0x40, 0x73, 0xe2, 0x23, 0xb8, 0xb5, 0xe6, 0x4d, 0x56, 0x45,
        0x18, 0xf3, 0x1c, 0xbd, 0x0b, 0x8c, 0x2d, 0xa0, 0x0c, 0x49, 0x6f, 0xf4,
        0x3f, 0x5d, 0x6a, 0x19, 0x18, 0x9e, 0x93, 0xbc, 0xfe, 0xfd, 0xaa, 0x6b,
        0x78, 0x6e, 0x78, 0x0b, 0xeb, 0x10, 0x27, 0xc1, 0x27, 0xb1, 0x10, 0xcc,
        0x85, 0x93, 0x74, 0xe3, 0x22, 0x29, 0xe0, 0x86, 0x1e, 0x49, 0x56, 0x67,
        0x39, 0xbb, 0x71, 0x19, 0xb2, 0x04, 0x6c, 0xda, 0x3e, 0xde, 0xdb, 0xd8,
        0x19, 0x83, 0xdb, 0x5a, 0x1c, 0x08, 0xdf, 0xb3, 0x79, 0xb9, 0x67, 0xd1,
        0x56, 0x6d, 0x1e, 0x56, 0x54, 0x34, 0x79, 0x95, 0x55, 0x77, 0x43, 0x25,
        0xf8, 0xd7, 0x08, 0x4f, 0xad, 0xd4, 0x57, 0x26, 0x39, 0x1c, 0x6c, 0x2e,
        0xb5, 0x3c, 0xd3, 0xac, 0x6a, 0xcc, 0xd5, 0x94, 0x50, 0x27, 0xee, 0x3b,
        0xdd, 0x99, 0x56, 0xa8, 0x13, 0x4e, 0x64, 0x10, 0x46, 0xdb, 0x06, 0x2e,
        0x8a, 0x0e, 0x95, 0xc2, 0x9b, 0x23, 0x07, 0xae, 0xcf, 0x2f, 0x61, 0xd6,
        0x61, 0x79, 0x31, 0xcb, 0xea, 0x68, 0x95, 0x1c, 0xb3, 0x48, 0x10, 0x7e,
        0x16, 0x11, 0xb6, 0xae, 0xba, 0x4e, 0x8f, 0x49, 0xcd, 0x4a, 0x94, 0x3f,
        0xb3, 0x15, 0x5c, 0x28, 0x3a, 0x5a, 0xcf, 0x3b, 0x58, 0x12, 0x7b, 0x92,
        0xe2, 0x05, 0xec, 0x42, 0x45, 0xbd, 0x83, 0x63, 0xd9, 0xe6, 0xee, 0xa2,
        0x13, 0xd7, 0x0b, 0xd9, 0x83, 0x90, 0xea, 0x00, 0x90, 0x66, 0xc0, 0x93,
        0xbb, 0x8d, 0x8b, 0xd3, 0xdc, 0x20, 0x79, 0x53, 0xb6, 0xc5, 0xe7, 0xb5,
        0x16, 0x35, 0x96, 0x86, 0xd5, 0xae, 0x10, 0xe1, 0x94, 0x67, 0xd1, 0x54,
        0xeb, 0xab, 0x22, 0xd8, 0x4b, 0x7e, 0x20, 0x98, 0x2e, 0xa0, 0xe8, 0x76,
        0xca, 0xdd, 0x5d, 0x90, 0x24, 0xc9, 0x5b, 0x45, 0x32, 0x40, 0x8d, 0x23,
        0x0a, 0xb6, 0x85, 0x07, 0xf6, 0x5d, 0x0f, 0x9d, 0xda, 0x72, 0xaa, 0x2d,
        0x38, 0x5f, 0x00, 0x62, 0xbf, 0x42, 0xb3, 0xf3, 0x0a, 0x2a, 0x1e, 0x49,
        0x75, 0xef, 0xd0, 0x3b, 0x0e, 0x6e, 0xc5, 0x91, 0x0e, 0xdc, 0xf1, 0x2d,
        0x7c, 0x25, 0x38, 0xf1, 0xad, 0xee, 0xfb, 0xc7, 0xb5, 0x00, 0x61, 0x1b,
        0x07, 0xd5, 0x88, 0x8e, 0xd0, 0xa2, 0x0a, 0x5c, 0x18, 0x2f, 0x29, 0x7f,
        0x62, 0x96, 0x81, 0x63, 0x08, 0x6b, 0xd0, 0x83, 0x06, 0x49, 0xbd, 0xef,
        0x21, 0xde, 0x75, 0xe1, 0xfa, 0x15, 0x98, 0xa9, 0x52, 0xda, 0x26, 0x6f,
        0x79, 0x7b, 0x08, 0xa2, 0x7a, 0xe8, 0x8d, 0xac, 0x18, 0xea, 0x48, 0xde,
        0x5c, 0x1e, 0x9d, 0xda, 0x10, 0x30, 0x7e, 0xc1, 0x92, 0x5d, 0xf0, 0xea,
        0x2d, 0xf2, 0xa2, 0xbb, 0x86, 0x8f, 0xed, 0x87, 0x89, 0x64, 0x46, 0x96,
        0xc8, 0x99, 0x2a, 0x2d, 0x25, 0x4a, 0x8e, 0x6c, 0xe7, 0x64, 0x8e, 0x59,
        0xcb, 0x86, 0x55, 0x1d, 0x7a, 0xc0, 0x78, 0xe5, 0xa8, 0xdc, 0x0a, 0x10,
        0xff, 0x56, 0xfb, 0xcc, 0x82, 0x63, 0x17, 0xa8, 0x8f, 0x24, 0x03, 0xe3,
        0xc3, 0x78, 0xfe, 0x4b, 0x79, 0xe7, 0x7f, 0xc5, 0xcb, 0xb2, 0xb8, 0x37,
        0xf3, 0x71, 0x8f, 0x2c, 0xe0, 0x4a, 0x48, 0x4e, 0x25, 0x58, 0xa9, 0x81,
        0xb4, 0x17, 0x0c, 0xc9, 0x07, 0xfc, 0xc4, 0x27, 0xac, 0xc7, 0x00, 0xb7,
        0x3c, 0x14, 0xaf, 0xb7, 0xb5, 0xea, 0x02, 0xf6, 0x2f, 0x9c, 0x6f, 0x3a,
        0x23, 0x0c, 0xdb, 0x31, 0x31, 0x66, 0xd9, 0xbc, 0x11, 0x6e, 0xf3, 0xac,
        0xb7, 0xb2, 0x4b, 0x44, 0xbb, 0x4a, 0x24, 0xfd, 0xb9, 0xc5, 0x3e, 0x22,
        0xbf, 0x77, 0x27, 0x54, 0xa0, 0x65, 0x1a, 0x8c, 0x52, 0x3d, 0x4f, 0xa4,
        0x4e, 0xc7, 0x2f, 0xc5, 0xce, 0x6a, 0x2c, 0xe3, 0x63, 0x25, 0x17, 0xe6,
        0x68, 0x62, 0x06, 0x46, 0x7e, 0x80, 0x12, 0xcb, 0xf9, 0xf2, 0x31, 0x36,
        0x92, 0x30, 0x60, 0xde, 0xc1, 0x96, 0x30, 0x59, 0xf2, 0xb3, 0xb5, 0x7d,
        0x44, 0x19, 0x0b, 0x31, 0x8d, 0xf8, 0x9c, 0x5f, 0xc9, 0x10, 0x32, 0x4d,
        0x4a, 0x42, 0x03, 0xd2, 0x5d, 0xb8, 0x10, 0xda, 0xac, 0xda, 0xd5, 0x83,
        0xbe, 0xe0, 0x16, 0xcd, 0x4c, 0x5c, 0x27, 0xea, 0x3d, 0xd4, 0x65, 0x38,
        0x06, 0x6a, 0x75, 0x3d, 0x20, 0x1f, 0x02, 0xcd, 0x71, 0x93, 0x37, 0xc1,
        0x78, 0xbd, 0x0c, 0x16, 0x8b, 0xf8, 0x57, 0x98, 0x09, 0x68, 0x4d, 0xbf,
        0x78, 0x79, 0x72, 0xaf, 0xb1, 0x71, 0x74, 0x8d, 0x16, 0x09, 0x5a, 0x0b,
        0x44, 0x45, 0xb0, 0x68, 0xae, 0x0d, 0xc5, 0x58, 0x9d, 0x3d, 0x9e, 0x8f,
        0x4d, 0x1e, 0x99, 0x72, 0xd0, 0x14, 0xb2, 0x07, 0x30, 0x77, 0x09, 0x6b,
        0x01, 0x22, 0x1d, 0x47, 0x55, 0xbc, 0x56, 0x73, 0xa2, 0x75, 0x24, 0x5d,
        0x36, 0xb3, 0xde, 0x5a, 0xd0, 0x45, 0xa3, 0x20, 0x6a, 0xa7, 0x17, 0xe7,
        0x51, 0x65, 0xc4, 0xd5, 0xb2, 0xb3, 0x74, 0xc6, 0x2b, 0x02, 0xe4, 0xf4,
        0x5c, 0x5e, 0x8d, 0x9c, 0xec, 0x05, 0xb4, 0x54, 0xd5, 0xc8, 0xe0, 0xb1,
        0xe8, 0x0b, 0x23, 0xea, 0x91, 0xc0, 0xe8, 0x96, 0xd7, 0x6b, 0x88, 0xea,
        0x0b, 0x9e, 0x94, 0x4d, 0xcc, 0x1c, 0x31, 0x0f, 0xbf, 0xe5, 0x9f, 0x6d,
        0x0f, 0x60, 0xa3, 0x35, 0xae, 0x58, 0xbb, 0x7e, 0xb1, 0x54, 0xbb, 0x0f,
        0x19, 0x2a, 0x25, 0xae, 0xf1, 0x99, 0x4f, 0x8e, 0x1b, 0x30, 0x21, 0x71,
        0xc8, 0x3c, 0x61, 0x4a, 0xdf, 0x3e, 0xbc, 0x75, 0x50, 0xc1, 0xa1, 0xf7,
        0x73, 0xf3, 0x56, 0x0b, 0xe5, 0x24, 0x9b, 0xe1, 0x61, 0xd4, 0x16, 0x13,
        0x96, 0xa8, 0xfd, 0xe0, 0x27, 0x6a, 0x1f, 0x8d, 0x22, 0xb4, 0x15, 0xa0,
        0x3c, 0xbf, 0x60, 0x42, 0x39, 0xc8, 0xd5, 0xb3, 0x08, 0x25, 0x9b, 0xa4,
        0x14, 0x81, 0x7d, 0x40, 0x3a, 0xef, 0x32, 0xfe, 0x70, 0x99, 0x7d, 0x0b,
        0xdf, 0xf7, 0xd4, 0xb2, 0x39, 0xe2, 0xbf, 0x80, 0x6f, 0x43, 0xa8, 0x3e,
        0xa7, 0x19, 0xb5, 0xbd, 0xd8, 0xf7, 0x59, 0xa7, 0xbf, 0x8b, 0xfa, 0xa0,
        0x7d, 0x40, 0x15, 0xfc, 0x0c, 0x2f, 0x10, 0x5d, 0xf4, 0x4d, 0xf2, 0xe1,
        0x5d, 0xa0, 0xbe, 0xb2, 0x7c, 0x21, 0xbb, 0x6f, 0x27, 0xc0, 0xca, 0xb6,
        0xc0, 0x6d, 0xf9, 0x0a, 0x07, 0x9f, 0xec, 0x45, 0x09, 0xc6, 0x9e, 0xcc,
        0x17, 0xbf, 0xc4, 0xc5, 0x8a, 0x7f, 0x23, 0x10, 0xef, 0x19, 0x0b, 0xd9,
        0xd9, 0x4e, 0xb9, 0x99, 0xfb, 0x70, 0x20, 0x2c, 0xe9, 0xf1, 0xc6, 0x6e,
        0xd1, 0x92, 0x2a, 0x0b, 0x7b, 0x76, 0xa4, 0x63, 0xbe, 0xb5, 0xe3, 0x57,
        0x8b, 0xf4, 0x3b, 0x31, 0x2b, 0x16, 0x93, 0xc9, 0xca, 0x56, 0x5a, 0x94,
        0x6b, 0xf6, 0x86, 0x13, 0x65, 0x7f, 0xf4, 0x3a, 0xb6, 0x58, 0x95, 0xff,
        0x4f, 0xad, 0xfd, 0xed, 0xd0, 0x67, 0xf3, 0xe0, 0xb3, 0xfb, 0x2b, 0xa0,
        0x60, 0x68, 0x4d, 0x00, 0x87, 0xd2, 0xeb, 0xb6, 0xce, 0xe8, 0x0c, 0x16,
        0x17, 0x15, 0x19, 0x8c, 0x19, 0x6d, 0x27, 0x97, 0xcd, 0xa2, 0x57, 0x3c,
        0xde, 0x39, 0x69, 0xee, 0x57, 0xea, 0xdb, 0x85, 0xbf, 0x82, 0x81, 0xd0,
        0x7c, 0x03, 0x28, 0x8e, 0xcf, 0x40, 0xad, 0x34, 0x53, 0x87, 0x71, 0xb8,
        0x07, 0x21, 0x21, 0xd2, 0x7d, 0x0d, 0x8d, 0xf4, 0x5c, 0xe5, 0x00, 0x5d,
        0x22, 0x1f, 0xce, 0xb9, 0x44, 0xa4, 0x4c, 0x9e, 0x37, 0x4e, 0x21, 0x70,
        0xf2, 0xd8, 0xf8, 0xca, 0xa2, 0xbf, 0xf5, 0x9d, 0xb7, 0x85, 0x48, 0x8c,
        0xba, 0xb6, 0x2d, 0x66, 0x14, 0x77, 0x55, 0xff, 0x27, 0x04, 0xaf, 0x4d,
        0x19, 0xe0, 0xd2, 0xde, 0xcf, 0xb0, 0xa9, 0xad, 0xdc, 0x83, 0xb0, 0x6b,
        0x7c, 0xa0, 0x06, 0x5f, 0x80, 0x2e, 0xcc, 0x0a, 0x65, 0xcf, 0x95, 0x96,
        0x81, 0x3b, 0x83, 0x20, 0xd7, 0x78, 0xc5, 0x7a, 0xd0, 0xa6, 0x8f, 0x9f,
        0x15, 0x4a, 0x39, 0x34, 0x46, 0xd0, 0x79, 0x9c, 0xd9, 0x4f, 0x6e, 0xf1,
        0x3c, 0x5d, 0xbf, 0x9a, 0x90, 0x50, 0xda, 0xb7, 0xf2, 0x33, 0x7f, 0x4c,
        0x39, 0xc9, 0xdf, 0xaf, 0x25, 0x34, 0xfb, 0xf5, 0xcc, 0x0b, 0xce, 0x67,
        0xad, 0xe5, 0x3e, 0x80, 0xcb, 0xd9, 0x94, 0x6a, 0x6c, 0xcf, 0x68, 0x1f,
        0x79, 0xf6, 0x87, 0xae, 0xf5, 0xd6, 0x8f, 0x4d, 0xf3, 0x78, 0x9c, 0x35,
        0xf2, 0xa1, 0xb0, 0x05, 0x07, 0x7d, 0x66, 0x8d, 0x49, 0x0f, 0x39, 0xf0,
        0x67, 0x7e, 0x95, 0x2f, 0x76, 0x05, 0x2d, 0x0b, 0xc6, 0xd4, 0xf8, 0x13,
        0xc9, 0xbd, 0x55, 0x40, 0x00, 0xeb, 0xae, 0xe9, 0x9b, 0x91, 0x40, 0x6e,
        0xca, 0x56, 0x62, 0xfb, 0xd9, 0xdc, 0x56, 0x9a, 0x91, 0xdc, 0xa4, 0x5a,
        0xce, 0xc4, 0x88, 0xa6, 0x8b, 0x85, 0x8b, 0xc8, 0x87, 0x28, 0x3e, 0xa5,
        0x2f, 0x2c, 0xb6, 0xde, 0x76, 0x93, 0x3c, 0x38, 0xd2, 0x29, 0xc0, 0x86,
        0x79, 0xc6, 0x00, 0xe1, 0x83, 0xa4, 0xe2, 0x5c, 0x90, 0x48, 0xfb, 0x3a,
        0x97, 0x1a, 0x23, 0x7f, 0x68, 0x69, 0xe9, 0x31, 0x5a, 0xe4, 0x10, 0x23,
        0xc1, 0xec, 0xb3, 0x71, 0xd7, 0xc5, 0xee, 0xa0, 0xb4, 0x22, 0x6e, 0xf2,
        0xe6, 0x59, 0x2c, 0xc0, 0x48, 0x86, 0x2e, 0x5e, 0x63, 0xae, 0x69, 0xa0,
        0xee, 0x5e, 0x69, 0x71, 0x9f, 0x99, 0x4d, 0x73, 0xcc, 0x5d, 0x74, 0x6e,
        0xe2, 0x09, 0x8d, 0x8c, 0xd7, 0xfc, 0x93, 0x37, 0x93, 0xa5, 0x0d, 0x86,
        0x35, 0xea, 0xbe, 0xe4, 0x52, 0x3d, 0x70, 0x2e, 0xdd, 0xfa, 0x75, 0x87,
        0x7e, 0xb1, 0xa1, 0xd6, 0x26, 0x88, 0x02, 0x08, 0x5d, 0x4c, 0x60, 0x78,
        0x8c, 0x3c, 0x41, 0x0c, 0xa4, 0x45, 0xa1, 0x11, 0x8a, 0xbb, 0x78, 0x5b,
        0xc4, 0x65, 0x49, 0x69, 0xa0, 0xf8, 0x38, 0x30, 0x23, 0x19, 0x14, 0x62,
        0x97, 0x3a, 0x14, 0x49, 0x7a, 0xb9, 0x09, 0x05, 0xe5, 0x60, 0x65, 0xe2,
        0xde, 0xc0, 0xc9, 0x4e, 0xad, 0x23, 0x7d, 0xad, 0x1f, 0x13, 0x35, 0x93,
        0xbe, 0x54, 0x51, 0x3f, 0xa3, 0xe1, 0x82, 0x7c, 0xe1, 0xde, 0x94, 0x8d,
        0x9d, 0x86, 0x3f, 0x98, 0xeb, 0x97, 0xc8, 0xff, 0x8a, 0x20, 0xcc, 0x35,
        0x04, 0x7c, 0xd5, 0x25, 0x67, 0x27, 0xff, 0x2b, 0xc1, 0xd6, 0x8f, 0x7b,
        0x02, 0x9f, 0x6f, 0x72, 0xdb, 0x14, 0xc6, 0x9a, 0x31, 0x00, 0x3e, 0xef,
        0xce, 0xb1, 0xcc, 0x7a, 0x72, 0xd6, 0xb3, 0x35, 0x1f, 0x04, 0xf4, 0x91,
        0x86, 0xd5, 0x17, 0xb9, 0xe8, 0x20, 0x71, 0x60, 0x93, 0xee, 0xe8, 0xcf,
        0xa1, 0x73, 0x5a, 0x52, 0x68, 0x72, 0x0c, 0xef, 0xfc, 0x8e, 0x30, 0x4b,
        0x1b, 0xb6, 0xd6, 0xbf, 0xd4, 0xf6, 0xce, 0x0f, 0xe2, 0x7b, 0x1e, 0xff,
        0x1f, 0xdb, 0x01, 0xf4, 0xb4, 0xae, 0x53, 0x2d, 0x34, 0xd5, 0xc4, 0x66,
        0x29, 0x11, 0x2f, 0xb3, 0x3b, 0x41, 0x00, 0x15, 0x6d, 0xa0, 0xd7, 0xdd,
        0xa7, 0xc7, 0xc8, 0x96, 0x74, 0xb6, 0x91, 0x98, 0xac, 0x2b, 0x00, 0x05,
        0x71, 0x7e, 0x20, 0xc9, 0x41, 0x3b, 0xeb, 0x90, 0x99, 0xc6, 0xfb, 0xd4,
        0x3e, 0x41, 0x67, 0xd2, 0x97, 0x2f, 0x33, 0xc5, 0xf0, 0x0c, 0x0f, 0x50,
        0x80, 0xb3, 0xab, 0xff, 0xf0, 0xc8, 0x73, 0x64, 0xa3, 0x1c, 0x47, 0x72,
        0xa8, 0xff, 0xbe, 0xb9, 0x0e, 0x45, 0x68, 0x26, 0x2a, 0xef, 0x6e, 0x10,
        0xda, 0x9a, 0x10, 0x3d, 0x42, 0x60, 0xef, 0x17, 0x6c, 0xa9, 0xa0, 0x5a,
        0x64, 0xf2, 0x61, 0x9f, 0xa0, 0x29, 0x7a, 0x0b, 0x6f, 0xd1, 0x40, 0xfa,
        0x33, 0x39, 0x7f, 0x6c, 0xe3, 0x2e, 0xe4, 0xe6, 0xe2, 0x9c, 0xd2, 0xfe,
        0x45, 0x98, 0xee, 0xa4, 0xf5, 0x74, 0xc8, 0x30, 0x86, 0x35, 0x63, 0xc0,
        0x9a, 0x26, 0x6f, 0xae, 0xa6, 0xef, 0x33, 0x98, 0x6d, 0x8f, 0x76, 0x2c,
        0x63, 0x01, 0x99, 0xf4, 0x78, 0x39, 0x32, 0x03, 0x26, 0x71, 0xf0, 0xba,
        0xff, 0xec, 0xd0, 0x96, 0xb9, 0xba, 0x88, 0x4c, 0xdd, 0x3a, 0xf6, 0x94,
        0x21, 0x43, 0x4c, 0x44, 0x55, 0x26, 0x3d, 0xad, 0x77, 0x6a, 0x33, 0xfc,
        0x1e, 0xb9, 0xe0, 0x64, 0x9c, 0xb7, 0x8d, 0x54, 0xec, 0xf7, 0x7e, 0xe2,
        0xc6, 0xcb, 0x82, 0x04, 0x7a, 0x4c, 0x25, 0x22, 0x3b, 0x49, 0x96, 0xe0,
        0x4d, 0xf0, 0x4a, 0xfd, 0x6e, 0xde, 0x2c, 0xfb, 0xa0, 0xf2, 0x2b, 0xb5,
        0x87, 0xa6, 0xe1, 0xaf, 0x78, 0xcd, 0xf1, 0xd5, 0x60, 0xc9, 0x67, 0xdf,
        0x99, 0x53, 0x41, 0x5b, 0x27, 0xd6, 0xfb, 0x06, 0x89, 0x2b, 0x3f, 0xe1,
        0xe5, 0x42, 0xac, 0x3c, 0x30, 0x73, 0x5f, 0xf1, 0x70, 0x31, 0xf0, 0x52,
        0xb8, 0xa6, 0x35, 0xdd, 0xbe, 0xa4, 0x97, 0x0d, 0xdf, 0xde, 0x93, 0x9d,
        0xdf, 0x61, 0x15, 0xbc, 0x0f, 0x16, 0x37, 0xb2, 0xd6, 0x3e, 0x78, 0xcf,
        0x8b, 0xd6, 0x55, 0xb0, 0x95, 0xae, 0xd6, 0x62, 0xbd, 0x1f, 0x71, 0xc1,
        0x0c, 0x21, 0x7c, 0xa3, 0x0f, 0xb1, 0x93, 0x55, 0xdf, 0xf6, 0x43, 0x65,
        0xd2, 0x60, 0x2c, 0x46, 0xa1, 0x61, 0x4c, 0x3b, 0x4f, 0xe1, 0xde, 0x0f,
        0xa6, 0xe5, 0xe3, 0x86, 0xf5, 0x68, 0x18, 0x2f, 0xa0, 0x9d, 0xe5, 0x18,
        0x71, 0x20, 0xac, 0x1c, 0x7c, 0x5e, 0xf4, 0x13, 0xc9, 0x02, 0x0a, 0x1b,
        0x17, 0xef, 0x17, 0x02, 0xbf, 0x49, 0x5d, 0x6f, 0xd2, 0x3c, 0xd0, 0x53,
        0x52, 0xb5, 0xf5, 0xa0, 0x14, 0x4a, 0x66, 0x16, 0x4a, 0xeb, 0x3f, 0xc6,
        0xae, 0x03, 0x4e, 0xba, 0x01, 0x4c, 0xac, 0x02, 0xb0, 0x71, 0x64, 0x18,
        0xd9, 0x1d, 0x16, 0x83, 0xf2, 0xc5, 0xb5, 0x3d, 0x37, 0x19, 0xce, 0xe0,
        0x9e, 0x95, 0x78, 0x8e, 0x1f, 0xac, 0xf7, 0x8d, 0x44, 0xc8, 0x5e, 0x9a,
        0xc9, 0x28, 0x4f, 0xf8, 0x17, 0x66, 0x5b, 0x25, 0x41, 0x2e, 0x47, 0x22,
        0x93, 0x2a, 0xbc, 0x3d, 0xba, 0x05, 0x8f, 0x3e, 0x48, 0x06, 0xd6, 0x39,
        0xa9, 0x1e, 0x6f, 0xaf, 0x82, 0x55, 0x90, 0x85, 0xe2, 0xb0, 0x95, 0xea,
        0x8c, 0xb2, 0x59, 0xdd, 0xde, 0x25, 0x3b, 0x39, 0xc7, 0x64, 0xa6, 0xa2,
        0x90, 0xf0, 0x52, 0xfd, 0xed, 0x97, 0xb9, 0xcc, 0x55, 0xa7, 0x2f, 0xe7,
        0x5d, 0x12, 0x9e, 0x3a, 0xb8, 0xae, 0x65, 0xb7, 0x4c, 0x09, 0xec, 0x08,
        0x0d, 0x9f, 0xb4, 0x8a, 0x1f, 0xcc, 0xd6, 0xbc, 0x3f, 0x3e, 0x02, 0x16,
        0x81, 0x01, 0xcf, 0x8f, 0x38, 0x26, 0xfb, 0x4b, 0x37, 0xae, 0xba, 0x29,
        0x9c, 0x5b, 0x28, 0xb7, 0x27, 0xb2, 0x6d, 0xb4, 0x51, 0x57, 0xad, 0x26,
        0x0b, 0x94, 0xda, 0x93, 0xc2, 0x0d, 0x0b, 0x1d, 0x5e, 0xa2, 0xe7, 0x0d,
        0xfd, 0x0a, 0xe5, 0x2e, 0x59, 0x43, 0x36, 0x03, 0xa9, 0xcd, 0x53, 0x97,
        0x87, 0x17, 0x9e, 0xae, 0x69, 0xbb, 0xb6, 0xa3, 0x73, 0xdb, 0x6d, 0xef,
        0xb9, 0xff, 0xdb, 0x0c, 0x65, 0xcc, 0x81, 0xe9, 0x07, 0x51, 0x61, 0xa2,
        0xef, 0x56, 0x63, 0x59, 0xa3, 0x05, 0xb4, 0x35, 0x16, 0x55, 0xc6, 0x32,
        0x7e, 0xf7, 0x7e, 0x76, 0x08, 0x86, 0xc2, 0xe2, 0x91, 0x73, 0x89, 0x6c,
        0xac, 0xd5, 0x36, 0xc9, 0x9f, 0xb4, 0x82, 0x06, 0x60, 0xfa, 0xe0, 0x8b,
        0xc6, 0x25, 0xc3, 0x7e, 0x80, 0x4a, 0x88, 0x36, 0x51, 0x3b, 0x86, 0x2a,
        0x48, 0x48, 0xd5, 0x19, 0x56, 0xf5, 0xf4, 0x5e, 0x46, 0x26, 0x97, 0xb9,
        0x05, 0xf6, 0xca, 0xeb, 0x2e, 0x76, 0x56, 0x03, 0x80, 0x9e, 0x92, 0x9d,
        0x1e, 0xf1, 0xd9, 0xed, 0x98, 0x22, 0xd6, 0x00, 0x38, 0xca, 0x20, 0x8c,
        0x42, 0x4f, 0x71, 0xe8, 0x3f, 0x3a, 0x3c, 0x4b, 0x92, 0xcd, 0x93, 0x84,
        0x31, 0x1e, 0x82, 0x44, 0x75, 0xed, 0xdd, 0xba, 0xc4, 0x51, 0x06, 0xc8,
        0x28, 0x59, 0x3d, 0x37, 0x98, 0x2b, 0xe9, 0x22, 0xd6, 0x68, 0xbe, 0x64,
        0x31, 0x91, 0x29, 0xb0, 0x8d, 0x16, 0x4c, 0xb9, 0xf0, 0xff, 0xdd, 0xca,
        0xef, 0x04, 0x04, 0xa0, 0xdc, 0xdd, 0xfd, 0xfc, 0xd6, 0x59, 0x00, 0x1a,
        0xbf, 0x6e, 0x4a, 0x73, 0x5a, 0xf1, 0x8c, 0xc9, 0x84, 0xca, 0xf0, 0x5e,
        0x75, 0x3e, 0x3c, 0xda, 0xa8, 0x22, 0x37, 0xd0, 0x0e, 0xc3, 0xa9, 0xf3,
        0xad, 0xb6, 0x6b, 0x7c, 0x13, 0x79, 0xb9, 0xe5, 0x44, 0x8b, 0x68, 0x3b,
        0x22, 0xa7, 0xa2, 0xc6, 0x94, 0x2f, 0x91, 0xc6, 0x85, 0xdc, 0x65, 0x57,
        0x4f, 0x93, 0xb5, 0x92, 0xff, 0xc5, 0xd4, 0x73, 0x2f, 0xa7, 0x2d, 0x90,
        0xe9, 0x27, 0x56, 0xfb, 0xd3, 0x10, 0x37, 0x83, 0xa2, 0xb9, 0xd4, 0xee,
        0xaf, 0x73, 0x98, 0x0b, 0xe8, 0xaf, 0xaa, 0xe3, 0xa4, 0x29, 0x11, 0x41,
        0xbc, 0x3a, 0x1b, 0x2d, 0x5d, 0x01, 0xcd, 0xea, 0xc1, 0x60, 0x57, 0x05,
        0x22, 0x53, 0x90, 0x9b, 0x0d, 0x94, 0x9b, 0xd4, 0xcd, 0x9c, 0x83, 0x82,
        0x66, 0x21, 0x05, 0xf6, 0x6b, 0xaa, 0x4f, 0xe3, 0xaf, 0x6d, 0x8f, 0x76,
        0x4d, 0x1f, 0xd9, 0x62, 0xbb, 0x14, 0x29, 0x8b, 0x72, 0x07, 0x66, 0xe7,
        0x9c, 0xf2, 0x78, 0x82, 0x70, 0x2e, 0x3d, 0x5d, 0x88, 0xa4, 0xc5, 0x50,
        0xb0, 0xc5, 0xf0, 0xb0, 0xfd, 0xba, 0x10, 0xcd, 0xed, 0x50, 0x51, 0xdb,
        0xfb, 0x6d, 0x29, 0x89, 0xef, 0x8d, 0xfd, 0xd4, 0x2f, 0x0c, 0x38, 0xe5,
        0x16, 0xf0, 0xb5, 0x72, 0x39, 0x80, 0xa5, 0xc3, 0x74, 0xf0, 0xa6, 0x7a,
        0xba, 0xc8, 0x7a, 0xc6, 0x59, 0xd9, 0xbb, 0x30, 0x42, 0x6a, 0x37, 0xfa,
        0x5f, 0x91, 0x60, 0x04, 0xbc, 0x51, 0x35, 0xbc, 0xd5, 0xf1, 0x74, 0x37,
        0x68, 0x92, 0x36, 0x2e, 0x19, 0x85, 0xb8, 0x1d, 0x0c, 0x26, 0xe9, 0x46,
        0x3b, 0x83, 0xba, 0x9e, 0xea, 0x84, 0x2c, 0x56, 0x1d, 0x9e, 0xc0, 0x19,
        0xa8, 0x62, 0x26, 0xcd, 0x40, 0x42, 0x4f, 0x2e, 0xa8, 0x79, 0xe5, 0x51,
        0x32, 0x0a, 0xba, 0x95, 0x1d, 0x8b, 0x55, 0xa6, 0x68, 0xbc, 0x64, 0xdd,
        0x88, 0x94, 0x1c, 0xba, 0xa5, 0xd9, 0x53, 0x98, 0x79, 0x78, 0x78, 0x59,
        0xe2, 0xaf, 0xce, 0x45, 0x32, 0x93, 0xa6, 0x7f, 0x84, 0x93, 0x44, 0xc3,
        0x4e, 0x08, 0xa4, 0xe4, 0x1c, 0x33, 0x6d, 0x7a, 0x71, 0x87, 0x71, 0x19,
        0x42, 0x33, 0x4b, 0x57, 0xd2, 0x74, 0xa8, 0xa2, 0xd1, 0x6d, 0x60, 0x15,
        0xb6, 0x6a, 0x44, 0x7f, 0x00, 0xf6, 0xdf, 0x1b, 0x96, 0x64, 0xdd, 0xae,
        0x77, 0x63, 0x75, 0xe3, 0xc5, 0xce, 0xf1, 0x5f, 0x67, 0x1e, 0x5c, 0x0f,
        0x1f, 0xaf, 0x27, 0x2c, 0xf0, 0xc8, 0x5c, 0x0d, 0x87, 0xcc, 0xf2, 0x9a,
        0xf0, 0xf7, 0x00, 0xb7, 0x0e, 0x67, 0x9e, 0x09, 0x19, 0x68, 0x97, 0x45,
        0x48, 0xbb, 0xe0, 0x04, 0xaf, 0xd7, 0x4c, 0x05, 0x95, 0xb7, 0xb1, 0x4c,
        0x4b, 0x96, 0x06, 0xad, 0xff, 0x54, 0xb4, 0xa1, 0x67, 0xc3, 0x00, 0x27,
        0x39, 0x53, 0x25, 0x26, 0xd9, 0xbe, 0x86, 0x5d, 0xd9, 0x7e, 0xe9, 0x57,
        0x90, 0x5b, 0xb3, 0x24, 0x70, 0xe5, 0x44, 0x4e, 0xd9, 0xb6, 0xb0, 0x6d,
        0x47, 0x57, 0xf9, 0xc0, 0x53, 0xac, 0x6d, 0xff, 0x18, 0xdd, 0xf5, 0x29,
        0x2e, 0xe2, 0x27, 0x6b, 0x01, 0xb1, 0x26, 0xba, 0x00, 0x35, 0x52, 0xe3,
        0x91, 0x07, 0xdb, 0x7b, 0x04, 0x30, 0x8a, 0xef, 0xe4, 0x2e, 0x00, 0x23,
        0xec, 0xc0, 0x62, 0xca, 0xed, 0x27, 0xe6, 0x4f, 0x27, 0x8d, 0xfc, 0x46,
        0xc3, 0x1b, 0xb2, 0xe3, 0x01, 0x71, 0x67, 0x2f, 0x14, 0x54, 0x35, 0xd5,
        0x50, 0x86, 0x03, 0x29, 0xad, 0x6b, 0x27, 0x66, 0x70, 0x31, 0x1e, 0x99,
        0xef, 0x65, 0x09, 0xf1, 0xfa, 0xb4, 0xa9, 0x83, 0x3c, 0x1c, 0x9e, 0x28,
        0x4a, 0x89, 0xcc, 0xc3, 0x17, 0xc8, 0x65, 0x10, 0x35, 0x57, 0x0c, 0xf0,
        0x5c, 0xb2, 0xba, 0xc2, 0xe4, 0x17, 0xa0, 0x8d, 0x78, 0x56, 0x51, 0x4b,
        0x3d, 0x14, 0xd4, 0x81, 0x9a, 0x15, 0xd0, 0x63, 0x45, 0x60, 0x48, 0x21,
        0x86, 0x4a, 0x19, 0xb6, 0x51, 0xfa, 0xb5, 0x06, 0x49, 0xa9, 0x95, 0xb3,
        0x67, 0x81, 0xda, 0x2b, 0xdc, 0x75, 0x01, 0x80, 0x34, 0x6f, 0xf3, 0xb1,
        0x19, 0x1a, 0x2a, 0xe3, 0x50, 0x5b, 0x83, 0x9c, 0x5b, 0x4f, 0xd5, 0xe4,
        0x66, 0x06, 0x0f, 0x0e, 0xcd, 0x07, 0x09, 0xf2, 0xca, 0xf3, 0x48, 0x3f,
        0x56, 0x37, 0xe5, 0x16, 0x73, 0x90, 0xc0, 0x45, 0xb0, 0xfc, 0xc3, 0x96,
        0x65, 0x53, 0xd1, 0x29, 0xd9, 0xc4, 0x39, 0xf0, 0xe3, 0x61, 0x12, 0xb8,
        0x62, 0x26, 0xdf, 0xa5, 0x24, 0xb3, 0x44, 0x68, 0xa3, 0x3d, 0xf8, 0xf6,
        0x6f, 0xc1, 0x24, 0x43, 0x90, 0xed, 0x52, 0x81, 0x8b, 0x9a, 0xaa, 0x83,
        0xa1, 0xb5, 0x73, 0x47, 0xe6, 0x8b, 0x3f, 0x8d, 0x8f, 0x39, 0xeb, 0xd3,
        0x90, 0x98, 0x69, 0x32, 0x25, 0x43, 0x0c, 0xff, 0x82, 0xcb, 0x22, 0xe7,
        0xe2, 0x83, 0x2f, 0xf7, 0x03, 0x79, 0x19, 0x81, 0x3b, 0x61, 0x50, 0x94,
        0x10, 0x38, 0x84, 0xec, 0x47, 0xa3, 0x99, 0xe7, 0xd4, 0x60, 0x3e, 0x77,
        0x49, 0xde, 0xa1, 0x9e, 0x2e, 0x88, 0x29, 0xab, 0x81, 0x7c, 0xcb, 0x44,
        0x1f, 0x59, 0x3b, 0x1c, 0xbb, 0x69, 0x39, 0xc0, 0xe3, 0xb7, 0xac, 0x29,
        0x4a, 0x77, 0x98, 0xf5, 0x7b, 0xbb, 0xa1, 0xb9, 0x70, 0x50, 0xb9, 0x40,
        0x04, 0xbc, 0x20, 0xb8, 0x2a, 0x2d, 0x2c, 0x0e, 0xde, 0x8f, 0x10, 0x16,
        0x7a, 0x6c, 0xb5, 0x18, 0x41, 0x36, 0x9e, 0x19, 0xbb, 0xc6, 0xf4, 0x6d,
        0x3e, 0xf6, 0x77, 0x7d, 0x3e, 0xe0, 0xcb, 0xbb, 0x50, 0x9f, 0xb3, 0xe7,
        0x24, 0x2f, 0x67, 0xe5, 0xd8, 0x27, 0xfa, 0x4f, 0x60, 0x01, 0xe8, 0x78,
        0x40, 0xa0, 0x19, 0xcc, 0x3c, 0xc6, 0xfe, 0xa7, 0x69, 0xe4, 0x28, 0x0d,
        0x0d, 0x27, 0x68, 0x82, 0x46, 0xde, 0xb9, 0xb9, 0xe4, 0xc6, 0xf3, 0xfc,
        0x08, 0x01, 0xbe, 0xce, 0xdc, 0x45, 0x7f, 0x65, 0x6a, 0xdd, 0xf5, 0x6a,
        0x5f, 0xe7, 0xad, 0x67
    ]),
    "Forest Green": new Uint8Array([
        0xf8, 0xda, 0xdc, 0xbb, 0x2d, 0x34, 0x4b, 0x71, 0x2d, 0x53, 0xc9, 0xb7,
        0x9d, 0x6d, 0x07, 0x9f, 0x04, 0x7f, 0xfc, 0xc8, 0x53, 0xa9, 0xde, 0x6f,
        0x2d, 0xbb, 0x35, 0xd7, 0xc5, 0xb2, 0x54, 0xc1, 0x1b, 0x79, 0xf6, 0x8e,
        0x7d, 0xb2, 0x00, 0x12, 0x5e, 0xd2, 0x77, 0x3d, 0x27, 0x0a, 0xfa, 0x63,
        0x45, 0xcd, 0x33, 0x24, 0xfa, 0x83, 0x4d, 0xdd, 0x6c, 0x6b, 0x39, 0xbc,
        0xd7, 0xa9, 0x82, 0x20, 0x22, 0x14, 0xcd, 0x45, 0xf5, 0xcf, 0x03, 0x29,
        0x6b, 0x8d, 0x35, 0xcf, 0x15, 0xa8, 0x11, 0x8b, 0x2b, 0xba, 0xea, 0x40,
        0xf0, 0x3b, 0x7b, 0x8a, 0xb7, 0x87, 0xae, 0xc6, 0xc9, 0x1d, 0x25, 0xbb,
        0x1b, 0xcb, 0x5f, 0x58, 0xa5, 0xb2, 0xd8, 0x18, 0xfe, 0x23, 0xb3, 0xd2,
        0x20, 0xad, 0x5b, 0xf4, 0x57, 0x1c, 0xaa, 0xd7, 0xa8, 0x62, 0x3d, 0xde,
        0x35, 0x6f, 0xd7, 0xed, 0x47, 0x8a, 0xb7, 0xe9, 0x52, 0x24, 0x85, 0xa6,
        0x29, 0x3c, 0x9d, 0x5f, 0x75, 0x17, 0x04, 0xd2, 0xc7, 0x3c, 0x1b, 0x45,
        0xb3, 0x6c, 0x8a, 0x39, 0xec, 0xfe, 0x7d, 0x46, 0xed, 0xa6, 0xac, 0x56,
        0xb9, 0xaf, 0x01, 0xb2, 0x5c, 0x07, 0x3e, 0x32, 0x83, 0x8a, 0x10, 0xcf,
        0xfe, 0x93, 0x69, 0xdc, 0xe7, 0xd3, 0x4b, 0x58, 0x89, 0x6d, 0x6d, 0x62,
        0x24, 0x5d, 0x3a, 0xc1, 0x09, 0x84, 0x94, 0x78, 0x6c, 0x96, 0x29, 0x41,
        0xf5, 0x8a, 0x0d, 0x7b, 0xb0, 0xd4, 0x95, 0xf6, 0x54, 0x1e, 0x43, 0x03,
        0x00, 0xad, 0x69, 0x30, 0x06, 0x6a, 0xf8, 0xeb, 0x21, 0xce, 0x33, 0x25,
        0x8e, 0x42, 0xa7, 0x9e, 0x73, 0x3a, 0x2f, 0x71, 0xd8, 0x69, 0xad, 0x31,
        0xf3, 0xad, 0xc3, 0xdb, 0xc1, 0x0f, 0xa7, 0xac, 0xb2, 0xf9, 0xc5, 0x0e,
        0x77, 0xb1, 0x0e, 0xe7, 0xc3, 0x5b, 0x9e, 0xfd, 0xfc, 0x7d, 0x33, 0xba,
        0x4a, 0x38, 0xeb, 0xb7, 0x14, 0xc2, 0x95, 0xe7, 0x93, 0xf9, 0xdc, 0xba,
        0x95, 0x52, 0x41, 0xd5, 0xa3, 0xec, 0x0f, 0x99, 0xac, 0x21, 0x39, 0x77,
        0xcd, 0x86, 0x1f, 0xf2, 0x8d, 0xef, 0xf2, 0x3e, 0xfc, 0xda, 0x90, 0x5f,
        0x93, 0x06, 0x84, 0x49, 0x93, 0xe0, 0xba, 0x1c, 0x80, 0x13, 0x8f, 0xe8,
        0x25, 0x35, 0xd8, 0x2b, 0x98, 0x47, 0x8e, 0xd2, 0xb8, 0x28, 0x72, 0x68,
        0xaf, 0x86, 0xc5, 0xcd, 0xa0, 0xe7, 0x87, 0x03, 0x7d, 0x56, 0x85, 0x72,
        0x92, 0xa5, 0xcd, 0xef, 0x65, 0x84, 0x8c, 0x38, 0x33, 0xf7, 0x01, 0x6c,
        0x04, 0x04, 0xb1, 0x5a, 0x5b, 0x63, 0x87, 0xa9, 0xcd, 0x9e, 0x13, 0x5f,
        0xa9, 0xde, 0xf7, 0xf5, 0x59, 0xd3, 0x1f, 0x8b, 0xd5, 0x1d, 0xd8, 0x6a,
        0x09, 0xf6, 0x25, 0x5c, 0x9e, 0xcf, 0x22, 0xd1, 0x9b, 0xa2, 0x32, 0x75,
        0x56, 0xca, 0xaf, 0x4c, 0x70, 0x8b, 0xdf, 0xdc, 0x33, 0xae, 0xcb, 0x1f,
        0x73, 0xc0, 0xb6, 0xb7, 0xb3, 0x15, 0x2c, 0x79, 0x66, 0x59, 0x2d, 0x54,
        0xae, 0x2d, 0x3f, 0x6c, 0xa4, 0xbd, 0x1a, 0xa4, 0x58, 0x53, 0xe1, 0x97,
        0x6e, 0xe2, 0x16, 0x2d, 0xb7, 0x34, 0x8d, 0x1c, 0xc1, 0x50, 0xf0, 0x65,
        0xf3, 0xd2, 0xb9, 0xec, 0x37, 0x5f, 0x99, 0x13, 0x31, 0xf1, 0x4a, 0xf2,
        0xd6, 0xaf, 0xf2, 0x1c, 0x21, 0xd9, 0xf5, 0x7b, 0x69, 0x07, 0x4a, 0x00,
        0xf8, 0xf3, 0x38, 0x48, 0xae, 0xcc, 0x07, 0x75, 0xaf, 0xa6, 0x49, 0x5c,
        0x7b, 0x3a, 0x24, 0x9e, 0x32, 0x98, 0xf8, 0x98, 0xfe, 0x38, 0xd2, 0xc1,
        0x12, 0x59, 0x4d, 0xfe, 0x91, 0x45, 0x4f, 0x90, 0xb3, 0x41, 0x66, 0x03,
        0x42, 0xa6, 0xe0, 0x08, 0x7a, 0xff, 0xfb, 0x72, 0xc3, 0x14, 0xb5, 0x4a,
        0x2d, 0xeb, 0xa1, 0x55, 0x53, 0x48, 0x10, 0x2d, 0x18, 0xbe, 0x87, 0x06,
        0x1b, 0xd1, 0x02, 0x05, 0xae, 0x64, 0xa3, 0xb3, 0xfc, 0xf2, 0xc0, 0xdb,
        0x4a, 0xc6, 0x54, 0x67, 0x43, 0x18, 0x89, 0xeb, 0xb0, 0x10, 0xf8, 0x8f,
        0xfd, 0xf6, 0xbc, 0xfb, 0x96, 0x3d, 0xb3, 0x9d, 0x39, 0x38, 0xf7, 0xdc,
        0x7d, 0x27, 0x39, 0x87, 0xb7, 0x6d, 0xec, 0x15, 0xad, 0x3f, 0xa9, 0x48,
        0x6e, 0x96, 0x4b, 0x0e, 0x82, 0x03, 0x88, 0x87, 0x39, 0x64, 0x98, 0xd1,
        0x75, 0x4b, 0x57, 0x81, 0x7a, 0xd9, 0x64, 0xe5, 0x98, 0x54, 0x7f, 0x60,
        0xb2, 0xd7, 0x25, 0x9e, 0xc5, 0x36, 0x2f, 0xa4, 0x9b, 0x43, 0xaa, 0x8a,
        0xf4, 0x7b, 0xd9, 0x63, 0x2e, 0x30, 0x2c, 0x67, 0x1a, 0xc5, 0x97, 0xdd,
        0xe7, 0x90, 0x01, 0x96, 0x3b, 0x76, 0xef, 0x1d, 0x6f, 0xaa, 0xb6, 0x6e,
        0x7d, 0x44, 0xb7, 0x1b, 0x0c, 0x65, 0xfe, 0xa8, 0x1b, 0xe0, 0x4f, 0xd2,
        0xb2, 0x1c, 0xc5, 0xda, 0xd3, 0x65, 0x94, 0xdf, 0x81, 0xf1, 0x6e, 0xfb,
        0x1f, 0xf6, 0x52, 0x27, 0x45, 0x53, 0x24, 0x14, 0xde, 0x55, 0x21, 0x02,
        0xf7, 0xda, 0x50, 0xfd, 0x0d, 0x84, 0x2e, 0x44, 0x73, 0xc3, 0x6e, 0x4b,
        0x54, 0x85, 0x50, 0x05, 0x21, 0xcd, 0xf1, 0x3a, 0xb7, 0xd9, 0xf2, 0x96,
        0xa2, 0x91, 0x87, 0x90, 0x68, 0x40, 0x99, 0xbc, 0x35, 0xf0, 0x55, 0x84,
        0x0d, 0x48, 0x14, 0xd7, 0x93, 0xa3, 0x7d, 0x98, 0x4b, 0x2b, 0x00, 0x59,
        0x35, 0x3c, 0x0d, 0xb0, 0x4b, 0xa4, 0x77, 0x1b, 0xec, 0x6d, 0x02, 0xf5,
        0x8b, 0xb7, 0x08, 0x85, 0xe1, 0x52, 0x34, 0x37, 0x01, 0x5e, 0xd8, 0x1f,
        0x97, 0xff, 0x59, 0x9f, 0x1b, 0xd7, 0xdb, 0x36, 0x62, 0x70, 0x74, 0x37,
        0xdb, 0xe3, 0xd0, 0x71, 0x3a, 0x2e, 0x42, 0x86, 0xb2, 0xba, 0x96, 0xfe,
        0x14, 0x4c, 0xa7, 0x73, 0x78, 0x28, 0x7b, 0x82, 0x5f, 0x5d, 0x42, 0x45,
        0x03, 0x70, 0x2a, 0xbf, 0x7d, 0xf8, 0x14, 0xba, 0x9f, 0x15, 0x2d, 0x65,
        0xab, 0xe1, 0xb4, 0xf5, 0x26, 0x2b, 0x14, 0xad, 0xa5, 0xd2, 0x5b, 0x63,
        0xa6, 0x66, 0x39, 0x4b, 0x9e, 0xd2, 0x0a, 0x4f, 0x47, 0xb7, 0xc9, 0x7f,
        0xe0, 0xe6, 0xe2, 0x26, 0xe5, 0x3e, 0x04, 0xa0, 0xcb, 0x1b, 0x07, 0xa1,
        0xd5, 0xb3, 0xae, 0x00, 0x1d, 0x8f, 0x8d, 0xcd, 0xf1, 0x61, 0xda, 0x17,
        0x41, 0x28, 0x55, 0x8f, 0x68, 0x4d, 0x6c, 0xfa, 0xfc, 0x98, 0x19, 0xcd,
        0x5d, 0x44, 0xde, 0x1e, 0x95, 0xd1, 0xe2, 0x6e, 0x1c, 0xda, 0x4c, 0x2d,
        0xc0, 0xa1, 0x2a, 0xbd, 0xbb, 0x93, 0x0a, 0x99, 0x4a, 0xbf, 0x0b, 0x1c,
        0x7e, 0x2c, 0xc0, 0xb1, 0x3c, 0x01, 0x9a, 0x06, 0x3a, 0x7c, 0x33, 0xef,
        0xda, 0x30, 0xfc, 0x8e, 0xbc, 0xf7, 0xac, 0x70, 0xee, 0xdf, 0x2e, 0xc7,
        0x1f, 0xd8, 0xde, 0xeb, 0xb4, 0x96, 0x8f, 0x6b, 0x48, 0x41, 0x68, 0x86,
        0x80, 0xc6, 0x59, 0xd4, 0x87, 0x05, 0xce, 0x85, 0xb9, 0xfe, 0x74, 0x2f,
        0x85, 0x0b, 0xfa, 0xe5, 0x4a, 0xce, 0xdb, 0xdf, 0x54, 0x0e, 0xa3, 0xa0,
        0xc4, 0x59, 0xfa, 0x72, 0xef, 0x8c, 0xf9, 0xbf, 0x83, 0x76, 0xfb, 0x39,
        0x46, 0x5f, 0xf9, 0xbe, 0xdc, 0x68, 0xc0, 0x7b, 0xe7, 0x26, 0x3a, 0xcc,
        0x76, 0x01, 0x50, 0x78, 0x2a, 0x4f, 0x7c, 0xb1, 0x70, 0xa8, 0x3d, 0x5f,
        0x78, 0x13, 0x84, 0xba, 0x38, 0x01, 0xee, 0x66, 0xbd, 0xe3, 0xaa, 0x5f,
        0xf2, 0x25, 0xd1, 0x2d, 0xe8, 0x50, 0x9c, 0xe1, 0x17, 0x5d, 0x96, 0x4c,
        0xa2, 0xb4, 0x39, 0xad, 0x82, 0x81, 0xa7, 0x5e, 0x53, 0x32, 0xbe, 0xd2,
        0x67, 0x1e, 0x0e, 0x06, 0x5a, 0x33, 0x88, 0x4a, 0xe7, 0x6c, 0xfc, 0xef,
        0xe4, 0xe9, 0x52, 0xaa, 0xe3, 0x5e, 0x62, 0x34, 0xc5, 0xcf, 0xd2, 0x55,
        0xf2, 0x64, 0x9f, 0xe4, 0x24, 0x31, 0x06, 0x5c, 0x3f, 0xec, 0x0f, 0xb0,
        0x32, 0x5a, 0xe8, 0xe6, 0x75, 0x3f, 0x24, 0x66, 0x28, 0x83, 0xe3, 0x90,
        0x47, 0xef, 0xeb, 0xc5, 0x3b, 0xfd, 0x3e, 0xda, 0x8d, 0x72, 0x26, 0x91,
        0x6e, 0x2f, 0x41, 0xc1, 0xd4, 0xd6, 0x9d, 0xf4, 0xe6, 0x76, 0x92, 0x47,
        0x49, 0xed, 0x04, 0x91, 0xf1, 0x61, 0x37, 0x73, 0x53, 0x08, 0xf8, 0xd7,
        0x05, 0x71, 0x46, 0x62, 0x22, 0xfa, 0x0a, 0xe6, 0x3f, 0xe6, 0xb8, 0x1f,
        0xbd, 0x1a, 0x01, 0x5a, 0x6d, 0x10, 0x1c, 0xdf, 0x20, 0xbe, 0x60, 0x72,
        0x84, 0xf7, 0x4b, 0xeb, 0x7d, 0xb7, 0xa1, 0x2a, 0x23, 0xa8, 0xac, 0x48,
        0x49, 0xff, 0x3b, 0x9e, 0x24, 0xc3, 0x2e, 0x8a, 0x59, 0xe7, 0x74, 0x38,
        0xac, 0x13, 0xf2, 0x2b, 0x15, 0xaa, 0x17, 0xf2, 0xac, 0x26, 0xfa, 0x04,
        0x75, 0x03, 0x7e, 0x4e, 0xe1, 0xa5, 0x7b, 0x00, 0x55, 0xae, 0x0c, 0xfd,
        0x38, 0xc5, 0xe6, 0x45, 0x0a, 0x2a, 0xc5, 0xa1, 0xb5, 0xee, 0xa2, 0x5b,
        0x27, 0x83, 0x3a, 0x30, 0xc1, 0x72, 0xb6, 0x38, 0x71, 0x47, 0x18, 0xf9,
        0x92, 0x88, 0x3e, 0x02, 0x8e, 0x99, 0xcc, 0xa8, 0xfd, 0x1a, 0x89, 0x95,
        0xd5, 0xd4, 0xf8, 0x34, 0xa1, 0xcc, 0x38, 0xaa, 0xf9, 0xf2, 0xce, 0xfa,
        0xce, 0xe1, 0x61, 0xf5, 0xd3, 0x01, 0x7a, 0xee, 0x23, 0xd6, 0x63, 0xdf,
        0x55, 0x7f, 0x7b, 0x6a, 0xb5, 0x90, 0xcf, 0xd3, 0xfe, 0x62, 0xae, 0xee,
        0x8c, 0x1b, 0x06, 0xb9, 0x60, 0xc0, 0xf3, 0x95, 0xe7, 0x18, 0x20, 0xd1,
        0x9a, 0x48, 0xae, 0xab, 0x5e, 0x3c, 0x6b, 0x88, 0x14, 0xe2, 0xe6, 0xa5,
        0x9f, 0x2c, 0x1e, 0x03, 0x6c, 0x0b, 0x84, 0xed, 0xa0, 0xf8, 0x30, 0x35,
        0x7b, 0x7b, 0x7b, 0xde, 0xca, 0x48, 0x03, 0x48, 0x65, 0x42, 0xd6, 0xae,
        0x1d, 0xf3, 0x6e, 0xed, 0x44, 0x22, 0x0d, 0x5e, 0xc6, 0xd6, 0xa9, 0xf0,
        0x18, 0xce, 0x56, 0x06, 0xc6, 0x20, 0x77, 0x9e, 0xb7, 0x36, 0x29, 0x65,
        0x19, 0xcb, 0x8c, 0x75, 0x6e, 0xc1, 0x5e, 0xc3, 0xe0, 0xa1, 0x90, 0x34,
        0x4b, 0x7a, 0x64, 0x58, 0x2a, 0x76, 0x64, 0xa5, 0xf4, 0xf8, 0xae, 0xf2,
        0x32, 0x6b, 0x89, 0x15, 0x90, 0xa9, 0x4b, 0x56, 0x09, 0xbb, 0xba, 0x93,
        0x63, 0x22, 0xbe, 0x47, 0x33, 0x75, 0x0b, 0xc7, 0x1e, 0x32, 0x89, 0xb0,
        0x5d, 0x85, 0x4f, 0x46, 0xbf, 0xe6, 0xc2, 0x79, 0x8a, 0xc0, 0x7d, 0xf8,
        0xf1, 0x96, 0xfe, 0x95, 0x3c, 0x88, 0xbe, 0x3a, 0x52, 0x68, 0xf6, 0x35,
        0xd4, 0xf5, 0xff, 0x4c, 0xd0, 0x56, 0x1f, 0x85, 0x0a, 0xc9, 0x20, 0xbe,
        0x9d, 0x46, 0xa1, 0x35, 0xdb, 0x5e, 0x80, 0x7e, 0x23, 0x17, 0xec, 0xfb,
        0x5e, 0x4b, 0x95, 0x20, 0x4a, 0xe9, 0x5a, 0xd7, 0x12, 0xeb, 0x0a, 0x77,
        0x46, 0x6a, 0xbc, 0xa3, 0x4a, 0x68, 0x31, 0xf2, 0xbc, 0xa3, 0x9f, 0xd5,
        0xd6, 0xd7, 0xc4, 0xda, 0x44, 0x62, 0xf5, 0x5a, 0xd7, 0xe8, 0x41, 0xb8,
        0x34, 0xbe, 0xd6, 0xaa, 0x7f, 0x37, 0x8c, 0x29, 0xf6, 0x0d, 0xaa, 0xf8,
        0x7b, 0x42, 0x86, 0x44, 0x99, 0x58, 0xb5, 0xfa, 0xca, 0x8b, 0xfa, 0x7b,
        0x3b, 0x18, 0x35, 0xf2, 0x05, 0xbd, 0xa9, 0xbc, 0x2c, 0x2a, 0x96, 0xd2,
        0x22, 0xfc, 0xe1, 0x8b, 0x56, 0x10, 0x6d, 0x7b, 0x50, 0x78, 0x16, 0x8c,
        0x69, 0x9a, 0x55, 0x82, 0x70, 0xdc, 0xf0, 0x5f, 0x9a, 0x24, 0xc6, 0x5c,
        0x34, 0x24, 0xd4, 0x3a, 0xe4, 0x7f, 0x79, 0x1f, 0x43, 0x99, 0x0e, 0xcc,
        0x53, 0xca, 0xd1, 0x9b, 0x6b, 0xc4, 0xf2, 0x7a, 0x6a, 0x66, 0x66, 0x41,
        0x46, 0x15, 0xef, 0xf3, 0xac, 0xd6, 0x2a, 0xd3, 0x58, 0x26, 0xdc, 0xfa,
        0x3c, 0xd4, 0x31, 0x33, 0xcc, 0x5b, 0x54, 0x52, 0xf1, 0x0e, 0xd2, 0x37,
        0xbd, 0x91, 0xf9, 0xb4, 0x4b, 0x7a, 0x89, 0x1a, 0xad, 0xa7, 0x0d, 0x2b,
        0xef, 0x23, 0xf2, 0x90, 0xa2, 0x7c, 0xaf, 0xd2, 0x16, 0xa5, 0x2e, 0xa0,
        0x12, 0x91, 0x4c, 0x63, 0x8e, 0xb4, 0x6d, 0xc3, 0x9f, 0x82, 0xec, 0xf0,
        0xf8, 0x1f, 0x8e, 0x04, 0x49, 0x5a, 0x8d, 0x5c, 0x1c, 0x11, 0x55, 0x09,
        0x94, 0x86, 0xc6, 0x94, 0x68, 0x24, 0xa7, 0xc2, 0x78, 0x8f, 0xf1, 0x2a,
        0xbd, 0xf8, 0x19, 0x48, 0x74, 0x45, 0xcd, 0x1b, 0x3b, 0x27, 0x1f, 0x48,
        0x48, 0x98, 0x0b, 0xf3, 0x47, 0xb7, 0x59, 0x53, 0x89, 0xfc, 0x84, 0xae,
        0x03, 0xb7, 0x24, 0x40, 0x2c, 0x79, 0x7e, 0xbb, 0xc0, 0x69, 0x07, 0x40,
        0x4d, 0xf3, 0xb0, 0x5a, 0x1b, 0x26, 0xc8, 0x77, 0xa8, 0x80, 0x69, 0xb2,
        0xdb, 0xc5, 0xbb, 0x34, 0xfd, 0xf7, 0xc3, 0x75, 0x96, 0xbc, 0xf7, 0x84,
        0x0f, 0xd1, 0xd9, 0xc5, 0x55, 0x88, 0x1a, 0x41, 0x03, 0x9b, 0x73, 0x97,
        0x0b, 0x29, 0x3b, 0x1a, 0x25, 0x1a, 0x7c, 0x29, 0x0b, 0x4d, 0x10, 0x73,
        0x10, 0xc5, 0x6c, 0x73, 0xca, 0x65, 0x28, 0xbc, 0x54, 0x9e, 0x79, 0xf0,
        0xbb, 0x6e, 0x3f, 0xc8, 0xd1, 0x52, 0xff, 0x92, 0xa5, 0xb7, 0xdf, 0x00,
        0x1a, 0x9b, 0x53, 0xb5, 0x1f, 0x83, 0x1e, 0x87, 0xfd, 0x74, 0xd7, 0x52,
        0x25, 0x0d, 0xed, 0x03, 0xb5, 0xfb, 0x33, 0x29, 0x89, 0xf5, 0xad, 0xdf,
        0x25, 0xfe, 0x9f, 0x7a, 0x75, 0xd5, 0xb2, 0x5c, 0xaf, 0x92, 0xca, 0xa8,
        0x8c, 0x9f, 0x30, 0x6b, 0x00, 0x80, 0x69, 0x0d, 0xa1, 0xd2, 0x0e, 0xd0,
        0x9c, 0x7d, 0xbc, 0x0c, 0x95, 0x4c, 0x47, 0x7d, 0x85, 0xf5, 0x56, 0x63,
        0x9c, 0x6e, 0x59, 0xcd, 0x81, 0x9e, 0xd1, 0x6d, 0x5c, 0x35, 0x3d, 0xd1,
        0x4d, 0x4d, 0x0b, 0xf3, 0xdf, 0x8c, 0xa3, 0x1e, 0x52, 0x6d, 0x1a, 0x15,
        0xd3, 0x11, 0xcd, 0x2f, 0x08, 0x37, 0xe1, 0x47, 0x88, 0x36, 0x0f, 0x10,
        0x86, 0x84, 0x37, 0xdc, 0x2b, 0x88, 0x75, 0x52, 0xa1, 0x3c, 0xe9, 0xbe,
        0x00, 0xd0, 0x0c, 0xdd, 0x6b, 0x2d, 0x8d, 0xdf, 0xf4, 0xcb, 0x6d, 0x12,
        0x66, 0x53, 0xfe, 0xc7, 0xeb, 0x13, 0x22, 0x85, 0x19, 0x5c, 0x92, 0x5f,
        0x58, 0x4d, 0xdb, 0xf7, 0x31, 0x98, 0x0c, 0x58, 0x8c, 0xfc, 0x1a, 0xd4,
        0x71, 0x5e, 0xf1, 0x34, 0x50, 0x7a, 0x7a, 0xea, 0xfa, 0x39, 0xec, 0xae,
        0xe0, 0x86, 0x86, 0x7b, 0x5a, 0xbe, 0x18, 0xa2, 0xba, 0xa2, 0xf4, 0x4c,
        0x58, 0x41, 0xc9, 0x93, 0x51, 0xd6, 0x7b, 0xda, 0xf5, 0x23, 0xdd, 0x28,
        0x7c, 0x8f, 0x91, 0xa7, 0x5f, 0x30, 0x48, 0x1f, 0xee, 0x4d, 0x5b, 0xe3,
        0x05, 0x81, 0x34, 0xaf, 0xec, 0x8b, 0xc5, 0x93, 0x1d, 0xa7, 0x79, 0xc7,
        0x75, 0x64, 0x38, 0x9e, 0x72, 0x73, 0x85, 0x00, 0x77, 0x6d, 0x82, 0x6a,
        0x9c, 0xd4, 0x58, 0xc9, 0xa1, 0x0f, 0xd1, 0x25, 0x32, 0xbc, 0xf4, 0xa1,
        0x7d, 0xae, 0xb5, 0xf8, 0x6d, 0x5c, 0xfb, 0x8d, 0x6e, 0x05, 0x70, 0xec,
        0x1a, 0x76, 0x37, 0x9c, 0x9b, 0x5b, 0xe7, 0x62, 0x57, 0xa9, 0x3e, 0x33,
        0x0f, 0x17, 0x07, 0x83, 0x2c, 0x7a, 0x04, 0x87, 0xfa, 0xdd, 0x1a, 0x0f,
        0xcf, 0xbe, 0x0c, 0xc2, 0x3c, 0xe3, 0x06, 0xf9, 0x11, 0x06, 0xa7, 0x5f,
        0x47, 0xc8, 0x98, 0x12, 0xff, 0x44, 0x32, 0x85, 0xda, 0xeb, 0x2c, 0xba,
        0xc8, 0x3b, 0xe6, 0x92, 0x17, 0xb7, 0x57, 0x62, 0x4d, 0xb8, 0x04, 0x63,
        0xef, 0xcd, 0x01, 0xaf, 0xdd, 0x28, 0xc1, 0x9c, 0x27, 0xc1, 0xe2, 0x44,
        0x0d, 0x65, 0x19, 0x60, 0x48, 0x39, 0x20, 0x8b, 0x93, 0xdf, 0xd3, 0x6b,
        0x8d, 0x47, 0x00, 0x8f, 0x5b, 0x6c, 0xf7, 0xf6, 0x7a, 0x52, 0x41, 0xb8,
        0xc0, 0x4a, 0x39, 0xef, 0x36, 0x65, 0x74, 0xcd, 0x0a, 0x5e, 0x95, 0x91,
        0x96, 0xdc, 0xdb, 0xb0, 0x1c, 0xaa, 0xb5, 0xf5, 0xa8, 0xd5, 0x38, 0xd1,
        0x41, 0x3e, 0x6b, 0x17, 0x35, 0xfe, 0xaa, 0x89, 0xf4, 0x9d, 0xb1, 0xd4,
        0x24, 0x6e, 0x6a, 0x1e, 0xa7, 0x22, 0x9d, 0xd5, 0x51, 0x1e, 0x4c, 0xe4,
        0x85, 0x48, 0xfa, 0xa7, 0x3b, 0x48, 0x33, 0x63, 0x2c, 0x04, 0x7d, 0xaa,
        0x18, 0xc4, 0xe1, 0x87, 0x8d, 0x8c, 0x4f, 0xf1, 0x57, 0x0b, 0x5d, 0x8d,
        0x82, 0x62, 0xe7, 0x79, 0x09, 0xf5, 0xd8, 0x0c, 0x39, 0xa4, 0x1f, 0x1a,
        0x47, 0x07, 0x88, 0x6d, 0x47, 0x1b, 0x4e, 0x9b, 0xfa, 0x33, 0xaa, 0x1f,
        0x04, 0xe9, 0x40, 0xc2, 0xe2, 0xb8, 0x8b, 0x61, 0x17, 0x27, 0xb3, 0x18,
        0xb3, 0xce, 0xbd, 0x56, 0x54, 0xcb, 0x13, 0xd7, 0xd2, 0x8b, 0x13, 0x70,
        0xe8, 0xa1, 0xce, 0x0e, 0x63, 0x91, 0x86, 0xe6, 0x22, 0xc2, 0xbb, 0x66,
        0x6d, 0x59, 0x9f, 0x46, 0xec, 0x09, 0x3e, 0xe7, 0x57, 0x2f, 0xec, 0x3d,
        0x2d, 0xf3, 0xaf, 0xc6, 0xfb, 0xd9, 0xe3, 0x96, 0x75, 0xf4, 0x9c, 0xa3,
        0x7a, 0xfd, 0x39, 0x06, 0x98, 0x18, 0xa9, 0x38, 0x5b, 0x84, 0xd4, 0x96,
        0x93, 0x05, 0xa3, 0x61, 0x5f, 0x1d, 0x4b, 0xdd, 0xb1, 0x72, 0x6a, 0xe7,
        0x65, 0x0c, 0x53, 0x88, 0xd4, 0x47, 0xd4, 0x42, 0x1b, 0xc8, 0x90, 0x94,
        0xb7, 0x45, 0xb0, 0x6d, 0xff, 0x95, 0x1f, 0x74, 0x1c, 0xf4, 0x66, 0x60,
        0x0a, 0xe1, 0xed, 0x6e, 0x92, 0xe7, 0x63, 0xfe, 0x03, 0x0c, 0x7b, 0xd3,
        0x07, 0xa4, 0xd2, 0x0c, 0xf9, 0xb8, 0x1d, 0x9c, 0xb7, 0xc9, 0x21, 0xe5,
        0xce, 0xdb, 0x84, 0x5d, 0xbd, 0xdf, 0x67, 0xa5, 0x30, 0x56, 0x59, 0x8d,
        0xb4, 0xbe, 0x69, 0xc6, 0xa8, 0xd0, 0x44, 0xd2, 0x14, 0x4b, 0x97, 0xb8,
        0x12, 0xd1, 0x34, 0x66, 0x4b, 0x90, 0x65, 0x22, 0xa6, 0x05, 0x74, 0x94,
        0xa7, 0x9d, 0x0f, 0xd2, 0x19, 0xb4, 0xeb, 0xc1, 0xb5, 0x66, 0x85, 0x28,
        0xc6, 0x6e, 0xab, 0x05, 0x2e, 0xf9, 0xdd, 0x95, 0x0a, 0x9f, 0x08, 0x8d,
        0x57, 0xe4, 0x40, 0x0a, 0xb5, 0xa1, 0xeb, 0xfa, 0xad, 0x90, 0x56, 0x0a,
        0x1d, 0x79, 0x93, 0xbe, 0x9b, 0xbd, 0x7e, 0x31, 0x5d, 0x6f, 0x36, 0x4a,
        0x0b, 0x3e, 0x13, 0x81, 0x39, 0x13, 0xc7, 0x3e, 0x0c, 0xef, 0x7d, 0xb4,
        0xbc, 0xa7, 0xcf, 0x77, 0xea, 0xca, 0x18, 0xcc, 0x1f, 0x6c, 0x13, 0x7b,
        0x5f, 0x83, 0xff, 0x52, 0x61, 0xf0, 0x78, 0xad, 0xda, 0x8b, 0xcc, 0x84,
        0x43, 0xb9, 0xeb, 0x28, 0x71, 0x27, 0x16, 0xa7, 0xca, 0x58, 0x92, 0xb9,
        0x82, 0x06, 0x85, 0x5e, 0xfa, 0xe4, 0xb0, 0xda, 0xa7, 0xf1, 0xf0, 0x7a,
        0x99, 0xe8, 0x7a, 0xaf, 0x78, 0xfa, 0x2b, 0x11, 0x4e, 0x89, 0x11, 0xa4,
        0x81, 0xc3, 0x63, 0xec, 0xc1, 0x54, 0xdd, 0x8c, 0xba, 0x80, 0x81, 0x9b,
        0x43, 0xb4, 0x39, 0x67, 0x9e, 0x3a, 0x6d, 0x85, 0x06, 0x55, 0xec, 0xcc,
        0xe5, 0x45, 0xaf, 0x5e, 0x2a, 0xce, 0xad, 0xe6, 0x4c, 0xa9, 0x43, 0x5a,
        0x69, 0xe4, 0x2b, 0xdd, 0x74, 0xd3, 0xdd, 0x79, 0xb7, 0x83, 0xeb, 0x27,
        0x88, 0x00, 0x9e, 0x8d, 0x23, 0xa1, 0x8b, 0xdc, 0x2c, 0x53, 0xd8, 0xe2,
        0xcf, 0xe2, 0x42, 0x76, 0xf7, 0x89, 0x2b, 0x9d, 0xc2, 0xca, 0x93, 0x04,
        0xe3, 0x59, 0xe9, 0xbb, 0xb2, 0xd7, 0xa1, 0x8c, 0x1b, 0xd5, 0x70, 0xfe,
        0x91, 0xc2, 0x87, 0xd3, 0xca, 0xe7, 0x60, 0xb8, 0x76, 0xdf, 0x7c, 0x48,
        0x26, 0x3a, 0x5b, 0x61, 0x9e, 0x90, 0xa5, 0xad, 0x92, 0xee, 0x51, 0x68,
        0xcd, 0x19, 0x56, 0xd0, 0x4c, 0x9c, 0x3a, 0x37, 0x87, 0x4d, 0x8e, 0xb1,
        0xd7, 0x83, 0x02, 0xdc, 0xe4, 0xdf, 0xbd, 0x48, 0xea, 0xe4, 0x09, 0xaa,
        0x86, 0xce, 0xdd, 0x1b, 0x61, 0x0e, 0x8e, 0xa2, 0x6c, 0xc2, 0x94, 0x56,
        0x62, 0xe8, 0xdf, 0x1d, 0x1d, 0x8e, 0xb4, 0xbb, 0x93, 0x88, 0xe0, 0xa8,
        0x58, 0x0e, 0xf7, 0x15, 0x4d, 0x44, 0x8b, 0x5d, 0x23, 0x1b, 0x5c, 0x3d,
        0xdf, 0xb3, 0xe5, 0x51, 0xdd, 0x48, 0xe2, 0x71, 0x8c, 0xf7, 0x2d, 0x8f,
        0x7b, 0x35, 0x2c, 0x19, 0x17, 0x9b, 0x87, 0xee, 0xe2, 0x6a, 0xfc, 0x7e,
        0x82, 0x5c, 0x25, 0x93, 0xfe, 0xd7, 0x39, 0x1e, 0x0e, 0x25, 0xcd, 0xe3,
        0xc4, 0xf3, 0xce, 0x2d, 0x6c, 0x57, 0xc4, 0x48, 0xfb, 0x68, 0x38, 0x5b,
        0x31, 0x00, 0xd9, 0xbf, 0x68, 0x42, 0xe4, 0xf3, 0xfd, 0x3d, 0x57, 0xf5,
        0x3a, 0x36, 0xcc, 0x33, 0xca, 0xa6, 0x06, 0x7d, 0x8c, 0x3a, 0x13, 0x5c,
        0x8d, 0xb3, 0x67, 0xb8, 0xd5, 0xec, 0x4e, 0x3e, 0x66, 0x2f, 0xd2, 0x3a,
        0xf8, 0x42, 0x41, 0xf3, 0x6d, 0xc4, 0x20, 0x0a, 0x88, 0x9f, 0x9b, 0xa4,
        0x07, 0x18, 0x36, 0x81, 0xf5, 0x54, 0x4a, 0x01, 0xa7, 0xed, 0xc7, 0x23,
        0xc5, 0x94, 0x4a, 0x4d, 0x7f, 0x8a, 0xcb, 0x19, 0xa0, 0x86, 0xb0, 0xb8,
        0xfa, 0x07, 0xf1, 0xab, 0x13, 0xf9, 0x1d, 0xdf, 0xe3, 0xac, 0xfc, 0x62,
        0x2e, 0xb6, 0xa9, 0xcc, 0xa1, 0x19, 0x90, 0xa9, 0x07, 0xec, 0x90, 0xe8,
        0x3c, 0x4f, 0xc7, 0x7a, 0x4b, 0x4d, 0x06, 0x0d, 0x5d, 0xd4, 0x15, 0xed,
        0x45, 0x86, 0x2a, 0xe0, 0xba, 0xb1, 0x78, 0xf4, 0x41, 0xe4, 0xa6, 0x70,
        0xfc, 0xe9, 0x18, 0x2e, 0xd4, 0xcb, 0x3a, 0x83, 0xb2, 0x75, 0x1f, 0x9f,
        0x94, 0x00, 0xbb, 0x8e, 0x88, 0x15, 0x13, 0xd0, 0xdb, 0xb4, 0xfd, 0xc4,
        0xa7, 0x03, 0x00, 0x7f, 0xbb, 0xa5, 0xe7, 0x7d, 0x01, 0xa3, 0xfd, 0x5d,
        0x66, 0x14, 0xb0, 0x60, 0x07, 0xef, 0xc1, 0x11, 0x63, 0x29, 0x08, 0x52,
        0x73, 0xfe, 0xb6, 0xd5, 0x9b, 0x94, 0xcb, 0xa6, 0x18, 0x47, 0xe6, 0x2a,
        0xfa, 0x12, 0xa7, 0xe1, 0x83, 0x39, 0x54, 0x19, 0x9c, 0x11, 0xa5, 0xe7,
        0xf8, 0xb8, 0x60, 0x30, 0x90, 0xd0, 0x02, 0xfe, 0x7a, 0x90, 0x6d, 0x8c,
        0xdc, 0xb5, 0xe8, 0xf6, 0x88, 0x3b, 0x9b, 0x26, 0x25, 0x27, 0x04, 0x1d,
        0x91, 0xae, 0xe3, 0x29, 0x90, 0x72, 0x1c, 0x30, 0xa9, 0xef, 0x38, 0x68,
        0x0f, 0xd8, 0x4a, 0x1c, 0x5c, 0x34, 0x08, 0x63, 0xb3, 0xb2, 0xae, 0xc3,
        0xbc, 0x58, 0x4f, 0x26, 0xf0, 0x19, 0x1a, 0xa3, 0x65, 0x85, 0xfb, 0x5a,
        0x49, 0x1a, 0x63, 0xce, 0x75, 0xa6, 0x12, 0x0a, 0x87, 0x4a, 0x83, 0x19,
        0x90, 0x6e, 0x26, 0x3d, 0x9b, 0x7f, 0xf1, 0xc9, 0x8c, 0xd6, 0x81, 0xc1,
        0x21, 0x81, 0x89, 0xe8, 0xed, 0x50, 0x11, 0x34, 0x8d, 0xc7, 0x59, 0x4d,
        0x46, 0x78, 0x86, 0x3c, 0x91, 0xcd, 0x97, 0x2c, 0x07, 0x8e, 0x7c, 0x2a,
        0x51, 0x8e, 0xc7, 0xfb, 0xac, 0x29, 0x7c, 0x69, 0xf4, 0xad, 0xbc, 0x57,
        0x72, 0x99, 0x84, 0x4d, 0xdf, 0x06, 0x38, 0x1a, 0x20, 0xa9, 0x31, 0xb4,
        0x61, 0x90, 0x5a, 0xd4, 0x9b, 0xad, 0xe7, 0xe4, 0x16, 0x3e, 0x5e, 0xbe,
        0xd9, 0x74, 0x35, 0xd6, 0x6d, 0xc6, 0x2b, 0x31, 0x1a, 0xe9, 0x97, 0x6c,
        0x85, 0xf6, 0xc6, 0x0c, 0xc6, 0x6d, 0x9d, 0x8c, 0x02, 0xf4, 0xc4, 0x2d,
        0x6d, 0x2b, 0x5d, 0x92, 0x9f, 0x42, 0x97, 0x3b, 0xd8, 0x6d, 0x74, 0x83,
        0x35, 0xf3, 0x6d, 0xfa, 0x93, 0x5c, 0x03, 0x78, 0xfb, 0x26, 0xa1, 0x95,
        0xd9, 0xc6, 0xea, 0xff, 0xbb, 0x4a, 0x4b, 0xb2, 0x65, 0x2d, 0x23, 0xa0,
        0x2c, 0x31, 0xf0, 0x2f, 0x8a, 0x0f, 0x7c, 0xec, 0xc8, 0x7b, 0xa4, 0xe6,
        0x65, 0xf4, 0xc6, 0xc8, 0x4e, 0xfd, 0xda, 0xdf, 0x01, 0x1b, 0x9f, 0x96,
        0x86, 0x82, 0xba, 0xa4, 0xf4, 0x4b, 0x11, 0xc8, 0xc5, 0x39, 0x88, 0x1e,
        0x93, 0x5e, 0xcc, 0xc6, 0x96, 0x3c, 0xcf, 0x47, 0xeb, 0x77, 0x2a, 0xe2,
        0x4d, 0x3d, 0xad, 0x03, 0xc6, 0xaa, 0x4e, 0xc6, 0xd5, 0x57, 0x18, 0x0a,
        0x5d, 0x49, 0xaf, 0xaa, 0xef, 0xc2, 0xb9, 0xfd, 0x41, 0xc7, 0x4f, 0x59,
        0x76, 0x92, 0x7f, 0x49, 0x4f, 0x00, 0xde, 0xc7, 0xf2, 0x50, 0xea, 0x01,
        0x4c, 0x38, 0xe2, 0xed, 0xdc, 0xf2, 0x47, 0x3c, 0x3e, 0x53, 0x2b, 0x38,
        0x36, 0x2f, 0x13, 0x83, 0xb2, 0x64, 0xf5, 0x9c, 0xf6, 0xf9, 0xbd, 0x14,
        0x6f, 0xb2, 0x37, 0xe2, 0x03, 0x84, 0xd6, 0x5e, 0xbd, 0x8e, 0x2d, 0x12,
        0xeb, 0xa1, 0xe3, 0x8d, 0x21, 0x6b, 0x46, 0xd1, 0xf0, 0x7e, 0x1b, 0xc2,
        0xa6, 0x9c, 0x04, 0xcc, 0xbc, 0x65, 0x9e, 0x02, 0xee, 0x0a, 0xd5, 0xf7,
        0x81, 0x99, 0x55, 0xfe, 0xa9, 0x5b, 0xed, 0x23, 0x52, 0x8f, 0x9f, 0x52,
        0x06, 0x33, 0x79, 0xad, 0x11, 0xac, 0xb1, 0xeb, 0xb5, 0x93, 0x27, 0x57,
        0xc7, 0xc2, 0xe2, 0x71, 0x4e, 0x21, 0xb5, 0x39, 0x50, 0xa6, 0xcf, 0x0b,
        0xe4, 0xa7, 0x2e, 0x95, 0xa5, 0x89, 0x1f, 0xa3, 0xd8, 0x88, 0x84, 0x6b,
        0xdd, 0xaa, 0x4d, 0xdf, 0xde, 0x90, 0x2a, 0xc1, 0x90, 0xbf, 0x02, 0x56,
        0xa2, 0x78, 0x85, 0x85, 0x87, 0x66, 0x48, 0x54, 0x1f, 0xd4, 0x3c, 0xf2,
        0x80, 0x81, 0x16, 0x96, 0xad, 0x99, 0x3f, 0xd2, 0x45, 0xb9, 0x18, 0x51,
        0x45, 0x25, 0x3c, 0x8f, 0xc1, 0xa6, 0xd6, 0xe7, 0x4b, 0x4e, 0x78, 0xd9,
        0x29, 0x3c, 0x4d, 0x29, 0x69, 0x08, 0xd2, 0x28, 0xe3, 0x89, 0x83, 0x65,
        0xc5, 0xfd, 0x5d, 0xd0, 0x7f, 0xde, 0xc9, 0x93, 0x85, 0x07, 0xc6, 0xc6,
        0xdf, 0x6b, 0x37, 0xdd, 0xa0, 0x20, 0x8a, 0xae, 0x26, 0xd1, 0x82, 0x64,
        0xfe, 0x86, 0x5a, 0x50, 0x75, 0x9c, 0x47, 0x9e, 0x39, 0x4b, 0x74, 0xd8,
        0x48, 0xcf, 0x6f, 0x66, 0x22, 0x15, 0x11, 0x12, 0x15, 0x2f, 0x61, 0x9c,
        0xa7, 0xe2, 0x6d, 0x0a, 0x56, 0x7f, 0x3a, 0x65, 0xd5, 0x4f, 0x36, 0x49,
        0x16, 0x41, 0xfd, 0x40, 0xb5, 0x06, 0xbf, 0xdd, 0x30, 0x60, 0x24, 0x14,
        0xd8, 0x9c, 0x33, 0xa3, 0x4d, 0x4a, 0x63, 0xf9, 0xc6, 0x98, 0x7c, 0x43,
        0x67, 0x34, 0xfd, 0x44, 0x6b, 0xe3, 0x9d, 0x0e, 0x08, 0xbc, 0x17, 0x57
    ]),
    "Deep Sky Blue": new Uint8Array([
        0x0c, 0x68, 0x94, 0x54, 0x1f, 0x70, 0xf4, 0xd4, 0xd0, 0x7d, 0x20, 0x73,
        0xbd, 0x66, 0xff, 0x21, 0x10, 0x16, 0xc9, 0xd6, 0x1b, 0xc1, 0x40, 0x2c,
        0x15, 0x8b, 0x41, 0x4f, 0xb9, 0x5c, 0xf9, 0x5b, 0x4b, 0x73, 0x8e, 0x26,
        0xf9, 0x20, 0x9c, 0x39, 0x13, 0xb2, 0x43, 0x9a, 0x46, 0x95, 0xfd, 0x36,
        0x87, 0x64, 0x2d, 0x3a, 0xf6, 0x53, 0x62, 0xf8, 0x31, 0xdf, 0xb3, 0x6a,
        0x24, 0x5d, 0x55, 0x4f, 0xb0, 0x45, 0x33, 0x15, 0x8c, 0x91, 0xa2, 0x60,
        0x37, 0x31, 0xec, 0x3a, 0x37, 0x72, 0x6a, 0x2c, 0x26, 0xb7, 0xaf, 0xd5,
        0x93, 0xa7, 0x53, 0x76, 0x48, 0xd3, 0x21, 0x16, 0x36, 0xd0, 0x3e, 0xf1,
        0x9f, 0x60, 0x1b, 0x2d, 0x5d, 0xe8, 0xaf, 0xb8, 0x0b, 0x29, 0xe1, 0xe2,
        0x46, 0x35, 0x37, 0x69, 0x2e, 0x9b, 0x23, 0x8c, 0xb7, 0xb9, 0xe9, 0xa5,
        0x92, 0xb6, 0xf7, 0x02, 0x1d, 0x34, 0x30, 0x4c, 0x82, 0xec, 0x50, 0x55,
        0x06, 0xad, 0xae, 0x67, 0xbe, 0x23, 0x1c, 0x03, 0x5f, 0x79, 0x33, 0xfb,
        0xad, 0xeb, 0xfc, 0x5a, 0x13, 0xcc, 0x0e, 0xfb, 0x22, 0x97, 0x57, 0xce,
        0xc2, 0x7d, 0xfa, 0x49, 0xc5, 0xf5, 0x54, 0xdd, 0x08, 0x9b, 0x8f, 0xe0,
        0x74, 0x32, 0xc7, 0xee, 0xaf, 0x61, 0x03, 0xa8, 0xe7, 0x18, 0x79, 0x4b,
        0x7b, 0x4e, 0xfc, 0x7a, 0x33, 0x77, 0x09, 0x27, 0xf9, 0x81, 0xcb, 0x17,
        0xae, 0x79, 0x1e, 0x3d, 0x45, 0xc8, 0x20, 0x44, 0xe6, 0x09, 0x88, 0x37,
        0xd3, 0xd2, 0x1e, 0xa8, 0x6b, 0x9c, 0x94, 0x10, 0x93, 0xdf, 0xe9, 0xc0,
        0xaf, 0x64, 0x13, 0x1c, 0x4d, 0x59, 0x3b, 0x04, 0x6c, 0x83, 0x82, 0x40,
        0xea, 0xfb, 0x28, 0x96, 0x6a, 0x06, 0x6b, 0x37, 0x81, 0x50, 0x1d, 0x76,
        0xa9, 0x4d, 0xbe, 0xef, 0x69, 0x1e, 0x8e, 0xf9, 0x36, 0xe4, 0xe3, 0x13,
        0x7f, 0x1c, 0x68, 0x3b, 0xf3, 0xac, 0x23, 0x95, 0x8a, 0x7a, 0x11, 0xae,
        0x14, 0x18, 0xc8, 0xee, 0x85, 0x47, 0x3a, 0xc4, 0xa7, 0x65, 0x73, 0xbe,
        0xb7, 0xf4, 0xc7, 0xed, 0x0a, 0x34, 0x04, 0xf4, 0xc4, 0x5f, 0xa3, 0x69,
        0xe9, 0xeb, 0xc6, 0x97, 0xec, 0x0a, 0x37, 0x33, 0x33, 0x36, 0xa5, 0x19,
        0x06, 0x11, 0x3c, 0xbf, 0x45, 0xd6, 0xec, 0xff, 0x5f, 0x69, 0xda, 0xa5,
        0x8d, 0x18, 0x35, 0x1d, 0x7c, 0xc3, 0x1a, 0x08, 0x89, 0xf4, 0xd0, 0xbc,
        0x3e, 0xe4, 0x91, 0xa0, 0xcb, 0xc2, 0x7c, 0x25, 0xad, 0xd0, 0x2f, 0x03,
        0x48, 0x0b, 0xb3, 0xd9, 0x34, 0xe4, 0x03, 0x2b, 0x65, 0xdb, 0xf0, 0xab,
        0x6e, 0x07, 0xec, 0x17, 0xa7, 0xea, 0x03, 0xf6, 0xd5, 0xf2, 0x85, 0x7e,
        0xe8, 0x98, 0xb0, 0xf2, 0xdd, 0x85, 0xae, 0xfd, 0x5e, 0xbb, 0xb1, 0xeb,
        0x16, 0x5e, 0x7c, 0xa0, 0x05, 0x20, 0x80, 0x01, 0xb6, 0x72, 0xa1, 0x39,
        0xce, 0xe9, 0x7e, 0x70, 0xde, 0xac, 0xef, 0xb0, 0x88, 0x5f, 0x77, 0x44,
        0xce, 0x63, 0x82, 0x3f, 0x29, 0xe8, 0xb8, 0x3b, 0x1f, 0xaf, 0x22, 0x74,
        0x7a, 0xe1, 0x71, 0x5d, 0x7a, 0x4a, 0xc0, 0x05, 0xc7, 0xbf, 0x16, 0xb0,
        0xdf, 0xdc, 0x39, 0x59, 0xdf, 0x1a, 0x98, 0x3a, 0xdc, 0xe2, 0xd2, 0xb4,
        0xa0, 0x82, 0x68, 0x5e, 0x47, 0x7a, 0xc5, 0xfb, 0x13, 0x17, 0x35, 0x1f,
        0x25, 0x9b, 0x6d, 0x94, 0xe1, 0x45, 0x1f, 0xa1, 0x90, 0x4c, 0xf2, 0x64,
        0x17, 0x14, 0xa5, 0xa0, 0x50, 0xb0, 0x06, 0x8a, 0x11, 0x10, 0xf9, 0x48,
        0x25, 0xa6, 0xa4, 0x03, 0x4b, 0x28, 0xe3, 0x34, 0xe8, 0x37, 0x7a, 0x20,
        0x6d, 0x14, 0x36, 0xa0, 0x1f, 0xf3, 0x96, 0x97, 0xef, 0x70, 0xa7, 0x9d,
        0x46, 0x86, 0x59, 0xf4, 0x11, 0x8e, 0xb9, 0x6b, 0xc6, 0xe9, 0xb5, 0x88,
        0x6f, 0x03, 0x80, 0x4b, 0x12, 0x64, 0x87, 0xda, 0x89, 0x07, 0x18, 0xf4,
        0x12, 0xcd, 0xec, 0x26, 0x0a, 0x88, 0x7e, 0x54, 0xbf, 0x3a, 0x15, 0x7e,
        0x4a, 0x21, 0x92, 0xeb, 0x93, 0x46, 0x7d, 0x27, 0xb6, 0xf2, 0x01, 0x53,
        0x42, 0xa0, 0x6a, 0x76, 0x9a, 0x71, 0x28, 0x3d, 0x47, 0xf3, 0x7b, 0x10,
        0xa1, 0x56, 0x57, 0xb1, 0x0d, 0xc3, 0x35, 0x2e, 0x46, 0x8c, 0x56, 0x62,
        0x62, 0xd6, 0xad, 0xee, 0xf6, 0xf5, 0x55, 0xf1, 0xb6, 0xa7, 0xea, 0xba,
        0x72, 0x55, 0x73, 0xc7, 0x18, 0xe2, 0x0d, 0x47, 0xb2, 0x61, 0xa3, 0x21,
        0x0d, 0xc4, 0x93, 0xb0, 0x20, 0x74, 0x47, 0x31, 0x99, 0x33, 0x13, 0x56,
        0x09, 0xce, 0xe1, 0x84, 0xa5, 0x15, 0x90, 0xb1, 0xc6, 0x0f, 0xbf, 0xb4,
        0x29, 0x6d, 0x8a, 0x53, 0xee, 0x27, 0x7f, 0x15, 0xe3, 0x48, 0x9f, 0xb3,
        0x38, 0x8e, 0x3e, 0x69, 0xdf, 0xb3, 0x4f, 0xe0, 0x4a, 0xef, 0x1d, 0x18,
        0xef, 0xd7, 0xa3, 0x88, 0xd7, 0x92, 0xbc, 0x89, 0x4b, 0xa0, 0x1f, 0x8c,
        0xb4, 0xf9, 0xd9, 0x4b, 0x3c, 0xd5, 0x20, 0x8f, 0x8a, 0xb9, 0x03, 0x7b,
        0xeb, 0x8f, 0xfa, 0xd7, 0x63, 0x9e, 0xdf, 0xc7, 0x81, 0x36, 0x84, 0xb9,
        0xb9, 0xa6, 0x1f, 0x20, 0x00, 0xe7, 0x47, 0x23, 0x99, 0x41, 0xee, 0x58,
        0x6c, 0x5f, 0x48, 0xcd, 0x45, 0x9c, 0xa6, 0x1e, 0x7f, 0x38, 0x0d, 0x2b,
        0xbc, 0xf6, 0xaa, 0x99, 0x54, 0x62, 0x35, 0x46, 0xed, 0x6b, 0xc9, 0x0a,
        0x2f, 0xff, 0xab, 0x10, 0xef, 0xee, 0x5f, 0xd4, 0x98, 0x01, 0x9a, 0xbd,
        0x0a, 0xcb, 0xf1, 0x41, 0xbf, 0x3d, 0xe3, 0x7d, 0xaf, 0x30, 0x99, 0x1e,
        0x9c, 0xb2, 0x13, 0x72, 0xa8, 0x49, 0x14, 0x23, 0x35, 0xd8, 0xdc, 0xa2,
        0xe4, 0x7d, 0x7b, 0x39, 0x8d, 0x53, 0xcb, 0xd7, 0x25, 0xf4, 0x57, 0x51,
        0xdf, 0xd9, 0xf9, 0xe5, 0xeb, 0x4c, 0xab, 0xf6, 0xa2, 0x64, 0x75, 0x96,
        0xd0, 0xb4, 0x1c, 0x34, 0xde, 0x43, 0xdd, 0x1d, 0x55, 0x47, 0x2a, 0xae,
        0x3d, 0xdf, 0x6b, 0xfc, 0x6e, 0xcf, 0x03, 0xbe, 0x9e, 0x78, 0x90, 0xa3,
        0xea, 0xc0, 0xad, 0xa4, 0x7e, 0xce, 0x65, 0xdd, 0x75, 0xa6, 0x49, 0x8b,
        0x6b, 0x2d, 0x13, 0xed, 0x5d, 0xb8, 0x2a, 0xa2, 0x69, 0x03, 0x07, 0x8f,
        0xf8, 0x2c, 0x41, 0x10, 0x92, 0xce, 0x4d, 0x26, 0xbc, 0x93, 0xa7, 0xce,
        0x9a, 0xce, 0x7d, 0x1f, 0x83, 0xc6, 0xd1, 0xbb, 0x96, 0x67, 0x5a, 0x0d,
        0xaf, 0x3a, 0xf8, 0x0f, 0x09, 0xf2, 0xbd, 0xd4, 0xb1, 0xd1, 0x14, 0x80,
        0x3e, 0x60, 0xd7, 0x2b, 0x28, 0xf2, 0xc4, 0xbf, 0x77, 0xfb, 0x07, 0x54,
        0x6f, 0xe6, 0x8a, 0x8f, 0x07, 0xc7, 0x1b, 0xc4, 0xfc, 0xf1, 0xc2, 0x5e,
        0x39, 0xd9, 0x94, 0x3a, 0x46, 0xe0, 0x17, 0xdb, 0x0f, 0xd7, 0x6e, 0xc2,
        0x15, 0xde, 0xa9, 0x29, 0xe2, 0xaa, 0x5f, 0x46, 0xb2, 0xc1, 0x98, 0xae,
        0xad, 0x27, 0xfe, 0xbd, 0x15, 0xbd, 0xa7, 0x01, 0xcf, 0xbe, 0x0d, 0xf2,
        0x06, 0x70, 0x4d, 0xc6, 0xc0, 0x72, 0xed, 0xb6, 0xe6, 0x7b, 0x65, 0xd0,
        0xe0, 0x61, 0xcf, 0x98, 0x41, 0xdc, 0x7a, 0xe3, 0xcd, 0x5b, 0x64, 0xe5,
        0x8b, 0x36, 0x24, 0xa7, 0xd9, 0x01, 0xff, 0xbe, 0x2e, 0xe3, 0x7a, 0x6d,
        0x21, 0xb2, 0x6a, 0x12, 0x70, 0x4c, 0x1a, 0xaa, 0xae, 0xbf, 0x88, 0xef,
        0xe1, 0x43, 0x91, 0xa8, 0xcb, 0x40, 0x89, 0x28, 0xa6, 0xfe, 0x05, 0x5f,
        0x22, 0x89, 0x5a, 0x6d, 0x78, 0x9c, 0x7e, 0xab, 0xcd, 0xfa, 0x54, 0x0d,
        0x5d, 0xa8, 0x3c, 0x3b, 0x5c, 0xa9, 0x44, 0x8f, 0xff, 0xb8, 0xcc, 0x9a,
        0xab, 0xab, 0xa6, 0x4e, 0xbd, 0x41, 0x36, 0xd7, 0x8f, 0x90, 0xbc, 0x96,
        0x71, 0xcb, 0xaa, 0xbc, 0x6a, 0x55, 0x07, 0x8c, 0x36, 0x25, 0x80, 0x92,
        0x92, 0x48, 0xb3, 0xb8, 0x3b, 0xeb, 0x43, 0x31, 0xc2, 0xe1, 0x0b, 0x60,
        0xa7, 0x60, 0xc0, 0x74, 0x95, 0x18, 0x95, 0x33, 0xb1, 0x7e, 0x65, 0xf4,
        0xf9, 0xda, 0xa4, 0xed, 0x6a, 0x40, 0x19, 0xd7, 0x23, 0xa8, 0xde, 0xa4,
        0x65, 0x2f, 0xf9, 0x14, 0x42, 0xb7, 0x3e, 0x6f, 0x00, 0x75, 0xdb, 0xba,
        0xa0, 0x9d, 0x7c, 0x5c, 0xa6, 0xa9, 0xbb, 0xde, 0xbc, 0xbe, 0xbc, 0xd6,
        0x84, 0xc6, 0xd7, 0xc6, 0x94, 0x04, 0x05, 0x0f, 0xbe, 0x2f, 0x6c, 0x1a,
        0xa8, 0x9a, 0xe4, 0x5d, 0xb2, 0x3c, 0x47, 0x22, 0x20, 0x08, 0x92, 0x87,
        0x14, 0x3f, 0x90, 0x98, 0x81, 0xfe, 0x7d, 0x3d, 0xa2, 0x8a, 0xdb, 0xb4,
        0x0b, 0x5c, 0xdf, 0xe1, 0x1b, 0x34, 0xe0, 0x48, 0x7d, 0xff, 0xe9, 0x70,
        0x69, 0xe0, 0xb1, 0x82, 0x60, 0x97, 0xc6, 0xba, 0xf4, 0x76, 0xe5, 0xf1,
        0xcc, 0x68, 0xb0, 0xd0, 0x95, 0xe0, 0x34, 0xf6, 0xef, 0xbe, 0x9d, 0xc3,
        0x03, 0x3b, 0x2a, 0xed, 0x22, 0x25, 0xd7, 0xe7, 0xc2, 0x25, 0xd3, 0xe3,
        0x6f, 0xb8, 0x16, 0x5e, 0xf4, 0x7e, 0x9c, 0xfa, 0x06, 0xab, 0x53, 0x23,
        0x81, 0x30, 0xef, 0x6e, 0x55, 0x01, 0x9d, 0x24, 0x4a, 0x56, 0x01, 0x13,
        0x0e, 0xf7, 0xe4, 0x30, 0xfc, 0x07, 0xdf, 0xcd, 0xfc, 0xc1, 0x50, 0x07,
        0xb9, 0xb4, 0x2f, 0x12, 0x9b, 0x46, 0x97, 0x6e, 0xea, 0x80, 0x4e, 0x6c,
        0x31, 0x58, 0xee, 0x48, 0x92, 0xe4, 0x03, 0xeb, 0x6d, 0xb8, 0x38, 0x68,
        0x21, 0x11, 0x8f, 0x2b, 0x38, 0xe0, 0x9b, 0xcb, 0xc6, 0xe2, 0xe2, 0x1c,
        0xa6, 0x15, 0xed, 0x3a, 0xac, 0x42, 0x02, 0x8a, 0xab, 0xda, 0x9b, 0xbe,
        0xf9, 0x0c, 0x51, 0x0d, 0x50, 0x97, 0xde, 0x26, 0xf5, 0x64, 0xea, 0xbc,
        0x8b, 0xd4, 0x48, 0x2a, 0x78, 0x32, 0xb2, 0xf6, 0xb1, 0x1d, 0x30, 0x2c,
        0x68, 0xff, 0x50, 0xb0, 0x16, 0x0e, 0x17, 0x34, 0xa2, 0x25, 0x8e, 0x22,
        0x83, 0x73, 0x7f, 0x70, 0xf2, 0x31, 0x44, 0x42, 0x11, 0xef, 0x78, 0x62,
        0xd1, 0x4e, 0xac, 0xa3, 0xbe, 0x59, 0x21, 0xd3, 0x09, 0x36, 0xd3, 0xf8,
        0xe0, 0xe4, 0xb7, 0x04, 0x2a, 0x05, 0xe2, 0x23, 0x7a, 0x6a, 0xef, 0xba,
        0x08, 0xa2, 0x86, 0x52, 0x6a, 0x9b, 0xfb, 0xf8, 0x90, 0x17, 0x90, 0x89,
        0xf9, 0x34, 0x02, 0x2e, 0x8f, 0x6a, 0xd8, 0x95, 0xbd, 0xf1, 0x72, 0xde,
        0x76, 0x78, 0x88, 0x45, 0x11, 0xec, 0x38, 0xc6, 0x86, 0x01, 0x31, 0x37,
        0xcf, 0xe4, 0x31, 0xff, 0xe4, 0xd1, 0xdd, 0xec, 0x86, 0x3c, 0x68, 0xd5,
        0x8c, 0x7c, 0x74, 0xe0, 0xa7, 0xf4, 0x88, 0x19, 0x76, 0x96, 0xb0, 0xd4,
        0x7d, 0xd6, 0x3c, 0x82, 0x08, 0x56, 0xc4, 0xbb, 0x2f, 0x3f, 0xee, 0x89,
        0x9b, 0xc8, 0xf3, 0x98, 0x7e, 0x0d, 0x41, 0xfd, 0x1c, 0x97, 0x5b, 0x0f,
        0xf2, 0x8e, 0xc2, 0x12, 0xb3, 0x74, 0x69, 0xc9, 0x08, 0xce, 0x48, 0x99,
        0xc4, 0xc9, 0x41, 0xba, 0x91, 0x34, 0xd3, 0x35, 0x83, 0x8f, 0xea, 0xd6,
        0xf2, 0x4a, 0x28, 0x31, 0xe3, 0x9b, 0x99, 0x8c, 0x89, 0x84, 0x74, 0xc6,
        0xc7, 0x11, 0x5f, 0x3f, 0x3f, 0x0c, 0x41, 0x79, 0x5b, 0xad, 0x3a, 0x1f,
        0x94, 0x8f, 0xc7, 0xe4, 0x9a, 0xe4, 0x89, 0x36, 0x25, 0xe3, 0x54, 0xc2,
        0x82, 0x8f, 0x1c, 0x21, 0x3f, 0x0f, 0x5e, 0xeb, 0x76, 0xcc, 0x03, 0x66,
        0x07, 0x9a, 0xab, 0x71, 0x39, 0x70, 0xd9, 0xf4, 0xfb, 0xe3, 0x73, 0x87,
        0xca, 0x22, 0x7d, 0xf1, 0x3c, 0xfa, 0x39, 0x01, 0x4d, 0xca, 0x5f, 0x4d,
        0x43, 0xf7, 0x18, 0xbf, 0xb5, 0xc1, 0x2b, 0x28, 0xf7, 0xac, 0xae, 0x9a,
        0xf5, 0xf4, 0x2a, 0x42, 0xe0, 0x21, 0x7a, 0x12, 0x14, 0x92, 0xa4, 0x10,
        0xac, 0x84, 0x93, 0x82, 0x04, 0xc3, 0xb0, 0x08, 0x9a, 0x88, 0xe0, 0x42,
        0xf4, 0xea, 0x2f, 0x15, 0xb8, 0x84, 0x93, 0xa9, 0xe2, 0x0b, 0x97, 0x89,
        0x4d, 0x03, 0x98, 0xb0, 0xd5, 0xdd, 0xe2, 0x24, 0xb6, 0x79, 0xb0, 0x48,
        0x13, 0x21, 0x36, 0xda, 0x70, 0xe0, 0x8c, 0x8d, 0x8c, 0x8e, 0xa4, 0x10,
        0xaa, 0xd5, 0x39, 0xd5, 0x3c, 0x6c, 0x71, 0x38, 0x5d, 0x70, 0x2a, 0x46,
        0x77, 0xf4, 0xf2, 0x67, 0x1b, 0x05, 0x5c, 0x5a, 0xd2, 0xd6, 0x4e, 0x16,
        0xa0, 0x7b, 0x93, 0xbe, 0xa7, 0x25, 0xf3, 0x48, 0xac, 0xe3, 0x67, 0x7f,
        0xb2, 0xa4, 0xb8, 0xe6, 0xb7, 0x20, 0x68, 0x93, 0x00, 0x1e, 0x76, 0x7b,
        0xff, 0x6f, 0xa6, 0xc4, 0x76, 0xaf, 0x50, 0xd6, 0xde, 0x94, 0x4f, 0xcc,
        0xc7, 0x0d, 0xea, 0xea, 0xe9, 0x11, 0xe2, 0x51, 0x98, 0x44, 0x53, 0x2b,
        0xc4, 0x04, 0x27, 0x2c, 0xa1, 0x3d, 0xed, 0xef, 0x66, 0xa9, 0x0b, 0xdf,
        0x58, 0x27, 0xe2, 0xbc, 0x1e, 0x39, 0xdd, 0x09, 0xfc, 0xfe, 0x19, 0x5e,
        0x74, 0x7e, 0x78, 0x96, 0x33, 0x5a, 0x60, 0x05, 0xc8, 0xe5, 0x23, 0x1d,
        0xb7, 0x47, 0x94, 0x82, 0x41, 0xe9, 0x3b, 0xdd, 0xd6, 0x4b, 0x0b, 0x07,
        0x22, 0xc7, 0xc5, 0x6a, 0xca, 0x21, 0x6b, 0x69, 0xa8, 0xd8, 0xef, 0x5a,
        0xf6, 0x41, 0x35, 0xfe, 0xd7, 0xc7, 0xcd, 0x26, 0x8f, 0x28, 0x3d, 0x95,
        0xb9, 0x4b, 0x23, 0x11, 0xa4, 0x4c, 0x9e, 0xde, 0x8f, 0x02, 0x7a, 0xc7,
        0x57, 0x0a, 0xc3, 0x39, 0xb1, 0xb3, 0x64, 0xb4, 0xc9, 0xb7, 0x10, 0x14,
        0xfe, 0xce, 0xc9, 0x9b, 0x3a, 0xee, 0x82, 0x84, 0x7d, 0x57, 0x78, 0xb1,
        0xe2, 0x05, 0x7e, 0x02, 0x8f, 0xa1, 0x2c, 0x3a, 0xfc, 0x5e, 0xfa, 0x80,
        0xf5, 0xa9, 0x5e, 0x16, 0xcc, 0xaa, 0xe7, 0x4b, 0xc6, 0xd1, 0x4d, 0xa6,
        0x2f, 0x83, 0xa6, 0xa5, 0xb5, 0xa0, 0xc0, 0x2d, 0x20, 0x5e, 0x84, 0x53,
        0x6f, 0x5a, 0x02, 0x78, 0x56, 0x19, 0x0d, 0xec, 0x23, 0xa8, 0x7a, 0x5d,
        0x82, 0xb4, 0x98, 0x41, 0x59, 0xec, 0xab, 0x2b, 0x66, 0xa2, 0x1f, 0x29,
        0x01, 0xa7, 0x82, 0x92, 0x6b, 0x7e, 0x5c, 0x8f, 0xec, 0x2e, 0xcf, 0x54,
        0x48, 0x8c, 0xd1, 0x5a, 0xa5, 0x05, 0xaf, 0x61, 0xf2, 0xd0, 0x4a, 0xb7,
        0x57, 0xb8, 0xf1, 0xca, 0x11, 0x9e, 0x19, 0xc3, 0xad, 0x9d, 0x63, 0xc5,
        0xcf, 0xa4, 0xc4, 0xe4, 0xc6, 0x60, 0x7e, 0x7e, 0x50, 0x3d, 0xa9, 0x0f,
        0x62, 0x25, 0x73, 0x07, 0xa3, 0x93, 0xc7, 0x00, 0x67, 0xca, 0xec, 0x33,
        0x71, 0xf9, 0x43, 0xb3, 0xdf, 0x38, 0xff, 0x72, 0x09, 0x2d, 0xad, 0xac,
        0x47, 0xc6, 0xd2, 0xd1, 0x8a, 0x12, 0x74, 0x26, 0xb9, 0xf7, 0x0e, 0x08,
        0x06, 0xd1, 0xf7, 0xf5, 0x2e, 0x47, 0x4e, 0x29, 0x0f, 0xcc, 0x75, 0xd9,
        0x1e, 0xae, 0xa3, 0xe0, 0xd6, 0x1d, 0xee, 0xd5, 0x16, 0xb7, 0xd7, 0xc0,
        0xda, 0x47, 0xd4, 0x43, 0x08, 0x09, 0x1e, 0x9a, 0x87, 0x9a, 0x18, 0xad,
        0x4d, 0x84, 0x5c, 0xf5, 0x21, 0x15, 0x4b, 0xb3, 0x82, 0x83, 0xd2, 0xf8,
        0x54, 0xc6, 0xe2, 0xad, 0x56, 0x65, 0x8b, 0xb7, 0x08, 0x55, 0x3e, 0xa0,
        0xef, 0x44, 0x11, 0x7e, 0xb6, 0x48, 0xc7, 0xe6, 0x51, 0xc9, 0x8a, 0xe4,
        0x8a, 0x59, 0x19, 0xf5, 0x46, 0xba, 0x28, 0xf8, 0x46, 0xf7, 0xfa, 0x11,
        0x0f, 0x53, 0x71, 0x33, 0x55, 0xc7, 0xe1, 0x2b, 0x95, 0xfe, 0x72, 0x89,
        0x66, 0x17, 0x41, 0xe7, 0xc5, 0x99, 0x36, 0x31, 0xfc, 0xb3, 0x3a, 0xb7,
        0x0f, 0xad, 0x25, 0xe3, 0x8e, 0x2c, 0x10, 0xcd, 0xa7, 0xce, 0x64, 0x00,
        0x34, 0x9a, 0xef, 0xc7, 0x99, 0x6b, 0x64, 0xa9, 0xe7, 0xd3, 0xf4, 0x0f,
        0xc7, 0xa6, 0xc4, 0xdc, 0xce, 0xc1, 0x34, 0x62, 0x66, 0x2a, 0xc1, 0xda,
        0xc8, 0x0c, 0x06, 0x72, 0x35, 0x14, 0xb1, 0x2b, 0x04, 0xdf, 0x8b, 0x16,
        0x7e, 0x06, 0x1c, 0x8f, 0xce, 0xb2, 0x3c, 0x20, 0x65, 0x2d, 0xa3, 0xaf,
        0x43, 0x75, 0x9a, 0xa7, 0xbd, 0x36, 0xf3, 0x87, 0x53, 0x9a, 0x07, 0xf4,
        0x4a, 0xa0, 0xd3, 0x44, 0x4e, 0xb4, 0x3d, 0xba, 0xeb, 0x2a, 0x62, 0x73,
        0xa6, 0x6d, 0xf6, 0x8c, 0x7b, 0xac, 0xa5, 0xcf, 0x1e, 0x12, 0x7c, 0x8e,
        0x2d, 0xe2, 0x9f, 0x5d, 0xe7, 0x9d, 0x13, 0xdf, 0x18, 0xda, 0xb8, 0x20,
        0xa9, 0x29, 0xf1, 0x66, 0xb2, 0x33, 0x5a, 0xb2, 0x3b, 0x59, 0xd3, 0x27,
        0x1e, 0xda, 0x78, 0x19, 0xa5, 0x54, 0x80, 0x88, 0x85, 0x68, 0xdf, 0x33,
        0x0c, 0x36, 0xdc, 0x0d, 0xcf, 0xaf, 0x32, 0xa1, 0x3a, 0xcd, 0x35, 0x9f,
        0x08, 0xf2, 0x60, 0xed, 0xc9, 0xc2, 0x10, 0x19, 0x4a, 0xf7, 0x81, 0x51,
        0xba, 0x98, 0x34, 0xae, 0x5d, 0xac, 0xf4, 0xe5, 0x8d, 0xc0, 0x91, 0x5a,
        0x41, 0x46, 0x66, 0xd3, 0x9c, 0x9b, 0xf3, 0x0b, 0x4f, 0xb0, 0x84, 0x03,
        0x13, 0x1f, 0x6f, 0x02, 0x75, 0x8a, 0x47, 0xc3, 0x30, 0x05, 0xfc, 0xd2,
        0x98, 0xc6, 0xca, 0x29, 0xee, 0x80, 0x44, 0x69, 0xbe, 0x0a, 0x4c, 0x30,
        0x8d, 0x5f, 0x14, 0x78, 0x16, 0xae, 0xe7, 0xfe, 0xf6, 0x25, 0x81, 0x0f,
        0xb6, 0xf1, 0x54, 0xa6, 0x24, 0x0a, 0xac, 0x50, 0xfb, 0x01, 0xec, 0xd9,
        0x2e, 0x92, 0x6a, 0x62, 0xe9, 0xd5, 0x1c, 0xf6, 0x83, 0x76, 0xba, 0x1e,
        0xe3, 0xfe, 0x1a, 0x42, 0x92, 0xbb, 0x3c, 0x8f, 0x33, 0xd5, 0xb1, 0xe1,
        0x58, 0x8a, 0x66, 0xff, 0x8d, 0xf2, 0x92, 0x99, 0xf7, 0xc3, 0x73, 0xe8,
        0x10, 0x6c, 0xff, 0x6b, 0x08, 0xd5, 0x6f, 0x17, 0x8f, 0x07, 0x77, 0x03,
        0x75, 0x2f, 0x11, 0x58, 0xba, 0xd5, 0xd5, 0xb4, 0x66, 0xad, 0x55, 0xd0,
        0xbe, 0x41, 0x0f, 0xe6, 0x49, 0xae, 0x4b, 0x0d, 0x68, 0x1e, 0x35, 0x89,
        0xe3, 0xfb, 0x3d, 0x8a, 0x52, 0x17, 0x5f, 0x23, 0x1f, 0xc9, 0x67, 0xee,
        0x92, 0x42, 0x54, 0xf8, 0xc0, 0x30, 0xe4, 0x38, 0xdb, 0x72, 0x1a, 0x7c,
        0xc1, 0x19, 0x29, 0x7f, 0xd1, 0x30, 0x39, 0x37, 0xfc, 0xee, 0x2e, 0x8e,
        0x75, 0x99, 0x97, 0x63, 0x4a, 0xec, 0x7d, 0x1a, 0x55, 0x10, 0x08, 0xc7,
        0x7b, 0x3f, 0x28, 0xd5, 0xf0, 0x0c, 0xcb, 0x57, 0xa2, 0x44, 0x2a, 0xe8,
        0x73, 0x30, 0x51, 0x47, 0x91, 0x4d, 0x99, 0x20, 0x32, 0x2f, 0x14, 0x30,
        0xe7, 0xbf, 0xc2, 0x5f, 0xdd, 0xb8, 0x42, 0x12, 0x0a, 0xbb, 0xa0, 0x93,
        0x91, 0x9c, 0x6f, 0x8d, 0xcc, 0x4e, 0x87, 0xc0, 0xac, 0xed, 0x91, 0x5b,
        0x88, 0xce, 0x72, 0xab, 0x0f, 0x56, 0xb8, 0xd2, 0x0c, 0x7f, 0xcb, 0xa1,
        0x54, 0x43, 0x72, 0x18, 0x66, 0x99, 0x17, 0x0e, 0x09, 0xd4, 0x52, 0xa3,
        0xe8, 0x5b, 0xb8, 0xaa, 0x58, 0xdc, 0xf3, 0x26, 0x79, 0xc7, 0x70, 0x52,
        0x9b, 0xad, 0x3e, 0x30, 0x17, 0xac, 0xba, 0x4f, 0x8d, 0x2d, 0xcc, 0x3d,
        0xa2, 0x8f, 0x1e, 0xca, 0xeb, 0x1d, 0xc7, 0x6a, 0xb4, 0x6a, 0xa0, 0x75,
        0x6a, 0x58, 0x54, 0x57, 0x30, 0xd4, 0x61, 0x9a, 0xe0, 0x74, 0x41, 0x7d,
        0xfe, 0x9a, 0x12, 0x68, 0x34, 0x14, 0xd3, 0xd0, 0x82, 0x71, 0x76, 0x2e,
        0x67, 0x9c, 0x08, 0x33, 0xaf, 0x0c, 0x42, 0x9a, 0x57, 0x2c, 0xa6, 0x68,
        0xa5, 0x66, 0xc7, 0x4a, 0xf4, 0xd4, 0xde, 0xd2, 0x37, 0x44, 0x30, 0x81,
        0x43, 0x11, 0x50, 0x15, 0x1a, 0x7a, 0xb8, 0x71, 0x76, 0x1b, 0xd4, 0x4f,
        0x54, 0x06, 0x8b, 0x7b, 0x7b, 0x60, 0xa4, 0x76, 0x24, 0x2a, 0x0b, 0x15,
        0x54, 0x94, 0xdd, 0xc6, 0x78, 0x70, 0xe1, 0xf5, 0x1e, 0x54, 0x23, 0xac,
        0x28, 0x4d, 0x4b, 0x49, 0xfa, 0xaa, 0xfb, 0xb2, 0x45, 0x26, 0x85, 0x2b,
        0xc9, 0xca, 0x13, 0x5a, 0xea, 0x17, 0x28, 0x38, 0xf1, 0x74, 0x22, 0xdc,
        0x80, 0x2f, 0xf6, 0x9a, 0xaf, 0x88, 0x6d, 0xf6, 0xa3, 0xb1, 0xa5, 0x26,
        0x7c, 0x47, 0x19, 0xae, 0x92, 0x6f, 0x62, 0x50, 0x22, 0xf7, 0xb1, 0x08,
        0xd3, 0xc9, 0x89, 0xab, 0x9a, 0x54, 0x5f, 0x54, 0x26, 0x9b, 0xae, 0xf7,
        0x3f, 0x00, 0x70, 0x37, 0xde, 0x65, 0x89, 0xb6, 0x81, 0xbd, 0x8f, 0x14,
        0x65, 0xa4, 0x54, 0xb0, 0xfc, 0x5e, 0x58, 0x00, 0x6a, 0xe3, 0x70, 0x3b,
        0x21, 0x58, 0x45, 0x4b, 0xdc, 0x93, 0x92, 0x70, 0xba, 0x92, 0x98, 0x18,
        0x90, 0x22, 0x19, 0x8f, 0xd1, 0xcd, 0x48, 0x77, 0x98, 0xd8, 0x80, 0xc7,
        0xa1, 0x12, 0xeb, 0xac, 0x05, 0xea, 0x21, 0x28, 0x88, 0xb6, 0x30, 0xdb,
        0x9c, 0x72, 0xb9, 0x6a, 0xff, 0x10, 0xa0, 0x67, 0xa9, 0x10, 0x61, 0x0c,
        0x4d, 0xbb, 0x40, 0xd9, 0x9d, 0x5d, 0xeb, 0xaf, 0xbd, 0xa1, 0xbe, 0x2f,
        0x67, 0x21, 0x59, 0x82, 0xd6, 0x5b, 0x69, 0xcf, 0xca, 0xd7, 0xfc, 0x7e,
        0x2e, 0xf5, 0x77, 0x4d, 0x99, 0x49, 0x84, 0xe8, 0x4d, 0x4a, 0x77, 0x87,
        0x9d, 0xa8, 0xf6, 0xb7, 0xda, 0x95, 0x5c, 0x06, 0x4f, 0x46, 0x15, 0x86,
        0xec, 0x6a, 0xaa, 0x27, 0x06, 0x7f, 0x45, 0x45, 0xa7, 0x55, 0x73, 0xea,
        0x2c, 0xac, 0xd1, 0xd4, 0x64, 0x3b, 0xa8, 0xca, 0x50, 0xbb, 0xea, 0xb7,
        0xb3, 0x0d, 0x40, 0x06, 0x1d, 0x3f, 0x8f, 0xd8, 0x58, 0xc0, 0x15, 0x0e,
        0x9f, 0x4d, 0x85, 0x44, 0xf1, 0x95, 0xbf, 0x3e, 0xdd, 0xb6, 0x60, 0xb7,
        0xcc, 0xd8, 0x7a, 0x26, 0xce, 0x5d, 0xd0, 0xcf, 0xc3, 0xe1, 0x25, 0xda,
        0x33, 0x02, 0x35, 0xfd, 0xc8, 0xbe, 0x68, 0x98, 0x03, 0x80, 0xea, 0xcb,
        0x30, 0x1f, 0x24, 0x8c, 0xf9, 0xd8, 0xf7, 0x22, 0x33, 0x71, 0xe1, 0xff,
        0x09, 0xb4, 0x51, 0x61, 0x1d, 0x48, 0x3d, 0xdb, 0x6f, 0xdd, 0xd0, 0x4d,
        0x9f, 0x97, 0x00, 0x49, 0xe4, 0xcd, 0xdf, 0x09, 0xb9, 0x88, 0xb3, 0xb7,
        0xcb, 0x3e, 0xe6, 0x85, 0x07, 0x01, 0x04, 0xf3, 0xf5, 0x12, 0x7e, 0xbf,
        0xa2, 0x32, 0xd7, 0x88, 0x96, 0xd0, 0xed, 0x95, 0x65, 0x8a, 0x51, 0x7f,
        0x25, 0x0a, 0x44, 0xea, 0x5f, 0x29, 0x72, 0x9e, 0x13, 0x27, 0xb0, 0xcd,
        0x74, 0x6f, 0xb8, 0xa9, 0x8a, 0x24, 0xfb, 0x35, 0x92, 0x9f, 0x67, 0xb0,
        0xe4, 0xaf, 0x5e, 0x9c, 0xa4, 0x37, 0x85, 0x45, 0x27, 0xfe, 0x6e, 0x92,
        0x6e, 0xb8, 0x65, 0x37, 0xf8, 0x8f, 0xb4, 0x6e, 0x68, 0xdd, 0xad, 0x92,
        0xc5, 0xfc, 0xad, 0x77, 0x3a, 0xd0, 0xe6, 0x37, 0xbd, 0xad, 0xb8, 0x05,
        0x40, 0x2c, 0x1e, 0xb2, 0x33, 0xca, 0xf9, 0xd5, 0xd6, 0xe2, 0x31, 0xb1,
        0xe6, 0x43, 0x7f, 0x15, 0xba, 0x98, 0x9c, 0xfc, 0x92, 0x1b, 0x03, 0xd7,
        0x09, 0x19, 0x8a, 0x33, 0x66, 0xc2, 0x8f, 0x52, 0xcd, 0x8c, 0x3f, 0x47,
        0x62, 0x4f, 0x39, 0xe2, 0x68, 0xf8, 0xf9, 0xa2, 0x20, 0x66, 0x48, 0xe8,
        0xd2, 0xca, 0x51, 0xf3, 0xc5, 0x0f, 0x90, 0xa7, 0x5c, 0xdd, 0xee, 0xbe,
        0x8e, 0x0a, 0xfa, 0x3c, 0xe4, 0x98, 0x37, 0x97, 0x2d, 0xd8, 0x4f, 0x33,
        0xfd, 0xa4, 0x1b, 0xe5, 0xa9, 0xbb, 0xe6, 0x93, 0xcd, 0x47, 0x5d, 0x3e,
        0x9c, 0xfb, 0x62, 0xe4, 0x3b, 0x43, 0xcc, 0x32, 0x6a, 0x36, 0x19, 0xcc,
        0x26, 0x64, 0xc5, 0x45, 0x94, 0x8b, 0x70, 0x2a, 0xf4, 0x90, 0xb2, 0xe0,
        0x48, 0x99, 0xb2, 0x5f, 0xc0, 0xfa, 0x2c, 0x53, 0x71, 0x50, 0xad, 0xb8,
        0xb8, 0xaa, 0x8d, 0xdc, 0xd5, 0xe7, 0x43, 0xb3, 0xd8, 0x3d, 0xa4, 0x88,
        0xe9, 0xfa, 0x04, 0x43, 0xa7, 0x43, 0x0f, 0x24, 0x02, 0x9b, 0xfd, 0xf6,
        0xa5, 0xfb, 0x3a, 0x24, 0x10, 0x63, 0xbd, 0xc6, 0x5f, 0x38, 0xaa, 0x69,
        0x48, 0x81, 0x65, 0x5d, 0xf4, 0x71, 0xde, 0x95, 0xdd, 0x97, 0x9a, 0x1c,
        0x00, 0xa2, 0xb6, 0xb3, 0xac, 0x37, 0x1e, 0x3d, 0x60, 0x69, 0x81, 0x10,
        0x59, 0xbf, 0x5b, 0x35, 0xd7, 0xaf, 0x0d, 0x09, 0x1f, 0xc2, 0x0f, 0x32,
        0xb2, 0xd5, 0x26, 0x52, 0x9b, 0xce, 0xa9, 0xb1, 0x7b, 0x2a, 0x73, 0x70,
        0xed, 0x5d, 0xf0, 0xd6, 0x20, 0xc2, 0x9d, 0xf0, 0x54, 0x2a, 0xf5, 0x98,
        0x6e, 0x11, 0xd3, 0xdd, 0x98, 0x5f, 0xac, 0x8e, 0xd0, 0x51, 0x04, 0x75,
        0xf1, 0x90, 0x6f, 0xc4, 0x4c, 0xf9, 0xd1, 0x53, 0xbf, 0x51, 0x5e, 0x21,
        0xbb, 0x4c, 0x9d, 0x71, 0x87, 0x90, 0x14, 0x61, 0x73, 0x55, 0x48, 0x28,
        0xe0, 0x96, 0x11, 0x6f, 0x1b, 0xef, 0xa9, 0xb4, 0xa0, 0x33, 0x1c, 0x82,
        0x31, 0x0d, 0xa0, 0x78, 0x80, 0xce, 0xdd, 0xd7, 0x27, 0xc6, 0x42, 0xe0,
        0x26, 0xa3, 0x49, 0x0f, 0x55, 0x36, 0x54, 0x4c, 0x88, 0x92, 0xa9, 0x9f,
        0x43, 0x53, 0x5e, 0x3f, 0x99, 0x4c, 0x54, 0x31, 0x79, 0x40, 0xaa, 0x35,
        0x6d, 0xb7, 0x96, 0x18, 0x7b, 0xb8, 0xf6, 0x30, 0xaf, 0x14, 0x4c, 0xa5,
        0xfe, 0x06, 0x1d, 0x98, 0xe6, 0xed, 0xf5, 0x7c, 0x9a, 0x5e, 0xd1, 0x4f,
        0xe4, 0x6c, 0xb4, 0x34, 0x19, 0x49, 0x1f, 0x86, 0xb3, 0x6f, 0x3d, 0xba,
        0xc9, 0xdb, 0xa2, 0x55, 0xeb, 0xee, 0xe5, 0xc9, 0x19, 0xca, 0x3d, 0x88,
        0x99, 0x33, 0x05, 0xfd, 0xb5, 0xed, 0xfa, 0xea
    ]),
    "Magenta": new Uint8Array([
        0xba, 0xb6, 0xff, 0xf9, 0xc4, 0x58, 0x8a, 0x19, 0x59, 0x5e, 0x55, 0xdb,
        0x33, 0xfc, 0xf4, 0x4a, 0xf2, 0xa2, 0xa3, 0x49, 0x35, 0xd5, 0x4f, 0x81,
        0x19, 0x1c, 0xb9, 0xf4, 0xfb, 0x48, 0x03, 0xae, 0x00, 0xbf, 0x98, 0x5f,
        0xfe, 0x38, 0x5c, 0x96, 0x01, 0x89, 0x50, 0x9b, 0x62, 0xd9, 0x72, 0xe4,
        0x57, 0x64, 0x5d, 0x25, 0x91, 0xa0, 0xef, 0x76, 0x88, 0xde, 0x37, 0x82,
        0x28, 0x23, 0xb8, 0x11, 0xf1, 0x60, 0xb9, 0xdd, 0x5e, 0xef, 0x8a, 0xc3,
        0x94, 0x11, 0xbc, 0x21, 0x15, 0xa3, 0x08, 0x14, 0xbd, 0x21, 0xfe, 0x35,
        0x81, 0x97, 0x3f, 0x3b, 0x37, 0xe1, 0xe5, 0x7e, 0x88, 0x84, 0xa0, 0xec,
        0xe6, 0x59, 0xb5, 0xb9, 0x0f, 0x0e, 0x63, 0x6f, 0xe4, 0xc0, 0xaf, 0xa1,
        0x79, 0x73, 0x7b, 0x82, 0xa9, 0xad, 0x91, 0x70, 0x15, 0xbd, 0x8c, 0xf7,
        0x76, 0xe6, 0x7a, 0xae, 0xc0, 0x83, 0xcc, 0x86, 0xd3, 0x39, 0x0b, 0x3c,
        0x72, 0x2b, 0xc7, 0x0a, 0x86, 0x23, 0xb4, 0x0f, 0xa5, 0x7e, 0x91, 0x15,
        0x8f, 0x45, 0x43, 0xcf, 0xaf, 0xca, 0x93, 0x99, 0x43, 0x65, 0x16, 0x57,
        0xd7, 0xde, 0x24, 0xf0, 0x45, 0x6c, 0x87, 0xe2, 0x89, 0xed, 0x77, 0xc0,
        0xef, 0x4b, 0xd1, 0xd6, 0x76, 0x55, 0xea, 0xc9, 0xc9, 0xb1, 0xa2, 0x93,
        0xb9, 0xc4, 0xac, 0x95, 0x6c, 0xc6, 0xbf, 0x0d, 0x89, 0x81, 0x1b, 0xae,
        0x43, 0x07, 0x50, 0x32, 0x99, 0x92, 0x58, 0xc7, 0x12, 0xa6, 0x35, 0xbc,
        0x24, 0x9c, 0x85, 0xc8, 0xeb, 0x37, 0x84, 0xae, 0x62, 0x6b, 0xb3, 0x73,
        0xb0, 0xbb, 0x4c, 0x7b, 0xd0, 0x99, 0xa9, 0x48, 0x45, 0xde, 0x35, 0xf5,
        0x98, 0xdd, 0xa9, 0x0a, 0x06, 0xb8, 0x9b, 0x15, 0xec, 0xc5, 0x72, 0xef,
        0x09, 0xb6, 0x68, 0xbe, 0xbe, 0x78, 0xbc, 0xf5, 0x73, 0xe4, 0xea, 0x27,
        0xee, 0xf8, 0x6e, 0x14, 0x62, 0xc4, 0xcc, 0x0d, 0xb9, 0x58, 0x8c, 0x89,
        0x10, 0x06, 0xd7, 0xd7, 0x4d, 0x32, 0x5b, 0x13, 0x76, 0xf8, 0x75, 0xb9,
        0xda, 0x57, 0xed, 0x14, 0x11, 0xb8, 0x2b, 0x16, 0xa2, 0x91, 0x3e, 0x9c,
        0x2f, 0xa1, 0x15, 0x4c, 0x64, 0xef, 0x97, 0xbc, 0xf0, 0x3a, 0x16, 0x48,
        0x68, 0x42, 0x4e, 0xed, 0x5c, 0x65, 0x5f, 0x32, 0xa8, 0x90, 0xa5, 0x20,
        0x6c, 0x0f, 0xe1, 0x09, 0x4e, 0x1a, 0x13, 0xbd, 0x30, 0x20, 0xf0, 0x59,
        0xd6, 0x92, 0xb3, 0x26, 0xbe, 0x99, 0x3f, 0x1e, 0xe6, 0xe5, 0x02, 0x3d,
        0x87, 0xd0, 0xa1, 0xe8, 0x81, 0xe9, 0x01, 0x28, 0xbb, 0x86, 0x3d, 0xb5,
        0x92, 0x4e, 0x06, 0x62, 0xea, 0x95, 0xd2, 0xff, 0xe0, 0x80, 0x52, 0x12,
        0xee, 0xef, 0x58, 0x69, 0x07, 0x0f, 0x14, 0x49, 0xb9, 0xff, 0xac, 0x00,
        0x0f, 0x7f, 0xa5, 0x6a, 0xe6, 0xa3, 0x71, 0xbf, 0xe1, 0xff, 0xc6, 0x5f,
        0x1a, 0x80, 0xa1, 0x64, 0xb2, 0x7c, 0x5e, 0xef, 0xd3, 0x77, 0xe9, 0xcd,
        0x13, 0xc9, 0x5f, 0x62, 0xcd, 0x72, 0x8c, 0xda, 0xf9, 0xf1, 0x92, 0xec,
        0xc4, 0x0a, 0xde, 0x10, 0x16, 0xf0, 0xbd, 0x29, 0x4f, 0x34, 0xb5, 0x7d,
        0x0b, 0x64, 0x17, 0x1e, 0x14, 0xfe, 0x5b, 0xcc, 0x3e, 0x3c, 0xfd, 0x6b,
        0x9c, 0xce, 0x44, 0x88, 0x68, 0x82, 0x4a, 0x63, 0x3f, 0x86, 0x28, 0xb1,
        0x01, 0xb1, 0x7d, 0x3b, 0x31, 0xbb, 0x0b, 0x35, 0x53, 0x95, 0x85, 0xf3,
        0x18, 0xfd, 0xbe, 0xdd, 0xf8, 0x85, 0xc9, 0xe2, 0x22, 0x1e, 0x3b, 0xdc,
        0x45, 0x00, 0xba, 0x27, 0xd9, 0x0c, 0xdf, 0x79, 0x6d, 0x00, 0xf1, 0x8a,
        0x16, 0x0e, 0x1f, 0x2d, 0x45, 0xdf, 0x95, 0x3d, 0x20, 0xc4, 0x83, 0xb3,
        0xf2, 0x4b, 0x7c, 0xff, 0x57, 0x05, 0xa5, 0x66, 0xe4, 0xc9, 0x17, 0xcf,
        0x7b, 0x51, 0x1b, 0xa5, 0x7f, 0x79, 0x21, 0x3c, 0x49, 0x78, 0x24, 0xa3,
        0x76, 0x5a, 0x79, 0x49, 0x28, 0x64, 0xa3, 0x76, 0x9d, 0xb6, 0x20, 0x69,
        0x13, 0xa9, 0x55, 0xf4, 0xdf, 0x08, 0xc3, 0x5f, 0x1a, 0x7b, 0x4a, 0x9b,
        0xe4, 0xa4, 0x5e, 0x27, 0xa1, 0x32, 0xef, 0x40, 0x77, 0x44, 0xf1, 0x5c,
        0x8e, 0x02, 0x41, 0x3c, 0xfb, 0xc3, 0x45, 0x05, 0xdb, 0xd9, 0x73, 0x1a,
        0xf5, 0xbc, 0x94, 0x41, 0x00, 0xe2, 0x73, 0x4e, 0x09, 0x54, 0xf5, 0x2a,
        0x37, 0x6e, 0x9d, 0x80, 0xf2, 0x93, 0xd8, 0x51, 0xa8, 0x74, 0xe9, 0xa2,
        0xce, 0x3b, 0x66, 0x77, 0xf3, 0xac, 0x5c, 0x01, 0x64, 0xdf, 0x6e, 0xfa,
        0x27, 0x51, 0xcb, 0x1d, 0xfb, 0xd5, 0x43, 0x07, 0xca, 0x53, 0x4e, 0x18,
        0x39, 0x21, 0x6f, 0x03, 0x80, 0xdd, 0x43, 0x2e, 0xed, 0x35, 0x23, 0x75,
        0xc7, 0x66, 0xb1, 0x55, 0x76, 0x76, 0x85, 0xcb, 0x20, 0x02, 0xd6, 0x26,
        0x6d, 0x1a, 0x69, 0x39, 0x95, 0x0d, 0xbb, 0x0f, 0xb7, 0xa2, 0x1e, 0x7e,
        0x60, 0x82, 0x18, 0x4d, 0x2b, 0xde, 0x0c, 0xac, 0x2f, 0xb4, 0x32, 0xb8,
        0xf9, 0x92, 0xbf, 0x26, 0x30, 0x20, 0xdd, 0x3c, 0x27, 0x74, 0xfc, 0xdb,
        0xb4, 0x1d, 0x94, 0x4d, 0xe9, 0xdf, 0x7a, 0xb2, 0x96, 0xa7, 0xba, 0xdf,
        0x88, 0x82, 0x23, 0x43, 0xd1, 0xd3, 0xaa, 0x5e, 0x32, 0x26, 0x0e, 0xdc,
        0x90, 0xf4, 0xa7, 0xab, 0x14, 0xb4, 0x40, 0x61, 0xf5, 0x40, 0x6f, 0xbd,
        0xf1, 0xeb, 0x6e, 0x99, 0xd0, 0x1a, 0xb2, 0xff, 0x53, 0xcb, 0x30, 0x35,
        0x05, 0x30, 0xff, 0xa8, 0xee, 0xb6, 0x0a, 0x0f, 0xef, 0x44, 0xcf, 0xf1,
        0xe0, 0x43, 0x80, 0x2d, 0xaa, 0xbc, 0x44, 0x75, 0x76, 0x67, 0x02, 0x53,
        0xdd, 0x76, 0x1b, 0x69, 0x89, 0x2b, 0x55, 0x4b, 0xa3, 0x34, 0x0e, 0xea,
        0x2b, 0x36, 0x1c, 0xaf, 0xcc, 0x14, 0x9e, 0xc2, 0xca, 0x18, 0xce, 0x03,
        0x5e, 0xa7, 0x52, 0x72, 0x0f, 0x56, 0x05, 0xc0, 0x08, 0x9f, 0x31, 0x88,
        0xed, 0xbd, 0xfe, 0x65, 0x68, 0x94, 0x37, 0x4d, 0x06, 0x74, 0x1b, 0xe9,
        0x45, 0xf1, 0x2e, 0xd3, 0xfc, 0xe2, 0x06, 0x22, 0x2f, 0xcd, 0xd7, 0x87,
        0x42, 0xa4, 0xcc, 0x2b, 0x66, 0x02, 0x65, 0x3a, 0x11, 0xc1, 0x3d, 0x3c,
        0xa2, 0xa4, 0x74, 0x85, 0x19, 0x5a, 0xa9, 0x4c, 0xc3, 0xd3, 0x56, 0xed,
        0x02, 0x9b, 0x35, 0x13, 0x1b, 0x6a, 0xbd, 0x76, 0xca, 0x83, 0x90, 0x3c,
        0x3e, 0xdf, 0x98, 0x79, 0xa2, 0xdb, 0x5a, 0xb5, 0xee, 0x7a, 0x8c, 0xfd,
        0x10, 0xa3, 0x3f, 0x46, 0xe5, 0x3c, 0xa7, 0xe1, 0x44, 0xcf, 0x56, 0x30,
        0xe2, 0x4f, 0x4e, 0xa2, 0xb9, 0x10, 0xec, 0xc0, 0xad, 0xd9, 0x0b, 0x26,
        0x0c, 0x9a, 0x1a, 0xab, 0xba, 0x14, 0x66, 0x25, 0x7d, 0xea, 0x4b, 0x54,
        0x8b, 0x06, 0x8a, 0x1c, 0x8a, 0x43, 0x63, 0x2f, 0x91, 0x81, 0x8e, 0x0d,
        0xa6, 0xd6, 0x9d, 0x32, 0xa8, 0xed, 0xff, 0x4a, 0xe4, 0x00, 0x16, 0x6b,
        0x62, 0x76, 0x9f, 0x3e, 0x72, 0x84, 0x19, 0x1f, 0x55, 0x9d, 0x3a, 0x3f,
        0xc9, 0xda, 0xd1, 0x1a, 0x6f, 0x23, 0x0b, 0x3d, 0xb2, 0x37, 0x8d, 0xca,
        0x65, 0xd6, 0x66, 0x27, 0xe4, 0xd1, 0x9f, 0x04, 0x8c, 0xb3, 0x70, 0x63,
        0xa2, 0x49, 0x43, 0x5e, 0xa9, 0x5c, 0x6b, 0x1f, 0xe3, 0x0b, 0x61, 0x7b,
        0xd3, 0xf9, 0x62, 0x86, 0x41, 0xdd, 0x43, 0xd3, 0x9b, 0x2f, 0xb4, 0x67,
        0x2a, 0x61, 0xa6, 0xcb, 0xce, 0x75, 0x53, 0x92, 0x89, 0xb8, 0x07, 0x4f,
        0x98, 0x3e, 0x7f, 0xd6, 0xc3, 0xc9, 0xfc, 0x4c, 0xa3, 0x56, 0x53, 0xc6,
        0xaf, 0xd6, 0xcf, 0xe8, 0xb6, 0xb3, 0x30, 0xb9, 0xdb, 0xe5, 0x08, 0x9e,
        0xa9, 0x0a, 0xf5, 0xad, 0x4a, 0x3b, 0x58, 0x90, 0xfd, 0x6a, 0x2f, 0x4f,
        0xb5, 0xaa, 0x95, 0x60, 0x3c, 0xc7, 0xc0, 0xcb, 0xbb, 0x4b, 0x24, 0x2a,
        0xa0, 0x4a, 0xc1, 0x51, 0x26, 0x09, 0x05, 0xd4, 0xa6, 0xac, 0x2d, 0x65,
        0x23, 0xb8, 0xf0, 0x73, 0x2b, 0xfe, 0x3e, 0x76, 0x2d, 0x8b, 0xd2, 0x47,
        0x13, 0xdc, 0x2a, 0x44, 0xb3, 0x1e, 0x7e, 0xee, 0x6d, 0x19, 0x53, 0x46,
        0xae, 0x3b, 0xff, 0x5f, 0xe2, 0x70, 0xdd, 0xe0, 0xe9, 0xfa, 0x71, 0xd9,
        0xcc, 0x8d, 0x76, 0xd9, 0xd1, 0x92, 0x0b, 0xef, 0x72, 0x0d, 0x8f, 0x75,
        0x93, 0x3f, 0xa8, 0x29, 0x0a, 0x48, 0x4d, 0x91, 0xfb, 0xaf, 0xb0, 0x94,
        0x8a, 0x17, 0x2e, 0xe5, 0xa3, 0x5f, 0x64, 0x3d, 0x75, 0x99, 0x7b, 0xdb,
        0xcf, 0xb5, 0x3f, 0x40, 0x99, 0x6b, 0xe4, 0x47, 0x90, 0x2b, 0x6e, 0xc9,
        0x92, 0x0c, 0x11, 0x64, 0xe2, 0xd8, 0x71, 0xc7, 0xcd, 0x15, 0xec, 0xda,
        0x7c, 0xd9, 0x96, 0x88, 0x44, 0x2b, 0xc0, 0xf3, 0x19, 0xf0, 0x42, 0x86,
        0xb4, 0xe7, 0x60, 0xd8, 0xa0, 0x1b, 0x2b, 0xf7, 0x9d, 0x8c, 0x6a, 0xa1,
        0x8d, 0xb9, 0xac, 0x89, 0xe8, 0x88, 0x46, 0xa6, 0x9b, 0x51, 0x98, 0xea,
        0xfa, 0xc5, 0x47, 0x0c, 0x15, 0x0d, 0x53, 0x00, 0x77, 0xee, 0x96, 0xa9,
        0xd9, 0xd2, 0x89, 0x7d, 0x5d, 0x96, 0x15, 0x9c, 0xd7, 0xd6, 0x08, 0x38,
        0x1f, 0x0f, 0xed, 0xdd, 0x42, 0x71, 0x82, 0x31, 0x6d, 0x8a, 0x4f, 0x86,
        0xf6, 0x97, 0x7d, 0x9e, 0xe3, 0x7e, 0x61, 0xf1, 0xf7, 0x5c, 0xdb, 0xd5,
        0xd8, 0x95, 0xef, 0x4d, 0x5b, 0xa0, 0x80, 0xe2, 0x5c, 0x98, 0xb8, 0xad,
        0x7a, 0xc1, 0xb7, 0x3b, 0xf3, 0xb7, 0x54, 0x82, 0x00, 0xa2, 0x15, 0xf5,
        0x6d, 0x23, 0xc9, 0xd8, 0x13, 0x30, 0xa7, 0x68, 0xa1, 0x3a, 0x32, 0x77,
        0x62, 0x32, 0xe1, 0xc9, 0xff, 0xc8, 0xff, 0x0a, 0x60, 0xc9, 0xe3, 0xc8,
        0xa8, 0x1c, 0x29, 0xd1, 0xaa, 0x7d, 0x22, 0x2f, 0x7f, 0xb1, 0xee, 0xf5,
        0x6a, 0x53, 0xde, 0xac, 0x28, 0xfe, 0x32, 0x1e, 0x71, 0x6d, 0x8f, 0xc0,
        0x94, 0x35, 0x38, 0xd1, 0x47, 0x0a, 0xaa, 0x8c, 0x15, 0x09, 0x78, 0xf1,
        0xdc, 0xda, 0xc2, 0xfa, 0xcd, 0x14, 0x08, 0xff, 0xd6, 0xbd, 0x04, 0x40,
        0xef, 0xd9, 0x63, 0xa9, 0xc5, 0x30, 0x09, 0x49, 0x84, 0x62, 0xf8, 0x74,
        0x99, 0xe1, 0x30, 0x6f, 0x85, 0x82, 0x3c, 0x95, 0x2c, 0x49, 0xd3, 0x13,
        0xfb, 0xb4, 0x12, 0xc3, 0xc4, 0x8e, 0xd9, 0x8a, 0xe3, 0xb4, 0x18, 0x53,
        0x37, 0x3d, 0xe4, 0x9c, 0xf9, 0xb9, 0x50, 0x01, 0xce, 0x4b, 0xfe, 0xd1,
        0x7c, 0x49, 0x83, 0x1c, 0x39, 0xa6, 0xfb, 0x1e, 0xe5, 0x48, 0x50, 0x79,
        0xe4, 0x8a, 0x35, 0xeb, 0xd8, 0x44, 0x0c, 0x92, 0x0b, 0x50, 0x6e, 0x28,
        0xe5, 0xaf, 0xed, 0xba, 0x0c, 0x3a, 0x3c, 0x4c, 0x4c, 0x16, 0x79, 0x4f,
        0x58, 0x77, 0x38, 0x0f, 0x7b, 0xe6, 0x3b, 0xcb, 0xa1, 0xe9, 0xa7, 0x8c,
        0xfb, 0xd5, 0x14, 0x63, 0x04, 0x60, 0x2e, 0xe5, 0x03, 0xa9, 0xb4, 0x2d,
        0xe0, 0x1f, 0xff, 0x74, 0x4e, 0x4e, 0x86, 0x33, 0x16, 0x80, 0x82, 0x73,
        0x96, 0x0c, 0x6f, 0xb3, 0x61, 0x22, 0xc3, 0xe4, 0xa5, 0xa0, 0xb2, 0x8f,
        0x67, 0x24, 0xe5, 0xd1, 0x94, 0x70, 0x06, 0x9a, 0xad, 0xe1, 0x45, 0x97,
        0x6f, 0x0b, 0x70, 0x8f, 0x87, 0x4d, 0xea, 0xda, 0xe3, 0xdc, 0x75, 0x25,
        0x0c, 0xce, 0xfa, 0xc0, 0x4b, 0x58, 0x9a, 0xcc, 0x24, 0xb1, 0x50, 0xa9,
        0xe4, 0x2c, 0xc2, 0x66, 0x91, 0xb9, 0x32, 0x77, 0x63, 0x79, 0xb9, 0x6c,
        0x15, 0xd4, 0xe4, 0x86, 0x17, 0x80, 0xf2, 0xb4, 0xff, 0x90, 0xef, 0x2b,
        0x7b, 0x9a, 0xec, 0xeb, 0x40, 0x57, 0xfe, 0x6c, 0x23, 0x39, 0xe2, 0x6a,
        0x0e, 0x29, 0x87, 0xee, 0xc6, 0x42, 0xe7, 0xc2, 0x0a, 0x62, 0x69, 0x93,
        0x3a, 0x9d, 0x00, 0x72, 0x97, 0xc9, 0xbb, 0xa8, 0xd4, 0xae, 0xe5, 0xd9,
        0x9e, 0x30, 0x9e, 0x45, 0xf3, 0xa6, 0x8a, 0x4c, 0x75, 0x11, 0xc1, 0xf7,
        0xa0, 0x4e, 0xca, 0xe6, 0x88, 0x0e, 0xd7, 0x37, 0xaf, 0x3d, 0x7b, 0xde,
        0x6e, 0x1a, 0x35, 0x84, 0x96, 0xd4, 0xe8, 0xed, 0xf9, 0x87, 0xe1, 0xf6,
        0x4c, 0xcc, 0xd5, 0xc7, 0xfb, 0xe3, 0xae, 0x90, 0x69, 0xab, 0x94, 0x01,
        0xfc, 0xe6, 0x02, 0xac, 0xe8, 0x9e, 0x08, 0x6b, 0x51, 0x7e, 0x3e, 0x9d,
        0xd9, 0xc4, 0xb9, 0xa8, 0x9a, 0x70, 0x26, 0x72, 0xa8, 0x98, 0x5e, 0xd4,
        0x9f, 0x97, 0x17, 0x3f, 0xc6, 0xf5, 0xe5, 0x90, 0xff, 0x78, 0x1d, 0x39,
        0xa1, 0xf9, 0xd1, 0x30, 0x8b, 0x05, 0x89, 0xc9, 0x2e, 0x1b, 0xe3, 0xaa,
        0xa6, 0x1a, 0x2d, 0x01, 0x8a, 0x29, 0x04, 0x06, 0x33, 0x20, 0x7b, 0xa5,
        0xf9, 0x3c, 0x38, 0x56, 0xc5, 0xd4, 0x8b, 0x4a, 0x96, 0x48, 0xed, 0xed,
        0x2f, 0xdf, 0x0f, 0x4f, 0x82, 0xc4, 0xe9, 0xa7, 0x78, 0x21, 0x2c, 0x2f,
        0x9e, 0x3b, 0x1f, 0x53, 0x6a, 0x61, 0x4a, 0xe0, 0xa6, 0x1e, 0x89, 0xf9,
        0xfa, 0xd6, 0x8d, 0xe5, 0x11, 0x6d, 0xd3, 0xc6, 0x23, 0xb2, 0x23, 0x69,
        0xf0, 0x58, 0x48, 0x06, 0xbb, 0x09, 0x49, 0x1f, 0x4b, 0xdd, 0xae, 0xd9,
        0x10, 0xa6, 0xd5, 0xd8, 0x55, 0xa6, 0x24, 0xa5, 0x63, 0xdf, 0xe9, 0x86,
        0xf4, 0x67, 0x20, 0x7e, 0xc9, 0x45, 0xc7, 0xdd, 0x77, 0x8a, 0x4c, 0x62,
        0xf8, 0x81, 0x98, 0xfd, 0xb7, 0x74, 0x51, 0x5b, 0x0f, 0xfd, 0x5c, 0x5f,
        0x1f, 0xa7, 0x98, 0x07, 0x92, 0x94, 0xae, 0xc6, 0xf9, 0x01, 0x18, 0x4e,
        0x51, 0x13, 0x73, 0xa0, 0x3d, 0x9f, 0xc9, 0x9c, 0x74, 0x3e, 0x9b, 0x5d,
        0xa4, 0x16, 0x98, 0x86, 0x96, 0xc5, 0x0c, 0x88, 0x02, 0x90, 0x84, 0x98,
        0x97, 0x1e, 0x00, 0x29, 0xbf, 0x7f, 0x8b, 0x43, 0x99, 0x92, 0x9c, 0xa3,
        0xad, 0x28, 0xc5, 0x45, 0xd9, 0x97, 0xa3, 0xbe, 0x0c, 0xb9, 0xcc, 0xfe,
        0x51, 0x1d, 0xfb, 0xd8, 0xdb, 0x14, 0xad, 0xb0, 0xf9, 0x33, 0xe7, 0x65,
        0x33, 0x49, 0xd3, 0xbb, 0xf5, 0x0d, 0xe0, 0xe0, 0x82, 0x01, 0x69, 0x53,
        0x5d, 0xfd, 0xbb, 0xea, 0xec, 0x2e, 0xe0, 0x9f, 0xf4, 0x2e, 0xe1, 0xe8,
        0xfc, 0x8c, 0x98, 0x00, 0x99, 0x06, 0xc6, 0xaf, 0xec, 0x72, 0x5f, 0x76,
        0x34, 0xd0, 0x13, 0x14, 0xf1, 0x55, 0x77, 0x89, 0x2e, 0x6f, 0x6d, 0x25,
        0x0f, 0x67, 0x8c, 0x41, 0x0a, 0xde, 0x4b, 0xc2, 0x16, 0xbc, 0x1f, 0x03,
        0x96, 0x70, 0x83, 0x0c, 0xc3, 0x66, 0x0b, 0xa0, 0xb9, 0x50, 0xfd, 0xe2,
        0x7b, 0x38, 0xd1, 0xc6, 0x9e, 0x8d, 0x1f, 0xc0, 0x2d, 0x5c, 0xf2, 0xda,
        0x54, 0x48, 0x82, 0x03, 0x04, 0xe0, 0xbe, 0xde, 0x53, 0x9b, 0x60, 0x79,
        0x40, 0xc0, 0x7a, 0x01, 0x30, 0x2d, 0x3f, 0x79, 0xce, 0x33, 0x2e, 0x9a,
        0x2d, 0xd1, 0xae, 0xea, 0xff, 0x25, 0xab, 0x7b, 0x9c, 0xf0, 0xcc, 0x2d,
        0xf4, 0x0f, 0x7e, 0x23, 0x2e, 0x5f, 0xe3, 0x5e, 0xaf, 0x8e, 0x7a, 0x30,
        0x7d, 0x07, 0xf4, 0xfe, 0x18, 0x44, 0xc4, 0xf1, 0x6c, 0x36, 0x48, 0xea,
        0xe5, 0x4c, 0xc4, 0xfd, 0x58, 0xc6, 0xcc, 0x09, 0x9a, 0xe3, 0x5b, 0xc4,
        0x12, 0xa6, 0x64, 0xc6, 0x01, 0x9e, 0xc1, 0xd6, 0x7c, 0xb4, 0x19, 0x65,
        0xa7, 0x9b, 0xea, 0x9e, 0x25, 0x80, 0x3a, 0x82, 0x38, 0xde, 0x5d, 0x5a,
        0x06, 0x78, 0x05, 0x41, 0x5b, 0xf2, 0x3a, 0xda, 0x1f, 0x75, 0x13, 0x30,
        0xf0, 0xba, 0x1a, 0x88, 0x9c, 0x6f, 0x17, 0x4b, 0x5a, 0x06, 0xdc, 0x25,
        0xbf, 0x56, 0x7f, 0x4e, 0xa7, 0x39, 0x8f, 0x77, 0xd1, 0x13, 0x90, 0xa0,
        0xb0, 0x75, 0x1e, 0x5a, 0x3b, 0xed, 0xf8, 0x45, 0x94, 0xb2, 0xd1, 0x3a,
        0xcd, 0x59, 0x38, 0x81, 0xe7, 0xf4, 0x3c, 0xc1, 0x36, 0x0d, 0x2c, 0xdf,
        0x6b, 0x59, 0xe1, 0x48, 0x6f, 0xaf, 0xd4, 0x9d, 0x3b, 0x1d, 0xb0, 0x40,
        0xf8, 0xea, 0x95, 0xdc, 0x6a, 0x0d, 0xd3, 0x34, 0x04, 0x54, 0xf8, 0xd2,
        0x55, 0x66, 0x71, 0x39, 0x6e, 0x35, 0xa3, 0x2b, 0xef, 0xd7, 0x79, 0x8b,
        0x44, 0x12, 0x3d, 0xee, 0x55, 0xcb, 0x4e, 0xb7, 0xf8, 0x5f, 0x07, 0xa5,
        0x7d, 0xdb, 0xa2, 0x73, 0xfa, 0x0f, 0xeb, 0xa6, 0x61, 0x3f, 0x56, 0x63,
        0x94, 0xfe, 0x89, 0x46, 0xcc, 0x97, 0xdf, 0x35, 0x63, 0x23, 0xcf, 0xc8,
        0x70, 0x72, 0xf4, 0x39, 0xe5, 0x27, 0x84, 0xcb, 0xcf, 0xfd, 0xab, 0xa1,
        0xe3, 0xe3, 0xc1, 0x8e, 0x0d, 0xf6, 0x6d, 0x14, 0x1d, 0xef, 0xdd, 0x07,
        0xbf, 0x79, 0xe0, 0x94, 0xca, 0x26, 0x95, 0x2b, 0x64, 0x3c, 0x4b, 0xe4,
        0xc5, 0x63, 0x69, 0xdf, 0xdf, 0xb2, 0x48, 0x2a, 0x1e, 0x02, 0xe4, 0xfa,
        0x35, 0xc8, 0x6d, 0xd5, 0x12, 0x71, 0x54, 0x45, 0x63, 0xbb, 0x72, 0x15,
        0x9c, 0x92, 0xa6, 0x24, 0x25, 0xda, 0x04, 0x87, 0xa6, 0x90, 0x53, 0xeb,
        0x71, 0x93, 0x1f, 0x5c, 0x04, 0x51, 0x05, 0x43, 0x65, 0x43, 0xb1, 0xbb,
        0xc6, 0x04, 0x26, 0x05, 0x8e, 0x7d, 0x72, 0xa3, 0x35, 0xc9, 0xe6, 0xa1,
        0xeb, 0x8d, 0x2a, 0x02, 0xcd, 0xab, 0xe6, 0xd2, 0x30, 0x65, 0xe7, 0xb3,
        0x58, 0xd3, 0xa9, 0xa1, 0x03, 0xc8, 0xab, 0x62, 0x63, 0xf7, 0xbf, 0x0d,
        0x27, 0x9b, 0x70, 0xc7, 0x5f, 0xa9, 0x1a, 0x20, 0x3c, 0x8e, 0x4e, 0x8b,
        0xdb, 0x3e, 0x96, 0x5b, 0x2c, 0x47, 0x4d, 0x4c, 0x87, 0x63, 0xba, 0x33,
        0x38, 0x76, 0x14, 0x69, 0xef, 0x50, 0xe7, 0x05, 0x51, 0x32, 0xdf, 0xae,
        0xdc, 0x2d, 0x5b, 0x18, 0xb2, 0x3b, 0x37, 0xa5, 0xa7, 0xb2, 0x47, 0xb6,
        0xd2, 0x97, 0x3e, 0x99, 0xde, 0x7b, 0x43, 0x0b, 0x76, 0xdc, 0x41, 0xac,
        0x23, 0x4a, 0x42, 0xb2, 0xb8, 0x51, 0x49, 0xb5, 0xe1, 0x90, 0xee, 0x07,
        0x20, 0x3a, 0xc2, 0x50, 0xac, 0xeb, 0x3e, 0xf2, 0x2d, 0xd5, 0x86, 0x7c,
        0x86, 0xe0, 0x10, 0x2b, 0x22, 0x98, 0x4d, 0xb5, 0xe6, 0xda, 0x98, 0xe8,
        0x96, 0xbc, 0x58, 0xe1, 0xb1, 0xef, 0x64, 0xa0, 0xe0, 0xff, 0xa5, 0x26,
        0x83, 0x80, 0x28, 0x0b, 0x4d, 0x6c, 0x06, 0x7b, 0x8b, 0x14, 0xa0, 0xfa,
        0x26, 0x13, 0x3d, 0x19, 0xe1, 0x44, 0x30, 0xac, 0x2d, 0x0d, 0x22, 0x19,
        0x92, 0x9c, 0x5c, 0x15, 0x10, 0x9f, 0x82, 0x63, 0xfa, 0x93, 0xae, 0x77,
        0xbd, 0xee, 0x55, 0x8a, 0x2f, 0x62, 0x9f, 0x8b, 0xc5, 0xa7, 0x7a, 0xa3,
        0xc6, 0x09, 0x87, 0x88, 0xef, 0xeb, 0x15, 0x71, 0xa6, 0xdc, 0xc5, 0x93,
        0x58, 0xab, 0x6d, 0x6c, 0x71, 0x49, 0xca, 0x9f, 0x3b, 0xde, 0x7d, 0x08,
        0x89, 0x62, 0x34, 0xbc, 0x57, 0xb6, 0x09, 0x02, 0x85, 0xc1, 0x7e, 0xf2,
        0x95, 0xe1, 0x6e, 0xe6, 0x34, 0x24, 0x23, 0x5d, 0x34, 0x27, 0x3e, 0x90,
        0xcf, 0x36, 0x67, 0xbc, 0x61, 0xf9, 0xd4, 0x41, 0x58, 0x1e, 0x9f, 0x5b,
        0x3b, 0xd1, 0x1a, 0xe3, 0xe0, 0x0d, 0xd0, 0x62, 0x10, 0x57, 0xb6, 0xd6,
        0xcd, 0xf0, 0xe9, 0x54, 0x8d, 0x57, 0x44, 0x7e, 0x90, 0xc0, 0xcf, 0x46,
        0xd6, 0x16, 0x93, 0x5e, 0x68, 0xa5, 0x77, 0x86, 0xfd, 0x75, 0x3d, 0x06,
        0xd0, 0x66, 0x66, 0xb5, 0xe8, 0x59, 0x65, 0x2d, 0xb5, 0x9e, 0xe5, 0xa1,
        0x3e, 0xda, 0x20, 0x41, 0x78, 0xed, 0x2a, 0x7b, 0x69, 0x7f, 0x79, 0x77,
        0x98, 0x38, 0xca, 0x2f, 0xba, 0x33, 0xcc, 0xf2, 0xd0, 0x5d, 0x99, 0xa0,
        0xdb, 0x05, 0xab, 0x60, 0xc6, 0x54, 0x92, 0x04, 0xda, 0xcb, 0xda, 0x9b,
        0x69, 0x47, 0xea, 0x91, 0x29, 0x2f, 0x3f, 0xbd, 0x62, 0x95, 0xe5, 0xce,
        0x41, 0xf8, 0x4b, 0xca, 0x6a, 0x57, 0x49, 0xce, 0x76, 0x5e, 0xd7, 0xe6,
        0x72, 0xba, 0x17, 0x07, 0x12, 0xc3, 0x1c, 0xc2, 0x1f, 0x47, 0x53, 0x42,
        0x16, 0x06, 0x98, 0x23, 0x77, 0x4b, 0xde, 0x60, 0xeb, 0x81, 0x94, 0xb1,
        0xa4, 0x41, 0x63, 0x7b, 0x25, 0x21, 0x75, 0x63, 0xb8, 0x43, 0x8c, 0xec,
        0x3f, 0xef, 0x22, 0x6f, 0x80, 0x3f, 0xf6, 0xd2, 0xb8, 0xcb, 0x41, 0xbf,
        0x41, 0x81, 0x7b, 0x11, 0xf7, 0x5b, 0x94, 0x2f, 0xc4, 0xb9, 0xa5, 0x48,
        0x44, 0xcf, 0xec, 0x30, 0x04, 0x71, 0x3f, 0x32, 0xe1, 0x68, 0xb0, 0xad,
        0x15, 0x2e, 0x20, 0xf4, 0x79, 0xe4, 0xd7, 0xbf, 0xe5, 0x3a, 0xfa, 0x0c,
        0xb1, 0xb2, 0x1f, 0x7d, 0xf2, 0xbc, 0xc4, 0xa3, 0x9d, 0x2d, 0x15, 0x40,
        0x7f, 0x86, 0x69, 0x97, 0xa8, 0x82, 0xcb, 0x64, 0xdb, 0x4b, 0xa1, 0x26,
        0x8d, 0x49, 0xd5, 0xd7, 0x50, 0xd4, 0x05, 0xb9, 0xfa, 0x1c, 0x03, 0x5e,
        0xe3, 0x0b, 0x71, 0x6f, 0xf9, 0xc9, 0x22, 0x12, 0xd1, 0x54, 0x62, 0xfa,
        0x79, 0x23, 0xa0, 0xb6, 0x6b, 0xa0, 0xba, 0xb7, 0x43, 0x43, 0xab, 0xbd,
        0x14, 0xdf, 0x74, 0xe1, 0xde, 0x10, 0x92, 0x4f, 0xf6, 0x37, 0xb0, 0x7f,
        0xd3, 0x3d, 0x32, 0x10, 0x94, 0x7c, 0x0d, 0xd8, 0x30, 0x0b, 0x49, 0xc5,
        0x4b, 0xec, 0x38, 0x4d, 0xb2, 0xd7, 0xf3, 0xc0, 0x45, 0xe2, 0xa1, 0xa7,
        0x56, 0xc7, 0x64, 0x23, 0x17, 0x28, 0xcc, 0xcf, 0xbc, 0x7c, 0xc6, 0xc8,
        0x40, 0x53, 0x23, 0x1d, 0x29, 0x9d, 0x47, 0xa7, 0xfc, 0xe8, 0x64, 0x35,
        0x0a, 0xac, 0x81, 0x6b, 0x9d, 0xc7, 0xe8, 0x80, 0x72, 0x3f, 0x98, 0x4f,
        0x5a, 0xcf, 0xb4, 0xaa, 0x41, 0x52, 0x50, 0x60, 0xf4, 0x6d, 0x8a, 0xfb,
        0x54, 0xb4, 0xa6, 0x6b
    ]),
    "White Smoke": new Uint8Array([
        0xbd, 0x31, 0x29, 0x0e, 0xc0, 0xa0, 0xf6, 0xfd, 0x62, 0xa2, 0x85, 0x06,
        0x20, 0x1f, 0x58, 0x84, 0xb1, 0x06, 0x3f, 0xe9, 0xdf, 0x2c, 0x16, 0x8e,
        0x52, 0x5e, 0x47, 0x8a, 0x93, 0x83, 0xb3, 0x23, 0x44, 0x37, 0x1a, 0xe6,
        0xa4, 0xa4, 0x46, 0xf1, 0xea, 0x0c, 0x1d, 0x95, 0x6c, 0xa7, 0x56, 0x07,
        0x75, 0xd1, 0x64, 0x47, 0xf0, 0x05, 0x18, 0x1a, 0xa9, 0xd6, 0x43, 0xc3,
        0xf0, 0x41, 0x55, 0xb4, 0xa5, 0x28, 0x68, 0x41, 0xc1, 0x65, 0x3b, 0x2e,
        0xdc, 0x19, 0xb3, 0xb8, 0x4e, 0xe2, 0xaa, 0x8a, 0x5a, 0x5e, 0x1c, 0xae,
        0x24, 0x11, 0xe4, 0x40, 0xdf, 0x4a, 0x3d, 0x47, 0x0e, 0xa4, 0xfa, 0x02,
        0x54, 0xa7, 0x48, 0x2d, 0x2d, 0x3a, 0x94, 0x15, 0x8f, 0x31, 0x03, 0x66,
        0xbd, 0xfe, 0xa3, 0x26, 0xd6, 0xea, 0xbc, 0x8b, 0xf4, 0x8b, 0xdf, 0x84,
        0x36, 0x26, 0x07, 0x20, 0xf4, 0x1e, 0x42, 0x24, 0x62, 0x38, 0x7b, 0x8b,
        0x52, 0x9b, 0x56, 0xd7, 0x90, 0xd9, 0x0d, 0x7b, 0xb2, 0xfb, 0x5c, 0x3f,
        0x37, 0x02, 0x1e, 0x15, 0xd6, 0xd1, 0x3e, 0x95, 0x1b, 0x09, 0xa6, 0x5b,
        0x4a, 0xeb, 0x8f, 0x29, 0x0b, 0x09, 0x2b, 0x62, 0xf2, 0x0e, 0xee, 0xe3,
        0x19, 0x52, 0x67, 0x73, 0xfc, 0xb1, 0x2a, 0xc6, 0x26, 0x4e, 0x4f, 0x10,
        0xcb, 0x0f, 0x32, 0xca, 0xae, 0xe6, 0x9d, 0x88, 0x95, 0xf3, 0x87, 0xe9,
        0xe9, 0x01, 0x5c, 0x9a, 0x1c, 0x89, 0x45, 0x85, 0xb3, 0x09, 0xd2, 0xcb,
        0x55, 0x31, 0xdf, 0x29, 0x5c, 0x03, 0x18, 0x7c, 0x0e, 0xd5, 0xbf, 0x4e,
        0x94, 0x92, 0x56, 0x41, 0xbf, 0x0f, 0xcd, 0x33, 0x37, 0x71, 0x7f, 0x85,
        0x06, 0x43, 0x09, 0xbc, 0xbc, 0xf8, 0xd1, 0xcf, 0x63, 0xff, 0x69, 0x78,
        0xf4, 0x4d, 0x76, 0x2d, 0xd4, 0x65, 0x48, 0x5b, 0xfd, 0x7a, 0x71, 0xb6,
        0x0a, 0x8f, 0x93, 0x02, 0x51, 0xc6, 0x38, 0xc9, 0x01, 0x94, 0xaf, 0xc2,
        0xad, 0xf0, 0xc7, 0xa0, 0x2d, 0x22, 0xeb, 0xbc, 0x16, 0x78, 0x98, 0xd1,
        0xb4, 0xf7, 0xbe, 0xbe, 0xd3, 0xe6, 0x7b, 0x32, 0x10, 0xf5, 0x04, 0xdb,
        0xce, 0xb1, 0xbb, 0x85, 0x63, 0xc3, 0xad, 0x39, 0xc6, 0xd8, 0x34, 0x74,
        0xee, 0xb5, 0x06, 0xef, 0x80, 0x7f, 0xe0, 0x8c, 0x07, 0xcc, 0xd6, 0x81,
        0xfa, 0x8a, 0xd7, 0xa1, 0x31, 0x15, 0xef, 0xd3, 0xf6, 0xc7, 0xa1, 0xf7,
        0x36, 0xfc, 0x80, 0xbc, 0xa7, 0xee, 0x2b, 0xb1, 0x16, 0xb6, 0x03, 0x65,
        0x2e, 0x73, 0xd7, 0xf7, 0x60, 0x4f, 0x29, 0xee, 0x9f, 0x1b, 0xc9, 0xc2,
        0x94, 0xa1, 0xa6, 0xe8, 0x45, 0x49, 0xbe, 0x55, 0x68, 0x2d, 0x3c, 0xbd,
        0x28, 0xa0, 0x4c, 0x84, 0x6f, 0xbd, 0x66, 0x62, 0xef, 0xc6, 0xbc, 0x66,
        0x5b, 0xc3, 0x5e, 0xc4, 0xf0, 0x9c, 0xdd, 0x9e, 0x21, 0x61, 0x3c, 0x4b,
        0x7e, 0x7e, 0xad, 0xd1, 0x56, 0x13, 0x08, 0x7b, 0xf2, 0x1b, 0x92, 0x98,
        0x83, 0x23, 0xbb, 0xa6, 0x8d, 0x15, 0x42, 0x7e, 0x33, 0x36, 0x38, 0x50,
        0x85, 0x49, 0x27, 0x55, 0x67, 0x0b, 0xe8, 0xa3, 0xbf, 0xae, 0x35, 0x86,
        0x46, 0x58, 0x4c, 0x75, 0xc1, 0x4d, 0xda, 0xda, 0xec, 0x0e, 0xc9, 0xe1,
        0x28, 0x0f, 0xbd, 0x97, 0x63, 0xef, 0x3b, 0xcb, 0xe1, 0x10, 0x37, 0x2c,
        0x49, 0x4a, 0x6a, 0x10, 0xf7, 0x36, 0x99, 0xea, 0x46, 0x6b, 0x75, 0xb6,
        0xe6, 0x09, 0x4b, 0xfe, 0x85, 0xee, 0xfd, 0xd4, 0x52, 0xf6, 0x72, 0x4f,
        0x9f, 0x1b, 0x3e, 0x00, 0x37, 0xdc, 0x01, 0xed, 0xf9, 0x86, 0x0d, 0x02,
        0x23, 0x1c, 0x6b, 0x3e, 0x4d, 0x2c, 0x8a, 0xa4, 0x97, 0xf4, 0x3d, 0xe0,
        0xc9, 0x5f, 0x2f, 0x0e, 0x90, 0x19, 0x80, 0xb3, 0x7f, 0x1f, 0x7f, 0x29,
        0xa0, 0xb7, 0x32, 0xb8, 0x1c, 0x53, 0xf7, 0xd4, 0xe6, 0xa6, 0x5a, 0xdb,
        0x93, 0x6e, 0x5b, 0xdb, 0xd6, 0x68, 0x10, 0xe2, 0x02, 0x93, 0xfc, 0xcc,
        0x37, 0x63, 0x6f, 0xd1, 0x1a, 0x84, 0x07, 0xab, 0x9c, 0x54, 0xc1, 0x8d,
        0x4d, 0x34, 0xcd, 0xe8, 0x54, 0xe1, 0x55, 0x29, 0x62, 0x95, 0x95, 0x6a,
        0xfb, 0x4c, 0x8a, 0xc3, 0xa1, 0x95, 0xb8, 0xec, 0x48, 0xa0, 0x70, 0xa9,
        0xfd, 0xb5, 0xc8, 0x62, 0xd1, 0x59, 0x6e, 0x01, 0x5d, 0x32, 0xfd, 0xf9,
        0xdb, 0x3f, 0x17, 0x2c, 0x9a, 0x1e, 0x29, 0x07, 0xb7, 0x93, 0x76, 0x2e,
        0x57, 0xfa, 0x08, 0xa4, 0x0c, 0xf1, 0xe2, 0xb8, 0x32, 0xb4, 0xf1, 0xca,
        0xc7, 0xeb, 0x5b, 0x56, 0x6a, 0x00, 0xbb, 0x6b, 0x63, 0x0f, 0x51, 0x89,
        0xf2, 0xc5, 0xaf, 0x11, 0x79, 0x65, 0x2f, 0x5c, 0x4b, 0x94, 0x22, 0x4f,
        0xcd, 0xc0, 0x04, 0x1d, 0x08, 0x6d, 0x3b, 0x50, 0x33, 0x31, 0xad, 0x71,
        0x09, 0xfb, 0xdf, 0x1b, 0xc2, 0x53, 0xc1, 0x5f, 0x23, 0x98, 0x0f, 0x04,
        0x6a, 0x96, 0x91, 0x12, 0x27, 0xb7, 0xc2, 0x5d, 0xc4, 0x57, 0x95, 0xe4,
        0xc5, 0x90, 0x9c, 0x35, 0xa8, 0xf0, 0x14, 0x4a, 0xe8, 0x3a, 0x94, 0x56,
        0xdc, 0x02, 0xe2, 0x48, 0x6e, 0x58, 0x98, 0xf8, 0x49, 0x8c, 0xca, 0x91,
        0x5c, 0x77, 0x02, 0xeb, 0xfc, 0xc9, 0xf4, 0xc2, 0x46, 0x49, 0x14, 0x58,
        0xf2, 0x08, 0xb8, 0x77, 0xd8, 0x6d, 0xbb, 0xc6, 0x6a, 0xf5, 0x17, 0xdf,
        0x23, 0x39, 0x7f, 0x63, 0xa2, 0x28, 0xa1, 0xbd, 0x38, 0xbb, 0x46, 0x6f,
        0xd7, 0x78, 0x27, 0x0c, 0x38, 0x58, 0x3d, 0x64, 0xe5, 0x0c, 0x50, 0x76,
        0x7f, 0x1d, 0x3e, 0x02, 0xe1, 0xb0, 0xac, 0x14, 0x88, 0x7f, 0x68, 0xe2,
        0x61, 0xd1, 0x26, 0xaf, 0x47, 0x2f, 0x6f, 0xc5, 0x52, 0xa3, 0xdb, 0x95,
        0x92, 0x7b, 0x63, 0x7e, 0xb9, 0x4c, 0x18, 0x6f, 0x8c, 0x34, 0x0d, 0xf1,
        0x84, 0x74, 0x54, 0x53, 0x1a, 0xf7, 0x12, 0xda, 0xf8, 0xc0, 0x5f, 0xf0,
        0x47, 0x93, 0x0e, 0x03, 0x5f, 0xaa, 0x1e, 0x04, 0x98, 0x78, 0xde, 0xd0,
        0xf8, 0x77, 0xe7, 0xa8, 0x41, 0xfc, 0xcb, 0x3e, 0x3f, 0xbd, 0x83, 0x01,
        0x7e, 0x90, 0xd5, 0x5a, 0x53, 0x54, 0xe7, 0xb3, 0x29, 0x73, 0x78, 0x12,
        0x71, 0x18, 0x70, 0x70, 0xb8, 0x70, 0x03, 0x3e, 0xa4, 0x78, 0x48, 0xe1,
        0xf5, 0xf9, 0xfa, 0xb9, 0xef, 0x3d, 0x6b, 0x3f, 0x92, 0x38, 0x77, 0x1a,
        0x43, 0x52, 0xc6, 0x97, 0x00, 0xa5, 0xc7, 0x26, 0x2b, 0x36, 0x1b, 0x15,
        0x91, 0x5b, 0x8d, 0x5f, 0xca, 0x24, 0xc0, 0x1a, 0x9a, 0xc3, 0xa7, 0xa1,
        0xe2, 0x71, 0x97, 0x52, 0xdc, 0x2d, 0xc3, 0xb2, 0xab, 0x1f, 0x8c, 0x0a,
        0x65, 0xec, 0x95, 0x0b, 0xe6, 0xc0, 0xf1, 0xac, 0xf4, 0x58, 0xf3, 0x4d,
        0x8f, 0x68, 0x70, 0xa4, 0xb6, 0x5e, 0xb7, 0xea, 0xeb, 0x5c, 0xbc, 0x52,
        0xfe, 0x71, 0xad, 0x06, 0xed, 0x7f, 0x06, 0xb8, 0xcf, 0x17, 0x47, 0x04,
        0xfa, 0x94, 0x76, 0x9c, 0x42, 0x98, 0xb2, 0x75, 0xfa, 0x1c, 0xa6, 0x0a,
        0xac, 0x41, 0x5e, 0x95, 0x0c, 0x30, 0x8c, 0xa3, 0x20, 0x08, 0xcd, 0xf6,
        0x64, 0x35, 0xb2, 0x0f, 0x47, 0x0b, 0x9f, 0x0c, 0x1f, 0x2c, 0x8a, 0x83,
        0xda, 0xa0, 0x55, 0x68, 0x43, 0x28, 0xfb, 0xcc, 0x91, 0x74, 0x36, 0xc1,
        0x65, 0xb2, 0x2f, 0x6b, 0xaf, 0xb0, 0xaa, 0x06, 0x40, 0xdc, 0x80, 0xd9,
        0xcf, 0xdd, 0xdf, 0xb6, 0x49, 0xa8, 0x42, 0xa4, 0xce, 0xb3, 0x83, 0xda,
        0x5f, 0x43, 0x89, 0x46, 0x33, 0x7c, 0x4a, 0xb1, 0x6b, 0xdf, 0xac, 0x04,
        0x23, 0x62, 0x1a, 0x7e, 0x16, 0x91, 0xf4, 0xb8, 0xc6, 0xc8, 0x65, 0x9e,
        0xbb, 0x22, 0x76, 0x8b, 0xf5, 0xf1, 0xba, 0x20, 0x36, 0xf0, 0xbd, 0x00,
        0xa9, 0x9f, 0x2e, 0x1c, 0x47, 0x8f, 0x5c, 0xef, 0x12, 0x25, 0xe3, 0x95,
        0xcd, 0xf8, 0x61, 0xc6, 0x65, 0x0b, 0xae, 0xef, 0xe4, 0x68, 0xbb, 0x55,
        0x74, 0x8a, 0x12, 0xe0, 0x9c, 0x5c, 0x38, 0x3b, 0xc1, 0x96, 0xab, 0xc9,
        0x2f, 0x94, 0xe0, 0xc9, 0xbf, 0x1d, 0x2e, 0x25, 0xa1, 0xfd, 0xe9, 0xd0,
        0xa3, 0x0d, 0xec, 0x98, 0x8b, 0x7a, 0x39, 0xe0, 0x39, 0x99, 0x4f, 0xb7,
        0xb7, 0x6e, 0x1e, 0x1b, 0xd8, 0xba, 0x53, 0x1e, 0xa0, 0x85, 0xf2, 0x4e,
        0x4a, 0xcf, 0x27, 0x6e, 0xbb, 0x5f, 0xcf, 0x9a, 0xaf, 0x6d, 0x93, 0x23,
        0xbe, 0x2d, 0x7c, 0xdd, 0x4e, 0xb5, 0x6f, 0xe7, 0xde, 0xf0, 0x3f, 0xbb,
        0x2d, 0xba, 0x0e, 0x36, 0x15, 0x17, 0x8c, 0xf6, 0x64, 0xfe, 0x1a, 0x91,
        0x4e, 0x1c, 0xd8, 0x42, 0x6f, 0x1c, 0x31, 0x57, 0x2c, 0xa8, 0x24, 0xa8,
        0x40, 0x73, 0xd8, 0x9d, 0xe8, 0xd4, 0xab, 0xa1, 0x04, 0x8e, 0xf5, 0x63,
        0x58, 0x70, 0x70, 0xb6, 0x05, 0xec, 0x19, 0x10, 0x03, 0xee, 0x51, 0x20,
        0x9c, 0xef, 0x9b, 0x26, 0xc2, 0xd0, 0xc0, 0x30, 0x81, 0x26, 0xa6, 0x8c,
        0xe7, 0x6c, 0x00, 0x4d, 0x7d, 0x42, 0xba, 0xc2, 0xf5, 0xc1, 0x51, 0x8f,
        0x70, 0xe8, 0x3b, 0xc8, 0xb8, 0x97, 0xd3, 0x21, 0x7c, 0x6b, 0x17, 0x98,
        0xf6, 0x4c, 0x8b, 0x86, 0x76, 0xeb, 0x9d, 0x0e, 0xb2, 0x1f, 0xa1, 0x7e,
        0x74, 0xfc, 0x26, 0xd1, 0x72, 0xed, 0x25, 0x1f, 0x46, 0xed, 0xbe, 0x55,
        0x2e, 0x80, 0x05, 0x58, 0x8a, 0x11, 0x2e, 0x83, 0x0c, 0xa3, 0xa8, 0x93,
        0x91, 0x8a, 0x2d, 0xba, 0xc4, 0xfa, 0xa3, 0x81, 0x8b, 0x33, 0x7b, 0xe6,
        0xd7, 0xfc, 0xcb, 0xf5, 0x82, 0x5c, 0xc6, 0x37, 0xd5, 0x7a, 0x25, 0x53,
        0x3e, 0xe0, 0xaf, 0xaf, 0xe2, 0x9a, 0x48, 0x94, 0x31, 0x60, 0xdb, 0x29,
        0xad, 0x0f, 0xe4, 0x7d, 0x6d, 0xd4, 0x11, 0x6f, 0xfc, 0x47, 0x76, 0x8f,
        0x7c, 0xbc, 0xe0, 0xa5, 0xd4, 0xa0, 0x7b, 0x0e, 0x96, 0x2e, 0x82, 0xbc,
        0x03, 0x53, 0x64, 0x66, 0x38, 0xff, 0x24, 0xda, 0xc9, 0x1d, 0xfe, 0x83,
        0x88, 0xda, 0xfe, 0xdd, 0x30, 0x8f, 0xef, 0x46, 0xca, 0xb1, 0xd3, 0xcd,
        0xae, 0x17, 0x5c, 0xc3, 0x65, 0x89, 0x99, 0x1e, 0x42, 0x75, 0x20, 0x9c,
        0xe9, 0x50, 0x11, 0x2f, 0x62, 0xfb, 0xb9, 0x7b, 0x26, 0xdd, 0xdf, 0xa6,
        0x8d, 0x88, 0x99, 0xe8, 0x0f, 0x9a, 0x2a, 0xbf, 0x94, 0x87, 0xfc, 0x41,
        0xa7, 0x91, 0x98, 0x0e, 0xe5, 0xed, 0xaa, 0x1c, 0xaf, 0x75, 0xf2, 0x9f,
        0x38, 0xb9, 0x13, 0xdb, 0x19, 0xa7, 0x65, 0x85, 0xda, 0x14, 0x6d, 0x89,
        0xdb, 0xd3, 0xc4, 0xc5, 0x21, 0xb0, 0xc4, 0x78, 0x18, 0x72, 0x6c, 0x82,
        0x32, 0x06, 0x54, 0xb4, 0xda, 0x86, 0x5b, 0xc7, 0xeb, 0xe0, 0x26, 0x61,
        0x33, 0x17, 0xa5, 0x84, 0x0c, 0x70, 0x01, 0xe6, 0x4a, 0xa9, 0x87, 0xde,
        0x11, 0xe2, 0x40, 0xad, 0x16, 0xcc, 0xc7, 0xc4, 0x56, 0x80, 0x69, 0x1b,
        0xe2, 0x60, 0xd5, 0xe8, 0xf8, 0xfe, 0x43, 0xba, 0xf4, 0xe2, 0xab, 0x2f,
        0x64, 0xe3, 0x1e, 0xe7, 0xfb, 0xab, 0x39, 0xd9, 0x0c, 0x72, 0xff, 0x7d,
        0xf3, 0x17, 0x86, 0xd7, 0x15, 0x63, 0x11, 0xc9, 0x43, 0x42, 0xbf, 0x64,
        0x8b, 0x7c, 0xf3, 0xac, 0x2e, 0x3b, 0x8c, 0xf0, 0xc2, 0x60, 0x33, 0x1d,
        0xd0, 0x34, 0x6f, 0x9a, 0x13, 0x06, 0xd8, 0x6c, 0xb2, 0x9c, 0xf2, 0x62,
        0x05, 0xea, 0xae, 0x84, 0xa4, 0x01, 0xf8, 0x2e, 0x59, 0xd8, 0x5b, 0xfc,
        0xfc, 0x75, 0x80, 0x56, 0x8e, 0x5a, 0x9e, 0x9c, 0x9d, 0xb4, 0xfe, 0x00,
        0x4b, 0x77, 0xc4, 0x5b, 0x6b, 0x96, 0x40, 0x18, 0xf9, 0xf4, 0x3b, 0xcd,
        0xf7, 0x27, 0xf7, 0xaa, 0x1e, 0x20, 0xe9, 0xe9, 0xf6, 0xad, 0xfc, 0x41,
        0x3e, 0x38, 0xb1, 0x9b, 0xe7, 0x8e, 0x69, 0x84, 0x78, 0x1b, 0xac, 0xf0,
        0xd6, 0x4e, 0x6f, 0xd4, 0x20, 0xfb, 0xca, 0x8b, 0xe8, 0xab, 0x21, 0x45,
        0x93, 0x4c, 0x8e, 0x28, 0x6d, 0xb7, 0xec, 0xee, 0x71, 0x79, 0x83, 0x1a,
        0xfe, 0xc5, 0xff, 0xf1, 0xe5, 0x9f, 0x2e, 0x03, 0x6e, 0xee, 0x32, 0xd3,
        0xe6, 0x03, 0x73, 0xca, 0x6f, 0x8d, 0x7c, 0xc9, 0x7e, 0x95, 0x95, 0x1c,
        0x36, 0x88, 0xce, 0xa6, 0x5a, 0x3a, 0x52, 0x2f, 0x2f, 0xaa, 0xab, 0x5a,
        0xe1, 0x1b, 0x5d, 0x64, 0xeb, 0x14, 0x89, 0xe5, 0x9d, 0x8a, 0x70, 0xa4,
        0x3b, 0x56, 0xa4, 0x29, 0x80, 0x58, 0x39, 0x2b, 0x44, 0xf1, 0x74, 0x51,
        0xb6, 0x70, 0xd5, 0x4f, 0xdd, 0xf5, 0xbe, 0x4d, 0x2d, 0xbc, 0xa4, 0x7f,
        0xc1, 0xa8, 0xff, 0x1b, 0xf6, 0x02, 0x4a, 0xc1, 0x1c, 0x0f, 0xab, 0x80,
        0x07, 0x53, 0x0a, 0x65, 0x45, 0xad, 0x20, 0x95, 0x1f, 0xfd, 0x46, 0x1b,
        0xcb, 0x14, 0x19, 0xd2, 0x4d, 0xf3, 0x23, 0xa9, 0xc5, 0x7f, 0x44, 0x5d,
        0x66, 0x3a, 0xb3, 0x70, 0x1a, 0xf4, 0x09, 0x72, 0xb9, 0x65, 0x13, 0x2b,
        0x38, 0x21, 0xca, 0xaa, 0xa6, 0xc4, 0xfc, 0xf0, 0x68, 0x83, 0x18, 0x5d,
        0x65, 0x24, 0xca, 0x18, 0x8a, 0x1e, 0xc8, 0x6c, 0xf6, 0xeb, 0xe8, 0x65,
        0xcd, 0x31, 0x9e, 0x75, 0x5f, 0x4a, 0x03, 0xab, 0xc3, 0x9b, 0x5d, 0x5d,
        0x11, 0x63, 0x9f, 0x31, 0xb2, 0x4e, 0x61, 0xd2, 0x4f, 0x3a, 0x91, 0xe4,
        0xc2, 0x61, 0x2d, 0x47, 0x33, 0xb6, 0x55, 0xa5, 0x27, 0xd1, 0x95, 0x48,
        0xa3, 0xb1, 0xf4, 0x33, 0x5c, 0x9d, 0xb0, 0x83, 0xad, 0x1d, 0x2c, 0x19,
        0x09, 0xb8, 0xa7, 0xf2, 0x36, 0xd2, 0x0f, 0xd0, 0xa1, 0xe3, 0x39, 0x20,
        0x47, 0xd0, 0x02, 0x94, 0xd4, 0x69, 0xab, 0x5c, 0xf5, 0xe7, 0x1a, 0x82,
        0x8d, 0x90, 0x68, 0x5f, 0xa9, 0xeb, 0xcb, 0x3e, 0x9f, 0x8f, 0x4c, 0x64,
        0xdf, 0x44, 0xb3, 0xe3, 0x7d, 0xa5, 0xfc, 0x3d, 0x6e, 0x27, 0xa2, 0xc2,
        0x2d, 0xf6, 0xf4, 0x79, 0x16, 0xaf, 0xa6, 0x12, 0x12, 0x81, 0x65, 0xbd,
        0xa7, 0xc3, 0x75, 0xef, 0x0b, 0xfc, 0xa2, 0xff, 0xcc, 0x47, 0xc5, 0x46,
        0xf0, 0x24, 0x24, 0x95, 0x2d, 0x2d, 0xa3, 0x61, 0xde, 0x31, 0x49, 0x1b,
        0x18, 0x7e, 0x32, 0x11, 0x45, 0x41, 0x76, 0x76, 0xb2, 0x14, 0xd9, 0x97,
        0xee, 0x26, 0xbc, 0x47, 0xfb, 0xd5, 0xdb, 0xb7, 0xcb, 0xdd, 0x7b, 0x5b,
        0x93, 0x41, 0x86, 0x8f, 0xb8, 0x6d, 0x3f, 0xf9, 0x2a, 0x38, 0xec, 0xdb,
        0x0d, 0x72, 0xe1, 0x49, 0xfb, 0xb4, 0x1e, 0xde, 0x3b, 0xae, 0xe3, 0xc0,
        0x45, 0x3d, 0xf0, 0x02, 0x45, 0x2a, 0x1e, 0x84, 0xaa, 0xed, 0x88, 0x48,
        0x3d, 0xab, 0x09, 0x66, 0xcd, 0xbc, 0x10, 0xc9, 0x56, 0xb3, 0xf0, 0x51,
        0xb8, 0x69, 0xbd, 0xe6, 0xc0, 0x6e, 0xe4, 0x01, 0xd2, 0x6d, 0x0e, 0x47,
        0x7f, 0xed, 0x84, 0xe0, 0x09, 0x47, 0x29, 0x3d, 0x67, 0x7b, 0x85, 0x70,
        0xe7, 0x19, 0x50, 0x53, 0x9c, 0xe4, 0x6c, 0x1f, 0xba, 0xbb, 0x80, 0x28,
        0xc7, 0xac, 0x08, 0x77, 0xba, 0x92, 0xfa, 0xe1, 0x3f, 0x20, 0x8e, 0xae,
        0x0c, 0x6f, 0x0a, 0x2c, 0x68, 0x3d, 0x0e, 0xbc, 0x9e, 0xa9, 0x46, 0x43,
        0x28, 0x93, 0xb9, 0xd3, 0x3f, 0xcf, 0xf2, 0x00, 0xa9, 0x9b, 0x11, 0x8f,
        0xcb, 0xd8, 0x46, 0x83, 0x97, 0x90, 0xdf, 0xc1, 0x66, 0x1e, 0x66, 0x17,
        0x83, 0x30, 0xc6, 0x77, 0xcb, 0xc7, 0xfd, 0x1b, 0x2c, 0x3f, 0xd7, 0xf7,
        0xba, 0x97, 0x53, 0xf3, 0x17, 0x49, 0x24, 0x1b, 0xd2, 0x55, 0xba, 0xaf,
        0x3c, 0x04, 0x18, 0x64, 0x53, 0x4f, 0x2e, 0x1b, 0xa0, 0x83, 0xe6, 0x16,
        0xbf, 0xe8, 0xd1, 0xee, 0x96, 0x77, 0x1d, 0x4e, 0xe5, 0xd7, 0xd1, 0x66,
        0x40, 0x21, 0x23, 0xc6, 0x5c, 0xd4, 0x58, 0xf7, 0xa5, 0x71, 0xde, 0x40,
        0x40, 0xc7, 0x5f, 0xda, 0xb6, 0x07, 0x09, 0xed, 0x43, 0x77, 0x0e, 0x76,
        0x85, 0xba, 0x04, 0x24, 0xf9, 0xce, 0x11, 0x7e, 0x33, 0x0a, 0xe9, 0xe8,
        0x33, 0x0b, 0x6a, 0x75, 0xcc, 0x24, 0x26, 0x35, 0xf4, 0x89, 0xb6, 0x9e,
        0x52, 0xa7, 0x7f, 0x23, 0x05, 0xe3, 0x5c, 0x62, 0xcf, 0xd8, 0xdc, 0x74,
        0x24, 0x19, 0x99, 0x20, 0x7d, 0x28, 0x8a, 0x09, 0xd7, 0xc6, 0xec, 0x31,
        0x6b, 0x95, 0xd9, 0x6c, 0x73, 0x24, 0x27, 0x3d, 0xd0, 0xc2, 0x44, 0x96,
        0x92, 0x4b, 0x64, 0xe3, 0x26, 0x18, 0x78, 0x79, 0xc2, 0x98, 0x05, 0x1e,
        0x7a, 0x49, 0xa5, 0xa8, 0x70, 0x89, 0xf1, 0xe6, 0x76, 0xc7, 0x3c, 0x3d,
        0xa7, 0xe3, 0x15, 0xa4, 0x53, 0xfd, 0xb0, 0x5e, 0x4c, 0x29, 0x1d, 0x1b,
        0x8b, 0x12, 0x05, 0x55, 0xd2, 0x23, 0x28, 0x67, 0xb2, 0x3d, 0xd8, 0xe3,
        0x28, 0x2e, 0x79, 0x88, 0x17, 0x77, 0xab, 0x1b, 0xf0, 0x06, 0xfd, 0x24,
        0xc0, 0x25, 0xd7, 0xbf, 0x4b, 0x0d, 0x70, 0xf2, 0x84, 0xd5, 0x10, 0xb4,
        0xb8, 0x30, 0x00, 0x3f, 0xb2, 0xc1, 0x05, 0x8c, 0xcd, 0x09, 0x5a, 0xd0,
        0x7e, 0x9b, 0xaf, 0x4d, 0xe5, 0x9c, 0x2c, 0x30, 0xca, 0x45, 0xe4, 0x2c,
        0x4b, 0xcf, 0x98, 0x87, 0x3f, 0x46, 0x27, 0x5b, 0xd1, 0xe7, 0xbd, 0x02,
        0xa1, 0xf0, 0x1c, 0x4f, 0x7e, 0x1a, 0xf7, 0xe2, 0xa5, 0x38, 0x84, 0x8e,
        0xae, 0x48, 0xa5, 0x71, 0x44, 0x83, 0x2c, 0x0a, 0x09, 0x58, 0xfc, 0xfe,
        0x29, 0x11, 0x15, 0x31, 0xb2, 0xa3, 0xa6, 0x0f, 0x6b, 0xe1, 0xca, 0x2d,
        0xfd, 0x82, 0x5d, 0x41, 0xfe, 0x11, 0xd7, 0xd8, 0x9a, 0x15, 0xce, 0xb1,
        0x9c, 0x70, 0xc0, 0x0c, 0x06, 0xd8, 0x17, 0xac, 0x54, 0x42, 0x24, 0x6e,
        0x6a, 0x60, 0x4f, 0x28, 0x1f, 0xa5, 0xa5, 0x97, 0xd7, 0x32, 0x4b, 0x10,
        0x84, 0xd9, 0x3c, 0x1c, 0xce, 0x10, 0xf5, 0xac, 0x63, 0x84, 0x16, 0x89,
        0x26, 0x63, 0x4b, 0x94, 0xc1, 0xd7, 0x68, 0xc4, 0x5a, 0x4e, 0xe0, 0xbc,
        0xdf, 0x30, 0x47, 0x9f, 0x85, 0x96, 0x36, 0xc2, 0xed, 0x11, 0xb8, 0x12,
        0x15, 0x98, 0x4c, 0xe5, 0x69, 0x60, 0xca, 0x59, 0x48, 0xf8, 0xe2, 0xc8,
        0x82, 0x15, 0xdb, 0xeb, 0x84, 0xad, 0xd2, 0x6c, 0x73, 0xc5, 0x2d, 0x3f,
        0x17, 0x10, 0x7e, 0x51, 0x7e, 0x30, 0x96, 0x6a, 0x74, 0x3d, 0x20, 0x4c,
        0x15, 0xba, 0x94, 0xb8, 0x23, 0x65, 0x44, 0xe2, 0x0c, 0xd4, 0x1f, 0xae,
        0x9c, 0x7a, 0x1e, 0xa6, 0x9c, 0x23, 0x3a, 0x10, 0x6a, 0x6b, 0xde, 0xfe,
        0xa8, 0xf4, 0x37, 0xc8, 0x2c, 0xb2, 0xc1, 0xb2, 0xde, 0x0f, 0x18, 0x03,
        0x40, 0x30, 0x00, 0xf7, 0xed, 0x92, 0x25, 0x69, 0xc3, 0x2e, 0x78, 0xd5,
        0x17, 0x60, 0x23, 0x2f, 0xb1, 0xa2, 0x3a, 0x83, 0x23, 0x8f, 0xc6, 0x46,
        0x94, 0x53, 0xe1, 0x70, 0xd5, 0xed, 0x0c, 0x27, 0x6b, 0x99, 0x7d, 0x57,
        0xd7, 0x99, 0x17, 0x7e, 0xb0, 0x3c, 0x79, 0xa0, 0xf8, 0xf7, 0x6b, 0x44,
        0xb1, 0x44, 0xb3, 0x3b, 0xfa, 0x65, 0x1b, 0x6e, 0x8a, 0x9b, 0x3a, 0x0d,
        0xe2, 0x35, 0x92, 0xe7, 0x20, 0x21, 0xe1, 0x02, 0xbb, 0xef, 0x20, 0x13,
        0xe6, 0xc1, 0x33, 0x5b, 0xed, 0x4c, 0xd5, 0xa6, 0x25, 0xae, 0xb9, 0xe1,
        0x50, 0x5f, 0x91, 0x7d, 0x03, 0xf8, 0xa4, 0xb8, 0xce, 0x5e, 0xd9, 0x93,
        0x48, 0x03, 0xb1, 0x3d, 0x52, 0x06, 0x66, 0x6a, 0x69, 0xc6, 0x7c, 0x0d,
        0xd7, 0xbb, 0xd4, 0x44, 0x2d, 0xf0, 0x44, 0x0b, 0xc4, 0x2f, 0x44, 0x6e,
        0xf2, 0x24, 0xb3, 0x86, 0x61, 0x5e, 0xde, 0x57, 0xf9, 0xbb, 0xf6, 0xd5,
        0x24, 0xab, 0x8c, 0xa6, 0xf6, 0xff, 0xaa, 0x16, 0x71, 0x9b, 0xc6, 0xfd,
        0x17, 0x26, 0xac, 0xa1, 0xf8, 0x0d, 0xac, 0xcc, 0xb7, 0xae, 0xb2, 0x41,
        0x90, 0x52, 0xd9, 0x7d, 0xa9, 0x42, 0x17, 0x9e, 0x85, 0x8b, 0x73, 0xf3,
        0xfb, 0x4a, 0x9b, 0xe8, 0xe2, 0x70, 0x09, 0xda, 0xda, 0x40, 0x95, 0xa4,
        0xf6, 0x0d, 0x6a, 0xf1, 0xd6, 0x35, 0x7b, 0x1d, 0x8c, 0x1b, 0x68, 0x53,
        0x00, 0x34, 0x97, 0xf4, 0x1f, 0xca, 0x73, 0x34, 0xfd, 0xa3, 0xea, 0x02,
        0x28, 0xd2, 0xe9, 0x0e, 0xa3, 0xd3, 0x8c, 0xc8, 0xef, 0xeb, 0xfe, 0xad,
        0x6b, 0x58, 0x1d, 0xc4, 0xe8, 0x1a, 0x95, 0xe8, 0xbf, 0x7e, 0xe9, 0x4e,
        0x8e, 0x11, 0x82, 0x1d, 0x37, 0x51, 0xce, 0xf0, 0xae, 0x1f, 0x9c, 0x88,
        0x8c, 0x20, 0x9a, 0x84, 0x00, 0x92, 0x48, 0xfd, 0x10, 0xff, 0x27, 0x96,
        0x59, 0x3e, 0x60, 0x0b, 0x27, 0x04, 0xe2, 0x6a, 0x2b, 0xab, 0xf9, 0xd9,
        0xde, 0x29, 0x34, 0xf2, 0x82, 0xcb, 0x03, 0x4e, 0x94, 0x06, 0x35, 0x26,
        0x82, 0xf9, 0x10, 0xfc, 0x51, 0x32, 0xf2, 0x73, 0xe2, 0xfc, 0x8c, 0x77,
        0x23, 0x4d, 0x97, 0xd8, 0xdf, 0xc3, 0x96, 0xc2, 0xb9, 0x1b, 0xca, 0x92,
        0x2e, 0x81, 0x7d, 0xa3, 0x9d, 0x17, 0xb5, 0xf3, 0x18, 0x50, 0xd9, 0xca,
        0x61, 0x0d, 0xdb, 0xdd, 0xfc, 0x29, 0xe2, 0x28, 0x7d, 0xa8, 0xfa, 0xd8,
        0x39, 0x25, 0x04, 0xa0, 0xcf, 0x9f, 0x25, 0xcc, 0x06, 0x25, 0xd8, 0x9a,
        0x8d, 0x0e, 0x51, 0xf0, 0xe4, 0xe9, 0xad, 0x8d, 0xc3, 0xaa, 0xfd, 0x62,
        0xd1, 0xc7, 0x2f, 0xf3, 0x44, 0x98, 0x7f, 0xf5, 0x19, 0x8d, 0x6b, 0x6a,
        0x88, 0x9b, 0xc8, 0xf8, 0x2f, 0xe5, 0x61, 0x44, 0xf0, 0x19, 0xdd, 0x68,
        0xb4, 0x09, 0x06, 0xbe, 0xc5, 0xd6, 0x02, 0x7c, 0xf8, 0xe9, 0x93, 0x8a,
        0x76, 0x8e, 0xf3, 0x18, 0xc1, 0x0e, 0x5d, 0x1d, 0xb9, 0xfe, 0xfe, 0x18,
        0x4e, 0xe7, 0x49, 0xdc, 0x16, 0xc3, 0x14, 0x4d, 0x15, 0xcf, 0x9a, 0x1d,
        0x9c, 0x8f, 0x10, 0x1d, 0x04, 0x28, 0xca, 0x6f, 0x14, 0x18, 0xab, 0xca,
        0x4a, 0x8e, 0x1f, 0x72, 0x8e, 0x52, 0xd7, 0x8d, 0xaf, 0x37, 0xd5, 0x7d,
        0x97, 0xd7, 0xb3, 0x71, 0x83, 0xe5, 0x23, 0x2c, 0x0e, 0xd0, 0xa6, 0xd3,
        0x2a, 0x71, 0x41, 0x00, 0xd2, 0xf2, 0x16, 0xf1, 0x08, 0x0f, 0x4f, 0x51,
        0xf1, 0x4d, 0xbd, 0x2b, 0x9f, 0x24, 0xeb, 0x8f, 0xfe, 0x96, 0x86, 0xe5,
        0x9b, 0x97, 0xfc, 0x60, 0x75, 0x4f, 0x58, 0xde, 0x7b, 0xbd, 0xc5, 0xd0,
        0x43, 0x03, 0x56, 0xdd, 0x66, 0x4f, 0x91, 0x3f, 0x1d, 0xa6, 0xdf, 0x81,
        0xc0, 0x6a, 0x57, 0x88, 0x4d, 0x5b, 0x13, 0x3a, 0x65, 0x70, 0xc1, 0xd5,
        0x13, 0x49, 0x1b, 0x1e, 0xb1, 0xa8, 0xc9, 0xa2, 0x9d, 0xbf, 0xa4, 0xf6,
        0x7f, 0x32, 0x23, 0x6e, 0x52, 0x5e, 0xa2, 0x80, 0x93, 0xf1, 0xc7, 0xef,
        0x64, 0x89, 0x2d, 0x85, 0x39, 0x4d, 0xd8, 0xd6, 0xcc, 0x9d, 0x29, 0xcf,
        0x2d, 0x40, 0x1e, 0xc8, 0x96, 0x09, 0xbb, 0x44, 0x84, 0x5f, 0x78, 0x55,
        0xa2, 0xaf, 0x21, 0xab, 0x7e, 0xff, 0x44, 0x0e, 0xbc, 0x64, 0x86, 0x0b,
        0x81, 0xfc, 0xc6, 0xda, 0xd9, 0x33, 0xab, 0x0d, 0xb9, 0x09, 0xc3, 0x20,
        0xe7, 0x97, 0xd7, 0x67, 0x59, 0x22, 0x0b, 0x69, 0xac, 0xae, 0xc3, 0xe5,
        0x6e, 0xfb, 0x46, 0x33, 0xda, 0x68, 0x3a, 0xd9, 0x1b, 0x77, 0x76, 0xb0,
        0x03, 0x3a, 0x6a, 0x4c, 0xdf, 0x8e, 0x64, 0x59, 0x1e, 0xa0, 0x7b, 0x14,
        0x37, 0x2f, 0x58, 0xb9, 0xac, 0xdc, 0xe8, 0xd8, 0x00, 0x6f, 0x4f, 0x60,
        0xd8, 0xb0, 0xa2, 0x94, 0xda, 0x1f, 0x4f, 0xc6, 0xe6, 0x87, 0x8d, 0x1d,
        0x8d, 0xe8, 0xf0, 0x1a, 0xc1, 0xbd, 0x7c, 0x44, 0x3a, 0x9c, 0xb7, 0xf1,
        0x7b, 0x05, 0xc1, 0x3d
    ]),
    "Lavender Blush": new Uint8Array([
        0x78, 0x13, 0x92, 0x7b, 0xf6, 0x5a, 0xc1, 0x77, 0x86, 0xc9, 0x1c, 0x95,
        0xd6, 0x01, 0xa5, 0x00, 0xc0, 0x3c, 0x9d, 0x2d, 0x99, 0xe6, 0xd1, 0x0b,
        0xe1, 0x4c, 0xb6, 0x72, 0x55, 0x94, 0xb8, 0xa9, 0x96, 0x18, 0x59, 0xeb,
        0x75, 0xd2, 0x32, 0xf2, 0x56, 0xd6, 0x43, 0x9c, 0xf3, 0xef, 0xe4, 0x36,
        0x1d, 0x18, 0x6b, 0x82, 0x9b, 0x99, 0x53, 0x34, 0xeb, 0x87, 0x72, 0xbb,
        0x13, 0xae, 0xa4, 0x7f, 0x22, 0x63, 0x60, 0x38, 0x93, 0xf8, 0x7b, 0xce,
        0xf6, 0x03, 0x4a, 0xc6, 0xf4, 0x49, 0x2c, 0x2b, 0x16, 0xc5, 0x1c, 0x17,
        0xae, 0x43, 0x42, 0x53, 0x2a, 0x32, 0x2d, 0x6e, 0x23, 0xce, 0x2c, 0x66,
        0x87, 0x2a, 0x49, 0x31, 0x29, 0x9d, 0x6a, 0x7f, 0x96, 0x70, 0xdd, 0x9f,
        0xdd, 0x51, 0xf1, 0xa8, 0x70, 0x52, 0x62, 0xcf, 0x7f, 0x3e, 0x0d, 0x39,
        0x02, 0x62, 0x34, 0x5c, 0x03, 0xb4, 0x06, 0x72, 0x18, 0xed, 0x0e, 0x82,
        0xa9, 0x23, 0x25, 0xfd, 0xfe, 0x55, 0x8b, 0x62, 0xe6, 0xb5, 0xd8, 0x49,
        0x09, 0x47, 0xb1, 0x13, 0xa0, 0xd6, 0x6f, 0x5f, 0x28, 0x9f, 0x4b, 0x38,
        0x3b, 0x59, 0x0b, 0xa9, 0x27, 0xbd, 0x7d, 0xa9, 0xb6, 0x14, 0xec, 0x62,
        0x98, 0xef, 0xe7, 0x2d, 0x26, 0x75, 0xc8, 0x5f, 0xfa, 0x75, 0xec, 0x3e,
        0xde, 0x11, 0x23, 0x99, 0x1c, 0x90, 0x84, 0xb0, 0x15, 0xc1, 0xfa, 0xf1,
        0x39, 0x95, 0x12, 0xf7, 0x29, 0x0b, 0x64, 0xef, 0x3d, 0x2f, 0x54, 0x7b,
        0x42, 0xac, 0x74, 0x3a, 0x25, 0x70, 0x40, 0xbe, 0x1e, 0x24, 0x99, 0x8b,
        0xa9, 0x5e, 0xc9, 0x9d, 0x81, 0x77, 0x11, 0x3b, 0xd9, 0x4e, 0xa0, 0xc1,
        0xab, 0xd8, 0xb5, 0x80, 0x30, 0x52, 0xf7, 0x62, 0x61, 0xb8, 0xb1, 0xb1,
        0x38, 0x55, 0x97, 0xcf, 0xbd, 0x6a, 0x0d, 0xac, 0x1e, 0x23, 0x63, 0x04,
        0x57, 0xc1, 0xd0, 0xfe, 0x5d, 0x1b, 0x0e, 0x4d, 0x8c, 0xc5, 0x90, 0xa2,
        0x0f, 0x07, 0xcd, 0x93, 0xd3, 0x2d, 0x0d, 0xa9, 0xb7, 0x4b, 0x21, 0xac,
        0x50, 0x61, 0xc6, 0x50, 0x28, 0x39, 0x5c, 0x3a, 0xf0, 0x6c, 0xa4, 0xe4,
        0xcb, 0x8c, 0x23, 0xfb, 0x0f, 0x79, 0x0d, 0x27, 0x56, 0x07, 0x78, 0xca,
        0x2e, 0xf9, 0x4e, 0x1d, 0x35, 0xd6, 0x08, 0xed, 0xae, 0x4e, 0x9f, 0x0e,
        0x65, 0x58, 0x6d, 0x9f, 0x2d, 0xe9, 0x86, 0x66, 0x6c, 0x80, 0x50, 0x14,
        0x6a, 0xf5, 0x5c, 0xb7, 0x46, 0x34, 0x9b, 0x1c, 0xc7, 0xc8, 0xd4, 0x67,
        0x5f, 0xeb, 0x54, 0xa3, 0x74, 0x82, 0x3c, 0x13, 0xfa, 0x5a, 0x7f, 0xd9,
        0xe9, 0x94, 0x60, 0x68, 0x4e, 0x00, 0x88, 0x5a, 0xf3, 0x80, 0xba, 0xe6,
        0xc4, 0xc2, 0xa5, 0x2a, 0x35, 0xf2, 0x01, 0x2f, 0xbd, 0x65, 0xea, 0x2c,
        0x31, 0x20, 0x47, 0xcf, 0x20, 0x96, 0x9b, 0x25, 0x89, 0x59, 0x39, 0xec,
        0x5a, 0x1b, 0xfd, 0xef, 0x0f, 0x16, 0xe3, 0x9c, 0x38, 0xef, 0x02, 0x56,
        0x2d, 0x74, 0x1a, 0xaf, 0xba, 0x91, 0xf0, 0x0e, 0x08, 0xa6, 0x0f, 0xe8,
        0x4d, 0xfd, 0x77, 0xdd, 0x33, 0xd6, 0x57, 0xb2, 0x2f, 0x5b, 0x13, 0x0a,
        0x0d, 0x8c, 0x3b, 0xb2, 0x28, 0xac, 0xed, 0x92, 0x84, 0x12, 0xa8, 0x85,
        0x66, 0x0a, 0x4e, 0x37, 0xe9, 0x45, 0xa2, 0x9b, 0x06, 0xa6, 0x62, 0x84,
        0xf2, 0x1b, 0x17, 0x44, 0xad, 0x44, 0x63, 0xc8, 0x32, 0x0f, 0xdc, 0x64,
        0x1f, 0x16, 0x5d, 0xf4, 0xa7, 0x14, 0x55, 0x49, 0x38, 0x75, 0x72, 0xa6,
        0x48, 0x72, 0x56, 0x6d, 0xff, 0x82, 0x51, 0x05, 0xe1, 0x77, 0xb1, 0xb1,
        0x88, 0xd9, 0x1b, 0x75, 0x73, 0x4f, 0x84, 0x44, 0xef, 0x85, 0xaa, 0x8b,
        0x7b, 0xf6, 0x5f, 0x0b, 0x6d, 0xaf, 0x19, 0x4c, 0xb9, 0x6e, 0x52, 0x83,
        0xe5, 0x2c, 0xd5, 0xf1, 0xb8, 0xd6, 0xa0, 0x0e, 0xc8, 0xde, 0x41, 0x80,
        0xb1, 0xc3, 0xd8, 0xbf, 0x48, 0x1c, 0x3a, 0x93, 0xd1, 0x86, 0xd2, 0x23,
        0x2d, 0x61, 0x3d, 0x6a, 0x61, 0x68, 0xd3, 0xd9, 0xfd, 0x4e, 0xa5, 0x88,
        0x45, 0x24, 0xcb, 0x9d, 0x55, 0x3a, 0x25, 0x74, 0xd5, 0xe2, 0x85, 0x79,
        0x4b, 0x1d, 0x88, 0x1c, 0x8b, 0x12, 0xc0, 0xe9, 0x50, 0xba, 0x50, 0x08,
        0xc0, 0x03, 0x63, 0x67, 0x64, 0xc7, 0xf0, 0x46, 0xc7, 0x10, 0x0b, 0xdd,
        0x70, 0x37, 0x82, 0x5a, 0x5c, 0x9f, 0x2b, 0xee, 0x99, 0xe5, 0xd7, 0x23,
        0x6e, 0xd5, 0x90, 0xb5, 0x02, 0x8c, 0x0b, 0xd5, 0x5c, 0x52, 0x4a, 0x4e,
        0x27, 0x85, 0x71, 0x14, 0x67, 0xf4, 0x9c, 0x52, 0xea, 0x5a, 0xfc, 0x85,
        0x56, 0xf7, 0x6e, 0xaf, 0xa9, 0x87, 0xa7, 0x0f, 0x02, 0xb4, 0xee, 0x79,
        0x26, 0xe7, 0xe7, 0x0d, 0x9c, 0x27, 0x14, 0xea, 0x9f, 0x1a, 0x28, 0x1b,
        0xe7, 0x70, 0xc5, 0x77, 0x43, 0xda, 0x23, 0x75, 0x36, 0xeb, 0x61, 0x78,
        0x0a, 0x09, 0x2c, 0xe5, 0x62, 0xaf, 0xcf, 0xee, 0xc7, 0x55, 0x86, 0x5b,
        0x19, 0x45, 0xfa, 0xe0, 0xca, 0xde, 0xae, 0xef, 0xbe, 0xc0, 0x7f, 0x8f,
        0xa1, 0x88, 0x40, 0xa6, 0xe3, 0x0a, 0x30, 0x5b, 0x82, 0x24, 0x22, 0x22,
        0x72, 0xbc, 0xe3, 0x50, 0xb5, 0xd2, 0x9a, 0xc9, 0xfc, 0x22, 0x46, 0xb2,
        0x2d, 0x7b, 0x1b, 0xfa, 0x70, 0x4f, 0x2b, 0x3b, 0x78, 0xe9, 0x81, 0xd5,
        0x2c, 0xcb, 0x03, 0x4e, 0xb7, 0x4d, 0x5b, 0x35, 0xfa, 0x15, 0xc9, 0x9d,
        0xe5, 0xe9, 0x0a, 0x26, 0xb3, 0xf0, 0x6b, 0xa0, 0x37, 0x42, 0x49, 0x63,
        0x8a, 0x5d, 0x6c, 0x34, 0xe0, 0x4e, 0xd8, 0xa6, 0xc0, 0xfb, 0x8b, 0x6c,
        0x1b, 0x24, 0x14, 0x0e, 0xb0, 0x80, 0x1e, 0xee, 0xc0, 0x4a, 0x04, 0x99,
        0x97, 0xdb, 0xf2, 0xce, 0xe2, 0x18, 0x7b, 0x36, 0xdb, 0xa6, 0x60, 0xbf,
        0x45, 0xfa, 0x5c, 0xa4, 0x3d, 0x42, 0xde, 0x17, 0x43, 0xa9, 0x53, 0x11,
        0xd4, 0x4a, 0x9a, 0xa7, 0x1b, 0x2a, 0x20, 0x46, 0x57, 0x54, 0x4e, 0x6f,
        0x8f, 0xd5, 0x73, 0xa0, 0x8e, 0xf3, 0x6d, 0x87, 0x55, 0xe3, 0x1b, 0xed,
        0x7a, 0xdf, 0x11, 0x89, 0x1d, 0x01, 0x8f, 0xf5, 0xba, 0x06, 0xc0, 0xd8,
        0x38, 0x1d, 0xc4, 0x31, 0x10, 0xa6, 0xf5, 0xe3, 0x8c, 0x7c, 0xa9, 0x56,
        0x93, 0x3f, 0x20, 0xc2, 0xa8, 0x8f, 0x24, 0x4a, 0x5c, 0xb8, 0x37, 0x34,
        0xc5, 0x67, 0x97, 0x17, 0x2c, 0x90, 0x91, 0x1f, 0xfb, 0xdf, 0x5b, 0x09,
        0x04, 0x0e, 0xb6, 0x6f, 0xf8, 0x03, 0x23, 0xd0, 0x09, 0x45, 0x03, 0x54,
        0x16, 0xb6, 0x6f, 0x10, 0x07, 0x78, 0x62, 0xe6, 0x87, 0x76, 0x4b, 0x62,
        0xfc, 0xbf, 0x89, 0x4e, 0x92, 0x9e, 0x30, 0x1c, 0xa7, 0xe2, 0x77, 0xa7,
        0x5b, 0x92, 0x15, 0xa4, 0xef, 0x03, 0x1a, 0x0f, 0x49, 0x1e, 0x05, 0xd0,
        0xdc, 0x14, 0x06, 0x2a, 0x40, 0xd2, 0x5e, 0xf3, 0x69, 0x83, 0xf8, 0x34,
        0xb9, 0xc6, 0x3d, 0x86, 0x1b, 0x37, 0x64, 0x67, 0x20, 0x36, 0x53, 0x5f,
        0x3c, 0xc8, 0xd2, 0x09, 0x7a, 0xb6, 0xd0, 0x50, 0xad, 0xab, 0xc8, 0xb9,
        0xb9, 0xa1, 0x3f, 0x02, 0xf9, 0xc9, 0x5b, 0x8f, 0x8b, 0x5d, 0x00, 0xc8,
        0xf0, 0x74, 0xb6, 0x63, 0xde, 0x7b, 0x1c, 0x7e, 0x02, 0xf2, 0x60, 0x1a,
        0x48, 0xef, 0xad, 0x08, 0x83, 0x1d, 0x53, 0x21, 0xeb, 0xeb, 0xa5, 0xbb,
        0xb1, 0x89, 0x47, 0xe1, 0x43, 0x44, 0x35, 0xf5, 0xbb, 0xf5, 0x0f, 0x35,
        0x29, 0x9e, 0xb8, 0x74, 0x4c, 0x45, 0x58, 0xcc, 0x64, 0x49, 0x19, 0x92,
        0x0a, 0xff, 0xdc, 0xf6, 0x05, 0xc7, 0xc2, 0x37, 0xb9, 0x89, 0xd1, 0xb1,
        0x07, 0x81, 0x8e, 0x20, 0x2a, 0xdd, 0xc9, 0xb6, 0xbf, 0xe9, 0x2d, 0x58,
        0xd6, 0xc1, 0xd0, 0x61, 0x31, 0x4b, 0xbd, 0xd9, 0xc8, 0xa4, 0xd5, 0x4d,
        0x79, 0x94, 0xf4, 0xda, 0x06, 0x46, 0x2b, 0xb9, 0x3c, 0x11, 0xfc, 0xc9,
        0x32, 0x43, 0xce, 0xce, 0x5c, 0xf5, 0x2d, 0x08, 0xe6, 0xfa, 0xf3, 0x2d,
        0xe6, 0xeb, 0x2e, 0xd9, 0x05, 0xb1, 0x36, 0xf6, 0xd1, 0x86, 0x7a, 0x80,
        0x6f, 0x09, 0x7b, 0x47, 0xa4, 0x45, 0x20, 0x72, 0xe3, 0xee, 0x40, 0x84,
        0x78, 0x5b, 0x9e, 0x39, 0x92, 0xb4, 0x77, 0x11, 0x14, 0x85, 0x04, 0xb4,
        0x04, 0x11, 0xc9, 0x25, 0xb6, 0xd3, 0x6d, 0xcd, 0x0d, 0x5c, 0xc5, 0x60,
        0xad, 0xef, 0x21, 0x7e, 0xbf, 0x7c, 0xd6, 0xa3, 0xe0, 0x46, 0xa4, 0xa4,
        0x1a, 0xdd, 0xa1, 0x92, 0x84, 0x97, 0xde, 0xd9, 0xc4, 0xf8, 0xc6, 0x35,
        0xd3, 0xc5, 0x5f, 0x82, 0x4e, 0x64, 0x79, 0xb7, 0x89, 0x7a, 0x18, 0x6f,
        0xde, 0x72, 0xf3, 0x7a, 0xdd, 0xe1, 0x66, 0x0d, 0xa3, 0xd2, 0x12, 0xc3,
        0xdf, 0xfe, 0xc1, 0xa0, 0x9a, 0x0b, 0xf3, 0x6d, 0x6e, 0xc1, 0x9a, 0xd3,
        0x4d, 0x58, 0xa3, 0x98, 0x92, 0x30, 0xa3, 0x96, 0xd9, 0x10, 0x64, 0x5f,
        0x49, 0xfe, 0x2a, 0xac, 0xec, 0x25, 0xbc, 0x22, 0x80, 0x51, 0x4c, 0x5e,
        0xdf, 0x29, 0x3a, 0xca, 0x32, 0xa2, 0xa5, 0x02, 0x3c, 0x49, 0x93, 0xff,
        0x92, 0xa4, 0xb4, 0x2c, 0x72, 0xab, 0x47, 0xdf, 0xc6, 0xbb, 0xa7, 0xc8,
        0xf2, 0x5d, 0x2c, 0x15, 0x41, 0x82, 0x61, 0x61, 0xe5, 0xbf, 0x28, 0x4f,
        0x34, 0xed, 0xf4, 0xb7, 0xeb, 0xe5, 0x87, 0xf4, 0x26, 0x75, 0x93, 0x55,
        0x19, 0x8f, 0xeb, 0xc1, 0x11, 0x05, 0x2c, 0x6d, 0xec, 0x75, 0x88, 0x7e,
        0xa9, 0xd2, 0xc8, 0xac, 0xc6, 0xf0, 0xf1, 0xa5, 0x8e, 0xf6, 0xb1, 0x41,
        0xab, 0x31, 0x1c, 0x51, 0xf5, 0xb3, 0x34, 0xcb, 0x3c, 0x3e, 0x8b, 0xa4,
        0xb7, 0x74, 0x2b, 0x50, 0x9f, 0xf7, 0xb7, 0x5d, 0x42, 0x41, 0xa4, 0x95,
        0x43, 0xe5, 0x78, 0x2f, 0x45, 0xf8, 0xd4, 0x63, 0x0a, 0x6a, 0xe9, 0x5c,
        0x40, 0x96, 0xdb, 0x1a, 0xf9, 0xba, 0x6a, 0x40, 0xfd, 0x43, 0x0a, 0xc7,
        0xda, 0x05, 0x13, 0xf8, 0x80, 0x0b, 0xd7, 0x7e, 0xbe, 0x8d, 0x24, 0x9c,
        0xba, 0x37, 0x80, 0x6b, 0x67, 0x74, 0x4f, 0xdd, 0xd3, 0xc5, 0xdf, 0x1e,
        0xf6, 0x33, 0x3f, 0x08, 0x3b, 0xe5, 0x00, 0x04, 0x61, 0xb6, 0x90, 0x46,
        0x89, 0x19, 0xc7, 0x41, 0x24, 0x9a, 0x36, 0x71, 0x6e, 0x87, 0xc5, 0x30,
        0xa5, 0x24, 0x8d, 0x21, 0x18, 0x55, 0xc7, 0x2b, 0x3e, 0x81, 0xc3, 0x87,
        0xf0, 0xd8, 0x6d, 0xd0, 0xf0, 0x34, 0xdd, 0x94, 0x45, 0x4f, 0x60, 0xdb,
        0xef, 0x51, 0x62, 0x25, 0xa7, 0x8a, 0x42, 0x80, 0x22, 0xfe, 0xfa, 0x5a,
        0x65, 0x64, 0xd5, 0x8e, 0x34, 0xb7, 0xf3, 0x90, 0x92, 0x3e, 0xbd, 0x29,
        0xe8, 0x36, 0xb4, 0xb4, 0xd4, 0xbb, 0x27, 0x3e, 0x9a, 0xfc, 0xcb, 0x61,
        0xe3, 0x2d, 0x2b, 0x35, 0xc8, 0xc4, 0xab, 0x2c, 0x99, 0x6e, 0x7a, 0xc0,
        0xfc, 0xb2, 0x73, 0x12, 0xd9, 0x16, 0xbc, 0x57, 0xea, 0xdb, 0x29, 0x84,
        0x25, 0xdf, 0xdc, 0xe2, 0x9c, 0x92, 0x72, 0xb7, 0x41, 0xd2, 0x01, 0xa8,
        0x73, 0xe7, 0xd4, 0xb7, 0x8e, 0xf4, 0x0a, 0x40, 0x02, 0xb1, 0xd9, 0x17,
        0x78, 0xf5, 0x52, 0xfb, 0x5b, 0x0c, 0x7d, 0xbd, 0x78, 0x84, 0xdb, 0x89,
        0x0f, 0x25, 0xdb, 0x5e, 0x43, 0x1b, 0x8b, 0xf4, 0x8b, 0x94, 0x67, 0x80,
        0xdf, 0xe3, 0xe8, 0xdd, 0x5b, 0x0c, 0x61, 0x7c, 0x3c, 0x5a, 0x88, 0xc7,
        0x92, 0x4d, 0xa8, 0x65, 0xb4, 0xb5, 0x35, 0xb7, 0x99, 0xb2, 0xce, 0x41,
        0x73, 0x82, 0x49, 0x22, 0x71, 0x35, 0x7a, 0xc3, 0x5c, 0x71, 0x82, 0x37,
        0x71, 0x72, 0x76, 0x45, 0x9d, 0x52, 0x70, 0x03, 0x10, 0xcf, 0x1f, 0x0a,
        0xe8, 0x20, 0x87, 0xe9, 0xea, 0x85, 0x85, 0xd8, 0x25, 0xa1, 0xeb, 0x9f,
        0xe8, 0xee, 0x3c, 0x53, 0xa7, 0xb6, 0x50, 0x7c, 0xb2, 0xc0, 0x25, 0x77,
        0x39, 0x68, 0xb8, 0x2f, 0x7f, 0x91, 0x06, 0xe3, 0x19, 0x67, 0xca, 0x00,
        0x12, 0x0c, 0x67, 0xda, 0x16, 0xbe, 0xc8, 0xa1, 0x0d, 0x10, 0x93, 0xd9,
        0x65, 0x97, 0xda, 0x5c, 0x26, 0xd3, 0xa3, 0x0c, 0x50, 0x3e, 0xf3, 0xf1,
        0xf5, 0x58, 0x90, 0x9a, 0xf7, 0x67, 0x98, 0x3b, 0xe8, 0xea, 0xe4, 0xe7,
        0x6e, 0xdf, 0xc8, 0x11, 0x07, 0x04, 0x1e, 0x85, 0x14, 0x88, 0xcd, 0x6a,
        0x30, 0x47, 0xb5, 0x29, 0x69, 0x12, 0x3f, 0xa4, 0x26, 0xd9, 0x61, 0xae,
        0xf3, 0xf3, 0x33, 0x37, 0xad, 0x40, 0x74, 0xac, 0x4d, 0x05, 0xcc, 0x45,
        0x2c, 0x9e, 0x57, 0x23, 0xbe, 0xd5, 0x38, 0xcc, 0xe8, 0x7d, 0x17, 0x53,
        0xa9, 0x50, 0x45, 0x91, 0x73, 0xcb, 0xdd, 0xba, 0x95, 0x4b, 0x54, 0x5a,
        0xdc, 0x89, 0x34, 0x8a, 0x56, 0x0c, 0xa3, 0x9d, 0xda, 0x57, 0xa1, 0x5e,
        0x24, 0xcd, 0x35, 0x72, 0x31, 0xdb, 0x19, 0x73, 0xcd, 0x2e, 0xe8, 0xe5,
        0x17, 0x68, 0xe4, 0xa7, 0xbf, 0xf4, 0xf6, 0x08, 0xf2, 0x4e, 0x6e, 0xcc,
        0xc2, 0xb2, 0x5c, 0xc4, 0xde, 0xe2, 0x66, 0x71, 0xb2, 0x95, 0x86, 0xfb,
        0x69, 0x95, 0xda, 0x45, 0x7c, 0xbd, 0x1e, 0x6d, 0x9f, 0x37, 0x70, 0x8d,
        0x16, 0xdc, 0x93, 0x62, 0x26, 0x3e, 0x01, 0x24, 0x05, 0xd9, 0xd7, 0xcc,
        0x6a, 0xc5, 0x90, 0xf8, 0x2a, 0x04, 0x85, 0xef, 0xa4, 0xc7, 0x41, 0x34,
        0x11, 0x8f, 0x0e, 0x51, 0x33, 0xe8, 0x22, 0x1a, 0x37, 0x3d, 0x61, 0xa2,
        0x84, 0x25, 0xb0, 0x66, 0x48, 0xe2, 0x07, 0xe9, 0x74, 0xf0, 0x0b, 0x5e,
        0xf4, 0x54, 0xab, 0x4b, 0x05, 0x89, 0x0e, 0xa0, 0xd9, 0x00, 0xdb, 0x53,
        0x2a, 0x88, 0x04, 0xd3, 0x3a, 0xe3, 0x35, 0xad, 0x0b, 0xcf, 0x84, 0x56,
        0x29, 0x6b, 0x1c, 0xfd, 0x91, 0x9d, 0xe1, 0x45, 0x89, 0xc9, 0xb0, 0x9b,
        0x67, 0x0b, 0x09, 0x18, 0xf6, 0x5d, 0x4d, 0x5e, 0xe9, 0x7f, 0x49, 0x27,
        0x33, 0x18, 0x26, 0x1d, 0x88, 0x68, 0x3c, 0x2a, 0xa5, 0x8a, 0xa0, 0xa9,
        0x5d, 0xbc, 0x14, 0x7e, 0xad, 0x4c, 0x84, 0xf7, 0x4a, 0xb5, 0xad, 0x06,
        0x98, 0x20, 0xcf, 0x56, 0x0f, 0x85, 0x97, 0x71, 0x2b, 0x33, 0xf6, 0x39,
        0x97, 0xd4, 0xa7, 0xd0, 0x68, 0x38, 0xe9, 0xae, 0x51, 0x83, 0x0d, 0x5b,
        0xc4, 0xb8, 0x08, 0x2a, 0x44, 0x61, 0xbb, 0x5f, 0x2a, 0x78, 0xb4, 0xf2,
        0xf1, 0xee, 0xa8, 0x22, 0x51, 0xf6, 0x77, 0x8c, 0xa6, 0x23, 0x93, 0x8c,
        0x9d, 0x7b, 0x09, 0xae, 0x4e, 0x1b, 0x08, 0xb5, 0x00, 0x3a, 0x2b, 0x12,
        0x2a, 0x92, 0x75, 0x8b, 0xc9, 0x26, 0x6c, 0x95, 0x22, 0xa0, 0x05, 0x4e,
        0x9d, 0xb1, 0xb8, 0x8e, 0xc9, 0x6c, 0xb6, 0x67, 0x79, 0x50, 0xc3, 0x57,
        0x37, 0xe6, 0xdb, 0x5a, 0xeb, 0x53, 0xeb, 0x07, 0x7c, 0x5c, 0x5e, 0x7c,
        0x4b, 0x99, 0x04, 0xec, 0xe3, 0x93, 0xff, 0x90, 0xb1, 0x37, 0xd6, 0xe6,
        0xa4, 0xda, 0xeb, 0x2c, 0x4b, 0x0f, 0xfd, 0x92, 0x42, 0x3c, 0x8f, 0x80,
        0xcf, 0x68, 0x68, 0xc9, 0x95, 0xb4, 0xf2, 0x8a, 0x94, 0x01, 0x0a, 0xec,
        0x54, 0xbe, 0xe5, 0x13, 0x19, 0x3a, 0x17, 0x0e, 0xfc, 0x7a, 0xa9, 0x02,
        0xb1, 0x65, 0xfa, 0x69, 0xfb, 0xfa, 0x37, 0x3d, 0x2e, 0x1d, 0xac, 0xbf,
        0xac, 0x6f, 0xb2, 0x07, 0xfd, 0xa8, 0xa9, 0xb7, 0x1f, 0x10, 0x5f, 0x28,
        0x63, 0xf8, 0xc1, 0x86, 0x90, 0x93, 0x51, 0x89, 0x33, 0xdb, 0x34, 0x73,
        0x85, 0xac, 0x5b, 0x8b, 0x56, 0x1a, 0xf9, 0xff, 0x8a, 0x14, 0xd0, 0xf5,
        0xd7, 0xe0, 0x45, 0x96, 0x22, 0x70, 0xfc, 0x32, 0xd9, 0x4c, 0x3d, 0x2d,
        0x45, 0x3d, 0xed, 0x77, 0x0f, 0xf5, 0x79, 0xa2, 0xe6, 0x52, 0xc4, 0x7a,
        0x5c, 0x7a, 0xb7, 0xa7, 0xb5, 0x66, 0x42, 0xf8, 0x9d, 0x2a, 0x59, 0x95,
        0x8e, 0x2a, 0x92, 0x35, 0x32, 0xd6, 0xb0, 0xaa, 0x60, 0xfb, 0xdf, 0x59,
        0x05, 0xb8, 0x70, 0xe7, 0x01, 0xdf, 0xe4, 0x56, 0x6d, 0xf7, 0x3f, 0x44,
        0xa7, 0x42, 0x83, 0x50, 0xef, 0x6a, 0x13, 0x5e, 0x12, 0x1e, 0x3f, 0x84,
        0x59, 0x44, 0x2e, 0x5d, 0xbf, 0x90, 0x11, 0x79, 0xfe, 0x13, 0xd9, 0xbf,
        0xd3, 0xfa, 0x9a, 0x63, 0x0a, 0x87, 0x88, 0x14, 0x04, 0x28, 0x67, 0x9f,
        0xdb, 0x42, 0xbd, 0x1a, 0x18, 0xeb, 0xd1, 0xd6, 0x01, 0x60, 0xc1, 0x28,
        0x1f, 0x61, 0x60, 0x86, 0x8e, 0x32, 0x0a, 0x7c, 0x03, 0x09, 0xa7, 0xe4,
        0xff, 0x67, 0xfc, 0x85, 0x2d, 0xa0, 0x5d, 0x3d, 0x41, 0xe5, 0xf5, 0xc0,
        0x84, 0xdf, 0xe6, 0xd8, 0x8d, 0xed, 0x44, 0xbf, 0x0e, 0xa8, 0xc6, 0xaa,
        0x25, 0x6f, 0xd5, 0x0c, 0x9f, 0x01, 0x8c, 0xb9, 0x68, 0xef, 0x5f, 0x43,
        0x42, 0x81, 0x94, 0xbb, 0xab, 0x1c, 0x30, 0xe8, 0xad, 0xd4, 0xbd, 0x26,
        0xcd, 0xd2, 0x01, 0x02, 0x27, 0x42, 0x4d, 0x78, 0x63, 0x48, 0x44, 0xd7,
        0x9c, 0x35, 0xba, 0x7a, 0x43, 0x74, 0x73, 0x07, 0x36, 0x0e, 0xf8, 0xb1,
        0x93, 0x0f, 0x6f, 0x33, 0x92, 0xb2, 0x93, 0x48, 0xd6, 0x23, 0x3b, 0x87,
        0xa4, 0xf6, 0x50, 0x39, 0xfd, 0x88, 0xcb, 0xc4, 0x87, 0xe8, 0x42, 0x7d,
        0x54, 0xf5, 0x9b, 0xe9, 0x14, 0x63, 0xf1, 0xc3, 0x83, 0x4d, 0x5d, 0xd2,
        0x4b, 0xda, 0x06, 0x27, 0x3d, 0x6e, 0x52, 0x5b, 0x39, 0x9d, 0x4d, 0x12,
        0xfe, 0x28, 0x56, 0x89, 0x17, 0x19, 0xb0, 0xd7, 0x78, 0xc8, 0x14, 0xf1,
        0xa9, 0xb6, 0xd3, 0x3f, 0x4d, 0xa6, 0x98, 0x5e, 0x51, 0xed, 0x7a, 0x44,
        0xb3, 0x5e, 0x77, 0x4d, 0xea, 0x39, 0x7f, 0x41, 0xda, 0x37, 0x3b, 0x7c,
        0xdc, 0x24, 0xfb, 0x63, 0xf6, 0xc0, 0x27, 0xb1, 0xa9, 0xa4, 0xee, 0x3d,
        0xce, 0x6e, 0xa8, 0x4f, 0xaf, 0x5a, 0x7e, 0xd1, 0xa9, 0x31, 0xee, 0xaa,
        0xff, 0x44, 0xcf, 0x75, 0x67, 0xd1, 0xa3, 0x07, 0x60, 0x8a, 0x17, 0x58,
        0xd6, 0xca, 0x3e, 0xcd, 0xcb, 0xc8, 0x10, 0x2a, 0x84, 0x4d, 0xdd, 0x1d,
        0x02, 0x1c, 0x8c, 0x74, 0xf3, 0xa3, 0xb8, 0xe7, 0x92, 0x72, 0x79, 0xee,
        0x8d, 0x0a, 0xd9, 0x16, 0xf8, 0x86, 0xbe, 0x5d, 0x16, 0xae, 0x67, 0x8b,
        0x70, 0x87, 0xa2, 0xd2, 0x15, 0xc5, 0x76, 0x17, 0xd9, 0x94, 0x10, 0xf2,
        0xa9, 0x9b, 0xc7, 0xa6, 0xfc, 0xe2, 0xfe, 0xc6, 0x9f, 0x63, 0x43, 0xa7,
        0xc0, 0x63, 0xcb, 0x95, 0xef, 0x05, 0xaa, 0x68, 0x33, 0x03, 0x70, 0x68,
        0x63, 0x79, 0x60, 0xba, 0xae, 0xe7, 0x2f, 0x8b, 0x6f, 0x22, 0xca, 0xdb,
        0xe1, 0xc4, 0x83, 0xb7, 0xca, 0x9e, 0x9e, 0xb8, 0x06, 0x1b, 0xcf, 0xd4,
        0xc5, 0x87, 0x4f, 0x00, 0xb5, 0x6e, 0x2a, 0x2a, 0x49, 0x62, 0xb8, 0x95,
        0x11, 0xd4, 0xe0, 0x20, 0xb7, 0x1b, 0x5a, 0x81, 0x7f, 0xc1, 0xe9, 0xe6,
        0xd0, 0x38, 0xa7, 0x9c, 0x6f, 0xa2, 0xf3, 0x18, 0xb4, 0xf0, 0xcb, 0x06,
        0x23, 0x49, 0x24, 0x39, 0x19, 0x41, 0xdc, 0xa6, 0x58, 0x9f, 0x9c, 0x77,
        0xc7, 0x40, 0xa5, 0xcf, 0xba, 0xdd, 0x80, 0x6a, 0xfa, 0x5d, 0x4a, 0xcd,
        0x82, 0xa6, 0xcc, 0x16, 0xc3, 0x3e, 0xaa, 0xc9, 0xa4, 0x72, 0x02, 0x03,
        0xae, 0xbc, 0x52, 0x81, 0xb7, 0x73, 0xe8, 0x5b, 0xb3, 0x85, 0xf8, 0xff,
        0x29, 0xc8, 0x86, 0x8d, 0x84, 0x57, 0x2a, 0xe7, 0x67, 0x37, 0x2d, 0x66,
        0x3e, 0xb9, 0x2d, 0x13, 0xec, 0xb4, 0x8c, 0x41, 0xa0, 0x41, 0xd5, 0x91,
        0x83, 0x68, 0x34, 0xe4, 0xcc, 0x33, 0xc7, 0xee, 0xfc, 0xdc, 0xcf, 0xd9,
        0x41, 0xdb, 0xb9, 0xb3, 0x6b, 0x94, 0x55, 0x00, 0x08, 0xf8, 0xed, 0xdf,
        0x15, 0xad, 0xcc, 0x5c, 0xfc, 0x1f, 0x28, 0x96, 0xdc, 0x30, 0xd6, 0x14,
        0x88, 0x5e, 0x43, 0xb6, 0x59, 0xa5, 0x51, 0x3c, 0x77, 0x7c, 0x0a, 0x55,
        0xad, 0x0f, 0x67, 0x90, 0xf1, 0x54, 0x03, 0x1a, 0x4b, 0xac, 0x43, 0xdf,
        0xd6, 0xc0, 0x2c, 0xd3, 0xce, 0xed, 0x0f, 0x57, 0xbd, 0x8b, 0x70, 0x09,
        0x23, 0xf5, 0xef, 0x5d, 0x0a, 0x9c, 0xe5, 0x9f, 0x59, 0xc8, 0xc5, 0xa0,
        0xff, 0x91, 0x77, 0x2a, 0xfb, 0x4f, 0xd8, 0x06, 0x06, 0xe6, 0x13, 0x0b,
        0x4b, 0x74, 0xc0, 0xab, 0xc5, 0xbf, 0xf2, 0x7d, 0xf7, 0x21, 0xc3, 0xa9,
        0xeb, 0xee, 0x92, 0x2d, 0xcf, 0x5e, 0xc5, 0x7d, 0xc6, 0x1f, 0x24, 0x07,
        0x4f, 0xee, 0x75, 0x0f, 0xfd, 0x8e, 0x85, 0xdc, 0xd5, 0x35, 0x49, 0xa3,
        0x0d, 0x65, 0x59, 0x57, 0x3a, 0x2b, 0xe0, 0x9b, 0x30, 0xaf, 0xa1, 0xf5,
        0x44, 0x57, 0xce, 0x09, 0x55, 0x12, 0x46, 0xd3, 0x5d, 0x82, 0x92, 0xd5,
        0x87, 0x77, 0x50, 0x62, 0xbe, 0xeb, 0x25, 0x44, 0x70, 0x69, 0xe9, 0x40,
        0x0c, 0x12, 0xb6, 0x3d, 0x9b, 0x02, 0x99, 0xe5, 0x56, 0x5c, 0xb0, 0x1c,
        0x19, 0xca, 0x38, 0xe0, 0x71, 0xd0, 0xe4, 0xc7, 0x8b, 0x16, 0xfa, 0xbc,
        0x40, 0x71, 0x67, 0x7b, 0x45, 0xf9, 0x47, 0x82, 0xf5, 0x60, 0x8f, 0x3c,
        0x01, 0x8a, 0x4d, 0xd7, 0xd5, 0xe4, 0x87, 0x22, 0xe4, 0x11, 0xa8, 0xd6,
        0x60, 0x12, 0xc6, 0xfa, 0xf4, 0xf2, 0xaa, 0x62, 0x56, 0xbc, 0xf3, 0x3e,
        0x1b, 0xcd, 0xfc, 0x60, 0x67, 0x30, 0x13, 0x69, 0x02, 0xf3, 0x48, 0xf0,
        0xb4, 0xa5, 0x5a, 0x59, 0x75, 0x6d, 0x34, 0xab, 0x95, 0x61, 0x1e, 0x7c,
        0xea, 0xec, 0x49, 0x78, 0x1c, 0x1a, 0x0d, 0x15, 0x25, 0xa4, 0xe7, 0x85,
        0x0d, 0x75, 0x5e, 0x8f, 0xc0, 0x81, 0x79, 0xbe, 0x39, 0xf5, 0x2b, 0xdb,
        0x55, 0x39, 0x72, 0x0d, 0xd7, 0x38, 0xea, 0xf3, 0xcc, 0x57, 0x06, 0x45,
        0xfa, 0x8e, 0x01, 0xcb, 0x83, 0xd6, 0x6f, 0x48, 0xb2, 0xd1, 0x54, 0x37,
        0xab, 0xda, 0xce, 0xde, 0x29, 0x0f, 0xa9, 0xc7, 0x8e, 0xd6, 0xe3, 0x13,
        0x50, 0xd1, 0xbb, 0xed, 0xf6, 0xa1, 0xb2, 0xad, 0x3c, 0xdf, 0x07, 0x79,
        0x12, 0x5e, 0x81, 0xdb, 0x76, 0x8a, 0x6b, 0xb5, 0x14, 0x77, 0x8f, 0xca,
        0x86, 0xe0, 0xbe, 0x81, 0xb3, 0xce, 0x84, 0xd3, 0xb6, 0x10, 0xb3, 0x44,
        0xc5, 0x32, 0xdd, 0x07, 0x8c, 0xfb, 0x62, 0x56, 0xcb, 0xa4, 0x63, 0xce,
        0xaf, 0xd2, 0x3e, 0x3e, 0xf9, 0xee, 0x10, 0x14, 0x1c, 0x2d, 0x5e, 0x54,
        0x5f, 0x28, 0x11, 0xbe, 0x18, 0x9c, 0xef, 0x3b, 0xdb, 0x2a, 0xb7, 0x13,
        0x79, 0x1c, 0xd5, 0x4e, 0x7c, 0xac, 0x36, 0x37, 0x2b, 0xc7, 0x51, 0xf2,
        0x6f, 0x54, 0x54, 0x85, 0xa8, 0x5d, 0xcb, 0xc4, 0x78, 0x7a, 0x6a, 0x42,
        0x44, 0xdd, 0x25, 0xb4, 0x6a, 0xca, 0x5c, 0x97, 0x9b, 0x7c, 0xbc, 0x22,
        0x5d, 0x24, 0x77, 0xe2, 0xe3, 0xc5, 0x24, 0xcd, 0x00, 0x4e, 0x02, 0x60,
        0x62, 0x18, 0x3b, 0xf2, 0xd0, 0x62, 0x63, 0x57, 0x99, 0x82, 0x01, 0xf1,
        0x49, 0xf0, 0xce, 0x80, 0xee, 0x79, 0x57, 0x1d, 0xc7, 0x70, 0x4d, 0xce,
        0xa9, 0xf2, 0x11, 0xe3, 0x31, 0xfd, 0xb0, 0x06, 0x2f, 0x7d, 0x90, 0x4b,
        0xf9, 0xc7, 0xf9, 0x69, 0x9f, 0x9a, 0x63, 0x0f, 0x8f, 0x71, 0x66, 0x6f,
        0x47, 0xc5, 0x02, 0xe4, 0xd3, 0x90, 0x1d, 0x14, 0x52, 0xe0, 0x5a, 0x60,
        0x6a, 0x47, 0x5e, 0xdd, 0x0e, 0x7c, 0xf0, 0xd1, 0xa4, 0x37, 0x31, 0x8e,
        0xd3, 0x91, 0xfb, 0x5a, 0x0f, 0xa7, 0xeb, 0xb0, 0x89, 0xfd, 0x40, 0xab,
        0xc3, 0x79, 0x38, 0xc6, 0x0e, 0xca, 0xcf, 0x2a, 0x89, 0xf7, 0x3e, 0x47,
        0xec, 0xf6, 0x36, 0xee, 0x96, 0xd5, 0x22, 0xa7, 0x72, 0xb5, 0x7b, 0xcc,
        0x6d, 0x33, 0x6d, 0x24, 0xe6, 0x97, 0xf3, 0x85, 0x4d, 0xf7, 0x81, 0xc4,
        0x0b, 0xf5, 0xe8, 0x32, 0x35, 0x30, 0x60, 0x0b, 0x7a, 0x98, 0x39, 0xda,
        0x4b, 0x77, 0x6b, 0xcd, 0x50, 0x3e, 0x2e, 0x66, 0xdf, 0x75, 0x40, 0xc9,
        0xbb, 0x4a, 0x98, 0x10, 0x88, 0x66, 0x7f, 0xd4, 0xc7, 0xa6, 0x2d, 0x18,
        0x62, 0xf8, 0x9c, 0x11, 0xa5, 0xa6, 0xae, 0x22, 0xac, 0xb3, 0xd7, 0x2e,
        0xe7, 0xe6, 0xdc, 0xfc, 0x0c, 0xd5, 0x0c, 0x1a, 0x30, 0x8c, 0xd9, 0xf3,
        0x84, 0x46, 0x1e, 0xab, 0x84, 0x54, 0xcc, 0x70, 0x95, 0xef, 0xe5, 0x5f,
        0xd3, 0xd3, 0x0e, 0x19, 0x7e, 0x1a, 0x20, 0x39, 0x4e, 0xdc, 0xfb, 0xc0,
        0xde, 0xd8, 0x1e, 0x84, 0x56, 0x5c, 0xf3, 0xdc, 0x39, 0x04, 0x26, 0x26,
        0x2c, 0x3a, 0x40, 0x4e, 0xbc, 0x88, 0x7d, 0x4e, 0x93, 0x89, 0xa0, 0x6e,
        0xe2, 0x44, 0xeb, 0x6c, 0xfa, 0x2b, 0xd7, 0x24, 0xe0, 0xbc, 0x02, 0x8c,
        0x2e, 0x4b, 0x0b, 0x63, 0xe9, 0x01, 0xec, 0x39, 0xef, 0x23, 0xe5, 0x8b,
        0x12, 0xee, 0x84, 0x37, 0x3c, 0x46, 0x2a, 0xb8, 0xce, 0x89, 0x55, 0xcf,
        0x28, 0xca, 0x01, 0x11, 0x24, 0x60, 0xf1, 0xcf, 0x28, 0x60, 0x9f, 0x01,
        0x13, 0x71, 0x63, 0x89, 0x62, 0x32, 0x8b, 0x06, 0x84, 0xb0, 0xee, 0xc5,
        0x33, 0xae, 0x92, 0x38, 0xf3, 0xe5, 0x61, 0x7f, 0x24, 0xae, 0x21, 0x96,
        0x6c, 0x05, 0xa5, 0x93, 0xa8, 0xa0, 0xa5, 0x3d, 0xf5, 0xfc, 0xc3, 0x4b,
        0xba, 0xd1, 0xe7, 0xc0, 0x8e, 0xd2, 0x34, 0x8b, 0xf8, 0x4b, 0x9c, 0xc8,
        0xf2, 0xbc, 0x0b, 0x94, 0xec, 0x98, 0x60, 0x17, 0x0b, 0x58, 0xec, 0x35,
        0xe1, 0x2d, 0x85, 0x20, 0x88, 0xf6, 0xdd, 0x4d, 0xfb, 0xf0, 0x90, 0x31,
        0x0e, 0x91, 0x8f, 0x73, 0xfe, 0x83, 0xdc, 0x40, 0xd4, 0x31, 0x9f, 0x41,
        0x91, 0xff, 0x08, 0x19, 0x26, 0xf7, 0x03, 0x20, 0x8a, 0xb5, 0x06, 0xed,
        0x26, 0x18, 0x72, 0x25, 0xb2, 0xc1, 0xea, 0x05, 0x18, 0x48, 0x62, 0x17,
        0xb0, 0x21, 0xac, 0x01, 0x73, 0x70, 0x7f, 0x40, 0x84, 0xee, 0x1d, 0xda,
        0xbb, 0x30, 0xa4, 0x91, 0x44, 0x17, 0xb2, 0x77, 0x54, 0x03, 0x61, 0xd4,
        0x47, 0xc2, 0xaf, 0x01, 0x59, 0xd5, 0x34, 0x4f, 0x4e, 0xd6, 0xe1, 0x76,
        0xdb, 0xff, 0xaf, 0x09, 0x87, 0xd0, 0xfc, 0x79, 0xa6, 0xbd, 0xcb, 0xb6,
        0xff, 0xa8, 0x95, 0xc7, 0x0b, 0x8d, 0x10, 0x0b, 0x83, 0x86, 0x1e, 0xf3,
        0x04, 0xf5, 0xb9, 0xdd, 0x9a, 0x9e, 0x4f, 0xaf, 0x22, 0x7c, 0xa1, 0x4f,
        0xe9, 0x17, 0x4b, 0x4a, 0xc0, 0xfe, 0xa3, 0xa0, 0xf4, 0xf3, 0x10, 0xf5,
        0x35, 0x9d, 0xf6, 0x81, 0xe6, 0xf7, 0xc4, 0x9c, 0xe0, 0x2d, 0x2d, 0x3b,
        0xd4, 0x47, 0xa0, 0x1e, 0xf7, 0xe8, 0xcc, 0x5f, 0xa3, 0x85, 0x86, 0x69,
        0x46, 0xd7, 0x9a, 0x93, 0xf3, 0xe9, 0xb7, 0x01, 0xf4, 0xe2, 0x03, 0x72,
        0x2b, 0x0f, 0xdd, 0x6d, 0x19, 0x72, 0xdc, 0x8b, 0x62, 0xec, 0xcd, 0xf9,
        0x83, 0xe3, 0xa1, 0x3b, 0x5e, 0x0a, 0x38, 0xe1, 0xc8, 0x6e, 0x71, 0x85,
        0x1f, 0x04, 0x83, 0x99, 0xcf, 0xe0, 0xb8, 0x47, 0x42, 0xaf, 0x47, 0xb2,
        0xab, 0x95, 0xa4, 0xb8, 0xb8, 0xbc, 0x0f, 0x7c, 0x21, 0xe0, 0x2f, 0x9a,
        0xf5, 0xa6, 0xaa, 0xf3, 0x26, 0x4a, 0xd6, 0x99, 0x6e, 0x0d, 0x31, 0x39,
        0x2a, 0x1a, 0x49, 0x54, 0x04, 0xc5, 0x0f, 0xde, 0x45, 0xc9, 0xff, 0x53,
        0xa6, 0x43, 0x37, 0x2e
    ]),
    "Dim Gray": new Uint8Array([
        0x0f, 0x76, 0x4e, 0xc0, 0xa8, 0x84, 0x09, 0xe0, 0xce, 0x67, 0xd3, 0x96,
        0x9a, 0x14, 0xc3, 0xde, 0x79, 0xe7, 0xa6, 0xfa, 0x3c, 0x5f, 0x36, 0x65,
        0x90, 0xd0, 0x12, 0x73, 0xd1, 0x10, 0xab, 0xa0, 0xa3, 0x75, 0x7f, 0x0e,
        0x6e, 0x2b, 0xc4, 0x06, 0xa7, 0x31, 0x5c, 0xb9, 0x20, 0xf5, 0x73, 0x73,
        0x4d, 0x92, 0xe0, 0x1d, 0xc3, 0x2a, 0x1f, 0x93, 0x57, 0xc9, 0x8b, 0x6e,
        0x54, 0x13, 0x91, 0x13, 0x48, 0x5a, 0x5c, 0x07, 0xbe, 0x39, 0x1a, 0xbb,
        0x9b, 0xc6, 0x53, 0xd0, 0x23, 0xc9, 0x67, 0xf7, 0x99, 0x10, 0xc2, 0xc7,
        0x5c, 0x77, 0xe1, 0xd7, 0xde, 0x1c, 0xe8, 0x21, 0xb5, 0xa6, 0xa2, 0xb1,
        0x21, 0x42, 0x7a, 0x31, 0x54, 0x51, 0x70, 0xb6, 0x3e, 0x85, 0x48, 0x71,
        0xbd, 0xdb, 0x4d, 0x30, 0x3c, 0x8b, 0x78, 0x04, 0x55, 0x97, 0xb6, 0xef,
        0x79, 0x86, 0x52, 0xb2, 0x3b, 0x3e, 0x1d, 0xd9, 0xc5, 0x91, 0xdd, 0x76,
        0x5b, 0x88, 0x72, 0x8f, 0x7c, 0x9b, 0xf8, 0x4a, 0x60, 0x98, 0x36, 0x59,
        0x7c, 0xf5, 0x72, 0x0b, 0xbc, 0x15, 0xb0, 0x77, 0x81, 0xbb, 0xc8, 0x0d,
        0xea, 0x0e, 0x10, 0x7e, 0x9d, 0xec, 0x26, 0x3b, 0x2b, 0x9c, 0x39, 0xe1,
        0xa4, 0xc2, 0xde, 0x8c, 0xed, 0xc6, 0x13, 0x7f, 0x33, 0x15, 0x60, 0x96,
        0x77, 0x88, 0x09, 0x9f, 0x77, 0xe9, 0x10, 0x6a, 0xf9, 0xb7, 0x0f, 0x09,
        0xec, 0xb4, 0x1a, 0x31, 0x1c, 0x8b, 0xad, 0x1c, 0x68, 0xf3, 0xd2, 0x0a,
        0xe5, 0xc3, 0x8e, 0x41, 0x36, 0x02, 0x36, 0x8e, 0x74, 0x5d, 0x4e, 0x14,
        0x5e, 0x8f, 0x1f, 0x1e, 0x45, 0xbb, 0xc2, 0xb5, 0xc1, 0x6d, 0x7a, 0x3a,
        0x01, 0x0c, 0xf5, 0xe9, 0x87, 0x94, 0xe7, 0x23, 0x22, 0x26, 0x2f, 0xc6,
        0xfa, 0x9f, 0x8f, 0xb6, 0x7f, 0x04, 0xed, 0x34, 0x7b, 0xa0, 0xfc, 0x0a,
        0x05, 0xc2, 0x11, 0x2a, 0x60, 0x82, 0x88, 0xf3, 0x2e, 0x14, 0x11, 0xf0,
        0x5c, 0xb5, 0x9d, 0xc6, 0x5f, 0xd8, 0xba, 0xfc, 0xb5, 0x12, 0x05, 0x06,
        0x03, 0xc1, 0x1d, 0xb2, 0xd4, 0x11, 0x8c, 0xae, 0x3a, 0x6b, 0x7d, 0xa5,
        0x54, 0x6e, 0x83, 0xd2, 0x17, 0x3a, 0x8c, 0xe6, 0x80, 0x81, 0x36, 0x81,
        0x27, 0x2e, 0x18, 0x54, 0xd7, 0x99, 0x12, 0x1f, 0xd4, 0x4a, 0x17, 0x44,
        0xea, 0x2d, 0x20, 0x5a, 0x11, 0x5b, 0x36, 0x44, 0x4b, 0x79, 0x6c, 0xa2,
        0x71, 0xe4, 0x14, 0x82, 0x71, 0xc0, 0x81, 0xd0, 0x6d, 0xfe, 0x39, 0xb9,
        0x68, 0xac, 0x51, 0x16, 0x21, 0x11, 0x90, 0x9f, 0xd5, 0x81, 0x10, 0xfe,
        0xeb, 0xa5, 0x77, 0xff, 0x5c, 0x78, 0x56, 0xaf, 0x09, 0xed, 0x2c, 0x6c,
        0x0c, 0x95, 0x0a, 0x66, 0x1a, 0xf4, 0x6d, 0x53, 0x6c, 0x92, 0xbf, 0x14,
        0x15, 0xdb, 0x3d, 0x3a, 0xe6, 0xc0, 0x8a, 0xdc, 0xb7, 0x3f, 0x25, 0x11,
        0x28, 0x09, 0x0a, 0x67, 0x0a, 0xf8, 0x42, 0x26, 0x55, 0x67, 0xe8, 0x6a,
        0x8b, 0xaf, 0xbd, 0x0a, 0x80, 0xdd, 0x2f, 0x81, 0x12, 0x06, 0xa5, 0x3c,
        0x8f, 0x66, 0xf9, 0xfd, 0xa2, 0x2d, 0x11, 0xe6, 0xc3, 0xd8, 0x88, 0x0d,
        0x53, 0x03, 0x62, 0x2f, 0xb7, 0x2f, 0x65, 0xb0, 0x40, 0x7e, 0xa8, 0x96,
        0x46, 0xd2, 0x38, 0xe2, 0x66, 0x2f, 0xbf, 0x39, 0x4d, 0x2d, 0xa4, 0x55,
        0xad, 0xcf, 0x9b, 0x98, 0xc2, 0x3e, 0xf7, 0x09, 0xb5, 0x7d, 0xaf, 0xa3,
        0x14, 0x71, 0x94, 0x56, 0x0c, 0x74, 0x15, 0xa4, 0x73, 0xfc, 0x7a, 0xae,
        0xf7, 0x8b, 0xb6, 0x13, 0x75, 0x99, 0x21, 0x94, 0x7b, 0x06, 0x8f, 0x81,
        0x9c, 0xfd, 0x7b, 0x87, 0xcb, 0xfe, 0x39, 0x19, 0xdb, 0xb7, 0xc9, 0x03,
        0x31, 0x35, 0xa4, 0x5f, 0x01, 0x34, 0x9b, 0x40, 0x65, 0xd1, 0x16, 0x1d,
        0x53, 0x7d, 0x2b, 0x36, 0xfb, 0xde, 0x8c, 0xef, 0x2e, 0xf5, 0x3d, 0x24,
        0x39, 0x5f, 0x19, 0x2f, 0xe0, 0x84, 0x16, 0x55, 0xfc, 0x4d, 0xc9, 0x1d,
        0x8d, 0x96, 0xa3, 0xb7, 0x84, 0xa3, 0x5b, 0xa7, 0x79, 0x64, 0xed, 0xff,
        0xad, 0x98, 0x75, 0x40, 0x81, 0xe7, 0x37, 0xc5, 0xd4, 0xe2, 0xb5, 0x24,
        0xe6, 0xcc, 0x9c, 0x9b, 0x83, 0x63, 0x88, 0x00, 0x81, 0x38, 0x3c, 0x92,
        0x32, 0xfa, 0x2b, 0x92, 0x27, 0x72, 0x28, 0xc8, 0x57, 0x7c, 0xb9, 0x06,
        0xab, 0xc8, 0x76, 0x3a, 0x56, 0x09, 0xea, 0x00, 0xd7, 0x7d, 0xb2, 0xd0,
        0x3c, 0x0d, 0xe6, 0x80, 0x5a, 0x8e, 0x45, 0x21, 0x20, 0xbb, 0x31, 0x4b,
        0xc6, 0x63, 0xbb, 0x57, 0x33, 0x5e, 0xdd, 0xe4, 0x10, 0x95, 0xf4, 0x11,
        0xb0, 0x9f, 0xaf, 0xe4, 0x63, 0xd7, 0x73, 0xae, 0x87, 0x1d, 0xb4, 0xd6,
        0xe3, 0x18, 0xeb, 0x70, 0xab, 0x8d, 0x3f, 0x29, 0x2d, 0x10, 0x08, 0x4e,
        0x15, 0x12, 0x84, 0x2c, 0x4f, 0x8f, 0x99, 0x1f, 0x5f, 0xaa, 0xd1, 0x8b,
        0xe4, 0x95, 0xbf, 0xe7, 0x1f, 0xd2, 0x7f, 0xda, 0xe6, 0x51, 0x9a, 0xdb,
        0xe4, 0x72, 0x84, 0xd4, 0x4c, 0x7e, 0xac, 0xbb, 0xfe, 0x8f, 0x10, 0xe9,
        0x76, 0x72, 0x0e, 0xde, 0x0e, 0x85, 0x81, 0xf8, 0x8d, 0x64, 0xea, 0x1f,
        0x33, 0xb9, 0x5b, 0x01, 0x48, 0x17, 0x69, 0x9a, 0x8e, 0x9d, 0xfb, 0xe2,
        0xaf, 0x80, 0x9b, 0xa9, 0x59, 0x9f, 0x83, 0xf1, 0x1a, 0xe7, 0xd5, 0x0c,
        0x83, 0xfc, 0x69, 0x6c, 0xe4, 0x54, 0x33, 0x9c, 0xc7, 0xd4, 0x70, 0xb5,
        0x4d, 0x92, 0x0a, 0x7c, 0xf0, 0x9f, 0xb2, 0x2a, 0x97, 0x7d, 0x76, 0x0e,
        0xad, 0xc3, 0x9a, 0x25, 0x80, 0x30, 0x89, 0xb9, 0x64, 0x01, 0xef, 0x40,
        0x7f, 0x54, 0x60, 0x50, 0x67, 0x8d, 0xf1, 0x79, 0xb3, 0x1e, 0xf4, 0x05,
        0x76, 0xa1, 0x43, 0x74, 0x12, 0x53, 0x3c, 0xfa, 0x12, 0x89, 0xf3, 0x15,
        0x46, 0x55, 0x25, 0xe5, 0xbb, 0x68, 0xcf, 0x9f, 0x21, 0x75, 0xe2, 0xa0,
        0x73, 0x71, 0x77, 0xe1, 0x32, 0xcc, 0x99, 0xed, 0xeb, 0x25, 0x56, 0x8a,
        0x21, 0x4b, 0xb5, 0x44, 0xb1, 0x5c, 0x63, 0x11, 0xc6, 0xda, 0x42, 0xd0,
        0x82, 0x9b, 0x7e, 0xa7, 0x1d, 0x3a, 0x2a, 0xed, 0xc0, 0xfc, 0xdb, 0xd8,
        0x73, 0xfd, 0xcd, 0x95, 0xb4, 0xd9, 0xd9, 0xce, 0xec, 0x39, 0x74, 0xf5,
        0x87, 0x39, 0x78, 0x29, 0x9f, 0x5e, 0x74, 0xbd, 0xff, 0xad, 0x87, 0x92,
        0x84, 0xd6, 0xfb, 0xb8, 0xce, 0x74, 0x58, 0x89, 0xfc, 0x34, 0xfe, 0x6a,
        0x62, 0x0f, 0xdc, 0xe3, 0x6b, 0x1c, 0xc4, 0x82, 0x4c, 0x9c, 0x75, 0x7d,
        0xd3, 0x68, 0x18, 0x3a, 0xef, 0x8a, 0x85, 0x85, 0xcc, 0x3f, 0x98, 0x8d,
        0xac, 0x70, 0x99, 0xf0, 0xf7, 0x56, 0x06, 0xd5, 0x04, 0x8f, 0x80, 0x05,
        0x70, 0xcd, 0xd2, 0x0e, 0x51, 0x5a, 0x03, 0xfc, 0x2d, 0xb9, 0x20, 0xae,
        0x7c, 0x97, 0x2a, 0xc8, 0x36, 0x30, 0x06, 0x6b, 0xd1, 0xe8, 0xbb, 0x15,
        0x9b, 0x0e, 0x98, 0xe2, 0x39, 0xa7, 0xce, 0xe6, 0x74, 0xe0, 0x5c, 0x79,
        0x2b, 0x42, 0xeb, 0xf2, 0xb9, 0xd3, 0xfe, 0xcb, 0x0a, 0x05, 0x79, 0x22,
        0xb5, 0x87, 0x84, 0x24, 0x5d, 0x94, 0xcb, 0x7d, 0xe5, 0xa9, 0xf4, 0x4f,
        0x04, 0x4c, 0x99, 0x4f, 0xaf, 0x85, 0xf5, 0x64, 0x95, 0xf3, 0x74, 0x2e,
        0x89, 0x7d, 0x0b, 0xf1, 0x66, 0xaa, 0x8a, 0xd0, 0x60, 0x52, 0xab, 0xa7,
        0x6a, 0x88, 0xe3, 0xfd, 0x9d, 0x00, 0x0c, 0xa1, 0xf2, 0xee, 0x63, 0xee,
        0xfb, 0x47, 0x31, 0x65, 0x43, 0xa3, 0x41, 0xea, 0x5d, 0x53, 0xd2, 0xd7,
        0x43, 0xed, 0x04, 0x4c, 0x27, 0x22, 0x4e, 0x60, 0xcb, 0xd8, 0xa9, 0x3f,
        0xf9, 0x48, 0x4d, 0x53, 0x0c, 0xc8, 0x0e, 0xc0, 0x55, 0x82, 0xbb, 0x3b,
        0x6b, 0xb3, 0x33, 0x1e, 0xd3, 0xeb, 0xd2, 0x45, 0x5a, 0x13, 0x66, 0x58,
        0x41, 0x8f, 0xd5, 0x1a, 0x51, 0xae, 0x92, 0xf2, 0xf2, 0x35, 0x80, 0x78,
        0xa2, 0x20, 0x6c, 0x9f, 0x34, 0xc4, 0xbb, 0x8a, 0xf5, 0x35, 0xcc, 0xb1,
        0x33, 0x52, 0xe9, 0x72, 0x1e, 0x0a, 0xa5, 0xbd, 0x07, 0x2a, 0xca, 0x75,
        0x31, 0x62, 0xb3, 0x6c, 0x11, 0x27, 0x31, 0xd3, 0x1c, 0x28, 0x57, 0x87,
        0x64, 0xbb, 0xc8, 0x07, 0xd6, 0x20, 0x5d, 0x8c, 0x10, 0xa5, 0xe3, 0x04,
        0xa8, 0xe1, 0xbc, 0x66, 0x5a, 0x39, 0xa1, 0xa9, 0xdb, 0x86, 0x4c, 0x0a,
        0x0b, 0x20, 0x79, 0x61, 0xb3, 0x0a, 0x29, 0x4f, 0x59, 0x1d, 0xcd, 0xfa,
        0xa5, 0xa3, 0x72, 0x77, 0xd7, 0x82, 0x07, 0xf1, 0x9e, 0xb6, 0x1d, 0x39,
        0xf1, 0xab, 0x65, 0x6c, 0xb7, 0xa8, 0x47, 0xc5, 0xf1, 0xd1, 0x68, 0xce,
        0x26, 0x97, 0xb5, 0xac, 0x53, 0x5b, 0x89, 0x12, 0xd2, 0xb3, 0x09, 0xe5,
        0x99, 0x03, 0x88, 0x13, 0x6b, 0x69, 0xbd, 0x2a, 0x0c, 0xfd, 0x95, 0x20,
        0xd2, 0x5c, 0xe5, 0xe1, 0x0c, 0x12, 0x02, 0x41, 0xfa, 0x1f, 0x24, 0xa2,
        0xdc, 0xd6, 0x23, 0x01, 0x76, 0x5a, 0xe4, 0x32, 0xe8, 0xed, 0x68, 0xb3,
        0x10, 0x9d, 0x29, 0x3a, 0x6c, 0x25, 0xd9, 0x9a, 0x36, 0x63, 0x31, 0xf3,
        0xc0, 0xc8, 0x9e, 0x7f, 0xae, 0x2e, 0x7c, 0x15, 0xf9, 0xcd, 0x2b, 0xa7,
        0x99, 0x75, 0x89, 0x5b, 0x09, 0x64, 0x2d, 0xab, 0x9f, 0x0b, 0x3a, 0x66,
        0x94, 0xc7, 0xc6, 0x16, 0x85, 0x38, 0x5e, 0x77, 0x2e, 0xf8, 0x00, 0x50,
        0x40, 0x0f, 0x1a, 0x8a, 0xe6, 0xce, 0x3e, 0x0e, 0x61, 0x1e, 0x31, 0xe7,
        0x82, 0xa8, 0xcf, 0x87, 0x90, 0x2d, 0x65, 0x80, 0x70, 0xb3, 0x11, 0x1b,
        0x2d, 0xe7, 0xb8, 0x57, 0xdb, 0x88, 0xba, 0xe1, 0xec, 0xa9, 0x48, 0x61,
        0xd8, 0x8c, 0x3a, 0x84, 0x31, 0x02, 0x5a, 0x5d, 0x24, 0x5e, 0xa2, 0x78,
        0x6d, 0x95, 0xca, 0xc8, 0xdc, 0xc5, 0x89, 0x59, 0x8b, 0x62, 0x49, 0x6d,
        0x64, 0xf8, 0x29, 0x7c, 0xd6, 0x2b, 0xf9, 0x19, 0xe0, 0xc5, 0x85, 0xf5,
        0x4c, 0x2c, 0x0b, 0x0f, 0x72, 0xed, 0xa1, 0xe5, 0x1d, 0xcc, 0xe5, 0x44,
        0xdf, 0xf9, 0xde, 0xca, 0x41, 0x72, 0x23, 0xe3, 0x6d, 0xb4, 0x26, 0x9b,
        0x99, 0x7a, 0xeb, 0x00, 0xd9, 0x07, 0x33, 0x23, 0xdc, 0x09, 0xbc, 0x96,
        0xd9, 0xbf, 0x78, 0x1b, 0x75, 0xb2, 0x2d, 0xa9, 0xca, 0xd4, 0x2a, 0xc3,
        0x42, 0xd2, 0x4f, 0x98, 0x7e, 0xff, 0x21, 0x65, 0x46, 0x93, 0xd1, 0x0b,
        0x82, 0xa9, 0xe6, 0x39, 0x18, 0x18, 0x2a, 0x9d, 0x20, 0x6a, 0x73, 0x34,
        0xf5, 0xe7, 0x27, 0x70, 0xfa, 0xbe, 0xea, 0x87, 0xc3, 0x7f, 0x0f, 0xc7,
        0xee, 0x75, 0xcf, 0xdb, 0x7c, 0x30, 0xb6, 0x50, 0x92, 0x33, 0x7e, 0x88,
        0xd2, 0xc6, 0xa3, 0x87, 0x64, 0xa6, 0xee, 0x29, 0x2d, 0xf1, 0x0b, 0xd6,
        0x7d, 0xf8, 0xe5, 0x7f, 0x0e, 0x3b, 0x00, 0x62, 0x08, 0xa6, 0xd2, 0xeb,
        0x9f, 0x36, 0x09, 0x9a, 0x60, 0x2a, 0x13, 0x2f, 0xe5, 0x8b, 0xea, 0x17,
        0xeb, 0x70, 0x1c, 0x19, 0xee, 0xf7, 0xcb, 0xfc, 0xd9, 0x66, 0x6a, 0x07,
        0xfc, 0xc1, 0xdf, 0x1e, 0x7c, 0xd6, 0x4d, 0xa6, 0x5e, 0xd5, 0x1e, 0x1b,
        0x1e, 0xb0, 0x96, 0x7c, 0xb7, 0x9f, 0x24, 0x3b, 0x78, 0x20, 0xb4, 0x1c,
        0x52, 0xe1, 0x4b, 0x5f, 0x9e, 0x89, 0x11, 0xc9, 0x8a, 0x34, 0x40, 0x85,
        0x3f, 0xa8, 0x47, 0x68, 0x3f, 0x19, 0x4c, 0xeb, 0x61, 0x7b, 0xd0, 0x19,
        0x17, 0xbd, 0x1a, 0x3b, 0x36, 0x1b, 0x19, 0x0a, 0x8d, 0x61, 0xd3, 0xe2,
        0xc5, 0xd7, 0x72, 0x7c, 0x2d, 0x51, 0x6d, 0xc3, 0xe6, 0x09, 0x27, 0xbb,
        0xdd, 0xef, 0x70, 0x3a, 0xfa, 0xf5, 0x19, 0x9a, 0xf5, 0x48, 0x88, 0x3f,
        0xb2, 0x1e, 0x1a, 0x82, 0xd1, 0x67, 0xf0, 0x71, 0x05, 0xd4, 0x91, 0xa2,
        0xd3, 0x25, 0x1e, 0x53, 0x67, 0x29, 0xe3, 0xad, 0x8c, 0xae, 0x17, 0x79,
        0xf4, 0xdf, 0xbe, 0x3f, 0xcf, 0xfb, 0x0c, 0x97, 0x14, 0x5b, 0x6c, 0x78,
        0x58, 0xab, 0xdb, 0xc9, 0x2b, 0x36, 0xe2, 0xef, 0x15, 0x48, 0x2a, 0x2e,
        0x81, 0x4b, 0xe3, 0xdd, 0xad, 0x8e, 0x45, 0x5d, 0x30, 0x8f, 0xb8, 0x45,
        0x3d, 0x16, 0x80, 0x01, 0x68, 0xcf, 0xfb, 0x93, 0xa4, 0x40, 0x01, 0xc7,
        0x05, 0x3f, 0x5b, 0x72, 0x03, 0xf2, 0xc8, 0xfa, 0xb4, 0x0d, 0xc9, 0x4b,
        0x7f, 0x4e, 0x1c, 0x10, 0x42, 0xbc, 0xa5, 0x72, 0xb0, 0x36, 0x6a, 0xe6,
        0x68, 0x63, 0xfa, 0x61, 0x4e, 0xbd, 0x73, 0xcb, 0x2a, 0x95, 0x04, 0x03,
        0x2d, 0xb7, 0xc9, 0xdb, 0x1e, 0x34, 0xeb, 0x86, 0x01, 0x10, 0xc7, 0x25,
        0x31, 0xb1, 0xba, 0x69, 0xaa, 0x0f, 0xc0, 0xc4, 0x96, 0xdb, 0xa0, 0x08,
        0x7a, 0xc5, 0xde, 0x21, 0x64, 0xd0, 0x01, 0xdb, 0xc8, 0x07, 0xe9, 0x52,
        0xc9, 0x43, 0x61, 0xef, 0xba, 0xf1, 0x50, 0xab, 0x31, 0x0e, 0xbc, 0xa6,
        0xcf, 0xf3, 0x5f, 0xc7, 0x71, 0x55, 0x9e, 0xb0, 0x5d, 0x4b, 0x89, 0x8d,
        0xdb, 0x56, 0xa4, 0x3d, 0xa7, 0xc9, 0x39, 0x29, 0x42, 0xd0, 0xc6, 0x99,
        0x07, 0xbd, 0x49, 0x8d, 0x23, 0xeb, 0xd0, 0xfb, 0xa6, 0xe7, 0xa1, 0xd0,
        0xed, 0xee, 0x29, 0xfd, 0x09, 0x28, 0x9c, 0xa9, 0x34, 0xff, 0x1d, 0x54,
        0x7e, 0xa7, 0xc9, 0x2f, 0x3a, 0x89, 0xff, 0xbc, 0x70, 0xe0, 0xd1, 0x0b,
        0x12, 0x4e, 0xba, 0x55, 0xc6, 0x9d, 0x82, 0xcd, 0xe1, 0x18, 0x04, 0x32,
        0xf9, 0x2a, 0x81, 0x9f, 0x67, 0xd0, 0x91, 0xd8, 0x08, 0x13, 0x3b, 0x14,
        0xc6, 0x7a, 0x70, 0xe5, 0x34, 0x84, 0x39, 0xcc, 0x2e, 0x3d, 0x48, 0x1d,
        0xf6, 0xa2, 0xf1, 0xd2, 0x90, 0xb5, 0x98, 0x7e, 0x7a, 0x44, 0xdd, 0x02,
        0xcc, 0x7c, 0xa1, 0xba, 0xd1, 0x59, 0x0c, 0x8a, 0x7f, 0xb3, 0x7f, 0xc2,
        0xa8, 0x9d, 0xce, 0xef, 0x87, 0x9c, 0xc3, 0xf6, 0xb6, 0x73, 0x66, 0x43,
        0xc6, 0xb0, 0x87, 0x2b, 0x18, 0x1d, 0x29, 0x41, 0xb1, 0xad, 0x10, 0xe2,
        0xb3, 0x69, 0x88, 0x10, 0xad, 0xc4, 0x2c, 0x16, 0xfd, 0x3d, 0x2e, 0xe8,
        0x23, 0x0d, 0x84, 0x5f, 0x95, 0x35, 0x98, 0x70, 0x9d, 0x23, 0xa6, 0x54,
        0x46, 0xf2, 0xc9, 0xb3, 0x32, 0x87, 0xd6, 0x39, 0xdc, 0x0b, 0xbb, 0x32,
        0x0f, 0xcd, 0xa6, 0x68, 0x9f, 0x70, 0x73, 0x10, 0xc4, 0xab, 0xb2, 0x08,
        0x0c, 0x34, 0x84, 0xcb, 0xdf, 0x99, 0xa0, 0x3d, 0x9b, 0x64, 0xec, 0xf3,
        0xf1, 0xd7, 0x91, 0x09, 0x2b, 0x29, 0xef, 0xf8, 0x8d, 0x4b, 0xd8, 0xf0,
        0x90, 0xbb, 0xaf, 0x58, 0xb6, 0x7e, 0xd1, 0x84, 0x59, 0x68, 0x2d, 0x76,
        0xbf, 0x4e, 0x79, 0x21, 0x33, 0x20, 0x1d, 0xce, 0x7d, 0xef, 0x44, 0x50,
        0xfe, 0x54, 0x04, 0xe9, 0x8f, 0x4a, 0x5a, 0xb9, 0x83, 0x7b, 0x6a, 0x14,
        0x7b, 0xe4, 0x47, 0x1f, 0x4d, 0xaf, 0x35, 0x70, 0xd2, 0xcf, 0xfc, 0xd3,
        0x99, 0x11, 0xaa, 0xe2, 0x83, 0x95, 0xf3, 0x6f, 0xb7, 0x87, 0xb4, 0x98,
        0x52, 0x0d, 0x34, 0x3a, 0x68, 0x32, 0x07, 0x60, 0xaf, 0xff, 0xca, 0x90,
        0x72, 0x27, 0x0e, 0xff, 0xde, 0xdd, 0xa7, 0x98, 0x4c, 0x5a, 0x08, 0xc1,
        0xeb, 0xb1, 0x8d, 0xc8, 0xb1, 0x56, 0x06, 0x10, 0xbb, 0x79, 0x24, 0x7e,
        0xcb, 0x9b, 0x0b, 0xc5, 0xc1, 0x63, 0x7a, 0x08, 0x02, 0xab, 0x50, 0xae,
        0xdc, 0x72, 0x46, 0x22, 0x28, 0xd5, 0xff, 0xc1, 0xc9, 0x83, 0xc3, 0x72,
        0x90, 0x70, 0x56, 0x21, 0x9c, 0x73, 0x7f, 0x27, 0x0b, 0x2f, 0x17, 0x6e,
        0x7e, 0x60, 0x56, 0xa7, 0x18, 0x62, 0x7b, 0x3d, 0x9d, 0xe8, 0x6f, 0x66,
        0xa4, 0xbb, 0xdc, 0xbe, 0x92, 0x74, 0x26, 0xa4, 0xbf, 0xd5, 0xc6, 0xd6,
        0x66, 0x71, 0x20, 0xab, 0x6f, 0x32, 0xc4, 0xd3, 0xa9, 0x5a, 0xfc, 0xec,
        0x28, 0x53, 0x8d, 0x43, 0xf8, 0xa4, 0x29, 0xe4, 0x69, 0xe6, 0xcb, 0x45,
        0x26, 0x6f, 0x27, 0xb7, 0x32, 0xeb, 0xeb, 0x07, 0x7f, 0x18, 0x50, 0x02,
        0xdb, 0x46, 0xf0, 0x0c, 0x5f, 0x15, 0xb8, 0x49, 0x43, 0x2b, 0xf7, 0x9d,
        0xc8, 0x6c, 0xe4, 0x06, 0xa6, 0x2d, 0xdb, 0x0b, 0xe8, 0x25, 0x1c, 0xf1,
        0xa2, 0xd1, 0xe3, 0x0e, 0xb4, 0x92, 0x24, 0xc5, 0xcf, 0x4d, 0x54, 0x24,
        0xc6, 0x5f, 0x47, 0x51, 0x01, 0xf8, 0x62, 0xbb, 0x77, 0x12, 0xc1, 0xca,
        0xdf, 0xb6, 0xf9, 0x90, 0x1b, 0xfc, 0x63, 0x93, 0x9e, 0x91, 0xf1, 0x2d,
        0xb1, 0x02, 0x8d, 0x58, 0xee, 0x5c, 0xa8, 0x76, 0xf6, 0x49, 0x22, 0x96,
        0x71, 0x4b, 0xcb, 0x2e, 0x9b, 0x42, 0x7a, 0xc7, 0x83, 0x44, 0x13, 0x74,
        0x22, 0x3e, 0xc9, 0x3b, 0xf8, 0xbd, 0x1b, 0xc5, 0xdd, 0x39, 0x69, 0x11,
        0x2d, 0x79, 0xea, 0xbd, 0xbf, 0xc5, 0x4c, 0x99, 0xf8, 0xd8, 0xe6, 0x98,
        0xf4, 0xa9, 0x07, 0x20, 0x03, 0xd3, 0xe3, 0xec, 0x16, 0xfb, 0x5e, 0x37,
        0xb2, 0xb9, 0xa1, 0x20, 0x49, 0xb9, 0x42, 0x17, 0x63, 0x1b, 0x40, 0x07,
        0x14, 0x24, 0x15, 0x41, 0x66, 0x2d, 0xf9, 0xf5, 0xe2, 0xc7, 0x1c, 0x05,
        0xba, 0x7c, 0xef, 0x09, 0x69, 0x64, 0xb6, 0x0d, 0x88, 0xd5, 0x96, 0xab,
        0x7a, 0x3f, 0x67, 0x6c, 0x22, 0xb7, 0x70, 0x44, 0x3a, 0x88, 0xba, 0xba,
        0x62, 0x86, 0x14, 0x17, 0x9d, 0xc0, 0x5f, 0x38, 0x21, 0x17, 0xf4, 0xab,
        0x14, 0x4e, 0xb6, 0x29, 0xe7, 0x93, 0x03, 0xd2, 0xd3, 0x54, 0x34, 0x88,
        0x64, 0x00, 0x70, 0x04, 0xdd, 0xb5, 0x22, 0x3b, 0xa2, 0xf5, 0x4e, 0x4a,
        0x63, 0x20, 0x21, 0x65, 0x5b, 0x71, 0xc8, 0x62, 0x1c, 0xae, 0x06, 0x1b,
        0x92, 0x5a, 0x4a, 0xfb, 0xa7, 0xf0, 0xd1, 0x3b, 0x4c, 0x4a, 0xf6, 0xa6,
        0x31, 0xcc, 0xea, 0x49, 0x6d, 0x37, 0x70, 0x87, 0xb4, 0x93, 0xd6, 0xcb,
        0x8c, 0xb1, 0xff, 0x31, 0x74, 0xf8, 0x1a, 0x89, 0xd5, 0x6f, 0x63, 0x82,
        0x54, 0xf7, 0xdc, 0x22, 0x08, 0x05, 0x32, 0x46, 0x30, 0xa8, 0x2b, 0x2a,
        0x0e, 0x93, 0x55, 0x7c, 0xf3, 0x3f, 0x71, 0x47, 0xfa, 0x4d, 0x6d, 0x85,
        0xdf, 0x99, 0x0e, 0xc9, 0x53, 0xa3, 0x5d, 0x34, 0x38, 0x0a, 0xf0, 0xbf,
        0x42, 0x5e, 0x57, 0x02, 0x5a, 0xe7, 0x51, 0x93, 0xe3, 0xaf, 0xf3, 0x7a,
        0x45, 0x04, 0x60, 0x91, 0x66, 0x3f, 0xbf, 0x8c, 0x25, 0x3d, 0x25, 0x76,
        0xe2, 0xd4, 0x2e, 0x00, 0x5d, 0x91, 0x4e, 0x22, 0x66, 0x4e, 0x57, 0xdc,
        0x9f, 0xfb, 0xe7, 0xf3, 0x40, 0xee, 0x17, 0x19, 0x1e, 0x52, 0x08, 0xec,
        0x5d, 0x45, 0xb0, 0xf0, 0x58, 0x92, 0x1a, 0x7a, 0xa7, 0x2c, 0xe9, 0x1a,
        0x9a, 0x2a, 0x27, 0xd1, 0x72, 0xc0, 0x29, 0x40, 0xc8, 0xb4, 0x9a, 0x54,
        0x6e, 0xa4, 0x4b, 0xf9, 0xc2, 0x3a, 0x6a, 0xa4, 0x66, 0x3d, 0x47, 0xb5,
        0x81, 0x40, 0x7e, 0x2e, 0x37, 0xe6, 0xe7, 0x1e, 0x33, 0xa1, 0x37, 0x00,
        0xab, 0xc2, 0x52, 0x2f, 0x46, 0xb7, 0x12, 0x83, 0xb1, 0xe8, 0x86, 0x71,
        0x6d, 0x24, 0xb4, 0x93, 0xc2, 0x7c, 0xce, 0xcd, 0x75, 0xc3, 0xb4, 0x58,
        0x30, 0x53, 0x95, 0x9c, 0x0b, 0x8a, 0x5d, 0xdd, 0x58, 0xa0, 0x43, 0xc2,
        0x0e, 0x32, 0x0b, 0x83, 0x03, 0xc9, 0x5e, 0x8b, 0xe9, 0xfb, 0x50, 0xf2,
        0xbe, 0x95, 0xff, 0x05, 0x52, 0x7f, 0x17, 0x63, 0x2b, 0x30, 0x4c, 0xf1,
        0x47, 0x62, 0x54, 0x2c, 0x66, 0xd1, 0xb0, 0x46, 0xbc, 0x83, 0x03, 0x48,
        0x45, 0x1e, 0xb4, 0x3c, 0xc8, 0xaa, 0x8f, 0x14, 0xd9, 0x3a, 0x5b, 0x16,
        0x85, 0x4f, 0xbc, 0xe7, 0x9a, 0x35, 0xdc, 0xc6, 0xa7, 0xa6, 0x69, 0xaa,
        0xc1, 0x3d, 0x43, 0xa3, 0x0f, 0x44, 0x3f, 0xb5, 0xc7, 0x54, 0x0a, 0x47,
        0x66, 0xf9, 0x7b, 0xa0, 0xec, 0xfb, 0x97, 0xda, 0xeb, 0x04, 0xa1, 0xc4,
        0x04, 0xf3, 0x39, 0x29, 0xa6, 0x29, 0xf3, 0x65, 0x8e, 0x36, 0x93, 0xcc,
        0x85, 0xa8, 0x56, 0x0f, 0x1f, 0x29, 0x98, 0x8a, 0x2a, 0x23, 0x79, 0x8e,
        0x93, 0x45, 0xf7, 0xd9, 0xf7, 0x6c, 0xec, 0x96, 0xac, 0xb4, 0x93, 0x0f,
        0xee, 0xbf, 0xb4, 0x39, 0x99, 0x1e, 0xf4, 0xe3, 0xd9, 0x17, 0x3b, 0x20,
        0xa5, 0x44, 0x52, 0x4b, 0xee, 0x42, 0x65, 0xdf, 0x15, 0x3d, 0x11, 0xcd,
        0xca, 0xa5, 0x95, 0x60, 0x78, 0x78, 0xd4, 0xec, 0x50, 0xa8, 0x64, 0x62,
        0x31, 0x92, 0x4a, 0x9f, 0x5d, 0x2a, 0xd1, 0xdf, 0x1a, 0x7b, 0x7d, 0x8f,
        0xf3, 0x78, 0x10, 0x27, 0x46, 0x0c, 0xdf, 0x8d, 0x35, 0xf1, 0x7f, 0xce,
        0xef, 0x33, 0xd5, 0xe7, 0x4d, 0xe6, 0x5e, 0x3b, 0x79, 0x15, 0xd1, 0x8c
    ])
};

module.exports = KEYWORDS_ID

},{}],205:[function(require,module,exports){
/*
    Copyright 2018 Picovoice Inc.

    You may not use this file except in compliance with the license. A copy of the license is located in the "LICENSE"
    file accompanying this source.

    Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
    an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
    specific language governing permissions and limitations under the License.
*/

//var work = require('webworkify');
var WebVoiceProcessor = require('./web_voice_processor')

PorcupineManager = (function (porcupineWorkerScript) {
    let porcupineWorker;

    let start = function (keywordIDs, sensitivities, detectionCallback, errorCallback) {
        porcupineWorker = new Worker(porcupineWorkerScript); //
        //porcupineWorker = work(require('./porcupine_worker.js')) //window.PorcupineWorker);
        porcupineWorker.postMessage({
            command: "init",
            keywordIDs: keywordIDs,
            sensitivities: sensitivities
        });

        porcupineWorker.onmessage = function (e) {
            detectionCallback(e.data.keyword);
        };

       WebVoiceProcessor.start([this], errorCallback);
    };

    let stop = function () {
        WebVoiceProcessor.stop();
        porcupineWorker.postMessage({command: "release"});
    };

    let processFrame = function (frame) {
        porcupineWorker.postMessage({command: "process", inputFrame: frame});
    };

    return {start: start, processFrame: processFrame, stop: stop}
});
try {
    module.exports = PorcupineManager
} catch (e) {}

try {
    window.PorcupineManager = PorcupineManager
} catch (e) {}

},{"./web_voice_processor":206}],206:[function(require,module,exports){
var work = require('webworkify');

WebVoiceProcessor = (function () {
    let downsampler;

    let isRecording = false;

    let start = function (engines, errorCallback) {
        if (!downsampler) {
            navigator.mediaDevices.getUserMedia({audio: true})
                .then(stream => {
                    let audioContext = new (window.AudioContext || window.webkitAudioContext)();
                    let audioSource = audioContext.createMediaStreamSource(stream);
                    let node = audioContext.createScriptProcessor(4096, 1, 1);
                    node.onaudioprocess = function (e) {
                        if (!isRecording) {
                            return;
                        }

                        downsampler.postMessage({command: "process", inputFrame: e.inputBuffer.getChannelData(0)});
                    };
                    audioSource.connect(node);
                    node.connect(audioContext.destination);

                    downsampler = work(require('./downsampling_worker.js'));
                    
                    //downsampler = new Worker(downsamplerScript);
                    downsampler.postMessage({command: "init", inputSampleRate: audioSource.context.sampleRate});
                    downsampler.onmessage = function (e) {
                        engines.forEach(function (engine) {
                            engine.processFrame(e.data);
                        });
                    };
                })
                .catch(errorCallback);
        }

        isRecording = true;
    };

    let stop = function () {
        isRecording = false;
        downsampler.postMessage({command: "reset"});
    };

    return {start: start, stop: stop};
})();

module.exports = WebVoiceProcessor
try {
    window.WebVoiceProcessor = WebVoiceProcessor;
} catch(e) {}

},{"./downsampling_worker.js":203,"webworkify":199}],207:[function(require,module,exports){
var Chunker = require('stream-chunker');
var stream = require('stream') 
var Readable = stream.Readable;
var Writable = stream.Writable;
var fs = require('fs')

let started = false;
let dastream = null;
let voiceDetected = false;
let silenceTimeout = null;
// stream selected audio file onto mqtt bus
function  start(mqttClient,siteId,filename) {
	// const vad = new VAD(VAD.Mode.NORMAL);
	
	var chunker = Chunker(512,{flush:true});
	chunker.on('data', function(data) {
		//console.log('send audio data to '+"hermod/"+siteId+"/microphone/audio")
		//console.log(data ? data.length : -1)
		mqttClient.publish("hermod/"+siteId+"/microphone/audio",data);
	});
	
	 
	var wavConfig = {
	  "channels": 1,
	  "sampleRate": 16000,
	  "bitDepth": 16
	};
	//this.micInstance = Microphone(Object.assign({debug:false},wavConfig));
	dastream = fs.createReadStream(filename);
	//this.micInstance.getAudioStream()
	console.log('stream '+filename)
	
	var wav = require('wav');
	var wavReader = new wav.Reader(wavConfig);
	var inBody = false;
	// strip the wav header
	wavReader.on('format', function (format) {					 
	//   the WAVE header is stripped from the output of the reader
	 //console.log('read hgeader')
	 inBody = true;
	});
	wavReader.on('data', function (data) {
		if (inBody ) { //&& data && data.length > 0
			console.log('read body')
			console.log(data && data.buffer ? data.buffer.length : -1)
			//console.log(data.buffer)
			chunker.write(data);
		}
	});
	dastream.pipe(wavReader);
}
    
function stopRecording(siteId) {
		started = false;
       // voiceDetected = false;
       // if (this.micInstance && this.micInstance.stop) this.micInstance.stop()
		if (dastream) {
			dastream.pause();
			dastream.destroy();
		}
	}


module.exports = {start : start, stop:stopRecording}

},{"fs":7,"stream":37,"stream-chunker":156,"wav":175}]},{},[45]);
