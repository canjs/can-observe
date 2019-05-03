/*can-observe@2.2.1#src/-observable-store*/
define(function (require, exports, module) {
    'use strict';
    module.exports = {
        proxiedObjects: new WeakMap(),
        proxies: new WeakSet()
    };
});