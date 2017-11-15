var canReflect = require("can-reflect");
var queues = require("can-queues");
var symbols = require("./-symbols");
var canSymbol = require("can-symbol");
var dispatchInstanceOnPatchesSymbol = canSymbol.for("can.dispatchInstanceOnPatches");

// proxyOnly contains any prototype (i.e. shared) symbols and keys that should be available (gettable)
// from the proxy object, but not from the object under observation.  For example, the onKeyValue and
// offKeyValue symbols below, if applied to the target object, would erroneously present that object
// as observable, when only the Proxy is.
var proxyOnly = Object.create(null);
canReflect.assignSymbols(proxyOnly, {
	"can.onKeyValue": function(key, handler, queue) {
		var handlers = this[symbols.metaSymbol].handlers;
		handlers.add([key, queue || "notify", handler]);
	},
	"can.offKeyValue": function(key, handler, queue) {
		var handlers = this[symbols.metaSymbol].handlers;
		handlers.delete([key, queue || "notify", handler]);
	},
	"can.onPatches": function(handler, queue) {
		var handlers = this[symbols.metaSymbol].handlers;
		handlers.add([symbols.patchesSymbol, queue || "notify", handler]);
	},
	"can.offPatches": function(handler, queue) {
		var handlers = this[symbols.metaSymbol].handlers;
		handlers.delete([symbols.patchesSymbol, queue || "notify", handler]);
	}
});


module.exports = {
    keys: proxyOnly,
    dispatch: function(key, args) {
    	var handlers = this[symbols.metaSymbol].handlers;
    	var keyHandlers = handlers.getNode([key]);
    	if(keyHandlers) {
    		queues.enqueueByQueue(keyHandlers, this, args);
    	}
		if(key === symbols.patchesSymbol){
			var dispatchPatches = this.constructor[dispatchInstanceOnPatchesSymbol];
			if(dispatchPatches) {
				dispatchPatches.call(this.constructor, this, args);
			}
		}
    }
};
