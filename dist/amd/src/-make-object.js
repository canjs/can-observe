/*can-observe@2.0.0-pre.18#src/-make-object*/
define([
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-observation-recorder',
    'can-event-queue/map',
    './-symbols',
    './-observable-store',
    './-helpers'
], function (require, exports, module) {
    var canReflect = require('can-reflect');
    var ObservationRecorder = require('can-observation-recorder');
    var mapBindings = require('can-event-queue/map');
    var symbols = require('./-symbols');
    var observableStore = require('./-observable-store');
    var helpers = require('./-helpers');
    var hasOwn = Object.prototype.hasOwnProperty;
    var isSymbolLike = canReflect.isSymbolLike;
    var proxyKeys = Object.create(null);
    Object.getOwnPropertySymbols(mapBindings).forEach(function (symbol) {
        proxyKeys[symbol] = mapBindings[symbol];
    });
    var makeObject = {
        observable: function (object, options) {
            if (options.shouldRecordObservation === undefined) {
                options.shouldRecordObservation = makeObject.shouldRecordObservationOnOwnAndMissingKeys;
            }
            var meta = {
                target: object,
                proxyKeys: options.proxyKeys !== undefined ? options.proxyKeys : Object.create(makeObject.proxyKeys()),
                options: options,
                preventSideEffects: 0
            };
            meta.proxyKeys[symbols.metaSymbol] = meta;
            meta.proxy = new Proxy(object, {
                get: makeObject.get.bind(meta),
                set: makeObject.set.bind(meta),
                ownKeys: makeObject.ownKeys.bind(meta),
                deleteProperty: makeObject.deleteProperty.bind(meta),
                meta: meta
            });
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
            if (receiver !== this.proxy) {
                return makeObject.setKey(receiver, key, value, this);
            }
            value = makeObject.getValueToSet(key, value, this);
            makeObject.setValueAndOnChange(key, value, this, function (key, value, meta, hadOwn, old) {
                mapBindings.dispatch.call(meta.proxy, {
                    type: key,
                    patches: [{
                            key: key,
                            type: hadOwn ? 'set' : 'add',
                            value: value
                        }],
                    keyChanged: !hadOwn ? key : undefined
                }, [
                    value,
                    old
                ]);
            });
            return true;
        },
        deleteProperty: function (target, key) {
            var old = this.target[key], deleteSuccessful = delete this.target[key];
            if (deleteSuccessful && this.preventSideEffects === 0 && old !== undefined) {
                mapBindings.dispatch.call(this.proxy, {
                    type: key,
                    patches: [{
                            key: key,
                            type: 'delete'
                        }],
                    keyChanged: key
                }, [
                    undefined,
                    old
                ]);
            }
            return deleteSuccessful;
        },
        ownKeys: function (target, key) {
            ObservationRecorder.add(this.proxy, symbols.keysSymbol);
            return Object.getOwnPropertyNames(this.target).concat(Object.getOwnPropertySymbols(this.target)).concat(Object.getOwnPropertySymbols(this.proxyKeys));
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