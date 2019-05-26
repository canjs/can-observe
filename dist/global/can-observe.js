/*[process-shim]*/
(function(global, env) {
	// jshint ignore:line
	if (typeof process === "undefined") {
		global.process = {
			argv: [],
			cwd: function() {
				return "";
			},
			browser: true,
			env: {
				NODE_ENV: env || "development"
			},
			version: "",
			platform:
				global.navigator &&
				global.navigator.userAgent &&
				/Windows/.test(global.navigator.userAgent)
					? "win"
					: ""
		};
	}
})(
	typeof self == "object" && self.Object == Object
		? self
		: typeof process === "object" &&
		  Object.prototype.toString.call(process) === "[object process]"
			? global
			: window,
	"development"
);

/*[global-shim-start]*/
(function(exports, global, doEval) {
	// jshint ignore:line
	var origDefine = global.define;

	var get = function(name) {
		var parts = name.split("."),
			cur = global,
			i;
		for (i = 0; i < parts.length; i++) {
			if (!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var set = function(name, val) {
		var parts = name.split("."),
			cur = global,
			i,
			part,
			next;
		for (i = 0; i < parts.length - 1; i++) {
			part = parts[i];
			next = cur[part];
			if (!next) {
				next = cur[part] = {};
			}
			cur = next;
		}
		part = parts[parts.length - 1];
		cur[part] = val;
	};
	var useDefault = function(mod) {
		if (!mod || !mod.__esModule) return false;
		var esProps = { __esModule: true, default: true };
		for (var p in mod) {
			if (!esProps[p]) return false;
		}
		return true;
	};

	var hasCjsDependencies = function(deps) {
		return (
			deps[0] === "require" && deps[1] === "exports" && deps[2] === "module"
		);
	};

	var modules =
		(global.define && global.define.modules) ||
		(global._define && global._define.modules) ||
		{};
	var ourDefine = (global.define = function(moduleName, deps, callback) {
		var module;
		if (typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for (i = 0; i < deps.length; i++) {
			args.push(
				exports[deps[i]]
					? get(exports[deps[i]])
					: modules[deps[i]] || get(deps[i])
			);
		}
		// CJS has no dependencies but 3 callback arguments
		if (hasCjsDependencies(deps) || (!deps.length && callback.length)) {
			module = { exports: {} };
			args[0] = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args[1] = module.exports;
			args[2] = module;
		} else if (!args[0] && deps[0] === "exports") {
			// Babel uses the exports and module object.
			module = { exports: {} };
			args[0] = module.exports;
			if (deps[1] === "module") {
				args[1] = module;
			}
		} else if (!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		result = module && module.exports ? module.exports : result;
		modules[moduleName] = result;

		// Set global exports
		var globalExport = exports[moduleName];
		if (globalExport && !get(globalExport)) {
			if (useDefault(result)) {
				result = result["default"];
			}
			set(globalExport, result);
		}
	});
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function() {
		// shim for @@global-helpers
		var noop = function() {};
		return {
			get: function() {
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load) {
				doEval(__load.source, global);
			}
		};
	});
})(
	{ "can-util/namespace": "can" },
	typeof self == "object" && self.Object == Object
		? self
		: typeof process === "object" &&
		  Object.prototype.toString.call(process) === "[object process]"
			? global
			: window,
	function(__$source__, __$global__) {
		// jshint ignore:line
		eval("(function() { " + __$source__ + " \n }).call(__$global__);");
	}
);

/*can-namespace@1.0.0#can-namespace*/
define('can-namespace', function (require, exports, module) {
    module.exports = {};
});
/*can-symbol@1.6.4#can-symbol*/
define('can-symbol', [
    'require',
    'exports',
    'module',
    'can-namespace'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var namespace = require('can-namespace');
        var supportsNativeSymbols = function () {
            var symbolExists = typeof Symbol !== 'undefined' && typeof Symbol.for === 'function';
            if (!symbolExists) {
                return false;
            }
            var symbol = Symbol('a symbol for testing symbols');
            return typeof symbol === 'symbol';
        }();
        var CanSymbol;
        if (supportsNativeSymbols) {
            CanSymbol = Symbol;
        } else {
            var symbolNum = 0;
            CanSymbol = function CanSymbolPolyfill(description) {
                var symbolValue = '@@symbol' + symbolNum++ + description;
                var symbol = {};
                Object.defineProperties(symbol, {
                    toString: {
                        value: function () {
                            return symbolValue;
                        }
                    }
                });
                return symbol;
            };
            var descriptionToSymbol = {};
            var symbolToDescription = {};
            CanSymbol.for = function (description) {
                var symbol = descriptionToSymbol[description];
                if (!symbol) {
                    symbol = descriptionToSymbol[description] = CanSymbol(description);
                    symbolToDescription[symbol] = description;
                }
                return symbol;
            };
            CanSymbol.keyFor = function (symbol) {
                return symbolToDescription[symbol];
            };
            [
                'hasInstance',
                'isConcatSpreadable',
                'iterator',
                'match',
                'prototype',
                'replace',
                'search',
                'species',
                'split',
                'toPrimitive',
                'toStringTag',
                'unscopables'
            ].forEach(function (name) {
                CanSymbol[name] = CanSymbol('Symbol.' + name);
            });
        }
        [
            'isMapLike',
            'isListLike',
            'isValueLike',
            'isFunctionLike',
            'getOwnKeys',
            'getOwnKeyDescriptor',
            'proto',
            'getOwnEnumerableKeys',
            'hasOwnKey',
            'hasKey',
            'size',
            'getName',
            'getIdentity',
            'assignDeep',
            'updateDeep',
            'getValue',
            'setValue',
            'getKeyValue',
            'setKeyValue',
            'updateValues',
            'addValue',
            'removeValues',
            'apply',
            'new',
            'onValue',
            'offValue',
            'onKeyValue',
            'offKeyValue',
            'getKeyDependencies',
            'getValueDependencies',
            'keyHasDependencies',
            'valueHasDependencies',
            'onKeys',
            'onKeysAdded',
            'onKeysRemoved',
            'onPatches'
        ].forEach(function (name) {
            CanSymbol.for('can.' + name);
        });
        module.exports = namespace.Symbol = CanSymbol;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-reflect@1.17.10#reflections/helpers*/
define('can-reflect/reflections/helpers', [
    'require',
    'exports',
    'module',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    module.exports = {
        makeGetFirstSymbolValue: function (symbolNames) {
            var symbols = symbolNames.map(function (name) {
                return canSymbol.for(name);
            });
            var length = symbols.length;
            return function getFirstSymbol(obj) {
                var index = -1;
                while (++index < length) {
                    if (obj[symbols[index]] !== undefined) {
                        return obj[symbols[index]];
                    }
                }
            };
        },
        hasLength: function (list) {
            var type = typeof list;
            if (type === 'string' || Array.isArray(list)) {
                return true;
            }
            var length = list && (type !== 'boolean' && type !== 'number' && 'length' in list) && list.length;
            return typeof list !== 'function' && (length === 0 || typeof length === 'number' && length > 0 && length - 1 in list);
        }
    };
});
/*can-reflect@1.17.10#reflections/type/type*/
define('can-reflect/reflections/type/type', [
    'require',
    'exports',
    'module',
    'can-symbol',
    'can-reflect/reflections/helpers'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var helpers = require('can-reflect/reflections/helpers');
    var plainFunctionPrototypePropertyNames = Object.getOwnPropertyNames(function () {
    }.prototype);
    var plainFunctionPrototypeProto = Object.getPrototypeOf(function () {
    }.prototype);
    function isConstructorLike(func) {
        var value = func[canSymbol.for('can.new')];
        if (value !== undefined) {
            return value;
        }
        if (typeof func !== 'function') {
            return false;
        }
        var prototype = func.prototype;
        if (!prototype) {
            return false;
        }
        if (plainFunctionPrototypeProto !== Object.getPrototypeOf(prototype)) {
            return true;
        }
        var propertyNames = Object.getOwnPropertyNames(prototype);
        if (propertyNames.length === plainFunctionPrototypePropertyNames.length) {
            for (var i = 0, len = propertyNames.length; i < len; i++) {
                if (propertyNames[i] !== plainFunctionPrototypePropertyNames[i]) {
                    return true;
                }
            }
            return false;
        } else {
            return true;
        }
    }
    var getNewOrApply = helpers.makeGetFirstSymbolValue([
        'can.new',
        'can.apply'
    ]);
    function isFunctionLike(obj) {
        var result, symbolValue = !!obj && obj[canSymbol.for('can.isFunctionLike')];
        if (symbolValue !== undefined) {
            return symbolValue;
        }
        result = getNewOrApply(obj);
        if (result !== undefined) {
            return !!result;
        }
        return typeof obj === 'function';
    }
    function isPrimitive(obj) {
        var type = typeof obj;
        if (obj == null || type !== 'function' && type !== 'object') {
            return true;
        } else {
            return false;
        }
    }
    var coreHasOwn = Object.prototype.hasOwnProperty;
    var funcToString = Function.prototype.toString;
    var objectCtorString = funcToString.call(Object);
    function isPlainObject(obj) {
        if (!obj || typeof obj !== 'object') {
            return false;
        }
        var proto = Object.getPrototypeOf(obj);
        if (proto === Object.prototype || proto === null) {
            return true;
        }
        var Constructor = coreHasOwn.call(proto, 'constructor') && proto.constructor;
        return typeof Constructor === 'function' && Constructor instanceof Constructor && funcToString.call(Constructor) === objectCtorString;
    }
    function isBuiltIn(obj) {
        if (isPrimitive(obj) || Array.isArray(obj) || isPlainObject(obj) || Object.prototype.toString.call(obj) !== '[object Object]' && Object.prototype.toString.call(obj).indexOf('[object ') !== -1) {
            return true;
        } else {
            return false;
        }
    }
    function isValueLike(obj) {
        var symbolValue;
        if (isPrimitive(obj)) {
            return true;
        }
        symbolValue = obj[canSymbol.for('can.isValueLike')];
        if (typeof symbolValue !== 'undefined') {
            return symbolValue;
        }
        var value = obj[canSymbol.for('can.getValue')];
        if (value !== undefined) {
            return !!value;
        }
    }
    function isMapLike(obj) {
        if (isPrimitive(obj)) {
            return false;
        }
        var isMapLike = obj[canSymbol.for('can.isMapLike')];
        if (typeof isMapLike !== 'undefined') {
            return !!isMapLike;
        }
        var value = obj[canSymbol.for('can.getKeyValue')];
        if (value !== undefined) {
            return !!value;
        }
        return true;
    }
    var onValueSymbol = canSymbol.for('can.onValue'), onKeyValueSymbol = canSymbol.for('can.onKeyValue'), onPatchesSymbol = canSymbol.for('can.onPatches');
    function isObservableLike(obj) {
        if (isPrimitive(obj)) {
            return false;
        }
        return Boolean(obj[onValueSymbol] || obj[onKeyValueSymbol] || obj[onPatchesSymbol]);
    }
    function isListLike(list) {
        var symbolValue, type = typeof list;
        if (type === 'string') {
            return true;
        }
        if (isPrimitive(list)) {
            return false;
        }
        symbolValue = list[canSymbol.for('can.isListLike')];
        if (typeof symbolValue !== 'undefined') {
            return symbolValue;
        }
        var value = list[canSymbol.iterator];
        if (value !== undefined) {
            return !!value;
        }
        if (Array.isArray(list)) {
            return true;
        }
        return helpers.hasLength(list);
    }
    var supportsNativeSymbols = function () {
        var symbolExists = typeof Symbol !== 'undefined' && typeof Symbol.for === 'function';
        if (!symbolExists) {
            return false;
        }
        var symbol = Symbol('a symbol for testing symbols');
        return typeof symbol === 'symbol';
    }();
    var isSymbolLike;
    if (supportsNativeSymbols) {
        isSymbolLike = function (symbol) {
            return typeof symbol === 'symbol';
        };
    } else {
        var symbolStart = '@@symbol';
        isSymbolLike = function (symbol) {
            if (typeof symbol === 'object' && !Array.isArray(symbol)) {
                return symbol.toString().substr(0, symbolStart.length) === symbolStart;
            } else {
                return false;
            }
        };
    }
    module.exports = {
        isConstructorLike: isConstructorLike,
        isFunctionLike: isFunctionLike,
        isListLike: isListLike,
        isMapLike: isMapLike,
        isObservableLike: isObservableLike,
        isPrimitive: isPrimitive,
        isBuiltIn: isBuiltIn,
        isValueLike: isValueLike,
        isSymbolLike: isSymbolLike,
        isMoreListLikeThanMapLike: function (obj) {
            if (Array.isArray(obj)) {
                return true;
            }
            if (obj instanceof Array) {
                return true;
            }
            if (obj == null) {
                return false;
            }
            var value = obj[canSymbol.for('can.isMoreListLikeThanMapLike')];
            if (value !== undefined) {
                return value;
            }
            var isListLike = this.isListLike(obj), isMapLike = this.isMapLike(obj);
            if (isListLike && !isMapLike) {
                return true;
            } else if (!isListLike && isMapLike) {
                return false;
            }
        },
        isIteratorLike: function (obj) {
            return obj && typeof obj === 'object' && typeof obj.next === 'function' && obj.next.length === 0;
        },
        isPromise: function (obj) {
            return obj instanceof Promise || Object.prototype.toString.call(obj) === '[object Promise]';
        },
        isPlainObject: isPlainObject
    };
});
/*can-reflect@1.17.10#reflections/call/call*/
define('can-reflect/reflections/call/call', [
    'require',
    'exports',
    'module',
    'can-symbol',
    'can-reflect/reflections/type/type'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var typeReflections = require('can-reflect/reflections/type/type');
    module.exports = {
        call: function (func, context) {
            var args = [].slice.call(arguments, 2);
            var apply = func[canSymbol.for('can.apply')];
            if (apply) {
                return apply.call(func, context, args);
            } else {
                return func.apply(context, args);
            }
        },
        apply: function (func, context, args) {
            var apply = func[canSymbol.for('can.apply')];
            if (apply) {
                return apply.call(func, context, args);
            } else {
                return func.apply(context, args);
            }
        },
        'new': function (func) {
            var args = [].slice.call(arguments, 1);
            var makeNew = func[canSymbol.for('can.new')];
            if (makeNew) {
                return makeNew.apply(func, args);
            } else {
                var context = Object.create(func.prototype);
                var ret = func.apply(context, args);
                if (typeReflections.isPrimitive(ret)) {
                    return context;
                } else {
                    return ret;
                }
            }
        }
    };
});
/*can-reflect@1.17.10#reflections/get-set/get-set*/
define('can-reflect/reflections/get-set/get-set', [
    'require',
    'exports',
    'module',
    'can-symbol',
    'can-reflect/reflections/type/type'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var typeReflections = require('can-reflect/reflections/type/type');
    var setKeyValueSymbol = canSymbol.for('can.setKeyValue'), getKeyValueSymbol = canSymbol.for('can.getKeyValue'), getValueSymbol = canSymbol.for('can.getValue'), setValueSymbol = canSymbol.for('can.setValue');
    var reflections = {
        setKeyValue: function (obj, key, value) {
            if (typeReflections.isSymbolLike(key)) {
                if (typeof key === 'symbol') {
                    obj[key] = value;
                } else {
                    Object.defineProperty(obj, key, {
                        enumerable: false,
                        configurable: true,
                        value: value,
                        writable: true
                    });
                }
                return;
            }
            var setKeyValue = obj[setKeyValueSymbol];
            if (setKeyValue !== undefined) {
                return setKeyValue.call(obj, key, value);
            } else {
                obj[key] = value;
            }
        },
        getKeyValue: function (obj, key) {
            var getKeyValue = obj[getKeyValueSymbol];
            if (getKeyValue) {
                return getKeyValue.call(obj, key);
            }
            return obj[key];
        },
        deleteKeyValue: function (obj, key) {
            var deleteKeyValue = obj[canSymbol.for('can.deleteKeyValue')];
            if (deleteKeyValue) {
                return deleteKeyValue.call(obj, key);
            }
            delete obj[key];
        },
        getValue: function (value) {
            if (typeReflections.isPrimitive(value)) {
                return value;
            }
            var getValue = value[getValueSymbol];
            if (getValue) {
                return getValue.call(value);
            }
            return value;
        },
        setValue: function (item, value) {
            var setValue = item && item[setValueSymbol];
            if (setValue) {
                return setValue.call(item, value);
            } else {
                throw new Error('can-reflect.setValue - Can not set value.');
            }
        },
        splice: function (obj, index, removing, adding) {
            var howMany;
            if (typeof removing !== 'number') {
                var updateValues = obj[canSymbol.for('can.updateValues')];
                if (updateValues) {
                    return updateValues.call(obj, index, removing, adding);
                }
                howMany = removing.length;
            } else {
                howMany = removing;
            }
            if (arguments.length <= 3) {
                adding = [];
            }
            var splice = obj[canSymbol.for('can.splice')];
            if (splice) {
                return splice.call(obj, index, howMany, adding);
            }
            return [].splice.apply(obj, [
                index,
                howMany
            ].concat(adding));
        },
        addValues: function (obj, adding, index) {
            var add = obj[canSymbol.for('can.addValues')];
            if (add) {
                return add.call(obj, adding, index);
            }
            if (Array.isArray(obj) && index === undefined) {
                return obj.push.apply(obj, adding);
            }
            return reflections.splice(obj, index, [], adding);
        },
        removeValues: function (obj, removing, index) {
            var removeValues = obj[canSymbol.for('can.removeValues')];
            if (removeValues) {
                return removeValues.call(obj, removing, index);
            }
            if (Array.isArray(obj) && index === undefined) {
                removing.forEach(function (item) {
                    var index = obj.indexOf(item);
                    if (index >= 0) {
                        obj.splice(index, 1);
                    }
                });
                return;
            }
            return reflections.splice(obj, index, removing, []);
        }
    };
    reflections.get = reflections.getKeyValue;
    reflections.set = reflections.setKeyValue;
    reflections['delete'] = reflections.deleteKeyValue;
    module.exports = reflections;
});
/*can-reflect@1.17.10#reflections/observe/observe*/
define('can-reflect/reflections/observe/observe', [
    'require',
    'exports',
    'module',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var slice = [].slice;
    function makeFallback(symbolName, fallbackName) {
        return function (obj, event, handler, queueName) {
            var method = obj[canSymbol.for(symbolName)];
            if (method !== undefined) {
                return method.call(obj, event, handler, queueName);
            }
            return this[fallbackName].apply(this, arguments);
        };
    }
    function makeErrorIfMissing(symbolName, errorMessage) {
        return function (obj) {
            var method = obj[canSymbol.for(symbolName)];
            if (method !== undefined) {
                var args = slice.call(arguments, 1);
                return method.apply(obj, args);
            }
            throw new Error(errorMessage);
        };
    }
    module.exports = {
        onKeyValue: makeFallback('can.onKeyValue', 'onEvent'),
        offKeyValue: makeFallback('can.offKeyValue', 'offEvent'),
        onKeys: makeErrorIfMissing('can.onKeys', 'can-reflect: can not observe an onKeys event'),
        onKeysAdded: makeErrorIfMissing('can.onKeysAdded', 'can-reflect: can not observe an onKeysAdded event'),
        onKeysRemoved: makeErrorIfMissing('can.onKeysRemoved', 'can-reflect: can not unobserve an onKeysRemoved event'),
        getKeyDependencies: makeErrorIfMissing('can.getKeyDependencies', 'can-reflect: can not determine dependencies'),
        getWhatIChange: makeErrorIfMissing('can.getWhatIChange', 'can-reflect: can not determine dependencies'),
        getChangesDependencyRecord: function getChangesDependencyRecord(handler) {
            var fn = handler[canSymbol.for('can.getChangesDependencyRecord')];
            if (typeof fn === 'function') {
                return fn();
            }
        },
        keyHasDependencies: makeErrorIfMissing('can.keyHasDependencies', 'can-reflect: can not determine if this has key dependencies'),
        onValue: makeErrorIfMissing('can.onValue', 'can-reflect: can not observe value change'),
        offValue: makeErrorIfMissing('can.offValue', 'can-reflect: can not unobserve value change'),
        getValueDependencies: makeErrorIfMissing('can.getValueDependencies', 'can-reflect: can not determine dependencies'),
        valueHasDependencies: makeErrorIfMissing('can.valueHasDependencies', 'can-reflect: can not determine if value has dependencies'),
        onPatches: makeErrorIfMissing('can.onPatches', 'can-reflect: can not observe patches on object'),
        offPatches: makeErrorIfMissing('can.offPatches', 'can-reflect: can not unobserve patches on object'),
        onInstancePatches: makeErrorIfMissing('can.onInstancePatches', 'can-reflect: can not observe onInstancePatches on Type'),
        offInstancePatches: makeErrorIfMissing('can.offInstancePatches', 'can-reflect: can not unobserve onInstancePatches on Type'),
        onInstanceBoundChange: makeErrorIfMissing('can.onInstanceBoundChange', 'can-reflect: can not observe bound state change in instances.'),
        offInstanceBoundChange: makeErrorIfMissing('can.offInstanceBoundChange', 'can-reflect: can not unobserve bound state change'),
        isBound: makeErrorIfMissing('can.isBound', 'can-reflect: cannot determine if object is bound'),
        onEvent: function (obj, eventName, callback, queue) {
            if (obj) {
                var onEvent = obj[canSymbol.for('can.onEvent')];
                if (onEvent !== undefined) {
                    return onEvent.call(obj, eventName, callback, queue);
                } else if (obj.addEventListener) {
                    obj.addEventListener(eventName, callback, queue);
                }
            }
        },
        offEvent: function (obj, eventName, callback, queue) {
            if (obj) {
                var offEvent = obj[canSymbol.for('can.offEvent')];
                if (offEvent !== undefined) {
                    return offEvent.call(obj, eventName, callback, queue);
                } else if (obj.removeEventListener) {
                    obj.removeEventListener(eventName, callback, queue);
                }
            }
        },
        setPriority: function (obj, priority) {
            if (obj) {
                var setPriority = obj[canSymbol.for('can.setPriority')];
                if (setPriority !== undefined) {
                    setPriority.call(obj, priority);
                    return true;
                }
            }
            return false;
        },
        getPriority: function (obj) {
            if (obj) {
                var getPriority = obj[canSymbol.for('can.getPriority')];
                if (getPriority !== undefined) {
                    return getPriority.call(obj);
                }
            }
            return undefined;
        }
    };
});
/*can-reflect@1.17.10#reflections/shape/shape*/
define('can-reflect/reflections/shape/shape', [
    'require',
    'exports',
    'module',
    'can-symbol',
    'can-reflect/reflections/get-set/get-set',
    'can-reflect/reflections/type/type',
    'can-reflect/reflections/helpers'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var getSetReflections = require('can-reflect/reflections/get-set/get-set');
    var typeReflections = require('can-reflect/reflections/type/type');
    var helpers = require('can-reflect/reflections/helpers');
    var getPrototypeOfWorksWithPrimitives = true;
    try {
        Object.getPrototypeOf(1);
    } catch (e) {
        getPrototypeOfWorksWithPrimitives = false;
    }
    var ArrayMap;
    if (typeof Map === 'function') {
        ArrayMap = Map;
    } else {
        var isEven = function isEven(num) {
            return num % 2 === 0;
        };
        ArrayMap = function () {
            this.contents = [];
        };
        ArrayMap.prototype = {
            _getIndex: function (key) {
                var idx;
                do {
                    idx = this.contents.indexOf(key, idx);
                } while (idx !== -1 && !isEven(idx));
                return idx;
            },
            has: function (key) {
                return this._getIndex(key) !== -1;
            },
            get: function (key) {
                var idx = this._getIndex(key);
                if (idx !== -1) {
                    return this.contents[idx + 1];
                }
            },
            set: function (key, value) {
                var idx = this._getIndex(key);
                if (idx !== -1) {
                    this.contents[idx + 1] = value;
                } else {
                    this.contents.push(key);
                    this.contents.push(value);
                }
            },
            'delete': function (key) {
                var idx = this._getIndex(key);
                if (idx !== -1) {
                    this.contents.splice(idx, 2);
                }
            }
        };
    }
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var shapeReflections;
    var shiftFirstArgumentToThis = function (func) {
        return function () {
            var args = [this];
            args.push.apply(args, arguments);
            return func.apply(null, args);
        };
    };
    var getKeyValueSymbol = canSymbol.for('can.getKeyValue');
    var shiftedGetKeyValue = shiftFirstArgumentToThis(getSetReflections.getKeyValue);
    var setKeyValueSymbol = canSymbol.for('can.setKeyValue');
    var shiftedSetKeyValue = shiftFirstArgumentToThis(getSetReflections.setKeyValue);
    var sizeSymbol = canSymbol.for('can.size');
    var hasUpdateSymbol = helpers.makeGetFirstSymbolValue([
        'can.updateDeep',
        'can.assignDeep',
        'can.setKeyValue'
    ]);
    var shouldUpdateOrAssign = function (obj) {
        return typeReflections.isPlainObject(obj) || Array.isArray(obj) || !!hasUpdateSymbol(obj);
    };
    function isSerializedHelper(obj) {
        if (typeReflections.isPrimitive(obj)) {
            return true;
        }
        if (hasUpdateSymbol(obj)) {
            return false;
        }
        return typeReflections.isBuiltIn(obj) && !typeReflections.isPlainObject(obj) && !Array.isArray(obj);
    }
    var Object_Keys;
    try {
        Object.keys(1);
        Object_Keys = Object.keys;
    } catch (e) {
        Object_Keys = function (obj) {
            if (typeReflections.isPrimitive(obj)) {
                return [];
            } else {
                return Object.keys(obj);
            }
        };
    }
    function createSerializeMap(Type) {
        var MapType = Type || ArrayMap;
        return {
            unwrap: new MapType(),
            serialize: new MapType(),
            isSerializing: {
                unwrap: new MapType(),
                serialize: new MapType()
            },
            circularReferenceIsSerializing: {
                unwrap: new MapType(),
                serialize: new MapType()
            }
        };
    }
    function makeSerializer(methodName, symbolsToCheck) {
        var serializeMap = null;
        function SerializeOperation(MapType) {
            this.first = !serializeMap;
            if (this.first) {
                serializeMap = createSerializeMap(MapType);
            }
            this.map = serializeMap;
            this.result = null;
        }
        SerializeOperation.prototype.end = function () {
            if (this.first) {
                serializeMap = null;
            }
            return this.result;
        };
        return function serializer(value, MapType) {
            if (isSerializedHelper(value)) {
                return value;
            }
            var operation = new SerializeOperation(MapType);
            if (typeReflections.isValueLike(value)) {
                operation.result = this[methodName](getSetReflections.getValue(value));
            } else {
                var isListLike = typeReflections.isIteratorLike(value) || typeReflections.isMoreListLikeThanMapLike(value);
                operation.result = isListLike ? [] : {};
                if (operation.map[methodName].has(value)) {
                    if (operation.map.isSerializing[methodName].has(value)) {
                        operation.map.circularReferenceIsSerializing[methodName].set(value, true);
                    }
                    return operation.map[methodName].get(value);
                } else {
                    operation.map[methodName].set(value, operation.result);
                }
                for (var i = 0, len = symbolsToCheck.length; i < len; i++) {
                    var serializer = value[symbolsToCheck[i]];
                    if (serializer) {
                        operation.map.isSerializing[methodName].set(value, true);
                        var oldResult = operation.result;
                        operation.result = serializer.call(value, oldResult);
                        operation.map.isSerializing[methodName].delete(value);
                        if (operation.result !== oldResult) {
                            if (operation.map.circularReferenceIsSerializing[methodName].has(value)) {
                                operation.end();
                                throw new Error('Cannot serialize cirular reference!');
                            }
                            operation.map[methodName].set(value, operation.result);
                        }
                        return operation.end();
                    }
                }
                if (typeof obj === 'function') {
                    operation.map[methodName].set(value, value);
                    operation.result = value;
                } else if (isListLike) {
                    this.eachIndex(value, function (childValue, index) {
                        operation.result[index] = this[methodName](childValue);
                    }, this);
                } else {
                    this.eachKey(value, function (childValue, prop) {
                        operation.result[prop] = this[methodName](childValue);
                    }, this);
                }
            }
            return operation.end();
        };
    }
    var makeMap;
    if (typeof Map !== 'undefined') {
        makeMap = function (keys) {
            var map = new Map();
            shapeReflections.eachIndex(keys, function (key) {
                map.set(key, true);
            });
            return map;
        };
    } else {
        makeMap = function (keys) {
            var map = {};
            keys.forEach(function (key) {
                map[key] = true;
            });
            return {
                get: function (key) {
                    return map[key];
                },
                set: function (key, value) {
                    map[key] = value;
                },
                keys: function () {
                    return keys;
                }
            };
        };
    }
    var fastHasOwnKey = function (obj) {
        var hasOwnKey = obj[canSymbol.for('can.hasOwnKey')];
        if (hasOwnKey) {
            return hasOwnKey.bind(obj);
        } else {
            var map = makeMap(shapeReflections.getOwnEnumerableKeys(obj));
            return function (key) {
                return map.get(key);
            };
        }
    };
    function addPatch(patches, patch) {
        var lastPatch = patches[patches.length - 1];
        if (lastPatch) {
            if (lastPatch.deleteCount === lastPatch.insert.length && patch.index - lastPatch.index === lastPatch.deleteCount) {
                lastPatch.insert.push.apply(lastPatch.insert, patch.insert);
                lastPatch.deleteCount += patch.deleteCount;
                return;
            }
        }
        patches.push(patch);
    }
    function updateDeepList(target, source, isAssign) {
        var sourceArray = this.toArray(source);
        var patches = [], lastIndex = -1;
        this.eachIndex(target, function (curVal, index) {
            lastIndex = index;
            if (index >= sourceArray.length) {
                if (!isAssign) {
                    addPatch(patches, {
                        index: index,
                        deleteCount: target.length - index + 1,
                        insert: []
                    });
                }
                return false;
            }
            var newVal = sourceArray[index];
            if (typeReflections.isPrimitive(curVal) || typeReflections.isPrimitive(newVal) || shouldUpdateOrAssign(curVal) === false) {
                addPatch(patches, {
                    index: index,
                    deleteCount: 1,
                    insert: [newVal]
                });
            } else {
                if (isAssign === true) {
                    this.assignDeep(curVal, newVal);
                } else {
                    this.updateDeep(curVal, newVal);
                }
            }
        }, this);
        if (sourceArray.length > lastIndex) {
            addPatch(patches, {
                index: lastIndex + 1,
                deleteCount: 0,
                insert: sourceArray.slice(lastIndex + 1)
            });
        }
        for (var i = 0, patchLen = patches.length; i < patchLen; i++) {
            var patch = patches[i];
            getSetReflections.splice(target, patch.index, patch.deleteCount, patch.insert);
        }
        return target;
    }
    shapeReflections = {
        each: function (obj, callback, context) {
            if (typeReflections.isIteratorLike(obj) || typeReflections.isMoreListLikeThanMapLike(obj)) {
                return shapeReflections.eachIndex(obj, callback, context);
            } else {
                return shapeReflections.eachKey(obj, callback, context);
            }
        },
        eachIndex: function (list, callback, context) {
            if (Array.isArray(list)) {
                return shapeReflections.eachListLike(list, callback, context);
            } else {
                var iter, iterator = list[canSymbol.iterator];
                if (typeReflections.isIteratorLike(list)) {
                    iter = list;
                } else if (iterator) {
                    iter = iterator.call(list);
                }
                if (iter) {
                    var res, index = 0;
                    while (!(res = iter.next()).done) {
                        if (callback.call(context || list, res.value, index++, list) === false) {
                            break;
                        }
                    }
                } else {
                    shapeReflections.eachListLike(list, callback, context);
                }
            }
            return list;
        },
        eachListLike: function (list, callback, context) {
            var index = -1;
            var length = list.length;
            if (length === undefined) {
                var size = list[sizeSymbol];
                if (size) {
                    length = size.call(list);
                } else {
                    throw new Error('can-reflect: unable to iterate.');
                }
            }
            while (++index < length) {
                var item = list[index];
                if (callback.call(context || item, item, index, list) === false) {
                    break;
                }
            }
            return list;
        },
        toArray: function (obj) {
            var arr = [];
            shapeReflections.each(obj, function (value) {
                arr.push(value);
            });
            return arr;
        },
        eachKey: function (obj, callback, context) {
            if (obj) {
                var enumerableKeys = shapeReflections.getOwnEnumerableKeys(obj);
                var getKeyValue = obj[getKeyValueSymbol] || shiftedGetKeyValue;
                return shapeReflections.eachIndex(enumerableKeys, function (key) {
                    var value = getKeyValue.call(obj, key);
                    return callback.call(context || obj, value, key, obj);
                });
            }
            return obj;
        },
        'hasOwnKey': function (obj, key) {
            var hasOwnKey = obj[canSymbol.for('can.hasOwnKey')];
            if (hasOwnKey) {
                return hasOwnKey.call(obj, key);
            }
            var getOwnKeys = obj[canSymbol.for('can.getOwnKeys')];
            if (getOwnKeys) {
                var found = false;
                shapeReflections.eachIndex(getOwnKeys.call(obj), function (objKey) {
                    if (objKey === key) {
                        found = true;
                        return false;
                    }
                });
                return found;
            }
            return hasOwnProperty.call(obj, key);
        },
        getOwnEnumerableKeys: function (obj) {
            var getOwnEnumerableKeys = obj[canSymbol.for('can.getOwnEnumerableKeys')];
            if (getOwnEnumerableKeys) {
                return getOwnEnumerableKeys.call(obj);
            }
            if (obj[canSymbol.for('can.getOwnKeys')] && obj[canSymbol.for('can.getOwnKeyDescriptor')]) {
                var keys = [];
                shapeReflections.eachIndex(shapeReflections.getOwnKeys(obj), function (key) {
                    var descriptor = shapeReflections.getOwnKeyDescriptor(obj, key);
                    if (descriptor.enumerable) {
                        keys.push(key);
                    }
                }, this);
                return keys;
            } else {
                return Object_Keys(obj);
            }
        },
        getOwnKeys: function (obj) {
            var getOwnKeys = obj[canSymbol.for('can.getOwnKeys')];
            if (getOwnKeys) {
                return getOwnKeys.call(obj);
            } else {
                return Object.getOwnPropertyNames(obj);
            }
        },
        getOwnKeyDescriptor: function (obj, key) {
            var getOwnKeyDescriptor = obj[canSymbol.for('can.getOwnKeyDescriptor')];
            if (getOwnKeyDescriptor) {
                return getOwnKeyDescriptor.call(obj, key);
            } else {
                return Object.getOwnPropertyDescriptor(obj, key);
            }
        },
        unwrap: makeSerializer('unwrap', [canSymbol.for('can.unwrap')]),
        serialize: makeSerializer('serialize', [
            canSymbol.for('can.serialize'),
            canSymbol.for('can.unwrap')
        ]),
        assignMap: function (target, source) {
            var hasOwnKey = fastHasOwnKey(target);
            var getKeyValue = target[getKeyValueSymbol] || shiftedGetKeyValue;
            var setKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;
            shapeReflections.eachKey(source, function (value, key) {
                if (!hasOwnKey(key) || getKeyValue.call(target, key) !== value) {
                    setKeyValue.call(target, key, value);
                }
            });
            return target;
        },
        assignList: function (target, source) {
            var inserting = shapeReflections.toArray(source);
            getSetReflections.splice(target, 0, inserting, inserting);
            return target;
        },
        assign: function (target, source) {
            if (typeReflections.isIteratorLike(source) || typeReflections.isMoreListLikeThanMapLike(source)) {
                shapeReflections.assignList(target, source);
            } else {
                shapeReflections.assignMap(target, source);
            }
            return target;
        },
        assignDeepMap: function (target, source) {
            var hasOwnKey = fastHasOwnKey(target);
            var getKeyValue = target[getKeyValueSymbol] || shiftedGetKeyValue;
            var setKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;
            shapeReflections.eachKey(source, function (newVal, key) {
                if (!hasOwnKey(key)) {
                    getSetReflections.setKeyValue(target, key, newVal);
                } else {
                    var curVal = getKeyValue.call(target, key);
                    if (newVal === curVal) {
                    } else if (typeReflections.isPrimitive(curVal) || typeReflections.isPrimitive(newVal) || shouldUpdateOrAssign(curVal) === false) {
                        setKeyValue.call(target, key, newVal);
                    } else {
                        shapeReflections.assignDeep(curVal, newVal);
                    }
                }
            }, this);
            return target;
        },
        assignDeepList: function (target, source) {
            return updateDeepList.call(this, target, source, true);
        },
        assignDeep: function (target, source) {
            var assignDeep = target[canSymbol.for('can.assignDeep')];
            if (assignDeep) {
                assignDeep.call(target, source);
            } else if (typeReflections.isMoreListLikeThanMapLike(source)) {
                shapeReflections.assignDeepList(target, source);
            } else {
                shapeReflections.assignDeepMap(target, source);
            }
            return target;
        },
        updateMap: function (target, source) {
            var sourceKeyMap = makeMap(shapeReflections.getOwnEnumerableKeys(source));
            var sourceGetKeyValue = source[getKeyValueSymbol] || shiftedGetKeyValue;
            var targetSetKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;
            shapeReflections.eachKey(target, function (curVal, key) {
                if (!sourceKeyMap.get(key)) {
                    getSetReflections.deleteKeyValue(target, key);
                    return;
                }
                sourceKeyMap.set(key, false);
                var newVal = sourceGetKeyValue.call(source, key);
                if (newVal !== curVal) {
                    targetSetKeyValue.call(target, key, newVal);
                }
            }, this);
            shapeReflections.eachIndex(sourceKeyMap.keys(), function (key) {
                if (sourceKeyMap.get(key)) {
                    targetSetKeyValue.call(target, key, sourceGetKeyValue.call(source, key));
                }
            });
            return target;
        },
        updateList: function (target, source) {
            var inserting = shapeReflections.toArray(source);
            getSetReflections.splice(target, 0, target, inserting);
            return target;
        },
        update: function (target, source) {
            if (typeReflections.isIteratorLike(source) || typeReflections.isMoreListLikeThanMapLike(source)) {
                shapeReflections.updateList(target, source);
            } else {
                shapeReflections.updateMap(target, source);
            }
            return target;
        },
        updateDeepMap: function (target, source) {
            var sourceKeyMap = makeMap(shapeReflections.getOwnEnumerableKeys(source));
            var sourceGetKeyValue = source[getKeyValueSymbol] || shiftedGetKeyValue;
            var targetSetKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;
            shapeReflections.eachKey(target, function (curVal, key) {
                if (!sourceKeyMap.get(key)) {
                    getSetReflections.deleteKeyValue(target, key);
                    return;
                }
                sourceKeyMap.set(key, false);
                var newVal = sourceGetKeyValue.call(source, key);
                if (typeReflections.isPrimitive(curVal) || typeReflections.isPrimitive(newVal) || shouldUpdateOrAssign(curVal) === false) {
                    targetSetKeyValue.call(target, key, newVal);
                } else {
                    shapeReflections.updateDeep(curVal, newVal);
                }
            }, this);
            shapeReflections.eachIndex(sourceKeyMap.keys(), function (key) {
                if (sourceKeyMap.get(key)) {
                    targetSetKeyValue.call(target, key, sourceGetKeyValue.call(source, key));
                }
            });
            return target;
        },
        updateDeepList: function (target, source) {
            return updateDeepList.call(this, target, source);
        },
        updateDeep: function (target, source) {
            var updateDeep = target[canSymbol.for('can.updateDeep')];
            if (updateDeep) {
                updateDeep.call(target, source);
            } else if (typeReflections.isMoreListLikeThanMapLike(source)) {
                shapeReflections.updateDeepList(target, source);
            } else {
                shapeReflections.updateDeepMap(target, source);
            }
            return target;
        },
        hasKey: function (obj, key) {
            if (obj == null) {
                return false;
            }
            if (typeReflections.isPrimitive(obj)) {
                if (hasOwnProperty.call(obj, key)) {
                    return true;
                } else {
                    var proto;
                    if (getPrototypeOfWorksWithPrimitives) {
                        proto = Object.getPrototypeOf(obj);
                    } else {
                        proto = obj.__proto__;
                    }
                    if (proto !== undefined) {
                        return key in proto;
                    } else {
                        return obj[key] !== undefined;
                    }
                }
            }
            var hasKey = obj[canSymbol.for('can.hasKey')];
            if (hasKey) {
                return hasKey.call(obj, key);
            }
            var found = shapeReflections.hasOwnKey(obj, key);
            return found || key in obj;
        },
        getAllEnumerableKeys: function () {
        },
        getAllKeys: function () {
        },
        assignSymbols: function (target, source) {
            shapeReflections.eachKey(source, function (value, key) {
                var symbol = typeReflections.isSymbolLike(canSymbol[key]) ? canSymbol[key] : canSymbol.for(key);
                getSetReflections.setKeyValue(target, symbol, value);
            });
            return target;
        },
        isSerialized: isSerializedHelper,
        size: function (obj) {
            if (obj == null) {
                return 0;
            }
            var size = obj[sizeSymbol];
            var count = 0;
            if (size) {
                return size.call(obj);
            } else if (helpers.hasLength(obj)) {
                return obj.length;
            } else if (typeReflections.isListLike(obj)) {
                shapeReflections.eachIndex(obj, function () {
                    count++;
                });
                return count;
            } else if (obj) {
                return shapeReflections.getOwnEnumerableKeys(obj).length;
            } else {
                return undefined;
            }
        },
        defineInstanceKey: function (cls, key, properties) {
            var defineInstanceKey = cls[canSymbol.for('can.defineInstanceKey')];
            if (defineInstanceKey) {
                return defineInstanceKey.call(cls, key, properties);
            }
            var proto = cls.prototype;
            defineInstanceKey = proto[canSymbol.for('can.defineInstanceKey')];
            if (defineInstanceKey) {
                defineInstanceKey.call(proto, key, properties);
            } else {
                Object.defineProperty(proto, key, shapeReflections.assign({
                    configurable: true,
                    enumerable: !typeReflections.isSymbolLike(key),
                    writable: true
                }, properties));
            }
        }
    };
    shapeReflections.isSerializable = shapeReflections.isSerialized;
    shapeReflections.keys = shapeReflections.getOwnEnumerableKeys;
    module.exports = shapeReflections;
});
/*can-reflect@1.17.10#reflections/shape/schema/schema*/
define('can-reflect/reflections/shape/schema/schema', [
    'require',
    'exports',
    'module',
    'can-symbol',
    'can-reflect/reflections/type/type',
    'can-reflect/reflections/get-set/get-set',
    'can-reflect/reflections/shape/shape'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var typeReflections = require('can-reflect/reflections/type/type');
    var getSetReflections = require('can-reflect/reflections/get-set/get-set');
    var shapeReflections = require('can-reflect/reflections/shape/shape');
    var getSchemaSymbol = canSymbol.for('can.getSchema'), isMemberSymbol = canSymbol.for('can.isMember'), newSymbol = canSymbol.for('can.new');
    function comparator(a, b) {
        return a.localeCompare(b);
    }
    function sort(obj) {
        if (typeReflections.isPrimitive(obj) || obj instanceof Date) {
            return obj;
        }
        var out;
        if (typeReflections.isListLike(obj)) {
            out = [];
            shapeReflections.eachKey(obj, function (item) {
                out.push(sort(item));
            });
            return out;
        }
        if (typeReflections.isMapLike(obj)) {
            out = {};
            shapeReflections.getOwnKeys(obj).sort(comparator).forEach(function (key) {
                out[key] = sort(getSetReflections.getKeyValue(obj, key));
            });
            return out;
        }
        return obj;
    }
    function isPrimitiveConverter(Type) {
        return Type === Number || Type === String || Type === Boolean;
    }
    var schemaReflections = {
        getSchema: function (type) {
            if (type === undefined) {
                return undefined;
            }
            var getSchema = type[getSchemaSymbol];
            if (getSchema === undefined) {
                type = type.constructor;
                getSchema = type && type[getSchemaSymbol];
            }
            return getSchema !== undefined ? getSchema.call(type) : undefined;
        },
        getIdentity: function (value, schema) {
            schema = schema || schemaReflections.getSchema(value);
            if (schema === undefined) {
                throw new Error('can-reflect.getIdentity - Unable to find a schema for the given value.');
            }
            var identity = schema.identity;
            if (!identity || identity.length === 0) {
                throw new Error('can-reflect.getIdentity - Provided schema lacks an identity property.');
            } else if (identity.length === 1) {
                return getSetReflections.getKeyValue(value, identity[0]);
            } else {
                var id = {};
                identity.forEach(function (key) {
                    id[key] = getSetReflections.getKeyValue(value, key);
                });
                return JSON.stringify(schemaReflections.cloneKeySort(id));
            }
        },
        cloneKeySort: function (obj) {
            return sort(obj);
        },
        convert: function (value, Type) {
            if (isPrimitiveConverter(Type)) {
                return Type(value);
            }
            var isMemberTest = Type[isMemberSymbol], isMember = false, type = typeof Type, createNew = Type[newSymbol];
            if (isMemberTest !== undefined) {
                isMember = isMemberTest.call(Type, value);
            } else if (type === 'function') {
                if (typeReflections.isConstructorLike(Type)) {
                    isMember = value instanceof Type;
                }
            }
            if (isMember) {
                return value;
            }
            if (createNew !== undefined) {
                return createNew.call(Type, value);
            } else if (type === 'function') {
                if (typeReflections.isConstructorLike(Type)) {
                    return new Type(value);
                } else {
                    return Type(value);
                }
            } else {
                throw new Error('can-reflect: Can not convert values into type. Type must provide `can.new` symbol.');
            }
        }
    };
    module.exports = schemaReflections;
});
/*can-reflect@1.17.10#reflections/get-name/get-name*/
define('can-reflect/reflections/get-name/get-name', [
    'require',
    'exports',
    'module',
    'can-symbol',
    'can-reflect/reflections/type/type'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var typeReflections = require('can-reflect/reflections/type/type');
    var getNameSymbol = canSymbol.for('can.getName');
    function setName(obj, nameGetter) {
        if (typeof nameGetter !== 'function') {
            var value = nameGetter;
            nameGetter = function () {
                return value;
            };
        }
        Object.defineProperty(obj, getNameSymbol, { value: nameGetter });
    }
    var anonymousID = 0;
    function getName(obj) {
        var type = typeof obj;
        if (obj === null || type !== 'object' && type !== 'function') {
            return '' + obj;
        }
        var nameGetter = obj[getNameSymbol];
        if (nameGetter) {
            return nameGetter.call(obj);
        }
        if (type === 'function') {
            if (!('name' in obj)) {
                obj.name = 'functionIE' + anonymousID++;
            }
            return obj.name;
        }
        if (obj.constructor && obj !== obj.constructor) {
            var parent = getName(obj.constructor);
            if (parent) {
                if (typeReflections.isValueLike(obj)) {
                    return parent + '<>';
                }
                if (typeReflections.isMoreListLikeThanMapLike(obj)) {
                    return parent + '[]';
                }
                if (typeReflections.isMapLike(obj)) {
                    return parent + '{}';
                }
            }
        }
        return undefined;
    }
    module.exports = {
        setName: setName,
        getName: getName
    };
});
/*can-reflect@1.17.10#types/map*/
define('can-reflect/types/map', [
    'require',
    'exports',
    'module',
    'can-reflect/reflections/shape/shape',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var shape = require('can-reflect/reflections/shape/shape');
    var CanSymbol = require('can-symbol');
    function keysPolyfill() {
        var keys = [];
        var currentIndex = 0;
        this.forEach(function (val, key) {
            keys.push(key);
        });
        return {
            next: function () {
                return {
                    value: keys[currentIndex],
                    done: currentIndex++ === keys.length
                };
            }
        };
    }
    if (typeof Map !== 'undefined') {
        shape.assignSymbols(Map.prototype, {
            'can.getOwnEnumerableKeys': Map.prototype.keys,
            'can.setKeyValue': Map.prototype.set,
            'can.getKeyValue': Map.prototype.get,
            'can.deleteKeyValue': Map.prototype['delete'],
            'can.hasOwnKey': Map.prototype.has
        });
        if (typeof Map.prototype.keys !== 'function') {
            Map.prototype.keys = Map.prototype[CanSymbol.for('can.getOwnEnumerableKeys')] = keysPolyfill;
        }
    }
    if (typeof WeakMap !== 'undefined') {
        shape.assignSymbols(WeakMap.prototype, {
            'can.getOwnEnumerableKeys': function () {
                throw new Error('can-reflect: WeakMaps do not have enumerable keys.');
            },
            'can.setKeyValue': WeakMap.prototype.set,
            'can.getKeyValue': WeakMap.prototype.get,
            'can.deleteKeyValue': WeakMap.prototype['delete'],
            'can.hasOwnKey': WeakMap.prototype.has
        });
    }
});
/*can-reflect@1.17.10#types/set*/
define('can-reflect/types/set', [
    'require',
    'exports',
    'module',
    'can-reflect/reflections/shape/shape',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var shape = require('can-reflect/reflections/shape/shape');
    var CanSymbol = require('can-symbol');
    if (typeof Set !== 'undefined') {
        shape.assignSymbols(Set.prototype, {
            'can.isMoreListLikeThanMapLike': true,
            'can.updateValues': function (index, removing, adding) {
                if (removing !== adding) {
                    shape.each(removing, function (value) {
                        this.delete(value);
                    }, this);
                }
                shape.each(adding, function (value) {
                    this.add(value);
                }, this);
            },
            'can.size': function () {
                return this.size;
            }
        });
        if (typeof Set.prototype[CanSymbol.iterator] !== 'function') {
            Set.prototype[CanSymbol.iterator] = function () {
                var arr = [];
                var currentIndex = 0;
                this.forEach(function (val) {
                    arr.push(val);
                });
                return {
                    next: function () {
                        return {
                            value: arr[currentIndex],
                            done: currentIndex++ === arr.length
                        };
                    }
                };
            };
        }
    }
    if (typeof WeakSet !== 'undefined') {
        shape.assignSymbols(WeakSet.prototype, {
            'can.isListLike': true,
            'can.isMoreListLikeThanMapLike': true,
            'can.updateValues': function (index, removing, adding) {
                if (removing !== adding) {
                    shape.each(removing, function (value) {
                        this.delete(value);
                    }, this);
                }
                shape.each(adding, function (value) {
                    this.add(value);
                }, this);
            },
            'can.size': function () {
                throw new Error('can-reflect: WeakSets do not have enumerable keys.');
            }
        });
    }
});
/*can-reflect@1.17.10#can-reflect*/
define('can-reflect', [
    'require',
    'exports',
    'module',
    'can-reflect/reflections/call/call',
    'can-reflect/reflections/get-set/get-set',
    'can-reflect/reflections/observe/observe',
    'can-reflect/reflections/shape/shape',
    'can-reflect/reflections/shape/schema/schema',
    'can-reflect/reflections/type/type',
    'can-reflect/reflections/get-name/get-name',
    'can-namespace',
    'can-reflect/types/map',
    'can-reflect/types/set'
], function (require, exports, module) {
    'use strict';
    var functionReflections = require('can-reflect/reflections/call/call');
    var getSet = require('can-reflect/reflections/get-set/get-set');
    var observe = require('can-reflect/reflections/observe/observe');
    var shape = require('can-reflect/reflections/shape/shape');
    var schema = require('can-reflect/reflections/shape/schema/schema');
    var type = require('can-reflect/reflections/type/type');
    var getName = require('can-reflect/reflections/get-name/get-name');
    var namespace = require('can-namespace');
    var reflect = {};
    [
        functionReflections,
        getSet,
        observe,
        shape,
        type,
        getName,
        schema
    ].forEach(function (reflections) {
        for (var prop in reflections) {
            reflect[prop] = reflections[prop];
        }
    });
    require('can-reflect/types/map');
    require('can-reflect/types/set');
    module.exports = namespace.Reflect = reflect;
});
/*can-observation-recorder@1.3.1#can-observation-recorder*/
define('can-observation-recorder', [
    'require',
    'exports',
    'module',
    'can-namespace',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var namespace = require('can-namespace');
    var canSymbol = require('can-symbol');
    var stack = [];
    var addParentSymbol = canSymbol.for('can.addParent'), getValueSymbol = canSymbol.for('can.getValue');
    var ObservationRecorder = {
        stack: stack,
        start: function (name) {
            var deps = {
                keyDependencies: new Map(),
                valueDependencies: new Set(),
                childDependencies: new Set(),
                traps: null,
                ignore: 0,
                name: name
            };
            stack.push(deps);
            return deps;
        },
        stop: function () {
            return stack.pop();
        },
        add: function (obj, event) {
            var top = stack[stack.length - 1];
            if (top && top.ignore === 0) {
                if (top.traps) {
                    top.traps.push([
                        obj,
                        event
                    ]);
                } else {
                    if (event === undefined) {
                        top.valueDependencies.add(obj);
                    } else {
                        var eventSet = top.keyDependencies.get(obj);
                        if (!eventSet) {
                            eventSet = new Set();
                            top.keyDependencies.set(obj, eventSet);
                        }
                        eventSet.add(event);
                    }
                }
            }
        },
        addMany: function (observes) {
            var top = stack[stack.length - 1];
            if (top) {
                if (top.traps) {
                    top.traps.push.apply(top.traps, observes);
                } else {
                    for (var i = 0, len = observes.length; i < len; i++) {
                        this.add(observes[i][0], observes[i][1]);
                    }
                }
            }
        },
        created: function (obs) {
            var top = stack[stack.length - 1];
            if (top) {
                top.childDependencies.add(obs);
                if (obs[addParentSymbol]) {
                    obs[addParentSymbol](top);
                }
            }
        },
        ignore: function (fn) {
            return function () {
                if (stack.length) {
                    var top = stack[stack.length - 1];
                    top.ignore++;
                    var res = fn.apply(this, arguments);
                    top.ignore--;
                    return res;
                } else {
                    return fn.apply(this, arguments);
                }
            };
        },
        peekValue: function (value) {
            if (!value || !value[getValueSymbol]) {
                return value;
            }
            if (stack.length) {
                var top = stack[stack.length - 1];
                top.ignore++;
                var res = value[getValueSymbol]();
                top.ignore--;
                return res;
            } else {
                return value[getValueSymbol]();
            }
        },
        isRecording: function () {
            var len = stack.length;
            var last = len && stack[len - 1];
            return last && last.ignore === 0 && last;
        },
        makeDependenciesRecord: function (name) {
            return {
                traps: null,
                keyDependencies: new Map(),
                valueDependencies: new Set(),
                ignore: 0,
                name: name
            };
        },
        makeDependenciesRecorder: function () {
            return ObservationRecorder.makeDependenciesRecord();
        },
        trap: function () {
            if (stack.length) {
                var top = stack[stack.length - 1];
                var oldTraps = top.traps;
                var traps = top.traps = [];
                return function () {
                    top.traps = oldTraps;
                    return traps;
                };
            } else {
                return function () {
                    return [];
                };
            }
        },
        trapsCount: function () {
            if (stack.length) {
                var top = stack[stack.length - 1];
                return top.traps.length;
            } else {
                return 0;
            }
        }
    };
    if (namespace.ObservationRecorder) {
        throw new Error('You can\'t have two versions of can-observation-recorder, check your dependencies');
    } else {
        module.exports = namespace.ObservationRecorder = ObservationRecorder;
    }
});
/*can-log@1.0.1#can-log*/
define('can-log', function (require, exports, module) {
    'use strict';
    exports.warnTimeout = 5000;
    exports.logLevel = 0;
    exports.warn = function () {
        var ll = this.logLevel;
        if (ll < 2) {
            if (typeof console !== 'undefined' && console.warn) {
                this._logger('warn', Array.prototype.slice.call(arguments));
            } else if (typeof console !== 'undefined' && console.log) {
                this._logger('log', Array.prototype.slice.call(arguments));
            }
        }
    };
    exports.log = function () {
        var ll = this.logLevel;
        if (ll < 1) {
            if (typeof console !== 'undefined' && console.log) {
                this._logger('log', Array.prototype.slice.call(arguments));
            }
        }
    };
    exports.error = function () {
        var ll = this.logLevel;
        if (ll < 1) {
            if (typeof console !== 'undefined' && console.error) {
                this._logger('error', Array.prototype.slice.call(arguments));
            }
        }
    };
    exports._logger = function (type, arr) {
        try {
            console[type].apply(console, arr);
        } catch (e) {
            console[type](arr);
        }
    };
});
/*can-log@1.0.1#dev/dev*/
define('can-log/dev/dev', [
    'require',
    'exports',
    'module',
    'can-log'
], function (require, exports, module) {
    'use strict';
    var canLog = require('can-log');
    module.exports = {
        warnTimeout: 5000,
        logLevel: 0,
        stringify: function (value) {
            var flagUndefined = function flagUndefined(key, value) {
                return value === undefined ? '/* void(undefined) */' : value;
            };
            return JSON.stringify(value, flagUndefined, '  ').replace(/"\/\* void\(undefined\) \*\/"/g, 'undefined');
        },
        warn: function () {
        },
        log: function () {
        },
        error: function () {
        },
        _logger: canLog._logger
    };
});
/*can-queues@1.2.2#queue-state*/
define('can-queues/queue-state', function (require, exports, module) {
    'use strict';
    module.exports = { lastTask: null };
});
/*can-assign@1.3.2#can-assign*/
define('can-assign', [
    'require',
    'exports',
    'module',
    'can-namespace'
], function (require, exports, module) {
    var namespace = require('can-namespace');
    module.exports = namespace.assign = function (d, s) {
        for (var prop in s) {
            var desc = Object.getOwnPropertyDescriptor(d, prop);
            if (!desc || desc.writable !== false) {
                d[prop] = s[prop];
            }
        }
        return d;
    };
});
/*can-queues@1.2.2#queue*/
define('can-queues/queue', [
    'require',
    'exports',
    'module',
    'can-queues/queue-state',
    'can-log/dev/dev',
    'can-assign'
], function (require, exports, module) {
    'use strict';
    var queueState = require('can-queues/queue-state');
    var canDev = require('can-log/dev/dev');
    var assign = require('can-assign');
    function noOperation() {
    }
    var Queue = function (name, callbacks) {
        this.callbacks = assign({
            onFirstTask: noOperation,
            onComplete: function () {
                queueState.lastTask = null;
            }
        }, callbacks || {});
        this.name = name;
        this.index = 0;
        this.tasks = [];
        this._log = false;
    };
    Queue.prototype.constructor = Queue;
    Queue.noop = noOperation;
    Queue.prototype.enqueue = function (fn, context, args, meta) {
        var len = this.tasks.push({
            fn: fn,
            context: context,
            args: args,
            meta: meta || {}
        });
        if (len === 1) {
            this.callbacks.onFirstTask(this);
        }
    };
    Queue.prototype.flush = function () {
        while (this.index < this.tasks.length) {
            var task = this.tasks[this.index++];
            task.fn.apply(task.context, task.args);
        }
        this.index = 0;
        this.tasks = [];
        this.callbacks.onComplete(this);
    };
    Queue.prototype.log = function () {
        this._log = arguments.length ? arguments[0] : true;
    };
    module.exports = Queue;
});
/*can-queues@1.2.2#priority-queue*/
define('can-queues/priority-queue', [
    'require',
    'exports',
    'module',
    'can-queues/queue'
], function (require, exports, module) {
    'use strict';
    var Queue = require('can-queues/queue');
    var PriorityQueue = function () {
        Queue.apply(this, arguments);
        this.taskMap = new Map();
        this.taskContainersByPriority = [];
        this.curPriorityIndex = Infinity;
        this.curPriorityMax = 0;
        this.isFlushing = false;
        this.tasksRemaining = 0;
    };
    PriorityQueue.prototype = Object.create(Queue.prototype);
    PriorityQueue.prototype.constructor = PriorityQueue;
    PriorityQueue.prototype.enqueue = function (fn, context, args, meta) {
        if (!this.taskMap.has(fn)) {
            this.tasksRemaining++;
            var isFirst = this.taskContainersByPriority.length === 0;
            var task = {
                fn: fn,
                context: context,
                args: args,
                meta: meta || {}
            };
            var taskContainer = this.getTaskContainerAndUpdateRange(task);
            taskContainer.tasks.push(task);
            this.taskMap.set(fn, task);
            if (isFirst) {
                this.callbacks.onFirstTask(this);
            }
        }
    };
    PriorityQueue.prototype.getTaskContainerAndUpdateRange = function (task) {
        var priority = task.meta.priority || 0;
        if (priority < this.curPriorityIndex) {
            this.curPriorityIndex = priority;
        }
        if (priority > this.curPriorityMax) {
            this.curPriorityMax = priority;
        }
        var tcByPriority = this.taskContainersByPriority;
        var taskContainer = tcByPriority[priority];
        if (!taskContainer) {
            taskContainer = tcByPriority[priority] = {
                tasks: [],
                index: 0
            };
        }
        return taskContainer;
    };
    PriorityQueue.prototype.flush = function () {
        if (this.isFlushing) {
            return;
        }
        this.isFlushing = true;
        while (true) {
            if (this.curPriorityIndex <= this.curPriorityMax) {
                var taskContainer = this.taskContainersByPriority[this.curPriorityIndex];
                if (taskContainer && taskContainer.tasks.length > taskContainer.index) {
                    var task = taskContainer.tasks[taskContainer.index++];
                    this.tasksRemaining--;
                    this.taskMap['delete'](task.fn);
                    task.fn.apply(task.context, task.args);
                } else {
                    this.curPriorityIndex++;
                }
            } else {
                this.taskMap = new Map();
                this.curPriorityIndex = Infinity;
                this.curPriorityMax = 0;
                this.taskContainersByPriority = [];
                this.isFlushing = false;
                this.callbacks.onComplete(this);
                return;
            }
        }
    };
    PriorityQueue.prototype.isEnqueued = function (fn) {
        return this.taskMap.has(fn);
    };
    PriorityQueue.prototype.flushQueuedTask = function (fn) {
        var task = this.dequeue(fn);
        if (task) {
            task.fn.apply(task.context, task.args);
        }
    };
    PriorityQueue.prototype.dequeue = function (fn) {
        var task = this.taskMap.get(fn);
        if (task) {
            var priority = task.meta.priority || 0;
            var taskContainer = this.taskContainersByPriority[priority];
            var index = taskContainer.tasks.indexOf(task, taskContainer.index);
            if (index >= 0) {
                taskContainer.tasks.splice(index, 1);
                this.tasksRemaining--;
                this.taskMap['delete'](task.fn);
                return task;
            } else {
                console.warn('Task', fn, 'has already run');
            }
        }
    };
    PriorityQueue.prototype.tasksRemainingCount = function () {
        return this.tasksRemaining;
    };
    module.exports = PriorityQueue;
});
/*can-queues@1.2.2#completion-queue*/
define('can-queues/completion-queue', [
    'require',
    'exports',
    'module',
    'can-queues/queue'
], function (require, exports, module) {
    'use strict';
    var Queue = require('can-queues/queue');
    var CompletionQueue = function () {
        Queue.apply(this, arguments);
        this.flushCount = 0;
    };
    CompletionQueue.prototype = Object.create(Queue.prototype);
    CompletionQueue.prototype.constructor = CompletionQueue;
    CompletionQueue.prototype.flush = function () {
        if (this.flushCount === 0) {
            this.flushCount++;
            while (this.index < this.tasks.length) {
                var task = this.tasks[this.index++];
                task.fn.apply(task.context, task.args);
            }
            this.index = 0;
            this.tasks = [];
            this.flushCount--;
            this.callbacks.onComplete(this);
        }
    };
    module.exports = CompletionQueue;
});
/*can-queues@1.2.2#can-queues*/
define('can-queues', [
    'require',
    'exports',
    'module',
    'can-log/dev/dev',
    'can-queues/queue',
    'can-queues/priority-queue',
    'can-queues/queue-state',
    'can-queues/completion-queue',
    'can-namespace'
], function (require, exports, module) {
    'use strict';
    var canDev = require('can-log/dev/dev');
    var Queue = require('can-queues/queue');
    var PriorityQueue = require('can-queues/priority-queue');
    var queueState = require('can-queues/queue-state');
    var CompletionQueue = require('can-queues/completion-queue');
    var ns = require('can-namespace');
    var batchStartCounter = 0;
    var addedTask = false;
    var isFlushing = false;
    var batchNum = 0;
    var batchData;
    var queueNames = [
        'notify',
        'derive',
        'domUI',
        'mutate'
    ];
    var NOTIFY_QUEUE, DERIVE_QUEUE, DOM_UI_QUEUE, MUTATE_QUEUE;
    NOTIFY_QUEUE = new Queue('NOTIFY', {
        onComplete: function () {
            DERIVE_QUEUE.flush();
        },
        onFirstTask: function () {
            if (!batchStartCounter) {
                NOTIFY_QUEUE.flush();
            } else {
                addedTask = true;
            }
        }
    });
    DERIVE_QUEUE = new PriorityQueue('DERIVE', {
        onComplete: function () {
            DOM_UI_QUEUE.flush();
        },
        onFirstTask: function () {
            addedTask = true;
        }
    });
    DOM_UI_QUEUE = new CompletionQueue('DOM_UI', {
        onComplete: function () {
            MUTATE_QUEUE.flush();
        },
        onFirstTask: function () {
            addedTask = true;
        }
    });
    MUTATE_QUEUE = new Queue('MUTATE', {
        onComplete: function () {
            queueState.lastTask = null;
            isFlushing = false;
        },
        onFirstTask: function () {
            addedTask = true;
        }
    });
    var queues = {
        Queue: Queue,
        PriorityQueue: PriorityQueue,
        CompletionQueue: CompletionQueue,
        notifyQueue: NOTIFY_QUEUE,
        deriveQueue: DERIVE_QUEUE,
        domUIQueue: DOM_UI_QUEUE,
        mutateQueue: MUTATE_QUEUE,
        batch: {
            start: function () {
                batchStartCounter++;
                if (batchStartCounter === 1) {
                    batchNum++;
                    batchData = { number: batchNum };
                }
            },
            stop: function () {
                batchStartCounter--;
                if (batchStartCounter === 0) {
                    if (addedTask) {
                        addedTask = false;
                        isFlushing = true;
                        NOTIFY_QUEUE.flush();
                    }
                }
            },
            isCollecting: function () {
                return batchStartCounter > 0;
            },
            number: function () {
                return batchNum;
            },
            data: function () {
                return batchData;
            }
        },
        runAsTask: function (fn, reasonLog) {
            return fn;
        },
        enqueueByQueue: function enqueueByQueue(fnByQueue, context, args, makeMeta, reasonLog) {
            if (fnByQueue) {
                queues.batch.start();
                queueNames.forEach(function (queueName) {
                    var name = queueName + 'Queue';
                    var QUEUE = queues[name];
                    var tasks = fnByQueue[queueName];
                    if (tasks !== undefined) {
                        tasks.forEach(function (fn) {
                            var meta = makeMeta != null ? makeMeta(fn, context, args) : {};
                            meta.reasonLog = reasonLog;
                            QUEUE.enqueue(fn, context, args, meta);
                        });
                    }
                });
                queues.batch.stop();
            }
        },
        lastTask: function () {
            return queueState.lastTask;
        },
        stack: function (task) {
            var current = task || queueState.lastTask;
            var stack = [];
            while (current) {
                stack.unshift(current);
                current = current.meta.parentTask;
            }
            return stack;
        },
        logStack: function (task) {
            var stack = this.stack(task);
            stack.forEach(function (task, i) {
                var meta = task.meta;
                if (i === 0 && meta && meta.reasonLog) {
                    canDev.log.apply(canDev, meta.reasonLog);
                }
                var log = meta && meta.log ? meta.log : [
                    task.fn.name,
                    task
                ];
                canDev.log.apply(canDev, [task.meta.stack.name + ' ran task:'].concat(log));
            });
        },
        taskCount: function () {
            return NOTIFY_QUEUE.tasks.length + DERIVE_QUEUE.tasks.length + DOM_UI_QUEUE.tasks.length + MUTATE_QUEUE.tasks.length;
        },
        flush: function () {
            NOTIFY_QUEUE.flush();
        },
        log: function () {
            NOTIFY_QUEUE.log.apply(NOTIFY_QUEUE, arguments);
            DERIVE_QUEUE.log.apply(DERIVE_QUEUE, arguments);
            DOM_UI_QUEUE.log.apply(DOM_UI_QUEUE, arguments);
            MUTATE_QUEUE.log.apply(MUTATE_QUEUE, arguments);
        }
    };
    if (ns.queues) {
        throw new Error('You can\'t have two versions of can-queues, check your dependencies');
    } else {
        module.exports = ns.queues = queues;
    }
});
/*can-key-tree@1.2.1#can-key-tree*/
define('can-key-tree', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var reflect = require('can-reflect');
    function isBuiltInPrototype(obj) {
        if (obj === Object.prototype) {
            return true;
        }
        var protoString = Object.prototype.toString.call(obj);
        var isNotObjObj = protoString !== '[object Object]';
        var isObjSomething = protoString.indexOf('[object ') !== -1;
        return isNotObjObj && isObjSomething;
    }
    function getDeepSize(root, level) {
        if (level === 0) {
            return reflect.size(root);
        } else if (reflect.size(root) === 0) {
            return 0;
        } else {
            var count = 0;
            reflect.each(root, function (value) {
                count += getDeepSize(value, level - 1);
            });
            return count;
        }
    }
    function getDeep(node, items, depth, maxDepth) {
        if (!node) {
            return;
        }
        if (maxDepth === depth) {
            if (reflect.isMoreListLikeThanMapLike(node)) {
                reflect.addValues(items, reflect.toArray(node));
            } else {
                throw new Error('can-key-tree: Map-type leaf containers are not supported yet.');
            }
        } else {
            reflect.each(node, function (value) {
                getDeep(value, items, depth + 1, maxDepth);
            });
        }
    }
    function clearDeep(node, keys, maxDepth, deleteHandler) {
        if (maxDepth === keys.length) {
            if (reflect.isMoreListLikeThanMapLike(node)) {
                var valuesToRemove = reflect.toArray(node);
                if (deleteHandler) {
                    valuesToRemove.forEach(function (value) {
                        deleteHandler.apply(null, keys.concat(value));
                    });
                }
                reflect.removeValues(node, valuesToRemove);
            } else {
                throw new Error('can-key-tree: Map-type leaf containers are not supported yet.');
            }
        } else {
            reflect.each(node, function (value, key) {
                clearDeep(value, keys.concat(key), maxDepth, deleteHandler);
                reflect.deleteKeyValue(node, key);
            });
        }
    }
    var KeyTree = function (treeStructure, callbacks) {
        var FirstConstructor = treeStructure[0];
        if (reflect.isConstructorLike(FirstConstructor)) {
            this.root = new FirstConstructor();
        } else {
            this.root = FirstConstructor;
        }
        this.callbacks = callbacks || {};
        this.treeStructure = treeStructure;
        this.empty = true;
    };
    reflect.assign(KeyTree.prototype, {
        add: function (keys) {
            if (keys.length > this.treeStructure.length) {
                throw new Error('can-key-tree: Can not add path deeper than tree.');
            }
            var place = this.root;
            var rootWasEmpty = this.empty === true;
            for (var i = 0; i < keys.length - 1; i++) {
                var key = keys[i];
                var childNode = reflect.getKeyValue(place, key);
                if (!childNode) {
                    var Constructor = this.treeStructure[i + 1];
                    if (isBuiltInPrototype(Constructor.prototype)) {
                        childNode = new Constructor();
                    } else {
                        childNode = new Constructor(key);
                    }
                    reflect.setKeyValue(place, key, childNode);
                }
                place = childNode;
            }
            if (reflect.isMoreListLikeThanMapLike(place)) {
                reflect.addValues(place, [keys[keys.length - 1]]);
            } else {
                throw new Error('can-key-tree: Map types are not supported yet.');
            }
            if (rootWasEmpty) {
                this.empty = false;
                if (this.callbacks.onFirst) {
                    this.callbacks.onFirst.call(this);
                }
            }
            return this;
        },
        getNode: function (keys) {
            var node = this.root;
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                node = reflect.getKeyValue(node, key);
                if (!node) {
                    return;
                }
            }
            return node;
        },
        get: function (keys) {
            var node = this.getNode(keys);
            if (this.treeStructure.length === keys.length) {
                return node;
            } else {
                var Type = this.treeStructure[this.treeStructure.length - 1];
                var items = new Type();
                getDeep(node, items, keys.length, this.treeStructure.length - 1);
                return items;
            }
        },
        delete: function (keys, deleteHandler) {
            var parentNode = this.root, path = [this.root], lastKey = keys[keys.length - 1];
            for (var i = 0; i < keys.length - 1; i++) {
                var key = keys[i];
                var childNode = reflect.getKeyValue(parentNode, key);
                if (childNode === undefined) {
                    return false;
                } else {
                    path.push(childNode);
                }
                parentNode = childNode;
            }
            if (!keys.length) {
                clearDeep(parentNode, [], this.treeStructure.length - 1, deleteHandler);
            } else if (keys.length === this.treeStructure.length) {
                if (reflect.isMoreListLikeThanMapLike(parentNode)) {
                    if (deleteHandler) {
                        deleteHandler.apply(null, keys.concat(lastKey));
                    }
                    reflect.removeValues(parentNode, [lastKey]);
                } else {
                    throw new Error('can-key-tree: Map types are not supported yet.');
                }
            } else {
                var nodeToRemove = reflect.getKeyValue(parentNode, lastKey);
                if (nodeToRemove !== undefined) {
                    clearDeep(nodeToRemove, keys, this.treeStructure.length - 1, deleteHandler);
                    reflect.deleteKeyValue(parentNode, lastKey);
                } else {
                    return false;
                }
            }
            for (i = path.length - 2; i >= 0; i--) {
                if (reflect.size(parentNode) === 0) {
                    parentNode = path[i];
                    reflect.deleteKeyValue(parentNode, keys[i]);
                } else {
                    break;
                }
            }
            if (reflect.size(this.root) === 0) {
                this.empty = true;
                if (this.callbacks.onEmpty) {
                    this.callbacks.onEmpty.call(this);
                }
            }
            return true;
        },
        size: function () {
            return getDeepSize(this.root, this.treeStructure.length - 1);
        },
        isEmpty: function () {
            return this.empty;
        }
    });
    module.exports = KeyTree;
});
/*can-globals@1.2.2#can-globals-proto*/
define('can-globals/can-globals-proto', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var canReflect = require('can-reflect');
        function dispatch(key) {
            var handlers = this.eventHandlers[key];
            if (handlers) {
                var handlersCopy = handlers.slice();
                var value = this.getKeyValue(key);
                for (var i = 0; i < handlersCopy.length; i++) {
                    handlersCopy[i](value);
                }
            }
        }
        function Globals() {
            this.eventHandlers = {};
            this.properties = {};
        }
        Globals.prototype.define = function (key, value, enableCache) {
            if (enableCache === undefined) {
                enableCache = true;
            }
            if (!this.properties[key]) {
                this.properties[key] = {
                    default: value,
                    value: value,
                    enableCache: enableCache
                };
            }
            return this;
        };
        Globals.prototype.getKeyValue = function (key) {
            var property = this.properties[key];
            if (property) {
                if (typeof property.value === 'function') {
                    if (property.cachedValue) {
                        return property.cachedValue;
                    }
                    if (property.enableCache) {
                        property.cachedValue = property.value();
                        return property.cachedValue;
                    } else {
                        return property.value();
                    }
                }
                return property.value;
            }
        };
        Globals.prototype.makeExport = function (key) {
            return function (value) {
                if (arguments.length === 0) {
                    return this.getKeyValue(key);
                }
                if (typeof value === 'undefined' || value === null) {
                    this.deleteKeyValue(key);
                } else {
                    if (typeof value === 'function') {
                        this.setKeyValue(key, function () {
                            return value;
                        });
                    } else {
                        this.setKeyValue(key, value);
                    }
                    return value;
                }
            }.bind(this);
        };
        Globals.prototype.offKeyValue = function (key, handler) {
            if (this.properties[key]) {
                var handlers = this.eventHandlers[key];
                if (handlers) {
                    var i = handlers.indexOf(handler);
                    handlers.splice(i, 1);
                }
            }
            return this;
        };
        Globals.prototype.onKeyValue = function (key, handler) {
            if (this.properties[key]) {
                if (!this.eventHandlers[key]) {
                    this.eventHandlers[key] = [];
                }
                this.eventHandlers[key].push(handler);
            }
            return this;
        };
        Globals.prototype.deleteKeyValue = function (key) {
            var property = this.properties[key];
            if (property !== undefined) {
                property.value = property.default;
                property.cachedValue = undefined;
                dispatch.call(this, key);
            }
            return this;
        };
        Globals.prototype.setKeyValue = function (key, value) {
            if (!this.properties[key]) {
                return this.define(key, value);
            }
            var property = this.properties[key];
            property.value = value;
            property.cachedValue = undefined;
            dispatch.call(this, key);
            return this;
        };
        Globals.prototype.reset = function () {
            for (var key in this.properties) {
                if (this.properties.hasOwnProperty(key)) {
                    this.properties[key].value = this.properties[key].default;
                    this.properties[key].cachedValue = undefined;
                    dispatch.call(this, key);
                }
            }
            return this;
        };
        canReflect.assignSymbols(Globals.prototype, {
            'can.getKeyValue': Globals.prototype.getKeyValue,
            'can.setKeyValue': Globals.prototype.setKeyValue,
            'can.deleteKeyValue': Globals.prototype.deleteKeyValue,
            'can.onKeyValue': Globals.prototype.onKeyValue,
            'can.offKeyValue': Globals.prototype.offKeyValue
        });
        module.exports = Globals;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-globals@1.2.2#can-globals-instance*/
define('can-globals/can-globals-instance', [
    'require',
    'exports',
    'module',
    'can-namespace',
    'can-globals/can-globals-proto'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var namespace = require('can-namespace');
        var Globals = require('can-globals/can-globals-proto');
        var globals = new Globals();
        if (namespace.globals) {
            throw new Error('You can\'t have two versions of can-globals, check your dependencies');
        } else {
            module.exports = namespace.globals = globals;
        }
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-globals@1.2.2#global/global*/
define('can-globals/global/global', [
    'require',
    'exports',
    'module',
    'can-globals/can-globals-instance'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var globals = require('can-globals/can-globals-instance');
        globals.define('global', function () {
            return typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope ? self : typeof process === 'object' && {}.toString.call(process) === '[object process]' ? global : window;
        });
        module.exports = globals.makeExport('global');
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-globals@1.2.2#document/document*/
define('can-globals/document/document', [
    'require',
    'exports',
    'module',
    'can-globals/global/global',
    'can-globals/can-globals-instance'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        require('can-globals/global/global');
        var globals = require('can-globals/can-globals-instance');
        globals.define('document', function () {
            return globals.getKeyValue('global').document;
        });
        module.exports = globals.makeExport('document');
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-globals@1.2.2#is-node/is-node*/
define('can-globals/is-node/is-node', [
    'require',
    'exports',
    'module',
    'can-globals/can-globals-instance'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var globals = require('can-globals/can-globals-instance');
        globals.define('isNode', function () {
            return typeof process === 'object' && {}.toString.call(process) === '[object process]';
        });
        module.exports = globals.makeExport('isNode');
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-globals@1.2.2#is-browser-window/is-browser-window*/
define('can-globals/is-browser-window/is-browser-window', [
    'require',
    'exports',
    'module',
    'can-globals/can-globals-instance',
    'can-globals/is-node/is-node'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var globals = require('can-globals/can-globals-instance');
        require('can-globals/is-node/is-node');
        globals.define('isBrowserWindow', function () {
            var isNode = globals.getKeyValue('isNode');
            return typeof window !== 'undefined' && typeof document !== 'undefined' && isNode === false;
        });
        module.exports = globals.makeExport('isBrowserWindow');
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-dom-events@1.3.10#helpers/util*/
define('can-dom-events/helpers/util', [
    'require',
    'exports',
    'module',
    'can-globals/document/document',
    'can-globals/is-browser-window/is-browser-window'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var getCurrentDocument = require('can-globals/document/document');
        var isBrowserWindow = require('can-globals/is-browser-window/is-browser-window');
        function getTargetDocument(target) {
            return target.ownerDocument || getCurrentDocument();
        }
        function createEvent(target, eventData, bubbles, cancelable) {
            var doc = getTargetDocument(target);
            var event = doc.createEvent('HTMLEvents');
            var eventType;
            if (typeof eventData === 'string') {
                eventType = eventData;
            } else {
                eventType = eventData.type;
                for (var prop in eventData) {
                    if (event[prop] === undefined) {
                        event[prop] = eventData[prop];
                    }
                }
            }
            if (bubbles === undefined) {
                bubbles = true;
            }
            event.initEvent(eventType, bubbles, cancelable);
            return event;
        }
        function isDomEventTarget(obj) {
            if (!(obj && obj.nodeName)) {
                return obj === window;
            }
            var nodeType = obj.nodeType;
            return nodeType === 1 || nodeType === 9 || nodeType === 11;
        }
        function addDomContext(context, args) {
            if (isDomEventTarget(context)) {
                args = Array.prototype.slice.call(args, 0);
                args.unshift(context);
            }
            return args;
        }
        function removeDomContext(context, args) {
            if (!isDomEventTarget(context)) {
                args = Array.prototype.slice.call(args, 0);
                context = args.shift();
            }
            return {
                context: context,
                args: args
            };
        }
        var fixSyntheticEventsOnDisabled = false;
        (function () {
            if (!isBrowserWindow()) {
                return;
            }
            var testEventName = 'fix_synthetic_events_on_disabled_test';
            var input = document.createElement('input');
            input.disabled = true;
            var timer = setTimeout(function () {
                fixSyntheticEventsOnDisabled = true;
            }, 50);
            var onTest = function onTest() {
                clearTimeout(timer);
                input.removeEventListener(testEventName, onTest);
            };
            input.addEventListener(testEventName, onTest);
            try {
                var event = document.create('HTMLEvents');
                event.initEvent(testEventName, false);
                input.dispatchEvent(event);
            } catch (e) {
                onTest();
                fixSyntheticEventsOnDisabled = true;
            }
        }());
        function isDispatchingOnDisabled(element, event) {
            var eventType = event.type;
            var isInsertedOrRemoved = eventType === 'inserted' || eventType === 'removed';
            var isDisabled = !!element.disabled;
            return isInsertedOrRemoved && isDisabled;
        }
        function forceEnabledForDispatch(element, event) {
            return fixSyntheticEventsOnDisabled && isDispatchingOnDisabled(element, event);
        }
        module.exports = {
            createEvent: createEvent,
            addDomContext: addDomContext,
            removeDomContext: removeDomContext,
            isDomEventTarget: isDomEventTarget,
            getTargetDocument: getTargetDocument,
            forceEnabledForDispatch: forceEnabledForDispatch
        };
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-dom-events@1.3.10#helpers/make-event-registry*/
define('can-dom-events/helpers/make-event-registry', function (require, exports, module) {
    'use strict';
    function EventRegistry() {
        this._registry = {};
    }
    module.exports = function makeEventRegistry() {
        return new EventRegistry();
    };
    EventRegistry.prototype.has = function (eventType) {
        return !!this._registry[eventType];
    };
    EventRegistry.prototype.get = function (eventType) {
        return this._registry[eventType];
    };
    EventRegistry.prototype.add = function (event, eventType) {
        if (!event) {
            throw new Error('An EventDefinition must be provided');
        }
        if (typeof event.addEventListener !== 'function') {
            throw new TypeError('EventDefinition addEventListener must be a function');
        }
        if (typeof event.removeEventListener !== 'function') {
            throw new TypeError('EventDefinition removeEventListener must be a function');
        }
        eventType = eventType || event.defaultEventType;
        if (typeof eventType !== 'string') {
            throw new TypeError('Event type must be a string, not ' + eventType);
        }
        if (this.has(eventType)) {
            throw new Error('Event "' + eventType + '" is already registered');
        }
        this._registry[eventType] = event;
        var self = this;
        return function remove() {
            self._registry[eventType] = undefined;
        };
    };
});
/*can-dom-events@1.3.10#helpers/-make-delegate-event-tree*/
define('can-dom-events/helpers/-make-delegate-event-tree', [
    'require',
    'exports',
    'module',
    'can-key-tree',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var KeyTree = require('can-key-tree');
    var canReflect = require('can-reflect');
    var useCapture = function (eventType) {
        return eventType === 'focus' || eventType === 'blur';
    };
    function makeDelegator(domEvents) {
        var Delegator = function Delegator(parentKey) {
            this.element = parentKey;
            this.events = {};
            this.delegated = {};
        };
        canReflect.assignSymbols(Delegator.prototype, {
            'can.setKeyValue': function (eventType, handlersBySelector) {
                var handler = this.delegated[eventType] = function (ev) {
                    var cur = ev.target;
                    var propagate = true;
                    var origStopPropagation = ev.stopPropagation;
                    ev.stopPropagation = function () {
                        origStopPropagation.apply(this, arguments);
                        propagate = false;
                    };
                    var origStopImmediatePropagation = ev.stopImmediatePropagation;
                    ev.stopImmediatePropagation = function () {
                        origStopImmediatePropagation.apply(this, arguments);
                        propagate = false;
                    };
                    do {
                        var el = cur === document ? document.documentElement : cur;
                        var matches = el.matches || el.msMatchesSelector;
                        canReflect.each(handlersBySelector, function (handlers, selector) {
                            if (matches && matches.call(el, selector)) {
                                handlers.forEach(function (handler) {
                                    handler.call(el, ev);
                                });
                            }
                        });
                        cur = cur.parentNode;
                    } while (cur && cur !== ev.currentTarget && propagate);
                };
                this.events[eventType] = handlersBySelector;
                domEvents.addEventListener(this.element, eventType, handler, useCapture(eventType));
            },
            'can.getKeyValue': function (eventType) {
                return this.events[eventType];
            },
            'can.deleteKeyValue': function (eventType) {
                domEvents.removeEventListener(this.element, eventType, this.delegated[eventType], useCapture(eventType));
                delete this.delegated[eventType];
                delete this.events[eventType];
            },
            'can.getOwnEnumerableKeys': function () {
                return Object.keys(this.events);
            }
        });
        return Delegator;
    }
    module.exports = function makeDelegateEventTree(domEvents) {
        var Delegator = makeDelegator(domEvents);
        return new KeyTree([
            Map,
            Delegator,
            Object,
            Array
        ]);
    };
});
/*can-dom-events@1.3.10#can-dom-events*/
define('can-dom-events', [
    'require',
    'exports',
    'module',
    'can-namespace',
    'can-dom-events/helpers/util',
    'can-dom-events/helpers/make-event-registry',
    'can-dom-events/helpers/-make-delegate-event-tree'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var namespace = require('can-namespace');
        var util = require('can-dom-events/helpers/util');
        var makeEventRegistry = require('can-dom-events/helpers/make-event-registry');
        var makeDelegateEventTree = require('can-dom-events/helpers/-make-delegate-event-tree');
        var domEvents = {
            _eventRegistry: makeEventRegistry(),
            addEvent: function (event, eventType) {
                return this._eventRegistry.add(event, eventType);
            },
            addEventListener: function (target, eventType) {
                var hasCustomEvent = domEvents._eventRegistry.has(eventType);
                if (hasCustomEvent) {
                    var event = domEvents._eventRegistry.get(eventType);
                    return event.addEventListener.apply(domEvents, arguments);
                }
                var eventArgs = Array.prototype.slice.call(arguments, 1);
                return target.addEventListener.apply(target, eventArgs);
            },
            removeEventListener: function (target, eventType) {
                var hasCustomEvent = domEvents._eventRegistry.has(eventType);
                if (hasCustomEvent) {
                    var event = domEvents._eventRegistry.get(eventType);
                    return event.removeEventListener.apply(domEvents, arguments);
                }
                var eventArgs = Array.prototype.slice.call(arguments, 1);
                return target.removeEventListener.apply(target, eventArgs);
            },
            addDelegateListener: function (root, eventType, selector, handler) {
                domEvents._eventTree.add([
                    root,
                    eventType,
                    selector,
                    handler
                ]);
            },
            removeDelegateListener: function (target, eventType, selector, handler) {
                domEvents._eventTree.delete([
                    target,
                    eventType,
                    selector,
                    handler
                ]);
            },
            dispatch: function (target, eventData, bubbles, cancelable) {
                var event = util.createEvent(target, eventData, bubbles, cancelable);
                var enableForDispatch = util.forceEnabledForDispatch(target, event);
                if (enableForDispatch) {
                    target.disabled = false;
                }
                var ret = target.dispatchEvent(event);
                if (enableForDispatch) {
                    target.disabled = true;
                }
                return ret;
            }
        };
        domEvents._eventTree = makeDelegateEventTree(domEvents);
        module.exports = namespace.domEvents = domEvents;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-event-queue@1.1.6#dependency-record/merge*/
define('can-event-queue/dependency-record/merge', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var mergeValueDependencies = function mergeValueDependencies(obj, source) {
        var sourceValueDeps = source.valueDependencies;
        if (sourceValueDeps) {
            var destValueDeps = obj.valueDependencies;
            if (!destValueDeps) {
                destValueDeps = new Set();
                obj.valueDependencies = destValueDeps;
            }
            canReflect.eachIndex(sourceValueDeps, function (dep) {
                destValueDeps.add(dep);
            });
        }
    };
    var mergeKeyDependencies = function mergeKeyDependencies(obj, source) {
        var sourcekeyDeps = source.keyDependencies;
        if (sourcekeyDeps) {
            var destKeyDeps = obj.keyDependencies;
            if (!destKeyDeps) {
                destKeyDeps = new Map();
                obj.keyDependencies = destKeyDeps;
            }
            canReflect.eachKey(sourcekeyDeps, function (keys, obj) {
                var entry = destKeyDeps.get(obj);
                if (!entry) {
                    entry = new Set();
                    destKeyDeps.set(obj, entry);
                }
                canReflect.eachIndex(keys, function (key) {
                    entry.add(key);
                });
            });
        }
    };
    module.exports = function mergeDependencyRecords(object, source) {
        mergeKeyDependencies(object, source);
        mergeValueDependencies(object, source);
        return object;
    };
});
/*can-event-queue@1.1.6#map/map*/
define('can-event-queue/map/map', [
    'require',
    'exports',
    'module',
    'can-log/dev/dev',
    'can-queues',
    'can-reflect',
    'can-symbol',
    'can-key-tree',
    'can-dom-events',
    'can-dom-events/helpers/util',
    'can-event-queue/dependency-record/merge'
], function (require, exports, module) {
    'use strict';
    var canDev = require('can-log/dev/dev');
    var queues = require('can-queues');
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var KeyTree = require('can-key-tree');
    var domEvents = require('can-dom-events');
    var isDomEventTarget = require('can-dom-events/helpers/util').isDomEventTarget;
    var mergeDependencyRecords = require('can-event-queue/dependency-record/merge');
    var metaSymbol = canSymbol.for('can.meta'), dispatchBoundChangeSymbol = canSymbol.for('can.dispatchInstanceBoundChange'), dispatchInstanceOnPatchesSymbol = canSymbol.for('can.dispatchInstanceOnPatches'), onKeyValueSymbol = canSymbol.for('can.onKeyValue'), offKeyValueSymbol = canSymbol.for('can.offKeyValue'), onEventSymbol = canSymbol.for('can.onEvent'), offEventSymbol = canSymbol.for('can.offEvent'), onValueSymbol = canSymbol.for('can.onValue'), offValueSymbol = canSymbol.for('can.offValue'), inSetupSymbol = canSymbol.for('can.initializing');
    var legacyMapBindings;
    function addHandlers(obj, meta) {
        if (!meta.handlers) {
            meta.handlers = new KeyTree([
                Object,
                Object,
                Object,
                Array
            ], {
                onFirst: function () {
                    if (obj._eventSetup !== undefined) {
                        obj._eventSetup();
                    }
                    var constructor = obj.constructor;
                    if (constructor[dispatchBoundChangeSymbol] !== undefined && obj instanceof constructor) {
                        constructor[dispatchBoundChangeSymbol](obj, true);
                    }
                },
                onEmpty: function () {
                    if (obj._eventTeardown !== undefined) {
                        obj._eventTeardown();
                    }
                    var constructor = obj.constructor;
                    if (constructor[dispatchBoundChangeSymbol] !== undefined && obj instanceof constructor) {
                        constructor[dispatchBoundChangeSymbol](obj, false);
                    }
                }
            });
        }
        if (!meta.listenHandlers) {
            meta.listenHandlers = new KeyTree([
                Map,
                Map,
                Object,
                Array
            ]);
        }
    }
    var ensureMeta = function ensureMeta(obj) {
        var meta = obj[metaSymbol];
        if (!meta) {
            meta = {};
            canReflect.setKeyValue(obj, metaSymbol, meta);
        }
        addHandlers(obj, meta);
        return meta;
    };
    function stopListeningArgumentsToKeys(bindTarget, event, handler, queueName) {
        if (arguments.length && canReflect.isPrimitive(bindTarget)) {
            queueName = handler;
            handler = event;
            event = bindTarget;
            bindTarget = this.context;
        }
        if (typeof event === 'function') {
            queueName = handler;
            handler = event;
            event = undefined;
        }
        if (typeof handler === 'string') {
            queueName = handler;
            handler = undefined;
        }
        var keys = [];
        if (bindTarget) {
            keys.push(bindTarget);
            if (event || handler || queueName) {
                keys.push(event);
                if (queueName || handler) {
                    keys.push(queueName || this.defaultQueue);
                    if (handler) {
                        keys.push(handler);
                    }
                }
            }
        }
        return keys;
    }
    var props = {
        dispatch: function (event, args) {
            if (this.__inSetup !== true && this[inSetupSymbol] !== true) {
                if (typeof event === 'string') {
                    event = { type: event };
                }
                var meta = ensureMeta(this);
                var handlers = meta.handlers;
                var handlersByType = event.type !== undefined && handlers.getNode([event.type]);
                var dispatchConstructorPatches = event.patches && this.constructor[dispatchInstanceOnPatchesSymbol];
                var patchesNode = event.patches !== undefined && handlers.getNode([
                    'can.patches',
                    'onKeyValue'
                ]);
                var keysNode = event.keyChanged !== undefined && handlers.getNode([
                    'can.keys',
                    'onKeyValue'
                ]);
                var batch = dispatchConstructorPatches || handlersByType || patchesNode || keysNode;
                if (batch) {
                    queues.batch.start();
                }
                if (handlersByType) {
                    if (handlersByType.onKeyValue) {
                        queues.enqueueByQueue(handlersByType.onKeyValue, this, args, event.makeMeta, event.reasonLog);
                    }
                    if (handlersByType.event) {
                        event.batchNum = queues.batch.number();
                        var eventAndArgs = [event].concat(args);
                        queues.enqueueByQueue(handlersByType.event, this, eventAndArgs, event.makeMeta, event.reasonLog);
                    }
                }
                if (keysNode) {
                    queues.enqueueByQueue(keysNode, this, [event.keyChanged], event.makeMeta, event.reasonLog);
                }
                if (patchesNode) {
                    queues.enqueueByQueue(patchesNode, this, [event.patches], event.makeMeta, event.reasonLog);
                }
                if (dispatchConstructorPatches) {
                    this.constructor[dispatchInstanceOnPatchesSymbol](this, event.patches);
                }
                if (batch) {
                    queues.batch.stop();
                }
            }
            return event;
        },
        addEventListener: function (key, handler, queueName) {
            ensureMeta(this).handlers.add([
                key,
                'event',
                queueName || 'mutate',
                handler
            ]);
            return this;
        },
        removeEventListener: function (key, handler, queueName) {
            if (key === undefined) {
                var handlers = ensureMeta(this).handlers;
                var keyHandlers = handlers.getNode([]);
                Object.keys(keyHandlers).forEach(function (key) {
                    handlers.delete([
                        key,
                        'event'
                    ]);
                });
            } else if (!handler && !queueName) {
                ensureMeta(this).handlers.delete([
                    key,
                    'event'
                ]);
            } else if (!handler) {
                ensureMeta(this).handlers.delete([
                    key,
                    'event',
                    queueName || 'mutate'
                ]);
            } else {
                ensureMeta(this).handlers.delete([
                    key,
                    'event',
                    queueName || 'mutate',
                    handler
                ]);
            }
            return this;
        },
        one: function (event, handler) {
            var one = function () {
                legacyMapBindings.off.call(this, event, one);
                return handler.apply(this, arguments);
            };
            legacyMapBindings.on.call(this, event, one);
            return this;
        },
        listenTo: function (bindTarget, event, handler, queueName) {
            if (canReflect.isPrimitive(bindTarget)) {
                queueName = handler;
                handler = event;
                event = bindTarget;
                bindTarget = this;
            }
            if (typeof event === 'function') {
                queueName = handler;
                handler = event;
                event = undefined;
            }
            ensureMeta(this).listenHandlers.add([
                bindTarget,
                event,
                queueName || 'mutate',
                handler
            ]);
            legacyMapBindings.on.call(bindTarget, event, handler, queueName || 'mutate');
            return this;
        },
        stopListening: function () {
            var keys = stopListeningArgumentsToKeys.apply({
                context: this,
                defaultQueue: 'mutate'
            }, arguments);
            var listenHandlers = ensureMeta(this).listenHandlers;
            function deleteHandler(bindTarget, event, queue, handler) {
                legacyMapBindings.off.call(bindTarget, event, handler, queue);
            }
            listenHandlers.delete(keys, deleteHandler);
            return this;
        },
        on: function (eventName, handler, queue) {
            var listenWithDOM = isDomEventTarget(this);
            if (listenWithDOM) {
                if (typeof handler === 'string') {
                    domEvents.addDelegateListener(this, eventName, handler, queue);
                } else {
                    domEvents.addEventListener(this, eventName, handler, queue);
                }
            } else {
                if (this[onEventSymbol]) {
                    this[onEventSymbol](eventName, handler, queue);
                } else if ('addEventListener' in this) {
                    this.addEventListener(eventName, handler, queue);
                } else if (this[onKeyValueSymbol]) {
                    canReflect.onKeyValue(this, eventName, handler, queue);
                } else {
                    if (!eventName && this[onValueSymbol]) {
                        canReflect.onValue(this, handler, queue);
                    } else {
                        throw new Error('can-event-queue: Unable to bind ' + eventName);
                    }
                }
            }
            return this;
        },
        off: function (eventName, handler, queue) {
            var listenWithDOM = isDomEventTarget(this);
            if (listenWithDOM) {
                if (typeof handler === 'string') {
                    domEvents.removeDelegateListener(this, eventName, handler, queue);
                } else {
                    domEvents.removeEventListener(this, eventName, handler, queue);
                }
            } else {
                if (this[offEventSymbol]) {
                    this[offEventSymbol](eventName, handler, queue);
                } else if ('removeEventListener' in this) {
                    this.removeEventListener(eventName, handler, queue);
                } else if (this[offKeyValueSymbol]) {
                    canReflect.offKeyValue(this, eventName, handler, queue);
                } else {
                    if (!eventName && this[offValueSymbol]) {
                        canReflect.offValue(this, handler, queue);
                    } else {
                        throw new Error('can-event-queue: Unable to unbind ' + eventName);
                    }
                }
            }
            return this;
        }
    };
    var symbols = {
        'can.onKeyValue': function (key, handler, queueName) {
            ensureMeta(this).handlers.add([
                key,
                'onKeyValue',
                queueName || 'mutate',
                handler
            ]);
        },
        'can.offKeyValue': function (key, handler, queueName) {
            ensureMeta(this).handlers.delete([
                key,
                'onKeyValue',
                queueName || 'mutate',
                handler
            ]);
        },
        'can.isBound': function () {
            return !ensureMeta(this).handlers.isEmpty();
        },
        'can.getWhatIChange': function getWhatIChange(key) {
        },
        'can.onPatches': function (handler, queue) {
            var handlers = ensureMeta(this).handlers;
            handlers.add([
                'can.patches',
                'onKeyValue',
                queue || 'notify',
                handler
            ]);
        },
        'can.offPatches': function (handler, queue) {
            var handlers = ensureMeta(this).handlers;
            handlers.delete([
                'can.patches',
                'onKeyValue',
                queue || 'notify',
                handler
            ]);
        }
    };
    function defineNonEnumerable(obj, prop, value) {
        Object.defineProperty(obj, prop, {
            enumerable: false,
            value: value
        });
    }
    legacyMapBindings = function (obj) {
        canReflect.assignMap(obj, props);
        return canReflect.assignSymbols(obj, symbols);
    };
    defineNonEnumerable(legacyMapBindings, 'addHandlers', addHandlers);
    defineNonEnumerable(legacyMapBindings, 'stopListeningArgumentsToKeys', stopListeningArgumentsToKeys);
    props.bind = props.addEventListener;
    props.unbind = props.removeEventListener;
    canReflect.assignMap(legacyMapBindings, props);
    canReflect.assignSymbols(legacyMapBindings, symbols);
    defineNonEnumerable(legacyMapBindings, 'start', function () {
        console.warn('use can-queues.batch.start()');
        queues.batch.start();
    });
    defineNonEnumerable(legacyMapBindings, 'stop', function () {
        console.warn('use can-queues.batch.stop()');
        queues.batch.stop();
    });
    defineNonEnumerable(legacyMapBindings, 'flush', function () {
        console.warn('use can-queues.flush()');
        queues.flush();
    });
    defineNonEnumerable(legacyMapBindings, 'afterPreviousEvents', function (handler) {
        console.warn('don\'t use afterPreviousEvents');
        queues.mutateQueue.enqueue(function afterPreviousEvents() {
            queues.mutateQueue.enqueue(handler);
        });
        queues.flush();
    });
    defineNonEnumerable(legacyMapBindings, 'after', function (handler) {
        console.warn('don\'t use after');
        queues.mutateQueue.enqueue(handler);
        queues.flush();
    });
    module.exports = legacyMapBindings;
});
/*can-observe@2.3.0#src/-symbols*/
define('can-observe/src/-symbols', [
    'require',
    'exports',
    'module',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    module.exports = {
        metaSymbol: canSymbol.for('can.meta'),
        patchesSymbol: 'can.patches',
        keysSymbol: 'can.keys'
    };
});
/*can-observe@2.3.0#src/-observable-store*/
define('can-observe/src/-observable-store', function (require, exports, module) {
    'use strict';
    module.exports = {
        proxiedObjects: new WeakMap(),
        proxies: new WeakSet()
    };
});
/*can-observe@2.3.0#src/-helpers*/
define('can-observe/src/-helpers', [
    'require',
    'exports',
    'module',
    'can-globals/global/global',
    'can-symbol'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var getGlobal = require('can-globals/global/global');
        var canSymbol = require('can-symbol');
        var metaSymbol = canSymbol.for('can.meta');
        var classTest = /^\s*class\s+/;
        var helpers = {
            assignEverything: function (d, s) {
                Object.getOwnPropertyNames(s).concat(Object.getOwnPropertySymbols(s)).forEach(function (key) {
                    Object.defineProperty(d, key, Object.getOwnPropertyDescriptor(s, key));
                });
                return d;
            },
            isBuiltInButNotArrayOrPlainObjectOrElement: function (obj) {
                if (obj instanceof getGlobal().Element) {
                    return false;
                }
                return helpers.isBuiltInButNotArrayOrPlainObject(obj);
            },
            isBuiltInButNotArrayOrPlainObject: function (obj) {
                if (Array.isArray(obj)) {
                    return false;
                }
                if (typeof obj === 'function') {
                    var fnCode = obj.toString();
                    if (fnCode.indexOf('[native code]') > 0) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    var toString = Object.prototype.toString.call(obj);
                    return toString !== '[object Object]' && toString.indexOf('[object ') !== -1;
                }
            },
            inheritsFromArray: function (obj) {
                var cur = obj;
                do {
                    if (Array.isArray(cur)) {
                        return true;
                    }
                    cur = Object.getPrototypeOf(cur);
                } while (cur);
                return false;
            },
            isClass: function (obj) {
                return typeof obj === 'function' && classTest.test(obj.toString());
            },
            supportsClass: function () {
                try {
                    eval('"use strict"; class A{};');
                    return true;
                } catch (e) {
                    return false;
                }
            }(),
            makeSimpleExtender: function (BaseType) {
                return function extend(name, staticProps, prototypeProps) {
                    var Type = function () {
                        var source = this;
                        var instance = BaseType.apply(this, arguments);
                        if (source.init) {
                            instance[metaSymbol].preventSideEffects++;
                            source.init.apply(instance, arguments);
                            instance[metaSymbol].preventSideEffects--;
                        }
                        return instance;
                    };
                    helpers.assignEverything(Type, BaseType);
                    helpers.assignEverything(Type, staticProps || {});
                    Type.extend = helpers.makeSimpleExtender(Type);
                    Type.prototype = Object.create(BaseType.prototype);
                    helpers.assignEverything(Type.prototype, prototypeProps || {});
                    Type.prototype.constructor = Type;
                    return Type;
                };
            },
            assignNonEnumerable: function (obj, key, value) {
                return Object.defineProperty(obj, key, {
                    enumerable: false,
                    writable: true,
                    configurable: true,
                    value: value
                });
            }
        };
        module.exports = helpers;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-define-lazy-value@1.1.1#define-lazy-value*/
define('can-define-lazy-value', function (require, exports, module) {
    'use strict';
    module.exports = function defineLazyValue(obj, prop, initializer, writable) {
        Object.defineProperty(obj, prop, {
            configurable: true,
            get: function () {
                Object.defineProperty(this, prop, {
                    value: undefined,
                    writable: true
                });
                var value = initializer.call(this, obj, prop);
                Object.defineProperty(this, prop, {
                    value: value,
                    writable: !!writable
                });
                return value;
            },
            set: function (value) {
                Object.defineProperty(this, prop, {
                    value: value,
                    writable: !!writable
                });
                return value;
            }
        });
    };
});
/*can-event-queue@1.1.6#value/value*/
define('can-event-queue/value/value', [
    'require',
    'exports',
    'module',
    'can-queues',
    'can-key-tree',
    'can-reflect',
    'can-define-lazy-value',
    'can-event-queue/dependency-record/merge'
], function (require, exports, module) {
    'use strict';
    var queues = require('can-queues');
    var KeyTree = require('can-key-tree');
    var canReflect = require('can-reflect');
    var defineLazyValue = require('can-define-lazy-value');
    var mergeDependencyRecords = require('can-event-queue/dependency-record/merge');
    var properties = {
        on: function (handler, queue) {
            this.handlers.add([
                queue || 'mutate',
                handler
            ]);
        },
        off: function (handler, queueName) {
            if (handler === undefined) {
                if (queueName === undefined) {
                    this.handlers.delete([]);
                } else {
                    this.handlers.delete([queueName]);
                }
            } else {
                this.handlers.delete([
                    queueName || 'mutate',
                    handler
                ]);
            }
        }
    };
    var symbols = {
        'can.onValue': properties.on,
        'can.offValue': properties.off,
        'can.dispatch': function (value, old) {
            var queuesArgs = [];
            queuesArgs = [
                this.handlers.getNode([]),
                this,
                [
                    value,
                    old
                ]
            ];
            queues.enqueueByQueue.apply(queues, queuesArgs);
        },
        'can.getWhatIChange': function getWhatIChange() {
        },
        'can.isBound': function isBound() {
            return !this.handlers.isEmpty();
        }
    };
    function defineLazyHandlers() {
        return new KeyTree([
            Object,
            Array
        ], {
            onFirst: this.onBound !== undefined && this.onBound.bind(this),
            onEmpty: this.onUnbound !== undefined && this.onUnbound.bind(this)
        });
    }
    var mixinValueEventBindings = function (obj) {
        canReflect.assign(obj, properties);
        canReflect.assignSymbols(obj, symbols);
        defineLazyValue(obj, 'handlers', defineLazyHandlers, true);
        return obj;
    };
    mixinValueEventBindings.addHandlers = function (obj, callbacks) {
        console.warn('can-event-queue/value: Avoid using addHandlers. Add onBound and onUnbound methods instead.');
        obj.handlers = new KeyTree([
            Object,
            Array
        ], callbacks);
        return obj;
    };
    module.exports = mixinValueEventBindings;
});
/*can-observation@4.1.2#recorder-dependency-helpers*/
define('can-observation/recorder-dependency-helpers', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    function addNewKeyDependenciesIfNotInOld(event) {
        if (this.oldEventSet === undefined || this.oldEventSet['delete'](event) === false) {
            canReflect.onKeyValue(this.observable, event, this.onDependencyChange, 'notify');
        }
    }
    function addObservablesNewKeyDependenciesIfNotInOld(eventSet, observable) {
        eventSet.forEach(addNewKeyDependenciesIfNotInOld, {
            onDependencyChange: this.onDependencyChange,
            observable: observable,
            oldEventSet: this.oldDependencies.keyDependencies.get(observable)
        });
    }
    function removeKeyDependencies(event) {
        canReflect.offKeyValue(this.observable, event, this.onDependencyChange, 'notify');
    }
    function removeObservablesKeyDependencies(oldEventSet, observable) {
        oldEventSet.forEach(removeKeyDependencies, {
            onDependencyChange: this.onDependencyChange,
            observable: observable
        });
    }
    function addValueDependencies(observable) {
        if (this.oldDependencies.valueDependencies.delete(observable) === false) {
            canReflect.onValue(observable, this.onDependencyChange, 'notify');
        }
    }
    function removeValueDependencies(observable) {
        canReflect.offValue(observable, this.onDependencyChange, 'notify');
    }
    module.exports = {
        updateObservations: function (observationData) {
            observationData.newDependencies.keyDependencies.forEach(addObservablesNewKeyDependenciesIfNotInOld, observationData);
            observationData.oldDependencies.keyDependencies.forEach(removeObservablesKeyDependencies, observationData);
            observationData.newDependencies.valueDependencies.forEach(addValueDependencies, observationData);
            observationData.oldDependencies.valueDependencies.forEach(removeValueDependencies, observationData);
        },
        stopObserving: function (observationReciever, onDependencyChange) {
            observationReciever.keyDependencies.forEach(removeObservablesKeyDependencies, { onDependencyChange: onDependencyChange });
            observationReciever.valueDependencies.forEach(removeValueDependencies, { onDependencyChange: onDependencyChange });
        }
    };
});
/*can-observation@4.1.2#temporarily-bind*/
define('can-observation/temporarily-bind', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var temporarilyBoundNoOperation = function () {
    };
    var observables;
    var unbindTemporarilyBoundValue = function () {
        for (var i = 0, len = observables.length; i < len; i++) {
            canReflect.offValue(observables[i], temporarilyBoundNoOperation);
        }
        observables = null;
    };
    function temporarilyBind(compute) {
        var computeInstance = compute.computeInstance || compute;
        canReflect.onValue(computeInstance, temporarilyBoundNoOperation);
        if (!observables) {
            observables = [];
            setTimeout(unbindTemporarilyBoundValue, 10);
        }
        observables.push(computeInstance);
    }
    module.exports = temporarilyBind;
});
/*can-observation@4.1.2#can-observation*/
define('can-observation', [
    'require',
    'exports',
    'module',
    'can-namespace',
    'can-reflect',
    'can-queues',
    'can-observation-recorder',
    'can-symbol',
    'can-log/dev/dev',
    'can-event-queue/value/value',
    'can-observation/recorder-dependency-helpers',
    'can-observation/temporarily-bind'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var namespace = require('can-namespace');
        var canReflect = require('can-reflect');
        var queues = require('can-queues');
        var ObservationRecorder = require('can-observation-recorder');
        var canSymbol = require('can-symbol');
        var dev = require('can-log/dev/dev');
        var valueEventBindings = require('can-event-queue/value/value');
        var recorderHelpers = require('can-observation/recorder-dependency-helpers');
        var temporarilyBind = require('can-observation/temporarily-bind');
        var dispatchSymbol = canSymbol.for('can.dispatch');
        var getChangesSymbol = canSymbol.for('can.getChangesDependencyRecord');
        var getValueDependenciesSymbol = canSymbol.for('can.getValueDependencies');
        function Observation(func, context, options) {
            this.func = func;
            this.context = context;
            this.options = options || {
                priority: 0,
                isObservable: true
            };
            this.bound = false;
            this._value = undefined;
            this.newDependencies = ObservationRecorder.makeDependenciesRecord();
            this.oldDependencies = null;
            var self = this;
            this.onDependencyChange = function (newVal) {
                self.dependencyChange(this, newVal);
            };
            this.update = this.update.bind(this);
        }
        valueEventBindings(Observation.prototype);
        canReflect.assign(Observation.prototype, {
            onBound: function () {
                this.bound = true;
                this.oldDependencies = this.newDependencies;
                ObservationRecorder.start(this._name);
                this._value = this.func.call(this.context);
                this.newDependencies = ObservationRecorder.stop();
                recorderHelpers.updateObservations(this);
            },
            dependencyChange: function (context, args) {
                if (this.bound === true) {
                    var queuesArgs = [];
                    queuesArgs = [
                        this.update,
                        this,
                        [],
                        { priority: this.options.priority }
                    ];
                    queues.deriveQueue.enqueue.apply(queues.deriveQueue, queuesArgs);
                }
            },
            update: function () {
                if (this.bound === true) {
                    var oldValue = this._value;
                    this.oldValue = null;
                    this.onBound();
                    if (oldValue !== this._value) {
                        this[dispatchSymbol](this._value, oldValue);
                    }
                }
            },
            onUnbound: function () {
                this.bound = false;
                recorderHelpers.stopObserving(this.newDependencies, this.onDependencyChange);
                this.newDependencies = ObservationRecorder.makeDependenciesRecord();
            },
            get: function () {
                if (this.options.isObservable && ObservationRecorder.isRecording()) {
                    ObservationRecorder.add(this);
                    if (this.bound === false) {
                        Observation.temporarilyBind(this);
                    }
                }
                if (this.bound === true) {
                    if (queues.deriveQueue.tasksRemainingCount() > 0) {
                        Observation.updateChildrenAndSelf(this);
                    }
                    return this._value;
                } else {
                    return this.func.call(this.context);
                }
            },
            hasDependencies: function () {
                var newDependencies = this.newDependencies;
                return this.bound ? newDependencies.valueDependencies.size + newDependencies.keyDependencies.size > 0 : undefined;
            },
            log: function () {
            }
        });
        Object.defineProperty(Observation.prototype, 'value', {
            get: function () {
                return this.get();
            }
        });
        var observationProto = {
            'can.getValue': Observation.prototype.get,
            'can.isValueLike': true,
            'can.isMapLike': false,
            'can.isListLike': false,
            'can.valueHasDependencies': Observation.prototype.hasDependencies,
            'can.getValueDependencies': function () {
                if (this.bound === true) {
                    var deps = this.newDependencies, result = {};
                    if (deps.keyDependencies.size) {
                        result.keyDependencies = deps.keyDependencies;
                    }
                    if (deps.valueDependencies.size) {
                        result.valueDependencies = deps.valueDependencies;
                    }
                    return result;
                }
                return undefined;
            },
            'can.getPriority': function () {
                return this.options.priority;
            },
            'can.setPriority': function (priority) {
                this.options.priority = priority;
            }
        };
        canReflect.assignSymbols(Observation.prototype, observationProto);
        Observation.updateChildrenAndSelf = function (observation) {
            if (observation.update !== undefined && queues.deriveQueue.isEnqueued(observation.update) === true) {
                queues.deriveQueue.flushQueuedTask(observation.update);
                return true;
            }
            if (observation[getValueDependenciesSymbol]) {
                var childHasChanged = false;
                var valueDependencies = observation[getValueDependenciesSymbol]().valueDependencies || [];
                valueDependencies.forEach(function (observable) {
                    if (Observation.updateChildrenAndSelf(observable) === true) {
                        childHasChanged = true;
                    }
                });
                return childHasChanged;
            } else {
                return false;
            }
        };
        var alias = { addAll: 'addMany' };
        [
            'add',
            'addAll',
            'ignore',
            'trap',
            'trapsCount',
            'isRecording'
        ].forEach(function (methodName) {
            Observation[methodName] = function () {
                var name = alias[methodName] ? alias[methodName] : methodName;
                console.warn('can-observation: Call ' + name + '() on can-observation-recorder.');
                return ObservationRecorder[name].apply(this, arguments);
            };
        });
        Observation.prototype.start = function () {
            console.warn('can-observation: Use .on and .off to bind.');
            return this.onBound();
        };
        Observation.prototype.stop = function () {
            console.warn('can-observation: Use .on and .off to bind.');
            return this.onUnbound();
        };
        Observation.temporarilyBind = temporarilyBind;
        module.exports = namespace.Observation = Observation;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-observe@2.3.0#src/-computed-helpers*/
define('can-observe/src/-computed-helpers', [
    'require',
    'exports',
    'module',
    'can-observation',
    'can-observation-recorder',
    'can-event-queue/map/map',
    'can-reflect',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var Observation = require('can-observation');
    var ObservationRecorder = require('can-observation-recorder');
    var mapBindings = require('can-event-queue/map/map');
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var canMeta = canSymbol.for('can.meta');
    var computedPropertyDefinitionSymbol = canSymbol.for('can.computedPropertyDefinitions');
    var onKeyValueSymbol = canSymbol.for('can.onKeyValue');
    var offKeyValueSymbol = canSymbol.for('can.offKeyValue');
    function ComputedObjectObservationData(instance, prop, observation) {
        this.instance = instance;
        this.prop = prop;
        this.observation = observation;
        this.forward = this.forward.bind(this);
    }
    ComputedObjectObservationData.prototype.bind = function () {
        this.bindingCount++;
        if (this.bindingCount === 1) {
            this.observation.on(this.forward, 'notify');
        }
    };
    ComputedObjectObservationData.prototype.unbind = function () {
        this.bindingCount--;
        if (this.bindingCount === 0) {
            this.observation.off(this.forward, 'notify');
        }
    };
    ComputedObjectObservationData.prototype.forward = function (newValue, oldValue) {
        mapBindings.dispatch.call(this.instance, {
            type: this.prop,
            target: this.instance
        }, [
            newValue,
            oldValue
        ]);
    };
    ComputedObjectObservationData.prototype.bindingCount = 0;
    function findComputed(instance, key) {
        var meta = instance[canMeta];
        var target = meta.target;
        var computedPropertyDefinitions = target[computedPropertyDefinitionSymbol];
        if (computedPropertyDefinitions === undefined) {
            return;
        }
        var computedPropertyDefinition = computedPropertyDefinitions[key];
        if (computedPropertyDefinition === undefined) {
            return;
        }
        if (meta.computedKeys[key] === undefined) {
            meta.computedKeys[key] = new ComputedObjectObservationData(instance, key, computedPropertyDefinition(instance, key));
        }
        return meta.computedKeys[key];
    }
    var computedHelpers = module.exports = {
        get: function (instance, key) {
            var computedObj = findComputed(instance, key);
            if (computedObj === undefined) {
                return;
            }
            ObservationRecorder.add(instance, key.toString());
            if (computedObj.bindingCount === 0 && ObservationRecorder.isRecording()) {
                Observation.temporarilyBind(computedObj.observation);
            }
            return { value: canReflect.getValue(computedObj.observation) };
        },
        set: function (instance, key, value) {
            var computedObj = findComputed(instance, key);
            if (computedObj === undefined) {
                return false;
            }
            canReflect.setValue(computedObj.observation, value);
            return true;
        },
        bind: function (instance, key) {
            var computedObj = findComputed(instance, key);
            if (computedObj === undefined) {
                return;
            }
            computedObj.bind();
        },
        unbind: function (instance, key) {
            var computedObj = findComputed(instance, key);
            if (computedObj === undefined) {
                return;
            }
            computedObj.unbind();
        },
        addKeyDependencies: function (proxyKeys) {
            var onKeyValue = proxyKeys[onKeyValueSymbol];
            var offKeyValue = proxyKeys[offKeyValueSymbol];
            canReflect.assignSymbols(proxyKeys, {
                'can.onKeyValue': function (key, handler, queue) {
                    computedHelpers.bind(this, key);
                    return onKeyValue.apply(this, arguments);
                },
                'can.offKeyValue': function (key, handler, queue) {
                    computedHelpers.unbind(this, key);
                    return offKeyValue.apply(this, arguments);
                },
                'can.getKeyDependencies': function (key) {
                    var computedObj = findComputed(this, key);
                    if (computedObj === undefined) {
                        return;
                    }
                    return { valueDependencies: new Set([computedObj.observation]) };
                }
            });
        },
        addMethodsAndSymbols: function (Type) {
            Type.prototype.addEventListener = function (key, handler, queue) {
                computedHelpers.bind(this, key);
                return mapBindings.addEventListener.call(this, key, handler, queue);
            };
            Type.prototype.removeEventListener = function (key, handler, queue) {
                computedHelpers.unbind(this, key);
                return mapBindings.removeEventListener.call(this, key, handler, queue);
            };
        },
        ensureDefinition: function (prototype) {
            if (!prototype.hasOwnProperty(computedPropertyDefinitionSymbol)) {
                var parent = prototype[computedPropertyDefinitionSymbol];
                var definitions = prototype[computedPropertyDefinitionSymbol] = Object.create(parent || null);
                Object.getOwnPropertyNames(prototype).forEach(function (prop) {
                    if (prop === 'constructor') {
                        return;
                    }
                    var descriptor = Object.getOwnPropertyDescriptor(prototype, prop);
                    if (descriptor.get !== undefined) {
                        var getter = descriptor.get;
                        definitions[prop] = function (instance, property) {
                            return new Observation(getter, instance);
                        };
                    }
                });
            }
            return prototype[computedPropertyDefinitionSymbol];
        }
    };
});
/*can-observe@2.3.0#src/-make-object*/
define('can-observe/src/-make-object', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-observation-recorder',
    'can-event-queue/map/map',
    'can-observe/src/-symbols',
    'can-observe/src/-observable-store',
    'can-observe/src/-helpers',
    'can-observe/src/-computed-helpers'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var ObservationRecorder = require('can-observation-recorder');
    var mapBindings = require('can-event-queue/map/map');
    var symbols = require('can-observe/src/-symbols');
    var observableStore = require('can-observe/src/-observable-store');
    var helpers = require('can-observe/src/-helpers');
    var computedHelpers = require('can-observe/src/-computed-helpers');
    var hasOwn = Object.prototype.hasOwnProperty;
    var isSymbolLike = canReflect.isSymbolLike;
    var proxyKeys = Object.create(null);
    Object.getOwnPropertySymbols(mapBindings).forEach(function (symbol) {
        helpers.assignNonEnumerable(proxyKeys, symbol, mapBindings[symbol]);
    });
    computedHelpers.addKeyDependencies(proxyKeys);
    var makeObject = {
        observable: function (object, options) {
            if (options.shouldRecordObservation === undefined) {
                options.shouldRecordObservation = makeObject.shouldRecordObservationOnOwnAndMissingKeys;
            }
            var meta = {
                target: object,
                proxyKeys: options.proxyKeys !== undefined ? options.proxyKeys : Object.create(makeObject.proxyKeys()),
                computedKeys: Object.create(null),
                options: options,
                preventSideEffects: 0
            };
            helpers.assignNonEnumerable(meta.proxyKeys, symbols.metaSymbol, meta);
            var traps = {
                get: makeObject.get.bind(meta),
                set: makeObject.set.bind(meta),
                ownKeys: makeObject.ownKeys.bind(meta),
                deleteProperty: makeObject.deleteProperty.bind(meta),
                getOwnPropertyDescriptor: makeObject.getOwnPropertyDescriptor.bind(meta),
                meta: meta
            };
            if (options.getPrototypeOf) {
                traps.getPrototypeOf = options.getPrototypeOf;
            }
            meta.proxy = new Proxy(object, traps);
            mapBindings.addHandlers(meta.proxy, meta);
            return meta.proxy;
        },
        proxyKeys: function () {
            return proxyKeys;
        },
        get: function (target, key, receiver) {
            var proxyKey = this.proxyKeys[key];
            if (proxyKey !== undefined) {
                return proxyKey;
            }
            if (isSymbolLike(key)) {
                return target[key];
            }
            var computedValue = computedHelpers.get(receiver, key);
            if (computedValue !== undefined) {
                return computedValue.value;
            }
            var keyInfo = makeObject.getKeyInfo(target, key, receiver, this);
            var value = keyInfo.targetValue;
            if (!keyInfo.valueIsInvariant) {
                value = makeObject.getValueFromStore(key, value, this);
            }
            if (this.options.shouldRecordObservation(keyInfo, this)) {
                ObservationRecorder.add(this.proxy, key.toString());
            }
            if (keyInfo.parentObservableGetCalledOn) {
                ObservationRecorder.add(keyInfo.parentObservableGetCalledOn, key.toString());
            }
            return value;
        },
        set: function (target, key, value, receiver) {
            if (receiver !== this.proxy && this.options.proxiedPrototype !== true) {
                return makeObject.setKey(receiver, key, value, this);
            }
            var computedValue = computedHelpers.set(receiver, key, value);
            if (computedValue === true) {
                return true;
            }
            value = makeObject.getValueToSet(key, value, this);
            makeObject.setValueAndOnChange(key, value, this, function (key, value, meta, hadOwn, old) {
                var dispatchArgs = {
                    type: key,
                    patches: [{
                            key: key,
                            type: hadOwn ? 'set' : 'add',
                            value: value
                        }],
                    keyChanged: !hadOwn ? key : undefined
                };
                mapBindings.dispatch.call(meta.proxy, dispatchArgs, [
                    value,
                    old
                ]);
            });
            return true;
        },
        deleteProperty: function (target, key) {
            var old = this.target[key], deleteSuccessful = delete this.target[key];
            if (deleteSuccessful && this.preventSideEffects === 0 && old !== undefined) {
                var dispatchArgs = {
                    type: key,
                    patches: [{
                            key: key,
                            type: 'delete'
                        }],
                    keyChanged: key
                };
                mapBindings.dispatch.call(this.proxy, dispatchArgs, [
                    undefined,
                    old
                ]);
            }
            return deleteSuccessful;
        },
        ownKeys: function (target) {
            ObservationRecorder.add(this.proxy, symbols.keysSymbol);
            return Object.getOwnPropertyNames(this.target).concat(Object.getOwnPropertySymbols(this.target)).concat(Object.getOwnPropertySymbols(this.proxyKeys));
        },
        getOwnPropertyDescriptor: function (target, key) {
            var desc = Object.getOwnPropertyDescriptor(target, key);
            if (!desc && key in this.proxyKeys) {
                return Object.getOwnPropertyDescriptor(this.proxyKeys, key);
            }
            return desc;
        },
        getKeyInfo: function (target, key, receiver, meta) {
            var descriptor = Object.getOwnPropertyDescriptor(target, key);
            var propertyInfo = {
                key: key,
                descriptor: descriptor,
                targetHasOwnKey: Boolean(descriptor),
                getCalledOnParent: receiver !== meta.proxy,
                protoHasKey: false,
                valueIsInvariant: false,
                targetValue: undefined,
                isAccessor: false
            };
            if (propertyInfo.getCalledOnParent === true) {
                propertyInfo.parentObservableGetCalledOn = observableStore.proxiedObjects.get(receiver);
            }
            if (descriptor !== undefined) {
                propertyInfo.valueIsInvariant = descriptor.writable === false;
                if (descriptor.get !== undefined) {
                    propertyInfo.targetValue = descriptor.get.call(propertyInfo.parentObservableGetCalledOn || receiver);
                    propertyInfo.isAccessor = true;
                } else {
                    propertyInfo.targetValue = descriptor.value;
                }
            } else {
                propertyInfo.targetValue = meta.target[key];
                propertyInfo.protoHasKey = propertyInfo.targetValue !== undefined ? true : key in target;
            }
            return propertyInfo;
        },
        shouldRecordObservationOnOwnAndMissingKeys: function (keyInfo, meta) {
            return meta.preventSideEffects === 0 && !keyInfo.isAccessor && (keyInfo.targetHasOwnKey || !keyInfo.protoHasKey && !Object.isSealed(meta.target));
        },
        setKey: function (receiver, key, value) {
            Object.defineProperty(receiver, key, {
                value: value,
                configurable: true,
                enumerable: true,
                writable: true
            });
            return true;
        },
        getValueToSet: function (key, value, meta) {
            if (!canReflect.isSymbolLike(key) && meta.handlers.getNode([key])) {
                return makeObject.getValueFromStore(key, value, meta);
            }
            return value;
        },
        getValueFromStore: function (key, value, meta) {
            if (!canReflect.isPrimitive(value) && !canReflect.isObservableLike(value) && !observableStore.proxies.has(value)) {
                if (observableStore.proxiedObjects.has(value)) {
                    value = observableStore.proxiedObjects.get(value);
                } else if (!helpers.isBuiltInButNotArrayOrPlainObject(value)) {
                    value = meta.options.observe(value);
                }
            }
            return value;
        },
        setValueAndOnChange: function (key, value, data, onChange) {
            var old, change;
            var hadOwn = hasOwn.call(data.target, key);
            var descriptor = Object.getOwnPropertyDescriptor(data.target, key);
            if (descriptor && descriptor.set) {
                descriptor.set.call(data.proxy, value);
            } else {
                old = data.target[key];
                change = old !== value;
                if (change) {
                    data.target[key] = value;
                    if (data.preventSideEffects === 0) {
                        onChange(key, value, data, hadOwn, old);
                    }
                }
            }
        }
    };
    module.exports = makeObject;
});
/*can-observe@2.3.0#src/-make-array*/
define('can-observe/src/-make-array', [
    'require',
    'exports',
    'module',
    'can-observation-recorder',
    'can-event-queue/map/map',
    'can-reflect',
    'can-observe/src/-make-object',
    'can-observe/src/-symbols',
    'can-observe/src/-observable-store',
    'can-observe/src/-helpers',
    'can-observe/src/-computed-helpers'
], function (require, exports, module) {
    'use strict';
    var ObservationRecorder = require('can-observation-recorder');
    var mapBindings = require('can-event-queue/map/map');
    var canReflect = require('can-reflect');
    var makeObject = require('can-observe/src/-make-object');
    var symbols = require('can-observe/src/-symbols');
    var observableStore = require('can-observe/src/-observable-store');
    var helpers = require('can-observe/src/-helpers');
    var computedHelpers = require('can-observe/src/-computed-helpers');
    var isSymbolLike = canReflect.isSymbolLike;
    var isInteger = Number.isInteger || function (value) {
        return typeof value === 'number' && isFinite(value) && Math.floor(value) === value;
    };
    function didLengthChangeCauseDeletions(key, value, old) {
        return key === 'length' && value < old;
    }
    var mutateMethods = {
        'push': function (arr, args) {
            return [{
                    index: arr.length - args.length,
                    deleteCount: 0,
                    insert: args,
                    type: 'splice'
                }];
        },
        'pop': function (arr) {
            return [{
                    index: arr.length,
                    deleteCount: 1,
                    insert: [],
                    type: 'splice'
                }];
        },
        'shift': function () {
            return [{
                    index: 0,
                    deleteCount: 1,
                    insert: [],
                    type: 'splice'
                }];
        },
        'unshift': function (arr, args) {
            return [{
                    index: 0,
                    deleteCount: 0,
                    insert: args,
                    type: 'splice'
                }];
        },
        'splice': function (arr, args) {
            return [{
                    index: args[0],
                    deleteCount: args[1],
                    insert: args.slice(2),
                    type: 'splice'
                }];
        },
        'sort': function (arr) {
            return [{
                    index: 0,
                    deleteCount: arr.length,
                    insert: arr,
                    type: 'splice'
                }];
        },
        'reverse': function (arr, args, old) {
            return [{
                    index: 0,
                    deleteCount: arr.length,
                    insert: arr,
                    type: 'splice'
                }];
        }
    };
    canReflect.eachKey(mutateMethods, function (makePatches, prop) {
        var protoFn = Array.prototype[prop];
        var mutateMethod = function () {
            var meta = this[symbols.metaSymbol], makeSideEffects = meta.preventSideEffects === 0, oldLength = meta.target.length;
            meta.preventSideEffects++;
            var ret = protoFn.apply(meta.target, arguments);
            var patches = makePatches(meta.target, Array.from(arguments), oldLength);
            if (makeSideEffects === true) {
                var dispatchArgs = {
                    type: 'length',
                    patches: patches
                };
                mapBindings.dispatch.call(meta.proxy, dispatchArgs, [
                    meta.target.length,
                    oldLength
                ]);
            }
            meta.preventSideEffects--;
            return ret;
        };
        observableStore.proxiedObjects.set(protoFn, mutateMethod);
        observableStore.proxies.add(mutateMethod);
    });
    Object.getOwnPropertyNames(Array.prototype).forEach(function (prop) {
        var protoFn = Array.prototype[prop];
        if (observableStore.proxiedObjects.has(protoFn)) {
            return;
        }
        if (prop !== 'constructor' && typeof protoFn === 'function') {
            var arrayMethod = function () {
                ObservationRecorder.add(this, symbols.patchesSymbol);
                var meta = this[symbols.metaSymbol];
                meta.preventSideEffects++;
                var ret = protoFn.apply(this, arguments);
                meta.preventSideEffects--;
                return meta.options.observe(ret);
            };
            observableStore.proxiedObjects.set(protoFn, arrayMethod);
            observableStore.proxies.add(arrayMethod);
        }
    });
    var proxyKeys = helpers.assignEverything(Object.create(null), makeObject.proxyKeys());
    var makeArray = {
        observable: function (array, options) {
            if (options.shouldRecordObservation === undefined) {
                options.shouldRecordObservation = makeObject.shouldRecordObservationOnOwnAndMissingKeys;
            }
            var meta = {
                target: array,
                proxyKeys: options.proxyKeys !== undefined ? options.proxyKeys : Object.create(makeArray.proxyKeys()),
                computedKeys: Object.create(null),
                options: options,
                preventSideEffects: 0
            };
            meta.proxyKeys[symbols.metaSymbol] = meta;
            meta.proxy = new Proxy(array, {
                get: makeObject.get.bind(meta),
                set: makeArray.set.bind(meta),
                ownKeys: makeObject.ownKeys.bind(meta),
                deleteProperty: makeObject.deleteProperty.bind(meta),
                meta: meta
            });
            mapBindings.addHandlers(meta.proxy, meta);
            return meta.proxy;
        },
        proxyKeys: function () {
            return proxyKeys;
        },
        set: function (target, key, value, receiver) {
            if (receiver !== this.proxy) {
                return makeObject.setKey(receiver, key, value, this);
            }
            var computedValue = computedHelpers.set(receiver, key, value);
            if (computedValue === true) {
                return true;
            }
            value = makeObject.getValueToSet(key, value, this);
            var startingLength = target.length;
            makeObject.setValueAndOnChange(key, value, this, function (key, value, meta, hadOwn, old) {
                var patches = [{
                        key: key,
                        type: hadOwn ? 'set' : 'add',
                        value: value
                    }];
                var numberKey = !isSymbolLike(key) && +key;
                if (isInteger(numberKey)) {
                    if (!hadOwn && numberKey > startingLength) {
                        patches.push({
                            index: startingLength,
                            deleteCount: 0,
                            insert: target.slice(startingLength),
                            type: 'splice'
                        });
                    } else {
                        patches.push.apply(patches, mutateMethods.splice(target, [
                            numberKey,
                            1,
                            value
                        ]));
                    }
                }
                if (didLengthChangeCauseDeletions(key, value, old, meta)) {
                    patches.push({
                        index: value,
                        deleteCount: old - value,
                        insert: [],
                        type: 'splice'
                    });
                }
                var dispatchArgs = {
                    type: key,
                    patches: patches,
                    keyChanged: !hadOwn ? key : undefined
                };
                mapBindings.dispatch.call(meta.proxy, dispatchArgs, [
                    value,
                    old
                ]);
            });
            return true;
        }
    };
    module.exports = makeArray;
});
/*can-observe@2.3.0#src/-make-observe*/
define('can-observe/src/-make-observe', [
    'require',
    'exports',
    'module',
    'can-globals/global/global',
    'can-reflect',
    'can-observe/src/-observable-store',
    'can-observe/src/-helpers'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var getGlobal = require('can-globals/global/global');
        var canReflect = require('can-reflect');
        var observables = require('can-observe/src/-observable-store');
        var helpers = require('can-observe/src/-helpers');
        var makeObserve = {
            observe: function (value) {
                if (canReflect.isPrimitive(value)) {
                    return value;
                }
                var observable = observables.proxiedObjects.get(value);
                if (observable) {
                    return observable;
                }
                if (observables.proxies.has(value)) {
                    return value;
                }
                if (helpers.isBuiltInButNotArrayOrPlainObjectOrElement(value)) {
                    return value;
                }
                if (typeof value === 'function') {
                    observable = makeObserve.function(value);
                } else if (helpers.inheritsFromArray(value)) {
                    observable = makeObserve.array(value);
                } else if (value instanceof getGlobal().Element) {
                    observable = makeObserve.prototype(value);
                } else {
                    observable = makeObserve.object(value);
                }
                observables.proxiedObjects.set(value, observable);
                observables.proxies.add(observable);
                return observable;
            },
            'object': null,
            'array': null,
            'function': null
        };
        module.exports = makeObserve;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-event-queue@1.1.6#type/type*/
define('can-event-queue/type/type', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-symbol',
    'can-key-tree',
    'can-queues'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var KeyTree = require('can-key-tree');
    var queues = require('can-queues');
    var metaSymbol = canSymbol.for('can.meta');
    function addHandlers(obj, meta) {
        if (!meta.lifecycleHandlers) {
            meta.lifecycleHandlers = new KeyTree([
                Object,
                Array
            ]);
        }
        if (!meta.instancePatchesHandlers) {
            meta.instancePatchesHandlers = new KeyTree([
                Object,
                Array
            ]);
        }
    }
    function ensureMeta(obj) {
        var meta = obj[metaSymbol];
        if (!meta) {
            meta = {};
            canReflect.setKeyValue(obj, metaSymbol, meta);
        }
        addHandlers(obj, meta);
        return meta;
    }
    var props = {};
    function onOffAndDispatch(symbolName, dispatchName, handlersName) {
        props['can.on' + symbolName] = function (handler, queueName) {
            ensureMeta(this)[handlersName].add([
                queueName || 'mutate',
                handler
            ]);
        };
        props['can.off' + symbolName] = function (handler, queueName) {
            ensureMeta(this)[handlersName].delete([
                queueName || 'mutate',
                handler
            ]);
        };
        props['can.' + dispatchName] = function (instance, arg) {
            queues.enqueueByQueue(ensureMeta(this)[handlersName].getNode([]), this, [
                instance,
                arg
            ]);
        };
    }
    onOffAndDispatch('InstancePatches', 'dispatchInstanceOnPatches', 'instancePatchesHandlers');
    onOffAndDispatch('InstanceBoundChange', 'dispatchInstanceBoundChange', 'lifecycleHandlers');
    function mixinTypeBindings(obj) {
        return canReflect.assignSymbols(obj, props);
    }
    Object.defineProperty(mixinTypeBindings, 'addHandlers', {
        enumerable: false,
        value: addHandlers
    });
    module.exports = mixinTypeBindings;
});
/*can-observe@2.3.0#src/-make-function*/
define('can-observe/src/-make-function', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-observe/src/-make-object',
    'can-observe/src/-make-observe',
    'can-observe/src/-symbols',
    'can-observe/src/-observable-store',
    'can-event-queue/map/map',
    'can-event-queue/type/type',
    'can-observe/src/-helpers'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var makeObject = require('can-observe/src/-make-object');
    var makeObserve = require('can-observe/src/-make-observe');
    var symbols = require('can-observe/src/-symbols');
    var observableStore = require('can-observe/src/-observable-store');
    var mapBindings = require('can-event-queue/map/map');
    var typeBindings = require('can-event-queue/type/type');
    var helpers = require('can-observe/src/-helpers');
    var proxyKeys = helpers.assignEverything(Object.create(null), makeObject.proxyKeys());
    typeBindings(proxyKeys);
    canReflect.assignSymbols(proxyKeys, {
        'can.defineInstanceKey': function (prop, value) {
            this[symbols.metaSymbol].definitions[prop] = value;
        }
    });
    var makeFunction = {
        observable: function (object, options) {
            if (options.shouldRecordObservation === undefined) {
                options.shouldRecordObservation = makeObject.shouldRecordObservationOnOwnAndMissingKeys;
            }
            var proxyKeys = Object.create(makeFunction.proxyKeys());
            var meta = {
                target: object,
                proxyKeys: proxyKeys,
                computedKeys: Object.create(null),
                options: options,
                definitions: {},
                isClass: helpers.isClass(object),
                preventSideEffects: 0
            };
            proxyKeys[symbols.metaSymbol] = meta;
            meta.proxy = new Proxy(object, {
                get: makeObject.get.bind(meta),
                set: makeObject.set.bind(meta),
                ownKeys: makeObject.ownKeys.bind(meta),
                deleteProperty: makeObject.deleteProperty.bind(meta),
                construct: makeFunction.construct.bind(meta),
                apply: makeFunction.apply.bind(meta),
                meta: meta
            });
            mapBindings.addHandlers(meta.proxy, meta);
            typeBindings.addHandlers(meta.proxy, meta);
            observableStore.proxiedObjects.set(object, meta.proxy);
            observableStore.proxies.add(meta.proxy);
            if (meta.target.prototype && meta.target.prototype.constructor === meta.target) {
                var newPrototype = makeObject.observable(meta.target.prototype, {
                    getPrototypeOf: function () {
                        return meta.target.prototype;
                    },
                    observe: makeObserve.observe
                });
                observableStore.proxiedObjects.set(meta.target.prototype, newPrototype);
                observableStore.proxies.add(newPrototype);
                var prototype = meta.proxy.prototype;
                prototype.constructor = meta.proxy;
            }
            return meta.proxy;
        },
        construct: function (target, argumentsList, newTarget) {
            var instanceTarget, key;
            if (this.isClass) {
                instanceTarget = Reflect.construct(target, argumentsList, newTarget);
                for (key in this.definitions) {
                    Object.defineProperty(instanceTarget, key, this.definitions[key]);
                }
                return this.options.observe(instanceTarget);
            } else {
                instanceTarget = Object.create(this.proxy.prototype);
                for (key in this.definitions) {
                    Object.defineProperty(instanceTarget, key, this.definitions[key]);
                }
                var instance = this.options.observe(instanceTarget);
                instance[symbols.metaSymbol].preventSideEffects++;
                var res = target.apply(instance, argumentsList);
                instance[symbols.metaSymbol].preventSideEffects--;
                if (res) {
                    return res;
                } else {
                    return instance;
                }
            }
        },
        apply: function (target, thisArg, argumentsList) {
            var ret = this.target.apply(thisArg, argumentsList);
            return this.options.observe(ret);
        },
        proxyKeys: function () {
            return proxyKeys;
        }
    };
    module.exports = makeFunction;
});
/*can-observe@2.3.0#src/-make-prototype*/
define('can-observe/src/-make-prototype', [
    'require',
    'exports',
    'module',
    'can-observe/src/-make-object',
    'can-observe/src/-helpers',
    'can-observe/src/-symbols',
    'can-event-queue/map/map',
    'can-reflect',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var makeObject = require('can-observe/src/-make-object');
    var helpers = require('can-observe/src/-helpers');
    var symbols = require('can-observe/src/-symbols');
    var mapBindings = require('can-event-queue/map/map');
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var isSymbolLike = canReflect.isSymbolLike;
    var proxyMetaSymbol = canSymbol.for('can.proxyMeta');
    function getMetadata(instance, options) {
        if (instance.hasOwnProperty(proxyMetaSymbol)) {
            return instance[proxyMetaSymbol];
        }
        if (options.shouldRecordObservation === undefined) {
            options.shouldRecordObservation = makeObject.shouldRecordObservationOnOwnAndMissingKeys;
        }
        options.proxiedPrototype = true;
        var meta = {
            target: makeObject.observable({}, options),
            proxyKeys: options.proxyKeys !== undefined ? options.proxyKeys : Object.create(makeObject.proxyKeys()),
            computedKeys: Object.create(null),
            options: options,
            preventSideEffects: 0,
            proxy: instance
        };
        helpers.assignNonEnumerable(meta.proxyKeys, symbols.metaSymbol, meta);
        mapBindings.addHandlers(meta.proxy, meta);
        instance[proxyMetaSymbol] = meta;
        return meta;
    }
    var makePrototype = {
        observable: function (proto, options) {
            var protoProxy = new Proxy(proto, {
                set: function (target, key, value, receiver) {
                    if (isSymbolLike(key) || key in target) {
                        return Reflect.set(target, key, value, receiver);
                    }
                    var meta = getMetadata(receiver, options);
                    return makeObject.set.call(meta, target, key, value, receiver);
                },
                get: function (target, key, receiver) {
                    if (key in target) {
                        return Reflect.get(target, key, receiver);
                    }
                    var meta = getMetadata(receiver, options);
                    return makeObject.get.call(meta, target, key, receiver);
                }
            });
            return protoProxy;
        }
    };
    module.exports = makePrototype;
});
/*can-observe@2.3.0#src/-type-helpers*/
define('can-observe/src/-type-helpers', [
    'require',
    'exports',
    'module',
    'can-queues',
    'can-reflect',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var queues = require('can-queues');
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var canMeta = canSymbol.for('can.meta');
    var typeDefinitionsSymbol = canSymbol.for('can.typeDefinitions');
    var helpers = module.exports = {
        ensureDefinition: function (prototype) {
            var typeDefs = prototype[typeDefinitionsSymbol];
            if (!typeDefs) {
                var parent = prototype[typeDefinitionsSymbol];
                typeDefs = prototype[typeDefinitionsSymbol] = Object.create(parent || null);
            }
            return typeDefs;
        },
        addMethodsAndSymbols: function (Type) {
            canReflect.assignSymbols(Type, {
                'can.defineInstanceKey': function (prop, value) {
                    helpers.ensureDefinition(this.prototype)[prop] = value;
                },
                'can.dispatchInstanceBoundChange': function (obj, isBound) {
                    var meta = this[canMeta];
                    if (meta) {
                        var lifecycleHandlers = meta.lifecycleHandlers;
                        if (lifecycleHandlers) {
                            queues.enqueueByQueue(lifecycleHandlers.getNode([]), this, [
                                obj,
                                isBound
                            ]);
                        }
                    }
                }
            });
        },
        shouldRecordObservationOnAllKeysExceptFunctionsOnProto: function (keyInfo, meta) {
            return meta.preventSideEffects === 0 && !keyInfo.isAccessor && (keyInfo.targetHasOwnKey || !keyInfo.protoHasKey && !Object.isSealed(meta.target) || keyInfo.protoHasKey && typeof targetValue !== 'function');
        }
    };
});
/*can-observe@2.3.0#object/object*/
define('can-observe/object/object', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-symbol',
    'can-observe/src/-make-observe',
    'can-event-queue/map/map',
    'can-event-queue/type/type',
    'can-observe/src/-helpers',
    'can-observe/src/-make-object',
    'can-observe/src/-observable-store',
    'can-observe/src/-computed-helpers',
    'can-observe/src/-type-helpers'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var makeObserve = require('can-observe/src/-make-observe');
    var eventMixin = require('can-event-queue/map/map');
    var typeEventMixin = require('can-event-queue/type/type');
    var helpers = require('can-observe/src/-helpers');
    var makeObject = require('can-observe/src/-make-object');
    var observableStore = require('can-observe/src/-observable-store');
    var definitionsSymbol = canSymbol.for('can.typeDefinitions');
    var computedHelpers = require('can-observe/src/-computed-helpers');
    var typeHelpers = require('can-observe/src/-type-helpers');
    var proxyKeys = helpers.assignEverything({}, makeObject.proxyKeys());
    computedHelpers.addKeyDependencies(proxyKeys);
    var ObserveObject = function (props) {
        var prototype = Object.getPrototypeOf(this);
        computedHelpers.ensureDefinition(prototype);
        typeHelpers.ensureDefinition(prototype);
        var sourceInstance = this;
        var definitions = prototype[definitionsSymbol] || {};
        for (var key in definitions) {
            Object.defineProperty(sourceInstance, key, definitions[key]);
        }
        if (props !== undefined) {
            canReflect.assign(sourceInstance, props);
        }
        var localProxyKeys = Object.create(proxyKeys);
        localProxyKeys.constructor = this.constructor;
        var observable = makeObject.observable(sourceInstance, {
            observe: makeObserve.observe,
            proxyKeys: localProxyKeys,
            shouldRecordObservation: typeHelpers.shouldRecordObservationOnAllKeysExceptFunctionsOnProto
        });
        observableStore.proxiedObjects.set(sourceInstance, observable);
        observableStore.proxies.add(observable);
        return observable;
    };
    eventMixin(ObserveObject.prototype);
    typeEventMixin(ObserveObject);
    computedHelpers.addMethodsAndSymbols(ObserveObject);
    typeHelpers.addMethodsAndSymbols(ObserveObject);
    ObserveObject.extend = helpers.makeSimpleExtender(ObserveObject);
    module.exports = ObserveObject;
});
/*can-observe@2.3.0#array/array*/
define('can-observe/array/array', [
    'require',
    'exports',
    'module',
    'can-symbol',
    'can-observe/src/-make-array',
    'can-observe/src/-make-observe',
    'can-event-queue/map/map',
    'can-event-queue/type/type',
    'can-observe/src/-helpers',
    'can-observe/src/-observable-store',
    'can-observe/src/-computed-helpers',
    'can-observe/src/-type-helpers'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var makeArray = require('can-observe/src/-make-array');
    var makeObserve = require('can-observe/src/-make-observe');
    var eventMixin = require('can-event-queue/map/map');
    var typeEventMixin = require('can-event-queue/type/type');
    var helpers = require('can-observe/src/-helpers');
    var observableStore = require('can-observe/src/-observable-store');
    var computedHelpers = require('can-observe/src/-computed-helpers');
    var typeHelpers = require('can-observe/src/-type-helpers');
    var definitionsSymbol = canSymbol.for('can.typeDefinitions');
    var proxyKeys = helpers.assignEverything({}, makeArray.proxyKeys());
    var ObserveArray;
    if (false) {
    } else {
        var ObserveArray = function (items) {
            var prototype = Object.getPrototypeOf(this);
            computedHelpers.ensureDefinition(prototype);
            typeHelpers.ensureDefinition(prototype);
            var instance = this;
            var definitions = prototype[definitionsSymbol] || {};
            for (var key in definitions) {
                Object.defineProperty(instance, key, definitions[key]);
            }
            this.push.apply(this, items || []);
            var localProxyKeys = Object.create(proxyKeys);
            localProxyKeys.constructor = this.constructor;
            var observable = makeArray.observable(instance, {
                observe: makeObserve.observe,
                proxyKeys: localProxyKeys,
                shouldRecordObservation: typeHelpers.shouldRecordObservationOnAllKeysExceptFunctionsOnProto
            });
            observableStore.proxiedObjects.set(instance, observable);
            observableStore.proxies.add(observable);
            return observable;
        };
        ObserveArray.prototype = Object.create(Array.prototype);
    }
    eventMixin(ObserveArray.prototype);
    typeEventMixin(ObserveArray);
    computedHelpers.addMethodsAndSymbols(ObserveArray);
    typeHelpers.addMethodsAndSymbols(ObserveArray);
    ObserveArray.extend = helpers.makeSimpleExtender(ObserveArray);
    module.exports = ObserveArray;
});
/*can-simple-observable@2.4.2#log*/
define('can-simple-observable/log', [
    'require',
    'exports',
    'module',
    'can-log/dev/dev',
    'can-reflect'
], function (require, exports, module) {
    'use strict';
    var dev = require('can-log/dev/dev');
    var canReflect = require('can-reflect');
    function quoteString(x) {
        return typeof x === 'string' ? JSON.stringify(x) : x;
    }
    module.exports = function log() {
    };
});
/*can-simple-observable@2.4.2#can-simple-observable*/
define('can-simple-observable', [
    'require',
    'exports',
    'module',
    'can-simple-observable/log',
    'can-namespace',
    'can-symbol',
    'can-reflect',
    'can-observation-recorder',
    'can-event-queue/value/value'
], function (require, exports, module) {
    'use strict';
    var log = require('can-simple-observable/log');
    var ns = require('can-namespace');
    var canSymbol = require('can-symbol');
    var canReflect = require('can-reflect');
    var ObservationRecorder = require('can-observation-recorder');
    var valueEventBindings = require('can-event-queue/value/value');
    var dispatchSymbol = canSymbol.for('can.dispatch');
    function SimpleObservable(initialValue) {
        this._value = initialValue;
    }
    valueEventBindings(SimpleObservable.prototype);
    canReflect.assignMap(SimpleObservable.prototype, {
        log: log,
        get: function () {
            ObservationRecorder.add(this);
            return this._value;
        },
        set: function (value) {
            var old = this._value;
            this._value = value;
            this[dispatchSymbol](value, old);
        }
    });
    Object.defineProperty(SimpleObservable.prototype, 'value', {
        set: function (value) {
            return this.set(value);
        },
        get: function () {
            return this.get();
        }
    });
    var simpleObservableProto = {
        'can.getValue': SimpleObservable.prototype.get,
        'can.setValue': SimpleObservable.prototype.set,
        'can.isMapLike': false,
        'can.valueHasDependencies': function () {
            return true;
        }
    };
    canReflect.assignSymbols(SimpleObservable.prototype, simpleObservableProto);
    module.exports = ns.SimpleObservable = SimpleObservable;
});
/*can-simple-observable@2.4.2#settable/settable*/
define('can-simple-observable/settable/settable', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-observation-recorder',
    'can-simple-observable',
    'can-observation',
    'can-queues',
    'can-simple-observable/log',
    'can-event-queue/value/value'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var ObservationRecorder = require('can-observation-recorder');
    var SimpleObservable = require('can-simple-observable');
    var Observation = require('can-observation');
    var queues = require('can-queues');
    var log = require('can-simple-observable/log');
    var valueEventBindings = require('can-event-queue/value/value');
    var peek = ObservationRecorder.ignore(canReflect.getValue.bind(canReflect));
    function SettableObservable(fn, context, initialValue) {
        this.lastSetValue = new SimpleObservable(initialValue);
        function observe() {
            return fn.call(context, this.lastSetValue.get());
        }
        this.handler = this.handler.bind(this);
        this.observation = new Observation(observe, this);
    }
    valueEventBindings(SettableObservable.prototype);
    canReflect.assignMap(SettableObservable.prototype, {
        log: log,
        constructor: SettableObservable,
        handler: function (newVal) {
            var old = this._value, reasonLog;
            this._value = newVal;
            queues.enqueueByQueue(this.handlers.getNode([]), this, [
                newVal,
                old
            ], null, reasonLog);
        },
        onBound: function () {
            if (!this.bound) {
                this.bound = true;
                this.activate();
            }
        },
        activate: function () {
            canReflect.onValue(this.observation, this.handler, 'notify');
            this._value = peek(this.observation);
        },
        onUnbound: function () {
            this.bound = false;
            canReflect.offValue(this.observation, this.handler, 'notify');
        },
        set: function (newVal) {
            var oldVal = this.lastSetValue.get();
            if (canReflect.isObservableLike(oldVal) && canReflect.isValueLike(oldVal) && !canReflect.isObservableLike(newVal)) {
                canReflect.setValue(oldVal, newVal);
            } else {
                if (newVal !== oldVal) {
                    this.lastSetValue.set(newVal);
                }
            }
        },
        get: function () {
            if (ObservationRecorder.isRecording()) {
                ObservationRecorder.add(this);
                if (!this.bound) {
                    this.onBound();
                }
            }
            if (this.bound === true) {
                return this._value;
            } else {
                return this.observation.get();
            }
        },
        hasDependencies: function () {
            return canReflect.valueHasDependencies(this.observation);
        },
        getValueDependencies: function () {
            return canReflect.getValueDependencies(this.observation);
        }
    });
    Object.defineProperty(SettableObservable.prototype, 'value', {
        set: function (value) {
            return this.set(value);
        },
        get: function () {
            return this.get();
        }
    });
    canReflect.assignSymbols(SettableObservable.prototype, {
        'can.getValue': SettableObservable.prototype.get,
        'can.setValue': SettableObservable.prototype.set,
        'can.isMapLike': false,
        'can.getPriority': function () {
            return canReflect.getPriority(this.observation);
        },
        'can.setPriority': function (newPriority) {
            canReflect.setPriority(this.observation, newPriority);
        },
        'can.valueHasDependencies': SettableObservable.prototype.hasDependencies,
        'can.getValueDependencies': SettableObservable.prototype.getValueDependencies
    });
    module.exports = SettableObservable;
});
/*can-simple-observable@2.4.2#async/async*/
define('can-simple-observable/async/async', [
    'require',
    'exports',
    'module',
    'can-simple-observable',
    'can-observation',
    'can-queues',
    'can-simple-observable/settable/settable',
    'can-reflect',
    'can-observation-recorder',
    'can-event-queue/value/value'
], function (require, exports, module) {
    'use strict';
    var SimpleObservable = require('can-simple-observable');
    var Observation = require('can-observation');
    var queues = require('can-queues');
    var SettableObservable = require('can-simple-observable/settable/settable');
    var canReflect = require('can-reflect');
    var ObservationRecorder = require('can-observation-recorder');
    var valueEventBindings = require('can-event-queue/value/value');
    function AsyncObservable(fn, context, initialValue) {
        this.resolve = this.resolve.bind(this);
        this.lastSetValue = new SimpleObservable(initialValue);
        this.handler = this.handler.bind(this);
        function observe() {
            this.resolveCalled = false;
            this.inGetter = true;
            var newVal = fn.call(context, this.lastSetValue.get(), this.bound === true ? this.resolve : undefined);
            this.inGetter = false;
            if (newVal !== undefined) {
                this.resolve(newVal);
            } else if (this.resolveCalled) {
                this.resolve(this._value);
            }
            if (this.bound !== true) {
                return newVal;
            }
        }
        this.observation = new Observation(observe, this);
    }
    AsyncObservable.prototype = Object.create(SettableObservable.prototype);
    AsyncObservable.prototype.constructor = AsyncObservable;
    AsyncObservable.prototype.handler = function (newVal) {
        if (newVal !== undefined) {
            SettableObservable.prototype.handler.apply(this, arguments);
        }
    };
    var peek = ObservationRecorder.ignore(canReflect.getValue.bind(canReflect));
    AsyncObservable.prototype.activate = function () {
        canReflect.onValue(this.observation, this.handler, 'notify');
        if (!this.resolveCalled) {
            this._value = peek(this.observation);
        }
    };
    AsyncObservable.prototype.resolve = function resolve(newVal) {
        this.resolveCalled = true;
        var old = this._value;
        this._value = newVal;
        if (!this.inGetter) {
            var queuesArgs = [
                this.handlers.getNode([]),
                this,
                [
                    newVal,
                    old
                ],
                null
            ];
            queues.enqueueByQueue.apply(queues, queuesArgs);
        }
    };
    module.exports = AsyncObservable;
});
/*can-simple-observable@2.4.2#resolver/resolver*/
define('can-simple-observable/resolver/resolver', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-symbol',
    'can-observation-recorder',
    'can-observation',
    'can-queues',
    'can-event-queue/map/map',
    'can-simple-observable/settable/settable',
    'can-simple-observable'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var ObservationRecorder = require('can-observation-recorder');
    var Observation = require('can-observation');
    var queues = require('can-queues');
    var mapEventBindings = require('can-event-queue/map/map');
    var SettableObservable = require('can-simple-observable/settable/settable');
    var SimpleObservable = require('can-simple-observable');
    var getChangesSymbol = canSymbol.for('can.getChangesDependencyRecord');
    function ResolverObservable(resolver, context, initialValue) {
        this.resolver = ObservationRecorder.ignore(resolver);
        this.context = context;
        this._valueOptions = {
            resolve: this.resolve.bind(this),
            listenTo: this.listenTo.bind(this),
            stopListening: this.stopListening.bind(this),
            lastSet: new SimpleObservable(initialValue)
        };
        this.update = this.update.bind(this);
        this.contextHandlers = new WeakMap();
        this.teardown = null;
        this.binder = {};
    }
    ResolverObservable.prototype = Object.create(SettableObservable.prototype);
    function deleteHandler(bindTarget, event, queue, handler) {
        mapEventBindings.off.call(bindTarget, event, handler, queue);
    }
    canReflect.assignMap(ResolverObservable.prototype, {
        constructor: ResolverObservable,
        listenTo: function (bindTarget, event, handler, queueName) {
            if (canReflect.isPrimitive(bindTarget)) {
                handler = event;
                event = bindTarget;
                bindTarget = this.context;
            }
            if (typeof event === 'function') {
                handler = event;
                event = undefined;
            }
            var resolverInstance = this;
            var contextHandler = handler.bind(this.context);
            contextHandler[getChangesSymbol] = function getChangesDependencyRecord() {
                var s = new Set();
                s.add(resolverInstance);
                return { valueDependencies: s };
            };
            this.contextHandlers.set(handler, contextHandler);
            mapEventBindings.listenTo.call(this.binder, bindTarget, event, contextHandler, queueName || 'notify');
        },
        stopListening: function () {
            var meta = this.binder[canSymbol.for('can.meta')];
            var listenHandlers = meta && meta.listenHandlers;
            if (listenHandlers) {
                var keys = mapEventBindings.stopListeningArgumentsToKeys.call({
                    context: this.context,
                    defaultQueue: 'notify'
                });
                listenHandlers.delete(keys, deleteHandler);
            }
            return this;
        },
        resolve: function (newVal) {
            this._value = newVal;
            if (this.isBinding) {
                this.lastValue = this._value;
                return newVal;
            }
            if (this._value !== this.lastValue) {
                var enqueueMeta = {};
                queues.batch.start();
                queues.deriveQueue.enqueue(this.update, this, [], enqueueMeta);
                queues.batch.stop();
            }
            return newVal;
        },
        update: function () {
            if (this.lastValue !== this._value) {
                var old = this.lastValue;
                this.lastValue = this._value;
                queues.enqueueByQueue(this.handlers.getNode([]), this, [
                    this._value,
                    old
                ]);
            }
        },
        activate: function () {
            this.isBinding = true;
            this.teardown = this.resolver.call(this.context, this._valueOptions);
            this.isBinding = false;
        },
        onUnbound: function () {
            this.bound = false;
            mapEventBindings.stopListening.call(this.binder);
            if (this.teardown != null) {
                this.teardown();
                this.teardown = null;
            }
        },
        set: function (value) {
            this._valueOptions.lastSet.set(value);
        },
        get: function () {
            if (ObservationRecorder.isRecording()) {
                ObservationRecorder.add(this);
                if (!this.bound) {
                    this.onBound();
                }
            }
            if (this.bound === true) {
                return this._value;
            } else {
                var handler = function () {
                };
                this.on(handler);
                var val = this._value;
                this.off(handler);
                return val;
            }
        },
        hasDependencies: function hasDependencies() {
            var hasDependencies = false;
            if (this.bound) {
                var meta = this.binder[canSymbol.for('can.meta')];
                var listenHandlers = meta && meta.listenHandlers;
                hasDependencies = !!listenHandlers.size();
            }
            return hasDependencies;
        },
        getValueDependencies: function getValueDependencies() {
            if (this.bound) {
                var meta = this.binder[canSymbol.for('can.meta')];
                var listenHandlers = meta && meta.listenHandlers;
                var keyDeps = new Map();
                var valueDeps = new Set();
                if (listenHandlers) {
                    canReflect.each(listenHandlers.root, function (events, obj) {
                        canReflect.each(events, function (queues, eventName) {
                            if (eventName === undefined) {
                                valueDeps.add(obj);
                            } else {
                                var entry = keyDeps.get(obj);
                                if (!entry) {
                                    entry = new Set();
                                    keyDeps.set(obj, entry);
                                }
                                entry.add(eventName);
                            }
                        });
                    });
                    if (valueDeps.size || keyDeps.size) {
                        var result = {};
                        if (keyDeps.size) {
                            result.keyDependencies = keyDeps;
                        }
                        if (valueDeps.size) {
                            result.valueDependencies = valueDeps;
                        }
                        return result;
                    }
                }
            }
        }
    });
    canReflect.assignSymbols(ResolverObservable.prototype, {
        'can.getValue': ResolverObservable.prototype.get,
        'can.setValue': ResolverObservable.prototype.set,
        'can.isMapLike': false,
        'can.getPriority': function () {
            return this.priority || 0;
        },
        'can.setPriority': function (newPriority) {
            this.priority = newPriority;
        },
        'can.valueHasDependencies': ResolverObservable.prototype.hasDependencies,
        'can.getValueDependencies': ResolverObservable.prototype.getValueDependencies
    });
    module.exports = ResolverObservable;
});
/*can-observe@2.3.0#decorators/decorators*/
define('can-observe/decorators/decorators', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-simple-observable/async/async',
    'can-simple-observable/resolver/resolver',
    'can-observe/src/-computed-helpers'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var AsyncObservable = require('can-simple-observable/async/async');
    var ResolverObservable = require('can-simple-observable/resolver/resolver');
    var computedHelpers = require('can-observe/src/-computed-helpers');
    function defineProperty(prototype, prop, makeObservable) {
        computedHelpers.ensureDefinition(prototype)[prop] = makeObservable;
    }
    function asyncBase(config) {
        return function (target, key, descriptor) {
            if (descriptor.get !== undefined) {
                var getter = descriptor.get;
                return defineProperty(target, key, function (instance, property) {
                    function fn(lastSet, resolve) {
                        if (!resolve) {
                            return config.default;
                        }
                        var promise = getter.call(this, true);
                        if (canReflect.isPromise(promise)) {
                            promise.then(resolve);
                            return config.default;
                        }
                    }
                    return new AsyncObservable(fn, instance, config.default);
                });
            }
            if (descriptor.value !== undefined) {
                var method = descriptor.value;
                return defineProperty(target, key, function (instance, property) {
                    return new AsyncObservable(function (lastSet, resolve) {
                        return method.call(this, resolve);
                    }, instance, config.default);
                });
            }
        };
    }
    function resolverBase(config) {
        return function (target, key, descriptor) {
            if (descriptor.value !== undefined) {
                var method = descriptor.value;
                return defineProperty(target, key, function (instance, property) {
                    return new ResolverObservable(method, instance);
                });
            }
        };
    }
    function optionalConfig(decorator) {
        function wrapper(config) {
            if (arguments.length === 3) {
                return decorator({}).apply(null, arguments);
            }
            return decorator(config);
        }
        return wrapper;
    }
    module.exports = {
        async: optionalConfig(asyncBase),
        resolver: optionalConfig(resolverBase)
    };
});
/*can-observe@2.3.0#can-observe*/
define('can-observe', [
    'require',
    'exports',
    'module',
    'can-observe/src/-make-object',
    'can-observe/src/-make-array',
    'can-observe/src/-make-function',
    'can-observe/src/-make-observe',
    'can-observe/src/-make-prototype',
    'can-observe/object/object',
    'can-observe/array/array',
    'can-observe/src/-computed-helpers',
    'can-observe/decorators/decorators'
], function (require, exports, module) {
    'use strict';
    var makeObject = require('can-observe/src/-make-object');
    var makeArray = require('can-observe/src/-make-array');
    var makeFunction = require('can-observe/src/-make-function');
    var makeObserve = require('can-observe/src/-make-observe');
    var makePrototype = require('can-observe/src/-make-prototype');
    var ObserveObject = require('can-observe/object/object');
    var ObserveArray = require('can-observe/array/array');
    var computedHelpers = require('can-observe/src/-computed-helpers');
    var decorators = require('can-observe/decorators/decorators');
    makeObserve.object = function (object) {
        return makeObject.observable(object, makeObserve);
    };
    makeObserve.prototype = function (proto) {
        return makePrototype.observable(proto, makeObserve);
    };
    makeObserve.array = function (array) {
        return makeArray.observable(array, makeObserve);
    };
    makeObserve.function = function (fn) {
        return makeFunction.observable(fn, makeObserve);
    };
    makeObserve.observe.Object = ObserveObject;
    makeObserve.observe.Array = ObserveArray;
    module.exports = makeObserve.observe;
    module.exports.defineProperty = function (prototype, prop, makeObservable) {
        computedHelpers.ensureDefinition(prototype)[prop] = makeObservable;
    };
    for (var key in decorators) {
        module.exports[key] = decorators[key];
    }
});
/*[global-shim-end]*/
(function(global) { // jshint ignore:line
	global._define = global.define;
	global.define = global.define.orig;
}
)(typeof self == "object" && self.Object == Object ? self : (typeof process === "object" && Object.prototype.toString.call(process) === "[object process]") ? global : window);