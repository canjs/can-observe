var cid = require("can-cid");
var canBatch = require("can-event/batch/batch");
var Observation = require("can-observation");
var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");

var observableDataSymbol = canSymbol.for("can.observeData");

var observeMutate = function(obj) {
    if(obj[observableDataSymbol]) {
        return obj;
    } else {
        Object.defineProperty(obj, "_cid", {
            value: cid({}),
            enumerable: false
        });
    }
    if(Array.isArray(obj)) {
        return observeArray(obj);
    } else if (canReflect.isPlainObject(obj)) {
        return observeObject(obj);
    }
};

var observeObject = function(obj) {
    var meta = obj[observableDataSymbol] = {handlers: {}, data:{}};
    var data = meta.data;
    var handlers = meta.handlers;

    canReflect.assignSymbols(obj, {
        "can.onKeyValue": function(key, handler){
            var keyHandlers = handlers[key];
            if (!keyHandlers) {
                keyHandlers = handlers[key] = [];
            }
            keyHandlers.push(handler);
        },
        "can.offKeyValue": function(key, handler){
            var keyHandlers = handlers[key];
            if(keyHandlers) {
                var index = keyHandlers.indexOf(handler);
                if(index >= 0 ) {
                    keyHandlers.splice(index, 1);
                }
            }
        }
    });

    Object.keys(obj).forEach(function(prop){

        var value = obj[prop];
        data[prop] = value;

        Object.defineProperty(obj, prop, {
            get: function() {
                Observation.add(obj, prop);
                return data[prop];
            },
            set: function(value){
                var old = data[prop];
                if (Array.isArray(value) || canReflect.isPlainObject(value)) {
                    value = observeMutate(value);
                }
                var change = old !== value;
                if (change) {
                    data[prop] = value;
                    (handlers[prop] || []).forEach(function(handler){
                        canBatch.queue([handler, this, [value]]);
                    }, this);
                }
                return true;
            }
        });
    });
    return obj;
};

var initializeMutableArrPrototype = function() {
    var arrProto = Array.prototype;
    var mutableArrayPrototype = Object.create(Array.prototype);
    var mutateMethods = {"push": true, "pop": true, "shift": true, "unshift": true, "splice": true, "sort": true, "reverse": true};

    Object.getOwnPropertyNames(Array.prototype).forEach(function(prop) {
    	if (typeof Array.prototype[prop] !== "function") {
    		return;
    	}
        if (mutateMethods[prop]) {
            mutableArrayPrototype[prop] = function() {
                var handlers = this[observableDataSymbol].handlers;
                handlers.length = handlers.length || [];
                var args = arguments;
                arrProto[prop].apply(this, arguments);
                handlers.length.forEach(function(handler){
                    canBatch.queue([handler, this, args]);
                }, this);
            };
        } else {
            mutableArrayPrototype[prop] = function() {
                Observation.add(this, "length");
                arrProto.forEach.call(this, function(v, key) {
                	Observation.add(this, key);
                }.bind(this));
                return arrProto[prop].apply(this, arguments);
            };
        }
    });
    mutableArrayPrototype[Symbol.species] = mutableArrayPrototype.constructor;
    return mutableArrayPrototype;
};


var observeArray = function(arr) {
    var mutableArrayPrototype = initializeMutableArrPrototype();
    Object.setPrototypeOf(arr, mutableArrayPrototype);

    // var meta = arr[observableDataSymbol] = {handlers: []};
    // var handlers = meta.handlers;

    // canReflect.assignSymbols(arr, {
    //     "can.onValue": function(handler) {
    //         handlers.push(handler);
    //     },
    //     "can.offValue": function(handler) {
    //         var index = handlers.indexOf(handler);
    //         if (index >= 0 ) {
    //             handlers.splice(index, 1);
    //         }
    //     }
    // });
    return observeObject(arr);
};

module.exports = observeMutate;
