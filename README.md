# Hermite interpolation

## Usage example

[Live Demo](http://jsbin.com/musoya/embed?js,console)

```js

// If not executing on node.js and want to listen to events,
// use an EventEmitter library, e.g., https://github.com/asyncly/EventEmitter2
HermiteInterpolation.setEventEmitter(EventEmitter2);

var hermite = new HermiteInterpolation();

// Use bignumber.js to create numbers: https://github.com/MikeMcl/bignumber.js/
hermite.data = [
  {x: new BigNumber(4) , y: new BigNumber(5), d: new BigNumber(3)},
  {x: new BigNumber(15), y: new BigNumber(1), d: new BigNumber(4)}
];

// Divided differences
hermite.on('step', function(data) {
  console.log('f[x_' + data.i + ',...,x_' + data.j + '] = ' + data.result);
});

var coefficients = hermite.calculatePolynomialCoefficients();
console.log(coefficients); // => [...]

var polynomial = coefficients.map(function(coeff, i) {
  return coeff + ' x^' + i;
}).join(' + ');

console.log(polynomial); // => "a x^0 + b x^1 + c x^2 + d x^3"

```
