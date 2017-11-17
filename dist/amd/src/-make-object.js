/*can-observe@2.0.0-pre.1#src/-make-object*/
define([
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-queues',
    'can-symbol',
    'can-key-tree',
    'can-observation-recorder',
    './-symbols',
    './-observable-store',
    './-helpers'
], function (require, exports, module) {
    var canReflect = require('can-reflect');
    var queues = require('can-queues');
    var canSymbol = require('can-symbol');
    var KeyTree = require('can-key-tree');
    var ObservationRecorder = require('can-observation-recorder');
    var symbols = require('./-symbols');
    var dispatchInstanceOnPatchesSymbol = canSymbol.for('can.dispatchInstanceOnPatches');
    var dispatchBoundChangeSymbol = canSymbol.for('can.dispatchInstanceBoundChange');
    var hasOwn = Object.prototype.hasOwnProperty;
    var observableStore = require('./-observable-store');
    var helpers = require('./-helpers');
    var metaKeys = canReflect.assignSymbols(Object.create(null), {
        'can.onKeyValue': function (key, handler, queue) {
            var handlers = this[symbols.metaSymbol].handlers;
            handlers.add([
                key,
                queue || 'notify',
                handler
            ]);
        },
        'can.offKeyValue': function (key, handler, queue) {
            var handlers = this[symbols.metaSymbol].handlers;
            handlers.delete([
                key,
                queue || 'notify',
                handler
            ]);
        },
        'can.onPatches': function (handler, queue) {
            var handlers = this[symbols.metaSymbol].handlers;
            handlers.add([
                symbols.patchesSymbol,
                queue || 'notify',
                handler
            ]);
        },
        'can.offPatches': function (handler, queue) {
            var handlers = this[symbols.metaSymbol].handlers;
            handlers.delete([
                symbols.patchesSymbol,
                queue || 'notify',
                handler
            ]);
        }
    });
    var makeObject = {
        observable: function (object, options) {
            var proxyKeys = Object.create(makeObject.metaKeys());
            var meta = {
                target: object,
                proxyKeys: proxyKeys,
                options: options,
                preventSideEffects: 0
            };
            meta.handlers = makeObject.handlers(meta);
            proxyKeys[symbols.metaSymbol] = meta;
            return meta.proxy = new Proxy(object, {
                get: makeObject.get.bind(meta),
                set: makeObject.set.bind(meta),
                ownKeys: makeObject.ownKeys.bind(meta),
                deleteProperty: makeObject.deleteProperty.bind(meta),
                meta: meta
            });
        },
        handlers: function (meta) {
            return new KeyTree([
                Object,
                Object,
                Array
            ], {
                onFirst: function () {
                    if (meta.proxy.constructor[dispatchBoundChangeSymbol]) {
                        meta.proxy.constructor[dispatchBoundChangeSymbol](meta.proxy, true);
                    }
                },
                onEmpty: function () {
                    if (meta.proxy.constructor[dispatchBoundChangeSymbol]) {
                        meta.proxy.constructor[dispatchBoundChangeSymbol](meta.proxy, false);
                    }
                }
            });
        },
        metaKeys: function () {
            return metaKeys;
        },
        get: function (target, key, receiver) {
            if (this.proxyKeys[key] !== undefined) {
                return this.proxyKeys[key];
            }
            if (canReflect.isSymbolLike(key)) {
                return target[key];
            }
            var keyInfo = makeObject.getKeyInfo(target, key, receiver, this);
            var value = keyInfo.targetValue;
            if (!keyInfo.valueIsInvariant) {
                value = makeObject.getValueFromStore(key, value, this);
            }
            if (makeObject.shouldRecordObservationOnOwnAndMissingKeys(keyInfo, this)) {
                ObservationRecorder.add(this.proxy, key.toString());
            }
            if (keyInfo.parentObservableGetCalledOn) {
                ObservationRecorder.add(keyInfo.parentObservableGetCalledOn, key.toString());
            }
            return value;
        },
        set: function (target, key, value, receiver) {
            if (receiver !== this.proxy) {
                return makeObject.setPrototypeKey(key, value, receiver, this);
            }
            value = makeObject.getValueToSet(key, value, this);
            makeObject.setValueAndOnChange(key, value, this, function (key, value, meta, hadOwn, old) {
                queues.batch.start();
                queues.enqueueByQueue(meta.handlers.getNode([key]), meta.proxy, [
                    value,
                    old
                ]);
                var patches = [{
                        key: key,
                        type: hadOwn ? 'set' : 'add',
                        value: value
                    }];
                queues.enqueueByQueue(meta.handlers.getNode([symbols.patchesSymbol]), meta.proxy, [patches]);
                var constructor = meta.target.constructor, dispatchPatches = constructor[dispatchInstanceOnPatchesSymbol];
                if (dispatchPatches) {
                    dispatchPatches.call(constructor, meta.proxy, patches);
                }
                queues.batch.stop();
            });
            return true;
        },
        ownKeys: function (target, key) {
            return Object.getOwnPropertyNames(this.target).concat(Object.getOwnPropertySymbols(this.target)).concat(Object.getOwnPropertySymbols(this.proxyKeys));
        },
        getKeyInfo: function (target, key, receiver, meta) {
            var descriptor = Object.getOwnPropertyDescriptor(target, key);
            var propertyInfo = {
                key: key,
                descriptor: descriptor,
                targetHasOwnKey: Boolean(descriptor),
                protoHasKey: descriptor ? false : key in target,
                valueIsInvariant: descriptor ? descriptor.writable !== true : false,
                targetValue: undefined,
                getCalledOnParent: receiver !== meta.proxy
            };
            if (descriptor) {
                if (descriptor.get) {
                    propertyInfo.targetValue = descriptor.get.call(meta.proxy);
                } else {
                    propertyInfo.targetValue = descriptor.value;
                }
            } else {
                propertyInfo.targetValue = meta.target[key];
            }
            if (propertyInfo.getCalledOnParent) {
                propertyInfo.parentObservableGetCalledOn = observableStore.proxiedObjects.get(receiver);
            }
            return propertyInfo;
        },
        shouldRecordObservationOnOwnAndMissingKeys: function (keyInfo, meta) {
            return meta.preventSideEffects === 0 && (keyInfo.targetHasOwnKey || !keyInfo.protoHasKey && !Object.isSealed(meta.target));
        },
        deleteProperty: function (target, key) {
            var old = this.target[key];
            var ret = delete this.target[key];
            if (ret && this.preventSideEffects === 0 && old !== undefined) {
                queues.batch.start();
                queues.enqueueByQueue(this.handlers.getNode([key]), this.proxy, [
                    undefined,
                    old
                ]);
                var patches = [{
                        key: key,
                        type: 'delete'
                    }];
                queues.enqueueByQueue(this.handlers.getNode([symbols.patchesSymbol]), this.proxy, [patches]);
                var constructor = this.target.constructor, dispatchPatches = constructor[dispatchInstanceOnPatchesSymbol];
                if (dispatchPatches) {
                    dispatchPatches.call(constructor, this.proxy, patches);
                }
                queues.batch.stop();
            }
            return ret;
        },
        setPrototypeKey: function (key, value, receiver, meta) {
            Object.defineProperty(receiver, key, {
                value: value,
                configurable: true,
                enumerable: true,
                writable: true
            });
            return true;
        },
        getValueFromTarget: function (key, meta) {
            var descriptor = Object.getOwnPropertyDescriptor(meta.target, key);
            if (descriptor && descriptor.get) {
                return descriptor.get.call(meta.proxy);
            } else {
                return meta.target[key];
            }
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