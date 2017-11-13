// return an observe
module.exports = function(options){
    // The interceptors map holds proxy intercept function wrappers for all functions that are ever observed
    //  in an observe Proxy.
    var proxiedMethods = new WeakMap();


    // #### proxyIntercept
    // Generator for interceptors for any generic function that may return objects

    var proxyMethods = {
        get: function(value){
            if(proxiedMethods.has(value)) {
                return proxiedMethods.get(value);
            } else {
                var proxied = proxyMethods.make(value);
                proxiedMethods.set(value, proxied );
                return proxied;
            }
        },
        make: function(fn) {
        	return function() {
        		var ret = fn.apply(this, arguments);
        		if(ret && typeof ret === "object") {
        			ret = options.observe(ret);
        		}
        		return ret;
        	};
        },
        add: function(key, value){
            proxiedMethods.set(key, value);
        }
    };
    return proxyMethods;
};
