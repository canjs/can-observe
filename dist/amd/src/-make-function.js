/*can-observe@2.0.0-pre.7#src/-make-function*/
define([
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-queues',
    'can-key-tree',
    './-make-object',
    './-symbols',
    './-observable-store',
    './-helpers'
], function (require, exports, module) {
    var canReflect = require('can-reflect');
    var queues = require('can-queues');
    var KeyTree = require('can-key-tree');
    var makeObject = require('./-make-object');
    var symbols = require('./-symbols');
    var observableStore = require('./-observable-store');
    var helpers = require('./-helpers');
    var metaKeys = helpers.assignEverything(Object.create(null), makeObject.metaKeys());
    canReflect.assignSymbols(metaKeys, {
        'can.onInstanceBoundChange': function (handler, queueName) {
            this[symbols.metaSymbol].lifecycleHandlers.add([
                queueName || 'mutate',
                handler
            ]);
        },
        'can.offInstanceBoundChange': function (handler, queueName) {
            this[symbols.metaSymbol].lifecycleHandlers.delete([
                queueName || 'mutate',
                handler
            ]);
        },
        'can.dispatchInstanceBoundChange': function (obj, isBound) {
            queues.enqueueByQueue(this[symbols.metaSymbol].lifecycleHandlers.getNode([]), this, [
                obj,
                isBound
            ]);
        },
        'can.onInstancePatches': function (handler, queueName) {
            this[symbols.metaSymbol].instancePatchesHandlers.add([
                queueName || 'mutate',
                handler
            ]);
        },
        'can.offInstancePatches': function (handler, queueName) {
            this[symbols.metaSymbol].instancePatchesHandlers.delete([
                queueName || 'mutate',
                handler
            ]);
        },
        'can.dispatchInstanceOnPatches': function (obj, patches) {
            queues.enqueueByQueue(this[symbols.metaSymbol].instancePatchesHandlers.getNode([]), this, [
                obj,
                patches
            ]);
        },
        'can.defineInstanceKey': function (prop, value) {
            this[symbols.metaSymbol].definitions[prop] = value;
        }
    });
    var makeFunction = {
        observable: function (object, options) {
            var proxyKeys = Object.create(makeFunction.metaKeys());
            var meta = {
                lifecycleHandlers: new KeyTree([
                    Object,
                    Array
                ]),
                instancePatchesHandlers: new KeyTree([
                    Object,
                    Array
                ]),
                target: object,
                proxyKeys: proxyKeys,
                options: options,
                definitions: {},
                isClass: helpers.isClass(object),
                preventSideEffects: 0
            };
            meta.handlers = makeObject.handlers(meta);
            proxyKeys[symbols.metaSymbol] = meta;
            meta.proxy = new Proxy(object, {
                get: makeObject.get.bind(meta),
                set: makeObject.set.bind(meta),
                ownKeys: makeObject.ownKeys.bind(meta),
                deleteProperty: makeObject.deleteProperty.bind(meta),
                construct: makeFunction.construct.bind(meta),
                apply: makeFunction.apply.bind(meta),
                meta: meta
            });
            observableStore.proxiedObjects.set(object, meta.proxy);
            observableStore.proxies.add(meta.proxy);
            if (meta.target.prototype && meta.target.prototype.constructor === meta.target) {
                var prototype = meta.proxy.prototype;
                prototype.constructor = meta.proxy;
            }
            return meta.proxy;
        },
        metaKeys: function () {
            return metaKeys;
        },
        construct: function (target, argumentsList, newTarget) {
            var instanceTarget, key;
            if (this.isClass) {
                instanceTarget = Reflect.construct(target, argumentsList, newTarget);
                for (key in this.definitions) {
                    Object.defineProperty(instanceTarget, key, this.definitions[key]);
                }
                return this.options.observe(instanceTarget);
            } else {
                instanceTarget = Object.create(this.proxy.prototype);
                for (key in this.definitions) {
                    Object.defineProperty(instanceTarget, key, this.definitions[key]);
                }
                var instance = this.options.observe(instanceTarget);
                instance[symbols.metaSymbol].preventSideEffects++;
                var res = target.apply(instance, argumentsList);
                instance[symbols.metaSymbol].preventSideEffects--;
                if (res) {
                    return res;
                } else {
                    return instance;
                }
            }
        },
        apply: function (target, thisArg, argumentsList) {
            var ret = this.target.apply(thisArg, argumentsList);
            return this.options.observe(ret);
        }
    };
    module.exports = makeFunction;
});