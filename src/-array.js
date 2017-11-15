var ObservationRecorder = require("can-observation-recorder");
var queues = require("can-queues");
var diffArray = require("can-util/js/diff-array/diff-array");

var proxied = require("./-proxy-keys");
var symbols = require("./-symbols");

var dispatch = proxied.dispatch;



// Array based observable stuff


// Each of these methods below creates the appropriate arguments for dispatch of
// their respective event names.
var mutateMethods = {
	"push": function(arr, args) {
		return [{
			index: arr.length - args.length,
			deleteCount: 0,
			insert: args
		}];
  	},
	"pop": function(arr) {
		return [{
			index: arr.length,
			deleteCount: 1,
			insert: []
		}];
	},
	"shift": function() {
		return [{
			index: 0,
			deleteCount: 1,
			insert: []
		}];
	},
	"unshift": function(arr, args) {
		return [{
			index: 0,
			deleteCount: 0,
			insert: args
		}];
	},
	"splice": function(arr, args) {
		return [{
			index: args[0],
			deleteCount: args[1],
			insert: args.slice(2)
		}];
	},
	"sort": function(arr, args, old) {
		return diffArray(old, arr);
	},
 	"reverse": function(arr, args, old) {
 		return diffArray(old, arr);
	}
};


// #### shouldDispatchEvents
// Decide whether listeners should be dispatched for the current key.
// Dispatch when all of the following conditions are true:
//  - there has been a change (the value is different from the previous key value)
//  - any of the following are true:
//    - the parent object is not an Array
//    - the key is not "length"
//    - an array method (mutator or comprehension) is not currently executing
//       (during e.g. map/filter or push, the length will be dispatched by the method interceptor)
function shouldDispatchEvents(key, value, target) {
	return (key !== "length" || !target[symbols.metaSymbol].inArrayMethod);
}

// #### didLengthChangeCauseDeletions
// Decide whether a new length property on an object had side effects on other properties
// Deletions happened when all of the following conditions are true:
//  - the parent object is an Array
//  - the key being examined is "length"
//  - the new value of length is strictly less than the old one.
//  - an array method (mutator or comprehension) is not currently executing
//     (during e.g. pop or splice, property removal events will be dispatched by the method interceptor)
function didLengthChangeCauseDeletions(key, value, target, old) {
	return key === "length" && value < old && !target[symbols.metaSymbol].inArrayMethod;
}

// #### isIntegerIndex
// takes a string prop and returns whether it can be coerced into an integer with unary +
// -- adapted from can-define/list/list
function isIntegerIndex(prop) {
	return prop && // empty string typecasts to 0
		(+prop === +prop) && // NaN check for strings that don't represent numbers
		(+prop % 1 === 0);  // floats should be treated as strings
}

module.exports = function(options){
    // #### make special interceptors for all Array mutation functions
    Object.keys(mutateMethods).forEach(function(prop) {
    	var protoFn = Array.prototype[prop];
    	options.proxiedMethods.add(protoFn, function() {
    		this[symbols.metaSymbol].inArrayMethod = true;
    		// stash the previous array contents. Use the native
    		// function instead of going through the proxy or target.
    		var old = [].slice.call(this, 0);
    		// call the function -- note that *this* is the Proxy here, so
    		//  accesses in the function still go through get() and set()
    		var ret = protoFn.apply(this, arguments);
    		var patches = mutateMethods[prop](this, Array.from(arguments), old);

    		queues.batch.start();
    		// dispatch all the associated change events and length
    		dispatch.call(this, "length", [this.length, old.length]);

            dispatch.call(this, symbols.patchesSymbol, [patches.concat([{key: "length", type: "set", value: this.length}])]);
    		queues.batch.stop();
    		this[symbols.metaSymbol].inArrayMethod = false;
    		return ret;
    	});
    });
    // #### make special interceptors for all non-mutating Array functions
    Object.getOwnPropertyNames(Array.prototype).forEach(function(prop) {
    	if(mutateMethods[prop]) {
    		return;
    	}
    	var protoFn = Array.prototype[prop];
    	if(prop !== "constructor" && typeof protoFn === "function") {
    		options.proxiedMethods.add(protoFn, function() {
    			ObservationRecorder.add(this, symbols.patchesSymbol);
    			this[symbols.metaSymbol].inArrayMethod = true;
    			var ret = protoFn.apply(this, arguments);
    			this[symbols.metaSymbol].inArrayMethod = false;
    			if(ret && typeof ret === "object") {
    				ret = options.observe(ret);
    			}
    			return ret;
    		});
    	}
    });

    return {
        dispatchEvents: function(target, key, value, receiver, hadOwn, old) {

            if(shouldDispatchEvents(key, value, target)) {
                var integerIndex = isIntegerIndex(key);
                queues.batch.start();
				var patches = [];
                // enqueue events for a normal object
                options.object.enqueueEvents(target, key, value, receiver, hadOwn, old, patches);
				if(!target[symbols.metaSymbol].inArrayMethod) {
					options.object.addPatches(target, key, value, receiver, hadOwn, old, patches);
					if(integerIndex) {
						// The set handler should not attempt to dispatch length patches stemming from array mutations because
						//  we cannot reliably detect a change to the length (it's already set to the new value on the target).
						//  Instead, the array method interceptor should handle it, since it has information about the previous
						//  state.
						// The one possible exception to this is when an array index is *added* that changes the length.
						if(!hadOwn && +key === target.length - 1) {
							patches.push({key: "length", type: "set", value: target.length});
						} else {
							// In the case of setting an array index, dispatch a splice patch.
							patches.push.apply(patches, mutateMethods.splice(target, [+key, 1, value]));
						}
					}
				}
				// In the case of deleting items by setting the length of the array, fire "remove" patches.
				// (deleting individual items from an array doesn't change the length; it just creates holes)
				if(didLengthChangeCauseDeletions(key, value, target, old)) {
					while(old-- > value) {
						patches.push({key: old, type: "delete"});
					}
				}
				if(patches.length) {
					dispatch.call(receiver, symbols.patchesSymbol, [patches]);

					// var dispatchPatches = event.patches && this.constructor[dispatchInstanceOnPatchesSymbol];
				}
				queues.batch.stop();
			}
        }
    };
};
