var cid = require("can-cid");
var queues = require("can-queues");
var ObservationRecorder = require("can-observation-recorder");
var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");
var namespace = require("can-namespace");
var diffArray = require("can-util/js/diff-array/diff-array");
var KeyTree = require("can-key-tree");

var observableSymbol = canSymbol.for("can.meta");
var patchesSymbol = canSymbol("patches");
var hasOwn = Object.prototype.hasOwnProperty;

// #### isIntegerIndex
// takes a string prop and returns whether it can be coerced into an integer with unary +
// -- adapted from can-define/list/list
function isIntegerIndex(prop) {
	return prop && // empty string typecasts to 0
		(+prop === +prop) && // NaN check for strings that don't represent numbers
		(+prop % 1 === 0);  // floats should be treated as strings
}

// #### shouldAddObservation
// Decide whether a key/value/object group should add an Observation
// Observations are added for things that satisfy all of these conditions:
//  - not _cid
//  - non-function values
//  - non-symbol keys
//  - not an unknown property on a sealed object
//  - not integer index on array if in an array mutator or comprehension
//  	(treat all sets on an array as a splice and use array patches instead)
function shouldAddObservation(key, value, target) {
	return key !== "_cid" &&
		typeof value !== "function" &&
		!canReflect.isSymbolLike(key) &&
		(hasOwn.call(target, key) || !Object.isSealed(target)) && 
		!target[observableSymbol].inArrayMethod;
}

// #### shouldObserveValue
// Decide whether a value being read or written should be converted to its
// Proxied equivalent.
// Proxy when all of the following conditions are true:
//  - value is an object (it exists, so is not null, and has type "object")
//  - key is not a symbol (symbolic properties are assumed not to be desired as observables)
//  - for the read case, there is at least one listener for the property on the parent object
//  	(represented by the onlyIfHandlers flag)
//  - for the write case, the previous stipulation does not apply.
function shouldObserveValue(key, value, target, onlyIfHandlers) {
	return value && typeof value === "object" &&
		!canReflect.isSymbolLike(key) &&
		(!onlyIfHandlers || target[observableSymbol].handlers.getNode([key]));
}

// #### shouldDispatchEvents
// Decide whether listeners should be dispatched for the current key.
// Dispatch when all of the following conditions are true:
//  - there has been a change (the value is different from the previous key value)
//  - any of the following are true:
//    - the parent object is not an Array
//    - the key is not "length"
//    - an array method (mutator or comprehension) is not currently executing
//       (during e.g. map/filter or push, the length will be dispatched by the method interceptor)
function shouldDispatchEvents(key, value, target, change, isArray) {
	return change && (key !== "length" || !isArray || !target[observableSymbol].inArrayMethod);
}

// #### didLengthChangeCauseDeletions
// Decide whether a new length property on an object had side effects on other properties
// Deletions happened when all of the following conditions are true:
//  - the parent object is an Array
//  - the key being examined is "length"
//  - the new value of length is strictly less than the old one.
//  - an array method (mutator or comprehension) is not currently executing
//     (during e.g. pop or splice, property removal events will be dispatched by the method interceptor)
function didLengthChangeCauseDeletions(key, value, target, old, isArray) {
	return isArray && key === "length" && value < old && !target[observableSymbol].inArrayMethod;
}

// proxyOnly contains any prototype (i.e. shared) symbols and keys that should be available (gettable)
// from the proxy object, but not from the object under observation.  For example, the onKeyValue and
// offKeyValue symbols below, if applied to the target object, would erroneously present that object
// as observable, when only the Proxy is.
var proxyOnly = Object.create(null);
canReflect.assignSymbols(proxyOnly, {
	"can.onKeyValue": function(key, handler, queue) {
		var handlers = this[observableSymbol].handlers;
		handlers.add([key, queue || "notify", handler]);
	},
	"can.offKeyValue": function(key, handler, queue) {
		var handlers = this[observableSymbol].handlers;
		handlers.delete([key, queue || "notify", handler]);
	},
	"can.onPatches": function(handler, queue) {
		var handlers = this[observableSymbol].handlers;
		handlers.add([patchesSymbol, queue || "notify", handler]);
	},
	"can.offPatches": function(handler, queue) {
		var handlers = this[observableSymbol].handlers;
		handlers.delete([patchesSymbol, queue || "notify", handler]);
	}
});
var dispatch = proxyOnly.dispatch = function(key, args) {
	var handlers = this[observableSymbol].handlers;
	var keyHandlers = handlers.getNode([key]);
	if(keyHandlers) {
		queues.enqueueByQueue(keyHandlers, this, args);
	}
};


// arrayMethodInterceptors are a special group of functions that wrap the
// ES5 Array mutating methods.  When list-likes change, "patch" type handlers
// are called to show the new changes (found from diffing).
var arrayMethodInterceptors = Object.create(null);
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

// #### make arrayMethodInterceptors here
Object.keys(mutateMethods).forEach(function(prop) {
	var protoFn = Array.prototype[prop];
	arrayMethodInterceptors[prop] = function() {
		this[observableSymbol].inArrayMethod = true;
		// stash the previous array contents. Use the native
		// function instead of going through the proxy or target.
		var old = [].slice.call(this, 0);
		// call the function
		var ret = protoFn.apply(this, arguments);
		var patches = mutateMethods[prop](this, Array.from(arguments), old);

		queues.batch.start();
		// dispatch all the associated change events and length
		dispatch.call(this, "length", [this.length, old.length]);
		dispatch.call(this, patchesSymbol, [patches.concat([{property: "length", type: "set", value: this.length}])]);
		queues.batch.stop();
		this[observableSymbol].inArrayMethod = false;
		return ret;
	};
});
Object.getOwnPropertyNames(Array.prototype).forEach(function(prop) {
	if(mutateMethods[prop]) {
		return;
	}
	var protoFn = Array.prototype[prop];
	if(prop !== "constructor" && typeof protoFn === "function") {
		arrayMethodInterceptors[prop] = function() {
			ObservationRecorder.add(this, patchesSymbol);
			this[observableSymbol].inArrayMethod = true;
			var ret = protoFn.apply(this, arguments);
			this[observableSymbol].inArrayMethod = false;
			return ret;
		};
	}
});

var observe = function(obj){
	// oberve proxies are meant to be singletons per-object.
	// Or to put it another way, it would be very difficult to manage
	// multiple observation proxies for one object.  So calling observe()
	// on a particular object will always return the same proxy.
	if (obj[observableSymbol]) {
		return obj[observableSymbol].proxy;
	} else {
		Object.defineProperty(obj, "_cid", {
			value: cid({}),
			enumerable: false
		});
	}
	// Handle certain things about Arrays and subclasses of Arrays specially.
	var isArray = obj instanceof Array;

	var p = new Proxy(obj, {
		get: function(target, key, receiver){
			// The proxy only objects don't need any further processing.
			if(proxyOnly[key]) {
				return proxyOnly[key];
			}
			var descriptor = Object.getOwnPropertyDescriptor(target, key);
			var value;
			// If this is a getter, call the getter on the Proxy in order to observe
			// what other values it reads.
			if(descriptor && descriptor.get) {
				value = descriptor.get.call(receiver);
			} else {
				value = target[key];
			}
			// If the value for this key is an object and not already observable, make a proxy for it
			if (shouldObserveValue(key, value, target, true)) {
				value = target[key] = observe(value);
			}
			// Intercept calls to Array mutation methods.
			if (isArray && typeof value === "function" && arrayMethodInterceptors[key]) {
				value = arrayMethodInterceptors[key];
			}
			if (shouldAddObservation(key, value, target)) {
				ObservationRecorder.add(receiver, key.toString());
			}
			return value;
		},
		set: function(target, key, value, receiver){
			var old, change;
			var hadOwn = hasOwn.call(target, key);
			var integerIndex = isIntegerIndex(key);
			var descriptor = Object.getOwnPropertyDescriptor(target, key);
			// make a proxy for any non-observable objects being passed in as values
			if (shouldObserveValue(key, value, target)) {
				value = observe(value);
			} else if (value && value[observableSymbol]){
				value = value[observableSymbol].proxy;
			}

			// call the setter on the Proxy to properly do any side-effect sets (and run corresponding handlers)
			// -- setters do not return values, so it is unnecessary to check for changes.
			if(descriptor && descriptor.set) {
				descriptor.set.call(receiver, value);
			} else {
				// otherwise check for a changed value
				old = target[key];
				change = old !== value;
				if (change) {
					target[key] = value;
				}
			}
			if(shouldDispatchEvents(key, value, target, change, isArray)) {
				queues.batch.start();
				var patches = [];
				dispatch.call(receiver, key, [value, old]);
				if(!target[observableSymbol].inArrayMethod) {
					patches.push({property: key, type: hadOwn ? "set" : "add", value: value});
					if(isArray && integerIndex) {
						// The set handler should not attempt to dispatch length patches stemming from array mutations because
						//  we cannot reliably detect a change to the length (it's already set to the new value on the target).  
						//  Instead, the array method interceptor should handle it, since it has information about the previous
						//  state.
						// The one possible exception to this is when an array index is *added* that changes the length.
						if(!hadOwn && +key === target.length - 1) {
							patches.push({property: "length", type: "set", value: target.length});
						} else {
							// In the case of setting an array index, dispatch a splice patch.
							patches.push.apply(patches, mutateMethods.splice(obj, [+key, 1, value]));
						}
					}
				}
				// In the case of deleting items by setting the length of the array, fire "remove" patches.
				// (deleting individual items from an array doesn't change the length; it just creates holes)
				if(didLengthChangeCauseDeletions(key, value, target, old, isArray)) {
					while(old-- > value) {
						patches.push({property: old, type: "remove"});
					}
				}
				if(patches.length) {
					dispatch.call(receiver, patchesSymbol, [patches]);
				}
				queues.batch.stop();
			}
			return true;
		},
		ownKeys: function(target) {
			// Proxies should return the keys and symbols from proxyOnly
			// as well as from the target, so operators like `in` and 
			// functions like `hasOwnProperty` can be used to determine
			// that the Proxy is observable.
			return Object.getOwnPropertyNames(target)
				.concat(Object.getOwnPropertySymbols(target))
				.concat(Object.getOwnPropertySymbols(proxyOnly));
		},
		deleteProperty: function(target, key) {
			var old = target[key];
			var ret = delete target[key];
			var receiver = target[observableSymbol].proxy;
			// Don't trigger handlers on array indexes, as they will change with length.
			//  Otherwise trigger that the property is now undefined.
			// If the property is redefined, the handlers will fire again.
			if(ret && !target[observableSymbol].inArrayMethod && old !== undefined) {
				queues.batch.start();
				dispatch.call(receiver, key, [undefined, old]);
				dispatch.call(receiver, patchesSymbol, [[{property: key, type: "remove"}]]);
				queues.batch.stop();
			}
			return ret;
		}
	});

	obj[observableSymbol] = {handlers: new KeyTree([Object, Object, Array]), proxy: p};
	return p;
};

namespace.observe = observe;
module.exports = observe;
