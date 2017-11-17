var makeObject = require("./src/-make-object");
var makeArray = require("./src/-make-array");
var makeFunction = require("./src/-make-function");
var makeObserve = require("./src/-make-observe");
var canReflect = require("can-reflect");

makeObserve.object = function(object) {
	return makeObject.observable(object, makeObserve);
};
makeObserve.array = function(array) {
	return makeArray.observable(array, makeObserve);
};
makeObserve.function = function(array) {
	return makeFunction.observable(array, makeObserve);
};

makeObserve.observe.makeMapType = function(name, staticProps, prototypeProps){
	var Type = function(props){
		canReflect.assign(this, props || {});
	};
	canReflect.assign(Type, staticProps || {});
	canReflect.assign(Type.prototype, prototypeProps || {});

	//!steal-remove-start
	Object.defineProperty(Type, "name", {
		value: name
	});
	//!steal-remove-end

	return makeObserve.observe(Type);
};

makeObserve.observe.makeMapType = function(name, staticProps, prototypeProps){
	var Type = function(props){
		canReflect.assign(this, props || {});
	};
	canReflect.assign(Type, staticProps || {});
	canReflect.assign(Type.prototype, prototypeProps || {});

	//!steal-remove-start
	Object.defineProperty(Type, "name", {
		value: name
	});
	//!steal-remove-end

	return makeObserve.observe(Type);
};
makeObserve.observe.makeListType = function(name, staticProps, prototypeProps){
	var Type = function(values) {
		this.push.apply(this, arguments);
	};
	Type.prototype = Object.create(Array.prototype);
	canReflect.assign(Type, staticProps || {});
	canReflect.assign(Type.prototype, prototypeProps || {});
	Type.prototype.constructor = Type;

	//!steal-remove-start
	Object.defineProperty(Type, "name", {
		value: name
	});
	//!steal-remove-end

	return makeObserve.observe(Type);
};


module.exports = makeObserve.observe;
