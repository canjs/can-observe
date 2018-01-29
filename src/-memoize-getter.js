// # -memoize-getter.js
// Exports a function that rewrites a getter to use an Observation
// under-the-hood.  This makes it so getters are cached.
// The observations are created lazily for each instance.

var Observation = require("can-observation");
var ObservationRecorder = require("can-observation-recorder");
var observableStore = require("./-observable-store");

// ## MemoizedGetterObservationData
// Instances of this are created to wrap the observation.
// The `.bind` and `.unbind` methods should be called when the
// instance's key is bound or unbound.
function MemoizedGetterObservationData(instance, prop, getter){
    this.prop = prop;
    this.instance = instance;
    this.forward = this.forward.bind(this);
    this.observation = new Observation(getter, instance, {isObservable: false});
}

MemoizedGetterObservationData.prototype.bind = function(observationData){
    this.bindingCount++;
    if(this.bindingCount === 1) {
        this.observation.on(this.forward, "notify");
    }
};
MemoizedGetterObservationData.prototype.unbind = function(observationData){
    this.bindingCount--;
    if(this.bindingCount === 0) {
        this.observation.off(this.forward, "notify");
    }
};
MemoizedGetterObservationData.prototype.forward = function(newValue, oldValue){
    this.instance.dispatch({
        type: this.prop,
        target: this.instance
    }, [newValue, oldValue]);
};
MemoizedGetterObservationData.prototype.bindingCount = 0;



// ## memoize
// Changes a `getter` to use an observation.
//
// - Type - A constructor function.
// - prop - A property name.
// - definition - A property definition that includes a `.get`.
//
// Returns a `getObservationDataFor(instance)` that will return or create an instance
// of `MemoizedGetterObservationData` for the instance passed in. 
module.exports = function memoize(Type, prop, definition){

    // Store the observation data for each instance.
    var instanceToObservationData = new WeakMap();

    // Returns or creates the observation data for the instance.
    function getObservationDataFor(instance){
        var observationData = instanceToObservationData.get(instance);
        if(!observationData) {
            observationData = new MemoizedGetterObservationData(instance, prop, definition.get);
            instanceToObservationData.set(instance, observationData);
        }
        return observationData;
    }

    // Overwrite the getter to read from the observation.
    Object.defineProperty(Type, prop,{
        enumerable: definition.enumerable,
        get: function memoized(){
            // Get the instance and its observation data.
            var instance = observableStore.proxiedObjects.get(this) || this;
            var observationData = getObservationDataFor(instance);

            ObservationRecorder.add(instance,prop.toString());
            if( !observationData.observation.bound && ObservationRecorder.isRecording() ) {
                Observation.temporarilyBind(observationData.observation);
            }
            return observationData.observation.get();
        }
    });

    return getObservationDataFor;
};
