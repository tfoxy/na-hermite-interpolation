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

  function HermiteInterpolation() {
    this.data = [];
    this._column = [];
    this._prevColumn = [];
  }

  HermiteInterpolation._dataCompareFn = function (left, right) {
    return left.x.cmp(right.x);
  };


  HermiteInterpolation.prototype = Object.create(events.EventEmitter.prototype);
  //noinspection JSUnusedGlobalSymbols
  HermiteInterpolation.prototype.constructor = HermiteInterpolation;


  HermiteInterpolation.prototype.calculateDividedDifferences = function (data) {
    this.data = data;

    this._prepareData();
    this._calculateDividedDifferences();
  };


  HermiteInterpolation.prototype.calculatePolynomialCoefficients = function (data) {
    this.data = data;

    this._prepareData();

    var coef = [data[0].y];

    var stepListener = function (stepData) {
      if (stepData.i === 0) {
        coef.push(stepData.result);
      }
    };

    //noinspection JSUnresolvedFunction
    this.on('step', stepListener);

    this._calculateDividedDifferences();

    //noinspection JSUnresolvedFunction
    this.removeListener('step', stepListener);

    return coef;
  };


  HermiteInterpolation.prototype._prepareData = function () {
    this._duplicatePointsWithDifferential();
    this._orderDataByX();
    this._initPrevColumn();
  };


  HermiteInterpolation.prototype._duplicatePointsWithDifferential = function() {
    // TODO
  };


  HermiteInterpolation.prototype._orderDataByX = function() {
    this.data.sort(HermiteInterpolation._dataCompareFn);
  };


  HermiteInterpolation.prototype._initPrevColumn = function () {
    this.data.forEach(function (point) {
      this._prevColumn.push(point.y);
    }, this);
  };


  HermiteInterpolation.prototype._calculateDividedDifferences = function () {
    for (var j = 1; j < this.data.length; j++) {
      for (var i = 0; i < this.data.length - j; i++) {
        this._calculateStepResult(i, i + j);
      }
      this._prevColumn = this._column;
      this._column = [];
    }

    this._prevColumn = [];
  };


  HermiteInterpolation.prototype._calculateStepResult = function(i, j) {
    var data = this.data;
    var prevColumn = this._prevColumn;
    var dividend = prevColumn[i + 1].minus(prevColumn[i]);
    var divisor = data[j].x.minus(data[i].x);
    var result = dividend.div(divisor);

    this._column.push(result);

    //noinspection JSUnresolvedFunction
    this.emit('step', {i: i, j: j, result: result});
  };


  return HermiteInterpolation;
})();
