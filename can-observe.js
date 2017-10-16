var cid = require("can-cid");
var queues = require("can-queues");
var ObservationRecorder = require("can-observation-recorder");
var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");
var namespace = require("can-namespace");
var diffArray = require("can-util/js/diff-array/diff-array");

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
		// TODO: Binding directly on getters (currently does not work)
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
	},
	"can.onPatches": function(handler) {
		var handlers = this[observableSymbol].handlers;
		var patchHandlers = handlers[patchesSymbol];
		if (!patchHandlers) {
			patchHandlers = handlers[patchesSymbol] = [];
		}
		patchHandlers.push(handler);
	},
	"can.offPatches": function(handler) {
		var handlers = this[observableSymbol].handlers;
		var patchHandlers = handlers[patchesSymbol];
		if(patchHandlers) {
			var index = patchHandlers.indexOf(handler);
			if(index >= 0) {
				patchHandlers.splice(index, 1);
			}
		}
	}
});
var dispatch = proxyOnly.dispatch = function(key, args) {
	var handlers = this[observableSymbol].handlers;
	var keyHandlers = handlers[key];
	if(keyHandlers) {
		keyHandlers.forEach(function(handler){
			queues.notifyQueue.enqueue(handler, this, args);
		}, this);
	}
};


// arrayMethodInterceptors are a special group of functions that wrap the
// ES5 Array mutating methods.  When list-likes change, "patch" type handlers
// are called to show the new changes (found from diffing).
var arrayMethodInterceptors = Object.create(null);
// Each of these methods below creates the appropriate arguments for dispatch of
// their respective event names.
var mutateMethods = [
	"push","pop","shift","unshift","splice","sort","reverse"
];

// #### make arrayMethodInterceptors here
mutateMethods.forEach(function(prop) {
	var protoFn = Array.prototype[prop];
	arrayMethodInterceptors[prop] = function() {
		// stash the previous array contents. Use the native
		// function instead of going through the proxy or target.
		var old = [].slice.call(this, 0);
		// call the function
		var ret = protoFn.apply(this, arguments);
		var patches = diffArray(old, this);

		queues.batch.start();
		// dispatch all the associated change events
		dispatch.call(this, patchesSymbol, [patches]);
		// dispatch length
		dispatch.call(this, "length", [this.length, old.length]);
		queues.batch.stop();
		return ret;
	};
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
				!canReflect.isObservableLike(value) &&
				(canReflect.isPlainObject(value) || Array.isArray(value))
			) {
				value = target[key] = observe(value);
			}
			// Intercept calls to Array mutation methods.
			if (isArray && typeof value === "function" && arrayMethodInterceptors[key]) {
				value = arrayMethodInterceptors[key];
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
				ObservationRecorder.add(receiver, key.toString());
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
			if(change) {
				queues.batch.start();
				(target[observableSymbol].handlers[key] || []).forEach(function(handler){
					queues.notifyQueue.enqueue(handler, receiver, [value, old]);
				});
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
			if(ret && (!Array.isArray(target) || !isIntegerIndex(key))) {
				queues.batch.start();
				(target[observableSymbol].handlers[key] || []).forEach(function(handler, i){
					if(old !== undefined) {
						queues.notifyQueue.enqueue(handler, receiver, [undefined, old]);
					}
				});
				queues.batch.stop();
			}
			return ret;
		}
	});

	p[observableSymbol] = {handlers: {}, __bindEvents: {}, proxy: p};
	return p;
};

namespace.observe = observe;
module.exports = observe;
