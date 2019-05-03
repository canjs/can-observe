/*can-observe@2.2.1#decorators/decorators*/
define([
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-simple-observable/async',
    'can-simple-observable/resolver',
    '../src/-computed-helpers'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var AsyncObservable = require('can-simple-observable/async');
    var ResolverObservable = require('can-simple-observable/resolver');
    var computedHelpers = require('../src/-computed-helpers');
    function defineProperty(prototype, prop, makeObservable) {
        computedHelpers.ensureDefinition(prototype)[prop] = makeObservable;
    }
    function asyncBase(config) {
        return function (target, key, descriptor) {
            if (descriptor.get !== undefined) {
                var getter = descriptor.get;
                return defineProperty(target, key, function (instance, property) {
                    function fn(lastSet, resolve) {
                        if (!resolve) {
                            return config.default;
                        }
                        var promise = getter.call(this, true);
                        if (canReflect.isPromise(promise)) {
                            promise.then(resolve);
                            return config.default;
                        }
                    }
                    return new AsyncObservable(fn, instance, config.default);
                });
            }
            if (descriptor.value !== undefined) {
                var method = descriptor.value;
                return defineProperty(target, key, function (instance, property) {
                    return new AsyncObservable(function (lastSet, resolve) {
                        return method.call(this, resolve);
                    }, instance, config.default);
                });
            }
        };
    }
    function resolverBase(config) {
        return function (target, key, descriptor) {
            if (descriptor.value !== undefined) {
                var method = descriptor.value;
                return defineProperty(target, key, function (instance, property) {
                    return new ResolverObservable(method, instance);
                });
            }
        };
    }
    function optionalConfig(decorator) {
        function wrapper(config) {
            if (arguments.length === 3) {
                return decorator({}).apply(null, arguments);
            }
            return decorator(config);
        }
        return wrapper;
    }
    module.exports = {
        async: optionalConfig(asyncBase),
        resolver: optionalConfig(resolverBase)
    };
});