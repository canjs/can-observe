/*can-observe@2.2.0#src/-observable-store*/
define(function (require, exports, module) {
    'use strict';
    module.exports = {
        proxiedObjects: new WeakMap(),
        proxies: new WeakSet()
    };
});