var canSymbol = require("can-symbol");

var getKeyDependenciesSymbol = canSymbol.for("can.getKeyDependencies");
var computedDefinitionsSymbol = canSymbol.for("can.computedDefinitions");

module.exports = function addGetterKeyDependencies(obj) {
	obj[getKeyDependenciesSymbol] = function getKeyDependencies(key) {
		var computed = this[computedDefinitionsSymbol];

		if (computed) {
			var getObservation = computed[key];
			var observationData = getObservation && getObservation(this);

			if (observationData != null) {
				return {
					valueDependencies: new Set([ observationData.observation ])
				};
			}
		}
	};

	return obj;
};
