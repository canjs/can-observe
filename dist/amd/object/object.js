/*can-observe@2.2.0#object/object*/
define([
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-symbol',
    '../src/-make-observe',
    'can-event-queue/map',
    'can-event-queue/type',
    '../src/-helpers',
    '../src/-make-object',
    '../src/-observable-store',
    '../src/-computed-helpers',
    '../src/-type-helpers'
], function (require, exports, module) {
    'use strict';
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var makeObserve = require('../src/-make-observe');
    var eventMixin = require('can-event-queue/map');
    var typeEventMixin = require('can-event-queue/type');
    var helpers = require('../src/-helpers');
    var makeObject = require('../src/-make-object');
    var observableStore = require('../src/-observable-store');
    var definitionsSymbol = canSymbol.for('can.typeDefinitions');
    var computedHelpers = require('../src/-computed-helpers');
    var typeHelpers = require('../src/-type-helpers');
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