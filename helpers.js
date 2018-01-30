var computedHelpers = require("../src/-computed-helpers");

module.exports = {
	ensureComputedPropertyDefinitions: function(prototype) {
		return computedHelpers.ensureDefinition(prototype);
	},
	addComputedPropertyDefinition: function(prototype, prop, makeObservable) {
		computedHelpers.ensureDefinition(prototype)[prop] = makeObservable;
	},
};
