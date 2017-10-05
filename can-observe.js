var cid = require("can-cid");
var canBatch = require("can-event/batch/batch");
var Observation = require("can-observation");
var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");

var has = Object.prototype.hasOwnProperty;
var observableSymbol = canSymbol.for("can.observeData");
var onKeyValueSymbol = canSymbol.for("can.onKeyValue");
var offKeyValueSymbol = canSymbol.for("can.offKeyValue");

var observe = function(obj){
	if (obj[observableSymbol]) {
		return obj[proxySymbol].handlers.proxy
	} else {
		Object.defineProperty(obj, "_cid", {
			value: cid({}),
			enumerable: false
		});
	}

	var p = new Proxy(obj, {
		get: function(target, key){
			var value = target[key];
			if(canReflect.isSymbolLike(key) && key === onKeyValueSymbol || key === offKeyValueSymbol) {
				key = canSymbol.for(canSymbol.keyFor(key) + cid.domExpando);
			}
			if (!canReflect.isSymbolLike(key) && !canReflect.isObservableLike(value) && canReflect.isPlainObject(value)) {
				target[key] = observe(value);
			}
			if (key !== "_cid" && has.call(target, key)) {
				Observation.add(target, key);
			}
			return target[key];
		},
		set: function(target, key, value, receiver){

			if (canReflect.isSymbolLike(key) && key === onKeyValueSymbol || key === offKeyValueSymbol) {
				key = canSymbol.for(canSymbol.keyFor(key) + cid.domExpando);
			}

			var old = target[key];
			var change = old !== value;
			if (change) {
				if (!canReflect.isSymbolLike(key) && !canReflect.isObservableLike(value) && canReflect.isPlainObject(value)) {
					target[key] = observe(value);
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
			var syms = Object.getOwnPropertySymbols(target);
			return syms.map(function(sym) {
				if(canSymbol.keyFor(sym).endsWith(cid.domExpando)) {
					return canSymbol.for(canSymbol.keyFor(sym).replace(cid.domExpando, ""));
				} else {
					return sym;
				}
			}).concat(Object.getOwnPropertyNames(target));
		}
	});
	var meta = p[observableSymbol] = {handlers: {}, proxy: p};
	var handlers = meta.handlers;

	canReflect.assignSymbols(p, {
		"can.onKeyValue": function(key, handler) {
			var keyHandlers = handlers[key];
			if (!keyHandlers) {
				keyHandlers = handlers[key] = [];
			}
			keyHandlers.push(handler);
		},
		"can.offKeyValue": function(key, handler) {
			var keyHandlers = handlers[key];
			if(keyHandlers) {
				var index = keyHandlers.indexOf(handler);
				if(index >= 0 ) {
					keyHandlers.splice(index, 1);
				}
			}
		}
	});

	return p;
};

module.exports = observe;
