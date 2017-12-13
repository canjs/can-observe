var canReflect = require("can-reflect");
var queues = require("can-queues");
var KeyTree = require("can-key-tree");
var makeObject = require("./-make-object");
var symbols = require("./-symbols");
var observableStore = require("./-observable-store");
var legacyMapBindings = require("can-event-queue/map/map");
var helpers = require("./-helpers");

var proxyKeys = helpers.assignEverything(Object.create(null), makeObject.proxyKeys());

canReflect.assignSymbols(proxyKeys, {
	"can.onInstanceBoundChange": function(handler, queueName) {
		this[symbols.metaSymbol].lifecycleHandlers.add([queueName || "mutate", handler]);
	},
	"can.offInstanceBoundChange": function(handler, queueName) {
		this[symbols.metaSymbol].lifecycleHandlers.delete([queueName || "mutate", handler]);
	},
	"can.dispatchInstanceBoundChange": function(obj, isBound) {
		queues.enqueueByQueue(this[symbols.metaSymbol].lifecycleHandlers.getNode([]), this, [obj, isBound]);
	},
	"can.onInstancePatches": function(handler, queueName) {
		this[symbols.metaSymbol].instancePatchesHandlers.add([queueName || "mutate", handler]);
	},
	"can.offInstancePatches": function(handler, queueName) {
		this[symbols.metaSymbol].instancePatchesHandlers.delete([queueName || "mutate", handler]);
	},
	"can.dispatchInstanceOnPatches": function(obj, patches) {
		queues.enqueueByQueue(this[symbols.metaSymbol].instancePatchesHandlers.getNode([]), this, [obj, patches]);
	},
	"can.defineInstanceKey": function(prop, value) {
		this[symbols.metaSymbol].definitions[prop] = value;
	}
});

var makeFunction = {

	observable: function(object, options) {
		if(options.shouldRecordObservation === undefined) {
			options.shouldRecordObservation = makeObject.shouldRecordObservationOnOwnAndMissingKeys;
		}
		var proxyKeys = Object.create(makeFunction.proxyKeys());

		var meta = {
			lifecycleHandlers: new KeyTree([Object, Array]),
			instancePatchesHandlers: new KeyTree([Object, Array]),
			target: object,
			proxyKeys: proxyKeys,
			options: options,
			definitions: {},
			isClass: helpers.isClass(object),
			preventSideEffects: 0,
			//inheritsFromArray: helpers.inheritsFromArray(object)
		};

		proxyKeys[symbols.metaSymbol] = meta;
		meta.proxy = new Proxy(object, {
			get: makeObject.get.bind(meta),
			set: makeObject.set.bind(meta),
			ownKeys: makeObject.ownKeys.bind(meta),
			deleteProperty: makeObject.deleteProperty.bind(meta),
			construct: makeFunction.construct.bind(meta),
			apply: makeFunction.apply.bind(meta),
			meta: meta
		});
		legacyMapBindings.addHandlers(meta.proxy, meta);
		observableStore.proxiedObjects.set(object, meta.proxy);
		observableStore.proxies.add(meta.proxy);
		// Change prototype and its constructor
		if (meta.target.prototype && meta.target.prototype.constructor === meta.target) {
			// we must store right away, so we don't proxy the proxy
			var prototype = meta.proxy.prototype;
			prototype.constructor = meta.proxy;
		}

		return meta.proxy;
	},

	proxyKeys: function() {
		return proxyKeys;
	},
	construct: function(target, argumentsList, newTarget) {
		// start by using the default `construct()` to get an instance
		//var instance = constructInstance(target, argumentsList, newTarget);
		// return the proxy instead of the instance

		var instanceTarget, key;
		if (this.isClass) {
			// If it's a class, we can't call the function w/o new
			instanceTarget = Reflect.construct(target, argumentsList, newTarget);
			// this adds support for `can.defineInstanceKey` which is needed for `can-connect`
			for (key in this.definitions) {
				Object.defineProperty(instanceTarget, key, this.definitions[key]);
			}
			return this.options.observe(instanceTarget);
		} else {
			// create an empty object
			instanceTarget = Object.create(this.proxy.prototype);
			// this adds support for `can.defineInstanceKey` which is needed for `can-connect`
			for (key in this.definitions) {
				Object.defineProperty(instanceTarget, key, this.definitions[key]);
			}
			var instance = this.options.observe(instanceTarget);
			instance[symbols.metaSymbol].preventSideEffects++;
			var res = target.apply(instance, argumentsList);
			instance[symbols.metaSymbol].preventSideEffects--;
			if (res) {
				return res;
			} else {
				return instance;
			}
		}


	},
	apply: function(target, thisArg, argumentsList) {
		var ret = this.target.apply(thisArg, argumentsList);
		return this.options.observe(ret);
	}
};


module.exports = makeFunction;
