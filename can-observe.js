"use strict";
// # can-observe.js
// Assembles the final observe export.
var makeObject = require("./src/-make-object");
var makeArray = require("./src/-make-array");
var makeFunction = require("./src/-make-function");
var makeObserve = require("./src/-make-observe");
var ObserveObject = require("./object/object");
var ObserveArray = require("./array/array");

var computedHelpers = require("./src/-computed-helpers");
var decorators = require("./decorators/decorators");

makeObserve.object = function(object) {
	return makeObject.observable(object, makeObserve);
};
makeObserve.array = function(array) {
	return makeArray.observable(array, makeObserve);
};
makeObserve.function = function(array) {
	return makeFunction.observable(array, makeObserve);
};
makeObserve.observe.Object = ObserveObject;
makeObserve.observe.Array = ObserveArray;

module.exports = makeObserve.observe;

module.exports.defineProperty = function(prototype, prop, makeObservable) {
	computedHelpers.ensureDefinition(prototype)[prop] = makeObservable;
};

for (var key in decorators) {
	module.exports[key] = decorators[key];
}
