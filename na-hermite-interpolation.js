/*!
 * na-hermite-interpolation
 * https://github.com/tfoxy/na-hermite-interpolation
 *
 * Copyright 2015 Tomás Fox
 * Released under the MIT license
 */

module.exports = (function() {
  "use strict";

  var events = require('events');


  function DuplicateError(message) {
    this.name = 'DuplicateError';
    //noinspection JSUnusedGlobalSymbols
    this.message = message || 'Duplicate x value';
  }
  DuplicateError.prototype = Object.create(Error.prototype);
  //noinspection JSUnusedGlobalSymbols
  DuplicateError.prototype.constructor = DuplicateError;


  function HermiteInterpolation() {
    this.data = [];
    this._column = [];
    this._prevColumn = [];
  }

  HermiteInterpolation._dataCompareFn = function (left, right) {
    return left.x.cmp(right.x);
  };

  HermiteInterpolation.DuplicateError = DuplicateError;


  HermiteInterpolation.prototype = Object.create(events.EventEmitter.prototype);
  //noinspection JSUnusedGlobalSymbols
  HermiteInterpolation.prototype.constructor = HermiteInterpolation;


  HermiteInterpolation.prototype.calculateDividedDifferences = function () {
    this._prepareData();
    this._calculateDividedDifferences();
  };


  HermiteInterpolation.prototype.calculatePolynomialCoefficients = function () {
    this._prepareData();

    var preCoef = [this._data[0].y];

    var stepListener = function (stepData) {
      if (stepData.i === 0) {
        preCoef.push(stepData.result);
      }
    };

    //noinspection JSUnresolvedFunction
    this.on('step', stepListener);

    this._calculateDividedDifferences();

    //noinspection JSUnresolvedFunction
    this.removeListener('step', stepListener);

    //noinspection JSUnresolvedFunction
    this.emit('preCoefficients', preCoef);

    return this._calculatePolynomialCoefficients(preCoef);
  };


  HermiteInterpolation.prototype._calculatePolynomialCoefficients = function (preCoef) {
    var coef = preCoef.slice();

    var tempCoef = [];
    var x_i;
    var fx_0i;

    var timesCoefFn = function (c) {
      return c.times(x_i);
    };

    var addAuxCoefFn = function (auxC, i) {
      tempCoef[i + 1] = tempCoef[i + 1].plus(auxC);
    };

    var addTempCoefFn = function (tempC, i) {
      coef[i] = fx_0i.times(tempC).plus(coef[i]);
    };


    for (var i = 1; i < coef.length; i++) {
      // f(x[0], ..., x[i]) * tempCoef * (x - x[i-1])

      //noinspection JSUnresolvedFunction
      x_i = this._data[i-1].x.neg();
      fx_0i = preCoef[i];
      var auxCoef = tempCoef;

      tempCoef = auxCoef.map(timesCoefFn);

      tempCoef.push(x_i);

      auxCoef.forEach(addAuxCoefFn);

      tempCoef.forEach(addTempCoefFn);
    }

    return coef;
  };


  HermiteInterpolation.prototype._prepareData = function () {
    this._checkDuplicateX();
    this._cloneData();
    this._duplicatePointsWithDifferential();
    this._orderDataByX();
    this._initPrevColumn();
  };


  HermiteInterpolation.prototype._checkDuplicateX = function () {
    var set = Object.create(null);

    this.data.forEach(function (point) {
      var x = JSON.stringify(point.x);
      if (x in set) {
        throw new DuplicateError();
      }
      set[x] = true;
    });
  };


  HermiteInterpolation.prototype._cloneData = function () {
    this._data = this.data.slice();
  };


  HermiteInterpolation.prototype._duplicatePointsWithDifferential = function() {
    this.data.forEach(function (point) {
      if (point.d) {
        this._data.push(point);
      }
    }, this);
  };


  HermiteInterpolation.prototype._orderDataByX = function() {
    this._data.sort(HermiteInterpolation._dataCompareFn);
  };


  HermiteInterpolation.prototype._initPrevColumn = function () {
    this._data.forEach(function (point) {
      this._prevColumn.push(point.y);
    }, this);
  };


  HermiteInterpolation.prototype._calculateDividedDifferences = function () {
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
    var divisor = this._data[j].x.minus(this._data[i].x);

    if (HermiteInterpolation._isZero(divisor)) {
      result = this._data[i].d;
    } else {
      var dividend = this._prevColumn[i + 1].minus(this._prevColumn[i]);
      result = dividend.div(divisor);
    }

    this._column.push(result);

    //noinspection JSUnresolvedFunction
    this.emit('step', {i: i, j: j, result: result});
  };


  HermiteInterpolation._isZero = function(number) {
    return !!number.c && number.c[0] === 0;
  };


  return HermiteInterpolation;
})();
