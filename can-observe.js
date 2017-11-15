var queues = require("can-queues");
var ObservationRecorder = require("can-observation-recorder");
var canReflect = require("can-reflect");
var namespace = require("can-namespace");

var KeyTree = require("can-key-tree");

var proxied = require("./src/-proxy-keys");
var makeProxiedMethods = require("./src/-proxy-methods");
var makeArray = require("./src/-array");
var makeObject = require("./src/-object");
var makeFunction = require("./src/-function");
var symbols = require("./src/-symbols");

var hasOwn = Object.prototype.hasOwnProperty;


// #### shouldRecordObservation
// Decide whether a key/value/object group should add an Observation
// Observations are added for things that satisfy all of these conditions:
//  - not _cid
//  - non-function values
//  - non-symbol keys
//  - not an unknown property on a sealed object
//  - not integer index on array if in an array mutator or comprehension
//  	(treat all sets on an array as a splice and use array patches instead)
function shouldRecordObservation(key, value, target) {
	return key !== "_cid" &&
		typeof value !== "function" &&
		!canReflect.isSymbolLike(key) &&
		(hasOwn.call(target, key) || !Object.isSealed(target)) &&
		!target[symbols.metaSymbol].inArrayMethod;
}

// #### shouldMakeValueObservable
// Decide whether a value being read or written should be converted to its
// Proxied equivalent.
// Proxy when all of the following conditions are true:
//  - value is an object (it exists, so is not null, and has type "object")
//  - key is not a symbol (symbolic properties are assumed not to be desired as observables)
//  - for the write case, there is at least one listener for the property on the parent object
//  	(represented by the onlyIfHandlers flag)
//  - for the read case, the previous stipulation does not apply; reads always return observed objects.
function shouldMakeValueObservable(key, value, target, onlyIfHandlers) {
	return value && typeof value === "object" &&
		!canReflect.isSymbolLike(key) &&
		(!onlyIfHandlers || target[symbols.metaSymbol].handlers.getNode([key]));
}


var injectionOptions = {};


var observe = function(obj, options){ //jshint ignore:line
	if(!obj) {
		return obj;
	}
	// Calling observe() on a particular object will always return the same proxy.
	if (obj[symbols.metaSymbol]) {
		return obj[symbols.metaSymbol].proxy;
	}
	options = options || {};

	options = canReflect.assign({
		defaultGetTraps: {}
	},options);

	// Handle certain things about Arrays and subclasses of Arrays specially.
	var isArray = obj instanceof Array;

	var baseProxyHandlers = {
		get: function(target, key, receiver){
			// The proxy only objects don't need any further processing.
			if(proxied.keys[key] !== undefined) {
				return proxied.keys[key];
			}
			if(injectionOptions.function.keys[key] !== undefined) {
				return injectionOptions.function.keys[key];
			}
			if(options.defaultGetTraps[key]) {
				return options.defaultGetTraps[key];
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
			if (shouldMakeValueObservable(key, value, target)) {
				value = target[key] = observe(value);
			}
			// Intercept calls to Array mutation methods.
			if (typeof value === "function") {
				value = injectionOptions.proxiedMethods.get(value);
			}
			if (shouldRecordObservation(key, value, target)) {
				ObservationRecorder.add(receiver, key.toString());
			}
			return value;
		},
		set: function(target, key, value, receiver){
			if(options.defaultGetTraps[key]) {
				delete options.defaultGetTraps[key];
			}
			var old, change;
			var hadOwn = hasOwn.call(target, key);
			var descriptor = Object.getOwnPropertyDescriptor(target, key);
			// make a proxy for any non-observable objects being passed in as values
			if (shouldMakeValueObservable(key, value, target, true)) {
				value = observe(value);
			} else if (value && value[symbols.metaSymbol]){
				value = value[symbols.metaSymbol].proxy;
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
					if(isArray) {
						injectionOptions.array.dispatchEvents(target, key, value, receiver, hadOwn, old);
					} else {
						injectionOptions.object.dispatchEvents(target, key, value, receiver, hadOwn, old);
					}
				}
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
				.concat(Object.getOwnPropertySymbols(proxied.keys))
				.concat(Object.getOwnPropertySymbols(injectionOptions.function.keys));
		},
		deleteProperty: function(target, key) {
			var old = target[key];
			var ret = delete target[key];
			var receiver = target[symbols.metaSymbol].proxy;
			// Don't trigger handlers on array indexes, as they will change with length.
			//  Otherwise trigger that the property is now undefined.
			// If the property is redefined, the handlers will fire again.
			if(ret && !target[symbols.metaSymbol].inArrayMethod && old !== undefined) {
				queues.batch.start();
				proxied.dispatch.call(receiver, key, [undefined, old]);
				proxied.dispatch.call(receiver, symbols.patchesSymbol, [[{key: key, type: "delete"}]]);
				queues.batch.stop();
			}
			return ret;
		}
	};
	if(typeof obj === "function") {
		canReflect.assign(baseProxyHandlers,injectionOptions.function.proxyHandlers);
	}

	var p = new Proxy(obj, baseProxyHandlers );
	if(typeof obj === "function") {
		var defaultGetTraps = injectionOptions.function.init(obj, p);
		if(defaultGetTraps) {
			console.log(defaultGetTraps.constructor);
			canReflect.assign( options.defaultGetTraps, defaultGetTraps );
		}
	}

	obj[symbols.metaSymbol] = {
		handlers: new KeyTree([Object, Object, Array]),
		proxy: p
	};
	return p;
};

injectionOptions.observe = observe;

// these methods need access to observe and observe to them
injectionOptions.proxiedMethods = makeProxiedMethods(injectionOptions);
injectionOptions.object = makeObject(injectionOptions);
injectionOptions.array = makeArray(injectionOptions);
injectionOptions.function = makeFunction(injectionOptions);

namespace.observe = observe;
module.exports = observe;
