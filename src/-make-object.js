var canReflect = require("can-reflect");
var queues = require("can-queues");
var canSymbol = require("can-symbol");
var KeyTree = require("can-key-tree");
var ObservationRecorder = require("can-observation-recorder");

var symbols = require("./-symbols");

var dispatchInstanceOnPatchesSymbol = canSymbol.for("can.dispatchInstanceOnPatches");
var hasOwn = Object.prototype.hasOwnProperty;



function shouldRecordObservation(key, value, meta) {
	return !canReflect.isSymbolLike(key) &&
        // performance optimization
		(hasOwn.call(meta.target, key) || !Object.isSealed(meta.target)) &&
        // special
		meta.createSideEffects !== false;
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
	}
});
queues.log();
var makeObject = {

    observable: function(object, options){
		var receiverKeys = Object.create( makeObject.metaKeys() );
        var meta = {
            handlers: new KeyTree([Object, Object, Array]),
            target: object,
            receiverKeys: receiverKeys,
            options: options,
			createSideEffects: true
        };
		receiverKeys[symbols.metaSymbol] = meta;
        return meta.receiver = new Proxy(object, {
            get: makeObject.get.bind(meta),
            set: makeObject.set.bind(meta),
            ownKeys: makeObject.ownKeys.bind(meta),
            deleteProperty: makeObject.deleteProperty.bind(meta),
			meta: meta
        });
    },

    metaKeys: function(){
        return metaKeys;
    },
    get: function(target, key){
        if(this.receiverKeys[key] !== undefined) {
            return this.receiverKeys[key];
        }
        return makeObject.getObservableValueFromTarget(key, this);
    },
    // a proxied function needs to have .constructor point to the proxy, while the underlying property points to
    // what was there. Maybe
    set: function(target, key, value){

        value = makeObject.getValueToSet(key, value, this);
        // make a proxy for any non-observable objects being passed in as values
        makeObject.setValueAndOnChange(key, value, this, function(key, value, meta, hadOwn, old){
            queues.batch.start();
            queues.enqueueByQueue(meta.handlers.getNode([key]), meta.receiver,
                [value, old]);
            var patches = [{key: key, type: hadOwn ? "set" : "add", value: value}];
            queues.enqueueByQueue(meta.handlers.getNode([symbols.patchesSymbol]), meta.receiver,
                [patches]);

			// might need to be .receiver
            var constructor = meta.target.constructor,
                dispatchPatches = constructor[dispatchInstanceOnPatchesSymbol];
            if(dispatchPatches) {
                dispatchPatches.call(constructor, meta.receiver, patches);
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
            .concat(Object.getOwnPropertySymbols(this.receiverKeys));
    },
    deleteProperty: function(target, key) {
        var old = this.target[key];
        var ret = delete this.target[key];
        // Don't trigger handlers on array indexes, as they will change with length.
        //  Otherwise trigger that the property is now undefined.
        // If the property is redefined, the handlers will fire again.
        if(ret && this.createSideEffects !== false && old !== undefined) {
            queues.batch.start();
            queues.enqueueByQueue(this.handlers.getNode(key), this.receiver,
                [undefined, old]);
            var patches = [{key: key, type: "delete"}];
            queues.enqueueByQueue(this.handlers.getNode(symbols.patchesSymbol), this.receiver,
                [patches]);

            var constructor = this.target.constructor,
                dispatchPatches = constructor[dispatchInstanceOnPatchesSymbol];
            if(dispatchPatches) {
                dispatchPatches.call(constructor, this.receiver, patches);
            }

            queues.batch.stop();
        }
        return ret;
    },
	shouldMakeValueObservable: function(key, value, data, onlyIfHandlers) {
		return !canReflect.isPrimitive(value) &&
			!canReflect.isSymbolLike(key) &&
			(!onlyIfHandlers || data.handlers.getNode([key]));
	},
    getValueFromTarget: function(key, meta) {
        var descriptor = Object.getOwnPropertyDescriptor(meta.target, key);
        // If this is a getter, call the getter on the Proxy in order to observe
        // what other values it reads.
        if(descriptor && descriptor.get) {
            return descriptor.get.call(meta.receiver);
        } else {
            return meta.target[key];
        }
    },
    getObservableValueFromTarget: function(key, meta){
        var value = makeObject.getValueFromTarget(key, meta);

        // If the value for this key is an object and not already observable, make a proxy for it
        if (makeObject.shouldMakeValueObservable(key, value, meta)) {
            value = meta.target[key] = meta.options.observe(value);
        }


        if (shouldRecordObservation(key, value, meta)) {
            ObservationRecorder.add(meta.receiver, key.toString());
        }

        return value;
    },
    getValueToSet: function(key, value, meta) {
        if (makeObject.shouldMakeValueObservable(key, value, meta, true)) {
            return meta.options.observe(value);
        } else if (value && value[symbols.metaSymbol]){
            return value[symbols.metaSymbol].proxy;
        } else {
            return value;
        }
    },
    setValueAndOnChange: function(key, value, data, onChange){
        var old, change;
        var hadOwn = hasOwn.call(data.target, key);

        var descriptor = Object.getOwnPropertyDescriptor(data.target, key);
        // call the setter on the Proxy to properly do any side-effect sets (and run corresponding handlers)
        // -- setters do not return values, so it is unnecessary to check for changes.
        if(descriptor && descriptor.set) {
            descriptor.set.call(data.receiver, value);
        } else {
            // otherwise check for a changed value
            old = data.target[key];
            change = old !== value;
            if (change) {
                data.target[key] = value;
                onChange(key, value, data, hadOwn, old);
            }
        }
    }
};


module.exports = makeObject;
