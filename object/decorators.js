var observeObjectHelpers = require("./helpers");
var addComputedPropertyDefinition = observeObjectHelpers.addComputedPropertyDefinition;



function optionalConfig(decorator) {
	function wrapper() {
		if (arguments.length === 3) {
			return decorator({}).apply(null, arguments);
		}

		return decorator(config);
	}

	//!steal-remove-start
	wrapper.name = decorator.name;
	//!steal-remove-end

	return wrapper;
}

module.exports = {
	asyncGetter: optionalConfig(asyncGetter),
};
