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
require('bigjs-neg')(Big);

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

        hermite._data = [p0, p1];

        hermite._orderDataByX();

        expect(hermite._data).to.deep.equal([p1, p0]);
      });


    });


    it('has an "on" method', function () {
      expect(hermite).to.have.property('on').to.be.a('function');
    });


    describe('calculateDividedDifferences', function () {


      it('calculates only step[0,1] with 2 points', function () {
        hermite.data = [
          {x: new Big(6), y: new Big(5)},
          {x: new Big(8), y: new Big(13)}
        ];

        var listener = sinon.spy(function(stepData) {
          expect(stepData).to.include({i: 0, j: 1});
        });

        hermite.on('step', listener);

        hermite.calculateDividedDifferences();

        assert.isTrue(listener.calledOnce);
      });


      it('calculates correctly the divided difference with 2 points', function () {
        hermite.data = [
          {x: new Big(6), y: new Big(5)},
          {x: new Big(8), y: new Big(13)}
        ];

        var listener = sinon.spy(function(stepData) {
          expect(stepData).to.have.property('result').to.deep.equal(new Big(4));
        });

        hermite.on('step', listener);

        hermite.calculateDividedDifferences();

        assert.isTrue(listener.calledOnce);
      });


      it('calculates steps [0,1],[1,2],[0,2] with 3 points', function () {
        hermite.data = [
          {x: new Big(6), y: new Big(5)},
          {x: new Big(8), y: new Big(13)},
          {x: new Big(14), y: new Big(-11)}
        ];

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

        hermite.calculateDividedDifferences();

        expect(listener.callCount).to.equals(3);
        assert.isTrue(spy01.calledOnce);
        assert.isTrue(spy12.calledOnce);
        assert.isTrue(spy02.calledOnce);
      });


      it('calculates correctly the divided differences with 4 points', function () {
        hermite.data = [
          {x: new Big(6), y: new Big(5)},
          {x: new Big(8), y: new Big(13)},
          {x: new Big(14), y: new Big(-11)},
          {x: new Big(15), y: new Big(41)}
        ];

        var expectedResults = [
          {1: new Big(4), 2: new Big(-1), 3: new Big(1)},
          {2: new Big(-4), 3: new Big(8)},
          {3: new Big(52)}
        ];

        var listener = sinon.spy(function(stepData) {
          var i = stepData.i, j = stepData.j;
          expect(stepData).to.have.property('result').to.deep.equal(expectedResults[i][j]);
        });

        hermite.on('step', listener);

        hermite.calculateDividedDifferences();

        expect(listener.callCount).to.equal(6);
      });


      it('calculates correctly the divided difference with 1 point with differential', function () {
        hermite.data = [
          {x: new Big(6), y: new Big(5), d: new Big(3)}
        ];

        var listener = sinon.spy(function(stepData) {
          expect(stepData).to.have.property('result').to.deep.equal(new Big(3));
        });

        hermite.on('step', listener);

        hermite.calculateDividedDifferences();

        assert.isTrue(listener.calledOnce);
      });


    });


    describe('calculatePolynomialCoefficients', function() {


      it('returns the coefficients of the polynomial (using 2 points)', function () {
        hermite.data = [
          {x: new Big(6), y: new Big(5)},
          {x: new Big(8), y: new Big(13)}
        ];
        var preCoef = [new Big(5), new Big(4)];
        var coef = [new Big(-19), new Big(4)];

        var listener = sinon.spy(function (preCoefData) {
          expect(preCoefData).to.deep.equal(preCoef);
        });

        hermite.on('preCoefficients', listener);

        expect(hermite.calculatePolynomialCoefficients()).to.deep.equal(coef);

        assert.isTrue(listener.calledOnce);
      });


      it('returns the coefficients of the polynomial (using 3 points)', function () {
        hermite.data = [
          {x: new Big(6), y: new Big(5)},
          {x: new Big(8), y: new Big(13)},
          {x: new Big(14), y: new Big(-11)}
        ];
        var preCoef = [new Big(5), new Big(4), new Big(-1)];
        var coef = [new Big(-67), new Big(18), new Big(-1)];

        var listener = sinon.spy(function (preCoefData) {
          expect(preCoefData).to.deep.equal(preCoef);
        });

        hermite.on('preCoefficients', listener);

        expect(hermite.calculatePolynomialCoefficients()).to.deep.equal(coef);

        assert.isTrue(listener.calledOnce);
      });


      it('returns the coefficients of the polynomial (using 4 points)', function () {
        hermite.data = [
          {x: new Big(6), y: new Big(5)},
          {x: new Big(8), y: new Big(13)},
          {x: new Big(14), y: new Big(-11)},
          {x: new Big(15), y: new Big(41)}
        ];
        var preCoef = [new Big(5), new Big(4), new Big(-1), new Big(1)];
        var coef = [new Big(-739), new Big(262), new Big(-29), new Big(1)];

        var listener = sinon.spy(function (preCoefData) {
          expect(preCoefData).to.deep.equal(preCoef);
        });

        hermite.on('preCoefficients', listener);

        expect(hermite.calculatePolynomialCoefficients()).to.deep.equal(coef);

        assert.isTrue(listener.calledOnce);
      });


    });


    describe('_checkDuplicateX', function () {


      it('throws an error if there are two points with the same x', function () {
        hermite.data = [
          {x: new Big(4), y: new Big(5)},
          {x: new Big(4), y: new Big(7)}
        ];

        expect(hermite._checkDuplicateX.bind(hermite)).
            to.throw(HermiteInterpolation.DuplicateError);
      });


    });


    describe('_duplicatePointsWithDifferential', function() {


      it('duplicates points ', function () {
        var p0 = {x: new Big(4), y: new Big(5), d: new Big(3)},
            p1 = {x: new Big(8), y: new Big(7)};

        hermite.data = [p0, p1];

        hermite._cloneData();

        hermite._duplicatePointsWithDifferential();

        expect(hermite._data).to.deep.equal([p0, p1, p0]);
      });


    });


  });


});
