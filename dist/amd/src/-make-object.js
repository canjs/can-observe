/*can-observe@2.2.1#src/-make-object*/
define([
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-observation-recorder',
    'can-event-queue/map',
    './-symbols',
    './-observable-store',
    './-helpers',
    './-computed-helpers'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var ObservationRecorder = require('can-observation-recorder');
    var mapBindings = require('can-event-queue/map');
    var symbols = require('./-symbols');
    var observableStore = require('./-observable-store');
    var helpers = require('./-helpers');
    var computedHelpers = require('./-computed-helpers');
    var hasOwn = Object.prototype.hasOwnProperty;
    var isSymbolLike = canReflect.isSymbolLike;
    var proxyKeys = Object.create(null);
    Object.getOwnPropertySymbols(mapBindings).forEach(function (symbol) {
        helpers.assignNonEnumerable(proxyKeys, symbol, mapBindings[symbol]);
    });
    computedHelpers.addKeyDependencies(proxyKeys);
    var makeObject = {
        observable: function (object, options) {
            if (options.shouldRecordObservation === undefined) {
                options.shouldRecordObservation = makeObject.shouldRecordObservationOnOwnAndMissingKeys;
            }
            var meta = {
                target: object,
                proxyKeys: options.proxyKeys !== undefined ? options.proxyKeys : Object.create(makeObject.proxyKeys()),
                computedKeys: Object.create(null),
                options: options,
                preventSideEffects: 0
            };
            helpers.assignNonEnumerable(meta.proxyKeys, symbols.metaSymbol, meta);
            var traps = {
                get: makeObject.get.bind(meta),
                set: makeObject.set.bind(meta),
                ownKeys: makeObject.ownKeys.bind(meta),
                deleteProperty: makeObject.deleteProperty.bind(meta),
                getOwnPropertyDescriptor: makeObject.getOwnPropertyDescriptor.bind(meta),
                meta: meta
            };
            if (options.getPrototypeOf) {
                traps.getPrototypeOf = options.getPrototypeOf;
            }
            meta.proxy = new Proxy(object, traps);
            mapBindings.addHandlers(meta.proxy, meta);
            return meta.proxy;
        },
        proxyKeys: function () {
            return proxyKeys;
        },
        get: function (target, key, receiver) {
            var proxyKey = this.proxyKeys[key];
            if (proxyKey !== undefined) {
                return proxyKey;
            }
            if (isSymbolLike(key)) {
                return target[key];
            }
            var computedValue = computedHelpers.get(receiver, key);
            if (computedValue !== undefined) {
                return computedValue.value;
            }
            var keyInfo = makeObject.getKeyInfo(target, key, receiver, this);
            var value = keyInfo.targetValue;
            if (!keyInfo.valueIsInvariant) {
                value = makeObject.getValueFromStore(key, value, this);
            }
            if (this.options.shouldRecordObservation(keyInfo, this)) {
                ObservationRecorder.add(this.proxy, key.toString());
            }
            if (keyInfo.parentObservableGetCalledOn) {
                ObservationRecorder.add(keyInfo.parentObservableGetCalledOn, key.toString());
            }
            return value;
        },
        set: function (target, key, value, receiver) {
            if (receiver !== this.proxy && this.options.proxiedPrototype !== true) {
                return makeObject.setKey(receiver, key, value, this);
            }
            var computedValue = computedHelpers.set(receiver, key, value);
            if (computedValue === true) {
                return true;
            }
            value = makeObject.getValueToSet(key, value, this);
            makeObject.setValueAndOnChange(key, value, this, function (key, value, meta, hadOwn, old) {
                var dispatchArgs = {
                    type: key,
                    patches: [{
                            key: key,
                            type: hadOwn ? 'set' : 'add',
                            value: value
                        }],
                    keyChanged: !hadOwn ? key : undefined
                };
                mapBindings.dispatch.call(meta.proxy, dispatchArgs, [
                    value,
                    old
                ]);
            });
            return true;
        },
        deleteProperty: function (target, key) {
            var old = this.target[key], deleteSuccessful = delete this.target[key];
            if (deleteSuccessful && this.preventSideEffects === 0 && old !== undefined) {
                var dispatchArgs = {
                    type: key,
                    patches: [{
                            key: key,
                            type: 'delete'
                        }],
                    keyChanged: key
                };
                mapBindings.dispatch.call(this.proxy, dispatchArgs, [
                    undefined,
                    old
                ]);
            }
            return deleteSuccessful;
        },
        ownKeys: function (target) {
            ObservationRecorder.add(this.proxy, symbols.keysSymbol);
            return Object.getOwnPropertyNames(this.target).concat(Object.getOwnPropertySymbols(this.target)).concat(Object.getOwnPropertySymbols(this.proxyKeys));
        },
        getOwnPropertyDescriptor: function (target, key) {
            var desc = Object.getOwnPropertyDescriptor(target, key);
            if (!desc && key in this.proxyKeys) {
                return Object.getOwnPropertyDescriptor(this.proxyKeys, key);
            }
            return desc;
        },
        getKeyInfo: function (target, key, receiver, meta) {
            var descriptor = Object.getOwnPropertyDescriptor(target, key);
            var propertyInfo = {
                key: key,
                descriptor: descriptor,
                targetHasOwnKey: Boolean(descriptor),
                getCalledOnParent: receiver !== meta.proxy,
                protoHasKey: false,
                valueIsInvariant: false,
                targetValue: undefined,
                isAccessor: false
            };
            if (propertyInfo.getCalledOnParent === true) {
                propertyInfo.parentObservableGetCalledOn = observableStore.proxiedObjects.get(receiver);
            }
            if (descriptor !== undefined) {
                propertyInfo.valueIsInvariant = descriptor.writable === false;
                if (descriptor.get !== undefined) {
                    propertyInfo.targetValue = descriptor.get.call(propertyInfo.parentObservableGetCalledOn || receiver);
                    propertyInfo.isAccessor = true;
                } else {
                    propertyInfo.targetValue = descriptor.value;
                }
            } else {
                propertyInfo.targetValue = meta.target[key];
                propertyInfo.protoHasKey = propertyInfo.targetValue !== undefined ? true : key in target;
            }
            return propertyInfo;
        },
        shouldRecordObservationOnOwnAndMissingKeys: function (keyInfo, meta) {
            return meta.preventSideEffects === 0 && !keyInfo.isAccessor && (keyInfo.targetHasOwnKey || !keyInfo.protoHasKey && !Object.isSealed(meta.target));
        },
        setKey: function (receiver, key, value) {
            Object.defineProperty(receiver, key, {
                value: value,
                configurable: true,
                enumerable: true,
                writable: true
            });
            return true;
        },
        getValueToSet: function (key, value, meta) {
            if (!canReflect.isSymbolLike(key) && meta.handlers.getNode([key])) {
                return makeObject.getValueFromStore(key, value, meta);
            }
            return value;
        },
        getValueFromStore: function (key, value, meta) {
            if (!canReflect.isPrimitive(value) && !canReflect.isObservableLike(value) && !observableStore.proxies.has(value)) {
                if (observableStore.proxiedObjects.has(value)) {
                    value = observableStore.proxiedObjects.get(value);
                } else if (!helpers.isBuiltInButNotArrayOrPlainObject(value)) {
                    value = meta.options.observe(value);
                }
            }
            return value;
        },
        setValueAndOnChange: function (key, value, data, onChange) {
            var old, change;
            var hadOwn = hasOwn.call(data.target, key);
            var descriptor = Object.getOwnPropertyDescriptor(data.target, key);
            if (descriptor && descriptor.set) {
                descriptor.set.call(data.proxy, value);
            } else {
                old = data.target[key];
                change = old !== value;
                if (change) {
                    data.target[key] = value;
                    if (data.preventSideEffects === 0) {
                        onChange(key, value, data, hadOwn, old);
                    }
                }
            }
        }
    };
    module.exports = makeObject;
});