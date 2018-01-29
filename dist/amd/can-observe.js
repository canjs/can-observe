/*can-observe@2.0.0#can-observe*/
define([
    'require',
    'exports',
    'module',
    './src/-make-object',
    './src/-make-array',
    './src/-make-function',
    './src/-make-observe',
    './object/object',
    './array/array'
], function (require, exports, module) {
    var makeObject = require('./src/-make-object');
    var makeArray = require('./src/-make-array');
    var makeFunction = require('./src/-make-function');
    var makeObserve = require('./src/-make-observe');
    var ObserveObject = require('./object/object');
    var ObserveArray = require('./array/array');
    makeObserve.object = function (object) {
        return makeObject.observable(object, makeObserve);
    };
    makeObserve.array = function (array) {
        return makeArray.observable(array, makeObserve);
    };
    makeObserve.function = function (array) {
        return makeFunction.observable(array, makeObserve);
    };
    makeObserve.observe.Object = ObserveObject;
    makeObserve.observe.Array = ObserveArray;
    module.exports = makeObserve.observe;
});