var cid = require("can-cid");
var canBatch = require("can-event/batch/batch");
var Observation = require("can-observation");
var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");
var namespace = require("can-namespace");
var canEvent = require("can-event");

var observableSymbol = canSymbol.for("can.meta");
var hasOwn = Object.prototype.hasOwnProperty;

// #### isIntegerIndex
// takes a string prop and returns whether it can be coerced into an integer with unary +
// -- adapted from can-define/list/list
function isIntegerIndex(prop) {
	return prop && // empty string typecasts to 0
		(+prop === +prop) && // NaN check for strings that don't represent numbers
		(+prop % 1 === 0);  // floats should be treated as strings
}

// proxyOnly contains any prototype (i.e. shared) symbols and keys that should be available (gettable)
// from the proxy object, but not from the object under observation.  For example, the onKeyValue and
// offKeyValue symbols below, if applied to the target object, would erroneously present that object
// as observable, when only the Proxy is.
var proxyOnly = Object.create(null);
canReflect.assignSymbols(proxyOnly, {
	"can.onKeyValue": function(key, handler) {
		var handlers = this[observableSymbol].handlers;
		var keyHandlers = handlers[key];
		if (!keyHandlers) {
			keyHandlers = handlers[key] = [];
		}
		// Possible enhancement here: Binding directly on getters (currently does not work)
		//   need to add an observation instead of just firing handlers.
		keyHandlers.push(handler);
	},
	"can.offKeyValue": function(key, handler) {
		var handlers = this[observableSymbol].handlers;
		var keyHandlers = handlers[key];
		if(keyHandlers) {
			var index = keyHandlers.indexOf(handler);
			if(index >= 0) {
				keyHandlers.splice(index, 1);
			}
		}
	}
});
// proxyOnly includes the can-event suite, for the purpose of triggering
// array events (seee below)
Object.assign(proxyOnly, canEvent);

// arrayMethodInterceptors are a special group of functions that wrap the
// ES5 Array mutating methods.  When list-likes change, can-view-live expects certain
// events to fire, so these wrapper functions call the original then dispatch
// the expected events.
var arrayMethodInterceptors = Object.create(null);
// Each of these methods below creates the appropriate arguments for dispatch of
// their respective event names.
var mutateMethods = {
	"push": {
		add: function(arr, args, retVal) {
			return [args, arr.length - args.length];
		}
	},
	"pop": {
		remove: function(arr, args, retVal) {
			return [[retVal], arr.length];
		}
	},
	"shift": {
		remove: function(arr, args, retVal) {
			return [[retVal], 0];
		}
	},
	"unshift": {
		add: function(arr, args, retVal) {
			return [args, 0];
		}
	},
	"splice": {
		remove: function(arr, args, retVal) {
			return [retVal, args[0]];
		},
		add: function(arr, args, retVal) {
			return [args.slice(2), args[0]];
		}
	},
	"sort": {
		remove: function(arr, args, retVal, old) {
			return [old, 0];
		},
		add: function(arr, args, retVal) {
			return [arr, 0];
		}
	},
	"reverse": {
		remove: function(arr, args, retVal, old) {
			return [old, 0];
		},
		add: function(arr, args, retVal) {
			return [arr, 0];
		}
	}
};
var proxiableFunctions = ["map", "filter", "slice", "concat", "reduce", "reduceRight"];

// #### make arrayMethodInterceptors here
Object.keys(mutateMethods).forEach(function(prop) {
	var changeEvents = mutateMethods[prop];
	var protoFn = Array.prototype[prop];
	arrayMethodInterceptors[prop] = function() {
		var handlers = this[observableSymbol].handlers;
		// the value of "length" is commonly listened on
		// for array changes, so make sure it is fired.
		handlers.length = handlers.length || [];
		// stash the previous array contents. Use the native
		// function instead of going through the proxy or target.
		var old = [].slice.call(this, 0);
		var args = Array.from(arguments);
		// call the function -- note that *this* is the Proxy here, so 
		//  accesses in the function still go through get() and set()
		var ret = protoFn.apply(this, arguments);
		canBatch.start();
		// dispatch all the associated change events
		Object.keys(changeEvents).forEach(function(event) {
			var makeArgs = changeEvents[event];
			var handlerArgs = makeArgs(this, args, ret, old);
			canEvent.dispatch.call(this, event, handlerArgs);
		}.bind(this));
		// dispatch length
		handlers.length.forEach(function(handler){
			canBatch.queue([handler, this, [this.length, old.length]]);
		}, this);
		canBatch.stop();
		return ret;
	};
});
// #### proxyIntercept
// Generator for interceptors for any generic function that may return objects
function proxyIntercept(fn) {
	return function() {
		var ret = fn.apply(this, arguments);
		if(ret && typeof ret === "object") {
			ret = observe(ret);
		}
		return ret;
	};
}
proxiableFunctions.forEach(function(prop) {
	arrayMethodInterceptors[prop] = proxyIntercept(Array.prototype[prop]);
});

var observe = function(obj){ //jshint ignore:line
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
			// Is the key a symbol?  By default we don't observe symbol properties
			// (prevents unnecessary handler pollution)
			var symbolLike = canReflect.isSymbolLike(key);
			var descriptor = Object.getOwnPropertyDescriptor(target, key);
			var value;
			// If this is a getter, call the getter on the Proxy in order to observe
			// what other values it reads.
			if(descriptor && descriptor.get) {
				value = descriptor.get.call(receiver);
			} else {
				// __bindEvents for can-event is kept on the meta properties.
				if(key === "__bindEvents") {
					value = target[observableSymbol].__bindEvents;
				} else {
					value = target[key];				
				}
			}
			// If the value for this key is an object and not already observable, make a proxy for it
			if (!symbolLike &&
				key !== "__bindEvents" &&
				!canReflect.isObservableLike(value) &&
				(canReflect.isPlainObject(value) || Array.isArray(value))
			) {
				value = target[key] = observe(value);
			}
			// Intercept calls to Array mutation methods.
			if (typeof value === "function") {
				if(isArray && arrayMethodInterceptors[key]) {
					value = arrayMethodInterceptors[key];
				} else {
					value = obj[observableSymbol].interceptors[key] || (obj[observableSymbol].interceptors[key] = proxyIntercept(value));
				}
			}
			// add Observations for things that satisfy all of these conditions:
			//  - not _cid, not __bindEvents
			//  - non-function values
			//  - non-symbol keys
			//  - not an unknown property on a sealed object
			if (key !== "_cid" && key !== "__bindEvents" &&
				typeof value !== "function" &&
				!symbolLike && 
				(hasOwn.call(target, key) || !Object.isSealed(target))
			) {
				Observation.add(receiver, key.toString());
			}
			return value;
		},
		set: function(target, key, value, receiver){
			var old, change;
			var descriptor = Object.getOwnPropertyDescriptor(target, key);
			// make a proxy for any non-observable objects being passed in as values
			if (!canReflect.isSymbolLike(key) && !canReflect.isObservableLike(value) && (canReflect.isPlainObject(value) || Array.isArray(value))) {
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
			if(typeof old === "function") {
				target[observableSymbol].interceptors[key] = null;
			}
			if(change) {
				canBatch.start();
				(target[observableSymbol].handlers[key] || []).forEach(function(handler){
					canBatch.queue([handler, receiver, [value, old]]);
				});
				canBatch.stop();
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
			if(ret && (!Array.isArray(target) || !isIntegerIndex(key))) {
				canBatch.start();
				(target[observableSymbol].handlers[key] || []).forEach(function(handler, i){
					if(old !== undefined) {
						canBatch.queue([handler, receiver, [undefined, old]]);
					}
				});
				canBatch.stop();
			}
			target[observableSymbol].interceptors[key] = null;
			return ret;
		}
	});

	p[observableSymbol] = {handlers: {}, __bindEvents: {}, proxy: p, interceptors: {}};
	return p;
};

namespace.observe = observe;
module.exports = observe;
