/*can-observe@2.0.0#src/-memoize-getter*/
define([
    'require',
    'exports',
    'module',
    'can-observation',
    'can-observation-recorder',
    './-observable-store'
], function (require, exports, module) {
    var Observation = require('can-observation');
    var ObservationRecorder = require('can-observation-recorder');
    var observableStore = require('./-observable-store');
    function MemoizedGetterObservationData(instance, prop, getter) {
        this.prop = prop;
        this.instance = instance;
        this.forward = this.forward.bind(this);
        this.observation = new Observation(getter, instance, { isObservable: false });
    }
    MemoizedGetterObservationData.prototype.bind = function (observationData) {
        this.bindingCount++;
        if (this.bindingCount === 1) {
            this.observation.on(this.forward, 'notify');
        }
    };
    MemoizedGetterObservationData.prototype.unbind = function (observationData) {
        this.bindingCount--;
        if (this.bindingCount === 0) {
            this.observation.off(this.forward, 'notify');
        }
    };
    MemoizedGetterObservationData.prototype.forward = function (newValue, oldValue) {
        this.instance.dispatch({
            type: this.prop,
            target: this.instance
        }, [
            newValue,
            oldValue
        ]);
    };
    MemoizedGetterObservationData.prototype.bindingCount = 0;
    module.exports = function memoize(Type, prop, definition) {
        var instanceToObservationData = new WeakMap();
        function getObservationDataFor(instance) {
            var observationData = instanceToObservationData.get(instance);
            if (!observationData) {
                observationData = new MemoizedGetterObservationData(instance, prop, definition.get);
                instanceToObservationData.set(instance, observationData);
            }
            return observationData;
        }
        Object.defineProperty(Type, prop, {
            enumerable: definition.enumerable,
            get: function memoized() {
                var instance = observableStore.proxiedObjects.get(this) || this;
                var observationData = getObservationDataFor(instance);
                ObservationRecorder.add(instance, prop.toString());
                if (!observationData.observation.bound && ObservationRecorder.isRecording()) {
                    Observation.temporarilyBind(observationData.observation);
                }
                return observationData.observation.get();
            }
        });
        return getObservationDataFor;
    };
});