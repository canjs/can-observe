var canReflect = require("can-reflect");
var queues = require("can-queues");
var canSymbol = require("can-symbol");
var KeyTree = require("can-key-tree");
var ObservationRecorder = require("can-observation-recorder");

var symbols = require("./-symbols");

var dispatchInstanceOnPatchesSymbol = canSymbol.for("can.dispatchInstanceOnPatches");
var dispatchBoundChangeSymbol = canSymbol.for("can.dispatchInstanceBoundChange");
var hasOwn = Object.prototype.hasOwnProperty;
var observableStore = require("./-observable-store");
var helpers = require("./-helpers");

var isSymbolLike = canReflect.isSymbolLike;
function shouldRecordObservationOnOwnAndMissingKeys(keyInfo, meta) {
	return meta.preventSideEffects === 0 &&
		(
			// it's on us
			keyInfo.targetHasOwnKey ||
			// it's "missing", and we are not sealed
			(!keyInfo.protoHasKey && !Object.isSealed(meta.target))
		);
}

var metaKeys = canReflect.assignSymbols(Object.create(null), {
	"can.onKeyValue": function(key, handler, queue) {
		var handlers = this[symbols.metaSymbol].handlers;
		handlers.add([key, queue || "notify", handler]);
	},
	"can.offKeyValue": function(key, handler, queue) {
		var handlers = this[symbols.metaSymbol].handlers;
		handlers.delete([key, queue || "notify", handler]);
	},
	"can.onPatches": function(handler, queue) {
		var handlers = this[symbols.metaSymbol].handlers;
		handlers.add([symbols.patchesSymbol, queue || "notify", handler]);
	},
	"can.offPatches": function(handler, queue) {
		var handlers = this[symbols.metaSymbol].handlers;
		handlers.delete([symbols.patchesSymbol, queue || "notify", handler]);
	},
	"can.isBound": function(){
		return this[symbols.metaSymbol].handlers.size() > 0;
	}
});
var makeObject = {

	observable: function(object, options) {
		var proxyKeys = Object.create(makeObject.metaKeys());
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
			set: makeObject.set.bind(meta),
			ownKeys: makeObject.ownKeys.bind(meta),
			deleteProperty: makeObject.deleteProperty.bind(meta),
			meta: meta
		});
	},
	handlers: function(meta) {
		return new KeyTree([Object, Object, Array], {
			onFirst: function() {
				if (meta.proxy.constructor[dispatchBoundChangeSymbol]) {
					meta.proxy.constructor[dispatchBoundChangeSymbol](meta.proxy, true);
				}
			},
			onEmpty: function() {
				if (meta.proxy.constructor[dispatchBoundChangeSymbol]) {
					meta.proxy.constructor[dispatchBoundChangeSymbol](meta.proxy, false);
				}
			}
		});
	},
	metaKeys: function() {
		return metaKeys;
	},

	// At its core, this checks the target for un-proxied objects.
	// If it finds one,
	//   - it creates one (which registers itself in the observableStore) and
	//   - returns that value without modifying the underlying target
	get: function(target, key, receiver) {
		var proxyKey = this.proxyKeys[key];
		if (proxyKey !== undefined) {
			return proxyKey;
		}
		// Leave symbols alone
		if (isSymbolLike(key)) {
			return target[key];
		}
		var keyInfo = makeObject.getKeyInfo(target, key, receiver, this);
		var value = keyInfo.targetValue;

		if (!keyInfo.valueIsInvariant) {
			value = makeObject.getValueFromStore(key, value, this);
		}
		if (shouldRecordObservationOnOwnAndMissingKeys(keyInfo, this)) {
			ObservationRecorder.add(this.proxy, key.toString());
		}
		if (keyInfo.parentObservableGetCalledOn) {
			ObservationRecorder.add(keyInfo.parentObservableGetCalledOn, key.toString());
		}
		return value;
	},
	// a proxied function needs to have .constructor point to the proxy, while the underlying property points to
	// what was there. Maybe
	set: function(target, key, value, receiver) {
		//
		if (receiver !== this.proxy) {
			// TODO: eliminate this code
			return makeObject.setPrototypeKey(key, value, receiver, this);
		}
		value = makeObject.getValueToSet(key, value, this);
		// make a proxy for any non-observable objects being passed in as values
		makeObject.setValueAndOnChange(key, value, this, function(key, value, meta, hadOwn, old) {
			queues.batch.start();
			queues.enqueueByQueue(meta.handlers.getNode([key]), meta.proxy, [value, old]);
			var patches = [{
				key: key,
				type: hadOwn ? "set" : "add",
				value: value
			}];
			queues.enqueueByQueue(meta.handlers.getNode([symbols.patchesSymbol]), meta.proxy, [patches]);

			// might need to be .proxy
			var constructor = meta.target.constructor,
				dispatchPatches = constructor[dispatchInstanceOnPatchesSymbol];
			if (dispatchPatches) {
				dispatchPatches.call(constructor, meta.proxy, patches);
			}

			queues.batch.stop();
		});


		return true;
	},
	ownKeys: function(target, key) {
		// Proxies should return the keys and symbols from proxyOnly
		// as well as from the target, so operators like `in` and
		// functions like `hasOwnProperty` can be used to determine
		// that the Proxy is observable.
		return Object.getOwnPropertyNames(this.target)
			.concat(Object.getOwnPropertySymbols(this.target))
			.concat(Object.getOwnPropertySymbols(this.proxyKeys));
	},
	getKeyInfo: function(target, key, receiver, meta) {
		// Optimized
		var descriptor = Object.getOwnPropertyDescriptor(target, key);
		var propertyInfo = {
			key: key,
			descriptor: descriptor,
			targetHasOwnKey: Boolean(descriptor),
			protoHasKey: false,
			valueIsInvariant: false,
			targetValue: undefined,
			getCalledOnParent: receiver !== meta.proxy
		};
		if (descriptor !== undefined) {
			propertyInfo.valueIsInvariant = descriptor.writable !== true;
			if (descriptor.get !== undefined) {
				propertyInfo.targetValue = descriptor.get.call(meta.proxy);
			} else {
				propertyInfo.targetValue = descriptor.value;
			}
		} else {
			propertyInfo.targetValue = meta.target[key];
			propertyInfo.protoHasKey = propertyInfo.targetValue !== undefined ? true : (key in target);
		}
		if (propertyInfo.getCalledOnParent === true) {
			propertyInfo.parentObservableGetCalledOn = observableStore.proxiedObjects.get(receiver);
		}
		return propertyInfo;
	},
	// This will record on own keys, and on "missing" keys
	shouldRecordObservationOnOwnAndMissingKeys: shouldRecordObservationOnOwnAndMissingKeys,
	deleteProperty: function(target, key) {
		var old = this.target[key];
		var ret = delete this.target[key];
		// Don't trigger handlers on array indexes, as they will change with length.
		//  Otherwise trigger that the property is now undefined.
		// If the property is redefined, the handlers will fire again.
		if (ret && this.preventSideEffects === 0 && old !== undefined) {
			queues.batch.start();
			queues.enqueueByQueue(this.handlers.getNode([key]), this.proxy, [undefined, old]);
			var patches = [{
				key: key,
				type: "delete"
			}];
			queues.enqueueByQueue(this.handlers.getNode([symbols.patchesSymbol]), this.proxy, [patches]);

			var constructor = this.target.constructor,
				dispatchPatches = constructor[dispatchInstanceOnPatchesSymbol];
			if (dispatchPatches) {
				dispatchPatches.call(constructor, this.proxy, patches);
			}

			queues.batch.stop();
		}
		return ret;
	},
	setPrototypeKey: function(key, value, receiver, meta) {
		Object.defineProperty(receiver, key, {
			value: value,
			configurable: true,
			enumerable: true,
			writable: true
		});
		return true;
	},
	getValueFromTarget: function(key, meta) {
		var descriptor = Object.getOwnPropertyDescriptor(meta.target, key);
		// If this is a getter, call the getter on the Proxy in order to observe
		// what other values it reads.
		if (descriptor && descriptor.get) {
			return descriptor.get.call(meta.proxy);
		} else {
			return meta.target[key];
		}
	},
	getValueToSet: function(key, value, meta) {
		if (!canReflect.isSymbolLike(key) && meta.handlers.getNode([key])) {
			return makeObject.getValueFromStore(key, value, meta);
		}
		return value;
	},
	getValueFromStore: function(key, value, meta) {
		if (!canReflect.isPrimitive(value) &&
			!canReflect.isObservableLike(value) &&
			// if it's already a proxy ...
			!observableStore.proxies.has(value)) {

			// if it's already been made into a proxy
			if (observableStore.proxiedObjects.has(value)) {
				value = observableStore.proxiedObjects.get(value);
			}
			// if the value is something we should change
			else if (!helpers.isBuiltInButNotArrayOrPlainObject(value)) {
				// registers, but doesn't set
				value = meta.options.observe(value);
			}
		}
		return value;
	},
	setValueAndOnChange: function(key, value, data, onChange) {
		var old, change;
		var hadOwn = hasOwn.call(data.target, key);

		var descriptor = Object.getOwnPropertyDescriptor(data.target, key);
		// call the setter on the Proxy to properly do any side-effect sets (and run corresponding handlers)
		// -- setters do not return values, so it is unnecessary to check for changes.
		if (descriptor && descriptor.set) {
			descriptor.set.call(data.proxy, value);
		} else {
			// otherwise check for a changed value
			old = data.target[key];
			change = old !== value;
			if (change) {
				data.target[key] = value;
				if (data.preventSideEffects === 0) {
					onChange(key, value, data, hadOwn, old);
				}
			}
		}
	}
};


module.exports = makeObject;
