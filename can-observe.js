var cid = require("can-cid");
var canBatch = require("can-event/batch/batch");
var Observation = require("can-observation");
var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");

var observableSymbol = canSymbol.for("can.observeData");
var hasOwn = Object.prototype.hasOwnProperty;

var proxyOnly = {};
canReflect.assignSymbols(proxyOnly, {
	"can.onKeyValue": function(key, handler) {
		var handlers = this[observableSymbol].handlers;
		var keyHandlers = handlers[key];
		var descriptor = Object.getOwnPropertyDescriptor(this, key);
		if (!keyHandlers) {
			keyHandlers = handlers[key] = [];
		}
		if(descriptor && descriptor.get) {
			var obs = new Observation(descriptor.get, this[observableSymbol].proxy, handler);
			keyHandlers.push(obs);
			obs.start();
		} else {
			keyHandlers.push(handler);
		}
	},
	"can.offKeyValue": function(key, handler) {
		var handlers = this[observableSymbol].handlers;
		var keyHandlers = handlers[key];
		if(keyHandlers) {
			var index = keyHandlers.map(function(h) {
				return h.compute && h.compute.updater || h;
			}).indexOf(handler);
			if(index >= 0 ) {
				var obs = keyHandlers.splice(index, 1);
				if(typeof obs[0].stop === "function") {
					obs[0].stop();
				}
			}
		}
	}
});

var observe = function(obj){
	if (obj[observableSymbol]) {
		return obj[observableSymbol].proxy;
	} else {
		Object.defineProperty(obj, "_cid", {
			value: cid({}),
			enumerable: false
		});
	}

	var p = new Proxy(obj, {
		get: function(target, key, receiver){
			if(proxyOnly[key]) {
				return proxyOnly[key];
			}
			var descriptor = Object.getOwnPropertyDescriptor(target, key);
			var value;
			if(descriptor && descriptor.get) {
				value = descriptor.get.call(receiver);
			} else {
				value = target[key];
			}
			if (!canReflect.isSymbolLike(key) && !canReflect.isObservableLike(value) && canReflect.isPlainObject(value)) {
				value = target[key] = observe(value);
			}
			if (key !== "_cid" && (hasOwn.call(target, key) || !Object.isSealed(target))) {
				Observation.add(receiver, key.toString());
			}
			return value;
		},
		set: function(target, key, value, receiver){
			var old, change;
			var descriptor = Object.getOwnPropertyDescriptor(target, key);
			if (!canReflect.isSymbolLike(key) && !canReflect.isObservableLike(value) && canReflect.isPlainObject(value)) {
				value = observe(value);
			} else if (value[observableSymbol]){
				value = value[observableSymbol].proxy;
			}

			if(descriptor && descriptor.set) {
				descriptor.set.call(receiver, value);
			} else {
				old = target[key];
				change = old !== value;
				if (change) {
					target[key] = value;
				}
			}
			if(descriptor && descriptor.set || change) {
				(target[observableSymbol].handlers[key] || []).forEach(function(handler){
					canBatch.queue([handler.get ? handler.get.bind(handler) : handler, receiver, [value, old]]);
				});
			}
			return true;
		},
		ownKeys: function(target) {
			return Object.getOwnPropertyNames(target)
				.concat(Object.getOwnPropertySymbols(target))
				.concat(Object.getOwnPropertySymbols(proxyOnly));
		}
	});

	p[observableSymbol] = {handlers: {}, proxy: p};
	return p;
};

module.exports = observe;
