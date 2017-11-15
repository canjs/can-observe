var makeArray = require("./src/-make-array");
var makeObject = require("./src/-make-array");
var makeObserve = require("./src/-make-observe");

makeObserve.object = function(object){
	return makeObject.observable(object, makeObserve);
};
makeObserve.array = function(array){
	return makeArray.observable(array, makeObserve);
};

module.exports = makeObserve.observe;
