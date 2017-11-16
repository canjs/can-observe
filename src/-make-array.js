var canReflect = require("can-reflect");
var queues = require("can-queues");
var canSymbol = require("can-symbol");
var KeyTree = require("can-key-tree");
var ObservationRecorder = require("can-observation-recorder");
var makeObject = require("./-make-object");
var symbols = require("./-symbols");
var diffArray = require("can-util/js/diff-array/diff-array");
var observableStore = require("./-observable-store");
var helpers = require("./-helpers");

var dispatchInstanceOnPatchesSymbol = canSymbol.for("can.dispatchInstanceOnPatches");

function isIntegerIndex(prop) {
	return prop && // empty string typecasts to 0
		(+prop === +prop) && // NaN check for strings that don't represent numbers
		(+prop % 1 === 0);  // floats should be treated as strings
}
// Pre-populate array methods so they are used

var mutateMethods = {
    "push": function(arr, args) {
        return [{
            index: arr.length - args.length,
            deleteCount: 0,
            insert: args,
			type: "splice"
        }];
    },
    "pop": function(arr) {
        return [{
            index: arr.length,
            deleteCount: 1,
            insert: [],
			type: "splice"
        }];
    },
    "shift": function() {
        return [{
            index: 0,
            deleteCount: 1,
            insert: [],
			type: "splice"
        }];
    },
    "unshift": function(arr, args) {
        return [{
            index: 0,
            deleteCount: 0,
            insert: args,
			type: "splice"
        }];
    },
    "splice": function(arr, args) {
        return [{
            index: args[0],
            deleteCount: args[1],
            insert: args.slice(2),
			type: "splice"
        }];
    },
    "sort": function(arr, args, old) {
        return diffArray(old, arr);
    },
    "reverse": function(arr, args, old) {
        return diffArray(old, arr);
    }
};

(function(){
    // Each of these methods below creates the appropriate arguments for dispatch of
    // their respective event names.


    Object.keys(mutateMethods).forEach(function(prop) {
    	var protoFn = Array.prototype[prop];
        var observable = function() {
            var meta = this[symbols.metaSymbol];
			var preventSideEffects = meta.preventSideEffects;
    		meta.preventSideEffects++;
    		// stash the previous array contents. Use the native
    		// function instead of going through the proxy or target.
    		var old = [].slice.call(meta.target, 0);
    		// call the function -- note that *this* is the Proxy here, so
    		//  accesses in the function still go through get() and set()
    		var ret = protoFn.apply(this, arguments);
    		var patches = mutateMethods[prop](meta.target, Array.from(arguments), old);

			if(preventSideEffects === 0) {
				queues.batch.start();
	    		// dispatch all the associated change events and length

	            queues.enqueueByQueue(meta.handlers.getNode(["length"]), meta.proxy, [meta.target.length, old.length]);
	            queues.enqueueByQueue(meta.handlers.getNode([symbols.patchesSymbol]), meta.proxy, [patches.concat([{key: "length", type: "set", value: meta.target.length}])]);

	            var constructor = meta.proxy.constructor,
	                dispatchPatches = constructor[dispatchInstanceOnPatchesSymbol];
	            if(dispatchPatches) {
	                dispatchPatches.call(constructor, meta.proxy, patches);
	            }
	            queues.batch.stop();
			}

    		meta.preventSideEffects--;
    		return ret;
    	};
		//!steal-remove-start
		Object.defineProperty(observable, "name", {
			value: prop
		});
		//!steal-remove-end
    	observableStore.proxiedObjects.set(protoFn, observable);
        observableStore.proxies.add(observable);
    });
    // #### make special interceptors for all non-mutating Array functions
    Object.getOwnPropertyNames(Array.prototype).forEach(function(prop) {
    	if(mutateMethods[prop]) {
    		return;
    	}
    	var protoFn = Array.prototype[prop];
    	if(prop !== "constructor" && typeof protoFn === "function") {
            var observable = function() {
    			ObservationRecorder.add(this, symbols.patchesSymbol);
                var meta = this[symbols.metaSymbol];
    			meta.preventSideEffects++;
    			var ret = protoFn.apply(meta.target, arguments);
    			meta.preventSideEffects--;
    			return meta.options.observe(ret);
    		};
			//!steal-remove-start
			Object.defineProperty(observable, "name", {
				value: prop
			});
			//!steal-remove-end
			observableStore.proxiedObjects.set(protoFn, observable);
	        observableStore.proxies.add(observable);
    	}
    });
})();

function didLengthChangeCauseDeletions(key, value, old, meta) {
	return key === "length" && value < old;
}



var metaKeys = helpers.assignEverything(Object.create(null), makeObject.metaKeys());


var makeArray = {

    observable: function(object, options){
		var proxyKeys = Object.create( makeArray.metaKeys() );

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
            set: makeArray.set.bind(meta),
            ownKeys: makeObject.ownKeys.bind(meta),
            deleteProperty: makeObject.deleteProperty.bind(meta),
			meta: meta
        });
    },

    metaKeys: function(){
        return metaKeys;
    },
    // a proxied function needs to have .constructor point to the proxy, while the underlying property points to
    // what was there. Maybe
    set: function(target, key, value, receiver){
		// this is on the proto chain of something, set on that something
		if(receiver !== this.proxy) {
			console.warn("Possibly setting a value in the wrong spot");
			var proto = Object.getPrototypeOf(receiver);

			Object.setPrototypeOf(receiver, null);
			receiver[key] = value;
			Object.setPrototypeOf(receiver, proto);
			return;
		}
        value = makeObject.getValueToSet(key, value, this);
        // make a proxy for any non-observable objects being passed in as values
        makeObject.setValueAndOnChange(key, value, this, function(key, value, meta, hadOwn, old){
            var integerIndex = isIntegerIndex(key);
            queues.batch.start();

            var patches = [{key: key, type: hadOwn ? "set" : "add", value: value}];
            // Normal object event code
            queues.enqueueByQueue(meta.handlers.getNode([key]), meta.proxy,
                [value, old]);


            if(integerIndex) {
                // The set handler should not attempt to dispatch length patches stemming from array mutations because
                //  we cannot reliably detect a change to the length (it's already set to the new value on the target).
                //  Instead, the array method interceptor should handle it, since it has information about the previous
                //  state.
                // The one possible exception to this is when an array index is *added* that changes the length.
                if(!hadOwn && +key === meta.target.length - 1) {
                    patches.push({key: "length", type: "set", value: meta.target.length});
                } else {
                    // In the case of setting an array index, dispatch a splice patch.
                    patches.push.apply(patches, mutateMethods.splice(target, [+key, 1, value]));
                }
            }

            // In the case of deleting items by setting the length of the array, fire "remove" patches.
            // (deleting individual items from an array doesn't change the length; it just creates holes)
            if(didLengthChangeCauseDeletions(key, value, old, meta)) {
                while(old-- > value) {
                    patches.push({key: old, type: "delete"});
                }
            }
            queues.enqueueByQueue(meta.handlers.getNode([symbols.patchesSymbol]), meta.proxy,
                [patches]);

			// might need to be .proxy
            var constructor = meta.target.constructor,
                dispatchPatches = constructor[dispatchInstanceOnPatchesSymbol];
            if(dispatchPatches) {
                dispatchPatches.call(constructor, meta.proxy, patches);
            }

            queues.batch.stop();
        });


        return true;
    }
};


module.exports = makeArray;
