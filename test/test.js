/*!
 * na-hermite-interpolation
 * https://github.com/tfoxy/na-hermite-interpolation
 *
 * Copyright 2015 Tomás Fox
 * Released under the MIT license
 */

//noinspection BadExpressionStatementJS

var chai = require('chai');
var expect = chai.expect;

var HermiteInterpolation = require('..');

describe('HermiteInterpolation', function() {
  "use strict";

  it('is a function', function () {
    expect(HermiteInterpolation).to.be.a('function');
  });

});
