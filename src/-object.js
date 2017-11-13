var queues = require("can-queues");
var proxied = require("./-proxy-keys");
var symbols = require("./-symbols");
module.exports = function(){
    return {
        enqueueEvents: function(target, key, value, receiver, hadOwn, old, patches){
            proxied.dispatch.call(receiver, key, [value, old]);
        },
        addPatches: function(target, key, value, receiver, hadOwn, old, patches){
            patches.push({key: key, type: hadOwn ? "set" : "add", value: value});
        },
        dispatchEvents: function(target, key, value, receiver, hadOwn, old){
        	queues.batch.start();
            proxied.dispatch.call(receiver, key, [value, old]);
        	proxied.dispatch.call(receiver, symbols.patchesSymbol, [[{key: key, type: hadOwn ? "set" : "add", value: value}]]);
            queues.batch.stop();
        }
    };
};
