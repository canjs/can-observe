/*can-observe@2.2.1#src/-make-prototype*/
define([
    'require',
    'exports',
    'module',
    './-make-object',
    './-helpers',
    './-symbols',
    'can-event-queue/map',
    'can-reflect',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var makeObject = require('./-make-object');
    var helpers = require('./-helpers');
    var symbols = require('./-symbols');
    var mapBindings = require('can-event-queue/map');
    var canReflect = require('can-reflect');
    var canSymbol = require('can-symbol');
    var isSymbolLike = canReflect.isSymbolLike;
    var proxyMetaSymbol = canSymbol.for('can.proxyMeta');
    function getMetadata(instance, options) {
        if (instance.hasOwnProperty(proxyMetaSymbol)) {
            return instance[proxyMetaSymbol];
        }
        if (options.shouldRecordObservation === undefined) {
            options.shouldRecordObservation = makeObject.shouldRecordObservationOnOwnAndMissingKeys;
        }
        options.proxiedPrototype = true;
        var meta = {
            target: makeObject.observable({}, options),
            proxyKeys: options.proxyKeys !== undefined ? options.proxyKeys : Object.create(makeObject.proxyKeys()),
            computedKeys: Object.create(null),
            options: options,
            preventSideEffects: 0,
            proxy: instance
        };
        helpers.assignNonEnumerable(meta.proxyKeys, symbols.metaSymbol, meta);
        mapBindings.addHandlers(meta.proxy, meta);
        instance[proxyMetaSymbol] = meta;
        return meta;
    }
    var makePrototype = {
        observable: function (proto, options) {
            var protoProxy = new Proxy(proto, {
                set: function (target, key, value, receiver) {
                    if (isSymbolLike(key) || key in target) {
                        return Reflect.set(target, key, value, receiver);
                    }
                    var meta = getMetadata(receiver, options);
                    return makeObject.set.call(meta, target, key, value, receiver);
                },
                get: function (target, key, receiver) {
                    if (key in target) {
                        return Reflect.get(target, key, receiver);
                    }
                    var meta = getMetadata(receiver, options);
                    return makeObject.get.call(meta, target, key, receiver);
                }
            });
            return protoProxy;
        }
    };
    module.exports = makePrototype;
});