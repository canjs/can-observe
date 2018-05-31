/*can-observe@2.1.0#src/-make-array*/
define([
    'require',
    'exports',
    'module',
    'can-observation-recorder',
    'can-event-queue/map',
    'can-reflect',
    './-make-object',
    './-symbols',
    './-observable-store',
    './-helpers',
    './-computed-helpers'
], function (require, exports, module) {
    var ObservationRecorder = require('can-observation-recorder');
    var mapBindings = require('can-event-queue/map');
    var canReflect = require('can-reflect');
    var makeObject = require('./-make-object');
    var symbols = require('./-symbols');
    var observableStore = require('./-observable-store');
    var helpers = require('./-helpers');
    var computedHelpers = require('./-computed-helpers');
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
                mapBindings.dispatch.call(meta.proxy, {
                    type: 'length',
                    patches: patches
                }, [
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
                mapBindings.dispatch.call(meta.proxy, {
                    type: key,
                    patches: patches,
                    keyChanged: !hadOwn ? key : undefined
                }, [
                    value,
                    old
                ]);
            });
            return true;
        }
    };
    module.exports = makeArray;
});