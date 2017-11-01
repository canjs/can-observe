/*can-observe@1.0.0#can-observe*/
define([
    'require',
    'exports',
    'module',
    'can-cid',
    'can-event/batch',
    'can-observation',
    'can-symbol',
    'can-reflect',
    'can-namespace',
    'can-event'
], function (require, exports, module) {
    var cid = require('can-cid');
    var canBatch = require('can-event/batch');
    var Observation = require('can-observation');
    var canSymbol = require('can-symbol');
    var canReflect = require('can-reflect');
    var namespace = require('can-namespace');
    var canEvent = require('can-event');
    var observableSymbol = canSymbol.for('can.meta');
    var hasOwn = Object.prototype.hasOwnProperty;
    function isIntegerIndex(prop) {
        return prop && +prop === +prop && +prop % 1 === 0;
    }
    var proxyOnly = Object.create(null);
    canReflect.assignSymbols(proxyOnly, {
        'can.onKeyValue': function (key, handler) {
            var handlers = this[observableSymbol].handlers;
            var keyHandlers = handlers[key];
            if (!keyHandlers) {
                keyHandlers = handlers[key] = [];
            }
            keyHandlers.push(handler);
        },
        'can.offKeyValue': function (key, handler) {
            var handlers = this[observableSymbol].handlers;
            var keyHandlers = handlers[key];
            if (keyHandlers) {
                var index = keyHandlers.indexOf(handler);
                if (index >= 0) {
                    keyHandlers.splice(index, 1);
                }
            }
        }
    });
    Object.assign(proxyOnly, canEvent);
    var arrayMethodInterceptors = Object.create(null);
    var mutateMethods = {
        'push': {
            add: function (arr, args, retVal) {
                return [
                    args,
                    arr.length - args.length
                ];
            }
        },
        'pop': {
            remove: function (arr, args, retVal) {
                return [
                    [retVal],
                    arr.length
                ];
            }
        },
        'shift': {
            remove: function (arr, args, retVal) {
                return [
                    [retVal],
                    0
                ];
            }
        },
        'unshift': {
            add: function (arr, args, retVal) {
                return [
                    args,
                    0
                ];
            }
        },
        'splice': {
            remove: function (arr, args, retVal) {
                return [
                    retVal,
                    args[0]
                ];
            },
            add: function (arr, args, retVal) {
                return [
                    args.slice(2),
                    args[0]
                ];
            }
        },
        'sort': {
            remove: function (arr, args, retVal, old) {
                return [
                    old,
                    0
                ];
            },
            add: function (arr, args, retVal) {
                return [
                    arr,
                    0
                ];
            }
        },
        'reverse': {
            remove: function (arr, args, retVal, old) {
                return [
                    old,
                    0
                ];
            },
            add: function (arr, args, retVal) {
                return [
                    arr,
                    0
                ];
            }
        }
    };
    var proxiableFunctions = [
        'map',
        'filter',
        'slice',
        'concat',
        'reduce',
        'reduceRight'
    ];
    Object.keys(mutateMethods).forEach(function (prop) {
        var changeEvents = mutateMethods[prop];
        var protoFn = Array.prototype[prop];
        arrayMethodInterceptors[prop] = function () {
            var handlers = this[observableSymbol].handlers;
            handlers.length = handlers.length || [];
            var old = [].slice.call(this, 0);
            var args = Array.from(arguments);
            var ret = protoFn.apply(this, arguments);
            canBatch.start();
            Object.keys(changeEvents).forEach(function (event) {
                var makeArgs = changeEvents[event];
                var handlerArgs = makeArgs(this, args, ret, old);
                canEvent.dispatch.call(this, event, handlerArgs);
            }.bind(this));
            handlers.length.forEach(function (handler) {
                canBatch.queue([
                    handler,
                    this,
                    [
                        this.length,
                        old.length
                    ]
                ]);
            }, this);
            canBatch.stop();
            return ret;
        };
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
    proxiableFunctions.forEach(function (prop) {
        arrayMethodInterceptors[prop] = proxyIntercept(Array.prototype[prop]);
    });
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
                var symbolLike = canReflect.isSymbolLike(key);
                var descriptor = Object.getOwnPropertyDescriptor(target, key);
                var value;
                if (descriptor && descriptor.get) {
                    value = descriptor.get.call(receiver);
                } else {
                    if (key === '__bindEvents') {
                        value = target[observableSymbol].__bindEvents;
                    } else {
                        value = target[key];
                    }
                }
                if (!symbolLike && key !== '__bindEvents' && !canReflect.isObservableLike(value) && (canReflect.isPlainObject(value) || Array.isArray(value))) {
                    value = target[key] = observe(value);
                }
                if (typeof value === 'function') {
                    if (isArray && arrayMethodInterceptors[key]) {
                        value = arrayMethodInterceptors[key];
                    } else {
                        value = obj[observableSymbol].interceptors[key] || (obj[observableSymbol].interceptors[key] = proxyIntercept(value));
                    }
                }
                if (key !== '_cid' && key !== '__bindEvents' && typeof value !== 'function' && !symbolLike && (hasOwn.call(target, key) || !Object.isSealed(target))) {
                    Observation.add(receiver, key.toString());
                }
                return value;
            },
            set: function (target, key, value, receiver) {
                var old, change;
                var descriptor = Object.getOwnPropertyDescriptor(target, key);
                if (!canReflect.isSymbolLike(key) && !canReflect.isObservableLike(value) && (canReflect.isPlainObject(value) || Array.isArray(value))) {
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
                if (typeof old === 'function') {
                    target[observableSymbol].interceptors[key] = null;
                }
                if (change) {
                    canBatch.start();
                    (target[observableSymbol].handlers[key] || []).forEach(function (handler) {
                        canBatch.queue([
                            handler,
                            receiver,
                            [
                                value,
                                old
                            ]
                        ]);
                    });
                    canBatch.stop();
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
                if (ret && (!Array.isArray(target) || !isIntegerIndex(key))) {
                    canBatch.start();
                    (target[observableSymbol].handlers[key] || []).forEach(function (handler, i) {
                        if (old !== undefined) {
                            canBatch.queue([
                                handler,
                                receiver,
                                [
                                    undefined,
                                    old
                                ]
                            ]);
                        }
                    });
                    canBatch.stop();
                }
                target[observableSymbol].interceptors[key] = null;
                return ret;
            }
        });
        p[observableSymbol] = {
            handlers: {},
            __bindEvents: {},
            proxy: p,
            interceptors: {}
        };
        return p;
    };
    namespace.observe = observe;
    module.exports = observe;
});