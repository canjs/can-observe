/*can-observe@2.3.0#can-observe*/
define([
    'require',
    'exports',
    'module',
    './src/-make-object',
    './src/-make-array',
    './src/-make-function',
    './src/-make-observe',
    './src/-make-prototype',
    './object/object',
    './array/array',
    './src/-computed-helpers',
    './decorators/decorators'
], function (require, exports, module) {
    'use strict';
    var makeObject = require('./src/-make-object');
    var makeArray = require('./src/-make-array');
    var makeFunction = require('./src/-make-function');
    var makeObserve = require('./src/-make-observe');
    var makePrototype = require('./src/-make-prototype');
    var ObserveObject = require('./object/object');
    var ObserveArray = require('./array/array');
    var computedHelpers = require('./src/-computed-helpers');
    var decorators = require('./decorators/decorators');
    makeObserve.object = function (object) {
        return makeObject.observable(object, makeObserve);
    };
    makeObserve.prototype = function (proto) {
        return makePrototype.observable(proto, makeObserve);
    };
    makeObserve.array = function (array) {
        return makeArray.observable(array, makeObserve);
    };
    makeObserve.function = function (fn) {
        return makeFunction.observable(fn, makeObserve);
    };
    makeObserve.observe.Object = ObserveObject;
    makeObserve.observe.Array = ObserveArray;
    module.exports = makeObserve.observe;
    module.exports.defineProperty = function (prototype, prop, makeObservable) {
        computedHelpers.ensureDefinition(prototype)[prop] = makeObservable;
    };
    for (var key in decorators) {
        module.exports[key] = decorators[key];
    }
});