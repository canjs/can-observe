/*can-observe@2.1.2#src/-observable-store*/
define(function (require, exports, module) {
    module.exports = {
        proxiedObjects: new WeakMap(),
        proxies: new WeakSet()
    };
});