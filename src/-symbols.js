var canSymbol = require("can-symbol");

module.exports = {
    metaSymbol:canSymbol.for("can.meta"),
    patchesSymbol: canSymbol("patches")
};
