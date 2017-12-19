/*can-observe@2.0.0-pre.20#src/-make-observe*/
define([
    'require',
    'exports',
    'module',
    'can-reflect',
    './-observable-store',
    './-helpers'
], function (require, exports, module) {
    var canReflect = require('can-reflect');
    var observables = require('./-observable-store');
    var helpers = require('./-helpers');
    var makeObserve = {
        observe: function (value) {
            if (canReflect.isPrimitive(value)) {
                return value;
            }
            var observable = observables.proxiedObjects.get(value);
            if (observable) {
                return observable;
            }
            if (observables.proxies.has(value)) {
                return value;
            }
            if (helpers.isBuiltInButNotArrayOrPlainObject(value)) {
                return value;
            }
            if (typeof value === 'function') {
                observable = makeObserve.function(value);
            } else if (helpers.inheritsFromArray(value)) {
                observable = makeObserve.array(value);
            } else {
                observable = makeObserve.object(value);
            }
            observables.proxiedObjects.set(value, observable);
            observables.proxies.add(observable);
            return observable;
        },
        'object': null,
        'array': null,
        'function': null
    };
    module.exports = makeObserve;
});