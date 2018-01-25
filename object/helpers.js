var Observation = require("can-observation");
var computedHelpers = require("../src/-computed-helpers");
var canSymbol = require("can-symbol");
var computedPropertyDefinitionSymbol = canSymbol.for("can.computedPropertyDefinitions");

var helpers = module.exports = {
	ensureComputedPropertyDefinitions: function(prototype) {
		return computedHelpers.ensureDefinition(prototype);
	},
	addComputedPropertyDefinition: function(prototype, prop, makeObservable) {
		computedHelpers.ensureDefinition(prototype)[prop] = makeObservable;
	},
};
