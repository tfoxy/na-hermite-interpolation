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
var assert = chai.assert;

var sinon = require('sinon');

var Big = require('big.js');

var HermiteInterpolation = require('..');

describe('HermiteInterpolation', function() {
  "use strict";

  it('is a function', function () {
    expect(HermiteInterpolation).to.be.a('function');
  });

  describe('instance', function () {

    var hermite;

    beforeEach(function() {
      hermite = new HermiteInterpolation();
    });

    it('is an object', function () {
      expect(hermite).to.be.an('object');
    });

    it('is an instance of HermiteInterpolation', function () {
      expect(hermite).to.be.an.instanceOf(HermiteInterpolation);
    });

    describe('_orderDataByX', function() {

      it('orders the data by x property', function() {
        var p0 = {x: new Big(2), y: new Big(1)};
        var p1 = {x: new Big(1), y: new Big(2)};

        hermite.data = [p0, p1];

        hermite._orderDataByX();

        expect(hermite.data).to.deep.equal([p1, p0]);
      });

    });

    it('has an "on" method', function () {
      expect(hermite).to.have.property('on').to.be.a('function');
    });

    describe('calculateDividedDifferences', function () {

      it('calculates only step[0,1] with 2 points', function () {
        var p0 = {x: new Big(6), y: new Big(5)};
        var p1 = {x: new Big(8), y: new Big(13)};

        var listener = sinon.spy(function(stepData) {
          expect(stepData).to.include({i: 0, j: 1});
        });

        hermite.on('step', listener);

        hermite.calculateDividedDifferences([p0, p1]);

        assert.isTrue(listener.calledOnce);
      });

      it('calculates steps [0,1],[1,2],[0,2] with 3 points', function () {
        var p0 = {x: new Big(6), y: new Big(5)};
        var p1 = {x: new Big(8), y: new Big(13)};
        var p2 = {x: new Big(14), y: new Big(-11)};

        var spy01 = sinon.spy();
        var spy12 = sinon.spy();
        var spy02 = sinon.spy();

        var listener = sinon.spy(function(stepData) {
          var i = stepData.i, j = stepData.j;
          if (i === 0 && j === 1)
            spy01();
          else if (i === 1 && j === 2)
            spy12();
          else if (i === 0 && j === 2)
            spy02();
        });

        hermite.on('step', listener);

        hermite.calculateDividedDifferences([p0, p1, p2]);

        expect(listener.callCount).to.equals(3);
        assert.isTrue(spy01.calledOnce);
        assert.isTrue(spy12.calledOnce);
        assert.isTrue(spy02.calledOnce);
      });

    });

    describe('calculatePolynomialCoefficients', function() {

      it('returns the coefficients of the polynomial (using 2 points)', function () {
        var p0 = {x: new Big(6), y: new Big(5)};
        var p1 = {x: new Big(8), y: new Big(13)};
        var data = [p0, p1];
        var coef = [new Big(5), new Big(4)];

        expect(hermite.calculatePolynomialCoefficients(data)).to.deep.equal(coef);
      });

      it('returns the coefficients of the polynomial (using 3 points)', function () {
        var p0 = {x: new Big(6), y: new Big(5)};
        var p1 = {x: new Big(8), y: new Big(13)};
        var p2 = {x: new Big(14), y: new Big(-11)};
        var data = [p0, p1, p2];
        var coef = [new Big(5), new Big(4), new Big(-1)];

        expect(hermite.calculatePolynomialCoefficients(data)).to.deep.equal(coef);
      });

      it('returns the coefficients of the polynomial (using 4 points)', function () {
        var p0 = {x: new Big(6), y: new Big(5)};
        var p1 = {x: new Big(8), y: new Big(13)};
        var p2 = {x: new Big(14), y: new Big(-11)};
        var p3 = {x: new Big(15), y: new Big(41)};
        var data = [p0, p1, p2, p3];
        var coef = [new Big(5), new Big(4), new Big(-1), new Big(1)];

        expect(hermite.calculatePolynomialCoefficients(data)).to.deep.equal(coef);
      });

    });

  });

});
