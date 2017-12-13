/*can-observe@2.0.0-pre.17#object/object*/
define([
    'require',
    'exports',
    'module',
    'can-reflect',
    'can-symbol',
    '../src/-make-observe',
    'can-event-queue/map',
    '../src/-helpers',
    '../src/-make-object',
    '../src/-observable-store',
    '../src/-getter-helpers'
], function (require, exports, module) {
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var makeObserve = require('../src/-make-observe');
    var eventMixin = require('can-event-queue/map');
    var helpers = require('../src/-helpers');
    var makeObject = require('../src/-make-object');
    var observableStore = require('../src/-observable-store');
    var definitionsSymbol = canSymbol.for('can.typeDefinitions');
    var getterHelpers = require('../src/-getter-helpers');
    var computedDefinitionsSymbol = canSymbol.for('can.computedDefinitions');
    var proxyKeys = helpers.assignEverything({}, makeObject.proxyKeys());
    getterHelpers.addMemoizedGetterBindings(proxyKeys);
    var ObserveObject = function (props) {
        var prototype = Object.getPrototypeOf(this);
        if (prototype[computedDefinitionsSymbol] === undefined) {
            prototype[computedDefinitionsSymbol] = getterHelpers.setupComputedProperties(prototype);
        }
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
            shouldRecordObservation: getterHelpers.shouldRecordObservationOnAllKeysExceptFunctionsOnProto
        });
        observableStore.proxiedObjects.set(sourceInstance, observable);
        observableStore.proxies.add(observable);
        return observable;
    };
    eventMixin(ObserveObject.prototype);
    getterHelpers.addMethodsAndSymbols(ObserveObject);
    ObserveObject.extend = helpers.makeSimpleExtender(ObserveObject);
    module.exports = ObserveObject;
});