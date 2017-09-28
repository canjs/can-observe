var cid = require("can-cid");
var canEvent = require("can-event");
var canBatch = require("can-event/batch/batch");
var Observation = require("can-observation");
var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");

var has = Object.prototype.hasOwnProperty;
var observableDataSymbol = canSymbol.for("can.observeData")

var observeMutate = function(obj) {
    if(Array.isArray(obj)) {
        return observeArray(obj);
    } else if (canReflect.isPlainObject(obj)) {
        return observeObject(obj);
    }
};

var observeObject = function(obj) {

    if(obj[observableDataSymbol]) {
        return obj;
    } else {
        Object.defineProperty(obj, "_cid", {
            value: cid({}),
            enumerable: false
        })
    }
    var meta = obj[observableDataSymbol] = {handlers: {}, data:{}};
    var data = meta.data;
    var handlers = meta.handlers; // new KeyTree(Object,Array)

    canReflect.assignSymbols(obj, {
        "can.onKeyValue": function(key, handler){
            // handlers.add([key, handler]);
            var keyHandlers = handlers[key];
            if (!keyHandlers) {
                keyHandlers = handlers[key] = [];
            }
            keyHandlers.push(handler)
        },
        "can.offKeyValue": function(key, handler){
            // handlers.delete([key, handler])
            var keyHandlers = handlers[key];
            if(keyHandlers) {
                var index = keyHandlers.indexOf(handler);
                if(index >= 0 ) {
                    keyHandlers.splice(index, 1);
                }
            }
        }
    })

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
        })
    })
    return obj;
}

var observeArray = function(arr) {
    console.log(arr, 'decorating array')
    return arr;
}

module.exports = observeMutate;


