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
  }

  HermiteInterpolation.prototype = Object.create(events.EventEmitter.prototype);

  HermiteInterpolation._dataCompareFn = function (left, right) {
    return left.x - right.x;
  };

  /*
  HermiteInterpolation.prototype.calculate = function (data) {
    this.data = data;

    this._prepareData();
    this._calculateResult();
  };
  */

  /*
  HermiteInterpolation.prototype._prepareData = function () {
    this._duplicatePointsWithDifferential();
    this._orderDataByX();
  };
  */

  /*
  HermiteInterpolation.prototype._duplicatePointsWithDifferential = function() {
    // TODO
  };
  */

  HermiteInterpolation.prototype._orderDataByX = function() {
    this.data.sort(HermiteInterpolation._dataCompareFn);
  };

  /*
  HermiteInterpolation.prototype._calculateResult = function () {
    // TODO
  };
  */

  /*
  HermiteInterpolation.prototype._calculateStepResult = function(i, j) {
    var data = this.data;
    var prevColumn = this._prevColumn;
    var result = (prevColumn[i + 1] - prevColumn[i]) / (data[j].x - data[i].x);
    this._column.push(result);
    this.emit('step', {i: i, j: j, result: result});
  };
  */

  return HermiteInterpolation;
})();
