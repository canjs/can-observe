// modifies a type
var queues = require("can-queues");
var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");
var KeyTree = require("can-key-tree");

var metaSymbol = canSymbol.for("can.meta");

function ensureMeta(obj) {
    var meta = obj[metaSymbol];

    if (!meta) {
        meta = {};
        canReflect.setKeyValue(obj, metaSymbol, meta);
    }

    if (!meta.lifecycleHandlers) {
        meta.lifecycleHandlers = new KeyTree([Object, Array]);
    }
    if (!meta.instancePatchesHandlers) {
        meta.instancePatchesHandlers = new KeyTree([Object, Array]);
    }
    return meta;
}

var functionProxiedKeys = Object.create(null);
canReflect.assignSymbols(functionProxiedKeys,{
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

/*var constructInstance = typeof Reflect !== "undefined" ?
    Reflect.construct.bind(Reflect) : function(target, argumentList){
        var inst = Object.create(target.prototype);
        target.apply(inst, argumentList);
        return inst;
    };*/


// TODO:
// We need to special case `.prototype`
// And the `.constructor` of `.prototype` needs to point back to us

module.exports = function(options){
    // TODO:
    return {
        proxyHandlers: {
            construct: function(target, argumentsList, newTarget) {
                // start by using the default `construct()` to get an instance
                //var instance = constructInstance(target, argumentsList, newTarget);
                // return the proxy instead of the instance
                var instanceTarget = Object.create(target.prototype);
                var instance = options.observe(instanceTarget);
                var res = target.apply(instance, argumentsList);
                if(res) {
                    return res;
                } else {
                    return instance;
                }
            }
        },
        keys: functionProxiedKeys,
        init: function(target, proxy) {
            // we need to special case to our prototype
            if(target.prototype) {
                var proxiedPrototype = options.observe(target.prototype, {
                    defaultGetTraps: {
                        constructor: proxy
                    }
                });
                console.log(proxiedPrototype.constructor);
                return {
                    prototype: proxiedPrototype
                };
            }
        }
    };

};

/*module.exports = function(observe) {



    return function(Constructor){
        // Proxy the class and override the `new` keyword instatiation
    	return new Proxy(Constructor, {

    		construct: function(target, argumentsList, newTarget) {
    			// start by using the default `construct()` to get an instance
    			var instance = constructInstance(target, argumentsList, newTarget);
    			// return the proxy instead of the instance
    			return observe(instance);
    		}

    	});
    };
};*/
