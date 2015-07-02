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

  describe('instance', function () {

    var hermite;

    before(function() {
      hermite = new HermiteInterpolation();
    });

    it('is an object', function () {
      expect(hermite).to.be.an('object');
    });

    describe('_orderDataByX', function() {

      it('orders the data by x property', function() {
        var p0 = {x: 2, y: 1};
        var p1 = {x: 1, y: 2};

        hermite.data = [p0, p1];

        hermite._orderDataByX();

        expect(hermite.data).to.deep.equal([p1, p0]);
      });



    });

  });

});
