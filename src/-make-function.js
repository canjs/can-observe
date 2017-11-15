var canReflect = require("can-reflect");
var queues = require("can-queues");
var canSymbol = require("can-symbol");
var KeyTree = require("can-key-tree");
var ObservationRecorder = require("can-observation-recorder");
var makeObject = require("./-make-object");
var symbols = require("./-symbols");
var diffArray = require("can-util/js/diff-array/diff-array");
var observableStore = require("./-observable-store");

var dispatchInstanceOnPatchesSymbol = canSymbol.for("can.dispatchInstanceOnPatches");


var metaKeys = assignEverything(Object.create(null), makeObject.metaKeys());

canReflect.assignSymbols(metaKeys,{
    "can.onInstanceBoundChange": function(handler, queueName) {
		ensureMeta(this).lifecycleHandlers.add([queueName || "mutate", handler]);
	},
	"can.offInstanceBoundChange": function(handler, queueName) {
		ensureMeta(this).lifecycleHandlers.delete([queueName || "mutate", handler]);
	},
    "can.dispatchInstanceBoundChange": function(obj, isBound){
        queues.enqueueByQueue(ensureMeta(this).lifecycleHandlers.getNode([]), this, [obj, isBound]);
    },
    "can.onInstancePatches": function(handler, queueName) {
		ensureMeta(this).instancePatchesHandlers.add([queueName || "mutate", handler]);
	},
	"can.offInstancePatches": function(handler, queueName) {
		ensureMeta(this).instancePatchesHandlers.delete([queueName || "mutate", handler]);
	},
    "can.dispatchInstanceOnPatches": function(obj, patches){
        queues.enqueueByQueue(ensureMeta(this).instancePatchesHandlers.getNode([]), this, [obj, patches]);
    }
});



var makeFunction = {

    observable: function(object, options){

		var receiverKeys = Object.create( makeFunction.metaKeys() );

        var meta = {
            lifecycleHandlers: new KeyTree([Object, Array]),
            instancePatchesHandlers: new KeyTree([Object, Array]),
            target: object,
            receiverKeys: receiverKeys,
            options: options
        };
        meta.handlers = makeObject.handlers(meta);
		receiverKeys[symbols.metaSymbol] = meta;
        return meta.receiver = new Proxy(object, {
            get: makeObject.get.bind(meta),
            set: makeObject.set.bind(meta),
            ownKeys: makeObject.ownKeys.bind(meta),
            deleteProperty: makeObject.deleteProperty.bind(meta),
        });
    },

    metaKeys: function(){
        return metaKeys;
    },
    construct: function(target, argumentsList, newTarget) {
        // start by using the default `construct()` to get an instance
        //var instance = constructInstance(target, argumentsList, newTarget);
        // return the proxy instead of the instance
        var instanceTarget = Object.create(target.prototype);
        var instance = this.options.observe(instanceTarget);
        var res = target.apply(instance, argumentsList);
        if(res) {
            return res;
        } else {
            return instance;
        }
    }
};


module.exports = makeObject;
