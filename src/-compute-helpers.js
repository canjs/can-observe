var Observation = require("can-observation");
var ObservationRecorder = require("can-observation-recorder");
var canReflect = require("can-reflect");

var peek = ObservationRecorder.ignore(canReflect.getValue.bind(canReflect));

var metaSymbol = canSymbol.for("can.meta");

module.exports = {
    computeObj: function(map, prop, observable) {
		var computeObj = {
			oldValue: undefined,
			compute: observable,
			count: 0,
			handler: function(newVal) {
				var oldValue = computeObj.oldValue;
				computeObj.oldValue = newVal;

				map.dispatch({
					type: prop,
					target: map
				}, [newVal, oldValue]);
			}
		};
		return computeObj;
	},
    getComputeObj: function(map, prop){
        var meta = map[metaSymbol].computed[pr]
    },
    has: function(map, prop){
        var defs = map[canSymbol.for("computedPropertyDefinitions")];
        if(defs && defs[prop]) {
            return true;
        }
    },
    get: function(map, prop) {

    },
    getKeyValue: function(map, prop, computeObj ) {
        var observable = computeObj.compute;
		if (ObservationRecorder.isRecording()) {
			ObservationRecorder.add(map, prop);
			if (!canReflect.isBound(observable)) {
				Observation.temporarilyBind(observable);
			}
		}

		return peek(observable);
    },
    setKeyValue: function(map, prop, computeObj, val){
    	canReflect.setValue( computeObj.compute, val );
    },
    bind: function(instance, key) {
    	var computedBinding = instance._computed && instance._computed[key];
    	if (computedBinding && computedBinding.compute) {
    		if (!computedBinding.count) {
    			computedBinding.count = 1;
    			canReflect.onValue(computedBinding.compute, computedBinding.handler, "notify");
    			computedBinding.oldValue = canReflect.getValue(computedBinding.compute);
    		} else {
    			computedBinding.count++;
    		}

    	}
    },
    unbind: function(instance, key){
    	var computedBinding = instance._computed && instance._computed[key];
    	if (computedBinding) {
    		if (computedBinding.count === 1) {
    			computedBinding.count = 0;
    			canReflect.offValue(computedBinding.compute, computedBinding.handler,"notify");
    		} else {
    			computedBinding.count--;
    		}
    	}
    }
};
