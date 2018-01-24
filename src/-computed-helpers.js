var Observation = require("can-observation");
var ObservationRecorder = require("can-observation-recorder");
var mapBindings = require("can-event-queue/map/map");

var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");
var onKeyValueSymbol = canSymbol.for("can.onKeyValue");
var offKeyValueSymbol = canSymbol.for("can.offKeyValue");
var computedPropertyDefinitionSymbol = canSymbol.for("can.computedPropertyDefinitions");
var canMeta = canSymbol.for("can.meta");

// ## ComputedObjectObservationData
// Instances of this are created to wrap the observation.
// The `.bind` and `.unbind` methods should be called when the
// instance's prop is bound or unbound.
function ComputedObjectObservationData(instance, prop, observation){
	this.instance = instance;
    this.prop = prop;
    this.observation = observation;
	this.forward = this.forward.bind(this);
}

ComputedObjectObservationData.prototype.bind = function(){
    this.bindingCount++;
    if(this.bindingCount === 1) {
        this.observation.on(this.forward, "notify");
    }
};

ComputedObjectObservationData.prototype.unbind = function(){
    this.bindingCount--;
    if(this.bindingCount === 0) {
        this.observation.off(this.forward, "notify");
    }
};

ComputedObjectObservationData.prototype.forward = function(newValue, oldValue){
	mapBindings.dispatch.call(this.instance, {
		type: this.prop,
		target: this.instance

		// patches: [{
		// 	key: this.prop,
		// 	type: "set",
		// 	value: newValue
		// }]
		// keyChanged: undefined
	}, [newValue, oldValue]);
};

ComputedObjectObservationData.prototype.bindingCount = 0;

function findComputed(instance, key) {
	var meta = instance[canMeta];
	var target = meta.target;

	var computedPropertyDefinitions = target[computedPropertyDefinitionSymbol];
	if (computedPropertyDefinitions === undefined) {
		return;
	}
	var computedPropertyDefinition = computedPropertyDefinitions[key];
	if (computedPropertyDefinition === undefined) {
		return;
	}

	if (meta.computedKeys[key] === undefined) {
		meta.computedKeys[key] = new ComputedObjectObservationData(
			instance, key,
			computedPropertyDefinition(instance, key)
		);
	}

	return meta.computedKeys[key];
}

var computedHelpers = module.exports = {
	get: function(instance, key) {
		var computedObj = findComputed(instance, key);
		if (computedObj === undefined) {
			return;
		}

		ObservationRecorder.add(instance, key.toString());
		if(computedObj.bindingCount === 0 && ObservationRecorder.isRecording()) {
			Observation.temporarilyBind(computedObj.observation);
		}

		return {
			value: canReflect.getValue(computedObj.observation),
		};
	},
	set: function(instance, key, value) {
		var computedObj = findComputed(instance, key);
		if (computedObj === undefined) {
			return false;
		}

		//!steal-remove-start //
		if (computedObj.observation[canSymbol.for("can.setValue")] === undefined) {
			// TODO: throw `key` canReflect.getName() cannot be set
		}
		//!steal-remove-end

		canReflect.setValue(computedObj.observation, value);
		return true;
	},
	bind: function(instance, key) {
		var computedObj = findComputed(instance, key);
		if (computedObj === undefined) {
			return;
		}

		computedObj.bind();
	},
	unbind: function(instance, key) {
		var computedObj = findComputed(instance, key);
		if (computedObj === undefined) {
			return;
		}

		computedObj.unbind();
	},
	addKeyDependencies: function(proxyKeys) {
		var onKeyValue = proxyKeys[onKeyValueSymbol];
		var offKeyValue = proxyKeys[offKeyValueSymbol];

		canReflect.assignSymbols(proxyKeys, {
			"can.onKeyValue": function(key, handler, queue) {
				computedHelpers.bind(this, key);

				return onKeyValue.apply(this, arguments);
			},
			"can.offKeyValue": function(key, handler, queue) {
				computedHelpers.unbind(this, key);

				return offKeyValue.apply(this, arguments);
			}
		});
	}
};
