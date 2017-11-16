var makeObject = require("./src/-make-object");
var makeArray = require("./src/-make-array");
var makeFunction = require("./src/-make-function");
var makeObserve = require("./src/-make-observe");

makeObserve.object = function(object){
	return makeObject.observable(object, makeObserve);
};
makeObserve.array = function(array){
	return makeArray.observable(array, makeObserve);
};
makeObserve.function = function(array){
	return makeFunction.observable(array, makeObserve);
};

module.exports = makeObserve.observe;
