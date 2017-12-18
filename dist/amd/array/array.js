/*can-observe@2.0.0-pre.19#array/array*/
define([
    'require',
    'exports',
    'module',
    'can-symbol',
    '../src/-make-array',
    '../src/-make-observe',
    'can-event-queue/map',
    '../src/-helpers',
    '../src/-observable-store',
    '../src/-getter-helpers'
], function (require, exports, module) {
    var canSymbol = require('can-symbol');
    var makeArray = require('../src/-make-array');
    var makeObserve = require('../src/-make-observe');
    var eventMixin = require('can-event-queue/map');
    var helpers = require('../src/-helpers');
    var observableStore = require('../src/-observable-store');
    var getterHelpers = require('../src/-getter-helpers');
    var definitionsSymbol = canSymbol.for('can.typeDefinitions');
    var computedDefinitionsSymbol = canSymbol.for('can.computedDefinitions');
    var proxyKeys = helpers.assignEverything({}, makeArray.proxyKeys());
    getterHelpers.addMemoizedGetterBindings(proxyKeys);
    var ObserveArray;
    if (false) {
    } else {
        var ObserveArray = function (items) {
            var prototype = Object.getPrototypeOf(this);
            if (prototype[computedDefinitionsSymbol] === undefined) {
                prototype[computedDefinitionsSymbol] = getterHelpers.setupComputedProperties(prototype);
            }
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
                shouldRecordObservation: getterHelpers.shouldRecordObservationOnAllKeysExceptFunctionsOnProto
            });
            observableStore.proxiedObjects.set(instance, observable);
            observableStore.proxies.add(observable);
            return observable;
        };
        ObserveArray.prototype = Object.create(Array.prototype);
    }
    eventMixin(ObserveArray.prototype);
    getterHelpers.addMethodsAndSymbols(ObserveArray);
    ObserveArray.extend = helpers.makeSimpleExtender(ObserveArray);
    module.exports = ObserveArray;
});