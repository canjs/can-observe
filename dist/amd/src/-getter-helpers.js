/*can-observe@2.0.1#src/-getter-helpers*/
define([
    'require',
    'exports',
    'module',
    'can-symbol',
    'can-event-queue/type',
    'can-reflect',
    './-memoize-getter',
    'can-queues',
    'can-event-queue/map'
], function (require, exports, module) {
    var canSymbol = require('can-symbol');
    var definitionsSymbol = canSymbol.for('can.typeDefinitions');
    var typeEventMixin = require('can-event-queue/type');
    var canReflect = require('can-reflect');
    var memoizeGetter = require('./-memoize-getter');
    var queues = require('can-queues');
    var eventMixin = require('can-event-queue/map');
    var computedDefinitionsSymbol = canSymbol.for('can.computedDefinitions');
    var metaSymbol = canSymbol.for('can.meta');
    var getterHelpers = {
        ensureTypeDefinition: function (obj) {
            var typeDefs = obj.prototype[definitionsSymbol];
            if (!typeDefs) {
                typeDefs = obj.prototype[definitionsSymbol] = Object.create(null);
            }
            return typeDefs;
        },
        shouldRecordObservationOnAllKeysExceptFunctionsOnProto: function (keyInfo, meta) {
            return meta.preventSideEffects === 0 && !keyInfo.isAccessor && (keyInfo.targetHasOwnKey || !keyInfo.protoHasKey && !Object.isSealed(meta.target) || keyInfo.protoHasKey && typeof targetValue !== 'function');
        },
        addMethodsAndSymbols: function (Type) {
            typeEventMixin(Type);
            canReflect.assignSymbols(Type, {
                'can.defineInstanceKey': function (prop, value) {
                    getterHelpers.ensureTypeDefinition(this)[prop] = value;
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
            Type.prototype.addEventListener = function (key, handler, queue) {
                var getObservation = this[computedDefinitionsSymbol][key];
                if (getObservation !== undefined) {
                    getObservation(this).bind();
                }
                return eventMixin.addEventListener.call(this, key, handler, queue);
            };
            Type.prototype.removeEventListener = function (key, handler, queue) {
                var getObservation = this[computedDefinitionsSymbol][key];
                if (getObservation !== undefined) {
                    getObservation(this).unbind();
                }
                return eventMixin.removeEventListener.call(this, key, handler, queue);
            };
        },
        setupComputedProperties: function (prototype) {
            var computed = {};
            Object.getOwnPropertyNames(prototype).forEach(function (prop) {
                var descriptor = Object.getOwnPropertyDescriptor(prototype, prop);
                if (descriptor.get !== undefined) {
                    var getObservationData = memoizeGetter(prototype, prop, descriptor);
                    computed[prop] = getObservationData;
                }
            });
            return computed;
        },
        addMemoizedGetterBindings: function (proxyKeys) {
            return canReflect.assignSymbols(proxyKeys, {
                'can.onKeyValue': function (key, handler, queue) {
                    var getObservation = this[computedDefinitionsSymbol][key];
                    if (getObservation !== undefined) {
                        getObservation(this).bind();
                    }
                    var handlers = this[metaSymbol].handlers;
                    handlers.add([
                        key,
                        'onKeyValue',
                        queue || 'notify',
                        handler
                    ]);
                },
                'can.offKeyValue': function (key, handler, queue) {
                    var getObservation = this[computedDefinitionsSymbol][key];
                    if (getObservation !== undefined) {
                        getObservation(this).unbind();
                    }
                    var handlers = this[metaSymbol].handlers;
                    handlers.delete([
                        key,
                        'onKeyValue',
                        queue || 'notify',
                        handler
                    ]);
                }
            });
        }
    };
    module.exports = getterHelpers;
});