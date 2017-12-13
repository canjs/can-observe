/*can-observe@2.0.0-pre.16#src/-make-array*/
define([
    'require',
    'exports',
    'module',
    'can-observation-recorder',
    './-make-object',
    './-symbols',
    'can-util/js/diff-array',
    './-observable-store',
    './-helpers',
    'can-event-queue/map',
    'can-reflect'
], function (require, exports, module) {
    var ObservationRecorder = require('can-observation-recorder');
    var makeObject = require('./-make-object');
    var symbols = require('./-symbols');
    var diffArray = require('can-util/js/diff-array');
    var observableStore = require('./-observable-store');
    var helpers = require('./-helpers');
    var legacyMapBindings = require('can-event-queue/map');
    var canReflect = require('can-reflect');
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
                    legacyMapBindings.dispatch.call(meta.proxy, {
                        type: 'length',
                        patches: patches
                    }, [
                        meta.target.length,
                        old.length
                    ]);
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
    var proxyKeys = helpers.assignEverything(Object.create(null), makeObject.proxyKeys());
    var makeArray = {
        observable: function (object, options) {
            if (options.shouldRecordObservation === undefined) {
                options.shouldRecordObservation = makeObject.shouldRecordObservationOnOwnAndMissingKeys;
            }
            var meta = {
                target: object,
                proxyKeys: options.proxyKeys !== undefined ? options.proxyKeys : Object.create(makeArray.proxyKeys()),
                options: options,
                preventSideEffects: 0
            };
            meta.proxyKeys[symbols.metaSymbol] = meta;
            meta.proxy = new Proxy(object, {
                get: makeObject.get.bind(meta),
                set: makeArray.set.bind(meta),
                ownKeys: makeObject.ownKeys.bind(meta),
                deleteProperty: makeObject.deleteProperty.bind(meta),
                meta: meta
            });
            legacyMapBindings.addHandlers(meta.proxy, meta);
            return meta.proxy;
        },
        proxyKeys: function () {
            return proxyKeys;
        },
        set: function (target, key, value, receiver) {
            if (receiver !== this.proxy) {
                return makeObject.setPrototypeKey(key, value, receiver, this);
            }
            value = makeObject.getValueToSet(key, value, this);
            makeObject.setValueAndOnChange(key, value, this, function (key, value, meta, hadOwn, old) {
                var integerIndex = isIntegerIndex(key);
                var patches = [{
                        key: key,
                        type: hadOwn ? 'set' : 'add',
                        value: value
                    }];
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
                legacyMapBindings.dispatch.call(meta.proxy, {
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