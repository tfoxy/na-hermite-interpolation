(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.HermiteInterpolation = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * na-hermite-interpolation v0.3.0
 * https://github.com/tfoxy/na-hermite-interpolation
 *
 * Copyright 2015 Tomás Fox
 * Released under the MIT license
 */

/**
 * Numbers must have the following methods for the divided differences:
 * cmp, minus, div
 * Additionally, to calculate the polynomial coefficients:
 * plus, times, neg
 * For differentials of order 2 or more, division must support javascript numbers
 */
module.exports = (function() {
  'use strict';

  var events = require('events');


  function DuplicateError(duplicateValue, firstIndex, secondIndex) {
    this.name = 'DuplicateError';
    this.message = 'Duplicate value at x' + firstIndex +
        ' and x' + secondIndex +
        '. Value: ' + duplicateValue;

    this.duplicateValue = duplicateValue;
    this.firstIndex = firstIndex;
    this.secondIndex = secondIndex;
  }
  DuplicateError.prototype = Object.create(Error.prototype);
  DuplicateError.prototype.constructor = DuplicateError;


  function HermiteInterpolation() {
    this.data = [];
    this._column = [];
    this._prevColumn = [];
    this._data = [];
    this._currentFactorialResult = 1;
    this._currentFactorialFactor = 1;
  }

  HermiteInterpolation._dataCompareFn = function(left, right) {
    return left.x.cmp(right.x);
  };

  HermiteInterpolation.DuplicateError = DuplicateError;


  HermiteInterpolation.prototype = Object.create(events.EventEmitter.prototype);
  HermiteInterpolation.prototype.constructor = HermiteInterpolation;


  HermiteInterpolation.prototype.calculateDividedDifferences = function() {
    if (this.data.length === 0) {
      return;
    }

    this._prepareData();
    this._calculateDividedDifferences();
    this._cleanUp();
  };


  HermiteInterpolation.prototype.calculatePolynomialCoefficients = function() {
    if (this.data.length === 0) {
      return [];
    }

    this._prepareData();

    var preCoef = [this._data[0].y];

    var stepListener = function(stepData) {
      if (stepData.i === 0) {
        preCoef.push(stepData.result);
      }
    };

    this.on('step', stepListener);

    this._calculateDividedDifferences();

    this.removeListener('step', stepListener);

    this.emit('preCoefficients', preCoef);

    return this._calculatePolynomialCoefficients(preCoef);
  };


  HermiteInterpolation.prototype._calculatePolynomialCoefficients = function(preCoef) {
    var coef = preCoef.slice();

    var tempCoef = [];
    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
    var x_i, fx_0i;

    var timesCoefFn = function(c) {
      return c.times(x_i);
    };

    var addAuxCoefFn = function(auxC, i) {
      tempCoef[i + 1] = tempCoef[i + 1].plus(auxC);
    };

    var addTempCoefFn = function(tempC, i) {
      coef[i] = fx_0i.times(tempC).plus(coef[i]);
    };


    for (var i = 1; i < coef.length; i++) {
      // f(x[0], ..., x[i]) * tempCoef * (x - x[i-1])

      //noinspection JSUnresolvedFunction
      x_i = this._data[i - 1].x.neg();
      fx_0i = preCoef[i];
      var auxCoef = tempCoef;

      tempCoef = auxCoef.map(timesCoefFn);

      tempCoef.push(x_i);

      auxCoef.forEach(addAuxCoefFn);

      tempCoef.forEach(addTempCoefFn);
    }

    this.emit('coefficients', coef);

    this._cleanUp();

    return coef;
  };


  HermiteInterpolation.prototype._prepareData = function() {
    this._checkDuplicateX();
    this._cloneData();
    this._multiplyPointsWithDifferential();
    this._orderDataByX();
    this._initPrevColumn();

    this.emit('dataInitialized', this._data);
  };


  HermiteInterpolation.prototype._checkDuplicateX = function() {
    var set = Object.create(null);

    this.data.forEach(function(point, i) {
      var x = JSON.stringify(point.x);
      if (x in set) {
        this.emit('error', new DuplicateError(point.x, set[x], i));
      }
      set[x] = i;
    }, this);
  };


  HermiteInterpolation.prototype._cloneData = function() {
    this._data = this.data.map(function(point) {
      var _point = {x: point.x, y: point.y};

      if (!point.d) {
        _point.d = [];
      } else if (!Array.isArray(point.d)) {
        _point.d = [point.d];
      } else {
        _point.d = point.d;
      }

      return _point;
    });
  };


  HermiteInterpolation.prototype._multiplyPointsWithDifferential = function() {
    var length = this._data.length;

    for (var i = 0; i < length; ++i) {
      var point = this._data[i];
      for (var j = 0; j < point.d.length; ++j) {
        this._data.push(point);
      }
    }
  };


  HermiteInterpolation.prototype._orderDataByX = function() {
    this._data.sort(HermiteInterpolation._dataCompareFn);
  };


  HermiteInterpolation.prototype._initPrevColumn = function() {
    this._data.forEach(function(point) {
      this._prevColumn.push(point.y);
    }, this);
  };


  HermiteInterpolation.prototype._calculateDividedDifferences = function() {
    for (var j = 1; j < this._data.length; j++) {
      for (var i = 0; i < this._data.length - j; i++) {
        this._calculateStepResult(i, i + j);
      }
      this._prevColumn = this._column;
      this._column = [];
    }

    this._prevColumn = [];
  };


  HermiteInterpolation.prototype._calculateStepResult = function(i, j) {
    var result;
    var xI = this._data[i].x, xJ = this._data[j].x;

    if (xI.cmp(xJ) === 0) {
      result = this._getDifferentialResult(this._data[i], j - i);
    } else {
      var divisor = xJ.minus(xI);
      var dividend = this._prevColumn[i + 1].minus(this._prevColumn[i]);
      result = dividend.div(divisor);
    }

    this._column.push(result);

    this.emit('step', {i: i, j: j, result: result});
  };


  HermiteInterpolation.prototype._getDifferentialResult = function(point, order) {
    if (order === 1) {
      return point.d[0];
    } else {
      return point.d[order - 1].div(this._factorial(order));
    }
  };


  HermiteInterpolation.prototype._factorial = function(differentialOrder) {
    if (differentialOrder !== this._currentFactorialFactor) {
      this._currentFactorialResult *= ++this._currentFactorialFactor;
    }

    return this._currentFactorialResult;
  };


  HermiteInterpolation.prototype._cleanUp = function() {
    this._data = [];
    this._currentFactorialResult = 1;
    this._currentFactorialFactor = 1;
  };


  return HermiteInterpolation;
})();

},{"events":2}],2:[function(require,module,exports){
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

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},[1])(1)
});