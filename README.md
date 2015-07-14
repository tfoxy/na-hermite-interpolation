# Hermite interpolation

## Usage example

````js

var hermite = new HermiteInterpolation();

// Use big.js and bigjs-neg to create numbers
// Or only bignumber.js
hermite.data = [
  {x: new Big(4), y: new Big(5), d: new Big(3)},
  {x: new Big(15), y: new Big(1), d: new Big(4)}
];

// Divided differences
hermite.on('step', function(data) {
  console.log('f[x_' + data.i + ',...,x_' + data.j + '] = ' data.result);
});

var coefficients = hermite.calculatePolynomialCoefficients();
console.log(coefficients); => [...]

var polynomial = coefficients.map(function(coeff, i) {
  return coeff + ' x^' + i;
}).join(' + ');

console.log(polynomial); => a x^0 + b x^1 + c x^2 + d x^3

````
