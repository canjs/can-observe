/*can-observe@2.0.0-pre.2#src/-observable-store*/
define(function (require, exports, module) {
    module.exports = {
        proxiedObjects: new WeakMap(),
        proxies: new WeakSet()
    };
});