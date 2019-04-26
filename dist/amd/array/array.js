/*can-observe@2.2.0#array/array*/
define([
    'require',
    'exports',
    'module',
    'can-symbol',
    '../src/-make-array',
    '../src/-make-observe',
    'can-event-queue/map',
    'can-event-queue/type',
    '../src/-helpers',
    '../src/-observable-store',
    '../src/-computed-helpers',
    '../src/-type-helpers'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    var makeArray = require('../src/-make-array');
    var makeObserve = require('../src/-make-observe');
    var eventMixin = require('can-event-queue/map');
    var typeEventMixin = require('can-event-queue/type');
    var helpers = require('../src/-helpers');
    var observableStore = require('../src/-observable-store');
    var computedHelpers = require('../src/-computed-helpers');
    var typeHelpers = require('../src/-type-helpers');
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