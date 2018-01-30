var AsyncObservable = require("can-simple-observable/async/async");
var ResolverObservable = require("can-simple-observable/resolver/resolver");
var observeObjectHelpers = require("./helpers");
var addComputedPropertyDefinition = observeObjectHelpers.addComputedPropertyDefinition;

function asyncGetter(config) {
	return function(target, key, descriptor) {
		if (descriptor.get !== undefined) {
			var getter = descriptor.get;
			//!steal-remove-start
			if (getter.length !== 0) {
				throw new Error("asyncGetter decorator: getters should take no arguments.");
			}
			//!steal-remove-end

			return addComputedPropertyDefinition(target, key, function(instance, property) {
				var observable = new AsyncObservable(function() {
					var promise = getter.call(this);
					if (promise !== undefined) {
						if (promise !== null && typeof promise.then === "function") {
							promise.then(observable.resolve);
						}
						//!steal-remove-start
						else {
							throw new Error("asyncGetter: getters must return undefined or a promise.");
						}
						//!steal-remove-end
					}
				}, instance, config.default);

				return observable;
			});
		}

		if (descriptor.value !== undefined) {
			var method = descriptor.value;
			//!steal-remove-start
			if (method.length !== 1) {
				throw new Error("asyncGetter decorator: methods should take 1 argument (resolve).");
			}
			//!steal-remove-end

			return addComputedPropertyDefinition(target, key, function(instance, property) {
				var observable = new AsyncObservable(function() {
					method.call(this, observable.resolve);
				}, instance, config.default);

				return observable;
			});
		}

		//!steal-remove-start
		throw new Error("asyncGetter decorator: Unrecognized descriptor.");
		//!steal-remove-end
	};
}

function resolver(config) {
	return function(target, key, descriptor) {
		if (descriptor.value !== undefined) {
			var method = descriptor.value;
			//!steal-remove-start
			if (method.length !== 1) {
				throw new Error("resolver decorator: methods should take 1 argument (value).");
			}
			//!steal-remove-end

			return addComputedPropertyDefinition(target, key, function(instance, property) {
				return new ResolverObservable(method, instance);
			});
		}

		//!steal-remove-start
		throw new Error("resolver decorator: Unrecognized descriptor.");
		//!steal-remove-end
	};
}


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
	resolver: optionalConfig(resolver),
};
