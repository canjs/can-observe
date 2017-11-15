var canReflect = require("can-reflect");
var observables = require("./-observable-store");

var makeObserve = {
    observe: function(value){
        if(canReflect.isPrimitive(value)) {
            return value;
        }
        var observable = observables.get(value)
        if(observable) {
            return observable;
        }
        if(typeof value === "function") {
            if(makeObserve.function) {
                observable = makeObserve.function(value);
            } else {
                observable = value;
            }
        } else if(Array.isArray(value)) {
            if(makeObserve.array) {
                observable = makeObserve.array(value);
            } else {
                observable = value;
            }
        } else {
            if(makeObserve.object) {
                observable = makeObserve.object(value);
            } else {
                observable = value;
            }
        }
        observables.set(value, observable);
        observables.set(observable, observable);
        return observable;
    }
};

module.exports = makeObserve;
