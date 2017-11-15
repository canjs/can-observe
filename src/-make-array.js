var canReflect = require("can-reflect");
var queues = require("can-queues");
var canSymbol = require("can-symbol");
var KeyTree = require("can-key-tree");
var ObservationRecorder = require("can-observation-recorder");
var makeObject = require("./-make-object");
var symbols = require("./-symbols");
var diffArray = require("can-util/js/diff-array/diff-array");
var observableStore = require("./-observable-store");

var dispatchInstanceOnPatchesSymbol = canSymbol.for("can.dispatchInstanceOnPatches");

function isIntegerIndex(prop) {
	return prop && // empty string typecasts to 0
		(+prop === +prop) && // NaN check for strings that don't represent numbers
		(+prop % 1 === 0);  // floats should be treated as strings
}
// Pre-populate array methods so they are used

var mutateMethods = {
    "push": function(arr, args) {
        return [{
            index: arr.length - args.length,
            deleteCount: 0,
            insert: args
        }];
    },
    "pop": function(arr) {
        return [{
            index: arr.length,
            deleteCount: 1,
            insert: []
        }];
    },
    "shift": function() {
        return [{
            index: 0,
            deleteCount: 1,
            insert: []
        }];
    },
    "unshift": function(arr, args) {
        return [{
            index: 0,
            deleteCount: 0,
            insert: args
        }];
    },
    "splice": function(arr, args) {
        return [{
            index: args[0],
            deleteCount: args[1],
            insert: args.slice(2)
        }];
    },
    "sort": function(arr, args, old) {
        return diffArray(old, arr);
    },
    "reverse": function(arr, args, old) {
        return diffArray(old, arr);
    }
};

(function(){
    // Each of these methods below creates the appropriate arguments for dispatch of
    // their respective event names.


    Object.keys(mutateMethods).forEach(function(prop) {
    	var protoFn = Array.prototype[prop];
        var observable = function() {
            var meta = this[symbols.metaSymbol];
    		meta.createSideEffects = false;
    		// stash the previous array contents. Use the native
    		// function instead of going through the proxy or target.
    		var old = [].slice.call(meta.target, 0);
    		// call the function -- note that *this* is the Proxy here, so
    		//  accesses in the function still go through get() and set()
    		var ret = protoFn.apply(meta.target, arguments);
    		var patches = mutateMethods[prop](meta.target, Array.from(arguments), old);

    		queues.batch.start();
    		// dispatch all the associated change events and length

            queues.enqueueByQueue(meta.handlers.getNode(["length"]), meta.receiver, [meta.target.length, old.length]);
            queues.enqueueByQueue(meta.handlers.getNode([symbols.patchesSymbol]), meta.receiver, [patches.concat([{key: "length", type: "set", value: meta.target.length}])]);

            var constructor = meta.target.constructor,
                dispatchPatches = constructor[dispatchInstanceOnPatchesSymbol];
            if(dispatchPatches) {
                dispatchPatches.call(constructor, meta.receiver, patches);
            }
            queues.batch.stop();
    		meta.createSideEffects = true;
    		return ret;
    	};
    	observableStore.set(protoFn, observable);
        observableStore.set(observable, observable);
    });
    // #### make special interceptors for all non-mutating Array functions
    Object.getOwnPropertyNames(Array.prototype).forEach(function(prop) {
    	if(mutateMethods[prop]) {
    		return;
    	}
    	var protoFn = Array.prototype[prop];
    	if(prop !== "constructor" && typeof protoFn === "function") {
            var observable = function() {
    			ObservationRecorder.add(this, symbols.patchesSymbol);
                var meta = this[symbols.metaSymbol];
    			meta.createSideEffects = false;
    			var ret = protoFn.apply(meta.target, arguments);
    			meta.createSideEffects = true;
    			return meta.options.observe(ret);
    		};
    		observableStore.set(protoFn, observable);
            observableStore.set(observable, observable);
    	}
    });
})();

function didLengthChangeCauseDeletions(key, value, old, meta) {
	return key === "length" && value < old;
}

var assignEverything = function(d, s){
    Object.getOwnPropertyNames(s).concat(Object.getOwnPropertySymbols(s)).forEach(function(key){
        d[key] = s[key];
    });
    return d;
};

var metaKeys = assignEverything({}, makeObject.metaKeys());


var makeArray = {

    observable: function(object, options){
		var receiverKeys = Object.create( makeArray.metaKeys() );

        var meta = {
            target: object,
            receiverKeys: receiverKeys,
            options: options
        };
		meta.handlers = makeObject.handlers(meta);
		receiverKeys[symbols.metaSymbol] = meta;
        return meta.receiver = new Proxy(object, {
            get: makeObject.get.bind(meta),
            set: makeArray.set.bind(meta),
            ownKeys: makeObject.ownKeys.bind(meta),
            deleteProperty: makeObject.deleteProperty.bind(meta)
        });
    },

    metaKeys: function(){
        return metaKeys;
    },
    // a proxied function needs to have .constructor point to the proxy, while the underlying property points to
    // what was there. Maybe
    set: function(target, key, value){

        value = makeObject.getValueToSet(key, value, this);
        // make a proxy for any non-observable objects being passed in as values
        makeObject.setValueAndOnChange(key, value, this, function(key, value, meta, hadOwn, old){
            var integerIndex = isIntegerIndex(key);
            queues.batch.start();

            var patches = [{key: key, type: hadOwn ? "set" : "add", value: value}];
            // Normal object event code
            queues.enqueueByQueue(meta.handlers.getNode([key]), meta.receiver,
                [value, old]);


            if(integerIndex) {
                // The set handler should not attempt to dispatch length patches stemming from array mutations because
                //  we cannot reliably detect a change to the length (it's already set to the new value on the target).
                //  Instead, the array method interceptor should handle it, since it has information about the previous
                //  state.
                // The one possible exception to this is when an array index is *added* that changes the length.
                if(!hadOwn && +key === meta.target.length - 1) {
                    patches.push({key: "length", type: "set", value: meta.target.length});
                } else {
                    // In the case of setting an array index, dispatch a splice patch.
                    patches.push.apply(patches, mutateMethods.splice(target, [+key, 1, value]));
                }
            }

            // In the case of deleting items by setting the length of the array, fire "remove" patches.
            // (deleting individual items from an array doesn't change the length; it just creates holes)
            if(didLengthChangeCauseDeletions(key, value, old, meta)) {
                while(old-- > value) {
                    patches.push({key: old, type: "delete"});
                }
            }
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
    }
};


module.exports = makeObject;
