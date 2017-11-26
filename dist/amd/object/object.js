/*can-observe@2.0.0-pre.11#object/object*/
define([
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-symbol',
    '../src/-make-observe',
    'can-event-queue/map',
    'can-event-queue/type',
    'can-queues',
    '../src/-helpers',
    '../src/-make-object',
    '../src/-memoize-getter',
    '../src/-observable-store'
], function (require, exports, module) {
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var makeObserve = require('../src/-make-observe');
    var eventMixin = require('can-event-queue/map');
    var typeEventMixin = require('can-event-queue/type');
    var queues = require('can-queues');
    var helpers = require('../src/-helpers');
    var makeObject = require('../src/-make-object');
    var memoizeGetter = require('../src/-memoize-getter');
    var observableStore = require('../src/-observable-store');
    var definitionsSymbol = canSymbol.for('can.typeDefinitions');
    var metaSymbol = canSymbol.for('can.meta');
    function ensureTypeDefinition(obj) {
        var typeDefs = obj.prototype[definitionsSymbol];
        if (!typeDefs) {
            typeDefs = obj.prototype[definitionsSymbol] = Object.create(null);
        }
        return typeDefs;
    }
    function shouldRecordObservationOnAllKeysExceptFunctionsOnProto(keyInfo, meta) {
        return meta.preventSideEffects === 0 && !keyInfo.isAccessor && (keyInfo.targetHasOwnKey || !keyInfo.protoHasKey && !Object.isSealed(meta.target) || keyInfo.protoHasKey && typeof targetValue !== 'function');
    }
    var computedDefinitionsSymbol = canSymbol.for('can.computedDefinitions');
    function setupComputedProperties(prototype) {
        var computed = {};
        Object.getOwnPropertyNames(prototype).forEach(function (prop) {
            var descriptor = Object.getOwnPropertyDescriptor(prototype, prop);
            if (descriptor.get !== undefined) {
                var getObservationData = memoizeGetter.memoize(prototype, prop, descriptor);
                computed[prop] = getObservationData;
            }
        });
        return computed;
    }
    var proxyKeys = helpers.assignEverything({}, makeObject.proxyKeys());
    canReflect.assignSymbols(proxyKeys, {
        'can.onKeyValue': function (key, handler, queue) {
            var getObservation = this[computedDefinitionsSymbol][key];
            if (getObservation !== undefined) {
                memoizeGetter.bind(getObservation(this));
            }
            var handlers = this[metaSymbol].handlers;
            handlers.add([
                key,
                queue || 'notify',
                handler
            ]);
        },
        'can.offKeyValue': function (key, handler, queue) {
            var getObservation = this[computedDefinitionsSymbol][key];
            if (getObservation !== undefined) {
                memoizeGetter.unbind(getObservation(this));
            }
            var handlers = this[metaSymbol].handlers;
            handlers.delete([
                key,
                queue || 'notify',
                handler
            ]);
        }
    });
    var ObserveObject = function (props) {
        var prototype = Object.getPrototypeOf(this);
        if (prototype[computedDefinitionsSymbol] === undefined) {
            prototype[computedDefinitionsSymbol] = setupComputedProperties(prototype);
        }
        var constructor = this.constructor;
        var instance = this;
        var definitions = prototype[definitionsSymbol] || {};
        for (var key in definitions) {
            Object.defineProperty(instance, key, definitions[key]);
        }
        if (props) {
            canReflect.assign(instance, props);
        }
        var localProxyKeys = Object.create(proxyKeys);
        localProxyKeys.constructor = constructor;
        var observable = makeObject.observable(instance, {
            observe: makeObserve.observe,
            proxyKeys: localProxyKeys,
            shouldRecordObservation: shouldRecordObservationOnAllKeysExceptFunctionsOnProto
        });
        observableStore.proxiedObjects.set(instance, observable);
        observableStore.proxies.add(observable);
        return observable;
    };
    typeEventMixin(ObserveObject);
    canReflect.assignSymbols(ObserveObject, {
        'can.defineInstanceKey': function (prop, value) {
            ensureTypeDefinition(this)[prop] = value;
        },
        'can.dispatchInstanceBoundChange': function (obj, isBound) {
            var meta = this[metaSymbol];
            if (meta) {
                var lifecycleHandlers = meta.lifecycleHandlers;
                if (lifecycleHandlers) {
                    queues.enqueueByQueue(lifecycleHandlers.getNode([]), this, [
                        obj,
                        isBound
                    ]);
                }
            }
        }
    });
    ObserveObject.extend = helpers.makeSimpleExtender(ObserveObject);
    eventMixin(ObserveObject.prototype);
    module.exports = ObserveObject;
});