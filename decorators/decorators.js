"use strict";

var canReflect = require("can-reflect");
var canDev = require('can-log/dev/dev');
var AsyncObservable = require("can-simple-observable/async/async");
var ResolverObservable = require("can-simple-observable/resolver/resolver");

var computedHelpers = require("../src/-computed-helpers");
function defineProperty(prototype, prop, makeObservable) {
	computedHelpers.ensureDefinition(prototype)[prop] = makeObservable;
}

function getAsyncBase(config) {
	return function(target, key, descriptor) {
		if (descriptor.get !== undefined) {
			var getter = descriptor.get;
			//!steal-remove-start
			if(process.env.NODE_ENV !== 'production') {
				if (getter.length !== 0) {
					throw new Error("getAsync decorated " + key + " on " + canReflect.getName(target) + ": getters should take no arguments.");
				}
			}
			//!steal-remove-end

			return defineProperty(target, key, function(instance, property) {
				function fn(lastSet, resolve) {
					if (!resolve) {
						return config.default;
					}

					var promise = getter.call(this, true);
					if (canReflect.isPromise(promise)) {
						promise.then(resolve);
						return config.default;
					}
					//!steal-remove-start
					else if (promise !== undefined) {
						if(process.env.NODE_ENV !== 'production') {
							throw new Error("getAsync decorated " + key + " on " + canReflect.getName(target) + ": getters must return undefined or a promise.");
						}
					}
					//!steal-remove-end
				}

				//!steal-remove-start
				if(process.env.NODE_ENV !== 'production') {
					canReflect.assignSymbols(fn, {
						"can.getName": function() {
							return canReflect.getName(getter) + " getter";
						},
					});
				}
				//!steal-remove-end

				return new AsyncObservable(fn, instance, config.default);
			});
		}

		if (descriptor.value !== undefined) {
			var method = descriptor.value;
			//!steal-remove-start
			if(process.env.NODE_ENV !== 'production') {
				if (method.length !== 1) {
					throw new Error("getAsync decorated " + key + " on " + canReflect.getName(target) + ": methods should take 1 argument (resolve).");
				}
			}
			//!steal-remove-end

			return defineProperty(target, key, function(instance, property) {
				return new AsyncObservable(function(lastSet, resolve) {
					return method.call(this, resolve);
				}, instance, config.default);
			});
		}

		//!steal-remove-start
		if(process.env.NODE_ENV !== 'production') {
			throw new Error("getAsync decorated " + key + " on " + canReflect.getName(target) + ": Unrecognized descriptor.");
		}
		//!steal-remove-end
	};
}

function resolvedByBase(config) {
	return function(target, key, descriptor) {
		if (descriptor.value !== undefined) {
			var method = descriptor.value;
			//!steal-remove-start
			if(process.env.NODE_ENV !== 'production') {
				if (method.length !== 1) {
					throw new Error("resolvedBy decorated " + key + " on " + canReflect.getName(target) + ": methods should take 1 argument (value).");
				}
			}
			//!steal-remove-end

			return defineProperty(target, key, function(instance, property) {
				return new ResolverObservable(method, instance);
			});
		}

		//!steal-remove-start
		if(process.env.NODE_ENV !== 'production') {
			throw new Error("resolvedBy decorated " + key + " on " + canReflect.getName(target) + ": Unrecognized descriptor.");
		}
		//!steal-remove-end
	};
}

function optionalConfig(decorator) {
	function wrapper(config) {
		if (arguments.length === 3) {
			return decorator({}).apply(null, arguments);
		}

		return decorator(config);
	}

	//!steal-remove-start
	if(process.env.NODE_ENV !== 'production') {
		Object.defineProperty(wrapper, "name", {
			value: canReflect.getName(decorator.name)
		});
	}
	//!steal-remove-end

	return wrapper;
}

var hasWarnedAsync = false;
var hasWarnedResolver = false;

module.exports = {
	getAsync: optionalConfig(getAsyncBase),
	resolvedBy: optionalConfig(resolvedByBase),

	async: optionalConfig(function() {
		//!steal-remove-start
		if (!hasWarnedAsync) {
			canDev.warn('can-observe/decorators/async is deprecated; use can-observe/decorators/getAsync');
			hasWarnedAsync = true;
		}
		//!steal-remove-end

		return getAsyncBase.apply(this, arguments);
	}),
	resolver: optionalConfig(function() {
		//!steal-remove-start
		if (!hasWarnedResolver) {
			canDev.warn('can-observe/decorators/resolver is deprecated; use can-observe/decorators/resolvedBy');
			hasWarnedResolver = true;
		}
		//!steal-remove-end

		return resolvedByBase.apply(this, arguments);
	}),
};
