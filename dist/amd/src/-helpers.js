/*can-observe@2.0.0-pre.17#src/-helpers*/
define([
    'require',
    'exports',
    'module',
    'can-symbol'
], function (require, exports, module) {
    var canSymbol = require('can-symbol');
    var metaSymbol = canSymbol.for('can.meta');
    var definitionsSymbol = canSymbol.for('can.typeDefinitions');
    var classTest = /^\s*class\s+/;
    var helpers = {
        assignEverything: function (d, s) {
            Object.getOwnPropertyNames(s).concat(Object.getOwnPropertySymbols(s)).forEach(function (key) {
                Object.defineProperty(d, key, Object.getOwnPropertyDescriptor(s, key));
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
            return function etend(name, staticProps, prototypeProps) {
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
                Type.prototype = Object.create(BaseType.prototype);
                helpers.assignEverything(Type.prototype, prototypeProps || {});
                Type.prototype.constructor = Type;
                Type.prototype[definitionsSymbol] = Object.create(BaseType.prototype[definitionsSymbol] || null);
                return Type;
            };
        }
    };
    module.exports = helpers;
});