var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");
var makeObject = require("../src/-make-object");
var makeObserve = require("../src/-make-observe");
var eventMixin = require("can-event-queue/map/map");
var typeEventMixin = require("can-event-queue/type/type");
var queues = require("can-queues");
var helpers = require("../src/-helpers");

var definitionsSymbol = canSymbol.for("can.typeDefinitions");
var metaSymbol = canSymbol.for("can.meta");

function ensureTypeDefinition(obj) {
    var typeDefs = obj.prototype[definitionsSymbol];
    if (!typeDefs) {
        typeDefs = obj.prototype[definitionsSymbol] = Object.create(null);
    }
    return typeDefs;
}

var ObserveObject = function(props) {
    var prototype = Object.getPrototypeOf(this);
    var constructor = this.constructor;
    var instance = this;
    var definitions = prototype[definitionsSymbol] || {};
    for (var key in definitions) {
        Object.defineProperty(instance, key, definitions[key]);
    }
    if (props) {
        canReflect.assign(instance, props);
    }
    return makeObject.observable(instance, {
        observe: makeObserve.observe,
        proxyKeys: {
            constructor: constructor
        }
    });
};

typeEventMixin(ObserveObject);


canReflect.assignSymbols(ObserveObject, {
    "can.defineInstanceKey": function(prop, value) {
        ensureTypeDefinition(this)[prop] = value;
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

ObserveObject.extend = helpers.makeSimpleExtender(ObserveObject);

eventMixin(ObserveObject.prototype);

module.exports = ObserveObject;