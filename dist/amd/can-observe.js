/*can-observe@2.0.0-pre.0#can-observe*/
define([
    'require',
    'exports',
    'module',
    'can-cid',
    'can-queues',
    'can-observation-recorder',
    'can-symbol',
    'can-reflect',
    'can-namespace',
    'can-util/js/diff-array',
    'can-key-tree'
], function (require, exports, module) {
    var cid = require('can-cid');
    var queues = require('can-queues');
    var ObservationRecorder = require('can-observation-recorder');
    var canSymbol = require('can-symbol');
    var canReflect = require('can-reflect');
    var namespace = require('can-namespace');
    var diffArray = require('can-util/js/diff-array');
    var KeyTree = require('can-key-tree');
    var observableSymbol = canSymbol.for('can.meta');
    var patchesSymbol = canSymbol('patches');
    var hasOwn = Object.prototype.hasOwnProperty;
    var interceptors = new WeakMap();
    function isIntegerIndex(prop) {
        return prop && +prop === +prop && +prop % 1 === 0;
    }
    function shouldAddObservation(key, value, target) {
        return key !== '_cid' && typeof value !== 'function' && !canReflect.isSymbolLike(key) && (hasOwn.call(target, key) || !Object.isSealed(target)) && !target[observableSymbol].inArrayMethod;
    }
    function shouldObserveValue(key, value, target, onlyIfHandlers) {
        return value && typeof value === 'object' && !canReflect.isSymbolLike(key) && (!onlyIfHandlers || target[observableSymbol].handlers.getNode([key]));
    }
    function shouldDispatchEvents(key, value, target, change, isArray) {
        return change && (key !== 'length' || !isArray || !target[observableSymbol].inArrayMethod);
    }
    function didLengthChangeCauseDeletions(key, value, target, old, isArray) {
        return isArray && key === 'length' && value < old && !target[observableSymbol].inArrayMethod;
    }
    var proxyOnly = Object.create(null);
    canReflect.assignSymbols(proxyOnly, {
        'can.onKeyValue': function (key, handler, queue) {
            var handlers = this[observableSymbol].handlers;
            handlers.add([
                key,
                queue || 'notify',
                handler
            ]);
        },
        'can.offKeyValue': function (key, handler, queue) {
            var handlers = this[observableSymbol].handlers;
            handlers.delete([
                key,
                queue || 'notify',
                handler
            ]);
        },
        'can.onPatches': function (handler, queue) {
            var handlers = this[observableSymbol].handlers;
            handlers.add([
                patchesSymbol,
                queue || 'notify',
                handler
            ]);
        },
        'can.offPatches': function (handler, queue) {
            var handlers = this[observableSymbol].handlers;
            handlers.delete([
                patchesSymbol,
                queue || 'notify',
                handler
            ]);
        }
    });
    var dispatch = proxyOnly.dispatch = function (key, args) {
        var handlers = this[observableSymbol].handlers;
        var keyHandlers = handlers.getNode([key]);
        if (keyHandlers) {
            queues.enqueueByQueue(keyHandlers, this, args);
        }
    };
    var mutateMethods = {
        'push': function (arr, args) {
            return [{
                    index: arr.length - args.length,
                    deleteCount: 0,
                    insert: args
                }];
        },
        'pop': function (arr) {
            return [{
                    index: arr.length,
                    deleteCount: 1,
                    insert: []
                }];
        },
        'shift': function () {
            return [{
                    index: 0,
                    deleteCount: 1,
                    insert: []
                }];
        },
        'unshift': function (arr, args) {
            return [{
                    index: 0,
                    deleteCount: 0,
                    insert: args
                }];
        },
        'splice': function (arr, args) {
            return [{
                    index: args[0],
                    deleteCount: args[1],
                    insert: args.slice(2)
                }];
        },
        'sort': function (arr, args, old) {
            return diffArray(old, arr);
        },
        'reverse': function (arr, args, old) {
            return diffArray(old, arr);
        }
    };
    Object.keys(mutateMethods).forEach(function (prop) {
        var protoFn = Array.prototype[prop];
        interceptors.set(protoFn, function () {
            this[observableSymbol].inArrayMethod = true;
            var old = [].slice.call(this, 0);
            var ret = protoFn.apply(this, arguments);
            var patches = mutateMethods[prop](this, Array.from(arguments), old);
            queues.batch.start();
            dispatch.call(this, 'length', [
                this.length,
                old.length
            ]);
            dispatch.call(this, patchesSymbol, [patches.concat([{
                        property: 'length',
                        type: 'set',
                        value: this.length
                    }])]);
            queues.batch.stop();
            this[observableSymbol].inArrayMethod = false;
            return ret;
        });
    });
    Object.getOwnPropertyNames(Array.prototype).forEach(function (prop) {
        if (mutateMethods[prop]) {
            return;
        }
        var protoFn = Array.prototype[prop];
        if (prop !== 'constructor' && typeof protoFn === 'function') {
            interceptors.set(protoFn, function () {
                ObservationRecorder.add(this, patchesSymbol);
                this[observableSymbol].inArrayMethod = true;
                var ret = protoFn.apply(this, arguments);
                this[observableSymbol].inArrayMethod = false;
                if (ret && typeof ret === 'object') {
                    ret = observe(ret);
                }
                return ret;
            });
        }
    });
    function proxyIntercept(fn) {
        return function () {
            var ret = fn.apply(this, arguments);
            if (ret && typeof ret === 'object') {
                ret = observe(ret);
            }
            return ret;
        };
    }
    var observe = function (obj) {
        if (obj[observableSymbol]) {
            return obj[observableSymbol].proxy;
        } else {
            Object.defineProperty(obj, '_cid', {
                value: cid({}),
                enumerable: false
            });
        }
        var isArray = obj instanceof Array;
        var p = new Proxy(obj, {
            get: function (target, key, receiver) {
                if (proxyOnly[key]) {
                    return proxyOnly[key];
                }
                var descriptor = Object.getOwnPropertyDescriptor(target, key);
                var value;
                if (descriptor && descriptor.get) {
                    value = descriptor.get.call(receiver);
                } else {
                    value = target[key];
                }
                if (shouldObserveValue(key, value, target)) {
                    value = target[key] = observe(value);
                }
                if (typeof value === 'function') {
                    if (interceptors.has(value)) {
                        value = interceptors.get(value);
                    } else {
                        interceptors.set(value, value = proxyIntercept(value));
                    }
                }
                if (shouldAddObservation(key, value, target)) {
                    ObservationRecorder.add(receiver, key.toString());
                }
                return value;
            },
            set: function (target, key, value, receiver) {
                var old, change;
                var hadOwn = hasOwn.call(target, key);
                var integerIndex = isIntegerIndex(key);
                var descriptor = Object.getOwnPropertyDescriptor(target, key);
                if (shouldObserveValue(key, value, target, true)) {
                    value = observe(value);
                } else if (value && value[observableSymbol]) {
                    value = value[observableSymbol].proxy;
                }
                if (descriptor && descriptor.set) {
                    descriptor.set.call(receiver, value);
                } else {
                    old = target[key];
                    change = old !== value;
                    if (change) {
                        target[key] = value;
                    }
                }
                if (shouldDispatchEvents(key, value, target, change, isArray)) {
                    queues.batch.start();
                    var patches = [];
                    dispatch.call(receiver, key, [
                        value,
                        old
                    ]);
                    if (!target[observableSymbol].inArrayMethod) {
                        patches.push({
                            property: key,
                            type: hadOwn ? 'set' : 'add',
                            value: value
                        });
                        if (isArray && integerIndex) {
                            if (!hadOwn && +key === target.length - 1) {
                                patches.push({
                                    property: 'length',
                                    type: 'set',
                                    value: target.length
                                });
                            } else {
                                patches.push.apply(patches, mutateMethods.splice(obj, [
                                    +key,
                                    1,
                                    value
                                ]));
                            }
                        }
                    }
                    if (didLengthChangeCauseDeletions(key, value, target, old, isArray)) {
                        while (old-- > value) {
                            patches.push({
                                property: old,
                                type: 'remove'
                            });
                        }
                    }
                    if (patches.length) {
                        dispatch.call(receiver, patchesSymbol, [patches]);
                    }
                    queues.batch.stop();
                }
                return true;
            },
            ownKeys: function (target) {
                return Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target)).concat(Object.getOwnPropertySymbols(proxyOnly));
            },
            deleteProperty: function (target, key) {
                var old = target[key];
                var ret = delete target[key];
                var receiver = target[observableSymbol].proxy;
                if (ret && !target[observableSymbol].inArrayMethod && old !== undefined) {
                    queues.batch.start();
                    dispatch.call(receiver, key, [
                        undefined,
                        old
                    ]);
                    dispatch.call(receiver, patchesSymbol, [[{
                                property: key,
                                type: 'remove'
                            }]]);
                    queues.batch.stop();
                }
                return ret;
            }
        });
        obj[observableSymbol] = {
            handlers: new KeyTree([
                Object,
                Object,
                Array
            ]),
            proxy: p
        };
        return p;
    };
    namespace.observe = observe;
    module.exports = observe;
});