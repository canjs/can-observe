var cid = require("can-cid");
var canBatch = require("can-event/batch/batch");
var Observation = require("can-observation");
var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");

var observableSymbol = canSymbol.for("can.observeData");

var proxyOnly = {};
canReflect.assignSymbols(proxyOnly, {
	"can.onKeyValue": function(key, handler) {
		var handlers = this[observableSymbol].handlers;
		var keyHandlers = handlers[key];
		if (!keyHandlers) {
			keyHandlers = handlers[key] = [];
		}
		keyHandlers.push(handler);
	},
	"can.offKeyValue": function(key, handler) {
		var handlers = this[observableSymbol].handlers;
		var keyHandlers = handlers[key];
		if(keyHandlers) {
			var index = keyHandlers.indexOf(handler);
			if(index >= 0 ) {
				keyHandlers.splice(index, 1);
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

			var value = target[key];
			if (!canReflect.isSymbolLike(key) && !canReflect.isObservableLike(value) && canReflect.isPlainObject(value)) {
				target[key] = observe(value);
			}
			if (key !== "_cid" && (key in target || !Object.isSealed(target))) {
				Observation.add(receiver, key.toString());
			}
			return target[key];
		},
		set: function(target, key, value){
			var old = target[key];
			var change = old !== value;

			if (change) {
				if (!canReflect.isSymbolLike(key) && !canReflect.isObservableLike(value) && canReflect.isPlainObject(value)) {
					target[key] = observe(value);
				} else if (value[observableSymbol]){
					target[key] = value[observableSymbol].proxy;
				} else {
					target[key] = value;
				}
				(target[observableSymbol].handlers[key] || []).forEach(function(handler){
					canBatch.queue([handler, this, [value, old]]);
				}, this);
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
