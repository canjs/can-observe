
var can = require("can/util/");
var event = require("can/event/")
var compute = require("can/compute/");



module.exports = function(obj){
	
	can.cid(obj);
	obj.bind = event.bind;
	obj.unbind = event.unbind;
	var p = new Proxy(obj, {
		get: function(target, name){
			if(name !== "_cid" && target.hasOwnProperty(name)) {
				can.__observe(target, name);
			}
			return target[name];
		},
		set: function(target, key, value){
			var old = target[key];
			var change = old !== value;
			target[key] = value;
			can.batch.trigger(target, key, [value, old]);
			return true;
		}
	});
	
	
	return p;
};
