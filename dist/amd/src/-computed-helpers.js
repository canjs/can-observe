/*can-observe@2.2.0#src/-computed-helpers*/
define([
    'require',
    'exports',
    'module',
    'can-observation',
    'can-observation-recorder',
    'can-event-queue/map',
    'can-reflect',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var Observation = require('can-observation');
    var ObservationRecorder = require('can-observation-recorder');
    var mapBindings = require('can-event-queue/map');
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