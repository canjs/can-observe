/*can-observe@2.0.0-pre.15#src/-symbols*/
define([
    'require',
    'exports',
    'module',
    'can-symbol'
], function (require, exports, module) {
    var canSymbol = require('can-symbol');
    module.exports = {
        metaSymbol: canSymbol.for('can.meta'),
        patchesSymbol: 'can.patches',
        keysSymbol: 'can.keys'
    };
});