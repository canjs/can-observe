/*can-observe@2.0.0-pre.13#can-observe*/
define([
    'require',
    'exports',
    'module',
    './src/-make-object',
    './src/-make-array',
    './src/-make-function',
    './src/-make-observe',
    'can-reflect',
    './object/object',
    './array/array'
], function (require, exports, module) {
    var makeObject = require('./src/-make-object');
    var makeArray = require('./src/-make-array');
    var makeFunction = require('./src/-make-function');
    var makeObserve = require('./src/-make-observe');
    var canReflect = require('can-reflect');
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
    makeObserve.observe.makeMapType = function (name, staticProps, prototypeProps) {
        console.warn('Use observe.Object.extend instead');
        var Type = function (props) {
            canReflect.assign(this, props || {});
        };
        canReflect.assign(Type, staticProps || {});
        canReflect.assign(Type.prototype, prototypeProps || {});
        return makeObserve.observe(Type);
    };
    makeObserve.observe.makeListType = function (name, staticProps, prototypeProps) {
        console.warn('Use observe.Array.extend instead');
        var Type = function (values) {
            this.push.apply(this, values || []);
        };
        Type.prototype = Object.create(Array.prototype);
        canReflect.assign(Type, staticProps || {});
        canReflect.assign(Type.prototype, prototypeProps || {});
        Type.prototype.constructor = Type;
        return makeObserve.observe(Type);
    };
    module.exports = makeObserve.observe;
});