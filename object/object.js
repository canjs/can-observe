var canReflect = require("can-reflect");
var canSymbol = require("can-symbol");
var makeObserve = require("../src/-make-observe");
var eventMixin = require("can-event-queue/map/map");
var helpers = require("../src/-helpers");
var makeObject = require("../src/-make-object");
var observableStore = require("../src/-observable-store");
var definitionsSymbol = canSymbol.for("can.typeDefinitions");
var getterHelpers = require("../src/-getter-helpers");
var defineLazyValue = require("can-define-lazy-value");

var computedDefinitionsSymbol = canSymbol.for("can.computedDefinitions");

// Setup proxyKeys to look for observations when doing onKeyValue and offKeyValue
var proxyKeys = helpers.assignEverything({},makeObject.proxyKeys());
getterHelpers.addMemoizedGetterBindings(proxyKeys);

// ## ObserveObject constructor function
// Works by returning the proxy-wrapped instance.
var ObserveObject = function(props) {
    var prototype = Object.getPrototypeOf(this);

    // We need to touch the computed property now ... to make sure it's properly setup.
    var computed = prototype[canSymbol.for("can.computed")];

    if(prototype[computedDefinitionsSymbol] === undefined) {
        prototype[computedDefinitionsSymbol] = getterHelpers.setupComputedProperties(prototype);
    }

    // Define expando properties from `can.defineInstanceProperty`
    var sourceInstance = this;
    var definitions = prototype[definitionsSymbol] || {};
    for (var key in definitions) {
        Object.defineProperty(sourceInstance, key, definitions[key]);
    }
    // Add properties passed to the constructor.
    if (props !== undefined) {
        canReflect.assign(sourceInstance, props);
    }
    // Create a copy of the proxy keys
    var localProxyKeys = Object.create(proxyKeys);

    // Make sure that the .constructor property isn't proxied.  If it was,
    // `this.constructor` would not be the type.
    localProxyKeys.constructor = this.constructor;

    // Wrap the sourceInstance
    var observable = makeObject.observable(sourceInstance, {
        observe: makeObserve.observe,
        proxyKeys: localProxyKeys,
        shouldRecordObservation: getterHelpers.shouldRecordObservationOnAllKeysExceptFunctionsOnProto
    });
    // Add the proxy to the stores.
    observableStore.proxiedObjects.set(sourceInstance, observable);
    observableStore.proxies.add(observable);
    return observable;
};

// this[can.computed] //-> compiled "compute" compilers
// this[can.computed].fullName
defineLazyValue(ObserveObject.prototype,canSymbol.for("can.computed"), function(){
    var computed = {};
    Object.getOwnPropertyNames(this).forEach(function(prop){
        var descriptor = Object.getOwnPropertyDescriptor(this,prop);

        if(descriptor.get !== undefined) {
            defineLazyValue(computed,prop, function(){
                debugger;
                return; //computeObj(this, prop, new Observe())
            })
        }

    });
    return computed;
});

// Adds event mixins
eventMixin(ObserveObject.prototype);

// Adds `defineInstanceKey` and other symbols on the Type.
getterHelpers.addMethodsAndSymbols(ObserveObject);

// Allows this to be extended w/o `class`
ObserveObject.extend = helpers.makeSimpleExtender(ObserveObject);



module.exports = ObserveObject;
