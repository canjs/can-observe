var cid = require("can-cid");
var canBatch = require("can-event/batch/batch");
var Observation = require("can-observation");
var canSymbol = require("can-symbol");
var canReflect = require("can-reflect");
var namespace = require("can-namespace");
var canEvent = require("can-event");

var observableSymbol = canSymbol.for("can.observeData");
var hasOwn = Object.prototype.hasOwnProperty;

function isIntegerIndex(prop) {
	return prop && // empty string typecasts to 0
		(+prop === +prop) && // NaN check for strings that don't represent numbers
		(+prop % 1 === 0);  // floats should be treated as strings
}

var proxyOnly = Object.create(null);
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
canReflect.assign(proxyOnly, canEvent);
proxyOnly.addEventListener = function(ev, handler) {
	var handlers = this[observableSymbol].handlers;
	var keyHandlers = handlers[ev];
	if (!keyHandlers) {
		keyHandlers = handlers[ev] = [];
	}
	keyHandlers.push(handler);
};
proxyOnly.removeEventListener = function(ev, handler) {
	var handlers = this[observableSymbol].handlers;
	var keyHandlers = handlers[ev];
	if(keyHandlers) {
		var index = keyHandlers.indexOf(handler);
		keyHandlers.splice(index, 1);
	}
};


var arrayMethodInterceptors = Object.create(null);
var mutateMethods = {
	"push": {
		add: function(arr, args, retVal) {
			return [[{}, args, arr.length - args.length]];
		}
	},
	"pop": {
		remove: function(arr, args, retVal) {
			return [[{}, [retVal], arr.length]];
		}
	},
	"shift": {
		remove: function(arr, args, retVal) {
			return [[{}, args, 0]];
		}
	},
	"unshift": {
		add: function(arr, args, retVal) {
			return [[{}, args, 0]];
		}
	},
	"splice": {
		remove: function(arr, args, retVal) {
			return [[{}, retVal, args[0]]];
		},
		add: function(arr, args, retVal) {
			return [[{}, args.slice(2), args[0]]];
		}
	},
	"sort": {
		move: function(arr, args, retVal, old) {
			return arr.map(function(element, index) {
				if(old[index] !== element) {
					return [{}, element, index, old.indexOf(element)];
				}
			}).filter(function(el) {
				return !!el;
			});
		}
	},
	"reverse": {
		move: function(arr, args) {
			return arr.map(function(element, index) {
				if(arr.length - index - 1 !== index) {
					return [{}, element, index, arr.length - index - 1];
				}
			}).filter(function(el) {
				return !!el;
			});
		}
	}
};

canReflect.eachKey(mutateMethods, function(changeEvents, prop) {
	var protoFn = Array.prototype[prop];
	arrayMethodInterceptors[prop] = function() {
		var handlers = this[observableSymbol].handlers;
		handlers.length = handlers.length || [];
		var old = [].slice.call(this, 0);
		var args = Array.from(arguments);
		var ret = protoFn.apply(this, arguments);
		canReflect.eachKey(changeEvents, function(makeArgs, event) {
			var allArgs = makeArgs(this, args, ret, old);
			allArgs.forEach(function(handlerArgs) {
				(handlers[event] || []).forEach(function(handler) {
					canBatch.queue([handler, this, handlerArgs]);
				}, this);
			}, this);
		}.bind(this));
		handlers.length.forEach(function(handler){
			canBatch.queue([handler, this, [this.length, old.length]]);
		}, this);
		return ret;
	};
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
	var isArray = obj instanceof Array;

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
			if (isArray && typeof value === "function" && arrayMethodInterceptors[key]) {
				value = arrayMethodInterceptors[key];
			}
			if (key !== "_cid" &&
				typeof value !== "function" &&
				!canReflect.isSymbolLike(key) && 
				(hasOwn.call(target, key) || !Object.isSealed(target))
			) {
				Observation.add(receiver, key.toString());
			}
			return value;
		},
		set: function(target, key, value, receiver){
			var old, change;
			var descriptor = Object.getOwnPropertyDescriptor(target, key);
			if (!canReflect.isSymbolLike(key) && !canReflect.isObservableLike(value) && canReflect.isPlainObject(value)) {
				value = observe(value);
			} else if (value && value[observableSymbol]){
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
		},
		deleteProperty: function(target, key) {
			var old = target[key];
			var ret = delete target[key];
			var receiver = target[observableSymbol].proxy;
			// Don't trigger handlers on array indexes, as they will change with length.
			if(ret && (!Array.isArray(target) || !isIntegerIndex(key))) {
				(target[observableSymbol].handlers[key] || []).forEach(function(handler, i){
					if(handler.get) {
						// This is an observe bound to the deleted getter;  Change it to a value handler.
						handler.stop();
						handler = target[observableSymbol].handlers[key][i] = handler.compute.updater;
					}
					if(old !== undefined) {
						canBatch.queue([handler, receiver, [undefined, old]]);
					}
				});
			}
			return ret;
		}
	});

	p[observableSymbol] = {handlers: {}, proxy: p};
	return p;
};



namespace.observe = observe;
module.exports = observe;
