/*can-observe@2.1.0#src/-make-function*/
define([
    'require',
    'exports',
    'module',
    'can-reflect',
    './-make-object',
    './-symbols',
    './-observable-store',
    'can-event-queue/map',
    'can-event-queue/type',
    './-helpers'
], function (require, exports, module) {
    var canReflect = require('can-reflect');
    var makeObject = require('./-make-object');
    var symbols = require('./-symbols');
    var observableStore = require('./-observable-store');
    var mapBindings = require('can-event-queue/map');
    var typeBindings = require('can-event-queue/type');
    var helpers = require('./-helpers');
    var proxyKeys = helpers.assignEverything(Object.create(null), makeObject.proxyKeys());
    typeBindings(proxyKeys);
    canReflect.assignSymbols(proxyKeys, {
        'can.defineInstanceKey': function (prop, value) {
            this[symbols.metaSymbol].definitions[prop] = value;
        }
    });
    var makeFunction = {
        observable: function (object, options) {
            if (options.shouldRecordObservation === undefined) {
                options.shouldRecordObservation = makeObject.shouldRecordObservationOnOwnAndMissingKeys;
            }
            var proxyKeys = Object.create(makeFunction.proxyKeys());
            var meta = {
                target: object,
                proxyKeys: proxyKeys,
                computedKeys: Object.create(null),
                options: options,
                definitions: {},
                isClass: helpers.isClass(object),
                preventSideEffects: 0
            };
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
            mapBindings.addHandlers(meta.proxy, meta);
            typeBindings.addHandlers(meta.proxy, meta);
            observableStore.proxiedObjects.set(object, meta.proxy);
            observableStore.proxies.add(meta.proxy);
            if (meta.target.prototype && meta.target.prototype.constructor === meta.target) {
                var newPrototype = makeObject.observable(meta.target.prototype, {
                    getPrototypeOf: function () {
                        return meta.target.prototype;
                    }
                });
                observableStore.proxiedObjects.set(meta.target.prototype, newPrototype);
                observableStore.proxies.add(newPrototype);
                var prototype = meta.proxy.prototype;
                prototype.constructor = meta.proxy;
            }
            return meta.proxy;
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
        },
        proxyKeys: function () {
            return proxyKeys;
        }
    };
    module.exports = makeFunction;
});