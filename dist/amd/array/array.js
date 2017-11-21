/*can-observe@2.0.0-pre.9#array/array*/
define([
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-symbol',
    '../src/-make-array',
    '../src/-make-observe',
    'can-event-queue/map',
    'can-event-queue/type',
    'can-queues',
    '../src/-helpers'
], function (require, exports, module) {
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var makeArray = require('../src/-make-array');
    var makeObserve = require('../src/-make-observe');
    var eventMixin = require('can-event-queue/map');
    var typeEventMixin = require('can-event-queue/type');
    var queues = require('can-queues');
    var helpers = require('../src/-helpers');
    var definitionsSymbol = canSymbol.for('can.typeDefinitions');
    var metaSymbol = canSymbol.for('can.meta');
    function ensureTypeDefinition(obj) {
        var typeDefs = obj.prototype[definitionsSymbol];
        if (!typeDefs) {
            typeDefs = obj.prototype[definitionsSymbol] = Object.create(null);
        }
        return typeDefs;
    }
    var ObserveArray;
    if (false) {
        ObserveArray = class ObserveArray extends Array {
            constructor(items) {
                super();
                var prototype = Object.getPrototypeOf(this);
                var constructor = this.constructor;
                var instance = this;
                var definitions = prototype[definitionsSymbol] || {};
                for (var key in definitions) {
                    Object.defineProperty(instance, key, definitions[key]);
                }
                this.push.apply(this, items);
                return makeArray.observable(instance, {
                    observe: makeObserve.observe,
                    proxyKeys: { constructor: constructor }
                });
            }
        };
    } else {
        var ObserveArray = function (items) {
            var prototype = Object.getPrototypeOf(this);
            var constructor = this.constructor;
            var instance = this;
            var definitions = prototype[definitionsSymbol] || {};
            for (var key in definitions) {
                Object.defineProperty(instance, key, definitions[key]);
            }
            this.push.apply(this, items || []);
            return makeArray.observable(instance, {
                observe: makeObserve.observe,
                proxyKeys: { constructor: constructor }
            });
        };
        ObserveArray.prototype = Object.create(Array.prototype);
    }
    typeEventMixin(ObserveArray);
    canReflect.assignSymbols(ObserveArray, {
        'can.defineInstanceKey': function (prop, value) {
            ensureTypeDefinition(this)[prop] = value;
        },
        'can.dispatchInstanceBoundChange': function (obj, isBound) {
            var meta = this[metaSymbol];
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
    ObserveArray.extend = helpers.makeSimpleExtender(ObserveArray);
    eventMixin(ObserveArray.prototype);
    Object.defineProperty(ObserveArray.prototype, 'disconnectedCallback', {
        enumerable: false,
        writable: true,
        configurable: true,
        value: function () {
            this.off();
            this.stopListening();
        }
    });
    module.exports = ObserveArray;
});