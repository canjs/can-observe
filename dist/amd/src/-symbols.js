/*can-observe@2.2.0#src/-symbols*/
define([
    'require',
    'exports',
    'module',
    'can-symbol'
], function (require, exports, module) {
    'use strict';
    var canSymbol = require('can-symbol');
    module.exports = {
        metaSymbol: canSymbol.for('can.meta'),
        patchesSymbol: 'can.patches',
        keysSymbol: 'can.keys'
    };
});