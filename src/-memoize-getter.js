var Observation = require("can-observation");
var ObservationRecorder = require("can-observation-recorder");
var observableStore = require("./-observable-store");

var memoizeGetter = {
    memoize: function(obj, prop, definition){

        var contextCache = new WeakMap();

        function getObservationDataFor(context){
            var observationData = contextCache.get(context);
            if(!observationData) {
                observationData = {
                    observation: new Observation(definition.get, context, {isObservable: false}),
                    count: 0,
                    forward: function(newValue, oldValue){
                        // TODO: it would be nice if we forwarded reasonLog
                        this.dispatch({
                            type: prop,
                            target: context
                        }, [newValue, oldValue]);
                    }.bind(context)
                };
                contextCache.set(context, observationData);
            }
            return observationData;
        }


        function memoized(){
            // try to find observation
            var proxy = observableStore.proxiedObjects.get(this) || this;
            var observationData = getObservationDataFor(proxy);
            ObservationRecorder.add(proxy,prop.toString());
            if( !observationData.observation.bound && ObservationRecorder.isRecording() ) {
                Observation.temporarilyBind(observationData.observation);
            }
            return observationData.observation.get();
        }

        Object.defineProperty(obj, prop,{
            enumerable: definition.enumerable,
            get: memoized
        });

        return getObservationDataFor;
    },
    bind: function(observationData){
        observationData.count++;
        if(observationData.count === 1) {
            observationData.observation.on(observationData.forward, "notify");
        }
    },
    unbind: function(observationData){
        observationData.count--;
        if(observationData.count === 0) {
            observationData.observation.off(observationData.forward, "notify");
        }
    }
};


module.exports = memoizeGetter;
