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
	typeof self == "object" && self.Object == Object ? self : window,
	function(__$source__, __$global__) {
		// jshint ignore:line
		eval("(function() { " + __$source__ + " \n }).call(__$global__);");
	}
);

/*can-namespace@1.0.0#can-namespace*/
define('can-namespace', function (require, exports, module) {
    module.exports = {};
});
/*can-symbol@1.4.2#can-symbol*/
define('can-symbol', [
    'require',
    'exports',
    'module',
    'can-namespace'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        var namespace = require('can-namespace');
        var CanSymbol;
        if (typeof Symbol !== 'undefined' && typeof Symbol.for === 'function') {
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
                CanSymbol[name] = CanSymbol.for(name);
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
            'onKeysRemoved'
        ].forEach(function (name) {
            CanSymbol.for('can.' + name);
        });
        module.exports = namespace.Symbol = CanSymbol;
    }(function () {
        return this;
    }(), require, exports, module));
});
/*can-reflect@1.8.0#reflections/helpers*/
define('can-reflect/reflections/helpers', [
    'require',
    'exports',
    'module',
    'can-symbol'
], function (require, exports, module) {
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
            var length = list && type !== 'boolean' && typeof list !== 'number' && 'length' in list && list.length;
            return typeof list !== 'function' && (length === 0 || typeof length === 'number' && length > 0 && length - 1 in list);
        }
    };
});
/*can-reflect@1.8.0#reflections/type/type*/
define('can-reflect/reflections/type/type', [
    'require',
    'exports',
    'module',
    'can-symbol',
    'can-reflect/reflections/helpers'
], function (require, exports, module) {
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
        var result, symbolValue = obj[canSymbol.for('can.isFunctionLike')];
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
    var getObservableLikeSymbol = helpers.makeGetFirstSymbolValue([
        'can.onValue',
        'can.onKeyValue',
        'can.onKeys',
        'can.onKeysAdded'
    ]);
    function isObservableLike(obj) {
        if (isPrimitive(obj)) {
            return false;
        }
        var result = getObservableLikeSymbol(obj);
        if (result !== undefined) {
            return !!result;
        }
        return false;
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
    var supportsSymbols = typeof Symbol !== 'undefined' && typeof Symbol.for === 'function';
    var isSymbolLike;
    if (supportsSymbols) {
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
/*can-reflect@1.8.0#reflections/call/call*/
define('can-reflect/reflections/call/call', [
    'require',
    'exports',
    'module',
    'can-symbol',
    'can-reflect/reflections/type/type'
], function (require, exports, module) {
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
/*can-reflect@1.8.0#reflections/get-set/get-set*/
define('can-reflect/reflections/get-set/get-set', [
    'require',
    'exports',
    'module',
    'can-symbol',
    'can-reflect/reflections/type/type'
], function (require, exports, module) {
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
/*can-reflect@1.8.0#reflections/observe/observe*/
define('can-reflect/reflections/observe/observe', [
    'require',
    'exports',
    'module',
    'can-symbol'
], function (require, exports, module) {
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
        keyHasDependencies: makeErrorIfMissing('can.keyHasDependencies', 'can-reflect: can not determine if this has key dependencies'),
        onValue: makeErrorIfMissing('can.onValue', 'can-reflect: can not observe value change'),
        offValue: makeErrorIfMissing('can.offValue', 'can-reflect: can not unobserve value change'),
        getValueDependencies: makeErrorIfMissing('can.getValueDependencies', 'can-reflect: can not determine dependencies'),
        valueHasDependencies: makeErrorIfMissing('can.valueHasDependencies', 'can-reflect: can not determine if value has dependencies'),
        onPatches: makeErrorIfMissing('can.onPatches', 'can-reflect: can not observe patches on object'),
        offPatches: makeErrorIfMissing('can.offPatches', 'can-reflect: can not unobserve patches on object'),
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
/*can-reflect@1.8.0#reflections/shape/shape*/
define('can-reflect/reflections/shape/shape', [
    'require',
    'exports',
    'module',
    'can-symbol',
    'can-reflect/reflections/get-set/get-set',
    'can-reflect/reflections/type/type',
    'can-reflect/reflections/helpers'
], function (require, exports, module) {
    var canSymbol = require('can-symbol');
    var getSetReflections = require('can-reflect/reflections/get-set/get-set');
    var typeReflections = require('can-reflect/reflections/type/type');
    var helpers = require('can-reflect/reflections/helpers');
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
    var serializeMap = null;
    var hasUpdateSymbol = helpers.makeGetFirstSymbolValue([
        'can.updateDeep',
        'can.assignDeep',
        'can.setKeyValue'
    ]);
    var shouldUpdateOrAssign = function (obj) {
        return typeReflections.isPlainObject(obj) || Array.isArray(obj) || !!hasUpdateSymbol(obj);
    };
    function isSerializable(obj) {
        if (typeReflections.isPrimitive(obj)) {
            return true;
        }
        if (hasUpdateSymbol(obj)) {
            return false;
        }
        return typeReflections.isBuiltIn(obj) && !typeReflections.isPlainObject(obj);
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
    function makeSerializer(methodName, symbolsToCheck) {
        return function serializer(value, MapType) {
            if (isSerializable(value)) {
                return value;
            }
            var firstSerialize;
            if (MapType && !serializeMap) {
                serializeMap = {
                    unwrap: new MapType(),
                    serialize: new MapType()
                };
                firstSerialize = true;
            }
            var serialized;
            if (typeReflections.isValueLike(value)) {
                serialized = this[methodName](getSetReflections.getValue(value));
            } else {
                var isListLike = typeReflections.isIteratorLike(value) || typeReflections.isMoreListLikeThanMapLike(value);
                serialized = isListLike ? [] : {};
                if (serializeMap) {
                    if (serializeMap[methodName].has(value)) {
                        return serializeMap[methodName].get(value);
                    } else {
                        serializeMap[methodName].set(value, serialized);
                    }
                }
                for (var i = 0, len = symbolsToCheck.length; i < len; i++) {
                    var serializer = value[symbolsToCheck[i]];
                    if (serializer) {
                        var result = serializer.call(value, serialized);
                        if (firstSerialize) {
                            serializeMap = null;
                        }
                        return result;
                    }
                }
                if (typeof obj === 'function') {
                    if (serializeMap) {
                        serializeMap[methodName].set(value, value);
                    }
                    serialized = value;
                } else if (isListLike) {
                    this.eachIndex(value, function (childValue, index) {
                        serialized[index] = this[methodName](childValue);
                    }, this);
                } else {
                    this.eachKey(value, function (childValue, prop) {
                        serialized[prop] = this[methodName](childValue);
                    }, this);
                }
            }
            if (firstSerialize) {
                serializeMap = null;
            }
            return serialized;
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
                        deleteCount: sourceArray.length - index + 1,
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
                this.updateDeep(curVal, newVal);
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
                return this.eachIndex(obj, callback, context);
            } else {
                return this.eachKey(obj, callback, context);
            }
        },
        eachIndex: function (list, callback, context) {
            if (Array.isArray(list)) {
                return this.eachListLike(list, callback, context);
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
                    this.eachListLike(list, callback, context);
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
            this.each(obj, function (value) {
                arr.push(value);
            });
            return arr;
        },
        eachKey: function (obj, callback, context) {
            if (obj) {
                var enumerableKeys = this.getOwnEnumerableKeys(obj);
                var getKeyValue = obj[getKeyValueSymbol] || shiftedGetKeyValue;
                return this.eachIndex(enumerableKeys, function (key) {
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
                this.eachIndex(getOwnKeys.call(obj), function (objKey) {
                    if (objKey === key) {
                        found = true;
                        return false;
                    }
                });
                return found;
            }
            return obj.hasOwnProperty(key);
        },
        getOwnEnumerableKeys: function (obj) {
            var getOwnEnumerableKeys = obj[canSymbol.for('can.getOwnEnumerableKeys')];
            if (getOwnEnumerableKeys) {
                return getOwnEnumerableKeys.call(obj);
            }
            if (obj[canSymbol.for('can.getOwnKeys')] && obj[canSymbol.for('can.getOwnKeyDescriptor')]) {
                var keys = [];
                this.eachIndex(this.getOwnKeys(obj), function (key) {
                    var descriptor = this.getOwnKeyDescriptor(obj, key);
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
            this.eachKey(source, function (value, key) {
                if (!hasOwnKey(key) || getKeyValue.call(target, key) !== value) {
                    setKeyValue.call(target, key, value);
                }
            });
            return target;
        },
        assignList: function (target, source) {
            var inserting = this.toArray(source);
            getSetReflections.splice(target, 0, inserting, inserting);
            return target;
        },
        assign: function (target, source) {
            if (typeReflections.isIteratorLike(source) || typeReflections.isMoreListLikeThanMapLike(source)) {
                this.assignList(target, source);
            } else {
                this.assignMap(target, source);
            }
            return target;
        },
        assignDeepMap: function (target, source) {
            var hasOwnKey = fastHasOwnKey(target);
            var getKeyValue = target[getKeyValueSymbol] || shiftedGetKeyValue;
            var setKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;
            this.eachKey(source, function (newVal, key) {
                if (!hasOwnKey(key)) {
                    getSetReflections.setKeyValue(target, key, newVal);
                } else {
                    var curVal = getKeyValue.call(target, key);
                    if (newVal === curVal) {
                    } else if (typeReflections.isPrimitive(curVal) || typeReflections.isPrimitive(newVal) || shouldUpdateOrAssign(curVal) === false) {
                        setKeyValue.call(target, key, newVal);
                    } else {
                        this.assignDeep(curVal, newVal);
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
                this.assignDeepList(target, source);
            } else {
                this.assignDeepMap(target, source);
            }
            return target;
        },
        updateMap: function (target, source) {
            var sourceKeyMap = makeMap(this.getOwnEnumerableKeys(source));
            var sourceGetKeyValue = source[getKeyValueSymbol] || shiftedGetKeyValue;
            var targetSetKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;
            this.eachKey(target, function (curVal, key) {
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
            this.eachIndex(sourceKeyMap.keys(), function (key) {
                if (sourceKeyMap.get(key)) {
                    targetSetKeyValue.call(target, key, sourceGetKeyValue.call(source, key));
                }
            });
            return target;
        },
        updateList: function (target, source) {
            var inserting = this.toArray(source);
            getSetReflections.splice(target, 0, target, inserting);
            return target;
        },
        update: function (target, source) {
            if (typeReflections.isIteratorLike(source) || typeReflections.isMoreListLikeThanMapLike(source)) {
                this.updateList(target, source);
            } else {
                this.updateMap(target, source);
            }
            return target;
        },
        updateDeepMap: function (target, source) {
            var sourceKeyMap = makeMap(this.getOwnEnumerableKeys(source));
            var sourceGetKeyValue = source[getKeyValueSymbol] || shiftedGetKeyValue;
            var targetSetKeyValue = target[setKeyValueSymbol] || shiftedSetKeyValue;
            this.eachKey(target, function (curVal, key) {
                if (!sourceKeyMap.get(key)) {
                    getSetReflections.deleteKeyValue(target, key);
                    return;
                }
                sourceKeyMap.set(key, false);
                var newVal = sourceGetKeyValue.call(source, key);
                if (typeReflections.isPrimitive(curVal) || typeReflections.isPrimitive(newVal) || shouldUpdateOrAssign(curVal) === false) {
                    targetSetKeyValue.call(target, key, newVal);
                } else {
                    this.updateDeep(curVal, newVal);
                }
            }, this);
            this.eachIndex(sourceKeyMap.keys(), function (key) {
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
                this.updateDeepList(target, source);
            } else {
                this.updateDeepMap(target, source);
            }
            return target;
        },
        'in': function () {
        },
        getAllEnumerableKeys: function () {
        },
        getAllKeys: function () {
        },
        assignSymbols: function (target, source) {
            this.eachKey(source, function (value, key) {
                var symbol = typeReflections.isSymbolLike(canSymbol[key]) ? canSymbol[key] : canSymbol.for(key);
                getSetReflections.setKeyValue(target, symbol, value);
            });
            return target;
        },
        isSerializable: isSerializable,
        size: function (obj) {
            var size = obj[sizeSymbol];
            var count = 0;
            if (size) {
                return size.call(obj);
            } else if (helpers.hasLength(obj)) {
                return obj.length;
            } else if (typeReflections.isListLike(obj)) {
                this.each(obj, function () {
                    count++;
                });
                return count;
            } else if (obj) {
                for (var prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        count++;
                    }
                }
                return count;
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
    shapeReflections.keys = shapeReflections.getOwnEnumerableKeys;
    module.exports = shapeReflections;
});
/*can-reflect@1.8.0#reflections/get-name/get-name*/
define('can-reflect/reflections/get-name/get-name', [
    'require',
    'exports',
    'module',
    'can-symbol',
    'can-reflect/reflections/type/type'
], function (require, exports, module) {
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
    function getName(obj) {
        var nameGetter = obj[getNameSymbol];
        if (nameGetter) {
            return nameGetter.call(obj);
        }
        if (typeof obj === 'function') {
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
/*can-reflect@1.8.0#types/map*/
define('can-reflect/types/map', [
    'require',
    'exports',
    'module',
    'can-reflect/reflections/shape/shape',
    'can-symbol'
], function (require, exports, module) {
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
/*can-reflect@1.8.0#types/set*/
define('can-reflect/types/set', [
    'require',
    'exports',
    'module',
    'can-reflect/reflections/shape/shape',
    'can-symbol'
], function (require, exports, module) {
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
/*can-reflect@1.8.0#can-reflect*/
define('can-reflect', [
    'require',
    'exports',
    'module',
    'can-reflect/reflections/call/call',
    'can-reflect/reflections/get-set/get-set',
    'can-reflect/reflections/observe/observe',
    'can-reflect/reflections/shape/shape',
    'can-reflect/reflections/type/type',
    'can-reflect/reflections/get-name/get-name',
    'can-namespace',
    'can-reflect/types/map',
    'can-reflect/types/set'
], function (require, exports, module) {
    var functionReflections = require('can-reflect/reflections/call/call');
    var getSet = require('can-reflect/reflections/get-set/get-set');
    var observe = require('can-reflect/reflections/observe/observe');
    var shape = require('can-reflect/reflections/shape/shape');
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
        getName
    ].forEach(function (reflections) {
        for (var prop in reflections) {
            reflect[prop] = reflections[prop];
        }
    });
    require('can-reflect/types/map');
    require('can-reflect/types/set');
    module.exports = namespace.Reflect = reflect;
});
/*can-log@0.1.2#can-log*/
define('can-log', function (require, exports, module) {
    'use strict';
    exports.warnTimeout = 5000;
    exports.logLevel = 0;
    exports.warn = function (out) {
        var ll = this.logLevel;
        if (ll < 2) {
            Array.prototype.unshift.call(arguments, 'WARN:');
            if (typeof console !== 'undefined' && console.warn) {
                this._logger('warn', Array.prototype.slice.call(arguments));
            } else if (typeof console !== 'undefined' && console.log) {
                this._logger('log', Array.prototype.slice.call(arguments));
            } else if (window && window.opera && window.opera.postError) {
                window.opera.postError('CanJS WARNING: ' + out);
            }
        }
    };
    exports.log = function (out) {
        var ll = this.logLevel;
        if (ll < 1) {
            if (typeof console !== 'undefined' && console.log) {
                Array.prototype.unshift.call(arguments, 'INFO:');
                this._logger('log', Array.prototype.slice.call(arguments));
            } else if (window && window.opera && window.opera.postError) {
                window.opera.postError('CanJS INFO: ' + out);
            }
        }
    };
    exports.error = function (out) {
        var ll = this.logLevel;
        if (ll < 1) {
            if (typeof console !== 'undefined' && console.error) {
                Array.prototype.unshift.call(arguments, 'ERROR:');
                this._logger('error', Array.prototype.slice.call(arguments));
            } else if (window && window.opera && window.opera.postError) {
                window.opera.postError('ERROR: ' + out);
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
/*can-log@0.1.2#dev/dev*/
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
/*can-util@3.10.15#js/dev/dev*/
define('can-util/js/dev/dev', [
    'require',
    'exports',
    'module',
    'can-log/dev/dev'
], function (require, exports, module) {
    'use strict';
    module.exports = require('can-log/dev/dev');
});
/*can-queues@0.2.8#queue-state*/
define('can-queues/queue-state', function (require, exports, module) {
    module.exports = { lastTask: null };
});
/*can-queues@0.2.8#queue*/
define('can-queues/queue', [
    'require',
    'exports',
    'module',
    'can-queues/queue-state',
    'can-util/js/dev/dev'
], function (require, exports, module) {
    var queueState = require('can-queues/queue-state');
    var canDev = require('can-util/js/dev/dev');
    function noOperation() {
    }
    ;
    var Queue = function (name, callbacks) {
        this.callbacks = Object.assign({
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
/*can-queues@0.2.8#priority-queue*/
define('can-queues/priority-queue', [
    'require',
    'exports',
    'module',
    'can-queues/queue'
], function (require, exports, module) {
    var Queue = require('can-queues/queue');
    var PriorityQueue = function () {
        Queue.apply(this, arguments);
        this.taskMap = new Map();
        this.curPriorityIndex = Infinity;
        this.curPriorityMax = 0;
        this.taskContainersByPriority = [];
        this.isFlushing = false;
        this.tasksRemaining = 0;
    };
    PriorityQueue.prototype = Object.create(Queue.prototype);
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
    PriorityQueue.prototype.isEnqueued = function (fn) {
        return this.taskMap.has(fn);
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
    PriorityQueue.prototype.flushQueuedTask = function (fn) {
        var task = this.taskMap.get(fn);
        if (task) {
            var priority = task.meta.priority || 0;
            var taskContainer = this.taskContainersByPriority[priority];
            var index = taskContainer.tasks.indexOf(task, taskContainer.index);
            if (index >= 0) {
                taskContainer.tasks.splice(index, 1);
                this.tasksRemaining--;
                this.taskMap['delete'](task.fn);
                task.fn.apply(task.context, task.args);
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
        var taskContainer = this.taskContainersByPriority[priority] || (this.taskContainersByPriority[priority] = {
            tasks: [],
            index: 0
        });
        return taskContainer;
    };
    PriorityQueue.prototype.tasksRemainingCount = function () {
        return this.tasksRemaining;
    };
    module.exports = PriorityQueue;
});
/*can-queues@0.2.8#completion-queue*/
define('can-queues/completion-queue', [
    'require',
    'exports',
    'module',
    'can-queues/queue'
], function (require, exports, module) {
    var Queue = require('can-queues/queue');
    var CompletionQueue = function () {
        Queue.apply(this, arguments);
        this.flushCount = 0;
    };
    CompletionQueue.prototype = Object.create(Queue.prototype);
    CompletionQueue.prototype.flush = function () {
        if (this.flushCount > 0) {
        } else {
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
/*can-queues@0.2.8#can-queues*/
define('can-queues', [
    'require',
    'exports',
    'module',
    'can-util/js/dev/dev',
    'can-queues/queue',
    'can-queues/priority-queue',
    'can-queues/queue-state',
    'can-queues/completion-queue',
    'can-namespace'
], function (require, exports, module) {
    var canDev = require('can-util/js/dev/dev');
    var Queue = require('can-queues/queue');
    var PriorityQueue = require('can-queues/priority-queue');
    var queueState = require('can-queues/queue-state');
    var CompletionQueue = require('can-queues/completion-queue');
    var ns = require('can-namespace');
    var batchStartCounter = 0;
    var addedNotifyTask = false;
    var isFlushing = false;
    var batchNum = 0;
    var batchData;
    var emptyObject = function () {
        return {};
    };
    var NOTIFY_QUEUE, DERIVE_QUEUE, DOM_UI_QUEUE, MUTATE_QUEUE;
    NOTIFY_QUEUE = new Queue('NOTIFY', {
        onComplete: function () {
            DERIVE_QUEUE.flush();
        },
        onFirstTask: function () {
            if (!batchStartCounter) {
                NOTIFY_QUEUE.flush();
            } else {
                addedNotifyTask = true;
            }
        }
    });
    DERIVE_QUEUE = new PriorityQueue('DERIVE', {
        onComplete: function () {
            DOM_UI_QUEUE.flush();
        },
        onFirstTask: function () {
            addedNotifyTask = true;
        }
    });
    DOM_UI_QUEUE = new CompletionQueue('DOM_UI', {
        onComplete: function () {
            MUTATE_QUEUE.flush();
        },
        onFirstTask: function () {
            addedNotifyTask = true;
        }
    });
    MUTATE_QUEUE = new Queue('MUTATE', {
        onComplete: function () {
            queueState.lastTask = null;
            isFlushing = false;
        },
        onFirstTask: function () {
            addedNotifyTask = true;
        }
    });
    var queues = {
        Queue: Queue,
        PriorityQueue: PriorityQueue,
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
                    if (addedNotifyTask) {
                        addedNotifyTask = false;
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
        enqueueByQueue: function enqueueByQueue(fnByQueue, context, args, makeMeta, reasonLog) {
            if (fnByQueue) {
                makeMeta = makeMeta || emptyObject;
                queues.batch.start();
                [
                    'notify',
                    'derive',
                    'domUI',
                    'mutate'
                ].forEach(function (queueName) {
                    var name = queueName + 'Queue';
                    var QUEUE = queues[name], tasks = fnByQueue[queueName];
                    if (tasks !== undefined) {
                        tasks.forEach(function (handler) {
                            var meta = makeMeta && makeMeta(handler, context, args);
                            meta.reasonLog = reasonLog;
                            QUEUE.enqueue(handler, context, args, meta);
                        });
                    }
                });
                queues.batch.stop();
            }
        },
        stack: function () {
            var current = queueState.lastTask;
            var stack = [];
            while (current) {
                stack.unshift(current);
                current = current.meta.parentTask;
            }
            return stack;
        },
        logStack: function () {
            var stack = this.stack();
            stack.forEach(function (task) {
                var log = task.meta && task.meta.log ? task.meta.log : [
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
/*can-key-tree@0.1.0#can-key-tree*/
define('can-key-tree', [
    'require',
    'exports',
    'module',
    'can-reflect'
], function (require, exports, module) {
    var reflect = require('can-reflect');
    function isBuiltInPrototype(obj) {
        return obj === Object.prototype || Object.prototype.toString.call(obj) !== '[object Object]' && Object.prototype.toString.call(obj).indexOf('[object ') !== -1;
    }
    var KeyTree = function (treeStructure, callbacks) {
        this.callbacks = callbacks || {};
        this.treeStructure = treeStructure;
        var FirstConstructor = treeStructure[0];
        if (reflect.isConstructorLike(FirstConstructor)) {
            this.root = new FirstConstructor();
        } else {
            this.root = FirstConstructor;
        }
    };
    KeyTree.prototype.add = function (keys) {
        if (keys.length > this.treeStructure.length) {
            throw new Error('can-key-tree: Can not add path deeper than tree.');
        }
        var place = this.root;
        var rootWasEmpty = reflect.size(this.root) === 0;
        for (var i = 0; i < keys.length - 1; i++) {
            var key = keys[i];
            var store = reflect.getKeyValue(place, key);
            if (!store) {
                var Constructor = this.treeStructure[i + 1];
                if (isBuiltInPrototype(Constructor.prototype)) {
                    store = new Constructor();
                } else {
                    store = new Constructor(key);
                }
                reflect.setKeyValue(place, key, store);
            }
            place = store;
        }
        if (reflect.isMoreListLikeThanMapLike(place)) {
            reflect.addValues(place, [keys[keys.length - 1]]);
        } else {
            throw new Error('can-key-tree: Map types are not supported yet.');
        }
        if (rootWasEmpty && this.callbacks.onFirst) {
            this.callbacks.onFirst.call(this);
        }
    };
    function getDeep(item, items, depth, maxDepth) {
        if (!item) {
            return;
        }
        if (maxDepth === depth) {
            if (reflect.isMoreListLikeThanMapLike(item)) {
                reflect.addValues(items, reflect.toArray(item));
            } else {
                throw new Error('can-key-tree: Map types are not supported yet.');
            }
        } else {
            reflect.each(item, function (value) {
                getDeep(value, items, depth + 1, maxDepth);
            });
        }
    }
    KeyTree.prototype.get = function (keys) {
        var place = this.getNode(keys);
        if (this.treeStructure.length === keys.length) {
            return place;
        } else {
            var Type = this.treeStructure[this.treeStructure.length - 1];
            var items = new Type();
            getDeep(place, items, keys.length, this.treeStructure.length - 1);
            return items;
        }
    };
    KeyTree.prototype.getNode = function (keys) {
        var place = this.root;
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var store = reflect.getKeyValue(place, key);
            if (!store) {
                return;
            }
            place = store;
        }
        return place;
    };
    function clear(item, depth, maxDepth) {
        if (maxDepth === depth) {
            if (reflect.isMoreListLikeThanMapLike(item)) {
                reflect.removeValues(item, reflect.toArray(item));
            } else {
                throw new Error('can-key-tree: Map types are not supported yet.');
            }
        } else {
            reflect.each(item, function (value, key) {
                clear(value, depth + 1, maxDepth);
                reflect.deleteKeyValue(item, key);
            });
        }
    }
    KeyTree.prototype.delete = function (keys) {
        var place = this.root;
        var roots = [this.root];
        for (var i = 0; i < keys.length - 1; i++) {
            var key = keys[i];
            var store = reflect.getKeyValue(place, key);
            if (store === undefined) {
                return false;
            } else {
                roots.push(store);
            }
            place = store;
        }
        var lastKey = keys[keys.length - 1];
        if (keys.length === this.treeStructure.length) {
            if (reflect.isMoreListLikeThanMapLike(place)) {
                reflect.removeValues(place, [lastKey]);
            } else {
                throw new Error('can-key-tree: Map types are not supported yet.');
            }
        } else if (!keys.length) {
            clear(place, 0, this.treeStructure.length - 1);
        } else {
            var branch = reflect.getKeyValue(place, lastKey);
            if (branch !== undefined) {
                clear(branch, keys.length, this.treeStructure.length - 1);
                reflect.deleteKeyValue(place, lastKey);
            } else {
                return false;
            }
        }
        for (i = roots.length - 2; i >= 0; i--) {
            if (reflect.size(place) === 0) {
                place = roots[i];
                reflect.deleteKeyValue(place, keys[i]);
            } else {
                break;
            }
        }
        if (this.callbacks.onEmpty && reflect.size(this.root) === 0) {
            this.callbacks.onEmpty.call(this);
        }
        return true;
    };
    function getDepth(root, level) {
        if (level === 0) {
            return reflect.size(root);
        } else if (reflect.size(root) === 0) {
            return 0;
        } else {
            var count = 0;
            reflect.each(root, function (value) {
                count += getDepth(value, level - 1);
            });
            return count;
        }
    }
    KeyTree.prototype.size = function () {
        return getDepth(this.root, this.treeStructure.length - 1);
    };
    module.exports = KeyTree;
});
/*can-observation-recorder@0.1.0#can-observation-recorder*/
define('can-observation-recorder', [
    'require',
    'exports',
    'module',
    'can-namespace'
], function (require, exports, module) {
    var namespace = require('can-namespace');
    var stack = [];
    var observationRecorder = {
        stack: stack,
        makeDependenciesRecorder: function () {
            return {
                traps: null,
                keyDependencies: new Map(),
                valueDependencies: new Set(),
                ignore: 0
            };
        },
        start: function () {
            stack.push({
                traps: null,
                keyDependencies: new Map(),
                valueDependencies: new Set(),
                ignore: 0
            });
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
        },
        isRecording: function () {
            var len = stack.length;
            var last = len && stack[len - 1];
            return last && last.ignore === 0 && last;
        }
    };
    if (namespace.observationRecorder) {
        throw new Error('You can\'t have two versions of can-observation-recorder, check your dependencies');
    } else {
        module.exports = namespace.observationRecorder = observationRecorder;
    }
});
/*can-observe@2.0.0-pre.4#src/-symbols*/
define('can-observe/src/-symbols', [
    'require',
    'exports',
    'module',
    'can-symbol'
], function (require, exports, module) {
    var canSymbol = require('can-symbol');
    module.exports = {
        metaSymbol: canSymbol.for('can.meta'),
        patchesSymbol: canSymbol('patches')
    };
});
/*can-observe@2.0.0-pre.4#src/-observable-store*/
define('can-observe/src/-observable-store', function (require, exports, module) {
    module.exports = {
        proxiedObjects: new WeakMap(),
        proxies: new WeakSet()
    };
});
/*can-observe@2.0.0-pre.4#src/-helpers*/
define('can-observe/src/-helpers', function (require, exports, module) {
    var classTest = /^\s*class\s+/;
    module.exports = {
        assignEverything: function (d, s) {
            Object.getOwnPropertyNames(s).concat(Object.getOwnPropertySymbols(s)).forEach(function (key) {
                d[key] = s[key];
            });
            return d;
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
        }
    };
});
/*can-observe@2.0.0-pre.4#src/-make-object*/
define('can-observe/src/-make-object', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-queues',
    'can-symbol',
    'can-key-tree',
    'can-observation-recorder',
    'can-observe/src/-symbols',
    'can-observe/src/-observable-store',
    'can-observe/src/-helpers'
], function (require, exports, module) {
    var canReflect = require('can-reflect');
    var queues = require('can-queues');
    var canSymbol = require('can-symbol');
    var KeyTree = require('can-key-tree');
    var ObservationRecorder = require('can-observation-recorder');
    var symbols = require('can-observe/src/-symbols');
    var dispatchInstanceOnPatchesSymbol = canSymbol.for('can.dispatchInstanceOnPatches');
    var dispatchBoundChangeSymbol = canSymbol.for('can.dispatchInstanceBoundChange');
    var hasOwn = Object.prototype.hasOwnProperty;
    var observableStore = require('can-observe/src/-observable-store');
    var helpers = require('can-observe/src/-helpers');
    var metaKeys = canReflect.assignSymbols(Object.create(null), {
        'can.onKeyValue': function (key, handler, queue) {
            var handlers = this[symbols.metaSymbol].handlers;
            handlers.add([
                key,
                queue || 'notify',
                handler
            ]);
        },
        'can.offKeyValue': function (key, handler, queue) {
            var handlers = this[symbols.metaSymbol].handlers;
            handlers.delete([
                key,
                queue || 'notify',
                handler
            ]);
        },
        'can.onPatches': function (handler, queue) {
            var handlers = this[symbols.metaSymbol].handlers;
            handlers.add([
                symbols.patchesSymbol,
                queue || 'notify',
                handler
            ]);
        },
        'can.offPatches': function (handler, queue) {
            var handlers = this[symbols.metaSymbol].handlers;
            handlers.delete([
                symbols.patchesSymbol,
                queue || 'notify',
                handler
            ]);
        },
        'can.isBound': function () {
            return this[symbols.metaSymbol].handlers.size() > 0;
        }
    });
    var makeObject = {
        observable: function (object, options) {
            var proxyKeys = Object.create(makeObject.metaKeys());
            var meta = {
                target: object,
                proxyKeys: proxyKeys,
                options: options,
                preventSideEffects: 0
            };
            meta.handlers = makeObject.handlers(meta);
            proxyKeys[symbols.metaSymbol] = meta;
            return meta.proxy = new Proxy(object, {
                get: makeObject.get.bind(meta),
                set: makeObject.set.bind(meta),
                ownKeys: makeObject.ownKeys.bind(meta),
                deleteProperty: makeObject.deleteProperty.bind(meta),
                meta: meta
            });
        },
        handlers: function (meta) {
            return new KeyTree([
                Object,
                Object,
                Array
            ], {
                onFirst: function () {
                    if (meta.proxy.constructor[dispatchBoundChangeSymbol]) {
                        meta.proxy.constructor[dispatchBoundChangeSymbol](meta.proxy, true);
                    }
                },
                onEmpty: function () {
                    if (meta.proxy.constructor[dispatchBoundChangeSymbol]) {
                        meta.proxy.constructor[dispatchBoundChangeSymbol](meta.proxy, false);
                    }
                }
            });
        },
        metaKeys: function () {
            return metaKeys;
        },
        get: function (target, key, receiver) {
            if (this.proxyKeys[key] !== undefined) {
                return this.proxyKeys[key];
            }
            if (canReflect.isSymbolLike(key)) {
                return target[key];
            }
            var keyInfo = makeObject.getKeyInfo(target, key, receiver, this);
            var value = keyInfo.targetValue;
            if (!keyInfo.valueIsInvariant) {
                value = makeObject.getValueFromStore(key, value, this);
            }
            if (makeObject.shouldRecordObservationOnOwnAndMissingKeys(keyInfo, this)) {
                ObservationRecorder.add(this.proxy, key.toString());
            }
            if (keyInfo.parentObservableGetCalledOn) {
                ObservationRecorder.add(keyInfo.parentObservableGetCalledOn, key.toString());
            }
            return value;
        },
        set: function (target, key, value, receiver) {
            if (receiver !== this.proxy) {
                return makeObject.setPrototypeKey(key, value, receiver, this);
            }
            value = makeObject.getValueToSet(key, value, this);
            makeObject.setValueAndOnChange(key, value, this, function (key, value, meta, hadOwn, old) {
                queues.batch.start();
                queues.enqueueByQueue(meta.handlers.getNode([key]), meta.proxy, [
                    value,
                    old
                ]);
                var patches = [{
                        key: key,
                        type: hadOwn ? 'set' : 'add',
                        value: value
                    }];
                queues.enqueueByQueue(meta.handlers.getNode([symbols.patchesSymbol]), meta.proxy, [patches]);
                var constructor = meta.target.constructor, dispatchPatches = constructor[dispatchInstanceOnPatchesSymbol];
                if (dispatchPatches) {
                    dispatchPatches.call(constructor, meta.proxy, patches);
                }
                queues.batch.stop();
            });
            return true;
        },
        ownKeys: function (target, key) {
            return Object.getOwnPropertyNames(this.target).concat(Object.getOwnPropertySymbols(this.target)).concat(Object.getOwnPropertySymbols(this.proxyKeys));
        },
        getKeyInfo: function (target, key, receiver, meta) {
            var descriptor = Object.getOwnPropertyDescriptor(target, key);
            var propertyInfo = {
                key: key,
                descriptor: descriptor,
                targetHasOwnKey: Boolean(descriptor),
                protoHasKey: descriptor ? false : key in target,
                valueIsInvariant: descriptor ? descriptor.writable !== true : false,
                targetValue: undefined,
                getCalledOnParent: receiver !== meta.proxy
            };
            if (descriptor) {
                if (descriptor.get) {
                    propertyInfo.targetValue = descriptor.get.call(meta.proxy);
                } else {
                    propertyInfo.targetValue = descriptor.value;
                }
            } else {
                propertyInfo.targetValue = meta.target[key];
            }
            if (propertyInfo.getCalledOnParent) {
                propertyInfo.parentObservableGetCalledOn = observableStore.proxiedObjects.get(receiver);
            }
            return propertyInfo;
        },
        shouldRecordObservationOnOwnAndMissingKeys: function (keyInfo, meta) {
            return meta.preventSideEffects === 0 && (keyInfo.targetHasOwnKey || !keyInfo.protoHasKey && !Object.isSealed(meta.target));
        },
        deleteProperty: function (target, key) {
            var old = this.target[key];
            var ret = delete this.target[key];
            if (ret && this.preventSideEffects === 0 && old !== undefined) {
                queues.batch.start();
                queues.enqueueByQueue(this.handlers.getNode([key]), this.proxy, [
                    undefined,
                    old
                ]);
                var patches = [{
                        key: key,
                        type: 'delete'
                    }];
                queues.enqueueByQueue(this.handlers.getNode([symbols.patchesSymbol]), this.proxy, [patches]);
                var constructor = this.target.constructor, dispatchPatches = constructor[dispatchInstanceOnPatchesSymbol];
                if (dispatchPatches) {
                    dispatchPatches.call(constructor, this.proxy, patches);
                }
                queues.batch.stop();
            }
            return ret;
        },
        setPrototypeKey: function (key, value, receiver, meta) {
            Object.defineProperty(receiver, key, {
                value: value,
                configurable: true,
                enumerable: true,
                writable: true
            });
            return true;
        },
        getValueFromTarget: function (key, meta) {
            var descriptor = Object.getOwnPropertyDescriptor(meta.target, key);
            if (descriptor && descriptor.get) {
                return descriptor.get.call(meta.proxy);
            } else {
                return meta.target[key];
            }
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
/*can-util@3.10.15#js/diff/diff*/
define('can-util/js/diff/diff', function (require, exports, module) {
    'use strict';
    var slice = [].slice;
    var defaultIdentity = function (a, b) {
        return a === b;
    };
    function reverseDiff(oldDiffStopIndex, newDiffStopIndex, oldList, newList, identity) {
        var oldIndex = oldList.length - 1, newIndex = newList.length - 1;
        while (oldIndex > oldDiffStopIndex && newIndex > newDiffStopIndex) {
            var oldItem = oldList[oldIndex], newItem = newList[newIndex];
            if (identity(oldItem, newItem)) {
                oldIndex--;
                newIndex--;
                continue;
            } else {
                return [{
                        index: newDiffStopIndex,
                        deleteCount: oldIndex - oldDiffStopIndex + 1,
                        insert: slice.call(newList, newDiffStopIndex, newIndex + 1)
                    }];
            }
        }
        return [{
                index: newDiffStopIndex,
                deleteCount: oldIndex - oldDiffStopIndex + 1,
                insert: slice.call(newList, newDiffStopIndex, newIndex + 1)
            }];
    }
    module.exports = exports = function (oldList, newList, identity) {
        identity = identity || defaultIdentity;
        var oldIndex = 0, newIndex = 0, oldLength = oldList.length, newLength = newList.length, patches = [];
        while (oldIndex < oldLength && newIndex < newLength) {
            var oldItem = oldList[oldIndex], newItem = newList[newIndex];
            if (identity(oldItem, newItem)) {
                oldIndex++;
                newIndex++;
                continue;
            }
            if (newIndex + 1 < newLength && identity(oldItem, newList[newIndex + 1])) {
                patches.push({
                    index: newIndex,
                    deleteCount: 0,
                    insert: [newList[newIndex]]
                });
                oldIndex++;
                newIndex += 2;
                continue;
            } else if (oldIndex + 1 < oldLength && identity(oldList[oldIndex + 1], newItem)) {
                patches.push({
                    index: newIndex,
                    deleteCount: 1,
                    insert: []
                });
                oldIndex += 2;
                newIndex++;
                continue;
            } else {
                patches.push.apply(patches, reverseDiff(oldIndex, newIndex, oldList, newList, identity));
                return patches;
            }
        }
        if (newIndex === newLength && oldIndex === oldLength) {
            return patches;
        }
        patches.push({
            index: newIndex,
            deleteCount: oldLength - oldIndex,
            insert: slice.call(newList, newIndex)
        });
        return patches;
    };
});
/*can-util@3.10.15#js/diff-array/diff-array*/
define('can-util/js/diff-array/diff-array', [
    'require',
    'exports',
    'module',
    'can-util/js/diff/diff'
], function (require, exports, module) {
    'use strict';
    var diff = require('can-util/js/diff/diff');
    module.exports = exports = diff;
});
/*can-observe@2.0.0-pre.4#src/-make-array*/
define('can-observe/src/-make-array', [
    'require',
    'exports',
    'module',
    'can-queues',
    'can-symbol',
    'can-observation-recorder',
    'can-observe/src/-make-object',
    'can-observe/src/-symbols',
    'can-util/js/diff-array/diff-array',
    'can-observe/src/-observable-store',
    'can-observe/src/-helpers'
], function (require, exports, module) {
    var queues = require('can-queues');
    var canSymbol = require('can-symbol');
    var ObservationRecorder = require('can-observation-recorder');
    var makeObject = require('can-observe/src/-make-object');
    var symbols = require('can-observe/src/-symbols');
    var diffArray = require('can-util/js/diff-array/diff-array');
    var observableStore = require('can-observe/src/-observable-store');
    var helpers = require('can-observe/src/-helpers');
    var dispatchInstanceOnPatchesSymbol = canSymbol.for('can.dispatchInstanceOnPatches');
    function isIntegerIndex(prop) {
        return prop && +prop === +prop && +prop % 1 === 0;
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
        'sort': function (arr, args, old) {
            return diffArray(old, arr);
        },
        'reverse': function (arr, args, old) {
            return diffArray(old, arr);
        }
    };
    (function () {
        Object.keys(mutateMethods).forEach(function (prop) {
            var protoFn = Array.prototype[prop];
            var observable = function () {
                var meta = this[symbols.metaSymbol];
                var preventSideEffects = meta.preventSideEffects;
                meta.preventSideEffects++;
                var old = [].slice.call(meta.target, 0);
                var ret = protoFn.apply(meta.target, arguments);
                var patches = mutateMethods[prop](meta.target, Array.from(arguments), old);
                if (preventSideEffects === 0) {
                    queues.batch.start();
                    queues.enqueueByQueue(meta.handlers.getNode(['length']), meta.proxy, [
                        meta.target.length,
                        old.length
                    ]);
                    queues.enqueueByQueue(meta.handlers.getNode([symbols.patchesSymbol]), meta.proxy, [patches.concat([{
                                key: 'length',
                                type: 'set',
                                value: meta.target.length
                            }])]);
                    var constructor = meta.proxy.constructor, dispatchPatches = constructor[dispatchInstanceOnPatchesSymbol];
                    if (dispatchPatches) {
                        dispatchPatches.call(constructor, meta.proxy, patches);
                    }
                    queues.batch.stop();
                }
                meta.preventSideEffects--;
                return ret;
            };
            observableStore.proxiedObjects.set(protoFn, observable);
            observableStore.proxies.add(observable);
        });
        Object.getOwnPropertyNames(Array.prototype).forEach(function (prop) {
            if (mutateMethods[prop]) {
                return;
            }
            var protoFn = Array.prototype[prop];
            if (prop !== 'constructor' && typeof protoFn === 'function') {
                var observable = function () {
                    ObservationRecorder.add(this, symbols.patchesSymbol);
                    var meta = this[symbols.metaSymbol];
                    meta.preventSideEffects++;
                    var ret = protoFn.apply(this, arguments);
                    meta.preventSideEffects--;
                    return meta.options.observe(ret);
                };
                observableStore.proxiedObjects.set(protoFn, observable);
                observableStore.proxies.add(observable);
            }
        });
    }());
    function didLengthChangeCauseDeletions(key, value, old, meta) {
        return key === 'length' && value < old;
    }
    var metaKeys = helpers.assignEverything(Object.create(null), makeObject.metaKeys());
    var makeArray = {
        observable: function (object, options) {
            var proxyKeys = Object.create(makeArray.metaKeys());
            var meta = {
                target: object,
                proxyKeys: proxyKeys,
                options: options,
                preventSideEffects: 0
            };
            meta.handlers = makeObject.handlers(meta);
            proxyKeys[symbols.metaSymbol] = meta;
            return meta.proxy = new Proxy(object, {
                get: makeObject.get.bind(meta),
                set: makeArray.set.bind(meta),
                ownKeys: makeObject.ownKeys.bind(meta),
                deleteProperty: makeObject.deleteProperty.bind(meta),
                meta: meta
            });
        },
        metaKeys: function () {
            return metaKeys;
        },
        set: function (target, key, value, receiver) {
            if (receiver !== this.proxy) {
                return makeObject.setPrototypeKey(key, value, receiver, this);
            }
            value = makeObject.getValueToSet(key, value, this);
            makeObject.setValueAndOnChange(key, value, this, function (key, value, meta, hadOwn, old) {
                var integerIndex = isIntegerIndex(key);
                queues.batch.start();
                var patches = [{
                        key: key,
                        type: hadOwn ? 'set' : 'add',
                        value: value
                    }];
                queues.enqueueByQueue(meta.handlers.getNode([key]), meta.proxy, [
                    value,
                    old
                ]);
                if (integerIndex) {
                    if (!hadOwn && +key === meta.target.length - 1) {
                        patches.push({
                            key: 'length',
                            type: 'set',
                            value: meta.target.length
                        });
                    } else {
                        patches.push.apply(patches, mutateMethods.splice(target, [
                            +key,
                            1,
                            value
                        ]));
                    }
                }
                if (didLengthChangeCauseDeletions(key, value, old, meta)) {
                    while (old-- > value) {
                        patches.push({
                            key: old,
                            type: 'delete'
                        });
                    }
                }
                queues.enqueueByQueue(meta.handlers.getNode([symbols.patchesSymbol]), meta.proxy, [patches]);
                var constructor = meta.target.constructor, dispatchPatches = constructor[dispatchInstanceOnPatchesSymbol];
                if (dispatchPatches) {
                    dispatchPatches.call(constructor, meta.proxy, patches);
                }
                queues.batch.stop();
            });
            return true;
        }
    };
    module.exports = makeArray;
});
/*can-observe@2.0.0-pre.4#src/-make-function*/
define('can-observe/src/-make-function', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-queues',
    'can-key-tree',
    'can-observe/src/-make-object',
    'can-observe/src/-symbols',
    'can-observe/src/-observable-store',
    'can-observe/src/-helpers'
], function (require, exports, module) {
    var canReflect = require('can-reflect');
    var queues = require('can-queues');
    var KeyTree = require('can-key-tree');
    var makeObject = require('can-observe/src/-make-object');
    var symbols = require('can-observe/src/-symbols');
    var observableStore = require('can-observe/src/-observable-store');
    var helpers = require('can-observe/src/-helpers');
    var metaKeys = helpers.assignEverything(Object.create(null), makeObject.metaKeys());
    canReflect.assignSymbols(metaKeys, {
        'can.onInstanceBoundChange': function (handler, queueName) {
            this[symbols.metaSymbol].lifecycleHandlers.add([
                queueName || 'mutate',
                handler
            ]);
        },
        'can.offInstanceBoundChange': function (handler, queueName) {
            this[symbols.metaSymbol].lifecycleHandlers.delete([
                queueName || 'mutate',
                handler
            ]);
        },
        'can.dispatchInstanceBoundChange': function (obj, isBound) {
            queues.enqueueByQueue(this[symbols.metaSymbol].lifecycleHandlers.getNode([]), this, [
                obj,
                isBound
            ]);
        },
        'can.onInstancePatches': function (handler, queueName) {
            this[symbols.metaSymbol].instancePatchesHandlers.add([
                queueName || 'mutate',
                handler
            ]);
        },
        'can.offInstancePatches': function (handler, queueName) {
            this[symbols.metaSymbol].instancePatchesHandlers.delete([
                queueName || 'mutate',
                handler
            ]);
        },
        'can.dispatchInstanceOnPatches': function (obj, patches) {
            queues.enqueueByQueue(this[symbols.metaSymbol].instancePatchesHandlers.getNode([]), this, [
                obj,
                patches
            ]);
        },
        'can.defineInstanceKey': function (prop, value) {
            this[symbols.metaSymbol].definitions[prop] = value;
        }
    });
    var makeFunction = {
        observable: function (object, options) {
            var proxyKeys = Object.create(makeFunction.metaKeys());
            var meta = {
                lifecycleHandlers: new KeyTree([
                    Object,
                    Array
                ]),
                instancePatchesHandlers: new KeyTree([
                    Object,
                    Array
                ]),
                target: object,
                proxyKeys: proxyKeys,
                options: options,
                definitions: {},
                isClass: helpers.isClass(object),
                preventSideEffects: 0
            };
            meta.handlers = makeObject.handlers(meta);
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
            observableStore.proxiedObjects.set(object, meta.proxy);
            observableStore.proxies.add(meta.proxy);
            if (meta.target.prototype && meta.target.prototype.constructor === meta.target) {
                var prototype = meta.proxy.prototype;
                prototype.constructor = meta.proxy;
            }
            return meta.proxy;
        },
        metaKeys: function () {
            return metaKeys;
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
        }
    };
    module.exports = makeFunction;
});
/*can-observe@2.0.0-pre.4#src/-make-observe*/
define('can-observe/src/-make-observe', [
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-observe/src/-observable-store',
    'can-observe/src/-helpers'
], function (require, exports, module) {
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
            if (helpers.isBuiltInButNotArrayOrPlainObject(value)) {
                return value;
            }
            if (typeof value === 'function') {
                observable = makeObserve.function(value);
            } else if (helpers.inheritsFromArray(value)) {
                observable = makeObserve.array(value);
            } else {
                observable = makeObserve.object(value);
            }
            observables.proxiedObjects.set(value, observable);
            observables.proxies.add(observable);
            return observable;
        }
    };
    module.exports = makeObserve;
});
/*can-observe@2.0.0-pre.4#can-observe*/
define('can-observe', [
    'require',
    'exports',
    'module',
    'can-observe/src/-make-object',
    'can-observe/src/-make-array',
    'can-observe/src/-make-function',
    'can-observe/src/-make-observe',
    'can-reflect'
], function (require, exports, module) {
    var makeObject = require('can-observe/src/-make-object');
    var makeArray = require('can-observe/src/-make-array');
    var makeFunction = require('can-observe/src/-make-function');
    var makeObserve = require('can-observe/src/-make-observe');
    var canReflect = require('can-reflect');
    makeObserve.object = function (object) {
        return makeObject.observable(object, makeObserve);
    };
    makeObserve.array = function (array) {
        return makeArray.observable(array, makeObserve);
    };
    makeObserve.function = function (array) {
        return makeFunction.observable(array, makeObserve);
    };
    makeObserve.observe.makeMapType = function (name, staticProps, prototypeProps) {
        var Type = function (props) {
            canReflect.assign(this, props || {});
        };
        canReflect.assign(Type, staticProps || {});
        canReflect.assign(Type.prototype, prototypeProps || {});
        return makeObserve.observe(Type);
    };
    makeObserve.observe.makeMapType = function (name, staticProps, prototypeProps) {
        var Type = function (props) {
            canReflect.assign(this, props || {});
        };
        canReflect.assign(Type, staticProps || {});
        canReflect.assign(Type.prototype, prototypeProps || {});
        return makeObserve.observe(Type);
    };
    makeObserve.observe.makeListType = function (name, staticProps, prototypeProps) {
        var Type = function (values) {
            this.push.apply(this, arguments);
        };
        Type.prototype = Object.create(Array.prototype);
        canReflect.assign(Type, staticProps || {});
        canReflect.assign(Type.prototype, prototypeProps || {});
        Type.prototype.constructor = Type;
        return makeObserve.observe(Type);
    };
    module.exports = makeObserve.observe;
});
/*[global-shim-end]*/
(function(global) { // jshint ignore:line
	global._define = global.define;
	global.define = global.define.orig;
}
)(typeof self == "object" && self.Object == Object ? self : window);