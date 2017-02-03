
var cid = require("can-cid");
var canEvent = require("can-event");
var canBatch = require("can-event/batch/batch");
var Observation = require("can-observation");

var has = Object.prototype.hasOwnProperty;

module.exports = function(obj){
  cid(obj);
	obj.addEventListener = canEvent.addEventListener;
	obj.removeEventListener = canEvent.removeEventListener;
	var p = new Proxy(obj, {
		get: function(target, name){
			if(name !== "_cid" && has.call(target, name)) {
        		Observation.add(target, name);
			}
			return target[name];
		},
		set: function(target, key, value){
			var old = target[key];
			var change = old !== value;
			if(change) {
				target[key] = value;
				canBatch.dispatch.call(target, {
					type: key,
					target: target
				}, [value, old]);
			}
			return true;
		}
	});

	return p;
};
