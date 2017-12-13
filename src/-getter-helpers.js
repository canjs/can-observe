var canSymbol = require("can-symbol");
var definitionsSymbol = canSymbol.for("can.typeDefinitions");
var typeEventMixin = require("can-event-queue/type/type");
var canReflect = require("can-reflect");
var memoizeGetter = require("./-memoize-getter");
var queues = require("can-queues");
var eventMixin = require("can-event-queue/map/map");

var computedDefinitionsSymbol = canSymbol.for("can.computedDefinitions");
var metaSymbol = canSymbol.for("can.meta");

var getterHelpers = {
    ensureTypeDefinition: function(obj) {
        var typeDefs = obj.prototype[definitionsSymbol];
        if (!typeDefs) {
            typeDefs = obj.prototype[definitionsSymbol] = Object.create(null);
        }
        return typeDefs;
    },
    shouldRecordObservationOnAllKeysExceptFunctionsOnProto: function(keyInfo, meta){
        return meta.preventSideEffects === 0 && !keyInfo.isAccessor &&
    		(
    			// it's on us
    			(keyInfo.targetHasOwnKey ) ||
    			// it's "missing", and we are not sealed
    			(!keyInfo.protoHasKey && !Object.isSealed(meta.target)) ||
                // it's on our proto, but not a function
                (keyInfo.protoHasKey && (typeof targetValue !== "function"))
    		);
    },
    addMethodsAndSymbols: function(Type){
        typeEventMixin(Type);


        canReflect.assignSymbols(Type, {
            "can.defineInstanceKey": function(prop, value) {
                getterHelpers.ensureTypeDefinition(this)[prop] = value;
            },
            "can.dispatchInstanceBoundChange": function(obj, isBound) {
                var meta = this[metaSymbol];
                if (meta) {
                    var lifecycleHandlers = meta.lifecycleHandlers;
                    if (lifecycleHandlers) {
                        queues.enqueueByQueue(lifecycleHandlers.getNode([]), this, [obj, isBound]);
                    }
                }
            }
        });

        Type.prototype.addEventListener = function(key, handler, queue){
            var getObservation = this[computedDefinitionsSymbol][key];
            if(getObservation !== undefined) {
                memoizeGetter.bind( getObservation(this) );
            }
            return eventMixin.addEventListener.call(this, key, handler, queue);
        };
        Type.prototype.removeEventListener = function(key, handler, queue){
            var getObservation = this[computedDefinitionsSymbol][key];
            if(getObservation !== undefined) {
                memoizeGetter.unbind( getObservation(this) );
            }
            return eventMixin.removeEventListener.call(this, key, handler, queue);
        };
    },
    setupComputedProperties: function(prototype){
        var computed = {};
        Object.getOwnPropertyNames(prototype).forEach(function(prop){
            var descriptor = Object.getOwnPropertyDescriptor(prototype,prop);

            if(descriptor.get !== undefined) {
                var getObservationData = memoizeGetter.memoize(prototype,prop,descriptor);
                // stick the `data.observationFor` method so
                // proxyKeys's `onKeyValue` can get the observation, bind to it, and forward the
                // event
                // we will somehow need to know if this is "forwarded or not"
                computed[prop] = getObservationData;
            }

        });
        return computed;
    },
    addMemoizedGetterBindings: function(proxyKeys){
        return canReflect.assignSymbols(proxyKeys, {
            "can.onKeyValue": function(key, handler, queue) {
                var getObservation = this[computedDefinitionsSymbol][key];
                if(getObservation !== undefined) {
                    memoizeGetter.bind( getObservation(this) );
                }
                var handlers = this[metaSymbol].handlers;
                handlers.add([key, "onKeyValue", queue || "notify", handler]);
            },
            "can.offKeyValue": function(key, handler, queue) {
                var getObservation = this[computedDefinitionsSymbol][key];
                if(getObservation !== undefined) {
                    memoizeGetter.unbind( getObservation(this) );
                }
                var handlers = this[metaSymbol].handlers;
                handlers.delete([key, "onKeyValue", queue || "notify", handler]);
            }
        });
    }
};

module.exports = getterHelpers;
